-- Denormalize the owner's avatar onto each property, same pattern as
-- owner_is_verified/owner_is_agency, so the contact card in PropertyDetail
-- can show a real photo instead of always showing a generic icon.
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS owner_avatar_url TEXT;

-- Extend the insert-time trigger to also copy the current avatar.
CREATE OR REPLACE FUNCTION public.set_owner_verification_on_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  SELECT
    COALESCE(is_verified, false),
    COALESCE(user_type = 'agencia', false),
    avatar_url
  INTO NEW.owner_is_verified, NEW.owner_is_agency, NEW.owner_avatar_url
  FROM public.profiles WHERE user_id = NEW.user_id;

  NEW.owner_is_verified := COALESCE(NEW.owner_is_verified, false);
  NEW.owner_is_agency := COALESCE(NEW.owner_is_agency, false);
  RETURN NEW;
END;
$$;

-- Extend the profile-update trigger: also re-sync existing listings when
-- the owner changes their avatar (not only when verification changes).
CREATE OR REPLACE FUNCTION public.sync_owner_verification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.is_verified IS DISTINCT FROM OLD.is_verified
     OR NEW.avatar_url IS DISTINCT FROM OLD.avatar_url THEN
    UPDATE public.properties
    SET
      owner_is_verified = NEW.is_verified,
      owner_avatar_url = NEW.avatar_url
    WHERE user_id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$;

-- One-time backfill so existing properties pick up the current avatar
-- of their owner right away, instead of waiting for the next edit.
UPDATE public.properties p
SET owner_avatar_url = prof.avatar_url
FROM public.profiles prof
WHERE prof.user_id = p.user_id
  AND prof.avatar_url IS NOT NULL;

-- Recreate properties_public to expose the new column.
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
