ALTER TABLE public.financial_categories ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN NOT NULL DEFAULT false;

DROP POLICY IF EXISTS "Users can manage their own cloned pages" ON public.cloned_pages;
CREATE POLICY "Users can manage their own cloned pages" ON public.cloned_pages
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Owners manage cloned page variants" ON public.cloned_page_variants;
CREATE POLICY "Owners manage cloned page variants" ON public.cloned_page_variants
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.cloned_pages p WHERE p.id = cloned_page_variants.page_id AND p.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.cloned_pages p WHERE p.id = cloned_page_variants.page_id AND p.user_id = auth.uid()));

DROP POLICY IF EXISTS "Owners manage cloned page leads" ON public.cloned_page_leads;
CREATE POLICY "Owners manage cloned page leads" ON public.cloned_page_leads
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.cloned_pages p WHERE p.id = cloned_page_leads.page_id AND p.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.cloned_pages p WHERE p.id = cloned_page_leads.page_id AND p.user_id = auth.uid()));

DROP POLICY IF EXISTS "Owners read cloned page analytics" ON public.cloned_page_analytics;
CREATE POLICY "Owners read cloned page analytics" ON public.cloned_page_analytics
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.cloned_pages p WHERE p.id = cloned_page_analytics.page_id AND p.user_id = auth.uid()));

DROP POLICY IF EXISTS "Owners read cloned page clicks" ON public.cloned_page_clicks;
CREATE POLICY "Owners read cloned page clicks" ON public.cloned_page_clicks
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.cloned_pages p WHERE p.id = cloned_page_clicks.page_id AND p.user_id = auth.uid()));

ALTER TABLE public.aprova_job_clients ADD COLUMN IF NOT EXISTS contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_aprova_job_clients_contact ON public.aprova_job_clients(contact_id);
