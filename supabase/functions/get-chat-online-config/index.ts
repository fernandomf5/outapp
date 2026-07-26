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
    const url = new URL(req.url);
    let agentId = url.searchParams.get('agentId') || '';
    let conversationId = url.searchParams.get('conversationId') || '';

    if ((req.method === 'POST' || req.method === 'PUT')) {
      try {
        const body = await req.json();
        if (!agentId) agentId = String(body?.agentId ?? '');
        if (!conversationId) conversationId = String(body?.conversationId ?? '');
      } catch {
        /* ignore */
      }
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(agentId)) {
      return new Response(JSON.stringify({ error: 'agentId inválido' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }


    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: agent, error } = await supabase
      .from('ai_agents')
      .select('id, name, config, is_active, access_type, attendant_status, attendant_name')
      .eq('id', agentId)
      .maybeSingle();

    if (error) {
      console.error('get-chat-online-config error:', error);
      return new Response(JSON.stringify({ error: 'Erro ao carregar o chat' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!agent) {
      return new Response(JSON.stringify({ error: 'Chat não encontrado' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const cfg = (agent.config ?? {}) as Record<string, unknown>;
    const queueAhead = Number(cfg.queueAhead ?? 0) || 0;

    // Only expose the public presentation settings of the chat.
    const publicConfig = {
      primaryColor: cfg.primaryColor ?? '#6366f1',
      logoUrl: cfg.logoUrl ?? null,
      welcomeMessage: cfg.welcomeMessage ?? null,
      queueEnabled: cfg.queueEnabled === true,
      queueMessage: cfg.queueMessage ?? null,
      queueAhead,
      statusColors: {
        online: (cfg.statusColors as any)?.online ?? '#22c55e',
        busy: (cfg.statusColors as any)?.busy ?? '#eab308',
        offline: (cfg.statusColors as any)?.offline ?? '#64748b',
      },
      contactEmailMessage: cfg.contactEmailMessage ?? null,
      contactEmailButtonText: cfg.contactEmailButtonText ?? null,
      contactEmailSuccessMessage: cfg.contactEmailSuccessMessage ?? null,
      queueEtaMinutes: Number(cfg.queueEtaMinutes ?? 0) || 0,
      isFloating: cfg.isFloating === true,
    };

    // Queue info
    let queuePosition: number | null = null;
    if (uuidRegex.test(conversationId)) {
      const { data: conv } = await supabase
        .from('agent_conversations')
        .select('id, queue_position')
        .eq('id', conversationId)
        .eq('agent_id', agentId)
        .maybeSingle();
      if (conv && conv.queue_position !== null && conv.queue_position !== undefined) {
        queuePosition = Number(conv.queue_position);
      }
    }

    const { count: waitingCount } = await supabase
      .from('agent_conversations')
      .select('id', { count: 'exact', head: true })
      .eq('agent_id', agentId)
      .eq('status', 'active')
      .gt('queue_position', 0);

    return new Response(
      JSON.stringify({
        agent: {
          id: agent.id,
          name: agent.name,
          is_active: agent.is_active !== false,
          access_type: agent.access_type,
          attendant_status: agent.attendant_status || 'offline',
          attendant_name: agent.attendant_name,
          config: publicConfig,
        },
        queue: {
          enabled: cfg.queueEnabled === true,
          message: cfg.queueMessage ?? null,
          ahead: queueAhead,
          waiting: waitingCount ?? 0,
          position: queuePosition,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );

  } catch (e) {
    console.error('get-chat-online-config fatal:', e);
    return new Response(JSON.stringify({ error: 'Erro inesperado' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
