-- Create CRM contacts table
CREATE TABLE public.contacts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company TEXT,
  position TEXT,
  tags JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  source TEXT,
  status TEXT NOT NULL DEFAULT 'lead',
  last_contact_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

-- Policies for contacts
CREATE POLICY "Users can view their own contacts"
ON public.contacts FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own contacts"
ON public.contacts FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own contacts"
ON public.contacts FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own contacts"
ON public.contacts FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all contacts"
ON public.contacts FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_contacts_updated_at
BEFORE UPDATE ON public.contacts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create contact interactions table
CREATE TABLE public.contact_interactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  type TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.contact_interactions ENABLE ROW LEVEL SECURITY;

-- Policies for interactions
CREATE POLICY "Users can view interactions for their contacts"
ON public.contact_interactions FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.contacts
  WHERE contacts.id = contact_interactions.contact_id
  AND contacts.user_id = auth.uid()
));

CREATE POLICY "Users can create interactions for their contacts"
ON public.contact_interactions FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.contacts
  WHERE contacts.id = contact_interactions.contact_id
  AND contacts.user_id = auth.uid()
));

CREATE POLICY "Admins can view all interactions"
ON public.contact_interactions FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));