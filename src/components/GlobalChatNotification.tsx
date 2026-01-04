import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTeamMember } from "@/contexts/TeamMemberContext";
import { chatSounds } from "@/utils/chatSounds";
import { toast } from "sonner";

export const GlobalChatNotification = () => {
  const { user } = useAuth();
  const { isTeamMember, teamMember, getAllowedIds, canAccessModule } = useTeamMember();
  const [agentIds, setAgentIds] = useState<string[]>([]);
  const channelRef = useRef<any>(null);
  const lastNotificationRef = useRef<string | null>(null);

  // Buscar agentes do usuário ou agentes delegados para membro da equipe
  useEffect(() => {
    const fetchAgents = async () => {
      // Se é membro da equipe com acesso ao módulo de chatbots/ai_agents
      if (isTeamMember && teamMember) {
        // Check both chatbots and ai_agents modules
        const hasChatbotsAccess = canAccessModule('chatbots');
        const hasAiAgentsAccess = canAccessModule('ai_agents');
        
        if (hasChatbotsAccess || hasAiAgentsAccess) {
          const chatbotIds = getAllowedIds('chatbots');
          const agentIdsFromModule = getAllowedIds('ai_agents');
          
          // Combine both sets of IDs
          const allIds = [...new Set([...chatbotIds, ...agentIdsFromModule])];
          
          if (allIds.length > 0) {
            setAgentIds(allIds);
            console.log('🔔 GlobalChatNotification (Team Member): Monitorando', allIds.length, 'agentes delegados:', allIds);
          }
        }
        return;
      }

      // Se é usuário normal
      if (!user) return;

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
  }, [user, isTeamMember, teamMember, canAccessModule, getAllowedIds]);

  // Configurar listener de mensagens
  useEffect(() => {
    if (agentIds.length === 0) return;

    console.log('🔔 Configurando listener global para mensagens de clientes...');

    // Inscrever para TODAS as novas mensagens e filtrar no cliente
    const channel = supabase
      .channel('global-chat-notifications-v3')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'agent_messages'
        },
        async (payload) => {
          const newMessage = payload.new as any;
          
          // Evitar duplicatas
          if (lastNotificationRef.current === newMessage.id) return;
          
          // Só processar mensagens de clientes
          if (newMessage.role !== 'customer') return;

          console.log('🔔 Nova mensagem de cliente detectada:', newMessage.id);

          // Verificar se a conversa pertence a um agente do usuário
          const { data: conversation } = await supabase
            .from('agent_conversations')
            .select('agent_id')
            .eq('id', newMessage.conversation_id)
            .single();

          if (conversation && agentIds.includes(conversation.agent_id)) {
            lastNotificationRef.current = newMessage.id;
            console.log('🔔 Mensagem de cliente em agente do usuário! Tocando som e mostrando toast...');
            
            // Tocar som de notificação
            chatSounds.playNotificationSound();
            
            // Mostrar toast de notificação
            toast.info("Nova mensagem de cliente!", {
              description: newMessage.content?.substring(0, 50) + (newMessage.content?.length > 50 ? '...' : ''),
              duration: 5000,
            });
          }
        }
      )
      .subscribe((status) => {
        console.log('🔔 Status da subscription global:', status);
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
