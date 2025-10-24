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
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { agentId, message, userId } = await req.json();

    console.log('Processing AI message:', { agentId, userId });

    // Buscar configuração do agente IA
    const { data: agent, error: agentError } = await supabase
      .from('ai_agents')
      .select('*')
      .eq('id', agentId)
      .single();

    if (agentError || !agent) {
      throw new Error('Agente IA não encontrado');
    }

    const config = agent.config as any;
    const trainingData = agent.training_data as any;

    // Construir base de conhecimento estruturada
    let knowledgeBase = '';
    
    // 1. Base de conhecimento principal (training_data.knowledge)
    if (trainingData.knowledge && trainingData.knowledge.trim()) {
      knowledgeBase += `\n## BASE DE CONHECIMENTO PRINCIPAL ##\n${trainingData.knowledge}\n`;
    }
    
    // 2. Informações específicas do nicho
    if (trainingData.nicheData && Object.keys(trainingData.nicheData).length > 0) {
      knowledgeBase += `\n## INFORMAÇÕES DO NEGÓCIO ##\n`;
      for (const [key, value] of Object.entries(trainingData.nicheData)) {
        if (value && String(value).trim()) {
          knowledgeBase += `${key}: ${value}\n`;
        }
      }
    }

    // Construir prompt otimizado para IA
    const systemPrompt = `Você é um assistente virtual especializado e inteligente para ${agent.niche}.

## PERSONALIDADE E COMUNICAÇÃO ##
- Tom de voz: ${config.personality?.tone === 'professional' ? 'Profissional e formal' : config.personality?.tone === 'friendly' ? 'Amigável e casual' : 'Neutro'}
- Nível de formalidade: ${config.personality?.formality || 50}/100
- Proatividade: ${config.personality?.proactivity || 70}/100 (seja ${config.personality?.proactivity > 70 ? 'muito proativo' : 'moderadamente proativo'} em oferecer ajuda adicional)
- Empatia: ${config.personality?.empathy || 80}/100 (demonstre ${config.personality?.empathy > 70 ? 'alta' : 'moderada'} empatia nas respostas)

${knowledgeBase ? knowledgeBase : ''}

## INSTRUÇÕES IMPORTANTES ##
- SEMPRE utilize as informações da base de conhecimento acima para responder perguntas
- Se a pergunta pode ser respondida com base no conhecimento fornecido, responda de forma completa e precisa
- Seja específico e detalhado ao usar informações da base de conhecimento
- Se não tiver certeza sobre algo que NÃO está na base de conhecimento, seja honesto e diga que não tem essa informação específica
- Mantenha o tom ${config.personality?.tone === 'professional' ? 'profissional' : 'amigável e acolhedor'}
- Suas respostas devem ser claras, úteis e baseadas primariamente na base de conhecimento fornecida
`;

    // Integrar com Lovable AI Gateway (se disponível) ou OpenAI
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

    let aiResponse = '';

    if (LOVABLE_API_KEY) {
      // Usar Lovable AI Gateway
      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: message }
          ],
        }),
      });

      const data = await response.json();
      aiResponse = data.choices[0].message.content;
    } else if (OPENAI_API_KEY) {
      // Fallback para OpenAI
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: message }
          ],
        }),
      });

      const data = await response.json();
      aiResponse = data.choices[0].message.content;
    } else {
      // Resposta simples baseada em regras
      aiResponse = `Como assistente de ${agent.niche}, posso ajudá-lo. ${config.welcomeMessage || 'Como posso auxiliar?'}`;
    }

    return new Response(
      JSON.stringify({ response: aiResponse }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Erro ao processar mensagem IA:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});