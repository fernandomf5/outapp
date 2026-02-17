import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    if (!RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY not configured');
    }

    const { to, clientName, receiptNumber, total, companyName, pdfBase64 } = await req.json();

    if (!to || !pdfBase64) {
      throw new Error('Missing required fields: to, pdfBase64');
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: `${companyName || 'Empresa'} <onboarding@resend.dev>`,
        to: [to],
        subject: `Recibo ${receiptNumber} - ${total}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">Recibo ${receiptNumber}</h2>
            <p>Olá ${clientName || 'Cliente'},</p>
            <p>Segue em anexo o recibo no valor de <strong>${total}</strong>.</p>
            <p>Qualquer dúvida, entre em contato conosco.</p>
            <br/>
            <p>Atenciosamente,<br/><strong>${companyName || 'Empresa'}</strong></p>
          </div>
        `,
        attachments: [
          {
            filename: `recibo-${receiptNumber}.pdf`,
            content: pdfBase64,
          }
        ],
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || 'Failed to send email');
    }

    return new Response(JSON.stringify({ success: true, data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error sending receipt email:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
