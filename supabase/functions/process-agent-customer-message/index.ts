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

function isEnabled(value: unknown): boolean {
  return value === true || value === 'true' || value === 1 || value === '1';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { agentId, customerId, conversationId, message, forceHuman } = await req.json();

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

    console.log('Agent found:', agent.name);
    const agentConfig = agent.config || {};
    const attendantStatus = agent.attendant_status || 'offline';
    const isInitialTrigger = message === '' || message === null || message === undefined || (typeof message === 'string' && message.trim() === '');

    // Get conversation history
    const { data: prevMessages } = await supabase
      .from('agent_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(30);

    // Extraímos se a IA está habilitada diretamente do objeto training_data ou config
    const aiEnabled = isEnabled(agentConfig.ai_enabled) || isEnabled(agent.training_data?.ai_enabled);

    console.log('AI Status:', { aiEnabled, attendantStatus, isInitialTrigger, forceHuman });

    // Se o cliente solicitou atendimento humano (forceHuman), pausamos a IA
    if (forceHuman && !isInitialTrigger) {
      console.log('forceHuman active, skipping auto-response');
      return new Response(
        JSON.stringify({ response: '', skipped: 'force_human' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // A IA deve responder se:
    // 1. Estiver habilitada no config (aiEnabled)
    // 2. OU se o treinamento da IA estiver explicitamente ativado
    // 3. OU se for o gatilho inicial (para dar as boas-vindas automáticas)
    // 4. OU se o atendente estiver offline (fallback padrão)
    const shouldAIRespond = aiEnabled || isInitialTrigger || attendantStatus === 'offline';

    if (!shouldAIRespond) {
      console.log('AI should not respond (Attendant online and AI disabled)');
      return new Response(
        JSON.stringify({ response: '', skipped: 'attendant_online' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get customer info
    const { data: customerRecord } = await supabase
      .from('agent_customers')
      .select('*')
      .eq('id', customerId)
      .maybeSingle();

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

    const systemPrompt = `Você é ${agent.name}, um Agente de Inteligência Artificial avançado da Out App. Você deve ser extremamente inteligente, empático e capaz de sustentar conversas complexas e humanizadas, similar ao ChatGPT ou Gemini.

${knowledge ? `CONHECIMENTO ESPECIALIZADO DO NEGÓCIO:\n${knowledge}\n` : ''}
${nicheContext}
${personalityDesc}

REGRAS DE OURO PARA UM ATENDIMENTO DE ELITE:
1. COMPORTAMENTO HUMANO: Responda de forma natural, calorosa e fluida. Use transições suaves entre assuntos.
2. ESPECIALISTA OUT APP: Você é um mestre sobre todos os recursos da Out App (CRM, Gestão de Leads, Agentes IA, Marketing, etc). Se não houver informações específicas no treinamento sobre um recurso da Out App, fale com propriedade sobre como a plataforma ajuda na automação e escala de negócios.
3. GESTÃO DE INCERTEZA: Se o cliente perguntar algo que não está no seu treinamento ou conhecimento, NÃO diga "não sei". Em vez disso, leve a conversa de forma inteligente: "Essa é uma excelente pergunta! Para te dar a resposta mais precisa possível dentro da nossa estratégia atual, eu posso verificar isso agora ou te encaminhar para um especialista humano que cuida exatamente desse ponto. O que prefere?"
4. CONVERSA INTELIGENTE: Se o assunto fugir do tópico, saiba retornar gentilmente ao objetivo do negócio: "Achei super interessante isso que você comentou! Aliás, falando em resultados, como sua empresa está lidando com [objetivo do negócio] hoje?"
5. ENCAMINHAMENTO HUMANO: Se sentir que o cliente está frustrado ou precisa de algo muito técnico/específico, sugira educadamente: "Parece que você precisa de um olhar mais detalhado sobre isso. Gostaria que eu chamasse um atendente humano agora para te auxiliar melhor? 😊"
6. CONCISÃO E CLAREZA: Respostas diretas, mas completas. Use emojis para manter a leveza.
7. FOCO EM RESULTADOS: Seu objetivo final é sempre converter a conversa em valor para o cliente (venda, agendamento ou solução de dúvida).`;

    if (!lovableApiKey) {
      console.error('LOVABLE_API_KEY is missing');
      throw new Error('IA não configurada no projeto');
    }

    console.log('Calling AI Gateway for humanized response');

    let responseText = '';
    const models = ['google/gemini-2.0-flash', 'openai/gpt-4o-mini', 'google/gemini-pro'];

    for (const model of models) {
      try {
        const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${lovableApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: 'system', content: systemPrompt },
              ...conversationHistory,
              { role: 'user', content: message || "Olá" }
            ],
            temperature: 0.7,
            max_tokens: 500,
          }),
        });

        const responseBody = await aiResponse.text();

        if (!aiResponse.ok) {
          console.error('AI Gateway error', { model, status: aiResponse.status, body: responseBody });
          continue;
        }

        const aiData = JSON.parse(responseBody);
        responseText = aiData.choices?.[0]?.message?.content?.trim() || '';
        if (responseText) break;
      } catch (aiError) {
        console.error('AI Gateway request failed', { model, error: aiError instanceof Error ? aiError.message : String(aiError) });
      }
    }

    if (!responseText) {
      responseText = 'Olá! Estou aqui para ajudar. Pode me contar melhor o que você precisa?';
    }

    // Save AI response
    await supabase.from('agent_messages').insert({
      conversation_id: conversationId,
      role: 'agent',
      content: responseText,
      sender_name: agent.name
    });

    return new Response(
      JSON.stringify({ response: responseText }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
