DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'document') THEN
    ALTER TABLE public.contacts ADD COLUMN document TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'address') THEN
    ALTER TABLE public.contacts ADD COLUMN address TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'contact_person') THEN
    ALTER TABLE public.contacts ADD COLUMN contact_person TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'market_area') THEN
    ALTER TABLE public.contacts ADD COLUMN market_area TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'website') THEN
    ALTER TABLE public.contacts ADD COLUMN website TEXT;
  END IF;
END $$;
