-- Reseñas de propiedades con el mismo pipeline endurecido que ya tienen
-- las reseñas de servicios (R1/R2):
--   * INSERT directo revocado: todo insert pasa por submit-review, que
--     fuerza is_approved = false y aplica rate limit + duplicados (S11/S12).
--   * is_approved congelado en UPDATE salvo que quien ejecuta sea admin:
--     se reutiliza protect_review_admin_fields() (table-agnostic) con un
--     SEGUNDO trigger; el trigger de service_reviews no se toca (S15).
--   * property_ratings solo cuenta reseñas aprobadas (S10).
--   * Bucket review-images con carpetas por usuario (R3/S17), mismo patrón
--     que property-images.

-- 1. Tabla property_reviews
CREATE TABLE public.property_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL CHECK (char_length(user_name) BETWEEN 1 AND 100),
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT CHECK (char_length(comment) <= 500),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_approved BOOLEAN NOT NULL DEFAULT false,
  pet_dimensions JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.property_reviews ENABLE ROW LEVEL SECURITY;

-- 2. Índices: feed público de una propiedad + reseñas del propio usuario
CREATE INDEX idx_property_reviews_property_approved_created
  ON public.property_reviews (property_id, is_approved, created_at DESC);
CREATE INDEX idx_property_reviews_user_created
  ON public.property_reviews (user_id, created_at);

-- 3. Políticas RLS
-- SELECT: aprobadas para todos; admin puede ver todo; autor puede ver la suya
-- (aunque todavía no esté aprobada).
CREATE POLICY "Approved property reviews are viewable by everyone"
ON public.property_reviews
FOR SELECT
USING (is_approved = true OR public.has_role(auth.uid(), 'admin') OR auth.uid() = user_id);

-- UPDATE: el autor puede editar su reseña (rating/comentario), pero el
-- trigger protect_review_admin_fields congela is_approved salvo admin (S15).
CREATE POLICY "Users can update their own property reviews"
ON public.property_reviews
FOR UPDATE
USING (auth.uid() = user_id);

-- Admin puede actualizar cualquier reseña (aprobación/despublicación) — pasa
-- el trigger porque has_role('admin') es true.
CREATE POLICY "Admins can update all property reviews"
ON public.property_reviews
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- DELETE: solo admin (S20).
CREATE POLICY "Admins can delete all property reviews"
ON public.property_reviews
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- 4. Revocar INSERT directo de anon/authenticated: todo insert nuevo pasa
-- por submit-review (service role), que valida, rate-limita y fuerza
-- is_approved = false (S11/S12).
REVOKE INSERT ON public.property_reviews FROM anon, authenticated;

-- 5. Congelar is_approved en UPDATE: reutiliza protect_review_admin_fields()
-- (ya existe, table-agnostic). Trigger nuevo para property_reviews; el de
-- service_reviews queda intacto.
DROP TRIGGER IF EXISTS protect_property_review_admin_fields_trigger ON public.property_reviews;
CREATE TRIGGER protect_property_review_admin_fields_trigger
BEFORE UPDATE ON public.property_reviews
FOR EACH ROW
EXECUTE FUNCTION public.protect_review_admin_fields();

-- 6. Vista property_ratings: solo reseñas aprobadas (S10). security_invoker
-- apagado (mismo criterio que properties_public): la vista es agregate-only,
-- sin PII, y así no hereda la RLS de property_reviews.
CREATE OR REPLACE VIEW public.property_ratings
WITH (security_invoker = off)
AS
SELECT
  property_id,
  COUNT(*) AS review_count,
  ROUND(AVG(rating)::numeric, 1) AS average_rating
FROM public.property_reviews
WHERE is_approved = true
GROUP BY property_id;

GRANT SELECT ON public.property_ratings TO anon, authenticated;

-- 7. Bucket review-images con carpetas por usuario (R3/S17), mismo patrón
-- que property-images: cada usuario escribe en su carpeta, todos leen.
INSERT INTO storage.buckets (id, name, public)
VALUES ('review-images', 'review-images', true);

CREATE POLICY "Users can upload review images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'review-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update their review images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'review-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their review images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'review-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Review images are publicly accessible"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'review-images');
