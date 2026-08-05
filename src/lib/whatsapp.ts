import { WHATSAPP } from "@/config";
import { trackEvent } from "@/lib/analytics";
import { getClientIdentifier } from "@/lib/clientIdentifier";
import { supabase } from "@/integrations/supabase/client";

// Central wa.me builder (spec W1/S21): every WhatsApp entry point in the
// app constructs its links here, so the business number lives in exactly
// one place (src/config, W2) and no hardcoded numbers remain in pages.
//
// - phone: raw number as typed by the user; non-digits are stripped.
//   Omit it to use the configured business number. Pass "" for share-style
//   links that must reach any chat (wa.me/?text=...).
// - text: message that becomes the encoded `text` param.
// - utm: optional UTM/ref params appended for attribution.

export interface WhatsAppUtmParams {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
}

export interface BuildWhatsAppLinkOptions {
  phone?: string;
  text: string;
  utm?: WhatsAppUtmParams;
}

export const buildWhatsAppLink = ({ phone, text, utm }: BuildWhatsAppLinkOptions): string => {
  const cleanPhone = (phone ?? WHATSAPP.businessNumber).replace(/\D/g, "");
  const params = new URLSearchParams({ text });
  if (utm) {
    for (const [key, value] of Object.entries(utm)) {
      if (value) params.set(key, value);
    }
  }
  return `https://wa.me/${cleanPhone}?${params.toString()}`;
};

export interface HandleWhatsAppContactOptions {
  phone?: string;
  message: string;
  source: string;
  entityId?: string;
  utm?: WhatsAppUtmParams;
}

// Entry point for every WhatsApp CTA (spec W3/W4): builds the link, fires
// the GA4 event with source + entity id (S26), logs the click
// fire-and-forget (S25 — a logging failure must never block navigation)
// and finally opens the chat.
export const handleWhatsAppContact = ({
  phone,
  message,
  source,
  entityId,
  utm,
}: HandleWhatsAppContactOptions): void => {
  const link = buildWhatsAppLink({ phone, text: message, utm });

  trackEvent("whatsapp_contact_click", {
    source,
    ...(entityId ? { entity_id: entityId } : {}),
  });

  // log_whatsapp_click is not in the generated RPC types until the
  // migration is applied to the remote project (gen:types desync, same as
  // slices 1-2) — narrow the rpc call through a plain promise signature.
  const logClick = supabase.rpc as unknown as (
    fn: string,
    args: Record<string, unknown>
  ) => Promise<unknown>;
  void logClick("log_whatsapp_click", {
    p_identifier: getClientIdentifier(),
    p_source: source,
    p_referrer: typeof window !== "undefined" ? window.location.href : null,
  }).catch(() => {
    // Swallow: the click already happened; logging is best-effort (S25).
  });

  window.open(link, "_blank");
};
