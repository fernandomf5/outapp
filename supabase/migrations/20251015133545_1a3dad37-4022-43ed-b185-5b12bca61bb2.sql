-- Create tracking pixels table
CREATE TABLE public.tracking_pixels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('facebook', 'google_ads', 'google_analytics', 'tiktok', 'custom')),
  pixel_id TEXT NOT NULL,
  code TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create conversion events table
CREATE TABLE public.conversion_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  pixel_id UUID NOT NULL REFERENCES public.tracking_pixels(id) ON DELETE CASCADE,
  event_name TEXT NOT NULL,
  event_data JSONB DEFAULT '{}'::jsonb,
  visitor_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tracking_pixels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversion_events ENABLE ROW LEVEL SECURITY;

-- Policies for tracking pixels
CREATE POLICY "Users can view their own pixels"
ON public.tracking_pixels FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own pixels"
ON public.tracking_pixels FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pixels"
ON public.tracking_pixels FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own pixels"
ON public.tracking_pixels FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all pixels"
ON public.tracking_pixels FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Policies for conversion events
CREATE POLICY "Users can view their own events"
ON public.conversion_events FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own events"
ON public.conversion_events FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all events"
ON public.conversion_events FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_tracking_pixels_updated_at
BEFORE UPDATE ON public.tracking_pixels
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes
CREATE INDEX idx_tracking_pixels_user_id ON public.tracking_pixels(user_id);
CREATE INDEX idx_conversion_events_user_id ON public.conversion_events(user_id);
CREATE INDEX idx_conversion_events_pixel_id ON public.conversion_events(pixel_id);
CREATE INDEX idx_conversion_events_created_at ON public.conversion_events(created_at);