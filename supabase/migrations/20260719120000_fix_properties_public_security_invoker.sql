-- CRÍTICO: properties_public quedó con security_invoker=on, probablemente
-- por haber aplicado la "corrección" que sugiere el linter de Supabase
-- para el warning "Security Definer View" (nivel ERROR en el Security
-- Advisor). Ese warning es un FALSO POSITIVO en este caso puntual — ya
-- se había documentado en Notion que NO hay que tocarlo.
--
-- security_invoker=off es INTENCIONAL: la policy "Properties are viewable
-- by everyone" sobre la tabla real properties se eliminó a propósito en
-- la migración 20260623003622, para forzar que la única vía de lectura
-- pública sea esta vista. Con security_invoker=on, la vista pasa a
-- respetar el RLS de quien pregunta (anon/Buscador) en vez de saltearlo
-- como está diseñado — y como anon no tiene ninguna policy de SELECT
-- directa sobre properties, el resultado es una lista vacía para
-- cualquier usuario sin sesión o sin ser el dueño. Confirmado en
-- producción: Propietario y Admin veían las propiedades (tienen sus
-- propias policies de SELECT sobre la tabla real), pero Buscador y
-- usuarios sin registrar veían la búsqueda completamente vacía.

ALTER VIEW public.properties_public SET (security_invoker = off);

-- Reafirmar el GRANT por las dudas (no debería hacer falta, pero es
-- barato confirmarlo dentro de la misma migración).
GRANT SELECT ON public.properties_public TO anon, authenticated;
