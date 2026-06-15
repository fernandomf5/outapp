import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Não autenticado');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userData?.user) {
      console.error('getUser failed:', userErr);
      throw new Error('Não autenticado');
    }
    const user = userData.user;

    const { orderId } = await req.json();
    if (!orderId) throw new Error('orderId obrigatório');

    const { data: order, error: orderErr } = await supabase
      .from('checkout_orders').select('*').eq('id', orderId).single();
    if (orderErr || !order) throw new Error('Pedido não encontrado');

    const { data: checkout } = await supabase
      .from('checkouts')
      .select('user_id, integration_type, integration_id, item_name, total_sales, total_revenue')
      .eq('id', order.checkout_id).single();
    if (!checkout) throw new Error('Checkout não encontrado');
    if (checkout.user_id !== user.id) throw new Error('Sem permissão');

    if (order.status === 'approved') {
      return new Response(JSON.stringify({ alreadyApproved: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (checkout.integration_type !== 'members_area' || !checkout.integration_id) {
      throw new Error('Checkout não está integrado a uma área de membros');
    }

    // Generate access code
    const { data: codeData } = await supabase.rpc('generate_checkout_access_code');
    const accessCode = codeData || Math.random().toString(36).substring(2, 10).toUpperCase();

    await supabase.from('members_area_access_codes').insert({
      members_area_id: checkout.integration_id,
      checkout_order_id: orderId,
      user_id: checkout.user_id,
      access_code: accessCode,
      customer_name: order.customer_name,
      customer_email: order.customer_email,
      is_active: true,
    });

    await supabase.from('checkout_orders').update({
      status: 'approved',
      metadata: { ...(order.metadata || {}), access_code: accessCode, members_area_id: checkout.integration_id, released_manually: true },
    }).eq('id', orderId);

    await supabase.from('checkouts').update({
      total_sales: (checkout.total_sales || 0) + 1,
      total_revenue: Number(checkout.total_revenue || 0) + Number(order.amount),
    }).eq('id', order.checkout_id);

    // Get area name
    const { data: area } = await supabase
      .from('simple_members_areas').select('name').eq('id', checkout.integration_id).single();
    const areaName = area?.name || checkout.item_name || 'Área de Membros';

    // Send email
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (resendApiKey && order.customer_email) {
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; padding: 30px 0; background: linear-gradient(135deg, #8B5CF6, #6D28D9); border-radius: 12px; margin-bottom: 30px;">
            <h1 style="color: white; margin: 0; font-size: 24px;">🎉 Acesso Liberado!</h1>
          </div>
          <p style="font-size: 16px; color: #333;">Olá, <strong>${order.customer_name || 'Cliente'}</strong>!</p>
          <p style="font-size: 14px; color: #555; line-height: 1.6;">
            Seu pagamento foi confirmado e você já tem acesso a <strong>${areaName}</strong>.
          </p>
          <div style="text-align: center; margin: 30px 0; padding: 25px; background: #F3F4F6; border-radius: 12px; border: 2px dashed #8B5CF6;">
            <p style="font-size: 12px; color: #666; margin: 0 0 8px 0; text-transform: uppercase; letter-spacing: 1px;">Seu Código de Acesso</p>
            <p style="font-size: 32px; font-weight: bold; color: #8B5CF6; margin: 0; letter-spacing: 4px; font-family: monospace;">${accessCode}</p>
          </div>
          <p style="font-size: 14px; color: #555;">Guarde este código com segurança.</p>
        </div>`;
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${resendApiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: 'Out App <noreply@outapp.com.br>',
          to: [order.customer_email],
          subject: `🎉 Acesso liberado - ${areaName}`,
          html,
        }),
      });
    }

    return new Response(JSON.stringify({ success: true, accessCode }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('release-checkout-order error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
