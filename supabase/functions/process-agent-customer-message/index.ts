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
    const { conversationId } = await req.json().catch(() => ({}));

    if (conversationId) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL');
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

      if (supabaseUrl && supabaseKey) {
        const supabase = createClient(supabaseUrl, supabaseKey);
        await supabase
          .from('agent_conversations')
          .update({
            ai_enabled: false,
            last_message_at: new Date().toISOString(),
          })
          .eq('id', conversationId);
      }
    }

    return new Response(
      JSON.stringify({ response: '', skipped: 'human_chat_only' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('process-agent-customer-message disabled:', error);
    return new Response(
      JSON.stringify({ response: '', skipped: 'human_chat_only' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});