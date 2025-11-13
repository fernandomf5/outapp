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
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json();
    const { chatbotId, conversationId, content, senderName, mediaUrl, mediaType } = body;

    console.log('Received message:', { chatbotId, conversationId, hasContent: !!content, senderName, hasMedia: !!mediaUrl });

    if (!chatbotId || !conversationId) {
      return new Response(
        JSON.stringify({ error: 'chatbotId e conversationId são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!content && !mediaUrl) {
      return new Response(
        JSON.stringify({ error: 'Conteúdo ou mídia é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Optional: ensure conversation belongs to chatbot
    const { data: conv, error: convError } = await supabase
      .from('chatbot_conversations')
      .select('id, chatbot_id')
      .eq('id', conversationId)
      .single();

    if (convError || !conv || conv.chatbot_id !== chatbotId) {
      return new Response(
        JSON.stringify({ error: 'Conversa inválida' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Insert user message
    const messageData: any = {
      conversation_id: conversationId,
      role: 'user',
      content: content || '',
      sender_name: senderName || 'Visitante',
    };

    // Adicionar mídia apenas se existir
    if (mediaUrl && mediaUrl.trim() !== '') {
      messageData.media_url = mediaUrl;
      messageData.media_type = mediaType || 'image';
    }

    console.log('Inserting message:', messageData);

    const { error: insertError } = await supabase
      .from('chatbot_messages')
      .insert(messageData);

    if (insertError) {
      console.error('Insert error:', insertError);
      throw insertError;
    }

    // Update conversation timestamp
    await supabase
      .from('chatbot_conversations')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', conversationId);

    // Create notification
    await supabase
      .from('chatbot_notifications')
      .insert({
        chatbot_id: chatbotId,
        type: 'new_message',
        title: 'Nova Mensagem',
        message: `${senderName || 'Visitante'}: ${content.substring(0, 50)}${content.length > 50 ? '...' : ''}`,
        is_read: false,
      });

    return new Response(
      JSON.stringify({ ok: true }),
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