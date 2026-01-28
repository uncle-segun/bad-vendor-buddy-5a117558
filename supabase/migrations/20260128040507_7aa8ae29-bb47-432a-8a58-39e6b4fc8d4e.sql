-- Fix #1: PUBLIC_DATA_EXPOSURE - Create a secure view for public vendor data that excludes bank_accounts
-- This prevents exposing sensitive financial information to unauthenticated users

CREATE OR REPLACE VIEW public.vendors_public_view AS
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

-- Fix #2: STORAGE_EXPOSURE - Create a function to check if user can access evidence files
-- This ensures only reporters, moderators, or public (for approved complaints) can access files

CREATE OR REPLACE FUNCTION public.can_access_evidence_file(_file_path text)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    _complaint_id uuid;
BEGIN
    -- Extract complaint_id from path (format: complaint_id/filename)
    BEGIN
        _complaint_id := split_part(_file_path, '/', 1)::uuid;
    EXCEPTION WHEN OTHERS THEN
        -- Invalid path format
        RETURN false;
    END;
    
    -- Check if user is moderator/admin (they can access all evidence)
    IF is_moderator_or_admin() THEN
        RETURN true;
    END IF;
    
    -- Check if user is the reporter of this complaint
    IF is_reporter_of_complaint(_complaint_id) THEN
        RETURN true;
    END IF;
    
    -- Check if complaint is approved and vendor is public (public access allowed)
    RETURN EXISTS (
        SELECT 1 FROM complaints c
        JOIN vendors v ON c.vendor_id = v.id
        WHERE c.id = _complaint_id
        AND c.status = 'approved'
        AND v.is_public = true
    );
END;
$$;

-- Update storage policy to use the new access check function
DROP POLICY IF EXISTS "Users can view their own evidence files" ON storage.objects;

CREATE POLICY "Users can view evidence files they have access to"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'evidence'
        AND can_access_evidence_file(name)
    );