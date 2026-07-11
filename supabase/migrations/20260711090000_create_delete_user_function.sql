-- The frontend has always called supabase.rpc('delete_user') to let a user
-- delete their own account, but this function was never actually created
-- anywhere (not in a migration, not manually in the dashboard) — so the
-- "Eliminar cuenta" button has been broken for every role since it shipped.
--
-- Note: properties.user_id and pet_services.user_id use ON DELETE SET NULL
-- (not CASCADE), meaning listings would otherwise survive account deletion
-- as ownerless-but-still-active entries. This function deletes them
-- explicitly first so a deleted account doesn't leave live "ghost" listings.
CREATE OR REPLACE FUNCTION public.delete_user()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id UUID := auth.uid();
BEGIN
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Explicit cleanup for tables where user_id is ON DELETE SET NULL,
  -- so listings don't survive the account as ownerless ghost entries.
  DELETE FROM public.properties WHERE user_id = current_user_id;
  DELETE FROM public.pet_services WHERE user_id = current_user_id;

  -- pets has no FK documented in migrations (pre-existing gap), so this
  -- explicit delete is the only guarantee it gets cleaned up either way.
  DELETE FROM public.pets WHERE user_id = current_user_id;

  -- Deleting the auth user cascades: profiles, favorites, user_roles
  -- (all already defined with ON DELETE CASCADE to auth.users).
  DELETE FROM auth.users WHERE id = current_user_id;
END;
$$;

-- Only the authenticated caller can invoke this, and it only ever
-- deletes auth.uid()'s own account (no parameters, no way to target
-- another user's id).
GRANT EXECUTE ON FUNCTION public.delete_user() TO authenticated;
