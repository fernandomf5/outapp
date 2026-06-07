-- Limpar dados existentes das tabelas obsoletas ou que serão migradas para o novo modelo
TRUNCATE TABLE public.customers CASCADE;
TRUNCATE TABLE public.suppliers CASCADE;
TRUNCATE TABLE public.businesses CASCADE;
TRUNCATE TABLE public.contacts CASCADE;

-- Garantir que a tabela de contatos tenha a referência para a categoria de registro
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'contacts' AND COLUMN_NAME = 'registration_category_id') THEN
    ALTER TABLE public.contacts ADD COLUMN registration_category_id UUID REFERENCES public.registration_categories(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Conceder permissões
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contacts TO authenticated;
GRANT ALL ON public.contacts TO service_role;
