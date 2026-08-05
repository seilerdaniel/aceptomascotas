-- Registro de clics en enlaces de WhatsApp (W3/S24/S25). Mismo patrón que
-- rate_limit_events: RLS habilitado sin policies — la tabla solo la escribe
-- log_whatsapp_click (SECURITY DEFINER). El rate limit reutiliza
-- check_rate_limit() y el fallo de logging nunca bloquea la navegación.

-- 1. Tabla whatsapp_clicks
CREATE TABLE public.whatsapp_clicks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  source TEXT NOT NULL,
  property_id UUID REFERENCES public.properties(id),
  service_id UUID REFERENCES public.pet_services(id),
  referrer TEXT,
  identifier TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Índices: consultas por fuente (reportes) y limpieza/orden por fecha
CREATE INDEX idx_whatsapp_clicks_source
  ON public.whatsapp_clicks (source);
CREATE INDEX idx_whatsapp_clicks_created_at
  ON public.whatsapp_clicks (created_at);

-- 3. RLS habilitado, sin policies a propósito: solo log_whatsapp_click
-- (SECURITY DEFINER) puede escribir; el cliente no lee ni escribe directo.
ALTER TABLE public.whatsapp_clicks ENABLE ROW LEVEL SECURITY;

-- 4. Registro best-effort con rate limit (10 clics / 60 min por
-- identificador). Si el límite está activo, no-op silencioso: el usuario ya
-- navegó al chat, el log es secundario (S25).
CREATE OR REPLACE FUNCTION public.log_whatsapp_click(
  p_identifier TEXT,
  p_source TEXT,
  p_referrer TEXT DEFAULT NULL,
  p_property_id UUID DEFAULT NULL,
  p_service_id UUID DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.check_rate_limit(p_identifier, 'whatsapp_click', 10, 60) THEN
    RETURN;
  END IF;

  INSERT INTO public.whatsapp_clicks (source, property_id, service_id, referrer, identifier)
  VALUES (p_source, p_property_id, p_service_id, p_referrer, p_identifier);
END;
$$;

GRANT EXECUTE ON FUNCTION public.log_whatsapp_click(TEXT, TEXT, TEXT, UUID, UUID) TO anon, authenticated;
