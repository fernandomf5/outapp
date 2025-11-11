-- Add client_id column to task_blocks table
ALTER TABLE task_blocks ADD COLUMN client_id UUID REFERENCES customers(id) ON DELETE CASCADE;

-- Create index for better performance
CREATE INDEX idx_task_blocks_client_id ON task_blocks(client_id);

-- Update RLS policies to consider client_id
DROP POLICY IF EXISTS "Users can manage their own task_blocks" ON task_blocks;

CREATE POLICY "Users can manage their own task_blocks"
ON task_blocks
FOR ALL
USING (
  user_id = auth.uid()
);
