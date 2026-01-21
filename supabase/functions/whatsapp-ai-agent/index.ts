import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Evolution API / WAHA base URL (user must configure)
const getEvolutionApiUrl = () => Deno.env.get('EVOLUTION_API_URL') || '';
const getEvolutionApiKey = () => Deno.env.get('EVOLUTION_API_KEY') || '';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    const { action, ...params } = await req.json();
    console.log(`WhatsApp AI Agent action: ${action}`, params);

    switch (action) {
      case 'create_instance': {
        // Create a new WhatsApp instance
        const { userId, agentId, instanceName, demoMode } = params;
        const evolutionUrl = getEvolutionApiUrl();
        const evolutionKey = getEvolutionApiKey();
        const instanceKey = `wa_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // Modo DEMO - sem Evolution API
        if (!evolutionUrl || !evolutionKey || demoMode) {
          console.log('Creating instance in DEMO mode (no Evolution API)');
          
          // Save instance to database in demo mode
          const { data: instance, error: instanceError } = await supabase
            .from('whatsapp_instances')
            .insert({
              user_id: userId,
              agent_id: agentId,
              instance_name: instanceName,
              instance_key: instanceKey,
              status: 'demo',
              webhook_url: `${supabaseUrl}/functions/v1/whatsapp-ai-agent`,
            })
            .select()
            .single();

          if (instanceError) throw instanceError;

          return new Response(JSON.stringify({ 
            success: true, 
            instance,
            demoMode: true,
            message: 'Instância criada em modo DEMO. Configure Evolution API para conectar WhatsApp real.'
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Modo PRODUÇÃO - com Evolution API
        try {
          const evolutionResponse = await fetch(`${evolutionUrl}/instance/create`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': evolutionKey,
            },
            body: JSON.stringify({
              instanceName: instanceKey,
              qrcode: true,
              integration: 'WHATSAPP-BAILEYS',
            }),
          });

          const evolutionData = await evolutionResponse.json();
          console.log('Evolution API response:', evolutionData);

          // Save instance to database
          const { data: instance, error: instanceError } = await supabase
            .from('whatsapp_instances')
            .insert({
              user_id: userId,
              agent_id: agentId,
              instance_name: instanceName,
              instance_key: instanceKey,
              status: 'connecting',
              webhook_url: `${supabaseUrl}/functions/v1/whatsapp-ai-agent`,
            })
            .select()
            .single();

          if (instanceError) throw instanceError;

          // Set webhook in Evolution API
          await fetch(`${evolutionUrl}/webhook/set/${instanceKey}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': evolutionKey,
            },
            body: JSON.stringify({
              webhook: {
                url: `${supabaseUrl}/functions/v1/whatsapp-ai-agent`,
                enabled: true,
                events: ['messages.upsert', 'connection.update', 'qrcode.updated'],
              },
            }),
          });

          return new Response(JSON.stringify({ 
            success: true, 
            instance,
            evolutionData 
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        } catch (evolutionError) {
          console.error('Evolution API error:', evolutionError);
          return new Response(JSON.stringify({ 
            error: 'Erro ao conectar com Evolution API. Verifique as configurações.' 
          }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }

      case 'test_chat': {
        // Test chat in DEMO mode - simulate WhatsApp conversation
        const { agentId, message, conversationHistory } = params;
        
        // Get agent info
        const { data: agent, error: agentError } = await supabase
          .from('ai_agents')
          .select('*')
          .eq('id', agentId)
          .single();

        if (agentError || !agent) {
          return new Response(JSON.stringify({ error: 'Agente não encontrado' }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Get knowledge base
        const { data: knowledgeBase } = await supabase
          .from('agent_knowledge_base')
          .select('*')
          .eq('agent_id', agentId)
          .eq('is_active', true);

        // Build knowledge context
        let knowledgeContext = '';
        if (knowledgeBase && knowledgeBase.length > 0) {
          knowledgeContext = '\n\n### Base de Conhecimento:\n';
          knowledgeBase.forEach((kb: any) => {
            if (kb.content_type === 'faq') {
              knowledgeContext += `\nPergunta: ${kb.title}\nResposta: ${kb.content}\n`;
            } else {
              knowledgeContext += `\n${kb.title}: ${kb.content}\n`;
            }
          });
        }

        // Build system prompt
        const agentConfig = agent.config || {};
        const systemPrompt = `Você é ${agent.attendant_name || agent.name}, um assistente virtual inteligente para WhatsApp.

Nicho/Área: ${agent.niche}
${agent.description ? `Descrição: ${agent.description}` : ''}

${agentConfig.personality ? `Personalidade: ${agentConfig.personality}` : ''}
${agentConfig.tone ? `Tom de voz: ${agentConfig.tone}` : ''}
${agentConfig.language ? `Idioma: ${agentConfig.language}` : 'Responda sempre em português brasileiro.'}

${knowledgeContext}

### Instruções:
- Responda de forma natural e amigável, como se estivesse conversando no WhatsApp
- Use emojis quando apropriado para deixar a conversa mais leve
- Seja conciso mas completo nas respostas
- Se não souber algo, seja honesto e ofereça ajuda alternativa
- Sempre tente ajudar o cliente da melhor forma possível`;

        // Build messages array
        const messages = [
          { role: 'system', content: systemPrompt },
          ...(conversationHistory || []),
          { role: 'user', content: message }
        ];

        // Call Lovable AI
        const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-3-flash-preview',
            messages,
          }),
        });

        if (!aiResponse.ok) {
          const errorText = await aiResponse.text();
          console.error('AI API error:', aiResponse.status, errorText);
          return new Response(JSON.stringify({ 
            error: 'Erro ao gerar resposta da IA',
            status: aiResponse.status 
          }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const aiData = await aiResponse.json();
        const responseText = aiData.choices?.[0]?.message?.content || 'Desculpe, não consegui processar sua mensagem.';

        return new Response(JSON.stringify({ 
          response: responseText,
          agent: agent.name
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'get_qrcode': {
        // Get QR code for an instance
        const { instanceKey } = params;
        const evolutionUrl = getEvolutionApiUrl();
        const evolutionKey = getEvolutionApiKey();

        const qrResponse = await fetch(`${evolutionUrl}/instance/connect/${instanceKey}`, {
          method: 'GET',
          headers: { 'apikey': evolutionKey },
        });

        const qrData = await qrResponse.json();
        
        // Update instance with QR code
        if (qrData.qrcode?.base64) {
          await supabase
            .from('whatsapp_instances')
            .update({ 
              qr_code: qrData.qrcode.base64,
              status: 'qr_code',
              qr_code_expires_at: new Date(Date.now() + 60000).toISOString(),
            })
            .eq('instance_key', instanceKey);
        }

        return new Response(JSON.stringify(qrData), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'check_connection': {
        // Check connection status
        const { instanceKey } = params;
        const evolutionUrl = getEvolutionApiUrl();
        const evolutionKey = getEvolutionApiKey();

        const statusResponse = await fetch(`${evolutionUrl}/instance/connectionState/${instanceKey}`, {
          method: 'GET',
          headers: { 'apikey': evolutionKey },
        });

        const statusData = await statusResponse.json();
        
        // Update instance status
        let newStatus = 'disconnected';
        if (statusData.state === 'open') {
          newStatus = 'connected';
        } else if (statusData.state === 'connecting') {
          newStatus = 'connecting';
        }

        await supabase
          .from('whatsapp_instances')
          .update({ status: newStatus })
          .eq('instance_key', instanceKey);

        return new Response(JSON.stringify({ status: newStatus, ...statusData }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'disconnect': {
        // Disconnect instance
        const { instanceKey } = params;
        const evolutionUrl = getEvolutionApiUrl();
        const evolutionKey = getEvolutionApiKey();

        await fetch(`${evolutionUrl}/instance/logout/${instanceKey}`, {
          method: 'DELETE',
          headers: { 'apikey': evolutionKey },
        });

        await supabase
          .from('whatsapp_instances')
          .update({ status: 'disconnected', qr_code: null })
          .eq('instance_key', instanceKey);

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'send_message': {
        // Send a message via WhatsApp
        const { instanceKey, to, text, mediaUrl, mediaType } = params;
        const evolutionUrl = getEvolutionApiUrl();
        const evolutionKey = getEvolutionApiKey();

        let endpoint = 'sendText';
        let body: any = { number: to, text };

        if (mediaUrl) {
          if (mediaType === 'image') {
            endpoint = 'sendMedia';
            body = { number: to, mediatype: 'image', media: mediaUrl, caption: text };
          } else if (mediaType === 'audio') {
            endpoint = 'sendWhatsAppAudio';
            body = { number: to, audio: mediaUrl };
          } else if (mediaType === 'document') {
            endpoint = 'sendMedia';
            body = { number: to, mediatype: 'document', media: mediaUrl, fileName: 'document' };
          }
        }

        const sendResponse = await fetch(`${evolutionUrl}/message/${endpoint}/${instanceKey}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': evolutionKey,
          },
          body: JSON.stringify(body),
        });

        const sendData = await sendResponse.json();
        return new Response(JSON.stringify(sendData), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'webhook': {
        // Handle incoming webhook from Evolution API
        const { event, data, instance } = params;
        console.log('Webhook received:', event, instance);

        if (event === 'qrcode.updated') {
          // Update QR code
          await supabase
            .from('whatsapp_instances')
            .update({ 
              qr_code: data.qrcode?.base64,
              status: 'qr_code',
              qr_code_expires_at: new Date(Date.now() + 60000).toISOString(),
            })
            .eq('instance_key', instance);
        } else if (event === 'connection.update') {
          // Update connection status
          let newStatus = 'disconnected';
          if (data.state === 'open') {
            newStatus = 'connected';
            // Get phone number
            const phoneNumber = data.instance?.wuid?.split('@')[0];
            await supabase
              .from('whatsapp_instances')
              .update({ 
                status: newStatus, 
                phone_number: phoneNumber,
                qr_code: null 
              })
              .eq('instance_key', instance);
          } else {
            await supabase
              .from('whatsapp_instances')
              .update({ status: newStatus })
              .eq('instance_key', instance);
          }
        } else if (event === 'messages.upsert') {
          // Process incoming message
          await processIncomingMessage(supabase, instance, data, LOVABLE_API_KEY);
        }

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'process_media': {
        // Process media (audio transcription, image analysis)
        const { mediaUrl, mediaType, instanceId } = params;
        
        let result = '';
        
        if (mediaType === 'audio') {
          // Use GPT-5 for audio transcription via Whisper-like API
          result = await transcribeAudio(mediaUrl, LOVABLE_API_KEY);
        } else if (mediaType === 'image') {
          // Use GPT-5 for image analysis
          result = await analyzeImage(mediaUrl, LOVABLE_API_KEY);
        }

        return new Response(JSON.stringify({ result }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      default:
        return new Response(JSON.stringify({ error: 'Ação não reconhecida' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
  } catch (error) {
    console.error('WhatsApp AI Agent error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function processIncomingMessage(
  supabase: any, 
  instanceKey: string, 
  data: any,
  apiKey: string | undefined
) {
  try {
    const message = data.messages?.[0];
    if (!message || message.key?.fromMe) return; // Ignore sent messages

    const fromNumber = message.key?.remoteJid?.split('@')[0];
    const messageType = message.message ? Object.keys(message.message)[0] : 'text';
    
    // Get instance info
    const { data: instance } = await supabase
      .from('whatsapp_instances')
      .select('*, ai_agents(*)')
      .eq('instance_key', instanceKey)
      .single();

    if (!instance?.agent_id) {
      console.log('No agent configured for this instance');
      return;
    }

    const agent = instance.ai_agents;
    
    // Extract message content
    let content = '';
    let mediaUrl = '';
    let transcription = '';
    let analysis = '';

    if (messageType === 'conversation' || messageType === 'extendedTextMessage') {
      content = message.message?.conversation || message.message?.extendedTextMessage?.text || '';
    } else if (messageType === 'imageMessage') {
      mediaUrl = message.message?.imageMessage?.url || '';
      content = message.message?.imageMessage?.caption || '[Imagem]';
      if (apiKey && mediaUrl) {
        analysis = await analyzeImage(mediaUrl, apiKey);
      }
    } else if (messageType === 'audioMessage') {
      mediaUrl = message.message?.audioMessage?.url || '';
      content = '[Áudio]';
      if (apiKey && mediaUrl) {
        transcription = await transcribeAudio(mediaUrl, apiKey);
        content = transcription || '[Áudio não transcrito]';
      }
    } else if (messageType === 'documentMessage') {
      mediaUrl = message.message?.documentMessage?.url || '';
      content = `[Documento: ${message.message?.documentMessage?.fileName || 'arquivo'}]`;
    }

    // Find or create conversation
    let { data: conversation } = await supabase
      .from('agent_conversations')
      .select('*')
      .eq('agent_id', instance.agent_id)
      .eq('customer_id', fromNumber)
      .eq('status', 'active')
      .single();

    if (!conversation) {
      // Create anonymous customer
      const { data: customer } = await supabase
        .from('agent_customers')
        .upsert({
          id: fromNumber,
          agent_id: instance.agent_id,
          name: `WhatsApp ${fromNumber}`,
          email: `${fromNumber}@whatsapp.temp`,
          password_hash: 'whatsapp-user',
          phone: fromNumber,
        }, { onConflict: 'id' })
        .select()
        .single();

      const { data: newConv } = await supabase
        .from('agent_conversations')
        .insert({
          agent_id: instance.agent_id,
          customer_id: fromNumber,
          status: 'active',
          ai_enabled: true,
        })
        .select()
        .single();

      conversation = newConv;
    }

    // Check if transferred to human
    const { data: existingMessages } = await supabase
      .from('whatsapp_messages')
      .select('transferred_to_human')
      .eq('instance_id', instance.id)
      .eq('from_number', fromNumber)
      .eq('transferred_to_human', true)
      .limit(1);

    const isTransferredToHuman = existingMessages && existingMessages.length > 0;

    // Save incoming message
    await supabase
      .from('whatsapp_messages')
      .insert({
        instance_id: instance.id,
        conversation_id: conversation?.id,
        whatsapp_message_id: message.key?.id,
        from_number: fromNumber,
        to_number: instance.phone_number,
        message_type: messageType.replace('Message', ''),
        content,
        media_url: mediaUrl,
        media_transcription: transcription,
        media_analysis: analysis,
        direction: 'incoming',
        transferred_to_human: isTransferredToHuman,
      });

    // If not transferred to human, generate AI response
    if (!isTransferredToHuman && apiKey) {
      const aiResponse = await generateAIResponse(
        supabase,
        agent,
        instance.id,
        fromNumber,
        content,
        transcription,
        analysis,
        apiKey
      );

      if (aiResponse) {
        // Send response via WhatsApp
        const evolutionUrl = getEvolutionApiUrl();
        const evolutionKey = getEvolutionApiKey();

        await fetch(`${evolutionUrl}/message/sendText/${instanceKey}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': evolutionKey,
          },
          body: JSON.stringify({
            number: `${fromNumber}@s.whatsapp.net`,
            text: aiResponse,
          }),
        });

        // Save AI response
        await supabase
          .from('whatsapp_messages')
          .insert({
            instance_id: instance.id,
            conversation_id: conversation?.id,
            from_number: instance.phone_number,
            to_number: fromNumber,
            message_type: 'text',
            content: aiResponse,
            direction: 'outgoing',
            ai_response: aiResponse,
          });
      }
    }
  } catch (error) {
    console.error('Error processing incoming message:', error);
  }
}

async function generateAIResponse(
  supabase: any,
  agent: any,
  instanceId: string,
  fromNumber: string,
  content: string,
  transcription: string,
  imageAnalysis: string,
  apiKey: string
): Promise<string> {
  try {
    // Get knowledge base
    const { data: knowledgeBase } = await supabase
      .from('agent_knowledge_base')
      .select('*')
      .eq('agent_id', agent.id)
      .eq('is_active', true);

    // Get recent conversation history
    const { data: recentMessages } = await supabase
      .from('whatsapp_messages')
      .select('content, direction, created_at')
      .eq('instance_id', instanceId)
      .eq('from_number', fromNumber)
      .order('created_at', { ascending: false })
      .limit(10);

    // Build knowledge context
    let knowledgeContext = '';
    if (knowledgeBase && knowledgeBase.length > 0) {
      knowledgeContext = '\n\nBase de Conhecimento:\n' + knowledgeBase
        .map((kb: any) => `- ${kb.title}: ${kb.content}`)
        .join('\n');
    }

    // Build conversation history
    const conversationHistory = (recentMessages || [])
      .reverse()
      .map((msg: any) => ({
        role: msg.direction === 'incoming' ? 'user' : 'assistant',
        content: msg.content,
      }));

    // Add context about media if present
    let additionalContext = '';
    if (transcription) {
      additionalContext += `\n[O cliente enviou um áudio que disse: "${transcription}"]`;
    }
    if (imageAnalysis) {
      additionalContext += `\n[O cliente enviou uma imagem. Análise: ${imageAnalysis}]`;
    }

    // Build system prompt
    const systemPrompt = `Você é ${agent.name}, um assistente virtual inteligente no WhatsApp.
${agent.config?.welcomeMessage ? `Mensagem de boas-vindas: ${agent.config.welcomeMessage}` : ''}
${agent.description ? `Descrição: ${agent.description}` : ''}
${knowledgeContext}

Instruções:
- Responda de forma natural e amigável, como se estivesse conversando no WhatsApp
- Use emojis quando apropriado para deixar a conversa mais leve
- Seja conciso mas completo nas respostas
- Se não souber algo, seja honesto e sugira que o cliente fale com um atendente humano
- Para transferir para atendente humano, diga que vai transferir a conversa
${additionalContext}`;

    // Call AI
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'openai/gpt-5',
        messages: [
          { role: 'system', content: systemPrompt },
          ...conversationHistory,
          { role: 'user', content: content },
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      console.error('AI API error:', response.status);
      return '';
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
  } catch (error) {
    console.error('Error generating AI response:', error);
    return '';
  }
}

async function transcribeAudio(audioUrl: string, apiKey: string | undefined): Promise<string> {
  if (!apiKey) return '';
  
  try {
    // Use GPT-5 to describe what audio transcription would look like
    // Note: For actual transcription, you'd need Whisper API or similar
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'openai/gpt-5',
        messages: [
          { 
            role: 'system', 
            content: 'Você recebeu uma URL de áudio do WhatsApp. Por limitações técnicas, não é possível transcrever o áudio diretamente. Retorne uma mensagem indicando que o usuário enviou um áudio.'
          },
          { role: 'user', content: `URL do áudio: ${audioUrl}` },
        ],
        max_tokens: 100,
      }),
    });

    const data = await response.json();
    return data.choices?.[0]?.message?.content || 'Áudio recebido';
  } catch (error) {
    console.error('Error transcribing audio:', error);
    return 'Áudio recebido';
  }
}

async function analyzeImage(imageUrl: string, apiKey: string | undefined): Promise<string> {
  if (!apiKey) return '';
  
  try {
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'openai/gpt-5',
        messages: [
          { 
            role: 'system', 
            content: 'Você é um assistente que analisa imagens. Descreva o que você vê na imagem de forma concisa.'
          },
          { 
            role: 'user', 
            content: [
              { type: 'text', text: 'Analise esta imagem:' },
              { type: 'image_url', image_url: { url: imageUrl } },
            ]
          },
        ],
        max_tokens: 200,
      }),
    });

    const data = await response.json();
    return data.choices?.[0]?.message?.content || 'Imagem recebida';
  } catch (error) {
    console.error('Error analyzing image:', error);
    return 'Imagem recebida';
  }
}
