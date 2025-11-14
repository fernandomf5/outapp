-- Adicionar coluna de ordem para tarefas
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS task_order INTEGER DEFAULT 0;

-- Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_tasks_block_order ON tasks(block_id, task_order);