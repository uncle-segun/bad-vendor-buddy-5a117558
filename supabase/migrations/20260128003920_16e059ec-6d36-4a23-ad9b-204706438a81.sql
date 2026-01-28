-- Add created_by column to vendors table
ALTER TABLE public.vendors ADD COLUMN created_by uuid REFERENCES auth.users(id);

-- Create index for performance
CREATE INDEX idx_vendors_created_by ON public.vendors(created_by);

-- Add policy so reporters can view vendors they created
CREATE POLICY "Users can view vendors they created" 
ON public.vendors 
FOR SELECT 
USING (auth.uid() = created_by);

-- Update the INSERT policy to set created_by
DROP POLICY IF EXISTS "Authenticated users can insert vendors" ON public.vendors;

CREATE POLICY "Authenticated users can insert vendors" 
ON public.vendors 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL AND created_by = auth.uid());