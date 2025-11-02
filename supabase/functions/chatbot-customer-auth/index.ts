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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { action, chatbotId, email, password, name, phone, accessType } = await req.json();

    if (action === 'register') {
      // Hash password
      const encoder = new TextEncoder();
      const data = encoder.encode(password);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const passwordHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      // Check if customer already exists
      const { data: existing } = await supabase
        .from('chatbot_customers')
        .select('id')
        .eq('chatbot_id', chatbotId)
        .eq('email', email)
        .single();

      if (existing) {
        return new Response(
          JSON.stringify({ error: 'Email já cadastrado para este chatbot' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Create customer (not verified yet for public access)
      const { data: customer, error: createError } = await supabase
        .from('chatbot_customers')
        .insert({
          chatbot_id: chatbotId,
          name,
          email,
          phone,
          password_hash: passwordHash,
          email_verified: false,
        })
        .select()
        .single();

      if (createError) throw createError;

      // Generate 6-digit verification code
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

      // Store verification code
      const { error: codeError } = await supabase
        .from('chatbot_customer_verification_codes')
        .insert({
          customer_id: customer.id,
          code: verificationCode,
          expires_at: expiresAt.toISOString(),
        });

      if (codeError) {
        console.error('Error creating verification code:', codeError);
        throw codeError;
      }

      // Send verification email
      try {
        const { error: emailError } = await supabase.functions.invoke('send-verification-email', {
          body: {
            email: customer.email,
            name: customer.name,
            code: verificationCode,
          }
        });

        if (emailError) {
          console.error('Error sending verification email:', emailError);
        }
      } catch (emailError) {
        console.error('Failed to send verification email:', emailError);
      }

      // If restricted access, create access request
      if (accessType === 'restricted') {
        const { error: requestError } = await supabase
          .from('chatbot_access_requests')
          .insert({
            chatbot_id: chatbotId,
            customer_id: customer.id,
            status: 'pending',
          });

        if (requestError) console.error('Error creating access request:', requestError);

        // Create notification for chatbot owner
        const { data: chatbot } = await supabase
          .from('chatbots')
          .select('user_id, name')
          .eq('id', chatbotId)
          .single();

        if (chatbot) {
          await supabase
            .from('chatbot_notifications')
            .insert({
              chatbot_id: chatbotId,
              type: 'access_request',
              title: 'Nova Solicitação de Acesso',
              message: `${customer.name} solicitou acesso ao chatbot ${chatbot.name}`,
            });
        }
      }

      return new Response(
        JSON.stringify({ customer, needsVerification: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'login') {
      // Hash password for comparison
      const encoder = new TextEncoder();
      const data = encoder.encode(password);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const passwordHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      // Find customer
      const { data: customer, error: findError } = await supabase
        .from('chatbot_customers')
        .select('*')
        .eq('chatbot_id', chatbotId)
        .eq('email', email)
        .eq('password_hash', passwordHash)
        .single();

      if (findError || !customer) {
        return new Response(
          JSON.stringify({ error: 'Email ou senha incorretos' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check if email is verified (only for public access)
      if (!customer.email_verified && accessType === 'public') {
        return new Response(
          JSON.stringify({ error: 'Email não verificado. Por favor, verifique seu e-mail primeiro.' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Update last login
      await supabase
        .from('chatbot_customers')
        .update({ last_login_at: new Date().toISOString() })
        .eq('id', customer.id);

      return new Response(
        JSON.stringify({ customer }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'verify') {
      const { customerId, code } = await req.json();

      // Find valid verification code
      const { data: verificationCode, error: codeError } = await supabase
        .from('chatbot_customer_verification_codes')
        .select('*')
        .eq('customer_id', customerId)
        .eq('code', code)
        .eq('verified', false)
        .single();

      if (codeError || !verificationCode) {
        return new Response(
          JSON.stringify({ error: 'Código de verificação inválido' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check if code is expired
      const now = new Date();
      const expiresAt = new Date(verificationCode.expires_at);
      
      if (now > expiresAt) {
        return new Response(
          JSON.stringify({ error: 'Código de verificação expirado. Solicite um novo código.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Mark code as verified
      await supabase
        .from('chatbot_customer_verification_codes')
        .update({ verified: true })
        .eq('id', verificationCode.id);

      // Mark customer email as verified
      const { data: customer, error: updateError } = await supabase
        .from('chatbot_customers')
        .update({ email_verified: true })
        .eq('id', customerId)
        .select()
        .single();

      if (updateError) throw updateError;

      return new Response(
        JSON.stringify({ customer, verified: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'resend') {
      const { customerId } = await req.json();

      // Get customer data
      const { data: customer, error: customerError } = await supabase
        .from('chatbot_customers')
        .select('*')
        .eq('id', customerId)
        .single();

      if (customerError || !customer) {
        return new Response(
          JSON.stringify({ error: 'Cliente não encontrado' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Generate new verification code
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

      // Store new verification code
      const { error: codeError } = await supabase
        .from('chatbot_customer_verification_codes')
        .insert({
          customer_id: customer.id,
          code: verificationCode,
          expires_at: expiresAt.toISOString(),
        });

      if (codeError) throw codeError;

      // Send verification email
      try {
        await supabase.functions.invoke('send-verification-email', {
          body: {
            email: customer.email,
            name: customer.name,
            code: verificationCode,
          }
        });
      } catch (emailError) {
        console.error('Failed to send verification email:', emailError);
      }

      return new Response(
        JSON.stringify({ success: true, message: 'Novo código enviado' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Ação inválida' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
