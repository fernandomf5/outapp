-- Adicionar novos tipos de plano
ALTER TYPE plan_type ADD VALUE IF NOT EXISTS 'free';
ALTER TYPE plan_type ADD VALUE IF NOT EXISTS 'monthly';
ALTER TYPE plan_type ADD VALUE IF NOT EXISTS 'annual';
ALTER TYPE plan_type ADD VALUE IF NOT EXISTS 'lifetime';