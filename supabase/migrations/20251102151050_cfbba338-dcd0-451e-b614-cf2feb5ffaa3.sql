-- Create table for user email verification codes
CREATE TABLE IF NOT EXISTS public.user_verification_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  code VARCHAR(6) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_verification_codes ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own verification codes"
  ON public.user_verification_codes
  FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own verification codes"
  ON public.user_verification_codes
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their own verification codes"
  ON public.user_verification_codes
  FOR UPDATE
  USING (true);

-- Add index for performance
CREATE INDEX idx_user_verification_codes_user_id ON public.user_verification_codes(user_id);
CREATE INDEX idx_user_verification_codes_code ON public.user_verification_codes(code);

-- Add email_verified column to profiles table if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'email_verified'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN email_verified BOOLEAN NOT NULL DEFAULT false;
  END IF;
END $$;

-- Add password_hash column to profiles table if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'password_hash'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN password_hash TEXT;
  END IF;
END $$;