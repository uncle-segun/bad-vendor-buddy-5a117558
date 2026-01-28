-- Fix the overly permissive dispute_evidence INSERT policy
-- Replace with a policy that validates the dispute exists
DROP POLICY IF EXISTS "Anyone can insert dispute evidence" ON public.dispute_evidence;

CREATE POLICY "Anyone can insert dispute evidence for existing disputes"
ON public.dispute_evidence
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.dispute_requests dr
        WHERE dr.id = dispute_id
        AND dr.status = 'submitted'
    )
);