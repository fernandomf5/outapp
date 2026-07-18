import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Função para construir contexto do nicho baseado nos dados preenchidos
function buildNicheContext(niche: string, nicheData: Record<string, string>): string {
  if (!nicheData || Object.keys(nicheData).length === 0) {
    return '';
  }

  const nicheLabels: Record<string, Record<string, string>> = {
    ecommerce: {
      storeName: "Nome da loja",
      categories: "Categorias de produtos",
      bestsellers: "Produtos mais vendidos",
      priceRange: "Faixa de preço",
      purchaseProcess: "Processo de compra",
      payment: "Formas de pagamento",
      shipping: "Política de frete",
      returns: "Política de troca/devolução",
      warranty: "Garantia",
      loyalty: "Programa de fidelidade",
      support: "Atendimento",
      tracking: "Rastreamento",
      promotions: "Promoções atuais",
      sizeGuide: "Guia de medidas",
      privacy: "Privacidade"
    },
    health: {
      clinicName: "Nome da clínica",
      specialties: "Especialidades",
      doctors: "Médicos",
      schedule: "Horário de funcionamento",
      booking: "Como agendar",
      insurance: "Convênios aceitos",
      prices: "Valores",
      exams: "Exames realizados",
      waitTime: "Tempo de espera",
      location: "Localização",
      telemedicine: "Telemedicina",
      documents: "Documentos necessários",
      cancellation: "Cancelamento",
      safety: "Segurança",
      emergency: "Emergências"
    },
    restaurant: {
      restaurantName: "Nome do restaurante",
      cuisine: "Tipo de cozinha",
      signature: "Pratos principais",
      menu: "Cardápio",
      priceRange: "Faixa de preço",
      hours: "Horário",
      delivery: "Delivery",
      takeout: "Retirada",
      reservations: "Reservas",
      capacity: "Capacidade",
      dietary: "Opções dietéticas",
      drinks: "Bebidas",
      promotions: "Promoções",
      location: "Localização",
      events: "Eventos"
    },
    realestate: {
      companyName: "Nome da imobiliária",
      propertyTypes: "Tipos de imóveis",
      locations: "Regiões de atuação",
      services: "Serviços",
      salesRange: "Valores de venda",
      rentalRange: "Valores de aluguel",
      rentalProcess: "Processo de locação",
      purchaseProcess: "Processo de compra",
      financing: "Financiamento",
      fees: "Taxas",
      visitSchedule: "Agendamento de visitas",
      trending: "Imóveis populares",
      timeline: "Tempo de negociação",
      differentials: "Diferenciais",
      support: "Suporte"
    },
    beauty: {
      salonName: "Nome do salão",
      services: "Serviços",
      prices: "Tabela de preços",
      schedule: "Horário",
      booking: "Agendamento",
      professionals: "Profissionais",
      products: "Produtos usados",
      location: "Localização",
      parking: "Estacionamento",
      packages: "Pacotes",
      specialties: "Especialidades",
      promotions: "Promoções"
    },
    fitness: {
      gymName: "Nome da academia",
      modalities: "Modalidades",
      facilities: "Estrutura",
      hours: "Horário",
      plans: "Planos e valores",
      classes: "Aulas",
      personal: "Personal trainer",
      assessment: "Avaliação física",
      differentials: "Diferenciais",
      locations: "Localizações",
      enrollment: "Matrícula",
      cancellation: "Cancelamento",
      locker: "Vestiário",
      parking: "Estacionamento",
      trial: "Aula experimental"
    },
    education: {
      institutionName: "Nome da instituição",
      courses: "Cursos",
      targetAudience: "Público-alvo",
      duration: "Duração",
      format: "Formato",
      schedule: "Horários",
      pricing: "Valores",
      certification: "Certificação",
      faculty: "Professores",
      methodology: "Metodologia",
      materials: "Material didático",
      support: "Suporte ao aluno",
      successRate: "Taxa de sucesso",
      requirements: "Requisitos",
      enrollment: "Matrícula",
      refund: "Reembolso"
    },
    business: {
      businessName: "Nome da empresa",
      industry: "Área de atuação",
      services: "Serviços",
      target: "Público-alvo",
      hiring: "Processo de contratação",
      quote: "Orçamento",
      experience: "Experiência",
      cases: "Casos de sucesso",
      team: "Equipe",
      differentials: "Diferenciais",
      pricing: "Valores",
      deadline: "Prazos",
      warranty: "Garantias",
      credentials: "Certificações",
      support: "Atendimento"
    },
    automotive: {
      shopName: "Nome da oficina",
      services: "Serviços",
      brands: "Marcas atendidas",
      hours: "Horário",
      booking: "Agendamento",
      diagnostic: "Diagnóstico",
      warranty: "Garantia",
      payment: "Pagamento",
      parts: "Peças",
      emergency: "Emergência",
      prices: "Valores",
      location: "Localização",
      perks: "Cortesias",
      inspection: "Inspeção"
    }
  };

  const labels = nicheLabels[niche] || {};
  let context = "INFORMAÇÕES DO NEGÓCIO:\n";
  
  for (const [key, value] of Object.entries(nicheData)) {
    if (value && value.trim()) {
      const label = labels[key] || key;
      context += `• ${label}: ${value}\n`;
    }
  }
  
  return context;
}

// Função para descrever personalidade
function buildPersonalityDescription(personality: any): string {
  const tones: Record<string, string> = {
    friendly: "amigável e acolhedor",
    professional: "profissional e formal",
    casual: "descontraído e informal",
    enthusiastic: "entusiasmado e animado",
    empathetic: "empático e compreensivo"
  };

  const tone = tones[personality?.tone] || "amigável";
  const formality = personality?.formality || 50;
  const proactivity = personality?.proactivity || 70;
  const empathy = personality?.empathy || 80;

  let formalityDesc = formality > 70 ? "bastante formal" : formality < 30 ? "bem informal" : "equilibrado entre formal e informal";
  let proactivityDesc = proactivity > 70 ? "proativo em oferecer ajuda e sugestões" : proactivity < 30 ? "mais reservado, aguardando perguntas" : "moderadamente proativo";
  let empathyDesc = empathy > 70 ? "muito empático e compreensivo" : empathy < 30 ? "mais direto e objetivo" : "equilibrado entre empatia e objetividade";

  return `Sua personalidade é ${tone}, ${formalityDesc}. Você é ${proactivityDesc} e ${empathyDesc}.`;
}

async function handleNodeProcessing(node: any, nodes: any[], edges: any[], conversationId: string, agent: any, supabase: any): Promise<Response> {
  console.log('Processing node type:', node.type, 'ID:', node.id);
  
  if (node.type === 'message' || node.type === 'text' || node.type === 'button' || node.type === 'quickReply' || node.type === 'trigger') {
    const content = node.data?.label || node.data?.content || '';
    const buttons = node.data?.buttons || [];
    
    // Salvar mensagem no banco
    await supabase.from('agent_messages').insert({
      conversation_id: conversationId,
      role: 'agent',
      content: content,
      sender_name: agent.name,
      metadata: { 
        buttons, 
        nodeId: node.id 
      }
    });

    return new Response(
      JSON.stringify({ response: content, buttons }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } else if (node.type === 'question') {
    const content = node.data?.label || 'Qual sua resposta?';
    
    await supabase.from('agent_messages').insert({
      conversation_id: conversationId,
      role: 'agent',
      content: content,
      sender_name: agent.name,
      metadata: { 
        nodeId: node.id,
        is_question: true,
        variable: node.data?.variable
      }
    });

    return new Response(
      JSON.stringify({ response: content }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } else if (node.type === 'condition' || node.type === 'action') {
    // Para condição e ação na prévia/runtime simplificado, apenas seguimos para o próximo nó
    const edge = edges.find((e: any) => e.source === node.id);
    if (edge) {
      const nextNode = nodes.find((n: any) => n.id === edge.target);
      if (nextNode) return await handleNodeProcessing(nextNode, nodes, edges, conversationId, agent, supabase);
    }
  }

  return new Response(
    JSON.stringify({ error: 'Fim do fluxo ou tipo de nó não suportado' }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

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

    console.log('Processing message for agent:', agentId);

    // Get agent config with all details
    const { data: agent, error: agentError } = await supabase
      .from('ai_agents')
      .select('*')
      .eq('id', agentId)
      .single();

    if (agentError || !agent) {
      console.error('Agent not found:', agentError);
      throw new Error('Agente não encontrado');
    }

    console.log('Agent found:', agent.name, 'Niche:', agent.niche);
    const agentConfig = agent.config || {};
    const flowsEnabled = agentConfig.flows_enabled !== false;
    const attendantStatus = agent.attendant_status || 'offline';

    // Se atendente estiver online, o fluxo não responde automaticamente (atendimento humano prioritário)
    if (attendantStatus === 'online') {
      console.log('Attendant is online, skipping auto-response');
      return new Response(
        JSON.stringify({ response: '', skipped: 'attendant_online' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Flows enabled:', flowsEnabled);

    // Get conversation history
    const { data: prevMessages } = await supabase
      .from('agent_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(20);

    // Se houver fluxos ativos, processar o fluxo primeiro
    if (flowsEnabled) {
      console.log('Searching for active flows for agent:', agentId);
      const { data: activeFlows } = await supabase
        .from('agent_chat_flows')
        .select('*')
        .eq('agent_id', agentId)
        .eq('is_active', true);

      if (activeFlows && activeFlows.length > 0) {
        console.log('Found active flows:', activeFlows.length);
        
        const normalizedMsg = (message || "").toLowerCase().trim();
        const mainFlow = activeFlows[0];
        const flowConfig = mainFlow.config as any || {};
        const nodes = (flowConfig.nodes || []).map((n: any) => ({
          ...n,
          data: {
            ...n.data,
            label: n.data?.label || n.data?.content || '' // Handle both label and content
          }
        }));
        const edges = flowConfig.edges || [];

        // Identificar se a mensagem atual é uma resposta a botões de uma mensagem anterior
        const lastAgentMessage = [...(prevMessages || [])].reverse().find(m => m.role === 'agent');
        
        if (lastAgentMessage && lastAgentMessage.metadata?.buttons) {
          console.log('Last agent message had buttons, checking for match:', normalizedMsg);
          const buttons = lastAgentMessage.metadata.buttons;
          
          let clickedButton = null;
          let clickedButtonIndex = -1;

          // 1. Tentar match exato ou parcial no texto
          for (let i = 0; i < buttons.length; i++) {
            const btn = buttons[i];
            const btnText = (typeof btn === 'string' ? btn : btn.text || '').toLowerCase().trim();
            const btnId = typeof btn === 'object' ? btn.id : null;
            
            // Log for debugging button matching
            console.log(`Checking button ${i}: "${btnText}" (ID: ${btnId}) against message: "${normalizedMsg}"`);

            if (btnText === normalizedMsg || 
                normalizedMsg === btnText || 
                (btnText.length > 2 && normalizedMsg.includes(btnText)) ||
                (normalizedMsg.length > 2 && btnText.includes(normalizedMsg)) ||
                (btnId && (normalizedMsg === btnId || normalizedMsg === `btn-${btnId}`))) {
              clickedButton = btn;
              clickedButtonIndex = i;
              break;
            }
          }

          if (clickedButton) {
            console.log('Button match found at index:', clickedButtonIndex);
            const sourceNodeId = lastAgentMessage.metadata?.nodeId;
            const buttonId = typeof clickedButton === 'object' ? clickedButton.id : null;
            const buttonText = typeof clickedButton === 'object' ? clickedButton.text : clickedButton;

            // Encontrar edge que sai do nó anterior pelo handle do botão
            const edge = edges.find((e: any) => 
              e.source === sourceNodeId && (
                e.sourceHandle === buttonId || 
                e.sourceHandle === `btn-${buttonId}` || 
                e.sourceHandle === `btn-${clickedButtonIndex}` || 
                e.sourceHandle === `${clickedButtonIndex}` ||
                (buttonText && e.sourceHandle === `btn-${buttonText}`) ||
                (buttonText && e.sourceHandle === buttonText)
              )
            );

            if (edge) {
              const nextNode = nodes.find((n: any) => n.id === edge.target);
              if (nextNode) {
                console.log('Transitioning to next node:', nextNode.id);
                // Recursivamente processar o nó (isso pode ser uma mensagem, ação, condição, etc.)
                return await handleNodeProcessing(nextNode, nodes, edges, conversationId, agent, supabase);
              }
            } else {
              console.log('No specific edge found for button, looking for default outgoing edge from:', sourceNodeId);
              const defaultEdge = edges.find((e: any) => e.source === sourceNodeId && !e.sourceHandle);
              if (defaultEdge) {
                const nextNode = nodes.find((n: any) => n.id === defaultEdge.target);
                if (nextNode) return await handleNodeProcessing(nextNode, nodes, edges, conversationId, agent, supabase);
              }
            }
          }
        }

        const customerMessages = (prevMessages || []).filter(m => m.role === 'customer');
        const isFirstMessage = customerMessages.length <= 1; // Including the current one if it was already inserted
        
        const triggerNodes = nodes.filter((n: any) => n.type === 'trigger');
        let targetTriggerNode = null;

        // 1. Keyword check (priority)
        targetTriggerNode = triggerNodes.find((n: any) => 
          n.data?.triggerType === 'keyword' && 
          n.data?.keyword && 
          normalizedMsg.includes(n.data.keyword.toLowerCase().trim())
        );

        // 2. Greeting or first message check
        if (!targetTriggerNode) {
          const PortugueseGreetings = ['oi', 'olá', 'ola', 'bom dia', 'boa tarde', 'boa noite', 'ei', 'opa', 'olá!', 'oi!'];
          const isGreeting = PortugueseGreetings.includes(normalizedMsg) || 
                            PortugueseGreetings.some(g => normalizedMsg.startsWith(g + ' '));
          
          if (isFirstMessage || isGreeting || normalizedMsg === '' || normalizedMsg === 'reiniciar') {
            targetTriggerNode = triggerNodes.find((n: any) => 
              n.data?.triggerType === 'any' || n.data?.triggerType === 'buttons' || !n.data?.triggerType
            );
          }
        }

        if (targetTriggerNode) {
          console.log('Trigger found:', targetTriggerNode.data?.triggerType);
          
          // Se o gatilho for do tipo 'buttons', ele já contém a mensagem e os botões
          if (targetTriggerNode.data?.triggerType === 'buttons') {
            return await handleNodeProcessing(targetTriggerNode, nodes, edges, conversationId, agent, supabase);
          }

          // Para outros gatilhos (any, keyword), buscar o primeiro nó conectado
          const firstEdge = edges.find((e: any) => e.source === targetTriggerNode.id);
          if (firstEdge) {
            const nextNode = nodes.find((n: any) => n.id === firstEdge.target);
            if (nextNode) {
              return await handleNodeProcessing(nextNode, nodes, edges, conversationId, agent, supabase);
            }
          }
        } else {
          // Fallback: se não houver match, tentar o gatilho inicial "Any" ou "Buttons"
          console.log('No trigger or button match found for flow. Sending initial trigger.');
          const initialTrigger = triggerNodes.find((n: any) => 
            n.data?.triggerType === 'any' || n.data?.triggerType === 'buttons' || !n.data?.triggerType
          );
          
          if (initialTrigger) {
            // Se for botões, processa o gatilho direto
            if (initialTrigger.data?.triggerType === 'buttons') {
               return await handleNodeProcessing(initialTrigger, nodes, edges, conversationId, agent, supabase);
            }
            
            // Senão busca o primeiro conectado
            const firstEdge = edges.find((e: any) => e.source === initialTrigger.id);
            if (firstEdge) {
              const nextNode = nodes.find((n: any) => n.id === firstEdge.target);
              if (nextNode) return await handleNodeProcessing(nextNode, nodes, edges, conversationId, agent, supabase);
            }
          }
        }
      }
    }
  }

    // Get customer info
    const { data: customerRecord } = await supabase
      .from('agent_customers')
      .select('*')
      .eq('id', customerId)
      .maybeSingle();

    const customerSafe = customerRecord || {
      id: customerId,
      name: 'Visitante',
      email: null,
      phone: null
    };

    console.log('Customer:', customerSafe.name);

    await supabase
      .from('agent_conversations')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', conversationId);

    // Build context for AI
    const conversationHistory = (prevMessages || []).map((m: any) => ({
      role: m.role === 'customer' ? 'user' : 'assistant',
      content: m.content
    }));

    // Extract agent configuration
    const trainingData = agent.training_data || {};
    const nicheData = trainingData.nicheData || {};
    const knowledge = trainingData.knowledge || '';
    const personality = agentConfig.personality || {};

    // Build comprehensive system prompt
    const nicheContext = buildNicheContext(agent.niche, nicheData);
    const personalityDesc = buildPersonalityDescription(personality);

    const systemPrompt = `Você é ${agent.name}. ${agent.description || ''}
${nicheContext}
${knowledge ? `CONTEXTO:\n${knowledge}\n` : ''}
REGRAS (siga rigorosamente):
- Responda como se fosse uma pessoa real, de forma natural e organizada.
- Se o cliente disse "oi" ou saudações, responda de forma curta e amigável.
- Se não souber algo, responda: "Ainda não tenho essa informação específica, mas posso te passar para um atendente humano. Deseja? 😊"
- Se o cliente pedir para falar com um humano, diga: "Claro! Vou te encaminhar para um especialista agora mesmo. Só um momento. ⏳"
- Emojis: use moderadamente (máximo 1-2 por mensagem).
- Seja conciso e direto, mas educado.
- NÃO invente informações que não estão na base de conhecimento ou contexto.
- NÃO use bullet points excessivos.`;

    console.log('Calling AI with system prompt length:', systemPrompt.length);

    // Call Lovable AI Gateway
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.0-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          ...conversationHistory,
          { role: 'user', content: message }
        ],
        temperature: 0.8,
        max_tokens: 350,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      throw new Error('Erro ao processar mensagem com IA');
    }

    const aiData = await aiResponse.json();
    const responseText = aiData.choices?.[0]?.message?.content || '';

    console.log('AI response received, length:', responseText.length);

    // Save AI response to database
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
    console.error('Error processing message:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});