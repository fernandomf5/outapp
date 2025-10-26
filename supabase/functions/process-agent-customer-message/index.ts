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

    // Get customer info
    const { data: customer } = await supabase
      .from('agent_customers')
      .select('*')
      .eq('id', customerId)
      .single();

    // Get conversation history
    const { data: messages } = await supabase
      .from('agent_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    // Build context for AI
    const conversationHistory = messages?.map(m => ({
      role: m.role === 'customer' ? 'user' : 'assistant',
      content: m.content
    })) || [];

    // Enhanced system prompt
    const systemPrompt = `Você é um assistente virtual especializado em ${agent.niche}.
Nome do cliente: ${customer.name}
Email: ${customer.email}
${customer.phone ? `Telefone: ${customer.phone}` : ''}

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
        
        // Create appointment
        const { data: newAppointment } = await supabase
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

        appointment = newAppointment;
        
        // Create confirmation message
        const formattedDate = new Date(dateTime).toLocaleString('pt-BR');
        const confirmationMsg = `\n\n✅ *Agendamento Confirmado!*\n\n📋 *Serviço:* ${serviceName}\n📅 *Data/Hora:* ${formattedDate}\n👤 *Cliente:* ${customer.name}\n${notes ? `📝 *Observações:* ${notes}` : ''}\n\nSeu agendamento foi registrado com sucesso! Você receberá uma confirmação em breve.`;
        
        // Save confirmation message
        await supabase.from('agent_messages').insert({
          conversation_id: conversationId,
          role: 'assistant',
          content: confirmationMsg,
          sender_name: 'Sistema'
        });
        
        finalResponse = responseText.replace(/\[AGENDAR\|.*?\]/, confirmationMsg);
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
        
        // Create order
        const { data: newOrder } = await supabase
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

        order = newOrder;
        
        // Create confirmation message with order details
        const itemsList = items.map((item: any) => 
          `  • ${item.name} - Qtd: ${item.quantity} - R$ ${item.price.toFixed(2)}`
        ).join('\n');
        
        const confirmationMsg = `\n\n✅ *Pedido Confirmado!*\n\n🛒 *Número do Pedido:* ${orderNumber}\n👤 *Cliente:* ${customer.name}\n${customer.phone ? `📱 *Telefone:* ${customer.phone}` : ''}\n${address ? `📍 *Endereço:* ${address}` : ''}\n\n*Itens do Pedido:*\n${itemsList}\n\n💰 *Total:* R$ ${parseFloat(total).toFixed(2)}\n${notes ? `\n📝 *Observações:* ${notes}` : ''}\n\nSeu pedido foi registrado com sucesso! Aguarde a confirmação.`;
        
        // Save confirmation message
        await supabase.from('agent_messages').insert({
          conversation_id: conversationId,
          role: 'assistant',
          content: confirmationMsg,
          sender_name: 'Sistema'
        });
        
        finalResponse = responseText.replace(/\[PEDIDO\|.*?\]/, confirmationMsg);
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