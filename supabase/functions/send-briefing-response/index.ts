import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BriefingResponseRequest {
  briefingTitle: string;
  visitorName: string;
  destinationEmail: string;
  responses: Record<string, any>;
  fields: Array<{ label: string; type: string }>;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { briefingTitle, visitorName, destinationEmail, responses, fields }: BriefingResponseRequest = await req.json();

    console.log("Sending briefing response to:", destinationEmail);
    console.log("Briefing:", briefingTitle);
    console.log("Visitor:", visitorName);

    // Build HTML content for the email
    let responsesHtml = '';
    for (const field of fields) {
      const value = responses[field.label];
      if (value !== undefined && value !== null && value !== '') {
        let displayValue = value;
        
        // Handle different field types
        if (field.type === 'checkbox') {
          displayValue = value === true ? 'Sim' : 'Não';
        } else if (field.type === 'rating') {
          displayValue = `${value} de 5 estrelas`;
        } else if (field.type === 'file' && typeof value === 'string' && value.startsWith('http')) {
          displayValue = `<a href="${value}" target="_blank" style="color: #6366f1;">Ver arquivo</a>`;
        }
        
        responsesHtml += `
          <tr>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; font-weight: 600; color: #374151; width: 40%;">
              ${field.label}
            </td>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; color: #4b5563;">
              ${displayValue}
            </td>
          </tr>
        `;
      }
    }

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f3f4f6;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #6366f1, #ec4899); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Nova Resposta de Briefing</h1>
          </div>
          <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
              <p style="margin: 0; color: #64748b; font-size: 14px;">Briefing</p>
              <p style="margin: 5px 0 0 0; color: #1e293b; font-size: 18px; font-weight: 600;">${briefingTitle}</p>
            </div>
            <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin-bottom: 25px;">
              <p style="margin: 0; color: #64748b; font-size: 14px;">Enviado por</p>
              <p style="margin: 5px 0 0 0; color: #1e293b; font-size: 18px; font-weight: 600;">${visitorName}</p>
            </div>
            <h2 style="color: #1e293b; font-size: 18px; margin-bottom: 15px; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">Respostas</h2>
            <table style="width: 100%; border-collapse: collapse;">
              ${responsesHtml}
            </table>
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                Este email foi enviado automaticamente pelo sistema de briefings.
              </p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const emailResponse = await resend.emails.send({
      from: "Out App <noreply@outapp.com.br>",
      to: [destinationEmail],
      subject: `Nova resposta de briefing: ${briefingTitle}`,
      html: emailHtml,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-briefing-response function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
