-- Corrige un error real de la migración 20260718180000: PostgreSQL le
-- otorga EXECUTE a PUBLIC por defecto en toda función nueva. Esa
-- migración solo hacía "REVOKE EXECUTE ... FROM anon, authenticated",
-- pero como PUBLIC sigue teniendo el permiso (y anon/authenticated son
-- miembros implícitos de PUBLIC), el REVOKE no tenía ningún efecto real
-- — confirmado con has_function_privilege('anon', ..., 'execute')
-- devolviendo true en las 6 funciones después de aplicar esa migración.
--
-- Esto es un patrón general de Postgres a tener en cuenta: revocar de
-- un rol específico nunca alcanza si PUBLIC todavía tiene el grant.

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.sync_owner_verification() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.prevent_self_verification() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.set_owner_verification_on_insert() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.prune_rate_limit_events() FROM PUBLIC;
