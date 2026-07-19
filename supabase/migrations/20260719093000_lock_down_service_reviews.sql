-- Hallazgo del Security Advisor (rls_policy_always_true en
-- service_reviews) + un segundo hueco encontrado revisando el mismo
-- flujo, mismo patrón que ya se cerró para pet_services y properties.
--
-- Ya existe supabase/functions/submit-review/index.ts, que valida todo
-- bien, aplica rate limiting (3 reseñas/24hs), y fuerza is_approved =
-- false — pero usa la SERVICE ROLE KEY, que bypasea RLS por completo.
-- Eso significa que la política "Anyone can create reviews WITH CHECK
-- (true)" no le hace falta a la función para funcionar — es una puerta
-- abierta al lado, que cualquiera puede usar directo con la anon key
-- sin pasar por NINGUNA de esas validaciones, y hasta podría fijar
-- is_approved = true a mano en el insert.
--
-- Además, "Users can update their own reviews" (USING auth.uid() =
-- user_id, sin WITH CHECK) permite que el autor de una reseña se
-- autoapruebe editándola después — mismo tipo de hueco que ya se cerró
-- en pet_services/properties.

-- 1. Revocar INSERT directo: todo insert nuevo pasa por submit-review,
--    que sigue funcionando igual porque usa la service role key (no
--    pasa por RLS).
REVOKE INSERT ON public.service_reviews FROM anon, authenticated;

-- 2. Proteger is_approved en UPDATE: el autor de la reseña puede seguir
--    editando su propio rating/comentario (eso sigue siendo legítimo),
--    pero is_approved queda congelado a su valor anterior salvo que
--    quien ejecuta el UPDATE sea admin.
CREATE OR REPLACE FUNCTION public.protect_review_admin_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    NEW.is_approved := OLD.is_approved;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_review_admin_fields_trigger ON public.service_reviews;
CREATE TRIGGER protect_review_admin_fields_trigger
BEFORE UPDATE ON public.service_reviews
FOR EACH ROW
EXECUTE FUNCTION public.protect_review_admin_fields();
