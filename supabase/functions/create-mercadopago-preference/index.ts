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

    const { planId, couponId, discountAmount, finalPrice } = await req.json();

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

    // Validar cupom se fornecido
    let validatedDiscountAmount = 0;
    let validatedFinalPrice = plan.price;

    if (couponId) {
      const { data: coupon, error: couponError } = await supabase
        .from('discount_coupons')
        .select('*')
        .eq('id', couponId)
        .eq('is_active', true)
        .single();

      if (couponError || !coupon) {
        throw new Error('Cupom inválido');
      }

      // Verificar validade
      const now = new Date();
      const validFrom = new Date(coupon.valid_from);
      const validUntil = coupon.valid_until ? new Date(coupon.valid_until) : null;

      if (now < validFrom || (validUntil && now > validUntil)) {
        throw new Error('Cupom expirado ou não válido');
      }

      // Verificar limite de usos
      if (coupon.max_uses && coupon.uses_count >= coupon.max_uses) {
        throw new Error('Cupom esgotado');
      }

      // Verificar usos por usuário
      const { count: userUsages } = await supabase
        .from('coupon_usages')
        .select('*', { count: 'exact', head: true })
        .eq('coupon_id', couponId)
        .eq('user_id', user.id);

      if (userUsages && userUsages >= coupon.max_uses_per_user) {
        throw new Error('Limite de uso do cupom atingido');
      }

      // Verificar valor mínimo
      if (plan.price < coupon.min_purchase_amount) {
        throw new Error('Valor mínimo não atingido');
      }

      // Verificar plano aplicável
      if (coupon.applicable_plans && coupon.applicable_plans.length > 0 && !coupon.applicable_plans.includes(planId)) {
        throw new Error('Cupom não aplicável a este plano');
      }

      // Calcular desconto
      if (coupon.discount_type === 'percentage') {
        validatedDiscountAmount = (plan.price * coupon.discount_value) / 100;
      } else {
        validatedDiscountAmount = coupon.discount_value;
      }
      validatedDiscountAmount = Math.min(validatedDiscountAmount, plan.price);
      validatedFinalPrice = Math.max(0, plan.price - validatedDiscountAmount);

      // Registrar uso do cupom
      await supabase
        .from('coupon_usages')
        .insert({
          coupon_id: couponId,
          user_id: user.id,
          plan_id: planId,
          original_price: plan.price,
          discounted_price: validatedFinalPrice,
          discount_amount: validatedDiscountAmount,
        });

      // Incrementar contador de usos
      await supabase
        .from('discount_coupons')
        .update({ uses_count: coupon.uses_count + 1 })
        .eq('id', couponId);
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
          title: couponId ? `${plan.name} (com desconto)` : plan.name,
          description: plan.description,
          quantity: 1,
          unit_price: validatedFinalPrice,
          currency_id: 'BRL',
        }
      ],
      payer: {
        email: profile?.email || user.email,
        name: profile?.full_name || user.email,
      },
      back_urls: {
        success: `https://outapp.com.br/dashboard?tab=meu-plano&payment=success&plan_type=${plan.plan_type}&plan_name=${encodeURIComponent(plan.name)}`,
        failure: `https://outapp.com.br/dashboard?tab=meu-plano&payment=failure`,
        pending: `https://outapp.com.br/dashboard?tab=meu-plano&payment=pending`,
      },
      auto_return: 'all',
      notification_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/mercadopago-webhook`,
      external_reference: `${user.id}|${planId}`,
      metadata: {
        user_id: user.id,
        plan_id: planId,
        coupon_id: couponId || null,
        original_price: plan.price,
        discount_amount: validatedDiscountAmount,
        final_price: validatedFinalPrice,
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
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});