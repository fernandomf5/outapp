import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Bot, ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";
import { EmailVerification } from "@/components/EmailVerification";
import { TwoFactorVerification } from "@/components/TwoFactorVerification";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const emailSchema = z.string().email("Por favor, insira um e-mail válido");
const passwordSchema = z.string().min(6, "A senha deve ter pelo menos 6 caracteres");
const nameSchema = z.string().trim().min(2, "Informe seu nome completo");

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string>("");
  const [showVerification, setShowVerification] = useState(false);
  const [verificationUserId, setVerificationUserId] = useState("");
  const [verificationEmail, setVerificationEmail] = useState("");
  const [show2FA, setShow2FA] = useState(false);
  const [deviceFingerprint, setDeviceFingerprint] = useState("");
  const [sessionData, setSessionData] = useState<any>(null);
  const [messageDialog, setMessageDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    type: 'success' | 'error';
  }>({
    open: false,
    title: '',
    description: '',
    type: 'success'
  });
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, isAdmin, customSignUp, customSignIn, loading } = useAuth();

  const showMessage = (title: string, description: string, type: 'success' | 'error') => {
    setMessageDialog({ open: true, title, description, type });
  };

  // Carregar logo do site (branca para fundo colorido)
  useEffect(() => {
    const loadLogo = async () => {
      const { data } = await supabase
        .from('site_settings')
        .select('key, value')
        .in('key', ['site_logo_light_url', 'site_logo_url'])
      
      if (data) {
        const lightLogo = data.find(d => d.key === 'site_logo_light_url')?.value;
        const defaultLogo = data.find(d => d.key === 'site_logo_url')?.value;
        setLogoUrl(lightLogo || defaultLogo || '');
      }
    };
    loadLogo();
  }, []);

  // Redirect if already logged in
  useEffect(() => {
    if (user && !loading) {
      // FORÇAR REDIRECT PARA ADMIN SE FOR MASTER EMAIL
      const isMasterEmail = user.email === 'fernandomoraisgarcia2011@gmail.com';
      navigate(isMasterEmail ? "/admin" : "/dashboard");
    }
  }, [user, loading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Validação de email com zod
    const emailValidation = emailSchema.safeParse(email);
    if (!emailValidation.success) {
      showMessage("Email inválido", emailValidation.error.issues[0].message, "error");
      setIsLoading(false);
      return;
    }

    if (!isLogin) {
      // Validação de nome completo
      const nameValidation = nameSchema.safeParse(name);
      if (!nameValidation.success) {
        showMessage("Nome inválido", nameValidation.error.issues[0].message, "error");
        setIsLoading(false);
        return;
      }

      if (password !== confirmPassword) {
        showMessage("Senhas não coincidem", "As senhas digitadas não são iguais.", "error");
        setIsLoading(false);
        return;
      }

      // Validação de senha com zod
      const passwordValidation = passwordSchema.safeParse(password);
      if (!passwordValidation.success) {
        showMessage("Senha inválida", passwordValidation.error.issues[0].message, "error");
        setIsLoading(false);
        return;
      }

      // Sign Up
      const { error, userId, needsVerification } = await customSignUp(email, password, name);
      
      if (error) {
        // Mensagens específicas baseadas no erro retornado
        if (error.includes("bloqueado") || error.includes("blocked")) {
          showMessage(
            "E-mail bloqueado 🚫", 
            "Este e-mail está bloqueado no sistema. Entre em contato com o suporte se achar que isso é um erro.",
            "error"
          );
        } else if (error.includes("já cadastrado") || error.includes("already")) {
          showMessage(
            "E-mail já cadastrado", 
            "Este e-mail já possui uma conta. Tente fazer login ou recupere sua senha.",
            "error"
          );
        } else {
          showMessage("Erro ao criar conta", error, "error");
        }
        setIsLoading(false);
        return;
      }

      if (needsVerification && userId) {
        setVerificationUserId(userId);
        setVerificationEmail(email);
        setShowVerification(true);
        showMessage("Conta criada com sucesso! 📧", "Um código de verificação foi enviado para seu email. Verifique sua caixa de entrada e spam.", "success");
      }
      
      setIsLoading(false);
    } else {
      // Sign In
      const { error, needsVerification, userId, requires2FA, deviceFingerprint: fingerprint, sessionData: sessData } = await customSignIn(email, password);
      
      if (error) {
        if (needsVerification && userId) {
          setVerificationUserId(userId);
          setVerificationEmail(email);
          setShowVerification(true);
          showMessage("Email não verificado ✉️", "Por favor, verifique seu email para continuar. Confira sua caixa de entrada e spam.", "error");
        } else if (error.includes("banido") || error.includes("banned")) {
          showMessage("Acesso negado 🚫", "Sua conta foi suspensa. Entre em contato com o suporte para mais informações.", "error");
        } else {
          showMessage("Erro ao fazer login", error, "error");
        }
        setIsLoading(false);
        return;
      }

      if (requires2FA && userId && fingerprint) {
        setVerificationUserId(userId);
        setDeviceFingerprint(fingerprint);
        setSessionData(sessData);
        setShow2FA(true);
        setIsLoading(false);
        showMessage("Verificação necessária 🔒", "Um código de segurança foi enviado para seu email.", "success");
        return;
      }

      showMessage("Login realizado! ✅", "Bem-vindo de volta ao Out App.", "success");
    }
  };

  if (showVerification) {
    return (
      <EmailVerification
        userId={verificationUserId}
        email={verificationEmail}
        onVerified={() => {
          setShowVerification(false);
          navigate("/dashboard");
        }}
        onBack={() => setShowVerification(false)}
      />
    );
  }

  if (show2FA) {
    return (
      <TwoFactorVerification
        userId={verificationUserId}
        deviceFingerprint={deviceFingerprint}
        sessionData={sessionData}
        onSuccess={() => {
          setShow2FA(false);
          toast({
            title: "Login realizado com sucesso! 🎉",
            description: "Bem-vindo ao Out App.",
          });
          navigate("/dashboard");
        }}
        onBack={() => setShow2FA(false)}
      />
    );
  }

  return (
    <>
      {/* Message Dialog */}
      <AlertDialog open={messageDialog.open} onOpenChange={(open) => setMessageDialog({ ...messageDialog, open })}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className={messageDialog.type === 'success' ? 'text-success' : 'text-destructive'}>
              {messageDialog.title}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              {messageDialog.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setMessageDialog({ ...messageDialog, open: false })}>
              OK
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="min-h-screen flex items-center justify-center gradient-primary p-3 sm:p-4 relative overflow-hidden">
      {/* Botão Voltar */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate("/")}
        className="absolute top-4 left-4 text-white hover:bg-white/10 active:scale-95 transition-transform z-20"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Voltar para o Início
      </Button>

      {/* Animated Tech Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Glowing orbs */}
        <div className="absolute top-20 left-10 w-48 h-48 sm:w-64 sm:h-64 bg-white/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-72 h-72 sm:w-96 sm:h-96 bg-white/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        
        {/* Floating tech icons */}
        <div className="absolute top-[15%] left-[10%] text-white/10 animate-float-slow">
          <svg className="w-12 h-12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
        </div>
        <div className="absolute top-[25%] right-[15%] text-white/10 animate-float-medium">
          <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/></svg>
        </div>
        <div className="absolute bottom-[30%] left-[8%] text-white/10 animate-float-fast">
          <svg className="w-10 h-10" viewBox="0 0 24 24" fill="currentColor"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
        </div>
        <div className="absolute top-[60%] right-[10%] text-white/10 animate-float-slow" style={{ animationDelay: '0.5s' }}>
          <svg className="w-14 h-14" viewBox="0 0 24 24" fill="currentColor"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/></svg>
        </div>
        <div className="absolute top-[40%] left-[20%] text-white/10 animate-float-medium" style={{ animationDelay: '0.3s' }}>
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10"/></svg>
        </div>
        <div className="absolute bottom-[15%] right-[25%] text-white/10 animate-float-fast" style={{ animationDelay: '0.7s' }}>
          <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
        </div>
        <div className="absolute top-[10%] left-[50%] text-white/10 animate-float-slow" style={{ animationDelay: '1.2s' }}>
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
        </div>
        <div className="absolute bottom-[40%] left-[5%] text-white/10 animate-float-medium" style={{ animationDelay: '0.8s' }}>
          <svg className="w-7 h-7" viewBox="0 0 24 24" fill="currentColor"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
        </div>
        
        {/* Moving lines */}
        <div className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-transparent via-white/10 to-transparent animate-move-down"></div>
        <div className="absolute top-0 right-1/3 w-px h-full bg-gradient-to-b from-transparent via-white/10 to-transparent animate-move-down" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="w-full max-w-md flex flex-col items-center relative z-10">
        {/* Logo no topo - sem fundo */}
        <div className="flex flex-col items-center gap-4 mb-8 animate-fade-in">
          {logoUrl ? (
            <img src={logoUrl} alt="Logo" className="w-28 h-28 sm:w-32 sm:h-32 object-contain drop-shadow-2xl" />
          ) : (
            <Bot className="w-28 h-28 sm:w-32 sm:h-32 text-white drop-shadow-2xl" />
          )}
          <h1 className="text-3xl md:text-4xl font-bold text-white drop-shadow-lg">Out App</h1>
        </div>

        {/* Formulário de Auth */}
        <Card className="w-full p-6 sm:p-8 md:p-10 shadow-2xl backdrop-blur-sm bg-card/95 border-white/10 animate-scale-in">
          <div className="mb-6 sm:mb-8 text-center">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-2">
              {isLogin ? "Bem-vindo de volta!" : "Crie sua conta"}
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground">
              {isLogin
                ? "Entre para gerenciar seus chatbots"
                : "Comece grátis por 3 dias • Sem cartão"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Seu nome"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="h-11"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pr-10 h-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-smooth"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="pr-10 h-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-smooth"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            )}

            {isLogin && (
              <div className="text-right">
                <button
                  type="button"
                  className="text-sm text-primary hover:underline font-medium"
                  onClick={() => navigate("/forgot-password")}
                >
                  Esqueceu a senha?
                </button>
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full text-base sm:text-lg py-5 sm:py-6 gradient-primary shadow-glow hover-scale font-semibold active:scale-95 transition-transform"
              disabled={isLoading}
            >
              {isLoading ? "Aguarde..." : (isLogin ? "Entrar na Plataforma" : "Criar Conta Grátis 🚀")}
            </Button>
          </form>

          <div className="mt-5 sm:mt-6 text-center">
            <p className="text-sm sm:text-base text-muted-foreground">
              {isLogin ? "Não tem uma conta?" : "Já tem uma conta?"}{" "}
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-primary font-semibold hover:underline"
              >
                {isLogin ? "Cadastre-se grátis" : "Fazer login"}
              </button>
            </p>
          </div>

          {!isLogin && (
            <p className="text-xs text-muted-foreground text-center mt-4">
              Ao se cadastrar, você concorda com nossos Termos de Uso e Política de Privacidade.
            </p>
          )}
        </Card>
      </div>
      </div>
    </>
  );
};

export default Auth;
