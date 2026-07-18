-- Allow public access to view briefings by ID
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'briefings' 
        AND policyname = 'Public can view briefings'
    ) THEN
        CREATE POLICY "Public can view briefings"
        ON public.briefings
        FOR SELECT
        USING (true);
    END IF;
END $$;

-- Ensure grants are correct for the briefings table
GRANT SELECT ON public.briefings TO anon, authenticated;
GRANT ALL ON public.briefings TO service_role;
