import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useTeamMember } from '@/contexts/TeamMemberContext';

interface FeatureOverride {
  id: string;
  feature_key: string;
  user_id: string | null;
  is_blocked: boolean;
  message: string | null;
}

export const useFeatureAccess = (featureKey: string) => {
  const { user } = useAuth();
  const { isTeamMember, teamMember } = useTeamMember();
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockMessage, setBlockMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // For team members, use admin's user ID to check feature access
  const effectiveUserId = isTeamMember && teamMember ? teamMember.adminUserId : user?.id;

  useEffect(() => {
    if (!effectiveUserId) {
      setIsBlocked(false);
      setBlockMessage(null);
      setLoading(false);
      return;
    }

    checkFeatureAccess();
  }, [effectiveUserId, featureKey]);

  const checkFeatureAccess = async () => {
    if (!effectiveUserId) return;

    try {
      // Check for user-specific override first (using admin's ID for team members)
      const { data: userOverride } = await supabase
        .from('feature_overrides')
        .select('*')
        .eq('feature_key', featureKey)
        .eq('user_id', effectiveUserId)
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
