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

    // Get conversation history (after ensuring user message will be appended)
    const { data: prevMessages } = await supabase
      .from('agent_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    // Save user message (server-side)
    const { data: savedUserMessage } = await supabase
      .from('agent_messages')
      .insert({ conversation_id: conversationId, role: 'customer', content: message })
      .select()
      .single();

    await supabase
      .from('agent_conversations')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', conversationId);

    // Build context for AI including latest user message
    const conversationHistory = (prevMessages || []).map((m: any) => ({
      role: m.role === 'customer' ? 'user' : 'assistant',
      content: m.content
    }));
    conversationHistory.push({ role: 'user', content: message });

    // Enhanced system prompt
    const systemPrompt = `Você é um assistente virtual especializado em ${agent.niche}.
Nome do cliente: ${customerSafe.name}
Email: ${customerSafe.email}
${customerSafe.phone ? `Telefone: ${customerSafe.phone}` : ''}

${agent.training_data?.knowledge || ''}

IMPORTANTE - CAPACIDADES:
1. AGENDAMENTOS: Você pode agendar serviços. Quando o cliente quiser agendar, extraia:
   - Nome do serviço
   - Data e hora desejada
   - Observações
   Responda no formato: [AGENDAR|nome_servico|data_hora_iso|observacoes]

2. PEDIDOS: Você pode processar pedidos. Quando o cliente fizer um pedido, extraia:
   - Itens do pedido (nome, quantidade, preço)
   - Endereço de entrega (se aplicável)
   - Observações
   Responda no formato: [PEDIDO|items_json|endereco|observacoes|total]

Seja profissional, atencioso e eficiente.`;

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

    // Process special commands
    let finalResponse = responseText;
    let appointment = null;
    let order = null;

    // Check for appointment
    if (responseText.includes('[AGENDAR|')) {
      const match = responseText.match(/\[AGENDAR\|(.*?)\|(.*?)\|(.*?)\]/);
      if (match) {
        const [, serviceName, dateTime, notes] = match;
        
        // Create appointment with pending_approval status
        const { data: newAppointment, error: appointmentError } = await supabase
          .from('agent_appointments')
          .insert({
            agent_id: agentId,
            customer_id: customerId,
            conversation_id: conversationId,
            service_name: serviceName,
            scheduled_date: dateTime,
            customer_notes: notes,
            status: 'pending'
          })
          .select()
          .single();

        if (appointmentError || !newAppointment) {
          console.error('Error creating appointment:', appointmentError);
          throw new Error('Erro ao criar agendamento');
        }

        appointment = newAppointment;
        
        // Create pending confirmation message
        const formattedDate = new Date(dateTime).toLocaleString('pt-BR');
        const pendingMsg = `\n\n⏳ *Dados enviados, esperando resposta...*\n\n📋 *Serviço:* ${serviceName}\n📅 *Data/Hora:* ${formattedDate}\n👤 *Nome:* ${customerSafe.name}\n📧 *Email:* ${customerSafe.email}\n${customerSafe.phone ? `📱 *Telefone:* ${customerSafe.phone}` : ''}\n${notes ? `📝 *Observações:* ${notes}` : ''}\n\n*Aguarde a confirmação do agendamento.*`;
        
        // Save pending message
        await supabase.from('agent_messages').insert({
          conversation_id: conversationId,
          role: 'assistant',
          content: pendingMsg,
          sender_name: 'Sistema'
        });

        // Create notification for agent owner
        await supabase.from('agent_notifications').insert({
          agent_id: agentId,
          notification_type: 'new_appointment',
          title: 'Novo Agendamento',
          message: `${customerSafe.name} solicitou agendamento de ${serviceName}`,
          reference_id: newAppointment.id,
          is_read: false
        });
        
        finalResponse = responseText.replace(/\[AGENDAR\|.*?\]/, pendingMsg);
      }
    }

    // Check for order
    if (responseText.includes('[PEDIDO|')) {
      const match = responseText.match(/\[PEDIDO\|(.*?)\|(.*?)\|(.*?)\|(.*?)\]/);
      if (match) {
        const [, itemsJson, address, notes, total] = match;
        
        // Generate order number
        const orderNumber = `ORD-${Date.now()}`;
        
        // Parse items
        const items = JSON.parse(itemsJson);
        
        // Create order with pending_approval status
        const { data: newOrder, error: orderError } = await supabase
          .from('agent_orders')
          .insert({
            agent_id: agentId,
            customer_id: customerId,
            conversation_id: conversationId,
            order_number: orderNumber,
            items: items,
            delivery_address: address || null,
            customer_notes: notes || null,
            total_amount: parseFloat(total),
            status: 'pending'
          })
          .select()
          .single();

        if (orderError || !newOrder) {
          console.error('Error creating order:', orderError);
          throw new Error('Erro ao criar pedido');
        }

        order = newOrder;
        
        // Create pending message with order details
        const itemsList = items.map((item: any) => 
          `  • ${item.name} - Qtd: ${item.quantity} - R$ ${item.price.toFixed(2)}`
        ).join('\n');
        
        const pendingMsg = `\n\n⏳ *Dados enviados, esperando resposta...*\n\n🛒 *Número do Pedido:* ${orderNumber}\n👤 *Nome:* ${customerSafe.name}\n📧 *Email:* ${customerSafe.email}\n${customerSafe.phone ? `📱 *Telefone:* ${customerSafe.phone}` : ''}\n${address ? `📍 *Endereço:* ${address}` : ''}\n\n*Itens do Pedido:*\n${itemsList}\n\n💰 *Total:* R$ ${parseFloat(total).toFixed(2)}\n${notes ? `\n📝 *Observações:* ${notes}` : ''}\n\n*Aguarde a confirmação do pedido.*`;
        
        // Save pending message
        await supabase.from('agent_messages').insert({
          conversation_id: conversationId,
          role: 'assistant',
          content: pendingMsg,
          sender_name: 'Sistema'
        });

        // Create notification for agent owner
        await supabase.from('agent_notifications').insert({
          agent_id: agentId,
          notification_type: 'new_order',
          title: 'Novo Pedido',
          message: `${customerSafe.name} fez um pedido de R$ ${parseFloat(total).toFixed(2)}`,
          reference_id: newOrder.id,
          is_read: false
        });
        
        finalResponse = responseText.replace(/\[PEDIDO\|.*?\]/, pendingMsg);
      }
    }

    return new Response(
      JSON.stringify({
        response: finalResponse.trim(),
        appointment,
        order
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