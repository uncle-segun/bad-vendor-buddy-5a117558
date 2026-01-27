-- Fix infinite recursion in RLS policies

-- Drop problematic policies
DROP POLICY IF EXISTS "Public can view approved complaints for public vendors" ON public.complaints;
DROP POLICY IF EXISTS "Users can view vendors they reported" ON public.vendors;

-- Create simpler policy for public complaints (check only complaint status, not vendor)
CREATE POLICY "Public can view approved complaints" 
ON public.complaints 
FOR SELECT 
USING (status = 'approved'::complaint_status);

-- For vendors, users who inserted a complaint can view the vendor via the vendor_id they have
-- Instead of checking complaints table, we rely on the existing policies:
-- 1. "Anyone can view public vendors" (is_public = true)
-- 2. "Moderators can view all vendors" (is_moderator_or_admin())
-- These are sufficient - users can see their vendor_id from their complaints