import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json();
    console.log('Webhook received:', JSON.stringify(body, null, 2));

    // Mercado Pago envia notificações com type e data.id
    const { type, data } = body;

    if (type === 'payment') {
      const paymentId = data.id;
      
      // Buscar detalhes do pagamento na API do Mercado Pago
      const accessToken = Deno.env.get('MERCADOPAGO_ACCESS_TOKEN');
      
      const paymentResponse = await fetch(
        `https://api.mercadopago.com/v1/payments/${paymentId}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      const payment = await paymentResponse.json();
      console.log('Payment details:', JSON.stringify(payment, null, 2));

      // Atualizar transação no banco de dados
      const { data: existingTransaction } = await supabase
        .from('payment_transactions')
        .select('*')
        .eq('transaction_id', paymentId.toString())
        .eq('platform', 'mercadopago')
        .single();

      if (existingTransaction) {
        // Atualizar status da transação
        const { error: updateError } = await supabase
          .from('payment_transactions')
          .update({
            status: payment.status,
            metadata: payment,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingTransaction.id);

        if (updateError) {
          console.error('Error updating transaction:', updateError);
        }

        // Se pagamento aprovado, ativar/criar assinatura
        if (payment.status === 'approved' && existingTransaction.plan_id) {
          // Buscar dados do plano
          const { data: plan } = await supabase
            .from('plans')
            .select('duration_days')
            .eq('id', existingTransaction.plan_id)
            .single();

          if (plan) {
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + (plan.duration_days || 30));

            // Desativar assinaturas anteriores
            await supabase
              .from('subscriptions')
              .update({ status: 'cancelled' })
              .eq('user_id', existingTransaction.user_id)
              .eq('status', 'active');

            // Criar nova assinatura
            const { error: subError } = await supabase
              .from('subscriptions')
              .insert({
                user_id: existingTransaction.user_id,
                plan_id: existingTransaction.plan_id,
                status: 'active',
                expires_at: expiresAt.toISOString(),
              });

            if (subError) {
              console.error('Error creating subscription:', subError);
            } else {
              console.log('Subscription created successfully');
            }

            // Atualizar o subscription_id na transação
            await supabase
              .from('payment_transactions')
              .update({
                subscription_id: existingTransaction.id,
              })
              .eq('id', existingTransaction.id);
          }
        }
      } else {
        console.log('Transaction not found for payment:', paymentId);
      }
    }

    return new Response(
      JSON.stringify({ received: true }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error processing webhook:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
