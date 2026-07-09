// Triggered by a Supabase Database Webhook on INSERT into `contact_messages`.
// Sends an email notification via Resend so new support/contact messages
// don't go unnoticed while volume is low and there's no dedicated support team yet.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// TODO: cambiar a aceptomascotas@gmail.com (u otra casilla) una vez que
// se verifique un dominio propio en Resend — la cuenta gratuita solo
// permite enviar a la casilla con la que te registraste ahí.
const NOTIFY_TO = "dseiler.dev@gmail.com";
const NOTIFY_FROM = "Acepto Mascotas <onboarding@resend.dev>";

interface ContactMessageRecord {
  name: string;
  email: string;
  subject: string;
  message: string;
  created_at?: string;
}

interface DatabaseWebhookPayload {
  type: "INSERT" | "UPDATE" | "DELETE";
  table: string;
  record: ContactMessageRecord;
}

Deno.serve(async (req) => {
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
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.error("RESEND_API_KEY is not configured");
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const payload: DatabaseWebhookPayload = await req.json();

    if (payload.type !== "INSERT" || payload.table !== "contact_messages") {
      // Nothing to notify for this event, but acknowledge to avoid webhook retries.
      return new Response(JSON.stringify({ skipped: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { name, email, subject, message } = payload.record;

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: NOTIFY_FROM,
        to: [NOTIFY_TO],
        reply_to: email,
        subject: `Nuevo mensaje de contacto: ${subject}`,
        html: `
          <h2>Nuevo mensaje de contacto en Acepto Mascotas</h2>
          <p><strong>Nombre:</strong> ${escapeHtml(name)}</p>
          <p><strong>Email:</strong> ${escapeHtml(email)}</p>
          <p><strong>Asunto:</strong> ${escapeHtml(subject)}</p>
          <p><strong>Mensaje:</strong></p>
          <p>${escapeHtml(message).replace(/\n/g, "<br/>")}</p>
          <hr/>
          <p style="color:#888;font-size:12px;">Podés responder directamente a este email o revisar el mensaje completo en /admin.</p>
        `,
      }),
    });

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      console.error("Resend API error:", errorText);
      return new Response(
        JSON.stringify({ error: "No se pudo enviar la notificación por email" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error processing contact message notification:", error);
    return new Response(
      JSON.stringify({ error: "Error interno del servidor" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Basic HTML escaping to avoid breaking the email markup with user-provided content.
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}