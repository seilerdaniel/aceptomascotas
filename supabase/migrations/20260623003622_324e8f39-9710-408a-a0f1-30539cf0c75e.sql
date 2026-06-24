
-- 1. Remove broad public SELECT policy on properties; restrict to owner + admin
DROP POLICY IF EXISTS "Properties are viewable by everyone" ON public.properties;

DROP POLICY IF EXISTS "Owners can view their own properties" ON public.properties;
CREATE POLICY "Owners can view their own properties"
ON public.properties
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- (Admin SELECT policy already exists.)

-- 2. Recreate the public view as SECURITY DEFINER (bypasses RLS), excluding user_id
--    and masking contact info for anonymous visitors.
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
  created_at,
  updated_at,
  NULL::uuid AS user_id
FROM public.properties
WHERE is_active = true;

GRANT SELECT ON public.properties_public TO anon, authenticated;
