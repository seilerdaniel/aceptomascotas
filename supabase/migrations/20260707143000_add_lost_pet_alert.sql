-- NOTE: the `pets` table and `get_pet_by_qr_code` function were created
-- directly in the Supabase dashboard and have no prior migration in this
-- repo. This migration only ADDS new columns; it doesn't assume or modify
-- any existing RLS policies. Consider running `supabase db pull` at some
-- point to backfill a baseline migration for `pets` and its function.

ALTER TABLE public.pets
  ADD COLUMN IF NOT EXISTS is_lost BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS lost_since TIMESTAMP WITH TIME ZONE;
