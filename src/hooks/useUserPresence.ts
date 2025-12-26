import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useUserPresence = () => {
  const { user } = useAuth();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const [isTracking, setIsTracking] = useState(false);

  useEffect(() => {
    if (!user) return;

    const setupPresence = async () => {
      // Fetch user profile for full name
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('user_id', user.id)
        .single();

      const fullName = profile?.full_name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuário';
      const email = profile?.email || user.email || '';

      const channel = supabase.channel('online-users', {
        config: {
          presence: {
            key: user.id,
          },
        },
      });

      channel
        .on('presence', { event: 'sync' }, () => {
          console.log('Presence synced');
        })
        .subscribe(async (status) => {
          console.log('Presence channel status:', status);
          if (status === 'SUBSCRIBED') {
            const trackResult = await channel.track({
              user_id: user.id,
              email: email,
              full_name: fullName,
              online_at: new Date().toISOString(),
            });
            console.log('Track result:', trackResult);
            setIsTracking(true);
          }
        });

      channelRef.current = channel;

      // Heartbeat to keep presence alive
      const heartbeat = setInterval(async () => {
        if (channelRef.current && isTracking) {
          await channelRef.current.track({
            user_id: user.id,
            email: email,
            full_name: fullName,
            online_at: new Date().toISOString(),
          });
        }
      }, 25000);

      return () => {
        clearInterval(heartbeat);
        if (channelRef.current) {
          channelRef.current.untrack();
          supabase.removeChannel(channelRef.current);
        }
      };
    };

    const cleanup = setupPresence();

    return () => {
      cleanup.then(cleanupFn => cleanupFn?.());
    };
  }, [user]);
};
