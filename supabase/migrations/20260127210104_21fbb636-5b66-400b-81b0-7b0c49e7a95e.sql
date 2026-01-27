-- BadVendor Database Schema
-- Verified Misconduct Registry for Nigeria

-- ===========================================
-- 1. ENUMS
-- ===========================================

-- User roles enum
CREATE TYPE public.app_role AS ENUM ('user', 'moderator', 'admin');

-- Complaint severity enum
CREATE TYPE public.severity_level AS ENUM ('critical', 'risky', 'unreliable');

-- Complaint status enum
CREATE TYPE public.complaint_status AS ENUM ('submitted', 'under_review', 'approved', 'rejected', 'needs_evidence');

-- ===========================================
-- 2. USER ROLES TABLE (separate from profiles for security)
-- ===========================================

CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role app_role NOT NULL DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- ===========================================
-- 3. PROFILES TABLE
-- ===========================================

CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT,
    phone_number TEXT,
    phone_verified BOOLEAN DEFAULT false,
    email_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ===========================================
-- 4. VENDORS TABLE
-- ===========================================

CREATE TABLE public.vendors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    phone_numbers TEXT[] DEFAULT '{}',
    email_addresses TEXT[] DEFAULT '{}',
    social_handles JSONB DEFAULT '{}',
    bank_accounts JSONB DEFAULT '{}',
    highest_severity severity_level,
    verified_complaint_count INTEGER DEFAULT 0,
    is_public BOOLEAN DEFAULT false,
    first_complaint_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;

-- Create indexes for search
CREATE INDEX idx_vendors_phone_numbers ON public.vendors USING GIN (phone_numbers);
CREATE INDEX idx_vendors_name ON public.vendors USING GIN (to_tsvector('english', name));
CREATE INDEX idx_vendors_is_public ON public.vendors (is_public) WHERE is_public = true;

-- ===========================================
-- 5. COMPLAINTS TABLE
-- ===========================================

CREATE TABLE public.complaints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
    severity severity_level NOT NULL,
    status complaint_status NOT NULL DEFAULT 'submitted',
    incident_date DATE,
    amount_lost DECIMAL(15, 2),
    currency TEXT DEFAULT 'NGN',
    description TEXT NOT NULL,
    current_status TEXT,
    review_notes TEXT,
    reviewed_by UUID REFERENCES auth.users(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;

-- Indexes for complaints
CREATE INDEX idx_complaints_vendor_id ON public.complaints (vendor_id);
CREATE INDEX idx_complaints_reporter_id ON public.complaints (reporter_id);
CREATE INDEX idx_complaints_status ON public.complaints (status);

-- ===========================================
-- 6. EVIDENCE TABLE
-- ===========================================

CREATE TABLE public.evidence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    complaint_id UUID NOT NULL REFERENCES public.complaints(id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size INTEGER,
    description TEXT,
    uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.evidence ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_evidence_complaint_id ON public.evidence (complaint_id);

-- ===========================================
-- 7. AUDIT LOGS TABLE
-- ===========================================

CREATE TABLE public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID,
    details JSONB DEFAULT '{}',
    ip_address INET,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_audit_logs_user_id ON public.audit_logs (user_id);
CREATE INDEX idx_audit_logs_entity ON public.audit_logs (entity_type, entity_id);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs (created_at DESC);

-- ===========================================
-- 8. HELPER FUNCTIONS (SECURITY DEFINER)
-- ===========================================

-- Check if user has a specific role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = _user_id
          AND role = _role
    )
$$;

-- Check if current user is moderator or admin
CREATE OR REPLACE FUNCTION public.is_moderator_or_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = auth.uid()
          AND role IN ('moderator', 'admin')
    )
$$;

-- Check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = auth.uid()
          AND role = 'admin'
    )
$$;

-- Check if user is the reporter of a complaint
CREATE OR REPLACE FUNCTION public.is_reporter_of_complaint(_complaint_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.complaints c
        JOIN public.profiles p ON c.reporter_id = p.id
        WHERE c.id = _complaint_id
          AND p.user_id = auth.uid()
    )
$$;

-- Get profile ID for current user
CREATE OR REPLACE FUNCTION public.get_current_profile_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT id FROM public.profiles WHERE user_id = auth.uid()
$$;

-- ===========================================
-- 9. RLS POLICIES
-- ===========================================

-- USER ROLES POLICIES
CREATE POLICY "Users can view their own roles"
    ON public.user_roles FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
    ON public.user_roles FOR ALL
    USING (public.is_admin());

-- PROFILES POLICIES
CREATE POLICY "Users can view their own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Moderators can view all profiles"
    ON public.profiles FOR SELECT
    USING (public.is_moderator_or_admin());

-- VENDORS POLICIES
CREATE POLICY "Anyone can view public vendors"
    ON public.vendors FOR SELECT
    USING (is_public = true);

CREATE POLICY "Moderators can view all vendors"
    ON public.vendors FOR SELECT
    USING (public.is_moderator_or_admin());

CREATE POLICY "Moderators can update vendors"
    ON public.vendors FOR UPDATE
    USING (public.is_moderator_or_admin());

CREATE POLICY "Admins can insert vendors"
    ON public.vendors FOR INSERT
    WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete vendors"
    ON public.vendors FOR DELETE
    USING (public.is_admin());

-- COMPLAINTS POLICIES
CREATE POLICY "Reporters can view their own complaints"
    ON public.complaints FOR SELECT
    USING (reporter_id = public.get_current_profile_id());

CREATE POLICY "Moderators can view all complaints"
    ON public.complaints FOR SELECT
    USING (public.is_moderator_or_admin());

CREATE POLICY "Public can view approved complaints for public vendors"
    ON public.complaints FOR SELECT
    USING (
        status = 'approved' 
        AND EXISTS (
            SELECT 1 FROM public.vendors v 
            WHERE v.id = vendor_id AND v.is_public = true
        )
    );

CREATE POLICY "Authenticated users can insert complaints"
    ON public.complaints FOR INSERT
    WITH CHECK (
        auth.uid() IS NOT NULL
        AND reporter_id = public.get_current_profile_id()
    );

CREATE POLICY "Reporters can update their submitted complaints"
    ON public.complaints FOR UPDATE
    USING (
        reporter_id = public.get_current_profile_id()
        AND status = 'submitted'
    );

CREATE POLICY "Moderators can update all complaints"
    ON public.complaints FOR UPDATE
    USING (public.is_moderator_or_admin());

CREATE POLICY "Admins can delete complaints"
    ON public.complaints FOR DELETE
    USING (public.is_admin());

-- EVIDENCE POLICIES
CREATE POLICY "Reporters can view their own evidence"
    ON public.evidence FOR SELECT
    USING (public.is_reporter_of_complaint(complaint_id));

CREATE POLICY "Moderators can view all evidence"
    ON public.evidence FOR SELECT
    USING (public.is_moderator_or_admin());

CREATE POLICY "Public can view evidence for approved complaints on public vendors"
    ON public.evidence FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.complaints c
            JOIN public.vendors v ON c.vendor_id = v.id
            WHERE c.id = complaint_id
              AND c.status = 'approved'
              AND v.is_public = true
        )
    );

CREATE POLICY "Reporters can insert evidence for their complaints"
    ON public.evidence FOR INSERT
    WITH CHECK (public.is_reporter_of_complaint(complaint_id));

CREATE POLICY "Reporters can delete their own evidence"
    ON public.evidence FOR DELETE
    USING (public.is_reporter_of_complaint(complaint_id));

CREATE POLICY "Admins can manage all evidence"
    ON public.evidence FOR ALL
    USING (public.is_admin());

-- AUDIT LOGS POLICIES (read-only for admins)
CREATE POLICY "Admins can view audit logs"
    ON public.audit_logs FOR SELECT
    USING (public.is_admin());

CREATE POLICY "System can insert audit logs"
    ON public.audit_logs FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- ===========================================
-- 10. TRIGGERS
-- ===========================================

-- Update timestamps trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_vendors_updated_at
    BEFORE UPDATE ON public.vendors
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_complaints_updated_at
    BEFORE UPDATE ON public.complaints
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (user_id)
    VALUES (NEW.id);
    
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'user');
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Update vendor stats when complaint is approved
CREATE OR REPLACE FUNCTION public.update_vendor_on_complaint_approval()
RETURNS TRIGGER AS $$
DECLARE
    v_count INTEGER;
    v_highest_severity severity_level;
BEGIN
    -- Only act when status changes to 'approved'
    IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
        -- Count approved complaints for this vendor
        SELECT COUNT(*), MAX(severity)
        INTO v_count, v_highest_severity
        FROM public.complaints
        WHERE vendor_id = NEW.vendor_id AND status = 'approved';
        
        -- Update vendor
        UPDATE public.vendors
        SET 
            verified_complaint_count = v_count,
            highest_severity = v_highest_severity,
            is_public = (v_count >= 3),
            first_complaint_date = COALESCE(first_complaint_date, NEW.submitted_at)
        WHERE id = NEW.vendor_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_complaint_status_change
    AFTER UPDATE ON public.complaints
    FOR EACH ROW
    EXECUTE FUNCTION public.update_vendor_on_complaint_approval();

-- ===========================================
-- 11. STORAGE BUCKET FOR EVIDENCE
-- ===========================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'evidence',
    'evidence',
    false,
    20971520, -- 20MB limit
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
);

-- Storage policies
CREATE POLICY "Authenticated users can upload evidence"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'evidence'
        AND auth.uid() IS NOT NULL
    );

CREATE POLICY "Users can view their own evidence files"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'evidence'
        AND auth.uid() IS NOT NULL
    );

CREATE POLICY "Users can delete their own evidence files"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'evidence'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );