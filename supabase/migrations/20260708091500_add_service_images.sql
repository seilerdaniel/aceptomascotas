-- Add banner (cover) and logo image fields for service listings.
-- Note: pet_services never had image upload wired up before (the publish
-- form always sent images: [] hardcoded), so this also creates the
-- storage bucket that was missing.
ALTER TABLE public.pet_services
  ADD COLUMN IF NOT EXISTS banner_url TEXT,
  ADD COLUMN IF NOT EXISTS logo_url TEXT;

INSERT INTO storage.buckets (id, name, public)
VALUES ('service-images', 'service-images', true)
ON CONFLICT (id) DO NOTHING;

-- Owners can upload/update/delete images under their own folder
-- (folder name = their user_id), same convention as property-images.
DROP POLICY IF EXISTS "Users can upload service images" ON storage.objects;
CREATE POLICY "Users can upload service images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'service-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Users can update their service images" ON storage.objects;
CREATE POLICY "Users can update their service images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'service-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Users can delete their service images" ON storage.objects;
CREATE POLICY "Users can delete their service images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'service-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Service images are publicly viewable" ON storage.objects;
CREATE POLICY "Service images are publicly viewable"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'service-images');
