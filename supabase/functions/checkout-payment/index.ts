import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { checkoutId, orderId, customerName, customerEmail, amount, additionalItems } = await req.json();

    if (!checkoutId || !orderId) {
      throw new Error('Dados obrigatórios ausentes');
    }

    const { data: checkout, error: checkoutError } = await supabase
      .from('checkouts').select('*').eq('id', checkoutId).eq('is_active', true).single();

    if (checkoutError || !checkout) throw new Error('Checkout não encontrado ou inativo');

    let accessToken = checkout.mp_access_token;
    if (!accessToken) {
      const { data: mpSettings } = await supabase.from('site_settings').select('value').eq('key', 'mercadopago_access_token').single();
      accessToken = mpSettings?.value;
    }
    if (!accessToken) throw new Error('Mercado Pago não configurado.');

    // Build items array
    const items: any[] = [{
      title: checkout.item_name,
      description: checkout.item_description || checkout.name,
      quantity: 1,
      unit_price: Number(checkout.price),
      currency_id: 'BRL',
    }];

    // Add additional items
    if (additionalItems && Array.isArray(additionalItems)) {
      for (const extra of additionalItems) {
        items.push({
          title: extra.name,
          quantity: extra.qty || 1,
          unit_price: Number(extra.price),
          currency_id: 'BRL',
        });
      }
    }

    // Use the published app URL for redirects
    const appUrl = Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '.lovable.app') || '';
    const thankYouUrl = `${appUrl}/checkout/${checkoutId}/${checkout.slug}/obrigado?order=${orderId}`;
    const checkoutUrl = `${appUrl}/checkout/${checkoutId}/${checkout.slug}`;

    const preference = {
      items,
      payer: { email: customerEmail, name: customerName },
      back_urls: {
        success: checkout.redirect_url || thankYouUrl,
        failure: `${checkoutUrl}?status=failure`,
        pending: thankYouUrl,
      },
      auto_return: 'all',
      notification_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/checkout-webhook`,
      external_reference: `checkout|${orderId}|${checkoutId}`,
      metadata: { checkout_id: checkoutId, order_id: orderId, owner_user_id: checkout.user_id },
    };

    console.log('Creating MercadoPago preference for checkout:', checkoutId);

    const mpResponse = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(preference),
    });

    if (!mpResponse.ok) {
      const errorText = await mpResponse.text();
      console.error('MercadoPago error:', errorText);
      throw new Error(`Erro ao criar preferência: ${errorText}`);
    }

    const mpData = await mpResponse.json();
    console.log('Preference created successfully:', mpData.id);

    return new Response(
      JSON.stringify({ init_point: mpData.init_point, preference_id: mpData.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
