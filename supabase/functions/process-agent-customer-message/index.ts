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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { agentId, customerId, conversationId, message } = await req.json();

    // Get agent config
    const { data: agent } = await supabase
      .from('ai_agents')
      .select('*')
      .eq('id', agentId)
      .single();

    if (!agent) {
      throw new Error('Agente não encontrado');
    }

    // Check if AI is enabled for this conversation
    const { data: conversation } = await supabase
      .from('agent_conversations')
      .select('ai_enabled')
      .eq('id', conversationId)
      .single();

    // If AI is disabled (human attendant is handling), skip AI processing
    if (conversation && !conversation.ai_enabled) {
      return new Response(
        JSON.stringify({ response: '' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get customer info (tolerate anonymous/no-record sessions)
    const { data: customerRecord } = await supabase
      .from('agent_customers')
      .select('*')
      .eq('id', customerId)
      .maybeSingle();

    const customerSafe = customerRecord || {
      id: customerId,
      name: 'Visitante',
      email: 'anon@temp.local',
      phone: null
    };

    // Get conversation history (user message already saved by frontend)
    const { data: prevMessages } = await supabase
      .from('agent_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    await supabase
      .from('agent_conversations')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', conversationId);

    // Build context for AI including latest user message
    const conversationHistory = (prevMessages || []).map((m: any) => ({
      role: m.role === 'customer' ? 'user' : 'assistant',
      content: m.content
    }));

    // Enhanced system prompt - RESPOSTAS CURTAS E DIRETAS
    const systemPrompt = `Você é um assistente virtual especializado em ${agent.niche}.
Nome do cliente: ${customerSafe.name}

${agent.training_data?.knowledge || ''}

REGRAS OBRIGATÓRIAS:
1. RESPOSTAS CURTAS: Máximo 2-3 frases por resposta. Seja direto e objetivo.
2. NÃO use textos longos ou explicações extensas.
3. Para agendamentos/pedidos: informe sobre os botões "Agendar" ou "Fazer Pedido" no chat.
4. Seja simpático mas conciso.
5. NUNCA escreva parágrafos longos.`;

    // Call AI
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          ...conversationHistory,
          { role: 'user', content: message }
        ],
      }),
    });

    const aiData = await aiResponse.json();
    const responseText = aiData.choices[0].message.content;

    // Save AI response to database directly (no more automatic processing)
    if (responseText.trim()) {
      await supabase.from('agent_messages').insert({
        conversation_id: conversationId,
        role: 'agent',
        content: responseText.trim(),
        sender_name: agent.name
      });
    }

    return new Response(
      JSON.stringify({
        response: responseText.trim()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});