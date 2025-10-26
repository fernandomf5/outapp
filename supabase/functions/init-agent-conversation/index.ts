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
    const { agentId, customerId } = await req.json();
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Load agent (server-side to bypass RLS for public access)
    const { data: agent, error: agentError } = await supabase
      .from('ai_agents')
      .select('id, name, config, is_active, access_type')
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
      const { data: newConv, error: newConvError } = await supabase
        .from('agent_conversations')
        .insert({
          agent_id: agentId,
          customer_id: customerId,
          status: 'active',
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
        agent: { id: agent.id, name: agent.name, config: agent.config },
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
