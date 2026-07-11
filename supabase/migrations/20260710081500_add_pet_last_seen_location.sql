-- Last-seen location for lost pets (set optionally when marking a pet lost).
ALTER TABLE public.pets
  ADD COLUMN IF NOT EXISTS lost_latitude DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS lost_longitude DOUBLE PRECISION;

-- Update get_lost_pets to include the last-seen coordinates.
CREATE OR REPLACE FUNCTION public.get_lost_pets()
RETURNS TABLE (
  qr_code TEXT,
  name TEXT,
  species TEXT,
  breed TEXT,
  images TEXT[],
  lost_since TIMESTAMPTZ,
  lost_latitude DOUBLE PRECISION,
  lost_longitude DOUBLE PRECISION
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT qr_code, name, species, breed, images, lost_since, lost_latitude, lost_longitude
  FROM public.pets
  WHERE is_lost = true AND qr_code IS NOT NULL
  ORDER BY lost_since DESC NULLS LAST;
$$;

GRANT EXECUTE ON FUNCTION public.get_lost_pets() TO anon, authenticated;
