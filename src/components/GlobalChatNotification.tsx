import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { chatSounds } from "@/utils/chatSounds";

export const GlobalChatNotification = () => {
  const { user } = useAuth();
  const agentIdsRef = useRef<string[]>([]);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!user || initializedRef.current) return;

    const setupNotifications = async () => {
      // Buscar todos os agentes do usuário
      const { data: agents } = await supabase
        .from('ai_agents')
        .select('id')
        .eq('user_id', user.id);

      if (!agents || agents.length === 0) return;

      agentIdsRef.current = agents.map(a => a.id);
      initializedRef.current = true;

      console.log('🔔 GlobalChatNotification: Monitorando', agents.length, 'agentes');

      // Buscar todas as conversas dos agentes do usuário
      const { data: conversations } = await supabase
        .from('agent_conversations')
        .select('id')
        .in('agent_id', agentIdsRef.current);

      if (!conversations || conversations.length === 0) return;

      const conversationIds = conversations.map(c => c.id);

      // Inscrever para novas mensagens de clientes
      const channel = supabase
        .channel('global-chat-notifications')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'agent_messages'
          },
          (payload) => {
            const newMessage = payload.new as any;
            
            // Verificar se é uma conversa do usuário e se é mensagem de cliente
            if (conversationIds.includes(newMessage.conversation_id) && newMessage.role === 'customer') {
              console.log('🔔 Nova mensagem de cliente recebida! Tocando som...');
              chatSounds.playNotificationSound();
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    };

    setupNotifications();
  }, [user]);

  // Componente invisível - apenas escuta notificações
  return null;
};
