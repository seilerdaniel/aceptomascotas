import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Rate limiting configuration
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_PROPERTIES_PER_WINDOW = 5;

// Storage quota configuration
const STORAGE_QUOTA_BYTES = 50 * 1024 * 1024; // 50MB per user

// In-memory rate limit store (reset on function restart)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(userId: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(userId);

  if (!entry) {
    rateLimitStore.set(userId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true };
  }

  if (now > entry.resetTime) {
    // Reset the window
    rateLimitStore.set(userId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true };
  }

  if (entry.count >= MAX_PROPERTIES_PER_WINDOW) {
    const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
    return { allowed: false, retryAfter };
  }

  entry.count++;
  rateLimitStore.set(userId, entry);
  return { allowed: true };
}

// Validation helpers
function validateString(
  value: unknown,
  fieldName: string,
  minLen: number,
  maxLen: number
): string {
  if (typeof value !== "string") {
    throw new Error(`${fieldName} must be a string`);
  }
  const trimmed = value.trim();
  if (trimmed.length < minLen) {
    throw new Error(`${fieldName} must be at least ${minLen} characters`);
  }
  if (trimmed.length > maxLen) {
    throw new Error(`${fieldName} must be less than ${maxLen} characters`);
  }
  // Strip HTML tags to prevent XSS
  return trimmed.replace(/<[^>]*>/g, "");
}

function validateEmail(value: unknown): string {
  if (typeof value !== "string") {
    throw new Error("Email must be a string");
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(value.trim())) {
    throw new Error("Invalid email format");
  }
  return value.trim().toLowerCase();
}

function validatePhone(value: unknown): string {
  if (typeof value !== "string") {
    throw new Error("Phone must be a string");
  }
  // Allow digits, spaces, dashes, parentheses, and plus sign
  const phoneRegex = /^\+?[\d\s\-()]{6,20}$/;
  if (!phoneRegex.test(value.trim())) {
    throw new Error("Invalid phone format");
  }
  return value.trim();
}

function validatePrice(value: unknown): number {
  const price = Number(value);
  if (isNaN(price) || price <= 0) {
    throw new Error("Price must be a positive number");
  }
  if (price > 100000000) {
    throw new Error("Price exceeds maximum allowed value");
  }
  return Math.floor(price);
}

function validatePropertyType(value: unknown): string {
  const validTypes = ["departamento", "casa", "ph", "loft", "monoambiente"];
  if (typeof value !== "string" || !validTypes.includes(value.toLowerCase())) {
    throw new Error(
      `Property type must be one of: ${validTypes.join(", ")}`
    );
  }
  return value.toLowerCase();
}

function validatePetTypes(value: unknown): string[] {
  const validPets = ["perro", "gato", "aves", "peces", "otros"];
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error("At least one pet type must be selected");
  }
  const normalized = value.map((pet) => {
    if (typeof pet !== "string") {
      throw new Error("Pet type must be a string");
    }
    const lower = pet.toLowerCase();
    // Map 'otras' to 'otros' for database enum compatibility
    const mapped = lower === "otras" ? "otros" : lower;
    if (!validPets.includes(mapped)) {
      throw new Error(`Invalid pet type: ${pet}`);
    }
    return mapped;
  });
  return [...new Set(normalized)]; // Remove duplicates
}

function validateImages(value: unknown): string[] {
  if (!value) return [];
  if (!Array.isArray(value)) {
    throw new Error("Images must be an array");
  }
  if (value.length > 5) {
    throw new Error("Maximum 5 images allowed");
  }
  return value.filter((img) => typeof img === "string" && img.startsWith("http"));
}

// Validate user metadata during signup
function validateSignupMetadata(fullName: unknown): string | null {
  if (!fullName) return null;
  if (typeof fullName !== "string") {
    throw new Error("Full name must be a string");
  }
  const trimmed = fullName.trim().replace(/\s+/g, " ");
  if (trimmed.length < 2) {
    throw new Error("Full name must be at least 2 characters");
  }
  if (trimmed.length > 100) {
    throw new Error("Full name must be less than 100 characters");
  }
  // Only allow letters, spaces, hyphens, apostrophes (supports Spanish characters)
  const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]+$/;
  if (!nameRegex.test(trimmed)) {
    throw new Error("Full name contains invalid characters");
  }
  return trimmed;
}

// Check user's storage usage
async function checkStorageQuota(
  supabase: ReturnType<typeof createClient>,
  userId: string
): Promise<{ allowed: boolean; used: number; remaining: number }> {
  const { data, error } = await supabase.storage
    .from("property-images")
    .list(userId, { limit: 1000 });

  if (error) {
    console.error("Storage list error:", error);
    // Allow if we can't check (fail open for this non-critical check)
    return { allowed: true, used: 0, remaining: STORAGE_QUOTA_BYTES };
  }

  const totalBytes = (data || []).reduce((sum: number, file: { metadata?: { size?: number } }) => {
    return sum + (file.metadata?.size || 0);
  }, 0);

  const remaining = Math.max(STORAGE_QUOTA_BYTES - totalBytes, 0);
  return {
    allowed: remaining > 0,
    used: totalBytes,
    remaining,
  };
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authorization
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client with user's auth token
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check rate limit
    const rateCheck = checkRateLimit(user.id);
    if (!rateCheck.allowed) {
      return new Response(
        JSON.stringify({ 
          error: `Límite de publicaciones alcanzado. Podés publicar ${MAX_PROPERTIES_PER_WINDOW} propiedades por hora. Intentá de nuevo en ${Math.ceil(rateCheck.retryAfter! / 60)} minutos.` 
        }),
        { 
          status: 429, 
          headers: { 
            ...corsHeaders, 
            "Content-Type": "application/json",
            "Retry-After": String(rateCheck.retryAfter)
          } 
        }
      );
    }

    // Parse and validate request body
    const body = await req.json();

    // Validate all fields server-side
    const title = validateString(body.title, "Title", 10, 200);
    const description = body.description
      ? validateString(body.description, "Description", 0, 2000)
      : null;
    const price = validatePrice(body.price);
    const propertyType = validatePropertyType(body.propertyType);
    const location = validateString(body.location, "Location", 3, 200);
    const address = body.address
      ? validateString(body.address, "Address", 0, 300)
      : null;
    const petTypes = validatePetTypes(body.petTypes);
    const contactName = validateString(body.contactName, "Contact name", 2, 100);
    const contactPhone = validatePhone(body.contactPhone);
    const contactEmail = validateEmail(body.contactEmail);
    const images = validateImages(body.images);

    // Insert property into database
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
      .select()
      .single();

    if (insertError) {
      console.error("Insert error:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to create property" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, property }),
      { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid request";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
