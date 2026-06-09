ALTER TABLE public.checkouts 
ADD COLUMN IF NOT EXISTS footer_text TEXT DEFAULT 'Compra 100% Segura',
ADD COLUMN IF NOT EXISTS footer_color TEXT DEFAULT '#64748b',
ADD COLUMN IF NOT EXISTS background_color TEXT DEFAULT '#F8FAFC',
ADD COLUMN IF NOT EXISTS text_color TEXT DEFAULT '#0f172a',
ADD COLUMN IF NOT EXISTS show_fake_feedback BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS fake_feedbacks JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- Update the existing checkout with some default feedbacks if needed
-- This is optional but provides a better starting point
UPDATE public.checkouts 
SET fake_feedbacks = '[
  {"name": "Ana Silva", "text": "Amei o curso! Muito prático.", "rating": 5, "avatar": ""},
  {"name": "João Pereira", "text": "Entrega super rápida do acesso.", "rating": 5, "avatar": ""},
  {"name": "Maria Oliveira", "text": "Superou minhas expectativas.", "rating": 4, "avatar": ""}
]'::jsonb
WHERE fake_feedbacks IS NULL OR fake_feedbacks = '[]'::jsonb;
