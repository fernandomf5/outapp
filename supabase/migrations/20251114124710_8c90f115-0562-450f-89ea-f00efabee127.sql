-- Add request_date field to tasks table
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS request_date DATE;

-- Create task_categories table for client-specific categories
CREATE TABLE IF NOT EXISTS task_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on task_categories
ALTER TABLE task_categories ENABLE ROW LEVEL SECURITY;

-- Create policies for task_categories
CREATE POLICY "Users can view their own task categories"
  ON task_categories FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own task categories"
  ON task_categories FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own task categories"
  ON task_categories FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own task categories"
  ON task_categories FOR DELETE
  USING (auth.uid() = user_id);

-- Create trigger for task_categories updated_at
CREATE OR REPLACE TRIGGER update_task_categories_updated_at
  BEFORE UPDATE ON task_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();