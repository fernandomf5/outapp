import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export const ProtectedRoute = ({ children, requireAdmin = false }: ProtectedRouteProps) => {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();

  // Evita redirecionamentos automáticos que causam telas em branco
  // Exibimos UI de bloqueio diretamente abaixo
  useEffect(() => {
    // no-op
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-primary">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="p-6 max-w-md w-full text-center">
          <h1 className="text-xl font-semibold mb-2">Sessão necessária</h1>
          <p className="text-muted-foreground mb-4">Faça login para acessar o painel administrativo.</p>
          <div className="flex justify-center">
            <Button onClick={() => navigate('/auth')}>Ir para Login</Button>
          </div>
        </Card>
      </div>
    );
  }

  if (requireAdmin) {
    const isMasterEmail = user.email === 'fernandomoraisgarcia2011@gmail.com';
    if (!isMasterEmail && !isAdmin) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6">
          <Card className="p-6 max-w-md w-full text-center">
            <h1 className="text-xl font-semibold mb-2">Acesso restrito</h1>
            <p className="text-muted-foreground mb-4">Somente administradores podem acessar esta área.</p>
            <div className="flex justify-center">
              <Button onClick={() => navigate('/dashboard')}>Voltar ao Dashboard</Button>
            </div>
          </Card>
        </div>
      );
    }
  }
  return <>{children}</>;
};
