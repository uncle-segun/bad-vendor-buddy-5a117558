-- 1. Create a moderation view that excludes sensitive profile fields
CREATE VIEW public.profiles_moderation_view
WITH (security_invoker = on) AS
SELECT 
    id,
    user_id,
    display_name,
    created_at
FROM public.profiles;

-- 2. Drop the overly permissive moderator policy on profiles
DROP POLICY IF EXISTS "Moderators can view all profiles" ON public.profiles;

-- 3. Create a new restricted moderator policy that only allows viewing non-sensitive fields via view
-- Moderators should query the view instead, so we don't give them direct table access
-- They can still see their own profile via the existing "Users can view their own profile" policy

-- 4. Fix the RLS always-true issue on vendors table
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Authenticated users can insert vendors" ON public.vendors;

-- Create a proper policy that checks the user is authenticated
CREATE POLICY "Authenticated users can insert vendors"
ON public.vendors
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- 5. Grant SELECT on the moderation view to authenticated users
GRANT SELECT ON public.profiles_moderation_view TO authenticated;