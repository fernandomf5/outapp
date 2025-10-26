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
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verificar autenticação
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { planId } = await req.json();
    console.log('Creating payment preference for plan:', planId);

    // Buscar dados do plano
    const { data: plan, error: planError } = await supabase
      .from('plans')
      .select('*')
      .eq('id', planId)
      .single();

    if (planError || !plan) {
      throw new Error('Plan not found');
    }

    // Buscar perfil do usuário
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    const accessToken = Deno.env.get('MERCADOPAGO_ACCESS_TOKEN');

    // Criar preferência de pagamento no Mercado Pago
    const preferenceData = {
      items: [
        {
          title: plan.name,
          description: plan.description || 'Assinatura de plano',
          quantity: 1,
          currency_id: 'BRL',
          unit_price: parseFloat(plan.price),
        },
      ],
      payer: {
        email: user.email,
        name: profile?.full_name || user.email,
      },
      back_urls: {
        success: `${req.headers.get('origin')}/dashboard?payment=success`,
        failure: `${req.headers.get('origin')}/dashboard?payment=failure`,
        pending: `${req.headers.get('origin')}/dashboard?payment=pending`,
      },
      auto_return: 'approved',
      notification_url: `${supabaseUrl}/functions/v1/mercadopago-webhook`,
      metadata: {
        user_id: user.id,
        plan_id: planId,
      },
    };

    const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(preferenceData),
    });

    const preference = await response.json();
    console.log('Preference created:', preference);

    if (preference.error) {
      throw new Error(preference.message || 'Error creating preference');
    }

    // Criar registro de transação pendente
    const { error: transactionError } = await supabase
      .from('payment_transactions')
      .insert({
        user_id: user.id,
        platform: 'mercadopago',
        transaction_id: preference.id,
        status: 'pending',
        amount: plan.price,
        currency: 'BRL',
        plan_id: planId,
        customer_email: user.email,
        customer_name: profile?.full_name || user.email,
        metadata: preference,
      });

    if (transactionError) {
      console.error('Error creating transaction:', transactionError);
    }

    return new Response(
      JSON.stringify({
        init_point: preference.init_point,
        sandbox_init_point: preference.sandbox_init_point,
        preference_id: preference.id,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error creating payment preference:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
