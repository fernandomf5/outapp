import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { action, email, agentId, resetToken, newPassword } = await req.json();

    if (action === "request-reset") {
      // Buscar cliente
      const { data: customer, error: customerError } = await supabaseClient
        .from("agent_customers")
        .select("*")
        .eq("email", email)
        .eq("agent_id", agentId)
        .single();

      if (customerError || !customer) {
        return new Response(
          JSON.stringify({ error: "E-mail não encontrado" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Gerar token de reset
      const token = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

      // Salvar token
      await supabaseClient
        .from("agent_password_resets")
        .insert({
          customer_id: customer.id,
          token,
          expires_at: expiresAt.toISOString(),
        });

      // Buscar nome do agente
      const { data: agent } = await supabaseClient
        .from("ai_agents")
        .select("name")
        .eq("id", agentId)
        .single();

      const resetUrl = `https://outapp.com.br/agent-reset-password/${token}`;

      // Enviar email com link
      await resend.emails.send({
        from: "Out App <noreply@outapp.com.br>",
        to: [email],
        subject: `Redefinir senha - ${agent?.name || "Chat do Agente IA"}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
              .content { background: #f9fafb; padding: 30px; }
              .button { display: inline-block; background: #2563eb; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🔐 Redefinir Senha</h1>
              </div>
              <div class="content">
                <p>Olá, <strong>${customer.name}</strong>!</p>
                <p>Você solicitou a redefinição de senha para o <strong>${agent?.name || "Chat do Agente IA"}</strong>.</p>
                <p>Clique no botão abaixo para criar uma nova senha:</p>
                <a href="${resetUrl}" class="button">Redefinir Senha</a>
                <p style="font-size: 12px; color: #666;">Este link expira em 1 hora.</p>
                <p>Se você não solicitou esta redefinição, ignore este e-mail.</p>
              </div>
            </div>
          </body>
          </html>
        `,
      });

      return new Response(
        JSON.stringify({ success: true, message: "Link de redefinição enviado para o e-mail" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "reset-password") {
      // Verificar token
      const { data: resetRequest, error: resetError } = await supabaseClient
        .from("agent_password_resets")
        .select("*")
        .eq("token", resetToken)
        .gt("expires_at", new Date().toISOString())
        .eq("used", false)
        .single();

      if (resetError || !resetRequest) {
        return new Response(
          JSON.stringify({ error: "Token inválido ou expirado" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Hash da nova senha usando SHA-256
      const encoder = new TextEncoder();
      const data = encoder.encode(newPassword);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const passwordHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      // Atualizar senha
      const { error: updateError } = await supabaseClient
        .from("agent_customers")
        .update({ password_hash: passwordHash })
        .eq("id", resetRequest.customer_id);

      if (updateError) throw updateError;

      // Marcar token como usado
      await supabaseClient
        .from("agent_password_resets")
        .update({ used: true })
        .eq("id", resetRequest.id);

      return new Response(
        JSON.stringify({ success: true, message: "Senha redefinida com sucesso" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Ação inválida" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
