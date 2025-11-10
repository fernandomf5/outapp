import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface FeatureOverride {
  id: string;
  feature_key: string;
  user_id: string | null;
  is_blocked: boolean;
  message: string | null;
}

export const useFeatureAccess = (featureKey: string) => {
  const { user } = useAuth();
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockMessage, setBlockMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setIsBlocked(false);
      setBlockMessage(null);
      setLoading(false);
      return;
    }

    checkFeatureAccess();
  }, [user, featureKey]);

  const checkFeatureAccess = async () => {
    if (!user) return;

    try {
      // Check for user-specific override first
      const { data: userOverride } = await supabase
        .from('feature_overrides')
        .select('*')
        .eq('feature_key', featureKey)
        .eq('user_id', user.id)
        .maybeSingle();

      if (userOverride) {
        setIsBlocked(userOverride.is_blocked);
        setBlockMessage(userOverride.message);
        setLoading(false);
        return;
      }

      // Check for global override
      const { data: globalOverride } = await supabase
        .from('feature_overrides')
        .select('*')
        .eq('feature_key', featureKey)
        .is('user_id', null)
        .maybeSingle();

      if (globalOverride) {
        setIsBlocked(globalOverride.is_blocked);
        setBlockMessage(globalOverride.message);
      } else {
        setIsBlocked(false);
        setBlockMessage(null);
      }
    } catch (error) {
      console.error('Error checking feature access:', error);
      setIsBlocked(false);
      setBlockMessage(null);
    } finally {
      setLoading(false);
    }
  };

  return {
    isBlocked,
    blockMessage: blockMessage || 'Este recurso está temporariamente em manutenção.',
    loading,
    refetch: checkFeatureAccess
  };
};
