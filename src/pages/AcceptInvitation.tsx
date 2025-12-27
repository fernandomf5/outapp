import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, CheckCircle, XCircle, UserPlus, LogIn } from 'lucide-react';

export default function AcceptInvitation() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [status, setStatus] = useState<'loading' | 'need_login' | 'ready' | 'accepted' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [adminName, setAdminName] = useState('');
  const [invitationInfo, setInvitationInfo] = useState<{ adminName: string; role?: string } | null>(null);

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setErrorMessage('Token de convite inválido');
      setLoading(false);
      return;
    }

    if (authLoading) return;

    // Check invitation validity first
    checkInvitation();
  }, [token, authLoading]);

  useEffect(() => {
    // When user logs in, update status to ready
    if (user && status === 'need_login') {
      setStatus('ready');
    }
  }, [user, status]);

  const checkInvitation = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('team-member-auth', {
        body: { action: 'check_invitation', token }
      });

      if (error || !data?.valid) {
        setStatus('error');
        setErrorMessage(data?.error || 'Convite inválido ou expirado');
        setLoading(false);
        return;
      }

      setInvitationInfo({
        adminName: data.adminName || 'Administrador',
        role: data.role
      });

      if (!user) {
        setStatus('need_login');
      } else {
        setStatus('ready');
      }
      setLoading(false);
    } catch (error: any) {
      console.error('Error checking invitation:', error);
      setStatus('error');
      setErrorMessage('Erro ao verificar convite');
      setLoading(false);
    }
  };

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

      setAdminName(data.adminName || invitationInfo?.adminName || 'Administrador');
      setStatus('accepted');
      toast({
        title: 'Convite aceito!',
        description: `Você agora faz parte da equipe de ${data.adminName || invitationInfo?.adminName}`,
      });
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
          {status === 'need_login' && (
            <>
              <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <LogIn className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Convite para Equipe</CardTitle>
              <CardDescription>
                {invitationInfo?.adminName} convidou você para fazer parte da equipe
              </CardDescription>
            </>
          )}
          
          {status === 'ready' && (
            <>
              <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <UserPlus className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Convite para Equipe</CardTitle>
              <CardDescription>
                {invitationInfo?.adminName} convidou você para fazer parte da equipe no Out App
              </CardDescription>
            </>
          )}
          
          {status === 'accepted' && (
            <>
              <div className="mx-auto w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle className="text-green-600">Convite Aceito!</CardTitle>
              <CardDescription className="text-base">
                Você agora faz parte da equipe de <strong>{adminName}</strong>
              </CardDescription>
            </>
          )}
          
          {status === 'error' && (
            <>
              <div className="mx-auto w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
              <CardTitle className="text-red-600">Erro</CardTitle>
              <CardDescription>{errorMessage}</CardDescription>
            </>
          )}
        </CardHeader>
        
        <CardContent className="space-y-4">
          {status === 'need_login' && (
            <>
              <p className="text-sm text-muted-foreground text-center">
                Para aceitar o convite, você precisa fazer login ou criar uma conta.
              </p>
              <Button 
                asChild
                className="w-full"
              >
                <Link to={`/auth?redirect=/aceitar-convite?token=${token}`}>
                  Fazer Login / Criar Conta
                </Link>
              </Button>
            </>
          )}
          
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
            <>
              <p className="text-sm text-muted-foreground text-center">
                Agora você pode acessar os recursos compartilhados com você.
              </p>
              <Button 
                className="w-full"
                onClick={() => navigate('/dashboard')}
              >
                Ir para o Dashboard
              </Button>
            </>
          )}
          
          {status === 'error' && (
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => navigate('/')}
            >
              Voltar para Início
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
