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

        // Tentar encontrar se já estamos no meio de um fluxo (baseado na última mensagem do agente que tinha botões)
        const lastAgentMessage = [...(prevMessages || [])].reverse().find(m => m.role === 'agent');
        
        if (lastAgentMessage && lastAgentMessage.metadata?.buttons) {
          console.log('Last agent message had buttons, checking for match...');
          const clickedButton = lastAgentMessage.metadata.buttons.find((btn: any) => {
            const btnText = (typeof btn === 'string' ? btn : btn.text || '').toLowerCase().trim();
            const btnId = typeof btn === 'object' ? btn.id : null;
            
            // Match exact, subset, or keyword mapping
            return btnText === normalizedMsg || 
                   normalizedMsg === btnText || 
                   normalizedMsg.includes(btnText) ||
                   (btnId && (normalizedMsg.includes(btnId) || normalizedMsg.includes(`btn-${btnId}`)));
          });

          if (clickedButton) {
            console.log('Button match found:', clickedButton);
            
            // Try to find the source node
            let sourceNode = nodes.find((n: any) => n.id === lastAgentMessage.metadata?.nodeId);
            
            if (!sourceNode) {
              // Fallback to label match if nodeId is missing
              sourceNode = nodes.find((n: any) => n.data?.label === lastAgentMessage.content);
            }

            if (sourceNode) {
              const buttonText = typeof clickedButton === 'string' ? clickedButton : clickedButton.text;
              const buttonId = typeof clickedButton === 'object' ? clickedButton.id : null;
              
              console.log('Finding edge from node:', sourceNode.id, 'with button:', buttonText, 'or ID:', buttonId);

              // 1. Try to find an edge that matches the specific button handle (ID or label)
              let edge = edges.find((e: any) => 
                (e.source === sourceNode.id) && 
                (e.sourceHandle === buttonText || 
                 (buttonId && (e.sourceHandle === buttonId || e.sourceHandle === `btn-${buttonId}`)) ||
                 (buttonText && e.sourceHandle === `btn-${buttonText}`))
              );
              
              // 2. Fallback: If no specific edge for the button, look for ANY outgoing edge (linear flow)
              if (!edge) {
                edge = edges.find((e: any) => e.source === sourceNode.id);
              }
              
              if (edge) {
                const nextNode = nodes.find((n: any) => n.id === edge.target);
                if (nextNode && nextNode.data?.label) {
                   const flowResponse = nextNode.data.label;
                   console.log('Next node found:', nextNode.id, 'Response:', flowResponse);

                   await supabase.from('agent_messages').insert({
                     conversation_id: conversationId,
                     role: 'agent',
                     content: flowResponse,
                     sender_name: agent.name,
                     metadata: { 
                       buttons: nextNode.data.buttons || [], 
                       nodeId: nextNode.id,
                       source_btn: buttonText
                     }
                   });

                   return new Response(
                     JSON.stringify({ response: flowResponse }),
                     { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                   );
                }
              } else {
                console.log('No edge found from source node:', sourceNode.id);
              }
            } else {
              console.log('Source node not found for last message');
            }
          } else {
            console.log('No button text match found for:', normalizedMsg);
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
          
          if (isFirstMessage || isGreeting || normalizedMsg === '') {
            targetTriggerNode = triggerNodes.find((n: any) => 
              n.data?.triggerType === 'any' || n.data?.triggerType === 'buttons' || !n.data?.triggerType
            );
          }
        }

        if (targetTriggerNode) {
          console.log('Trigger found:', targetTriggerNode.data?.triggerType);
          
          // Se for gatilho de botões, enviar a mensagem de boas-vindas e os botões
          if (targetTriggerNode.data?.triggerType === 'buttons') {
            const flowResponse = targetTriggerNode.data.label || 'Como posso ajudar?';
            const buttons = targetTriggerNode.data.buttons || [];
            
            await supabase.from('agent_messages').insert({
              conversation_id: conversationId,
              role: 'agent',
              content: flowResponse,
              sender_name: agent.name,
              metadata: { buttons, trigger: 'initial', nodeId: targetTriggerNode.id } // Marcamos que é um gatilho inicial
            });

            return new Response(
              JSON.stringify({ response: flowResponse, buttons }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          // Para outros gatilhos, seguir para o próximo nó
          const firstEdge = edges.find((e: any) => e.source === targetTriggerNode.id);
          if (firstEdge) {
            const nextNode = nodes.find((n: any) => n.id === firstEdge.target);
            if (nextNode && nextNode.data?.label) {
              const flowResponse = nextNode.data.label;
              console.log('Responding with flow content:', flowResponse);
              
              await supabase.from('agent_messages').insert({
                conversation_id: conversationId,
                role: 'agent',
                content: flowResponse,
                sender_name: agent.name,
                metadata: { buttons: nextNode.data.buttons || [], trigger: 'initial', nodeId: nextNode.id }
              });

              return new Response(
                JSON.stringify({ response: flowResponse }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
              );
            }
          }
        } else {
          // Se houver fluxo ativo mas a mensagem não bateu com gatilho nem botão,
          // enviar o gatilho inicial novamente se configurado para isso
          console.log('No trigger or button match found for flow. Sending initial trigger.');
          const initialTrigger = triggerNodes.find((n: any) => 
            n.data?.triggerType === 'any' || n.data?.triggerType === 'buttons' || !n.data?.triggerType
          );
          
          if (initialTrigger) {
            // Se for gatilho de botões, usar o label dele, senão buscar o primeiro nó após o gatilho
            let flowResponse = initialTrigger.data.label || 'Escolha uma opção:';
            let buttons = initialTrigger.data.buttons || [];
            
            // Se o gatilho não tiver botões, tenta pegar do próximo nó
            if (buttons.length === 0) {
              const firstEdge = edges.find((e: any) => e.source === initialTrigger.id);
              if (firstEdge) {
                const nextNode = nodes.find((n: any) => n.id === firstEdge.target);
                if (nextNode) {
                  flowResponse = nextNode.data.label || flowResponse;
                  buttons = nextNode.data.buttons || [];
                }
              }
            }

            // Adiciona um prefixo para orientar o usuário caso ele tenha digitado algo fora do fluxo
            const responseWithPrefix = `Não entendi. Por favor, escolha uma opção:\n\n${flowResponse}`;
            
            await supabase.from('agent_messages').insert({
              conversation_id: conversationId,
              role: 'agent',
              content: responseWithPrefix,
              sender_name: agent.name,
              metadata: { buttons, trigger: 'retry', nodeId: initialTrigger.id }
            });

            return new Response(
              JSON.stringify({ response: responseWithPrefix, buttons }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
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