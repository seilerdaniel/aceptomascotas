import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const NOTIFY_FROM = "Acepto Mascotas <onboarding@resend.dev>";

interface ReportRecord {
  property_id: string;
  reason: string;
  details: string | null;
}

interface DatabaseWebhookPayload {
  type: "INSERT" | "UPDATE" | "DELETE";
  table: string;
  record: ReportRecord;
}

const REASON_LABELS: Record<string, string> = {
  info_falsa: "La información publicada podría ser falsa o engañosa",
  no_pet_friendly: "Se indicó que en realidad no acepta mascotas",
  no_disponible: "Se indicó que la propiedad ya no está disponible",
  contenido_inapropiado: "Contenido inapropiado o spam",
  otro: "Otro motivo",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.error("RESEND_API_KEY is not configured");
      return new Response(JSON.stringify({ error: "Email service not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payload: DatabaseWebhookPayload = await req.json();

    if (payload.type !== "INSERT" || payload.table !== "property_reports") {
      return new Response(JSON.stringify({ skipped: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { property_id, reason, details } = payload.record;

    const { data: property, error: propertyError } = await supabase
      .from("properties")
      .select("title, contact_name, contact_email")
      .eq("id", property_id)
      .maybeSingle();

    if (propertyError || !property?.contact_email) {
      console.error("Could not find property or contact email:", propertyError);
      // Nothing to notify — acknowledge so the webhook doesn't retry forever.
      return new Response(JSON.stringify({ skipped: true, reason: "no contact email" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const reasonLabel = REASON_LABELS[reason] || reason;

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: NOTIFY_FROM,
        to: [property.contact_email],
        subject: `Recibimos un reporte sobre tu publicación en Acepto Mascotas`,
        html: `
          <h2>Hola ${escapeHtml(property.contact_name || "")},</h2>
          <p>Te escribimos para avisarte que tu publicación <strong>"${escapeHtml(property.title)}"</strong> recibió un reporte de un usuario de Acepto Mascotas.</p>
          <p><strong>Motivo:</strong> ${escapeHtml(reasonLabel)}</p>
          ${details ? `<p><strong>Detalle:</strong> ${escapeHtml(details).replace(/\n/g, "<br/>")}</p>` : ""}
          <p>Tu publicación sigue activa mientras tanto — esto es solo un aviso para que revises que todo esté en orden. Si creés que el reporte no tiene fundamento, no hace falta que hagas nada.</p>
          <hr/>
          <p style="color:#888;font-size:12px;">Este es un aviso automático de Acepto Mascotas.</p>
        `,
      }),
    });

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      console.error("Resend API error:", errorText);
      return new Response(JSON.stringify({ error: "No se pudo enviar la notificación" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error processing property report notification:", error);
    return new Response(JSON.stringify({ error: "Error interno del servidor" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
