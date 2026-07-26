ALTER TABLE public.registration_categories ADD COLUMN IF NOT EXISTS item_groups text[] NOT NULL DEFAULT '{}';
ALTER TABLE public.catalogs ADD COLUMN IF NOT EXISTS linked_registration_category_ids uuid[] NOT NULL DEFAULT '{}';

GRANT SELECT ON public.registration_categories TO anon;
GRANT SELECT ON public.contacts TO anon;

CREATE POLICY "Public can view catalog-linked registration categories"
ON public.registration_categories
FOR SELECT
TO anon
USING (
  entity_kind IN ('product', 'service')
  AND EXISTS (
    SELECT 1 FROM public.catalogs c
    WHERE c.is_active = true
      AND registration_categories.id = ANY (c.linked_registration_category_ids)
  )
);

CREATE POLICY "Public can view catalog-linked registration items"
ON public.contacts
FOR SELECT
TO anon
USING (
  registration_category_id IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM public.registration_categories rc
    JOIN public.catalogs c ON c.is_active = true AND rc.id = ANY (c.linked_registration_category_ids)
    WHERE rc.id = contacts.registration_category_id
      AND rc.entity_kind IN ('product', 'service')
  )
);