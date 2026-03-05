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

    const body = await req.json();
    console.log('Webhook fatura MP recebido:', JSON.stringify(body));

    if (body.type === 'payment' && body.data?.id) {
      const accessToken = Deno.env.get('MERCADOPAGO_ACCESS_TOKEN');
      let mpToken = accessToken;

      if (!mpToken) {
        const { data: mpSettings } = await supabase
          .from('site_settings')
          .select('value')
          .eq('key', 'mercadopago_access_token')
          .single();
        mpToken = mpSettings?.value;
      }

      if (!mpToken) {
        throw new Error('MP access token não configurado');
      }

      // Buscar detalhes do pagamento
      const paymentResponse = await fetch(
        `https://api.mercadopago.com/v1/payments/${body.data.id}`,
        { headers: { 'Authorization': `Bearer ${mpToken}` } }
      );

      if (!paymentResponse.ok) {
        throw new Error(`Erro ao buscar pagamento: ${paymentResponse.status}`);
      }

      const payment = await paymentResponse.json();
      console.log('Pagamento:', payment.status, payment.external_reference);

      const invoiceId = payment.external_reference;

      if (payment.status === 'approved') {
        await supabase.from('invoices').update({
          status: 'paid',
          paid_at: new Date().toISOString(),
          payment_method: payment.payment_type_id || 'mercadopago',
          mercadopago_payment_id: String(body.data.id),
        }).eq('id', invoiceId);

        console.log('Fatura marcada como paga:', invoiceId);
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Erro webhook:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro" }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
