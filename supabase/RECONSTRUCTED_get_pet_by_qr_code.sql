-- ⚠️ REFERENCE ONLY — DO NOT put this in supabase/migrations/ or run it blindly.
--
-- This is a RECONSTRUCTION of get_pet_by_qr_code based only on the fields the
-- frontend (PetPublicPage.tsx) currently reads from it. I don't have the real
-- function definition since it was never committed to a migration.
--
-- Before changing anything:
-- 1. Run this in the Supabase SQL editor to see the REAL current definition:
--      SELECT pg_get_functiondef('public.get_pet_by_qr_code'::regproc);
-- 2. Compare it against the reconstruction below.
-- 3. Manually merge in the `is_lost` and `lost_since` fields (marked below)
--    into your REAL function — don't just run this file as-is.
--
-- Once you're confident it's correct, commit the merged version as a proper
-- migration so this table/function finally has version control.

CREATE OR REPLACE FUNCTION public.get_pet_by_qr_code(code TEXT)
RETURNS TABLE (
  pet_name TEXT,
  pet_species TEXT,
  pet_breed TEXT,
  pet_images TEXT[],
  pet_description TEXT,
  owner_phone TEXT,
  owner_has_whatsapp BOOLEAN,
  owner_alternative_phone TEXT,
  is_lost BOOLEAN,          -- NEW
  lost_since TIMESTAMPTZ    -- NEW
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.name,
    p.species,
    p.breed,
    p.images,
    p.description,
    prof.phone,
    prof.has_whatsapp,
    prof.alternative_phone,
    p.is_lost,
    p.lost_since
  FROM public.pets p
  JOIN public.profiles prof ON prof.user_id = p.user_id
  WHERE p.qr_code = code;
$$;
