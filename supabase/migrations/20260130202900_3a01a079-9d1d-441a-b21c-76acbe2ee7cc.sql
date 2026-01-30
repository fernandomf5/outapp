-- Inserir categoria "Leads que procuraram Imóveis" no sistema de lead_categories para o usuário
INSERT INTO public.lead_categories (user_id, name, color)
SELECT '74baa780-771d-48dc-a6bb-20227b7859d6', 'Leads que procuraram Imóveis', '#3abd28'
WHERE NOT EXISTS (
  SELECT 1 FROM public.lead_categories 
  WHERE user_id = '74baa780-771d-48dc-a6bb-20227b7859d6' 
  AND name = 'Leads que procuraram Imóveis'
);

-- Criar assignments para os leads na nova tabela (usando o source 'customers' para manter referência)
INSERT INTO public.lead_category_assignments (user_id, category_id, lead_source, lead_id)
SELECT 
  c.user_id,
  (SELECT id FROM public.lead_categories WHERE user_id = '74baa780-771d-48dc-a6bb-20227b7859d6' AND name = 'Leads que procuraram Imóveis' LIMIT 1),
  'customers',
  c.id
FROM public.customers c
WHERE c.category_id = '788e1288-8d3b-4313-b888-a9961e900d9a'
ON CONFLICT (lead_source, lead_id) DO NOTHING;

-- Agora deletar os leads da tabela customers (Gestão de Clientes)
DELETE FROM public.customers 
WHERE category_id = '788e1288-8d3b-4313-b888-a9961e900d9a';