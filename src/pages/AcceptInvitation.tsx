import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, CheckCircle, XCircle, UserPlus } from 'lucide-react';

export default function AcceptInvitation() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [status, setStatus] = useState<'loading' | 'ready' | 'accepted' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [adminName, setAdminName] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setErrorMessage('Token de convite inválido');
      setLoading(false);
      return;
    }

    if (authLoading) return;

    if (!user) {
      // Redirect to login with return URL
      navigate(`/auth?redirect=/aceitar-convite?token=${token}`);
      return;
    }

    setLoading(false);
    setStatus('ready');
  }, [token, user, authLoading, navigate]);

  const handleAccept = async () => {
    if (!user || !token) return;

    setAccepting(true);
    try {
      const { data, error } = await supabase.functions.invoke('team-member-auth', {
        body: { 
          action: 'accept_invitation', 
          token, 
          userId: user.id 
        }
      });

      if (error || !data?.success) {
        throw new Error(data?.error || 'Erro ao aceitar convite');
      }

      setAdminName(data.adminName);
      setStatus('accepted');
      toast({
        title: 'Convite aceito!',
        description: `Você agora faz parte da equipe de ${data.adminName}`,
      });

      // Redirect to dashboard after 2 seconds
      setTimeout(() => navigate('/dashboard'), 2000);
    } catch (error: any) {
      console.error('Error accepting invitation:', error);
      setStatus('error');
      setErrorMessage(error.message || 'Erro ao aceitar convite');
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao aceitar convite',
        variant: 'destructive'
      });
    } finally {
      setAccepting(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          {status === 'ready' && (
            <>
              <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <UserPlus className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Convite para Equipe</CardTitle>
              <CardDescription>
                Você foi convidado para fazer parte de uma equipe no Out App
              </CardDescription>
            </>
          )}
          
          {status === 'accepted' && (
            <>
              <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle className="text-green-600">Convite Aceito!</CardTitle>
              <CardDescription>
                Você agora faz parte da equipe de {adminName}
              </CardDescription>
            </>
          )}
          
          {status === 'error' && (
            <>
              <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
              <CardTitle className="text-red-600">Erro</CardTitle>
              <CardDescription>{errorMessage}</CardDescription>
            </>
          )}
        </CardHeader>
        
        <CardContent className="space-y-4">
          {status === 'ready' && (
            <>
              <p className="text-sm text-muted-foreground text-center">
                Ao aceitar, você poderá acessar os recursos que o administrador liberar para você.
              </p>
              <Button 
                onClick={handleAccept} 
                className="w-full"
                disabled={accepting}
              >
                {accepting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Aceitando...
                  </>
                ) : (
                  'Aceitar Convite'
                )}
              </Button>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => navigate('/dashboard')}
              >
                Cancelar
              </Button>
            </>
          )}
          
          {status === 'accepted' && (
            <p className="text-sm text-muted-foreground text-center">
              Redirecionando para o dashboard...
            </p>
          )}
          
          {status === 'error' && (
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => navigate('/dashboard')}
            >
              Ir para Dashboard
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
