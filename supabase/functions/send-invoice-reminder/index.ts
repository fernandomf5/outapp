import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { invoice_id, is_reminder } = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    if (!resendApiKey) {
      return new Response(JSON.stringify({ error: 'RESEND_API_KEY não configurada' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get invoice data
    const { data: invoice, error: invError } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', invoice_id)
      .single();

    if (invError || !invoice) {
      return new Response(JSON.stringify({ error: 'Fatura não encontrada' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!invoice.client_email) {
      return new Response(JSON.stringify({ error: 'Cliente não tem email cadastrado' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get user profile for sender name
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('user_id', invoice.user_id)
      .single();

    const companyName = invoice.company_name || profile?.full_name || 'Empresa';
    const publicUrl = `${supabaseUrl.replace('.supabase.co', '.supabase.co').replace('https://', 'https://')}`;
    // Build public invoice URL - we use the origin from the invoice or a default
    const invoiceUrl = `https://outapp.lovable.app/fatura/${invoice.public_token}`;
    
    const dueDate = invoice.due_date ? new Date(invoice.due_date + 'T12:00:00').toLocaleDateString('pt-BR') : 'N/A';
    const totalAmount = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(invoice.total_amount || 0);

    const subject = is_reminder 
      ? `⚠️ Lembrete: Fatura ${invoice.invoice_number} - Vencimento ${dueDate}`
      : `📄 Nova Fatura ${invoice.invoice_number} - ${companyName}`;

    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: Arial, sans-serif; background: #f5f5f5; padding: 20px; margin: 0;">
      <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <div style="background: ${invoice.primary_color || '#2563eb'}; padding: 24px; color: white;">
          <h1 style="margin: 0; font-size: 22px;">${is_reminder ? '⚠️ Lembrete de Pagamento' : '📄 Nova Fatura'}</h1>
          <p style="margin: 8px 0 0; opacity: 0.9; font-size: 14px;">Fatura Nº ${invoice.invoice_number}</p>
        </div>
        <div style="padding: 24px;">
          <p style="font-size: 16px; color: #333;">Olá <strong>${invoice.client_name || 'Cliente'}</strong>,</p>
          ${is_reminder 
            ? `<p style="font-size: 14px; color: #666;">Este é um lembrete sobre a fatura pendente com vencimento em <strong>${dueDate}</strong>.</p>`
            : `<p style="font-size: 14px; color: #666;">Segue sua fatura emitida por <strong>${companyName}</strong>.</p>`
          }
          <div style="background: #f8f9fa; border-radius: 8px; padding: 16px; margin: 20px 0;">
            <table style="width: 100%; font-size: 14px;">
              <tr><td style="padding: 6px 0; color: #888;">Fatura:</td><td style="text-align: right; font-weight: bold;">${invoice.invoice_number}</td></tr>
              <tr><td style="padding: 6px 0; color: #888;">Vencimento:</td><td style="text-align: right; font-weight: bold;">${dueDate}</td></tr>
              <tr><td style="padding: 6px 0; color: #888;">Valor:</td><td style="text-align: right; font-weight: bold; color: ${invoice.primary_color || '#2563eb'}; font-size: 18px;">${totalAmount}</td></tr>
            </table>
          </div>
          <a href="${invoiceUrl}" style="display: block; text-align: center; background: ${invoice.primary_color || '#2563eb'}; color: white; padding: 14px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px; margin: 20px 0;">
            Ver Fatura e Pagar
          </a>
          <p style="font-size: 12px; color: #999; text-align: center; margin-top: 20px;">
            Esta é uma mensagem automática enviada por ${companyName}.
          </p>
        </div>
      </div>
    </body>
    </html>`;

    // Send via Resend
    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `${companyName} <onboarding@resend.dev>`,
        to: [invoice.client_email],
        subject,
        html: htmlContent,
      }),
    });

    if (!emailRes.ok) {
      const errText = await emailRes.text();
      console.error('Resend error:', errText);
      return new Response(JSON.stringify({ error: 'Erro ao enviar email: ' + errText }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Update invoice tracking
    const updatePayload: any = {
      reminder_sent: true,
      last_reminder_sent_at: new Date().toISOString(),
    };
    if (!invoice.reminder_sent) {
      updatePayload.reminder_sent_at = new Date().toISOString();
    }

    await supabase.from('invoices').update(updatePayload).eq('id', invoice_id);

    return new Response(JSON.stringify({ success: true, message: 'Email enviado com sucesso' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
