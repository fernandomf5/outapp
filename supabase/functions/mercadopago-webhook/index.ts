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
    console.log('Webhook recebido do Mercado Pago:', body);

    // Verificar se é uma notificação de pagamento
    if (body.type !== 'payment') {
      console.log('Tipo de notificação ignorado:', body.type);
      return new Response(JSON.stringify({ received: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Buscar configurações do Mercado Pago
    const { data: mpSettings } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'mercadopago_access_token')
      .single();

    if (!mpSettings?.value) {
      throw new Error('Mercado Pago não configurado');
    }

    const accessToken = mpSettings.value;

    // Buscar detalhes do pagamento
    const paymentId = body.data.id;
    const paymentResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!paymentResponse.ok) {
      throw new Error('Erro ao buscar pagamento');
    }

    const payment = await paymentResponse.json();
    console.log('Detalhes do pagamento:', payment);

    // Extrair informações do external_reference
    const externalRef = payment.external_reference;
    if (!externalRef) {
      throw new Error('External reference não encontrado');
    }

    const [userId, planId] = externalRef.split('|');

    // Verificar status do pagamento
    if (payment.status === 'approved') {
      console.log('Pagamento aprovado, ativando assinatura');

      // Buscar informações do plano
      const { data: plan } = await supabase
        .from('plans')
        .select('*')
        .eq('id', planId)
        .single();

      if (!plan) {
        throw new Error('Plano não encontrado');
      }

      // Desativar assinaturas antigas
      await supabase
        .from('subscriptions')
        .update({ status: 'cancelled' })
        .eq('user_id', userId)
        .eq('status', 'active');

      // Calcular data de expiração
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + plan.duration_days);

      // Criar nova assinatura
      const { error: subError } = await supabase
        .from('subscriptions')
        .insert({
          user_id: userId,
          plan_id: planId,
          status: 'active',
          expires_at: expiresAt.toISOString(),
          payment_method: 'mercadopago',
          payment_id: paymentId,
        });

      if (subError) {
        console.error('Erro ao criar assinatura:', subError);
        throw subError;
      }

      console.log('Assinatura criada com sucesso');
    } else {
      console.log('Pagamento em status:', payment.status);
    }

    return new Response(
      JSON.stringify({ received: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro no webhook:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});