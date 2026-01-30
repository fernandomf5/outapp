-- Create stock_movements table for tracking inventory changes
CREATE TABLE public.stock_movements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  movement_type TEXT NOT NULL CHECK (movement_type IN ('entry', 'exit', 'adjustment', 'sale', 'return', 'loss', 'transfer')),
  quantity INTEGER NOT NULL,
  previous_quantity INTEGER NOT NULL,
  new_quantity INTEGER NOT NULL,
  unit_cost DECIMAL(10,2),
  total_cost DECIMAL(10,2),
  reason TEXT,
  reference_id UUID,
  reference_type TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID
);

-- Create index for faster queries
CREATE INDEX idx_stock_movements_product_id ON public.stock_movements(product_id);
CREATE INDEX idx_stock_movements_user_id ON public.stock_movements(user_id);
CREATE INDEX idx_stock_movements_created_at ON public.stock_movements(created_at DESC);
CREATE INDEX idx_stock_movements_movement_type ON public.stock_movements(movement_type);

-- Enable RLS
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;

-- Create policies for stock_movements
CREATE POLICY "Users can view their own stock movements"
ON public.stock_movements
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own stock movements"
ON public.stock_movements
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own stock movements"
ON public.stock_movements
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own stock movements"
ON public.stock_movements
FOR DELETE
USING (auth.uid() = user_id);

-- Create function to update product stock after movement
CREATE OR REPLACE FUNCTION public.update_product_stock_on_movement()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.products
  SET stock_quantity = NEW.new_quantity,
      updated_at = now()
  WHERE id = NEW.product_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger
CREATE TRIGGER trigger_update_product_stock
AFTER INSERT ON public.stock_movements
FOR EACH ROW
EXECUTE FUNCTION public.update_product_stock_on_movement();