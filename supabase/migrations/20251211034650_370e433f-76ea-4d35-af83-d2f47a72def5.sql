-- Add color columns to quizzes table
ALTER TABLE public.quizzes 
ADD COLUMN IF NOT EXISTS primary_color TEXT DEFAULT '#8B5CF6',
ADD COLUMN IF NOT EXISTS secondary_color TEXT DEFAULT '#0EA5E9';