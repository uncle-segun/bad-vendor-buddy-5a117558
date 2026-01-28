-- Fix #1: INPUT_VALIDATION - Add server-side text length constraints
-- This prevents malicious users from bypassing client-side validation

-- Vendor constraints
ALTER TABLE vendors 
  ADD CONSTRAINT vendors_name_length CHECK (length(name) BETWEEN 2 AND 100);

-- Complaint constraints  
ALTER TABLE complaints
  ADD CONSTRAINT complaints_description_length CHECK (length(description) BETWEEN 10 AND 5000),
  ADD CONSTRAINT complaints_current_status_length CHECK (current_status IS NULL OR length(current_status) <= 500),
  ADD CONSTRAINT complaints_review_notes_length CHECK (review_notes IS NULL OR length(review_notes) <= 2000);

-- Profile constraints
ALTER TABLE profiles
  ADD CONSTRAINT profiles_display_name_length CHECK (display_name IS NULL OR length(display_name) <= 100),
  ADD CONSTRAINT profiles_phone_number_length CHECK (phone_number IS NULL OR length(phone_number) <= 20);

-- Evidence constraints
ALTER TABLE evidence
  ADD CONSTRAINT evidence_file_name_length CHECK (length(file_name) <= 255),
  ADD CONSTRAINT evidence_file_url_length CHECK (length(file_url) <= 500),
  ADD CONSTRAINT evidence_description_length CHECK (description IS NULL OR length(description) <= 500);

-- Fix #3: DEFINER_OR_RPC_BYPASS - Make has_role() more secure
-- Change to only allow checking the current user's roles (prevents role enumeration)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    -- Only allow checking own roles or if caller is admin
    SELECT CASE 
        WHEN auth.uid() = _user_id THEN
            EXISTS (
                SELECT 1
                FROM public.user_roles
                WHERE user_id = _user_id
                  AND role = _role
            )
        WHEN EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin') THEN
            EXISTS (
                SELECT 1
                FROM public.user_roles
                WHERE user_id = _user_id
                  AND role = _role
            )
        ELSE false
    END
$$;