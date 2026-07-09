const GA_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;

declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}

const UTM_STORAGE_KEY = "acepto_mascotas_utm";
const UTM_PARAMS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"] as const;

export interface UtmParams {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
}

// Captures UTM params from the current URL (if present) and persists them
// in sessionStorage, so later conversion events (publish, contact, signup)
// can still be tagged with the channel that brought the visitor in, even
// if the UTM params were only present on an earlier page in the session.
export const captureUtmParams = (): void => {
  if (typeof window === "undefined") return;

  const searchParams = new URLSearchParams(window.location.search);
  const found: UtmParams = {};
  let hasAny = false;

  UTM_PARAMS.forEach((key) => {
    const value = searchParams.get(key);
    if (value) {
      found[key] = value;
      hasAny = true;
    }
  });

  if (hasAny) {
    sessionStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(found));
  }
};

export const getStoredUtmParams = (): UtmParams => {
  if (typeof window === "undefined") return {};
  try {
    const raw = sessionStorage.getItem(UTM_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

export const initGA = () => {
  if (!GA_ID || typeof window === "undefined") return;

  captureUtmParams();

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    window.dataLayer.push(arguments);
  };
  window.gtag("js", new Date());
  // send_page_view: false avoids double-counting the first load;
  // RouteTracker fires the first page_view on its initial render.
  window.gtag("config", GA_ID, { send_page_view: false });
};

export const trackPageView = (path: string) => {
  if (!GA_ID || typeof window.gtag !== "function") return;
  window.gtag("config", GA_ID, { page_path: path });
};

// Tracks a custom event, automatically attaching any UTM params captured
// earlier in the session so conversions can be attributed to a channel
// (WhatsApp, Facebook groups, email, ZonaProp, etc.) in GA4 reports.
export const trackEvent = (
  action: string,
  params?: Record<string, string | number | boolean>
) => {
  if (typeof window.gtag !== "function") return;
  window.gtag("event", action, { ...getStoredUtmParams(), ...params });
};
