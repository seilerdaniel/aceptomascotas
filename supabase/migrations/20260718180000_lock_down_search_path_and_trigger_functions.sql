-- Hallazgos del Security Advisor de Supabase (18/07), los 2 de menor
-- riesgo del lote: no tocan lógica de negocio ni UI.

-- ============================================================
-- 1. search_path mutable en funciones existentes.
--
-- get_pet_by_qr_code y generate_pet_qr_code se crearon directo en el
-- dashboard de Supabase (no hay migración previa en este repo con su
-- cuerpo completo), así que en vez de CREATE OR REPLACE (que exigiría
-- conocer y repetir su lógica exacta, arriesgando romperla), se usa
-- ALTER FUNCTION para fijar el search_path sin tocar el cuerpo.
--
-- generate_short_code queda pendiente: no se pudo confirmar su firma
-- exacta (qué argumentos recibe) desde este repo. Falta correrlo aparte
-- una vez confirmada la firma.
-- ============================================================

ALTER FUNCTION public.get_pet_by_qr_code(code TEXT) SET search_path = public;
ALTER FUNCTION public.generate_pet_qr_code(pet_id_input UUID) SET search_path = public;

-- ============================================================
-- 2. Funciones que son solo triggers, invocables directo desde la API.
--
-- Estas 6 funciones existen únicamente para dispararse automáticamente
-- por su propio trigger (BEFORE/AFTER INSERT/UPDATE) — ninguna tiene
-- motivo legítimo para ser llamada a mano vía /rest/v1/rpc/. El linter
-- de Supabase las marca porque PostgREST las expone igual que a
-- cualquier función SECURITY DEFINER.
--
-- Revocar EXECUTE de anon/authenticated NO afecta el disparo automático
-- de los triggers (ese mecanismo no pasa por el chequeo de permisos de
-- EXECUTE), solo bloquea que alguien las invoque directo desde afuera.
-- ============================================================

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_owner_verification() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.prevent_self_verification() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_owner_verification_on_insert() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.prune_rate_limit_events() FROM anon, authenticated;
