CREATE OR REPLACE FUNCTION public.create_checkout_order(
  _checkout_id uuid,
  _customer_name text,
  _customer_email text,
  _customer_phone text,
  _customer_cpf text,
  _amount numeric,
  _additional_items jsonb DEFAULT '[]'::jsonb
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner uuid;
  v_id uuid;
BEGIN
  SELECT user_id INTO v_owner FROM public.checkouts WHERE id = _checkout_id;
  IF v_owner IS NULL THEN
    RAISE EXCEPTION 'Checkout não encontrado';
  END IF;

  INSERT INTO public.checkout_orders (
    checkout_id, user_id, customer_name, customer_email, customer_phone,
    customer_cpf, amount, status, additional_items
  ) VALUES (
    _checkout_id, v_owner, _customer_name, lower(trim(_customer_email)), _customer_phone,
    _customer_cpf, _amount, 'pending', COALESCE(_additional_items, '[]'::jsonb)
  ) RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_checkout_order_status(_order_id uuid)
RETURNS TABLE(status text, access_code text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT o.status, (o.metadata->>'access_code')::text
  FROM public.checkout_orders o
  WHERE o.id = _order_id;
$$;

GRANT EXECUTE ON FUNCTION public.create_checkout_order(uuid, text, text, text, text, numeric, jsonb) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_checkout_order_status(uuid) TO anon, authenticated;