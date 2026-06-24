import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Rate limiting: max 3 reviews per day per IP/user combination
const RATE_LIMIT_REVIEWS = 3;
const RATE_LIMIT_WINDOW_HOURS = 24;

interface ReviewPayload {
  service_id: string;
  user_name: string;
  rating: number;
  comment?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Create admin client for rate limiting checks
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Get user if authenticated
    const authHeader = req.headers.get("authorization");
    let userId: string | null = null;
    
    if (authHeader) {
      const userClient = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { authorization: authHeader } },
      });
      const { data: { user } } = await userClient.auth.getUser();
      userId = user?.id || null;
    }

    // Parse request body
    const body: ReviewPayload = await req.json();

    // Validate required fields
    if (!body.service_id || typeof body.service_id !== "string") {
      return new Response(
        JSON.stringify({ error: "service_id es requerido" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!body.user_name || typeof body.user_name !== "string") {
      return new Response(
        JSON.stringify({ error: "user_name es requerido" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!body.rating || typeof body.rating !== "number" || body.rating < 1 || body.rating > 5) {
      return new Response(
        JSON.stringify({ error: "rating debe ser un número entre 1 y 5" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate input lengths and format
    const userName = body.user_name.trim().slice(0, 100);
    const comment = body.comment?.trim().slice(0, 500) || null;

    // Validate user_name format (alphanumeric, spaces, and common chars)
    if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s\-\.]+$/.test(userName)) {
      return new Response(
        JSON.stringify({ error: "El nombre contiene caracteres inválidos" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify service exists
    const { data: service, error: serviceError } = await supabaseAdmin
      .from("pet_services")
      .select("id")
      .eq("id", body.service_id)
      .eq("is_active", true)
      .eq("is_approved", true)
      .maybeSingle();

    if (serviceError || !service) {
      return new Response(
        JSON.stringify({ error: "Servicio no encontrado" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Rate limiting check
    const rateLimitDate = new Date();
    rateLimitDate.setHours(rateLimitDate.getHours() - RATE_LIMIT_WINDOW_HOURS);

    // For authenticated users, check by user_id
    if (userId) {
      // Check if user already reviewed this service
      const { data: existingReview } = await supabaseAdmin
        .from("service_reviews")
        .select("id")
        .eq("service_id", body.service_id)
        .eq("user_id", userId)
        .maybeSingle();

      if (existingReview) {
        return new Response(
          JSON.stringify({ error: "Ya enviaste una reseña para este servicio" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check rate limit for authenticated user
      const { count: userReviewCount } = await supabaseAdmin
        .from("service_reviews")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .gte("created_at", rateLimitDate.toISOString());

      if (userReviewCount && userReviewCount >= RATE_LIMIT_REVIEWS) {
        return new Response(
          JSON.stringify({ 
            error: `Has alcanzado el límite de ${RATE_LIMIT_REVIEWS} reseñas en las últimas ${RATE_LIMIT_WINDOW_HOURS} horas` 
          }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } else {
      // For anonymous users, use user_name + service_id as a simple check
      // This prevents the same name from reviewing the same service multiple times
      const { data: existingAnonymousReview } = await supabaseAdmin
        .from("service_reviews")
        .select("id")
        .eq("service_id", body.service_id)
        .eq("user_name", userName)
        .is("user_id", null)
        .gte("created_at", rateLimitDate.toISOString())
        .maybeSingle();

      if (existingAnonymousReview) {
        return new Response(
          JSON.stringify({ error: "Ya existe una reseña reciente con este nombre para este servicio" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Insert review with is_approved = false (requires moderation)
    const { data: review, error: insertError } = await supabaseAdmin
      .from("service_reviews")
      .insert({
        service_id: body.service_id,
        user_name: userName,
        rating: body.rating,
        comment: comment,
        user_id: userId,
        is_approved: false, // Require moderation
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error inserting review:", insertError);
      return new Response(
        JSON.stringify({ error: "No se pudo crear la reseña" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Tu reseña fue enviada y será revisada antes de publicarse",
        review 
      }),
      { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error processing review:", error);
    return new Response(
      JSON.stringify({ error: "Error interno del servidor" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});