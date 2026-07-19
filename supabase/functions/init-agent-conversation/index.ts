import "https://deno.land/x/xhr@0.1.0/mod.ts";
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
    const { agentId, customerId, customerName } = await req.json();
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Load agent (server-side to bypass RLS for public access)
    const { data: agent, error: agentError } = await supabase
      .from('ai_agents')
      .select('id, name, config, is_active, access_type, attendant_status, attendant_name')
      .eq('id', agentId)
      .single();

    if (agentError || !agent) {
      throw new Error('Agente não encontrado');
    }

    if (agent.is_active === false) {
      return new Response(JSON.stringify({ error: 'Agente inativo' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Ensure customer exists or create anonymous if allowed
    const { data: existingCustomer, error: customerCheckError } = await supabase
      .from('agent_customers')
      .select('id, agent_id')
      .eq('id', customerId)
      .eq('agent_id', agentId)
      .maybeSingle();

    if (customerCheckError) {
      console.error('Error checking customer:', customerCheckError);
    }

    if (!existingCustomer) {
      const access = (agent.access_type || '').toString().toLowerCase();
      const isRestricted = access === 'restricted' || access === 'private' || access === 'privado' || access === 'acesso_privado';
      if (isRestricted) {
        return new Response(JSON.stringify({ error: 'Agente requer autenticação' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      // Create anonymous/customer placeholder so FK is satisfied
      const anonName = customerName || 'Visitante';
      const anonEmail = `anon_${Date.now()}@temp.com`;

      // Generate a password hash placeholder for anonymous customers
      const encoder = new TextEncoder();
      const randomSeed = `${customerId}:${Date.now()}:${Math.random()}`;
      const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(randomSeed));
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const passwordHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      const { error: createCustomerError } = await supabase
        .from('agent_customers')
        .insert({
          id: customerId,
          agent_id: agentId,
          name: anonName,
          email: anonEmail,
          password_hash: passwordHash,
          email_verified: false,
        });
      if (createCustomerError) {
        console.error('Error creating anonymous customer:', createCustomerError);
        throw new Error('Falha ao preparar sessão do cliente');
      }
    }

    // Find existing conversation
    const { data: conversations, error: convError } = await supabase
      .from('agent_conversations')
      .select('*')
      .eq('agent_id', agentId)
      .eq('customer_id', customerId)
      .order('last_message_at', { ascending: false });

    if (convError) throw convError;

    let conversationId: string;
    let activeConv = conversations?.find((c: any) => c.status === 'active');

    if (activeConv) {
      conversationId = activeConv.id;
    } else {
      // Check if AI or flows are enabled in agent config
      const agentConfig = agent.config || {};
      const flowsEnabled = agentConfig.flows_enabled !== false;
      const aiEnabled = flowsEnabled; // Ativa IA/Fluxo se estiver habilitado na config do agente
      
      const { data: newConv, error: newConvError } = await supabase
        .from('agent_conversations')
        .insert({
          agent_id: agentId,
          customer_id: customerId,
          status: 'active',
          ai_enabled: aiEnabled,
          last_message_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (newConvError || !newConv) throw newConvError || new Error('Falha ao criar conversa');
      conversationId = newConv.id;
    }

    // Load messages for this conversation
    let { data: messages, error: msgError } = await supabase
      .from('agent_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (msgError) throw msgError;

    // Disparar gatilho inicial se for uma conversa nova ou se não houver mensagens
    const messageCount = (messages || []).length;
    console.log(`Conversa carregada com ${messageCount} mensagens.`);
    
    if (messageCount === 0) {
      console.log('Disparando gatilho inicial para nova conversa...');
      
      // Chamada await para processar o gatilho inicial e retornar a primeira mensagem
      const processUrl = `${supabaseUrl}/functions/v1/process-agent-customer-message`;
      try {
        await fetch(processUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            agentId,
            customerId,
            conversationId,
            message: '' // Mensagem vazia sinaliza gatilho inicial
          })
        });

        // Recarregar mensagens após o processamento
        const { data: refreshedMessages } = await supabase
          .from('agent_messages')
          .select('*')
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: true });
        
        if (refreshedMessages) {
          messages = refreshedMessages;
        }
      } catch (err) {
        console.error('Erro ao disparar gatilho inicial:', err);
      }
    }

    return new Response(
      JSON.stringify({
        agent: { 
          id: agent.id, 
          name: agent.name, 
          config: agent.config,
          access_type: agent.access_type,
          attendant_status: agent.attendant_status || 'offline',
          attendant_name: agent.attendant_name
        },
        conversationId,
        messages: messages || [],
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('init-agent-conversation error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
