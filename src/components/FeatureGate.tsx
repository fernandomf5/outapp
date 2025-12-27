import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useUserFeatures } from '@/hooks/useUserFeatures';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';
import { useTeamMember } from '@/contexts/TeamMemberContext';
import { Construction } from 'lucide-react';

interface FeatureGateProps {
  featureKey: string;
  children: ReactNode;
}

export const FeatureGate = ({ featureKey, children }: FeatureGateProps) => {
  const navigate = useNavigate();
  const { hasFeature } = useUserFeatures();
  const { isBlocked, blockMessage, loading } = useFeatureAccess(featureKey);
  const { isTeamMember } = useTeamMember();

  // Show loading state
  if (loading) {
    return (
      <Card className="p-12 text-center">
        <p className="text-muted-foreground">Carregando...</p>
      </Card>
    );
  }

  // Check if feature is blocked (maintenance mode)
  if (isBlocked) {
    return (
      <Card className="p-12 text-center">
        <Construction className="w-16 h-16 mx-auto mb-4 text-warning" />
        <h3 className="text-xl font-bold mb-2">Recurso em Manutenção</h3>
        <p className="text-muted-foreground mb-4">{blockMessage}</p>
        <Button onClick={() => navigate('/dashboard')} variant="outline">
          Voltar ao Dashboard
        </Button>
      </Card>
    );
  }

  // Team members: do NOT show plan upgrade screens (they only see delegated resources)
  if (isTeamMember) {
    return <>{children}</>;
  }

  // Check if user has feature in their plan
  if (!hasFeature(featureKey)) {
    return (
      <Card className="p-12 text-center">
        <h3 className="text-xl font-bold mb-2">Recurso não disponível</h3>
        <p className="text-muted-foreground mb-4">
          Faça upgrade do seu plano para acessar este recurso
        </p>
        <Button onClick={() => navigate('/dashboard?tab=plan')} className="gradient-primary">
          Ver Planos
        </Button>
      </Card>
    );
  }

  // Feature is available
  return <>{children}</>;
};
