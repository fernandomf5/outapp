import { useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useTeamMember } from '@/contexts/TeamMemberContext';
import { supabase } from '@/integrations/supabase/client';
import { Lock, Crown, AlertTriangle, Clock } from 'lucide-react';

interface SubscriptionGateProps {
  children: ReactNode;
  currentTab: string;
}

// Tabs that should ALWAYS be accessible regardless of subscription
const FREE_TABS = ['plan', 'meu-plano', 'voucher', 'support', 'tutoriais', 'overview'];

export const SubscriptionGate = ({ children, currentTab }: SubscriptionGateProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isTeamMember, teamMember } = useTeamMember();
  const [hasActiveSubscription, setHasActiveSubscription] = useState(true);
  const [loading, setLoading] = useState(true);
  const [isExpiredTrial, setIsExpiredTrial] = useState(false);

  const effectiveUserId = isTeamMember && teamMember ? teamMember.adminUserId : user?.id;

  useEffect(() => {
    if (!effectiveUserId) {
      setLoading(false);
      return;
    }

    const checkSubscription = async () => {
      try {
        const { data: subscription } = await supabase
          .from('subscriptions')
          .select('plan_id, expires_at, status, plans(plan_type)')
          .eq('user_id', effectiveUserId)
          .eq('status', 'active')
          .order('expires_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!subscription) {
          setHasActiveSubscription(false);
          setIsExpiredTrial(false);
          setLoading(false);
          return;
        }

        const plan = subscription.plans as any;

        // Lifetime plans never expire
        if (plan?.plan_type === 'lifetime') {
          setHasActiveSubscription(true);
          setLoading(false);
          return;
        }

        const now = new Date();
        const expiresAt = new Date(subscription.expires_at);

        if (now > expiresAt) {
          if (plan?.plan_type === 'free_trial') {
            // Free trial expired immediately
            setHasActiveSubscription(false);
            setIsExpiredTrial(true);
          } else {
            // Paid plans get 3 days grace
            const grace = new Date(expiresAt);
            grace.setDate(grace.getDate() + 3);
            if (now > grace) {
              setHasActiveSubscription(false);
              setIsExpiredTrial(false);
            } else {
              setHasActiveSubscription(true);
            }
          }
        } else {
          setHasActiveSubscription(true);
        }
      } catch (error) {
        console.error('Error checking subscription:', error);
        setHasActiveSubscription(true); // fail open
      } finally {
        setLoading(false);
      }
    };

    checkSubscription();
  }, [effectiveUserId]);

  // Team members bypass (they use admin's subscription)
  if (isTeamMember) {
    return <>{children}</>;
  }

  // Always allow free tabs
  if (FREE_TABS.includes(currentTab)) {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <Card className="p-12 text-center">
        <p className="text-muted-foreground">Carregando...</p>
      </Card>
    );
  }

  if (!hasActiveSubscription) {
    return (
      <Card className="p-8 sm:p-12 text-center max-w-lg mx-auto mt-8">
        <div className="bg-destructive/10 p-4 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
          {isExpiredTrial ? (
            <Clock className="w-10 h-10 text-destructive" />
          ) : (
            <Lock className="w-10 h-10 text-destructive" />
          )}
        </div>
        
        <h2 className="text-2xl font-bold mb-3">
          {isExpiredTrial ? 'Seu teste gratuito expirou!' : 'Plano necessário'}
        </h2>
        
        <p className="text-muted-foreground mb-2">
          {isExpiredTrial 
            ? 'Seu período de teste de 3 dias chegou ao fim.'
            : 'Você não possui um plano ativo para acessar este recurso.'
          }
        </p>
        
        <p className="text-sm text-muted-foreground mb-8">
          Adquira um plano para desbloquear todos os recursos da plataforma e continuar crescendo seu negócio.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button 
            onClick={() => navigate('/dashboard?tab=plan')} 
            className="gradient-primary shadow-glow"
            size="lg"
          >
            <Crown className="w-5 h-5 mr-2" />
            Ver Planos
          </Button>
          <Button 
            onClick={() => navigate('/dashboard?tab=voucher')} 
            variant="outline"
            size="lg"
          >
            Resgatar Voucher
          </Button>
        </div>
      </Card>
    );
  }

  return <>{children}</>;
};
