-- Location picker for property listings.
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;

-- Recreate properties_public to include the new coordinate columns
-- (coordinates are approximate/voluntary and not sensitive like contact
-- info, so they're exposed the same way for everyone, logged in or not).
DROP VIEW IF EXISTS public.properties_public;

CREATE VIEW public.properties_public
WITH (security_invoker = off) AS
SELECT
  id,
  title,
  description,
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
