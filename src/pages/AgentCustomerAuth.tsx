import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { LogIn, MessageSquare } from "lucide-react";
import { EmailVerification } from "@/components/EmailVerification";

export default function AgentCustomerAuth() {
  const { agentId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [authMode, setAuthMode] = useState<'choice' | 'login' | 'register' | 'anonymous' | 'verify'>('choice');
  const [loading, setLoading] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [accessType, setAccessType] = useState<string>('public');
  const [customerId, setCustomerId] = useState<string>("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const [errorDialogOpen, setErrorDialogOpen] = useState(false);
  const [errorDialog, setErrorDialog] = useState<{ title: string; message: string }>({ title: "", message: "" });
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [recoveryLoading, setRecoveryLoading] = useState(false);
  
  const showError = (title: string, message: string) => {
    setErrorDialog({ title, message });
    setErrorDialogOpen(true);
  };

  const handlePasswordRecovery = async () => {
    if (!recoveryEmail.trim()) {
      showError("Erro", "Digite seu e-mail");
      return;
    }

    setRecoveryLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('agent-customer-password-recovery', {
        body: {
          action: 'request-reset',
          email: recoveryEmail,
          agentId,
        }
      });

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: "Link de redefinição enviado para seu e-mail. Verifique sua caixa de entrada.",
      });
      
      setShowForgotPassword(false);
      setRecoveryEmail("");
    } catch (error: any) {
      showError("Erro", error.message || "Erro ao processar solicitação");
    } finally {
      setRecoveryLoading(false);
    }
  };

  // Verifica o tipo de acesso do agent
  useEffect(() => {
    const checkAccessType = async () => {
      try {
        const { data: agent } = await supabase
          .from('ai_agents')
          .select('access_type')
          .eq('id', agentId)
          .single();

        setAccessType(agent?.access_type || 'public');

        if (agent?.access_type === 'anonymous') {
          // Acesso direto - mostra apenas campo de nome
          setAuthMode('anonymous');
        } else if (agent?.access_type === 'private') {
          // Acesso privado - mostra escolha entre login e cadastro
          setAuthMode('choice');
        }

      } catch (error) {
        console.error('Error checking access type:', error);
      } finally {
        setCheckingAccess(false);
      }
    };

    checkAccessType();
  }, [agentId, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validação de senha para acesso público
      if (accessType === 'public' && authMode === 'register' && formData.password !== formData.confirmPassword) {
        showError("Erro", "As senhas não coincidem");
        setLoading(false);
        return;
      }

      // Acesso direto - apenas nome
      if (authMode === 'anonymous') {
        const customer = {
          id: crypto.randomUUID(),
          name: formData.name,
          agent_id: agentId,
        };
        localStorage.setItem(`agent_customer_${agentId}`, JSON.stringify(customer));
        navigate(`/agent-chat/${agentId}`);
        return;
      }

      const { data, error } = await supabase.functions.invoke('agent-customer-auth', {
        body: {
          action: authMode === 'login' ? 'login' : 'register',
          agentId,
          accessType,
          ...formData,
        }
      });

      // Check for error in response data first (edge function returns error in body)
      if (data?.error) {
        showError(authMode === 'login' ? "Erro no login" : "Erro", data.error);
        setLoading(false);
        return;
      }

      if (error) throw error;

      // If needs verification, show verification screen
      if (authMode === 'register' && data.needsVerification) {
        setCustomerId(data.customer.id);
        setAuthMode('verify');
        setLoading(false);
        return;
      }

      if (data.customer) {
        // Para acesso privado, verificar status de aprovação
        if (accessType === 'private') {
          const { data: accessRequest } = await supabase
            .from('agent_access_requests')
            .select('status')
            .eq('agent_id', agentId)
            .eq('customer_id', data.customer.id)
            .single();

          if (authMode === 'register') {
            // Cadastro novo
            toast({
              title: "Solicitação enviada!",
              description: "Aguardando liberação do administrador.",
            });
            return;
          } else {
            // Login existente - verificar status
            if (!accessRequest) {
              showError("Acesso não encontrado", "Você ainda não solicitou acesso a este agente.");
              return;
            }

            if (accessRequest.status === 'pending') {
              toast({
                title: "Aguardando aprovação",
                description: "Sua solicitação ainda está pendente de aprovação.",
              });
              return;
            }

            if (accessRequest.status === 'rejected') {
              showError("Acesso negado", "Sua solicitação de acesso foi rejeitada.");
              return;
            }

            if (accessRequest.status === 'approved') {
              localStorage.setItem(`agent_customer_${agentId}`, JSON.stringify(data.customer));
              toast({
                title: "Login realizado!",
                description: "Bem-vindo de volta!",
              });
              navigate(`/agent-chat/${agentId}`);
            }
          }
        } else {
          // Acesso público - login direto
          localStorage.setItem(`agent_customer_${agentId}`, JSON.stringify(data.customer));
          toast({
            title: authMode === 'login' ? "Login realizado!" : "Cadastro realizado!",
            description: authMode === 'login' 
              ? "Bem-vindo de volta!" 
              : "Bem-vindo!",
          });
          navigate(`/agent-chat/${agentId}`);
        }
      }
    } catch (error: any) {
      const errorMessage = error.message || "Ocorreu um erro.";
      if (authMode === 'login') {
        showError("Erro no login", errorMessage);
      } else {
        showError("Erro", errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  if (checkingAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-primary p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Carregando...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Email verification screen
  if (authMode === 'verify') {
    return (
      <EmailVerification
        userId={customerId}
        email={formData.email}
        onVerified={() => {
          toast({
            title: "Email verificado!",
            description: "Sua conta foi ativada com sucesso.",
          });
          navigate(`/agent-chat/${agentId}`);
        }}
        onBack={() => setAuthMode('choice')}
      />
    );
  }

  // Acesso direto - apenas nome
  if (authMode === 'anonymous') {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-primary p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Bem-vindo ao Chat</CardTitle>
            <CardDescription>Digite seu nome para iniciar</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                  placeholder="Seu nome"
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Entrando...' : 'Entrar no Chat'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Escolha entre login e cadastro (para acesso público, privado ou restrito)
  if (authMode === 'choice') {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-primary p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Bem-vindo ao Chat</CardTitle>
            <CardDescription>
              Escolha como deseja acessar
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              className="w-full h-auto py-6 flex-col gap-2" 
              onClick={() => setAuthMode('register')}
            >
              <MessageSquare className="w-6 h-6" />
              <span className="font-semibold">Cadastre-se para Iniciar Chat</span>
              <span className="text-xs opacity-80">Novo cadastro</span>
            </Button>

            <Button 
              variant="outline"
              className="w-full h-auto py-6 flex-col gap-2"
              onClick={() => setAuthMode('login')}
            >
              <LogIn className="w-6 h-6" />
              <span className="font-semibold">Entrar com Login e Senha</span>
              <span className="text-xs opacity-80">Já tenho uma conta</span>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center gradient-primary p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>
            {authMode === 'login' ? 'Entrar no Chat' : 
             accessType === 'private' ? 'Solicitar Acesso' : 'Iniciar Novo Chat'}
          </CardTitle>
          <CardDescription>
            {authMode === 'login' ? 'Entre com seu e-mail autorizado' : 
             accessType === 'private' ? 'Preencha seus dados para solicitar acesso' :
             'Preencha seus dados para iniciar'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {authMode === 'register' && (
              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                  placeholder="Seu nome completo"
                />
              </div>
            )}
            
            {/* Telefone apenas para acesso público */}
            {authMode === 'register' && accessType !== 'private' && (
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  placeholder="(00) 00000-0000"
                />
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                required
                placeholder="seu@email.com"
              />
            </div>

            {/* Senha apenas para acesso público */}
            {accessType !== 'private' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    required
                    placeholder="Mínimo 6 caracteres"
                    minLength={6}
                  />
                </div>

                {authMode === 'register' && (
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                      required
                      placeholder="Digite a senha novamente"
                      minLength={6}
                    />
                  </div>
                )}
              </>
            )}

            {authMode === 'register' && accessType === 'private' && (
              <div className="bg-yellow-50 dark:bg-yellow-950 p-3 rounded-md text-sm text-yellow-900 dark:text-yellow-100">
                ⚠️ Após o cadastro, você precisará aguardar a aprovação do administrador para acessar o chat.
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Processando...' : (
                authMode === 'login' ? 'Entrar' : 
                accessType === 'private' ? 'Solicitar Acesso' : 
                'Cadastrar e Iniciar Chat'
              )}
            </Button>
            
            {authMode === 'login' && accessType !== 'private' && (
              <Button 
                type="button" 
                variant="ghost" 
                className="w-full text-sm" 
                onClick={() => setShowForgotPassword(true)}
              >
                Esqueci minha senha
              </Button>
            )}

            {(authMode === 'login' || authMode === 'register') && (
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => setAuthMode('choice')}
              >
                ← Voltar
              </Button>
            )}
          </form>
        </CardContent>
      </Card>
      
      {/* Dialog de recuperação de senha */}
      <Dialog open={showForgotPassword} onOpenChange={setShowForgotPassword}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Recuperar Senha</DialogTitle>
            <DialogDescription>
              Escolha como deseja recuperar sua senha
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="recoveryEmail">E-mail</Label>
              <Input
                id="recoveryEmail"
                type="email"
                placeholder="seu@email.com"
                value={recoveryEmail}
                onChange={(e) => setRecoveryEmail(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={handlePasswordRecovery}
              disabled={recoveryLoading}
              className="w-full"
            >
              {recoveryLoading ? 'Enviando...' : 'Enviar Link de Redefinição'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={errorDialogOpen} onOpenChange={setErrorDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{errorDialog.title || "Aviso"}</DialogTitle>
            <DialogDescription>{errorDialog.message}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setErrorDialogOpen(false)}>OK</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
