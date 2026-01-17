-- Adicionar campos faltantes na tabela floating_buttons
ALTER TABLE public.floating_buttons 
ADD COLUMN IF NOT EXISTS button_style TEXT DEFAULT 'circular',
ADD COLUMN IF NOT EXISTS dialog_title TEXT DEFAULT 'Olá!',
ADD COLUMN IF NOT EXISTS dialog_subtitle TEXT DEFAULT 'Como podemos ajudar?',
ADD COLUMN IF NOT EXISTS secondary_color TEXT DEFAULT '#ffffff';