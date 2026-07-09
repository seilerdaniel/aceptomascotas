-- Add verification flag for agency accounts (set only by admins)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_verified BOOLEAN NOT NULL DEFAULT false;

-- Prevent users from setting their own verification status.
-- Only admins (via has_role) are allowed to change is_verified;
-- for anyone else, the column is silently reset to its previous value.
CREATE OR REPLACE FUNCTION public.prevent_self_verification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.is_verified IS DISTINCT FROM OLD.is_verified
     AND NOT public.has_role(auth.uid(), 'admin') THEN
    NEW.is_verified := OLD.is_verified;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_self_verification ON public.profiles;
CREATE TRIGGER trg_prevent_self_verification
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.prevent_self_verification();

-- Admins need to be able to update profiles (to set is_verified);
-- the "owner can update own profile" policy already exists separately.
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
CREATE POLICY "Admins can update any profile"
ON public.profiles FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- Denormalize verification onto each property row instead of exposing
-- user_id publicly. properties_public deliberately nulls out user_id
-- (see migration 20260623003622) to avoid identity correlation, so the
-- verification badge is carried on the listing itself, kept in sync via
-- triggers below.
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS owner_is_verified BOOLEAN NOT NULL DEFAULT false;

-- Set owner_is_verified automatically whenever a property is created,
-- based on the owner's current verification status at that moment.
CREATE OR REPLACE FUNCTION public.set_owner_verification_on_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.owner_is_verified := COALESCE(
    (SELECT is_verified FROM public.profiles WHERE user_id = NEW.user_id),
    false
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_owner_verification_on_insert ON public.properties;
CREATE TRIGGER trg_set_owner_verification_on_insert
BEFORE INSERT ON public.properties
FOR EACH ROW
EXECUTE FUNCTION public.set_owner_verification_on_insert();

-- Keep all of an agency's existing listings in sync when an admin
-- verifies or un-verifies that agency later on.
CREATE OR REPLACE FUNCTION public.sync_owner_verification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.is_verified IS DISTINCT FROM OLD.is_verified THEN
    UPDATE public.properties
    SET owner_is_verified = NEW.is_verified
    WHERE user_id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_owner_verification ON public.profiles;
CREATE TRIGGER trg_sync_owner_verification
AFTER UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.sync_owner_verification();

-- Recreate properties_public including the new badge column (still no user_id).
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
  NULL::uuid AS user_id
FROM public.properties
WHERE is_active = true;

GRANT SELECT ON public.properties_public TO anon, authenticated;

-- Aggregate-only, privacy-safe stats for the public homepage counter.
-- Returns counts only (no individual rows), bypassing profiles' owner-only
-- RLS the same way has_role() already does for role checks.
CREATE OR REPLACE FUNCTION public.get_platform_stats()
RETURNS TABLE(properties_count INTEGER, searchers_count INTEGER)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    (SELECT count(*)::int FROM public.properties WHERE is_active = true) AS properties_count,
    (SELECT count(*)::int FROM public.profiles WHERE user_type = 'buscador') AS searchers_count;
$$;

GRANT EXECUTE ON FUNCTION public.get_platform_stats() TO anon, authenticated;
