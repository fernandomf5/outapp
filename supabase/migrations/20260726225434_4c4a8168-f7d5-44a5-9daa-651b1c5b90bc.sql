GRANT SELECT ON public.capture_pages TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.capture_pages TO authenticated;
GRANT ALL ON public.capture_pages TO service_role;

GRANT INSERT ON public.capture_leads TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON public.capture_leads TO authenticated;
GRANT ALL ON public.capture_leads TO service_role;

GRANT SELECT ON public.portfolios TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.portfolios TO authenticated;
GRANT ALL ON public.portfolios TO service_role;

GRANT SELECT ON public.portfolio_items TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.portfolio_items TO authenticated;
GRANT ALL ON public.portfolio_items TO service_role;

GRANT INSERT ON public.portfolio_messages TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON public.portfolio_messages TO authenticated;
GRANT ALL ON public.portfolio_messages TO service_role;