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

export default function ChatbotCustomerAuth() {
  const { chatbotId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [authMode, setAuthMode] = useState<'choice' | 'login' | 'register' | 'anonymous' | 'verify'>('choice');
  const [loading, setLoading] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [accessType, setAccessType] = useState<string>('public');
  const [customerId, setCustomerId] = useState<string>('');
  const [verificationCode, setVerificationCode] = useState('');
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    emailConfirm: "",
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

  // Verifica o tipo de acesso do chatbot
  useEffect(() => {
    const checkAccessType = async () => {
      try {
        const { data: chatbot } = await supabase
          .from('chatbots')
          .select('access_type')
          .eq('id', chatbotId)
          .single();

        setAccessType(chatbot?.access_type || 'public');

        if (chatbot?.access_type === 'anonymous') {
          // Acesso direto - mostra apenas campo de nome
          setAuthMode('anonymous');
        } else if (chatbot?.access_type === 'restricted') {
          // Acesso privado - mostra apenas cadastro
          setAuthMode('register');
        }

      } catch (error) {
        console.error('Error checking access type:', error);
      } finally {
        setCheckingAccess(false);
      }
    };

    checkAccessType();
  }, [chatbotId, navigate]);

  const handleVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('chatbot-customer-auth', {
        body: {
          action: 'verify',
          customerId,
          code: verificationCode,
        }
      });

      if (error) throw error;

      if (data.verified) {
        localStorage.setItem(`chatbot_customer_${chatbotId}`, JSON.stringify(data.customer));
        toast({
          title: "E-mail verificado!",
          description: "Bem-vindo ao chat!",
        });
        navigate(`/chatbot-chat/${chatbotId}`);
      }
    } catch (error: any) {
      showError("Erro", error.message || "Código inválido");
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke('chatbot-customer-auth', {
        body: {
          action: 'resend',
          customerId,
        }
      });

      if (error) throw error;

      toast({
        title: "Código reenviado!",
        description: "Verifique seu e-mail",
      });
    } catch (error: any) {
      showError("Erro", error.message || "Falha ao reenviar código");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordRecovery = async (action: 'reveal' | 'request-reset') => {
    if (!recoveryEmail.trim()) {
      showError("Erro", "Digite seu e-mail");
      return;
    }

    setRecoveryLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('chatbot-customer-password-recovery', {
        body: {
          action,
          email: recoveryEmail,
          chatbotId,
        }
      });

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: data.message,
      });
      
      setShowForgotPassword(false);
      setRecoveryEmail("");
    } catch (error: any) {
      showError("Erro", error.message || "Erro ao processar solicitação");
    } finally {
      setRecoveryLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validações
      if (authMode === 'register') {
        if (formData.email !== formData.emailConfirm) {
          showError("Erro", "Os e-mails não coincidem");
          setLoading(false);
          return;
        }

        if (formData.password !== formData.confirmPassword) {
          showError("Erro", "As senhas não coincidem");
          setLoading(false);
          return;
        }
      }

      // Acesso direto - apenas nome
      if (authMode === 'anonymous') {
        const customer = {
          id: crypto.randomUUID(),
          name: formData.name,
          chatbot_id: chatbotId,
        };
        localStorage.setItem(`chatbot_customer_${chatbotId}`, JSON.stringify(customer));
        navigate(`/chatbot-chat/${chatbotId}`);
        return;
      }

      const { data, error } = await supabase.functions.invoke('chatbot-customer-auth', {
        body: {
          action: authMode === 'login' ? 'login' : 'register',
          chatbotId,
          accessType,
          ...formData,
        }
      });

      if (error) throw error;

      if (data.customer) {
        if (data.needsVerification && authMode === 'register') {
          // Redirect to verification screen
          setCustomerId(data.customer.id);
          setAuthMode('verify');
          toast({
            title: "Código enviado!",
            description: "Verifique seu e-mail para confirmar o cadastro",
          });
        } else if (accessType === 'restricted') {
          localStorage.setItem(`chatbot_customer_${chatbotId}`, JSON.stringify(data.customer));
          toast({
            title: "Cadastro enviado!",
            description: "Aguarde a aprovação do administrador para acessar o chat.",
          });
        } else {
          localStorage.setItem(`chatbot_customer_${chatbotId}`, JSON.stringify(data.customer));
          toast({
            title: authMode === 'login' ? "Login realizado!" : "Cadastro realizado!",
            description: authMode === 'login' 
              ? "Bem-vindo de volta!" 
              : "Bem-vindo!",
          });
          navigate(`/chatbot-chat/${chatbotId}`);
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

  // Verification screen
  if (authMode === 'verify') {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-primary p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Verificar E-mail</CardTitle>
            <CardDescription>
              Digite o código de 6 dígitos enviado para seu e-mail
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleVerification} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code">Código de Verificação</Label>
                <Input
                  id="code"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  required
                  placeholder="000000"
                  maxLength={6}
                  className="text-center text-2xl tracking-widest"
                />
              </div>

              <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-md text-sm text-blue-900 dark:text-blue-100">
                📧 Verifique sua caixa de entrada e spam. O código expira em 15 minutos.
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Verificando...' : 'Verificar Código'}
              </Button>

              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={handleResendCode}
                disabled={loading}
              >
                Reenviar Código
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Acesso livre - escolha entre login e cadastro
  if (authMode === 'choice' && accessType === 'public') {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-primary p-4">
        <Card className="w-full max-w-md mx-auto">
          <CardHeader className="px-4 sm:px-6">
            <CardTitle className="text-xl sm:text-2xl">Bem-vindo ao Chat</CardTitle>
            <CardDescription className="text-sm sm:text-base">
              Escolha como deseja acessar
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4 px-4 sm:px-6 pb-6">
            <Button 
              className="w-full h-auto py-5 sm:py-6 flex-col gap-2" 
              onClick={() => setAuthMode('register')}
            >
              <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6" />
              <span className="font-semibold text-sm sm:text-base">Cadastre-se para Iniciar Chat</span>
              <span className="text-xs opacity-80">Novo cadastro</span>
            </Button>

            <Button 
              variant="outline"
              className="w-full h-auto py-5 sm:py-6 flex-col gap-2"
              onClick={() => setAuthMode('login')}
            >
              <LogIn className="w-5 h-5 sm:w-6 sm:h-6" />
              <span className="font-semibold text-sm sm:text-base">Entrar com Login e Senha</span>
              <span className="text-xs opacity-80">Já tenho uma conta</span>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center gradient-primary p-4">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="space-y-1 px-4 sm:px-6">
          <CardTitle className="text-xl sm:text-2xl">
            {authMode === 'login' ? 'Entrar no Chat' : 
             accessType === 'restricted' ? 'Solicitar Acesso' : 'Iniciar Novo Chat'}
          </CardTitle>
          <CardDescription className="text-sm">
            {authMode === 'login' ? 'Entre com suas credenciais' : 
             accessType === 'restricted' ? 'Preencha seus dados para solicitar acesso' :
             'Preencha seus dados para iniciar'}
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 sm:px-6 pb-6">
          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
            {authMode === 'register' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm sm:text-base">Nome</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                    placeholder="Seu nome completo"
                    className="h-10 sm:h-11 text-sm sm:text-base"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm sm:text-base">Telefone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    required
                    placeholder="(00) 00000-0000"
                    className="h-10 sm:h-11 text-sm sm:text-base"
                  />
                </div>
              </>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm sm:text-base">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                required
                placeholder="seu@email.com"
                className="h-10 sm:h-11 text-sm sm:text-base"
                autoComplete="email"
              />
            </div>

            {authMode === 'register' && (
              <div className="space-y-2">
                <Label htmlFor="emailConfirm" className="text-sm sm:text-base">Confirmar Email</Label>
                <Input
                  id="emailConfirm"
                  type="email"
                  value={formData.emailConfirm}
                  onChange={(e) => setFormData({...formData, emailConfirm: e.target.value})}
                  required
                  placeholder="Digite o e-mail novamente"
                  className="h-10 sm:h-11 text-sm sm:text-base"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm sm:text-base">Senha</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                required
                placeholder="Mínimo 6 caracteres"
                minLength={6}
                className="h-10 sm:h-11 text-sm sm:text-base"
                autoComplete={authMode === 'login' ? 'current-password' : 'new-password'}
              />
            </div>

            {authMode === 'register' && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm sm:text-base">Confirmar Senha</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                  required
                  placeholder="Digite a senha novamente"
                  minLength={6}
                  className="h-10 sm:h-11 text-sm sm:text-base"
                  autoComplete="new-password"
                />
              </div>
            )}

            {authMode === 'register' && accessType === 'restricted' && (
              <div className="bg-yellow-50 dark:bg-yellow-950 p-3 rounded-md text-xs sm:text-sm text-yellow-900 dark:text-yellow-100">
                ⚠️ Após o cadastro, você precisará aguardar a aprovação do administrador para acessar o chat.
              </div>
            )}

            <Button type="submit" className="w-full h-10 sm:h-11 text-sm sm:text-base" disabled={loading}>
              {loading ? 'Processando...' : (
                authMode === 'login' ? 'Entrar' : 
                accessType === 'restricted' ? 'Solicitar Acesso' : 
                'Cadastrar e Iniciar Chat'
              )}
            </Button>
            
            {authMode === 'login' && accessType !== 'restricted' && (
              <Button 
                type="button" 
                variant="ghost" 
                className="w-full h-10 sm:h-11 text-sm" 
                onClick={() => setShowForgotPassword(true)}
              >
                Esqueci minha senha
              </Button>
            )}

            {accessType === 'public' && (
              <Button
                type="button"
                variant="ghost"
                className="w-full h-10 sm:h-11 text-sm sm:text-base"
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
          <DialogFooter className="flex-col sm:flex-col gap-2">
            <Button
              onClick={() => handlePasswordRecovery('reveal')}
              disabled={recoveryLoading}
              className="w-full"
            >
              {recoveryLoading ? 'Enviando...' : 'Enviar senha por e-mail'}
            </Button>
            <Button
              onClick={() => handlePasswordRecovery('request-reset')}
              disabled={recoveryLoading}
              variant="outline"
              className="w-full"
            >
              {recoveryLoading ? 'Enviando...' : 'Criar nova senha'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Dialog de erro */}
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
