import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useTeamMember } from '@/contexts/TeamMemberContext';

export interface Feature {
  id: string;
  name: string;
  description: string | null;
  key: string;
  category: string | null;
  is_active: boolean;
}

export const useUserFeatures = () => {
  const { user } = useAuth();
  const { isTeamMember, teamMember } = useTeamMember();
  const [features, setFeatures] = useState<string[]>([]);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [loading, setLoading] = useState(true);

  // For team members, use admin's user ID to fetch features
  const effectiveUserId = isTeamMember && teamMember ? teamMember.adminUserId : user?.id;

  useEffect(() => {
    if (!effectiveUserId) {
      setFeatures([]);
      setHasActiveSubscription(false);
      setLoading(false);
      return;
    }

    fetchUserFeatures();
  }, [effectiveUserId]);

  const fetchUserFeatures = async () => {
    if (!effectiveUserId) return;

    try {
      // Buscar assinatura ativa do usuário (ou do admin se for team member)
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('plan_id, expires_at')
        .eq('user_id', effectiveUserId)
        .eq('status', 'active')
        .order('expires_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!subscription) {
        setFeatures([]);
        setHasActiveSubscription(false);
        setLoading(false);
        return;
      }

      // Verificar se a assinatura já expirou
      const expirationDate = new Date(subscription.expires_at);
      const now = new Date();

      // Para free trial, bloquear imediatamente após expiração
      // Para planos pagos, dar 3 dias de graça
      const { data: planData } = await supabase
        .from('plans')
        .select('plan_type')
        .eq('id', subscription.plan_id)
        .single();

      // Plano vitalício NUNCA expira
      if (planData?.plan_type === 'lifetime') {
        // Continua para buscar features - não verifica expiração
      } else if (now > expirationDate) {
        // Se for free trial, bloquear imediatamente
        if (planData?.plan_type === 'free_trial') {
          setFeatures([]);
          setHasActiveSubscription(false);
          setLoading(false);
          return;
        }
        
        // Se for plano pago, dar 3 dias de graça
        const threeDaysAfterExpiration = new Date(expirationDate);
        threeDaysAfterExpiration.setDate(threeDaysAfterExpiration.getDate() + 3);
        
        if (now > threeDaysAfterExpiration) {
          setFeatures([]);
          setHasActiveSubscription(false);
          setLoading(false);
          return;
        }
      }

      // Buscar features do plano
      const { data: planFeatures } = await supabase
        .from('plan_features')
        .select('feature_id, features(key)')
        .eq('plan_id', subscription.plan_id);

      const featureKeys = planFeatures?.map((pf: any) => pf.features.key) || [];
      setFeatures(featureKeys);
      setHasActiveSubscription(true);
    } catch (error) {
      console.error('Erro ao buscar features:', error);
      setFeatures([]);
    } finally {
      setLoading(false);
    }
  };

  const hasFeature = (featureKey: string): boolean => {
    // If user has ANY active subscription, grant access to ALL features
    return hasActiveSubscription;
  };

  return {
    features,
    loading,
    hasFeature,
    refetch: fetchUserFeatures
  };
};
