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
    console.log('🛡️ ProtectedRoute check:', { loading, user: !!user, isAdmin, requireAdmin });
    if (!loading) {
      if (!user) {
        console.log('🚫 No user, redirecting to auth');
        navigate('/auth');
      } else if (requireAdmin && !isAdmin) {
        console.log('🚫 User not admin, redirecting to dashboard');
        navigate('/dashboard');
      } else {
        console.log('✅ Access granted');
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

  if (!user || (requireAdmin && !isAdmin)) {
    console.log('🚫 Access denied, showing null');
    return null;
  }

  console.log('✅ Rendering protected content');
  return <>{children}</>;
};
