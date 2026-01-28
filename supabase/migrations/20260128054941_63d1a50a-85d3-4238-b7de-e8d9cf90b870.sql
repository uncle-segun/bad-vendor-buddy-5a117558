-- Create enum for dispute status
CREATE TYPE public.dispute_status AS ENUM ('submitted', 'under_review', 'approved', 'rejected');

-- Create dispute_requests table
CREATE TABLE public.dispute_requests (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
    
    -- Contact information
    full_name TEXT NOT NULL CHECK (char_length(full_name) BETWEEN 2 AND 100),
    email TEXT NOT NULL CHECK (char_length(email) BETWEEN 5 AND 255),
    phone_number TEXT NOT NULL CHECK (char_length(phone_number) BETWEEN 10 AND 20),
    
    -- Verification
    id_document_url TEXT NOT NULL,
    id_document_type TEXT NOT NULL CHECK (id_document_type IN ('national_id', 'drivers_license', 'international_passport', 'voters_card')),
    
    -- Dispute details
    reason TEXT NOT NULL CHECK (char_length(reason) BETWEEN 50 AND 5000),
    
    -- Terms acceptance
    terms_accepted BOOLEAN NOT NULL DEFAULT false,
    terms_accepted_at TIMESTAMP WITH TIME ZONE,
    
    -- Status tracking
    status dispute_status NOT NULL DEFAULT 'submitted',
    reviewed_by UUID REFERENCES auth.users(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    review_notes TEXT,
    
    -- Timestamps
    submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for dispute evidence files
CREATE TABLE public.dispute_evidence (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    dispute_id UUID NOT NULL REFERENCES public.dispute_requests(id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    file_name TEXT NOT NULL CHECK (char_length(file_name) BETWEEN 1 AND 255),
    file_type TEXT NOT NULL CHECK (char_length(file_type) BETWEEN 1 AND 100),
    file_size INTEGER,
    description TEXT CHECK (char_length(description) <= 500),
    uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.dispute_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dispute_evidence ENABLE ROW LEVEL SECURITY;

-- RLS Policies for dispute_requests
-- Anyone can insert (no auth required - vendor may not have account)
CREATE POLICY "Anyone can submit dispute requests"
ON public.dispute_requests
FOR INSERT
WITH CHECK (terms_accepted = true);

-- Moderators/admins can view all
CREATE POLICY "Moderators can view all disputes"
ON public.dispute_requests
FOR SELECT
USING (is_moderator_or_admin());

-- Moderators/admins can update
CREATE POLICY "Moderators can update disputes"
ON public.dispute_requests
FOR UPDATE
USING (is_moderator_or_admin());

-- Admins can delete
CREATE POLICY "Admins can delete disputes"
ON public.dispute_requests
FOR DELETE
USING (is_admin());

-- RLS Policies for dispute_evidence
CREATE POLICY "Anyone can insert dispute evidence"
ON public.dispute_evidence
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Moderators can view dispute evidence"
ON public.dispute_evidence
FOR SELECT
USING (is_moderator_or_admin());

CREATE POLICY "Admins can delete dispute evidence"
ON public.dispute_evidence
FOR DELETE
USING (is_admin());

-- Trigger for updated_at
CREATE TRIGGER update_dispute_requests_updated_at
BEFORE UPDATE ON public.dispute_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();