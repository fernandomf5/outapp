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

    // Construir prompt baseado na configuração
    const systemPrompt = `
Você é um assistente virtual especializado em ${agent.niche}.
Tom de voz: ${config.personality?.tone || 'amigável'}
Nível de formalidade: ${config.personality?.formality || 50}%
Proatividade: ${config.personality?.proactivity || 70}%
Empatia: ${config.personality?.empathy || 80}%

${config.knowledge ? `Conhecimento adicional:\n${config.knowledge}` : ''}

${trainingData.nicheData ? `Informações do negócio:\n${JSON.stringify(trainingData.nicheData, null, 2)}` : ''}

Responda de forma ${config.personality?.tone === 'professional' ? 'profissional' : 'amigável'} e útil.
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