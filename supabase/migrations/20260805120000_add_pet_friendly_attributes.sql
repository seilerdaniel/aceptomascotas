-- Pet-friendly attributes for property listings (spec F2): monthly per-pet
-- fee, maximum pets allowed, pet size and amenities. Columns are nullable or
-- defaulted so existing rows remain valid without them (spec S8).
--
-- ORDER MATTERS (spec S5 regression guard): get_agency_properties returns
-- SETOF properties_public, so it MUST be dropped BEFORE the view and
-- recreated AFTER it — otherwise the view recreation fails.

-- 1) Pet size enum.
CREATE TYPE public.pet_size AS ENUM ('pequeno', 'mediano', 'grande');

-- 2) New columns on properties (existing rows unaffected).
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS pet_fee NUMERIC CHECK (pet_fee >= 0),
  ADD COLUMN IF NOT EXISTS max_pets INT CHECK (max_pets >= 0),
  ADD COLUMN IF NOT EXISTS pet_size public.pet_size,
  ADD COLUMN IF NOT EXISTS amenities TEXT[] NOT NULL DEFAULT '{}';

-- 3) Recreate properties_public exposing the new columns.
DROP FUNCTION IF EXISTS public.get_agency_properties(UUID);
DROP VIEW IF EXISTS public.properties_public;

-- security_invoker = off is INTENTIONAL: public reads must bypass the
-- table's owner-only RLS (see 20260719120000 for the full rationale).
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
  pet_fee,
  max_pets,
  pet_size,
  amenities,
  images,
  contact_name,
  CASE WHEN auth.uid() IS NOT NULL THEN contact_phone ELSE NULL END AS contact_phone,
  CASE WHEN auth.uid() IS NOT NULL THEN contact_email ELSE NULL END AS contact_email,
  is_active,
  owner_is_verified,
  owner_avatar_url,
  property_is_verified,
  latitude,
  longitude,
  created_at,
  updated_at,
  NULL::uuid AS user_id,
  CASE WHEN owner_is_agency THEN user_id ELSE NULL END AS agency_id
FROM public.properties
WHERE is_active = true;

-- 4) Re-apply SELECT grants.
GRANT SELECT ON public.properties_public TO anon, authenticated;

-- 5) Recreate the agency storefront function and re-grant execution.
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
