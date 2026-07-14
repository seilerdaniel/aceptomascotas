ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS requirements TEXT;

DROP FUNCTION IF EXISTS public.get_agency_properties(UUID);
DROP VIEW IF EXISTS public.properties_public;

CREATE VIEW public.properties_public
WITH (security_invoker = off) AS
SELECT
  id,
  title,
  description,
  requirements,
  location,
  address,
  price,
  property_type,
  pet_types,
  images,
  contact_name,
  CASE WHEN auth.uid() IS NOT NULL THEN contact_phone ELSE NULL END AS contact_phone,
  CASE WHEN auth.uid() IS NOT NULL THEN contact_email ELSE NULL END AS contact_email,
  is_active,
  owner_is_verified,
  latitude,
  longitude,
  created_at,
  updated_at,
  NULL::uuid AS user_id,
  CASE WHEN owner_is_agency THEN user_id ELSE NULL END AS agency_id
FROM public.properties
WHERE is_active = true;

GRANT SELECT ON public.properties_public TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_agency_properties(agency_user_id UUID)
RETURNS SETOF public.properties_public
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.properties_public
  WHERE agency_id = agency_user_id
  ORDER BY created_at DESC;
$$;

GRANT EXECUTE ON FUNCTION public.get_agency_properties(UUID) TO anon, authenticated;
