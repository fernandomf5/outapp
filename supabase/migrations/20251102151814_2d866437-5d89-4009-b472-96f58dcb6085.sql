-- Create table for 2FA settings
CREATE TABLE IF NOT EXISTS public.user_2fa_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_enabled boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Create table for trusted devices
CREATE TABLE IF NOT EXISTS public.user_trusted_devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_fingerprint text NOT NULL,
  device_name text,
  expires_at timestamp with time zone NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  last_used_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create table for 2FA verification codes
CREATE TABLE IF NOT EXISTS public.user_2fa_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code text NOT NULL,
  expires_at timestamp with time zone NOT NULL,
  verified boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_2fa_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_trusted_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_2fa_codes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_2fa_settings
CREATE POLICY "Users can view their own 2FA settings"
  ON public.user_2fa_settings
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own 2FA settings"
  ON public.user_2fa_settings
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own 2FA settings"
  ON public.user_2fa_settings
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for user_trusted_devices
CREATE POLICY "Users can view their own trusted devices"
  ON public.user_trusted_devices
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own trusted devices"
  ON public.user_trusted_devices
  FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Public can insert trusted devices"
  ON public.user_trusted_devices
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Public can update trusted devices"
  ON public.user_trusted_devices
  FOR UPDATE
  USING (true);

-- RLS Policies for user_2fa_codes
CREATE POLICY "Users can view their own 2FA codes"
  ON public.user_2fa_codes
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Public can insert 2FA codes"
  ON public.user_2fa_codes
  FOR INSERT
  WITH CHECK (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_2fa_settings_user_id ON public.user_2fa_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_user_trusted_devices_user_id ON public.user_trusted_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_user_trusted_devices_fingerprint ON public.user_trusted_devices(device_fingerprint);
CREATE INDEX IF NOT EXISTS idx_user_2fa_codes_user_id ON public.user_2fa_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_user_2fa_codes_code ON public.user_2fa_codes(code);