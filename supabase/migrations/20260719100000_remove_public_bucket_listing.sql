-- Hallazgo del Security Advisor (public_bucket_allows_listing) en 5
-- buckets: ad-images, avatars, pet-images, property-images,
-- service-images.
--
-- Los 5 son buckets públicos (public = true) — eso ya alcanza para que
-- cualquiera pueda descargar un archivo por su URL directa
-- (/storage/v1/object/public/{bucket}/{path}), sin necesidad de ninguna
-- policy de SELECT sobre storage.objects. La policy de SELECT que
-- tenía cada uno ("Cualquiera puede ver...", "... publicly viewable/
-- accessible") solo agrega la capacidad de LISTAR el contenido completo
-- del bucket (vía el método .list() del cliente o el endpoint
-- /storage/v1/object/list/{bucket}), algo que ningún lugar del frontend
-- usa hoy (confirmado: cero llamadas a .list() en todo el código).
--
-- Sacar estas policies no afecta que las imágenes se sigan viendo con
-- normalidad en toda la app — solo cierra la posibilidad de enumerar
-- todos los archivos subidos a cada bucket.

DROP POLICY IF EXISTS "Ad images are publicly viewable" ON storage.objects;
DROP POLICY IF EXISTS "Cualquiera puede ver avatares" ON storage.objects;
DROP POLICY IF EXISTS "Cualquiera puede ver imágenes de mascotas" ON storage.objects;
DROP POLICY IF EXISTS "Property images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Service images are publicly viewable" ON storage.objects;
