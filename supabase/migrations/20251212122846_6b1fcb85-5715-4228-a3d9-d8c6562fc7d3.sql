-- Insert portfolio_creator feature
INSERT INTO public.features (name, description, key, category, is_active) 
VALUES ('Criador de Portfólio', 'Permite criar e gerenciar portfólios profissionais para exibir trabalhos realizados', 'portfolio_creator', 'Recursos Avançados', true)
ON CONFLICT (key) DO NOTHING;