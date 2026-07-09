CREATE TABLE public.advertisements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  advertiser_name TEXT NOT NULL,
  image_url TEXT NOT NULL,
  link_url TEXT,
  alt_text TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  starts_at TIMESTAMP WITH TIME ZONE,
  ends_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.advertisements ENABLE ROW LEVEL SECURITY;

-- Public can only see ads that are active AND within their date range
-- (or have no date range set at all).
CREATE POLICY "Active ads within date range are publicly viewable"
ON public.advertisements FOR SELECT
TO public
USING (
  is_active = true
  AND (starts_at IS NULL OR starts_at <= now())
  AND (ends_at IS NULL OR ends_at >= now())
);

-- Only admins can manage ads (create/edit/delete) — no self-serve for now.
CREATE POLICY "Admins can manage advertisements"
ON public.advertisements FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_advertisements_active ON public.advertisements(is_active, sort_order);

-- Storage bucket for ad creative images, admin-only write.
INSERT INTO storage.buckets (id, name, public)
VALUES ('ad-images', 'ad-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Admins can upload ad images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'ad-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update ad images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'ad-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete ad images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'ad-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Ad images are publicly viewable"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'ad-images');
