import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useUserPresence = () => {
  const { user } = useAuth();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (!user) return;

    const channel = supabase.channel('online-users', {
      config: {
        presence: {
          key: user.id,
        },
      },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        // Presence synced
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            user_id: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuário',
            online_at: new Date().toISOString(),
          });
        }
      });

    channelRef.current = channel;

    // Heartbeat to keep presence alive
    const heartbeat = setInterval(async () => {
      if (channelRef.current) {
        await channelRef.current.track({
          user_id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuário',
          online_at: new Date().toISOString(),
        });
      }
    }, 30000);

    return () => {
      clearInterval(heartbeat);
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [user]);
};
