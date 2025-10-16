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
        .gt('expires_at', new Date().toISOString())
        .order('expires_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!subscription) {
        setFeatures([]);
        setLoading(false);
        return;
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
    return features.includes(featureKey);
  };

  return {
    features,
    loading,
    hasFeature,
    refetch: fetchUserFeatures
  };
};
