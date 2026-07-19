-- Último ítem pendiente del hallazgo de search_path mutable (ver
-- 20260718180000_lock_down_search_path_and_trigger_functions.sql):
-- generate_short_code también se creó directo en el dashboard de
-- Supabase, sin migración previa en este repo. Firma confirmada por
-- Daniel vía pg_proc: sin argumentos.

ALTER FUNCTION public.generate_short_code() SET search_path = public;
