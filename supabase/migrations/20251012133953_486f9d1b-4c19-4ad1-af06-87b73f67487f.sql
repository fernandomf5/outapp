-- Add order_index column to plans table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'plans' 
    AND column_name = 'order_index'
  ) THEN
    ALTER TABLE public.plans ADD COLUMN order_index integer NOT NULL DEFAULT 0;
  END IF;
END $$;

-- Create index for better performance when ordering
CREATE INDEX IF NOT EXISTS idx_plans_order_index ON public.plans(order_index);

-- Update existing plans with default order based on plan_type
UPDATE public.plans
SET order_index = CASE
  WHEN plan_type = 'free_trial' THEN 0
  WHEN name ILIKE '%chatbot%' THEN 1
  WHEN name ILIKE '%agente%' OR name ILIKE '%agent%' THEN 2
  ELSE 999
END
WHERE order_index = 0;