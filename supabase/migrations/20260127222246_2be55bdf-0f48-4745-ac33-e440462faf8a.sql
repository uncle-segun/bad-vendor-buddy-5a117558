-- Allow authenticated users to insert vendors when submitting reports
CREATE POLICY "Authenticated users can insert vendors" 
ON public.vendors 
FOR INSERT 
TO authenticated
WITH CHECK (true);

-- Also allow users to view vendors they've reported against
CREATE POLICY "Users can view vendors they reported" 
ON public.vendors 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM complaints c 
    JOIN profiles p ON c.reporter_id = p.id 
    WHERE c.vendor_id = vendors.id AND p.user_id = auth.uid()
  )
);