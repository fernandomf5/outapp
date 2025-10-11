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

    const { action, userId, phoneNumber, message, chatbotId } = await req.json();

    console.log('WhatsApp Webhook:', { action, userId, phoneNumber });

    switch (action) {
      case 'connect': {
        // Salvar conexão no banco
        const { data: connection, error } = await supabase
          .from('whatsapp_connections')
          .insert({
            user_id: userId,
            phone_number: phoneNumber,
            is_connected: true,
            connected_at: new Date().toISOString(),
            name: `WhatsApp ${phoneNumber}`
          })
          .select()
          .single();

        if (error) throw error;

        return new Response(
          JSON.stringify({ success: true, connection }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'disconnect': {
        const { error } = await supabase
          .from('whatsapp_connections')
          .update({ 
            is_connected: false,
            connected_at: null 
          })
          .eq('user_id', userId)
          .eq('phone_number', phoneNumber);

        if (error) throw error;

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'send_message': {
        // Buscar configuração do chatbot
        const { data: chatbot } = await supabase
          .from('chatbots')
          .select('*')
          .eq('id', chatbotId)
          .single();

        if (!chatbot) {
          throw new Error('Chatbot não encontrado');
        }

        // Processar mensagem com base na configuração
        const botConfig = chatbot.config as any;
        let response = botConfig.welcomeMessage || 'Olá!';

        // Verificar triggers
        if (botConfig.triggers) {
          const trigger = botConfig.triggers.find((t: any) => 
            message.toLowerCase().includes(t.keyword.toLowerCase())
          );
          if (trigger) {
            response = trigger.response;
          }
        }

        // TODO: Integrar com Evolution API ou WhatsApp Business API aqui
        // Exemplo:
        // const whatsappResponse = await fetch('https://evolution-api-url/sendText', {
        //   method: 'POST',
        //   headers: { 'apikey': EVOLUTION_API_KEY },
        //   body: JSON.stringify({ number: phoneNumber, text: response })
        // });

        return new Response(
          JSON.stringify({ success: true, response }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'receive_message': {
        // Receber mensagem do WhatsApp e processar
        // TODO: Implementar lógica de processamento
        
        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        throw new Error('Ação inválida');
    }
  } catch (error) {
    console.error('Erro no webhook:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});