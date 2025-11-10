import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

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
  const [features, setFeatures] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setFeatures([]);
      setLoading(false);
      return;
    }

    fetchUserFeatures();
  }, [user]);

  const fetchUserFeatures = async () => {
    if (!user) return;

    try {
      // Buscar assinatura ativa do usuário
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('plan_id, expires_at')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('expires_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!subscription) {
        setFeatures([]);
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

      if (now > expirationDate) {
        // Se for free trial, bloquear imediatamente
        if (planData?.plan_type === 'free_trial') {
          setFeatures([]);
          setLoading(false);
          return;
        }
        
        // Se for plano pago, dar 3 dias de graça
        const threeDaysAfterExpiration = new Date(expirationDate);
        threeDaysAfterExpiration.setDate(threeDaysAfterExpiration.getDate() + 3);
        
        if (now > threeDaysAfterExpiration) {
          setFeatures([]);
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
    } catch (error) {
      console.error('Erro ao buscar features:', error);
      setFeatures([]);
    } finally {
      setLoading(false);
    }
  };

  const hasFeature = (featureKey: string): boolean => {
    // First check if user has feature in their plan
    const hasInPlan = features.includes(featureKey);
    return hasInPlan;
  };

  return {
    features,
    loading,
    hasFeature,
    refetch: fetchUserFeatures
  };
};
