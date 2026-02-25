import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    const body = await req.json();
    console.log('Checkout webhook received:', JSON.stringify(body));

    if (body.type !== 'payment') {
      return new Response(JSON.stringify({ received: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const paymentId = body.data.id;

    // Get external_reference from payment to find the checkout and order
    // First, we need the access token. Try to get it from the payment metadata.
    // We'll try global config first
    const { data: mpSettings } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'mercadopago_access_token')
      .single();

    let accessToken = mpSettings?.value;

    // Fetch payment details
    const paymentResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { 'Authorization': `Bearer ${accessToken}` },
    });

    if (!paymentResponse.ok) {
      console.error('Error fetching payment');
      throw new Error('Error fetching payment');
    }

    const payment = await paymentResponse.json();
    console.log('Payment details:', JSON.stringify(payment));

    const externalRef = payment.external_reference;
    if (!externalRef || !externalRef.startsWith('checkout|')) {
      console.log('Not a checkout payment, ignoring');
      return new Response(JSON.stringify({ received: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const [, orderId, checkoutId] = externalRef.split('|');

    if (payment.status === 'approved') {
      console.log('Payment approved, updating order:', orderId);

      // Update order status
      await supabase
        .from('checkout_orders')
        .update({
          status: 'approved',
          payment_method: payment.payment_method_id || 'mercadopago',
          payment_id: String(paymentId),
        })
        .eq('id', orderId);

      // Update checkout stats
      const { data: checkout } = await supabase
        .from('checkouts')
        .select('total_sales, total_revenue, user_id')
        .eq('id', checkoutId)
        .single();

      if (checkout) {
        await supabase
          .from('checkouts')
          .update({
            total_sales: (checkout.total_sales || 0) + 1,
            total_revenue: Number(checkout.total_revenue || 0) + Number(payment.transaction_amount),
          })
          .eq('id', checkoutId);
      }

      console.log('Order and checkout updated successfully');
    } else if (payment.status === 'pending') {
      await supabase
        .from('checkout_orders')
        .update({ status: 'pending', payment_id: String(paymentId) })
        .eq('id', orderId);
    } else {
      await supabase
        .from('checkout_orders')
        .update({ status: payment.status, payment_id: String(paymentId) })
        .eq('id', orderId);
    }

    return new Response(
      JSON.stringify({ received: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
