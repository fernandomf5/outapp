import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend("re_aeSpFypm_Fjcf1EKx2F65FmUaFMW1RiHG");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface VerificationEmailRequest {
  email: string;
  name: string;
  code: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, name, code }: VerificationEmailRequest = await req.json();

    console.log("Sending verification email to:", email);

    const emailResponse = await resend.emails.send({
      from: "Chat Online <onboarding@resend.dev>",
      to: [email],
      subject: "Verifique seu e-mail - Chat Online",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .container {
              background-color: #ffffff;
              border-radius: 8px;
              padding: 40px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            h1 {
              color: #2563eb;
              margin-bottom: 20px;
              font-size: 24px;
            }
            .code-box {
              background-color: #f3f4f6;
              border: 2px solid #2563eb;
              border-radius: 8px;
              padding: 20px;
              text-align: center;
              margin: 30px 0;
            }
            .code {
              font-size: 32px;
              font-weight: bold;
              letter-spacing: 8px;
              color: #2563eb;
              font-family: 'Courier New', monospace;
            }
            .footer {
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #e5e7eb;
              font-size: 14px;
              color: #6b7280;
            }
            .warning {
              background-color: #fef3c7;
              border-left: 4px solid #f59e0b;
              padding: 12px;
              margin: 20px 0;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>🔐 Verificação de E-mail</h1>
            <p>Olá, <strong>${name}</strong>!</p>
            <p>Obrigado por se cadastrar no nosso Chat Online. Para concluir seu cadastro, use o código de verificação abaixo:</p>
            
            <div class="code-box">
              <div class="code">${code}</div>
            </div>

            <div class="warning">
              ⏰ Este código expira em 15 minutos.
            </div>

            <p>Se você não solicitou este cadastro, pode ignorar este e-mail com segurança.</p>

            <div class="footer">
              <p>Este é um e-mail automático, por favor não responda.</p>
              <p>© ${new Date().getFullYear()} Chat Online - Todos os direitos reservados.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-verification-email function:", error);
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
