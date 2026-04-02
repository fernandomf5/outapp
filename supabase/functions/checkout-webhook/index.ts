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

    const { data: mpSettings } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'mercadopago_access_token')
      .single();

    let accessToken = mpSettings?.value;

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

      // Get checkout details including integration info
      const { data: checkout } = await supabase
        .from('checkouts')
        .select('total_sales, total_revenue, user_id, integration_type, integration_id, item_name')
        .eq('id', checkoutId)
        .single();

      if (checkout) {
        // Update checkout stats
        await supabase
          .from('checkouts')
          .update({
            total_sales: (checkout.total_sales || 0) + 1,
            total_revenue: Number(checkout.total_revenue || 0) + Number(payment.transaction_amount),
          })
          .eq('id', checkoutId);

        // Get order details for integration
        const { data: orderData } = await supabase
          .from('checkout_orders')
          .select('*')
          .eq('id', orderId)
          .single();

        // Handle catalog integration
        if (checkout.integration_type === 'catalog' && checkout.integration_id && orderData) {
          console.log('Processing catalog integration for catalog:', checkout.integration_id);
          await handleCatalogIntegration(supabase, checkout, orderData, checkoutId);
        }

        // Handle members area integration
        if (checkout.integration_type === 'members_area' && checkout.integration_id && orderData) {
          console.log('Processing members area integration for area:', checkout.integration_id);
          const accessCode = await handleMembersAreaIntegration(supabase, checkout, orderData, orderId);

          // Send access code email
          if (accessCode && orderData.customer_email) {
            await sendAccessCodeEmail(
              orderData.customer_email,
              orderData.customer_name || 'Cliente',
              accessCode,
              checkout.item_name || 'Produto'
            );
          }
        }
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

async function handleCatalogIntegration(supabase: any, checkout: any, orderData: any, checkoutId: string) {
  try {
    // Upsert catalog customer
    const { data: existingCustomer } = await supabase
      .from('catalog_customers')
      .select('id')
      .eq('catalog_id', checkout.integration_id)
      .eq('email', orderData.customer_email)
      .maybeSingle();

    let customerId = existingCustomer?.id;

    if (customerId) {
      await supabase
        .from('catalog_customers')
        .update({
          name: orderData.customer_name || 'Cliente',
          phone: orderData.customer_phone || null,
          orders_count: (existingCustomer.orders_count || 0) + 1,
          total_spent: Number(existingCustomer.total_spent || 0) + Number(orderData.amount),
        })
        .eq('id', customerId);
    } else {
      const { data: newCustomer } = await supabase
        .from('catalog_customers')
        .insert({
          catalog_id: checkout.integration_id,
          name: orderData.customer_name || 'Cliente',
          email: orderData.customer_email,
          phone: orderData.customer_phone || null,
          orders_count: 1,
          total_spent: Number(orderData.amount),
        })
        .select('id')
        .single();
      customerId = newCustomer?.id;
    }

    // Create catalog order
    const orderNumber = `CHK-${Date.now().toString(36).toUpperCase()}`;
    const items = [{
      name: 'Compra via Checkout',
      quantity: 1,
      price: Number(orderData.amount),
    }];

    // Add additional items if any
    if (orderData.additional_items && Array.isArray(orderData.additional_items)) {
      for (const extra of orderData.additional_items) {
        items.push({
          name: extra.name,
          quantity: extra.qty || 1,
          price: Number(extra.price),
        });
      }
    }

    await supabase
      .from('catalog_orders')
      .insert({
        catalog_id: checkout.integration_id,
        customer_id: customerId || null,
        order_number: orderNumber,
        customer_name: orderData.customer_name || 'Cliente',
        customer_email: orderData.customer_email,
        customer_phone: orderData.customer_phone || null,
        items,
        total_amount: Number(orderData.amount),
        status: 'paid',
        notes: `Pedido via Checkout #${checkoutId}`,
      });

    console.log('Catalog order created successfully');
  } catch (err) {
    console.error('Error in catalog integration:', err);
  }
}

async function handleMembersAreaIntegration(supabase: any, checkout: any, orderData: any, orderId: string): Promise<string | null> {
  try {
    // Generate unique access code
    const { data: codeData } = await supabase.rpc('generate_checkout_access_code');
    const accessCode = codeData || Math.random().toString(36).substring(2, 10).toUpperCase();

    // Insert access code
    const { error: insertError } = await supabase
      .from('members_area_access_codes')
      .insert({
        members_area_id: checkout.integration_id,
        checkout_order_id: orderId,
        user_id: checkout.user_id,
        access_code: accessCode,
        customer_name: orderData.customer_name,
        customer_email: orderData.customer_email,
        is_active: true,
      });

    if (insertError) {
      console.error('Error inserting access code:', insertError);
      return null;
    }

    // Store access code in order metadata for display on thank you page
    await supabase
      .from('checkout_orders')
      .update({
        metadata: { access_code: accessCode, members_area_id: checkout.integration_id },
      })
      .eq('id', orderId);

    console.log('Members area access code generated:', accessCode);
    return accessCode;
  } catch (err) {
    console.error('Error in members area integration:', err);
    return null;
  }
}

async function sendAccessCodeEmail(email: string, name: string, accessCode: string, productName: string) {
  try {
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      console.error('RESEND_API_KEY not configured, skipping email');
      return;
    }

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; padding: 30px 0; background: linear-gradient(135deg, #8B5CF6, #6D28D9); border-radius: 12px; margin-bottom: 30px;">
          <h1 style="color: white; margin: 0; font-size: 24px;">🎉 Pagamento Confirmado!</h1>
        </div>
        
        <p style="font-size: 16px; color: #333;">Olá, <strong>${name}</strong>!</p>
        
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
          <p style="font-size: 12px; color: #999;">Este é um email automático, não responda.</p>
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
        from: 'Pagamento Confirmado <onboarding@resend.dev>',
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
