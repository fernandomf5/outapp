import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export const ProtectedRoute = ({ children, requireAdmin = false }: ProtectedRouteProps) => {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate('/auth');
      } else if (requireAdmin) {
        // FORÇAR ACESSO ADMIN PARA MASTER EMAIL
        const isMasterEmail = user.email === 'fernandomoraisgarcia2011@gmail.com';
        if (!isMasterEmail && !isAdmin) {
          navigate('/dashboard');
        }
      }
    }
  }, [user, isAdmin, loading, navigate, requireAdmin]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-primary">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (requireAdmin) {
    const isMasterEmail = user.email === 'fernandomoraisgarcia2011@gmail.com';
    if (!isMasterEmail && !isAdmin) {
      return null;
    }
  }
  return <>{children}</>;
};
