-- Fix: Restrict profiles to owner-only access (addresses PUBLIC_DATA_EXPOSURE)
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;

-- Users can only view their own profile
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = user_id);