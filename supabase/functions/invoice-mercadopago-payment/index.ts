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

    const { invoice_id, public_token } = await req.json();

    if (!invoice_id && !public_token) {
      throw new Error('invoice_id ou public_token é obrigatório');
    }

    // Buscar fatura
    let query = supabase.from('invoices').select('*');
    if (invoice_id) {
      query = query.eq('id', invoice_id);
    } else {
      query = query.eq('public_token', public_token);
    }
    const { data: invoice, error: invError } = await query.single();

    if (invError || !invoice) {
      throw new Error('Fatura não encontrada');
    }

    if (invoice.status === 'paid') {
      throw new Error('Fatura já foi paga');
    }

    // Se já tem checkout URL, retorna
    if (invoice.mercadopago_checkout_url) {
      return new Response(
        JSON.stringify({ checkout_url: invoice.mercadopago_checkout_url, preference_id: invoice.mercadopago_preference_id }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Buscar access token do Mercado Pago
    const accessToken = Deno.env.get('MERCADOPAGO_ACCESS_TOKEN');
    
    if (!accessToken) {
      // Tentar buscar de site_settings como fallback
      const { data: mpSettings } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'mercadopago_access_token')
        .single();

      if (!mpSettings?.value) {
        throw new Error('Mercado Pago não configurado. Configure o Access Token nas configurações.');
      }
    }

    const mpToken = accessToken || (await supabase.from('site_settings').select('value').eq('key', 'mercadopago_access_token').single()).data?.value;

    // Montar itens
    const items = (invoice.items as any[]) || [];
    const mpItems = items.map((item: any) => ({
      title: item.description || 'Serviço',
      quantity: item.quantity || 1,
      unit_price: Number(item.unit_price) || 0,
      currency_id: 'BRL',
    }));

    // Se tem desconto, adicionar como item negativo ou ajustar
    if (invoice.discount_amount > 0) {
      mpItems.push({
        title: 'Desconto',
        quantity: 1,
        unit_price: -Number(invoice.discount_amount),
        currency_id: 'BRL',
      });
    }

    const siteUrl = Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '').includes('mlocikcfxbleddsvxciv') 
      ? 'https://outapp.com.br' 
      : 'https://outapp.lovable.app';

    // Criar preferência no Mercado Pago
    const preference = {
      items: mpItems,
      payer: {
        email: invoice.client_email || 'cliente@email.com',
        name: invoice.client_name || 'Cliente',
      },
      back_urls: {
        success: `${siteUrl}/fatura/${invoice.public_token}?payment=success`,
        failure: `${siteUrl}/fatura/${invoice.public_token}?payment=failure`,
        pending: `${siteUrl}/fatura/${invoice.public_token}?payment=pending`,
      },
      auto_return: 'all',
      notification_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/invoice-mercadopago-webhook`,
      external_reference: invoice.id,
      metadata: {
        invoice_id: invoice.id,
        invoice_number: invoice.invoice_number,
        public_token: invoice.public_token,
      },
    };

    console.log('Criando preferência MP para fatura:', invoice.invoice_number);

    const mpResponse = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${mpToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(preference),
    });

    if (!mpResponse.ok) {
      const errorText = await mpResponse.text();
      console.error('Erro MP:', errorText);
      throw new Error(`Erro ao criar preferência: ${errorText}`);
    }

    const mpData = await mpResponse.json();

    // Salvar na fatura
    await supabase.from('invoices').update({
      mercadopago_preference_id: mpData.id,
      mercadopago_checkout_url: mpData.init_point,
    }).eq('id', invoice.id);

    console.log('Preferência MP criada:', mpData.id);

    return new Response(
      JSON.stringify({ checkout_url: mpData.init_point, preference_id: mpData.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
