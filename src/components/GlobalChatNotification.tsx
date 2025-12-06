import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { chatSounds } from "@/utils/chatSounds";

export const GlobalChatNotification = () => {
  const { user } = useAuth();
  const [agentIds, setAgentIds] = useState<string[]>([]);
  const channelRef = useRef<any>(null);

  // Buscar agentes do usuário
  useEffect(() => {
    if (!user) return;

    const fetchAgents = async () => {
      const { data: agents } = await supabase
        .from('ai_agents')
        .select('id')
        .eq('user_id', user.id);

      if (agents && agents.length > 0) {
        const ids = agents.map(a => a.id);
        setAgentIds(ids);
        console.log('🔔 GlobalChatNotification: Monitorando', ids.length, 'agentes:', ids);
      }
    };

    fetchAgents();
  }, [user]);

  // Configurar listener de mensagens
  useEffect(() => {
    if (agentIds.length === 0) return;

    console.log('🔔 Configurando listener para mensagens...');

    // Inscrever para TODAS as novas mensagens e filtrar no cliente
    const channel = supabase
      .channel('global-chat-notifications-v2')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'agent_messages'
        },
        async (payload) => {
          const newMessage = payload.new as any;
          console.log('🔔 Mensagem recebida:', newMessage.role, newMessage.conversation_id);
          
          // Só processar mensagens de clientes
          if (newMessage.role !== 'customer') return;

          // Verificar se a conversa pertence a um agente do usuário
          const { data: conversation } = await supabase
            .from('agent_conversations')
            .select('agent_id')
            .eq('id', newMessage.conversation_id)
            .single();

          if (conversation && agentIds.includes(conversation.agent_id)) {
            console.log('🔔 Mensagem de cliente em agente do usuário! Tocando som...');
            chatSounds.playNotificationSound();
          }
        }
      )
      .subscribe((status) => {
        console.log('🔔 Status da subscription:', status);
      });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [agentIds]);

  // Componente invisível - apenas escuta notificações
  return null;
};
