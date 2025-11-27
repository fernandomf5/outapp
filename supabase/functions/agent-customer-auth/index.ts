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

      // Generate verification code (6 digits)
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 minutes

      // Check if customer already exists
      const { data: existing } = await supabase
        .from('agent_customers')
        .select('id')
        .eq('agent_id', agentId)
        .eq('email', email)
        .single();

      let customer;

      if (existing) {
        // Se é acesso privado, verificar se já existe uma solicitação ativa
        if (accessType === 'private') {
          const { data: activeRequest } = await supabase
            .from('agent_access_requests')
            .select('id, status')
            .eq('agent_id', agentId)
            .eq('customer_id', existing.id)
            .in('status', ['pending', 'approved'])
            .single();

          if (activeRequest) {
            const statusMessage = activeRequest.status === 'pending' 
              ? 'Você já possui uma solicitação de acesso pendente'
              : 'Você já possui acesso aprovado a este agente';
            
            return new Response(
              JSON.stringify({ error: statusMessage }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
        } else {
          // Para acesso público, não permitir email duplicado
          return new Response(
            JSON.stringify({ error: 'Email já cadastrado para este agente' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Se chegou aqui, o customer existe mas não tem solicitação ativa
        // Atualizar os dados do customer
        const { data: updatedCustomer, error: updateError } = await supabase
          .from('agent_customers')
          .update({
            name,
            phone,
            password_hash: passwordHash,
          })
          .eq('id', existing.id)
          .select()
          .single();

        if (updateError) throw updateError;
        customer = updatedCustomer;
      } else {
        // Create new customer
        const { data: newCustomer, error: createError } = await supabase
          .from('agent_customers')
          .insert({
            agent_id: agentId,
            name,
            email,
            phone,
            password_hash: passwordHash,
            email_verified: false,
            verification_token: verificationCode,
            verification_token_expires_at: expiresAt,
          })
          .select()
          .single();

        if (createError) throw createError;
        customer = newCustomer;
      }

      // Send verification email
      try {
        const { data: agent } = await supabase
          .from('ai_agents')
          .select('name')
          .eq('id', agentId)
          .single();

        await supabase.functions.invoke('send-verification-email', {
          body: {
            email: customer.email,
            name: customer.name,
            code: verificationCode,
            chatbotName: agent?.name || 'Chat',
          }
        });
      } catch (emailError) {
        console.error('Error sending verification email:', emailError);
      }

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
        JSON.stringify({ 
          customer,
          needsVerification: true 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'verify') {
      const { customerId, code } = await req.json();

      // Get customer
      const { data: customer, error: customerError } = await supabase
        .from('agent_customers')
        .select('*')
        .eq('id', customerId)
        .single();

      if (customerError || !customer) {
        return new Response(
          JSON.stringify({ error: 'Cliente não encontrado' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check verification code
      if (customer.verification_token !== code) {
        return new Response(
          JSON.stringify({ error: 'Código inválido' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check expiration
      if (new Date(customer.verification_token_expires_at) < new Date()) {
        return new Response(
          JSON.stringify({ error: 'Código expirado' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Update customer
      const { error: updateError } = await supabase
        .from('agent_customers')
        .update({
          email_verified: true,
          verification_token: null,
          verification_token_expires_at: null,
        })
        .eq('id', customerId);

      if (updateError) throw updateError;

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'resend') {
      const { customerId } = await req.json();

      // Get customer
      const { data: customer, error: customerError } = await supabase
        .from('agent_customers')
        .select('*')
        .eq('id', customerId)
        .single();

      if (customerError || !customer) {
        return new Response(
          JSON.stringify({ error: 'Cliente não encontrado' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Generate new code
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

      // Update customer
      const { error: updateError } = await supabase
        .from('agent_customers')
        .update({
          verification_token: verificationCode,
          verification_token_expires_at: expiresAt,
        })
        .eq('id', customerId);

      if (updateError) throw updateError;

      // Send verification email
      try {
        const { data: agent } = await supabase
          .from('ai_agents')
          .select('name')
          .eq('id', customer.agent_id)
          .single();

        await supabase.functions.invoke('send-verification-email', {
          body: {
            email: customer.email,
            name: customer.name,
            code: verificationCode,
            chatbotName: agent?.name || 'Chat',
          }
        });
      } catch (emailError) {
        console.error('Error sending verification email:', emailError);
      }

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'login') {
      // Para acesso privado, verifica email e status de acesso
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

        // Verificar se o acesso está aprovado e ativo
        const { data: accessRequest, error: accessError } = await supabase
          .from('agent_access_requests')
          .select('*')
          .eq('agent_id', agentId)
          .eq('customer_id', customer.id)
          .eq('status', 'approved')
          .eq('is_active', true)
          .single();

        if (accessError || !accessRequest) {
          return new Response(
            JSON.stringify({ error: 'Acesso não autorizado ou desabilitado' }),
            { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Verificar se o acesso expirou
        if (accessRequest.expires_at && new Date(accessRequest.expires_at) < new Date()) {
          return new Response(
            JSON.stringify({ error: 'Acesso expirado. Solicite novo acesso.' }),
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

      // First, check if email exists
      const { data: emailCheck } = await supabase
        .from('agent_customers')
        .select('id')
        .eq('agent_id', agentId)
        .eq('email', email)
        .single();

      if (!emailCheck) {
        return new Response(
          JSON.stringify({ error: 'Email incorreto' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Then verify password
      const { data: customer, error: findError } = await supabase
        .from('agent_customers')
        .select('*')
        .eq('agent_id', agentId)
        .eq('email', email)
        .eq('password_hash', passwordHash)
        .single();

      if (findError || !customer) {
        return new Response(
          JSON.stringify({ error: 'Senha incorreta' }),
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