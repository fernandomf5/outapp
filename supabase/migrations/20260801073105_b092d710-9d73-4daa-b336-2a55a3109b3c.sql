ALTER TABLE public.saved_receipts ADD COLUMN contact_id uuid REFERENCES public.contacts(id) ON DELETE SET NULL;

UPDATE public.saved_receipts sr
SET contact_id = (
  SELECT contact_id
  FROM public.contact_resource_links crl
  WHERE crl.resource_type = 'receipt'
    AND crl.resource_id = sr.id
  LIMIT 1
);

CREATE INDEX idx_saved_receipts_contact_id ON public.saved_receipts(contact_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.saved_receipts TO authenticated;
GRANT ALL ON public.saved_receipts TO service_role;