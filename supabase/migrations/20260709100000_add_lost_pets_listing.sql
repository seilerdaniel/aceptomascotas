-- Public, privacy-safe RPC listing currently lost pets for the community
-- alert page. Exposes only pet-identifying fields (no owner contact info —
-- that stays gated behind the individual /mascota/:qr_code page, same as
-- before). Only pets with a qr_code are included, since that's what the
-- listing links out to.
CREATE OR REPLACE FUNCTION public.get_lost_pets()
RETURNS TABLE (
  qr_code TEXT,
  name TEXT,
  species TEXT,
  breed TEXT,
  images TEXT[],
  lost_since TIMESTAMPTZ
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT qr_code, name, species, breed, images, lost_since
  FROM public.pets
  WHERE is_lost = true AND qr_code IS NOT NULL
  ORDER BY lost_since DESC NULLS LAST;
$$;

GRANT EXECUTE ON FUNCTION public.get_lost_pets() TO anon, authenticated;
