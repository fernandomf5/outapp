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

    const {
      checkoutId,
      orderId,
      paymentMethod, // 'credit_card' or 'pix'
      token,         // card token from MP SDK
      installments,
      issuerId,
      paymentMethodId,
      amount,
      payerEmail,
      payerName,
      payerCpf,
    } = await req.json();

    if (!checkoutId || !orderId || !paymentMethod) {
      throw new Error('Dados obrigatórios ausentes');
    }

    // Get checkout and access token
    const { data: checkout, error: checkoutError } = await supabase
      .from('checkouts').select('*').eq('id', checkoutId).eq('is_active', true).single();

    if (checkoutError || !checkout) throw new Error('Checkout não encontrado ou inativo');

    const normalizedPayerEmail = String(payerEmail || '').trim().toLowerCase();
    if (checkout.integration_type === 'members_area' && checkout.integration_id && normalizedPayerEmail) {
      const { data: existingAccess, error: existingAccessError } = await supabase
        .from('members_area_access_codes')
        .select('customer_name')
        .eq('members_area_id', checkout.integration_id)
        .ilike('customer_email', normalizedPayerEmail)
        .eq('is_active', true)
        .order('created_at', { ascending: true })
        .limit(1);

      if (existingAccessError) throw existingAccessError;
      const existingStudent = existingAccess?.[0];
      if (existingStudent) {
        throw new Error(`Este e-mail já está em uso por ${existingStudent.customer_name || 'outro aluno'}. Use outro e-mail para efetuar a compra.`);
      }
    }

    let accessToken = checkout.mp_access_token;
    if (!accessToken) {
      const { data: mpSettings } = await supabase
        .from('site_settings').select('value').eq('key', 'mercadopago_access_token').single();
      accessToken = mpSettings?.value;
    }
    if (!accessToken) throw new Error('Mercado Pago não configurado.');

    let paymentBody: any;

    if (paymentMethod === 'pix') {
      paymentBody = {
        transaction_amount: Number(amount),
        payment_method_id: 'pix',
        payer: {
          email: payerEmail,
          first_name: payerName?.split(' ')[0] || 'Cliente',
          last_name: payerName?.split(' ').slice(1).join(' ') || '',
          identification: payerCpf ? { type: 'CPF', number: payerCpf.replace(/\D/g, '') } : undefined,
        },
        description: checkout.item_name,
        external_reference: `checkout|${orderId}|${checkoutId}`,
        notification_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/checkout-webhook`,
      };
    } else if (paymentMethod === 'credit_card') {
      if (!token) throw new Error('Token do cartão é obrigatório');

      paymentBody = {
        transaction_amount: Number(amount),
        token: token,
        installments: Number(installments) || 1,
        issuer_id: issuerId ? String(issuerId) : undefined,
        payment_method_id: paymentMethodId,
        payer: {
          email: payerEmail,
          first_name: payerName?.split(' ')[0] || 'Cliente',
          last_name: payerName?.split(' ').slice(1).join(' ') || '',
          identification: payerCpf ? { type: 'CPF', number: payerCpf.replace(/\D/g, '') } : undefined,
        },
        description: checkout.item_name,
        external_reference: `checkout|${orderId}|${checkoutId}`,
        notification_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/checkout-webhook`,
      };
    } else {
      throw new Error('Método de pagamento inválido');
    }

    console.log('Creating direct payment for checkout:', checkoutId, 'method:', paymentMethod);

    const mpResponse = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': `${orderId}-${Date.now()}`,
      },
      body: JSON.stringify(paymentBody),
    });

    const mpData = await mpResponse.json();

    if (!mpResponse.ok) {
      console.error('MercadoPago error:', JSON.stringify(mpData));
      throw new Error(mpData.message || `Erro ao processar pagamento: ${mpResponse.status}`);
    }

    console.log('Payment created:', mpData.id, 'status:', mpData.status);

    // Update order with payment info
    const updateData: any = {
      payment_id: String(mpData.id),
      payment_method: paymentMethod,
    };

    if (mpData.status === 'approved') {
      updateData.status = 'approved';
    } else if (mpData.status === 'pending' || mpData.status === 'in_process') {
      updateData.status = 'pending';
    } else {
      updateData.status = mpData.status;
    }

    await supabase.from('checkout_orders').update(updateData).eq('id', orderId);

    // If approved immediately (credit card), handle integrations
    if (mpData.status === 'approved') {
      // Update checkout stats
      await supabase.from('checkouts').update({
        total_sales: (checkout.total_sales || 0) + 1,
        total_revenue: Number(checkout.total_revenue || 0) + Number(amount),
      }).eq('id', checkoutId);

      // Handle members area integration
      if (checkout.integration_type === 'members_area' && checkout.integration_id) {
        const accessCode = await generateAccessCode(supabase, checkout, orderId, payerName, normalizedPayerEmail || payerEmail);
        
        // Send email with access code
        await sendAccessCodeEmail(supabase, payerEmail, payerName, accessCode, checkout.item_name);

        return new Response(JSON.stringify({
          status: mpData.status,
          payment_id: mpData.id,
          access_code: accessCode,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // For PIX, return QR code data
    const response: any = {
      status: mpData.status,
      payment_id: mpData.id,
    };

    if (paymentMethod === 'pix' && mpData.point_of_interaction?.transaction_data) {
      response.pix_qr_code = mpData.point_of_interaction.transaction_data.qr_code;
      response.pix_qr_code_base64 = mpData.point_of_interaction.transaction_data.qr_code_base64;
      response.pix_expiration = mpData.date_of_expiration;
    }

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function generateAccessCode(supabase: any, checkout: any, orderId: string, customerName: string, customerEmail: string) {
  const { data: codeData } = await supabase.rpc('generate_checkout_access_code');
  const accessCode = codeData || Math.random().toString(36).substring(2, 10).toUpperCase();

  const { error: insertError } = await supabase.from('members_area_access_codes').insert({
    members_area_id: checkout.integration_id,
    checkout_order_id: orderId,
    user_id: checkout.user_id,
    access_code: accessCode,
    customer_name: customerName,
    customer_email: customerEmail,
    is_active: true,
  });
  if (insertError) throw insertError;

  await supabase.from('checkout_orders').update({
    metadata: { access_code: accessCode, members_area_id: checkout.integration_id },
  }).eq('id', orderId);

  return accessCode;
}

async function sendAccessCodeEmail(supabase: any, email: string, name: string, accessCode: string, productName: string) {
  try {
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      console.error('RESEND_API_KEY not configured, skipping email');
      return;
    }

    // Get site name
    const { data: siteNameSetting } = await supabase
      .from('site_settings').select('value').eq('key', 'site_name').single();
    const siteName = siteNameSetting?.value || 'Plataforma';

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; padding: 30px 0; background: linear-gradient(135deg, #8B5CF6, #6D28D9); border-radius: 12px; margin-bottom: 30px;">
          <h1 style="color: white; margin: 0; font-size: 24px;">🎉 Pagamento Confirmado!</h1>
        </div>
        
        <p style="font-size: 16px; color: #333;">Olá, <strong>${name || 'Cliente'}</strong>!</p>
        
        <p style="font-size: 14px; color: #555; line-height: 1.6;">
          Seu pagamento para <strong>${productName}</strong> foi confirmado com sucesso! 
          Use o código abaixo para acessar seu conteúdo:
        </p>
        
        <div style="text-align: center; margin: 30px 0; padding: 25px; background: #F3F4F6; border-radius: 12px; border: 2px dashed #8B5CF6;">
          <p style="font-size: 12px; color: #666; margin: 0 0 8px 0; text-transform: uppercase; letter-spacing: 1px;">Seu Código de Acesso</p>
          <p style="font-size: 32px; font-weight: bold; color: #8B5CF6; margin: 0; letter-spacing: 4px; font-family: monospace;">${accessCode}</p>
        </div>
        
        <p style="font-size: 14px; color: #555; line-height: 1.6;">
          📌 Guarde este código com segurança. Você precisará dele para acessar a área de membros.
        </p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #E5E7EB; text-align: center;">
          <p style="font-size: 12px; color: #999;">
            ${siteName} • Este é um email automático, não responda.
          </p>
        </div>
      </div>
    `;

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `${siteName} <onboarding@resend.dev>`,
        to: [email],
        subject: `🎉 Seu código de acesso - ${productName}`,
        html: htmlContent,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Resend error:', errText);
    } else {
      console.log('Access code email sent to:', email);
    }
  } catch (err) {
    console.error('Error sending email:', err);
  }
}
