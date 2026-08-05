import { describe, it, expect, vi, beforeEach } from "vitest";
import { buildWhatsAppLink, handleWhatsAppContact } from "@/lib/whatsapp";
import { WHATSAPP } from "@/config";
import { trackEvent } from "@/lib/analytics";
import { getClientIdentifier } from "@/lib/clientIdentifier";
import { supabase } from "@/integrations/supabase/client";

// WhatsApp module coverage (spec S21/S25/S26): the wa.me builder
// normalizes phones, encodes text and appends UTM params (S21);
// handleWhatsAppContact fires GA4 analytics with source + entity id
// (S26) and never lets a logging failure block navigation (S25).

vi.mock("@/lib/analytics", () => ({
  trackEvent: vi.fn(),
}));

vi.mock("@/lib/clientIdentifier", () => ({
  getClientIdentifier: vi.fn(() => "test-identifier"),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: { rpc: vi.fn() },
}));

const mockTrackEvent = vi.mocked(trackEvent);
const mockRpc = vi.mocked(supabase.rpc);

describe("buildWhatsAppLink (S21)", () => {
  it("strips non-digits from the phone", () => {
    const link = buildWhatsAppLink({ phone: "+54 911 5555-5555", text: "Hola!" });
    expect(link).toContain("wa.me/5491155555555");
  });

  it("falls back to the config business number when no phone is given", () => {
    const link = buildWhatsAppLink({ text: "Hola!" });
    expect(link).toContain(`wa.me/${WHATSAPP.businessNumber}`);
  });

  it("encodes the message text", () => {
    const link = buildWhatsAppLink({ phone: "5491131797343", text: "Hola! ¿Está disponible? 🐶" });
    const params = new URL(link).searchParams;
    expect(params.get("text")).toBe("Hola! ¿Está disponible? 🐶");
  });

  it("appends UTM params when provided", () => {
    const link = buildWhatsAppLink({
      phone: "5491131797343",
      text: "Hola",
      utm: { utm_source: "facebook", utm_medium: "cpc", utm_campaign: "verano" },
    });
    const params = new URL(link).searchParams;
    expect(params.get("utm_source")).toBe("facebook");
    expect(params.get("utm_medium")).toBe("cpc");
    expect(params.get("utm_campaign")).toBe("verano");
  });

  it("leaves the number out for share-style links", () => {
    const link = buildWhatsAppLink({ phone: "", text: "Mirá este alquiler" });
    expect(link).toMatch(/^https:\/\/wa\.me\/\?text=/);
  });
});

describe("handleWhatsAppContact (S25/S26)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRpc.mockReturnValue(Promise.resolve());
    window.open = vi.fn();
  });

  it("fires trackEvent with source and entity id and opens the link (S26)", () => {
    handleWhatsAppContact({
      message: "Hola! Me interesa la propiedad",
      source: "property_detail",
      entityId: "prop-1",
    });
    expect(mockTrackEvent).toHaveBeenCalledWith("whatsapp_contact_click", {
      source: "property_detail",
      entity_id: "prop-1",
    });
    expect(window.open).toHaveBeenCalledWith(expect.stringContaining("wa.me/"), "_blank");
  });

  it("logs the click fire-and-forget with identifier, source and referrer", () => {
    handleWhatsAppContact({ message: "Hola", source: "footer" });
    expect(mockRpc).toHaveBeenCalledWith(
      "log_whatsapp_click",
      expect.objectContaining({
        p_identifier: "test-identifier",
        p_source: "footer",
      })
    );
  });

  it("navigates even when the logging RPC rejects (S25)", async () => {
    mockRpc.mockReturnValue(Promise.reject(new Error("db down")));
    handleWhatsAppContact({ message: "Hola", source: "contact_page" });
    expect(window.open).toHaveBeenCalled();
    await Promise.resolve();
  });
});
