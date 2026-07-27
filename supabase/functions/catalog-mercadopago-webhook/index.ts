import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const url = new URL(req.url);
    const body = await req.json().catch(() => ({}));
    const paymentId =
      body?.data?.id || body?.id || url.searchParams.get('data.id') || url.searchParams.get('id');

    if (!paymentId) {
      return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders });
    }

    // Find the order via the payment lookup: we need an access token. Try each catalog credential.
    const { data: credentials } = await supabase
      .from('catalog_payment_credentials')
      .select('catalog_id, mp_access_token');

    const tokens = [
      ...(credentials || []).map((c: any) => c.mp_access_token).filter(Boolean),
      Deno.env.get('MERCADOPAGO_ACCESS_TOKEN'),
    ].filter(Boolean) as string[];

    let payment: any = null;
    for (const token of tokens) {
      const res = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        payment = await res.json();
        break;
      }
    }

    if (!payment) {
      console.log('Pagamento não localizado no Mercado Pago:', paymentId);
      return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders });
    }

    const orderId = payment.external_reference || payment?.metadata?.order_id;
    if (!orderId) {
      return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders });
    }

    const approved = payment.status === 'approved';
    const rejected = ['rejected', 'cancelled', 'refunded', 'charged_back'].includes(payment.status);

    await supabase
      .from('catalog_orders')
      .update({
        payment_method: 'mercadopago',
        payment_id: String(paymentId),
        payment_status: approved ? 'paid' : rejected ? 'failed' : 'processing',
        paid_at: approved ? new Date().toISOString() : null,
        ...(approved ? { status: 'confirmed' } : {}),
      })
      .eq('id', orderId);

    console.log('Pedido atualizado:', orderId, payment.status);

    return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders });
  } catch (error) {
    console.error('catalog-mercadopago-webhook error:', error);
    return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders });
  }
});
