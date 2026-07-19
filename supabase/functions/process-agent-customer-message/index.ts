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
    const aiEnabled = agentConfig.ai_enabled === true || agent.training_data?.ai_enabled === true;

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
    // 1. Estiver explicitamente habilitada (aiEnabled)
    // 2. OU se for o gatilho inicial (para dar as boas-vindas)
    // 3. OU se o atendente estiver offline
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

    const systemPrompt = `Você é ${agent.name}, um Agente de Inteligência Artificial altamente treinado e humanizado. Seu objetivo é atender clientes de forma natural, como se estivessem conversando com um GPT ou Gemini.

${knowledge ? `DADOS DA EMPRESA E CONHECIMENTO:\n${knowledge}\n` : ''}
${nicheContext}
${personalityDesc}

REGRAS DE OURO:
1. Responda como uma pessoa real. Use um tom caloroso e prestativo.
2. Seja um especialista no negócio descrito acima. Se perguntarem algo sobre a empresa, produtos ou serviços, use o conhecimento fornecido.
3. Se não souber a resposta (não estiver no conhecimento), diga educadamente: "No momento não tenho essa informação exata, mas vou verificar para você. Deseja falar com um atendente humano? 😊"
4. Se o cliente pedir para falar com um humano, diga: "Entendido! Estou chamando um atendente agora mesmo. Só um instante."
5. Mantenha as respostas concisas e fáceis de ler.
6. Use emojis de forma moderada para parecer mais humano.
7. O objetivo final é ajudar o cliente, tirar dúvidas e converter em vendas ou agendamentos.`;

    console.log('Calling AI Gateway for humanized response');

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
          { role: 'user', content: message || "Olá" }
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!aiResponse.ok) {
      throw new Error('Falha na comunicação com a IA');
    }

    const aiData = await aiResponse.json();
    const responseText = aiData.choices?.[0]?.message?.content || 'Desculpe, tive um problema técnico. Pode repetir?';

    // Save AI response
    await supabase.from('agent_messages').insert({
      conversation_id: conversationId,
      role: 'agent',
      content: responseText.trim(),
      sender_name: agent.name
    });

    return new Response(
      JSON.stringify({ response: responseText.trim() }),
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
