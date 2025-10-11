import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const WHATSAPP_API_URL = 'https://graph.facebook.com/v18.0';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const whatsappAccessToken = Deno.env.get('WHATSAPP_ACCESS_TOKEN');
    const whatsappPhoneNumberId = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID');

    if (!whatsappAccessToken || !whatsappPhoneNumberId) {
      throw new Error('WhatsApp credentials not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { action, userId, phoneNumber, message, chatbotId, webhookData } = await req.json();

    console.log('WhatsApp Webhook Action:', action);

    switch (action) {
      case 'connect': {
        // Para API oficial, o número já está verificado no painel da Meta
        const { data: connection, error } = await supabase
          .from('whatsapp_connections')
          .insert({
            user_id: userId,
            phone_number: whatsappPhoneNumberId,
            name: 'WhatsApp Business',
            is_connected: true,
            connected_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (error) throw error;

        return new Response(
          JSON.stringify({ 
            success: true, 
            connection,
            message: 'WhatsApp Business conectado com sucesso!'
          }),
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
        // Enviar mensagem via WhatsApp Business API
        const { to, text } = message;
        
        const whatsappResponse = await fetch(
          `${WHATSAPP_API_URL}/${whatsappPhoneNumberId}/messages`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${whatsappAccessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              messaging_product: 'whatsapp',
              to: to,
              type: 'text',
              text: { body: text }
            })
          }
        );

        if (!whatsappResponse.ok) {
          const errorData = await whatsappResponse.text();
          console.error('WhatsApp API Error:', errorData);
          throw new Error(`WhatsApp API Error: ${errorData}`);
        }

        const result = await whatsappResponse.json();
        console.log('Message sent successfully:', result);

        return new Response(
          JSON.stringify({ success: true, messageId: result.messages[0].id }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'receive_message': {
        // Processar mensagem recebida via webhook do WhatsApp
        const { from, text, messageId } = webhookData;

        // Buscar chatbot ativo para este número
        const { data: connection } = await supabase
          .from('whatsapp_connections')
          .select('*, chatbots(*)')
          .eq('phone_number', whatsappPhoneNumberId)
          .eq('is_connected', true)
          .single();

        if (!connection || !connection.chatbots || connection.chatbots.length === 0) {
          console.log('No active chatbot found');
          return new Response(
            JSON.stringify({ success: true, message: 'No chatbot configured' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const chatbot = connection.chatbots[0];
        const config = chatbot.config as any;

        // Processar triggers
        let responseText = config.welcomeMessage || 'Olá! Como posso ajudar?';
        
        if (config.triggers) {
          const trigger = config.triggers.find((t: any) => 
            text.toLowerCase().includes(t.keyword.toLowerCase())
          );
          if (trigger) {
            responseText = trigger.response;
          }
        }

        // Enviar resposta automática
        await fetch(
          `${WHATSAPP_API_URL}/${whatsappPhoneNumberId}/messages`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${whatsappAccessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              messaging_product: 'whatsapp',
              to: from,
              type: 'text',
              text: { body: responseText }
            })
          }
        );

        return new Response(
          JSON.stringify({ success: true, response: responseText }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'webhook_verify': {
        // Verificação do webhook do WhatsApp
        const mode = webhookData['hub.mode'];
        const token = webhookData['hub.verify_token'];
        const challenge = webhookData['hub.challenge'];

        if (mode === 'subscribe' && token === 'REALS_ZAPP_VERIFY_TOKEN') {
          console.log('Webhook verified');
          return new Response(challenge, { headers: corsHeaders });
        }

        return new Response('Forbidden', { status: 403, headers: corsHeaders });
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
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