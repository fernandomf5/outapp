import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTeamMember } from "@/contexts/TeamMemberContext";

export const useUserPresence = () => {
  const { user } = useAuth();
  const { isTeamMember } = useTeamMember();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // Team members don't track presence - only regular users
    if (!user || isTeamMember) return;

    let isMounted = true;

    const initPresence = async () => {
      // Fetch user profile for full name
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('user_id', user.id)
        .single();

      if (!isMounted) return;

      const fullName = profile?.full_name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuário';
      const email = profile?.email || user.email || '';

      const presenceData = {
        user_id: user.id,
        email: email,
        full_name: fullName,
        online_at: new Date().toISOString(),
      };

      // Create channel
      const channel = supabase.channel('online-users', {
        config: {
          presence: {
            key: user.id,
          },
        },
      });

      channelRef.current = channel;

      channel
        .on('presence', { event: 'sync' }, () => {
          // Synced
        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED' && isMounted) {
            await channel.track(presenceData);
          }
        });

      // Heartbeat every 20 seconds
      heartbeatRef.current = setInterval(async () => {
        if (channelRef.current && isMounted) {
          try {
            await channelRef.current.track({
              ...presenceData,
              online_at: new Date().toISOString(),
            });
          } catch (e) {
            // Ignore errors
          }
        }
      }, 20000);
    };

    initPresence();

    return () => {
      isMounted = false;
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
      }
      if (channelRef.current) {
        channelRef.current.untrack().catch(() => {});
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [user?.id, isTeamMember]);
};
