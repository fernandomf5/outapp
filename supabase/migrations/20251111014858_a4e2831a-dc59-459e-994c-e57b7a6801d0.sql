-- Adicionar novos campos na tabela quizzes
ALTER TABLE quizzes 
ADD COLUMN IF NOT EXISTS collect_data boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS collect_name boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS collect_email boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS collect_phone boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS collect_whatsapp boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS show_offer boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS offer_title text,
ADD COLUMN IF NOT EXISTS offer_description text,
ADD COLUMN IF NOT EXISTS offer_button_text text DEFAULT 'Quero essa oferta!',
ADD COLUMN IF NOT EXISTS offer_button_link text,
ADD COLUMN IF NOT EXISTS redirect_url text;

-- Criar tabela para armazenar respostas dos quizzes com dados dos leads
CREATE TABLE IF NOT EXISTS quiz_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id uuid NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  name text,
  email text,
  phone text,
  whatsapp text,
  answers jsonb NOT NULL,
  score integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE quiz_responses ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso
CREATE POLICY "Usuários podem inserir suas respostas"
ON quiz_responses FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Donos do quiz podem ver respostas"
ON quiz_responses FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM quizzes
    WHERE quizzes.id = quiz_responses.quiz_id
    AND quizzes.user_id = auth.uid()
  )
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_quiz_responses_quiz_id ON quiz_responses(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_responses_created_at ON quiz_responses(created_at DESC);