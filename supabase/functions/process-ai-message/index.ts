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

    const { chatbotId, conversationId, customerId, message } = await req.json();

    if (!chatbotId || !conversationId || !message) {
      return new Response(
        JSON.stringify({ error: 'Parâmetros inválidos' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Buscar informações do chatbot
    const { data: chatbot, error: chatbotError } = await supabase
      .from('chatbots')
      .select('id, name, description, config')
      .eq('id', chatbotId)
      .maybeSingle();

    if (chatbotError) throw chatbotError;

    // Buscar informações do cliente (se houver)
    let customer: any = null;
    if (customerId) {
      const { data: cst } = await supabase
        .from('chatbot_customers')
        .select('*')
        .eq('id', customerId)
        .maybeSingle();
      customer = cst;
    }

    // Histórico da conversa
    const { data: history } = await supabase
      .from('chatbot_messages')
      .select('role, content')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    const conversationHistory = (history || []).map((m) => ({
      role: m.role === 'user' ? 'user' : 'assistant',
      content: m.content,
    }));

    // Prompt do sistema
    const systemPrompt = `Você é o assistente virtual do chatbot "${chatbot?.name || 'Assistente'}".
${chatbot?.description ? `Descrição do bot: ${chatbot.description}` : ''}

Seja prestativo, objetivo e educado. Se necessário, use listas curtas. Respostas em PT-BR.

CAPACIDADES ESPECIAIS:
1. AGENDAMENTOS: Quando o usuário solicitar um agendamento, responda com o marcador: [AGENDAR|nome_servico|data_hora_iso|observacoes]
2. PEDIDOS: Quando o usuário solicitar um pedido/compra, responda com o marcador: [PEDIDO|total]
- total deve ser um número (ex: 199.90).`;

    // Chamada à IA via Lovable Gateway
    let aiText = '';
    if (lovableApiKey) {
      const aiRes = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
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
            { role: 'user', content: message },
          ],
        }),
      });
      const aiData = await aiRes.json();
    
      aiText = aiData?.choices?.[0]?.message?.content || 'Certo! Como posso ajudar?' ;
    } else {
      aiText = 'Certo! Como posso ajudar?';
    }

    let finalResponse = aiText;
    let appointment: any = null;
    let order: any = null;

    // Processar comando de agendamento
    if (aiText.includes('[AGENDAR|')) {
      const match = aiText.match(/\[AGENDAR\|(.*?)\|(.*?)\|(.*?)\]/);
      if (match) {
        const [, serviceName, dateTimeIso, notes] = match;

        const { data: newAppt } = await supabase
          .from('chatbot_appointments')
          .insert({
            chatbot_id: chatbotId,
            customer_id: customerId,
            date: dateTimeIso,
            status: 'pending',
            notes,
          })
          .select()
          .single();

        appointment = newAppt;
        finalResponse = finalResponse.replace(/\[AGENDAR\|.*?\]/, '').trim();
      }
    }

    // Processar comando de pedido
    if (aiText.includes('[PEDIDO|')) {
      const match = aiText.match(/\[PEDIDO\|(.*?)\]/);
      if (match) {
        const totalStr = match[1];
        const total = Number(totalStr);

        const { data: newOrder } = await supabase
          .from('chatbot_orders')
          .insert({
            chatbot_id: chatbotId,
            customer_id: customerId,
            total: isNaN(total) ? 0 : total,
            status: 'pending',
          })
          .select()
          .single();

        order = newOrder;
        finalResponse = finalResponse.replace(/\[PEDIDO\|.*?\]/, '').trim();
      }
    }

    return new Response(
      JSON.stringify({ response: finalResponse, appointment, order }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Erro em process-ai-message:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});