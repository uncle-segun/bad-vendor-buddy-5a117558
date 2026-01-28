-- Fix the Security Definer View warning by recreating with SECURITY INVOKER (implicit default)
-- The view already filters by is_public = true, so SECURITY INVOKER is safe here

DROP VIEW IF EXISTS public.vendors_public_view;

CREATE VIEW public.vendors_public_view 
WITH (security_invoker = true)
AS
SELECT 
    id, 
    name, 
    phone_numbers, 
    email_addresses, 
    social_handles, 
    highest_severity, 
    verified_complaint_count,
    is_public, 
    first_complaint_date, 
    created_at, 
    updated_at
FROM public.vendors
WHERE is_public = true;

-- Grant access to the view for both anonymous and authenticated users
GRANT SELECT ON public.vendors_public_view TO anon, authenticated;