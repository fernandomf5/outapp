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
    const { agentId, customerId, customerName, customerEmail } = await req.json();
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
      // Create lightweight customer (name only, no registration required)
      const anonName = customerName || 'Visitante';
      const anonEmail = (customerEmail && String(customerEmail).trim())
        ? String(customerEmail).trim().toLowerCase()
        : `anon_${Date.now()}@temp.com`;

      // Generate a password hash placeholder for anonymous customers
      const encoder = new TextEncoder();
      const randomSeed = `${customerId}:${Date.now()}:${Math.random()}`;
      const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(randomSeed));
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const passwordHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      const insertCustomer = (email: string) => supabase
        .from('agent_customers')
        .insert({
          id: customerId,
          agent_id: agentId,
          name: anonName,
          email,
          password_hash: passwordHash,
          email_verified: false,
        });

      let { error: createCustomerError } = await insertCustomer(anonEmail);
      if (createCustomerError) {
        // Provável conflito de e-mail duplicado: cria sessão nova com e-mail único
        const [local, domain] = anonEmail.split('@');
        const fallbackEmail = `${local}+${Date.now()}@${domain || 'temp.com'}`;
        const retry = await insertCustomer(fallbackEmail);
        createCustomerError = retry.error;
      }
      if (createCustomerError) {
        console.error('Error creating customer:', createCustomerError);
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
    let queuePosition: number | null = null;
    const agentCfg = (agent.config ?? {}) as Record<string, unknown>;
    const queueEnabled = agentCfg.queueEnabled === true;
    const queueAhead = Number(agentCfg.queueAhead ?? 0) || 0;
    const activeConv = conversations?.find((c: any) => c.status === 'active');

    if (activeConv) {
      conversationId = activeConv.id;
      queuePosition = activeConv.queue_position ?? null;
    } else {
      // Calcula a posição na fila: depois de quem já está esperando
      if (queueEnabled) {
        const { data: waiting } = await supabase
          .from('agent_conversations')
          .select('queue_position')
          .eq('agent_id', agentId)
          .eq('status', 'active')
          .not('queue_position', 'is', null)
          .order('queue_position', { ascending: false })
          .limit(1);

        const maxPos = Number(waiting?.[0]?.queue_position ?? 0) || 0;
        queuePosition = Math.max(maxPos, queueAhead) + 1;
      }

      // Atendimento 100% humano: nunca habilitar respostas automáticas
      const { data: newConv, error: newConvError } = await supabase
        .from('agent_conversations')
        .insert({
          agent_id: agentId,
          customer_id: customerId,
          status: 'active',
          ai_enabled: false,
          queue_position: queuePosition,
          last_message_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (newConvError || !newConv) throw newConvError || new Error('Falha ao criar conversa');
      conversationId = newConv.id;
    }


    // Load messages for this conversation
    const { data: messages, error: msgError } = await supabase
      .from('agent_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (msgError) throw msgError;

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
        queuePosition,
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
