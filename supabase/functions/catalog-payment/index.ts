import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const body = await req.json().catch(() => ({}));
    const action = String(body?.action || '');
    const orderId = String(body?.order_id || '');

    if (!action || !orderId) {
      return json({ error: 'action e order_id são obrigatórios' }, 400);
    }

    const { data: order, error: orderError } = await supabase
      .from('catalog_orders')
      .select('*')
      .eq('id', orderId)
      .maybeSingle();

    if (orderError || !order) return json({ error: 'Pedido não encontrado' }, 404);

    if (action === 'status') {
      return json({
        payment_status: order.payment_status,
        payment_method: order.payment_method,
        status: order.status,
      });
    }

    if (action === 'pix_sent') {
      await supabase
        .from('catalog_orders')
        .update({
          payment_method: 'pix_manual',
          payment_status: 'awaiting_confirmation',
          pix_payload: body?.pix_payload ?? order.pix_payload ?? null,
        })
        .eq('id', orderId);
      return json({ ok: true });
    }

    if (action === 'mp_checkout') {
      const { data: creds } = await supabase
        .from('catalog_payment_credentials')
        .select('mp_access_token')
        .eq('catalog_id', order.catalog_id)
        .maybeSingle();

      const accessToken = creds?.mp_access_token || Deno.env.get('MERCADOPAGO_ACCESS_TOKEN');
      if (!accessToken) return json({ error: 'Mercado Pago não configurado neste catálogo' }, 400);

      const { data: catalog } = await supabase
        .from('catalogs')
        .select('slug, name')
        .eq('id', order.catalog_id)
        .maybeSingle();

      const siteUrl = String(body?.origin || 'https://outapp.com.br').replace(/\/$/, '');
      const returnUrl = `${siteUrl}/catalogo/${catalog?.slug || ''}?pedido=${order.order_number}`;

      const items = Array.isArray(order.items) ? order.items : [];
      const mpItems = items
        .map((item: any) => ({
          title: String(item?.name || 'Item'),
          quantity: Number(item?.quantity) || 1,
          unit_price: Number(item?.price) || 0,
          currency_id: 'BRL',
        }))
        .filter((i: any) => i.unit_price > 0);

      if (mpItems.length === 0) {
        mpItems.push({
          title: catalog?.name || 'Pedido',
          quantity: 1,
          unit_price: Number(order.total_amount) || 0,
          currency_id: 'BRL',
        });
      }

      const preference = {
        items: mpItems,
        payer: {
          email: order.customer_email || 'cliente@email.com',
          name: order.customer_name || 'Cliente',
        },
        back_urls: {
          success: `${returnUrl}&pagamento=sucesso`,
          failure: `${returnUrl}&pagamento=falha`,
          pending: `${returnUrl}&pagamento=pendente`,
        },
        auto_return: 'all',
        notification_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/catalog-mercadopago-webhook`,
        external_reference: order.id,
        metadata: { order_id: order.id, catalog_id: order.catalog_id },
      };

      const mpResponse = await fetch('https://api.mercadopago.com/checkout/preferences', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(preference),
      });

      if (!mpResponse.ok) {
        const errorText = await mpResponse.text();
        console.error('Erro Mercado Pago:', errorText);
        return json({ error: 'Erro ao criar pagamento no Mercado Pago' }, 400);
      }

      const mpData = await mpResponse.json();

      await supabase
        .from('catalog_orders')
        .update({
          payment_method: 'mercadopago',
          payment_status: 'processing',
          payment_id: mpData.id ? String(mpData.id) : null,
        })
        .eq('id', orderId);

      return json({ checkout_url: mpData.init_point, preference_id: mpData.id });
    }

    return json({ error: 'Ação inválida' }, 400);
  } catch (error) {
    console.error('catalog-payment error:', error);
    return json({ error: error instanceof Error ? error.message : 'Erro desconhecido' }, 500);
  }
});
