-- Agency storefront: banner image for the profile
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS banner_url TEXT;

-- Denormalize "is this property owned by an agency account" onto properties,
-- the same way owner_is_verified was denormalized (see migration
-- 20260707140512). This lets us safely reveal the OWNER'S user_id in
-- properties_public ONLY when the owner is a business (agency) account
-- that wants to be discoverable — never for individual propietario/buscador
-- accounts, whose user_id stays NULL as before.
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS owner_is_agency BOOLEAN NOT NULL DEFAULT false;

-- Extend the existing BEFORE INSERT trigger function to also set
-- owner_is_agency at creation time (user_type doesn't change after
-- signup in this app, so no UPDATE-sync trigger is needed for this field).
CREATE OR REPLACE FUNCTION public.set_owner_verification_on_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  SELECT
    COALESCE(is_verified, false),
    COALESCE(user_type = 'agencia', false)
  INTO NEW.owner_is_verified, NEW.owner_is_agency
  FROM public.profiles WHERE user_id = NEW.user_id;

  NEW.owner_is_verified := COALESCE(NEW.owner_is_verified, false);
  NEW.owner_is_agency := COALESCE(NEW.owner_is_agency, false);
  RETURN NEW;
END;
$$;

-- Recreate properties_public with the conditional agency_id column.
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
  created_at,
  updated_at,
  NULL::uuid AS user_id,
  -- Only exposed when the owner is an agency (business account seeking
  -- visibility). Individual owners' identity stays fully protected.
  CASE WHEN owner_is_agency THEN user_id ELSE NULL END AS agency_id
FROM public.properties
WHERE is_active = true;

GRANT SELECT ON public.properties_public TO anon, authenticated;

-- Public, privacy-safe RPC for an agency's storefront header.
-- Returns nothing if the given user_id isn't an agency account.
CREATE OR REPLACE FUNCTION public.get_agency_public_profile(agency_user_id UUID)
RETURNS TABLE (
  full_name TEXT,
  avatar_url TEXT,
  banner_url TEXT,
  is_verified BOOLEAN
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT full_name, avatar_url, banner_url, is_verified
  FROM public.profiles
  WHERE user_id = agency_user_id AND user_type = 'agencia';
$$;

GRANT EXECUTE ON FUNCTION public.get_agency_public_profile(UUID) TO anon, authenticated;

-- Public, privacy-safe RPC for an agency's active listings.
-- Reuses properties_public (same masking rules for contact info) filtered
-- to the given agency's already-exposed agency_id column.
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
