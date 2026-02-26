
-- Add thank you page and tracking fields to checkouts
ALTER TABLE public.checkouts
ADD COLUMN IF NOT EXISTS thank_you_title TEXT DEFAULT 'Obrigado pela sua compra!',
ADD COLUMN IF NOT EXISTS thank_you_message TEXT DEFAULT 'Seu pedido foi realizado com sucesso.',
ADD COLUMN IF NOT EXISTS thank_you_image_url TEXT,
ADD COLUMN IF NOT EXISTS thank_you_button_text TEXT DEFAULT 'Falar no WhatsApp',
ADD COLUMN IF NOT EXISTS thank_you_button_url TEXT,
ADD COLUMN IF NOT EXISTS thank_you_download_url TEXT,
ADD COLUMN IF NOT EXISTS show_order_details BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS head_code TEXT,
ADD COLUMN IF NOT EXISTS footer_code TEXT,
ADD COLUMN IF NOT EXISTS upsell_title TEXT,
ADD COLUMN IF NOT EXISTS upsell_description TEXT,
ADD COLUMN IF NOT EXISTS upsell_product_id TEXT,
ADD COLUMN IF NOT EXISTS upsell_price NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS upsell_image_url TEXT,
ADD COLUMN IF NOT EXISTS upsell_checkout_url TEXT,
ADD COLUMN IF NOT EXISTS downsell_title TEXT,
ADD COLUMN IF NOT EXISTS downsell_description TEXT,
ADD COLUMN IF NOT EXISTS downsell_product_id TEXT,
ADD COLUMN IF NOT EXISTS downsell_price NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS downsell_image_url TEXT,
ADD COLUMN IF NOT EXISTS downsell_checkout_url TEXT;

-- Table for additional items (order bumps and related products)
CREATE TABLE public.checkout_additional_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  checkout_id UUID NOT NULL REFERENCES public.checkouts(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL DEFAULT 'bump', -- 'bump' or 'related'
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2) NOT NULL,
  image_url TEXT,
  product_id UUID, -- optional reference to products table
  is_active BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.checkout_additional_items ENABLE ROW LEVEL SECURITY;

-- Owner can manage their checkout items
CREATE POLICY "Users can manage their checkout additional items"
ON public.checkout_additional_items
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.checkouts c WHERE c.id = checkout_id AND c.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.checkouts c WHERE c.id = checkout_id AND c.user_id = auth.uid()
  )
);

-- Public can view active items for active checkouts
CREATE POLICY "Public can view active checkout items"
ON public.checkout_additional_items
FOR SELECT
USING (
  is_active = true AND
  EXISTS (
    SELECT 1 FROM public.checkouts c WHERE c.id = checkout_id AND c.is_active = true
  )
);

-- Add additional_items jsonb to checkout_orders to track what extras were purchased
ALTER TABLE public.checkout_orders
ADD COLUMN IF NOT EXISTS additional_items JSONB DEFAULT '[]'::jsonb;
