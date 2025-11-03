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

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { planId } = await req.json();

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

    // Buscar informações do plano
    const { data: plan, error: planError } = await supabase
      .from('plans')
      .select('*')
      .eq('id', planId)
      .single();

    if (planError || !plan) {
      throw new Error('Plano não encontrado');
    }

    // Buscar perfil do usuário
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('user_id', user.id)
      .single();

    // Criar preferência no Mercado Pago
    const preference = {
      items: [
        {
          title: plan.name,
          description: plan.description,
          quantity: 1,
          unit_price: plan.price,
          currency_id: 'BRL',
        }
      ],
      payer: {
        email: profile?.email || user.email,
        name: profile?.full_name || user.email,
      },
      back_urls: {
        success: `${Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '.lovable.app')}/dashboard?tab=myplan&payment=success`,
        failure: `${Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '.lovable.app')}/dashboard?tab=myplan&payment=failure`,
        pending: `${Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '.lovable.app')}/dashboard?tab=myplan&payment=pending`,
      },
      auto_return: 'approved',
      notification_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/mercadopago-webhook`,
      external_reference: `${user.id}|${planId}`,
      metadata: {
        user_id: user.id,
        plan_id: planId,
      },
    };

    console.log('Criando preferência no Mercado Pago:', preference);

    const mpResponse = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(preference),
    });

    if (!mpResponse.ok) {
      const errorText = await mpResponse.text();
      console.error('Erro do Mercado Pago:', errorText);
      throw new Error(`Erro ao criar preferência: ${errorText}`);
    }

    const mpData = await mpResponse.json();

    console.log('Preferência criada com sucesso:', mpData);

    return new Response(
      JSON.stringify({
        init_point: mpData.init_point,
        preference_id: mpData.id,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});