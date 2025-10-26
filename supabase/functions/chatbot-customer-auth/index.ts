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

      // Create customer
      const { data: customer, error: createError } = await supabase
        .from('chatbot_customers')
        .insert({
          chatbot_id: chatbotId,
          name,
          email,
          phone,
          password_hash: passwordHash,
        })
        .select()
        .single();

      if (createError) throw createError;

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
        JSON.stringify({ customer }),
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
