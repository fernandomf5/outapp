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

    const { action, agentId, email, password, name, phone, accessType } = await req.json();

    if (action === 'register') {
      // Hash password (apenas para acesso não privado)
      let passwordHash = null;
      if (accessType !== 'private' && password) {
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        passwordHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      }

      // Check if customer already exists
      const { data: existing } = await supabase
        .from('agent_customers')
        .select('id')
        .eq('agent_id', agentId)
        .eq('email', email)
        .single();

      if (existing) {
        return new Response(
          JSON.stringify({ error: 'Email já cadastrado para este agente' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Create customer
      const { data: customer, error: createError } = await supabase
        .from('agent_customers')
        .insert({
          agent_id: agentId,
          name,
          email,
          phone,
          password_hash: passwordHash,
        })
        .select()
        .single();

      if (createError) throw createError;

      // If private access, create access request
      if (accessType === 'private') {
        const { error: requestError } = await supabase
          .from('agent_access_requests')
          .insert({
            agent_id: agentId,
            customer_id: customer.id,
            status: 'pending',
          });

        if (requestError) console.error('Error creating access request:', requestError);

        // Create notification for agent owner
        const { data: agent } = await supabase
          .from('ai_agents')
          .select('user_id, name')
          .eq('id', agentId)
          .single();

        if (agent) {
          await supabase
            .from('agent_notifications')
            .insert({
              agent_id: agentId,
              notification_type: 'access_request',
              title: 'Nova Solicitação de Acesso',
              message: `${customer.name} solicitou acesso ao agente ${agent.name}`,
              reference_id: customer.id,
            });
        }
      }

      return new Response(
        JSON.stringify({ customer }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'login') {
      // Para acesso privado, apenas verifica email
      if (accessType === 'private') {
        const { data: customer, error: findError } = await supabase
          .from('agent_customers')
          .select('*')
          .eq('agent_id', agentId)
          .eq('email', email)
          .single();

        if (findError || !customer) {
          return new Response(
            JSON.stringify({ error: 'Email não encontrado' }),
            { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Update last login
        await supabase
          .from('agent_customers')
          .update({ last_login_at: new Date().toISOString() })
          .eq('id', customer.id);

        return new Response(
          JSON.stringify({ customer }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Para acesso público, verifica email e senha
      const encoder = new TextEncoder();
      const data = encoder.encode(password);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const passwordHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      // Find customer
      const { data: customer, error: findError } = await supabase
        .from('agent_customers')
        .select('*')
        .eq('agent_id', agentId)
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
        .from('agent_customers')
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