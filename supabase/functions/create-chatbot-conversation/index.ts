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
    const { chatbotId, sessionId, visitorEmail, visitorName, visitorPhone } = body;

    if (!chatbotId || !sessionId) {
      return new Response(
        JSON.stringify({ error: 'chatbotId e sessionId são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Inserir conversa
    const { data: newConv, error: convError } = await supabase
      .from('chatbot_conversations')
      .insert({
        chatbot_id: chatbotId,
        session_id: sessionId,
        visitor_email: visitorEmail || null,
        visitor_name: visitorName || null,
        visitor_phone: visitorPhone || null,
        status: 'active',
        started_at: new Date().toISOString(),
        last_message_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (convError) {
      console.error('Erro ao criar conversa:', convError);
      return new Response(
        JSON.stringify({ error: 'Não foi possível criar a conversa' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Notificação de nova conversa
    await supabase
      .from('chatbot_notifications')
      .insert({
        chatbot_id: chatbotId,
        type: 'new_conversation',
        title: 'Nova Conversa',
        message: `${visitorName || 'Visitante'} iniciou uma conversa`,
        is_read: false,
      });

    return new Response(
      JSON.stringify({ conversationId: newConv.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Erro create-chatbot-conversation:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
