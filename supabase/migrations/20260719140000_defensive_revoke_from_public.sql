-- Revisión general post-incidente (ver 20260719130000): se encontró
-- que el mismo patrón "REVOKE ... FROM anon, authenticated" (sin
-- incluir PUBLIC) también se usó para contact_messages y
-- property_reports. A diferencia de las funciones (donde Postgres SÍ
-- otorga EXECUTE a PUBLIC por defecto al crearlas), las tablas NO
-- reciben privilegios de PUBLIC por defecto — Supabase otorga los
-- suyos directo a anon/authenticated/service_role, no a PUBLIC — así
-- que en teoría este REVOKE ya alcanzaba.
--
-- Se agrega igual como refuerzo defensivo de bajo costo: si PUBLIC
-- nunca tuvo el privilegio, esto no hace nada; si por algún motivo lo
-- tuviera, esto cierra la misma clase de hueco que ya causó el
-- incidente anterior.

REVOKE INSERT ON public.contact_messages FROM PUBLIC;
REVOKE INSERT ON public.property_reports FROM PUBLIC;
