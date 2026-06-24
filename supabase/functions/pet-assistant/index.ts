import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `Sos el asistente virtual de Acepto Mascotas, una plataforma argentina que conecta familias con mascotas con alquileres pet-friendly.

Tu rol es ayudar a los usuarios con:
1. Información sobre cómo usar la plataforma (buscar alquileres, publicar propiedades, servicios)
2. Consejos sobre cuidado de mascotas y mudanzas con animales
3. Información sobre derechos de inquilinos con mascotas en Argentina
4. Recomendaciones generales sobre convivencia pet-friendly

Características de la plataforma:
- Búsqueda de alquileres que aceptan mascotas
- Publicación gratuita de propiedades
- Sección de servicios pet-friendly (veterinarias, peluquerías, paseadores)
- Tienda con productos de la marca
- No cobramos comisiones

Reglas:
- Respondé siempre en español argentino, de forma amigable y cercana
- Usá emojis relacionados con mascotas ocasionalmente 🐾🐕🐈
- Sé conciso pero útil
- Si no sabés algo, sugerí contactar a aceptomascotas@gmail.com
- No inventes información sobre propiedades específicas
- Enfocate en ser útil y empático con las familias que buscan hogar con sus mascotas`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limits exceeded, please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "AI gateway error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Pet assistant error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
