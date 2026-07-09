import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Bulk import is only meaningful for agencies, and gets its own (separate)
// rate limit from the single-property create-property function: fewer
// imports allowed, but each import can carry many rows.
const MAX_ROWS_PER_IMPORT = 50;
const MAX_IMPORTS_PER_WINDOW = 3;
const RATE_LIMIT_WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours

const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(userId: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(userId);

  if (!entry || now > entry.resetTime) {
    rateLimitStore.set(userId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true };
  }

  if (entry.count >= MAX_IMPORTS_PER_WINDOW) {
    return { allowed: false, retryAfter: Math.ceil((entry.resetTime - now) / 1000) };
  }

  entry.count++;
  rateLimitStore.set(userId, entry);
  return { allowed: true };
}

function validateString(value: unknown, fieldName: string, minLen: number, maxLen: number): string {
  if (typeof value !== "string") throw new Error(`${fieldName} debe ser texto`);
  const trimmed = value.trim();
  if (trimmed.length < minLen) throw new Error(`${fieldName} debe tener al menos ${minLen} caracteres`);
  if (trimmed.length > maxLen) throw new Error(`${fieldName} debe tener menos de ${maxLen} caracteres`);
  return trimmed.replace(/<[^>]*>/g, "");
}

function validateEmail(value: unknown): string {
  if (typeof value !== "string") throw new Error("Email inválido");
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(value.trim())) throw new Error("Formato de email inválido");
  return value.trim().toLowerCase();
}

function validatePhone(value: unknown): string {
  if (typeof value !== "string") throw new Error("Teléfono inválido");
  const phoneRegex = /^\+?[\d\s\-()]{6,20}$/;
  if (!phoneRegex.test(value.trim())) throw new Error("Formato de teléfono inválido");
  return value.trim();
}

function validatePrice(value: unknown): number {
  const price = Number(value);
  if (isNaN(price) || price <= 0) throw new Error("El precio debe ser un número positivo");
  if (price > 100000000) throw new Error("El precio excede el máximo permitido");
  return Math.floor(price);
}

function validatePropertyType(value: unknown): string {
  const validTypes = ["departamento", "casa", "ph", "loft", "monoambiente"];
  if (typeof value !== "string" || !validTypes.includes(value.toLowerCase())) {
    throw new Error(`Tipo de propiedad inválido. Debe ser uno de: ${validTypes.join(", ")}`);
  }
  return value.toLowerCase();
}

function validatePetTypes(value: string): string[] {
  const validPets = ["perro", "gato", "aves", "peces", "otros"];
  const parts = value.split(";").map((p) => p.trim().toLowerCase()).filter(Boolean);
  if (parts.length === 0) throw new Error("Debe indicar al menos un tipo de mascota");
  const normalized = parts.map((pet) => {
    const mapped = pet === "otras" ? "otros" : pet;
    if (!validPets.includes(mapped)) throw new Error(`Tipo de mascota inválido: ${pet}`);
    return mapped;
  });
  return [...new Set(normalized)];
}

function validateImages(value: string | undefined): string[] {
  if (!value) return [];
  const urls = value.split(";").map((u) => u.trim()).filter(Boolean);
  if (urls.length > 5) throw new Error("Máximo 5 imágenes por propiedad");
  return urls.filter((u) => u.startsWith("http"));
}

interface RawRow {
  title: string;
  description?: string;
  price: string;
  propertyType: string;
  location: string;
  address?: string;
  petTypes: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  images?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Only agencies can use bulk import
    const { data: profile } = await supabase
      .from("profiles")
      .select("user_type")
      .eq("user_id", user.id)
      .maybeSingle();

    if (profile?.user_type !== "agencia") {
      return new Response(
        JSON.stringify({ error: "El import masivo está disponible solo para cuentas de agencia" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const rateCheck = checkRateLimit(user.id);
    if (!rateCheck.allowed) {
      return new Response(
        JSON.stringify({
          error: `Alcanzaste el límite de ${MAX_IMPORTS_PER_WINDOW} importaciones por día. Intentá de nuevo más tarde.`,
        }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const rows: RawRow[] = body.rows;

    if (!Array.isArray(rows) || rows.length === 0) {
      return new Response(JSON.stringify({ error: "No se recibieron filas para importar" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (rows.length > MAX_ROWS_PER_IMPORT) {
      return new Response(
        JSON.stringify({ error: `Máximo ${MAX_ROWS_PER_IMPORT} propiedades por importación` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const results: { row: number; success: boolean; error?: string; propertyId?: string }[] = [];

    for (let i = 0; i < rows.length; i++) {
      const raw = rows[i];
      try {
        const title = validateString(raw.title, "Título", 10, 200);
        const description = raw.description ? validateString(raw.description, "Descripción", 0, 2000) : null;
        const price = validatePrice(raw.price);
        const propertyType = validatePropertyType(raw.propertyType);
        const location = validateString(raw.location, "Ubicación", 3, 200);
        const address = raw.address ? validateString(raw.address, "Dirección", 0, 300) : null;
        const petTypes = validatePetTypes(raw.petTypes);
        const contactName = validateString(raw.contactName, "Nombre de contacto", 2, 100);
        const contactPhone = validatePhone(raw.contactPhone);
        const contactEmail = validateEmail(raw.contactEmail);
        const images = validateImages(raw.images);

        const { data: property, error: insertError } = await supabase
          .from("properties")
          .insert({
            title,
            description,
            price,
            property_type: propertyType,
            location,
            address,
            pet_types: petTypes,
            contact_name: contactName,
            contact_phone: contactPhone,
            contact_email: contactEmail,
            user_id: user.id,
            is_active: true,
            images,
          })
          .select("id")
          .single();

        if (insertError) throw new Error(insertError.message);

        results.push({ row: i + 1, success: true, propertyId: property.id });
      } catch (rowError) {
        results.push({
          row: i + 1,
          success: false,
          error: rowError instanceof Error ? rowError.message : "Error desconocido",
        });
      }
    }

    const successCount = results.filter((r) => r.success).length;

    return new Response(
      JSON.stringify({ success: true, imported: successCount, total: rows.length, results }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid request";
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
