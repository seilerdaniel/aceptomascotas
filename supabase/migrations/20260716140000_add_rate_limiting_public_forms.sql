-- Rate limiting para formularios públicos (contacto y reporte de
-- propiedades). Hoy cualquiera con la anon key puede insertar sin límite
-- en ambas tablas directo desde el cliente. Esta migración mueve ambos
-- inserts detrás de una función SECURITY DEFINER que aplica un límite por
-- identificador, y revoca el INSERT directo para que esa función sea el
-- único camino de entrada.

-- Registro liviano usado solo para contar envíos recientes por
-- identificador+acción. No es legible ni escribible directamente por el
-- cliente (RLS habilitado, sin policies).
CREATE TABLE public.rate_limit_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  identifier TEXT NOT NULL,
  action TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_rate_limit_events_lookup
  ON public.rate_limit_events (identifier, action, created_at);

ALTER TABLE public.rate_limit_events ENABLE ROW LEVEL SECURITY;
-- Sin policies a propósito: nadie puede leer/escribir esta tabla directo,
-- solo las funciones SECURITY DEFINER de abajo.

-- Limpieza de eventos viejos para que la tabla no crezca sin límite.
-- Se llama de forma oportunista desde check_rate_limit().
CREATE OR REPLACE FUNCTION public.prune_rate_limit_events()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM public.rate_limit_events WHERE created_at < now() - interval '1 day';
$$;

-- Devuelve true y registra el intento si el identificador está por debajo
-- de p_max_attempts dentro de la ventana p_window_minutes para esa acción.
-- Devuelve false (sin registrar) si ya se alcanzó el límite.
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_identifier TEXT,
  p_action TEXT,
  p_max_attempts INT,
  p_window_minutes INT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  recent_count INT;
BEGIN
  PERFORM public.prune_rate_limit_events();

  SELECT count(*) INTO recent_count
  FROM public.rate_limit_events
  WHERE identifier = p_identifier
    AND action = p_action
    AND created_at > now() - (p_window_minutes || ' minutes')::interval;

  IF recent_count >= p_max_attempts THEN
    RETURN false;
  END IF;

  INSERT INTO public.rate_limit_events (identifier, action) VALUES (p_identifier, p_action);
  RETURN true;
END;
$$;

-- ---------- Formulario de contacto ----------
-- Límite: 3 mensajes por hora por identificador.

DROP POLICY IF EXISTS "Anyone can submit contact messages" ON public.contact_messages;
REVOKE INSERT ON public.contact_messages FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.submit_contact_message(
  p_identifier TEXT,
  p_name TEXT,
  p_email TEXT,
  p_subject TEXT,
  p_message TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.check_rate_limit(p_identifier, 'contact_message', 3, 60) THEN
    RAISE EXCEPTION 'rate_limited';
  END IF;

  INSERT INTO public.contact_messages (name, email, subject, message)
  VALUES (p_name, p_email, p_subject, p_message);
END;
$$;

GRANT EXECUTE ON FUNCTION public.submit_contact_message(TEXT, TEXT, TEXT, TEXT, TEXT) TO anon, authenticated;

-- ---------- Reporte de propiedades ----------
-- Límite: 5 reportes por hora por identificador.

DROP POLICY IF EXISTS "Anyone can submit a property report" ON public.property_reports;
REVOKE INSERT ON public.property_reports FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.submit_property_report(
  p_identifier TEXT,
  p_property_id UUID,
  p_reason TEXT,
  p_details TEXT,
  p_reporter_email TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.check_rate_limit(p_identifier, 'property_report', 5, 60) THEN
    RAISE EXCEPTION 'rate_limited';
  END IF;

  INSERT INTO public.property_reports (property_id, reason, details, reporter_email)
  VALUES (p_property_id, p_reason, p_details, p_reporter_email);
END;
$$;

GRANT EXECUTE ON FUNCTION public.submit_property_report(TEXT, UUID, TEXT, TEXT, TEXT) TO anon, authenticated;
