import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Bot, Zap, ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";
import { EmailVerification } from "@/components/EmailVerification";
import { TwoFactorVerification } from "@/components/TwoFactorVerification";

const emailSchema = z.string().email("Por favor, insira um e-mail válido");
const passwordSchema = z.string().min(6, "A senha deve ter pelo menos 6 caracteres");

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
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, isAdmin, customSignUp, customSignIn, loading } = useAuth();

  // Carregar logo do site
  useEffect(() => {
    const loadLogo = async () => {
      const { data } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'site_logo_url')
        .maybeSingle();
      
      if (data?.value) {
        setLogoUrl(data.value);
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
      toast({
        title: "Email inválido",
        description: emailValidation.error.issues[0].message,
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    if (!isLogin) {
      if (password !== confirmPassword) {
        toast({
          title: "Senhas não coincidem",
          description: "As senhas digitadas não são iguais.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Validação de senha com zod
      const passwordValidation = passwordSchema.safeParse(password);
      if (!passwordValidation.success) {
        toast({
          title: "Senha inválida",
          description: passwordValidation.error.issues[0].message,
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Sign Up
      const { error, userId, needsVerification } = await customSignUp(email, password, name);
      
      if (error) {
        toast({
          title: "Erro ao criar conta",
          description: error,
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      if (needsVerification && userId) {
        setVerificationUserId(userId);
        setVerificationEmail(email);
        setShowVerification(true);
        toast({
          title: "Código enviado! 📧",
          description: "Verifique seu email para confirmar sua conta.",
          duration: 6000,
        });
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
          toast({
            title: "Email não verificado",
            description: "Por favor, verifique seu email para continuar.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Erro ao fazer login",
            description: error,
            variant: "destructive",
          });
        }
        setIsLoading(false);
        return;
      }

      if (requires2FA && userId && fingerprint) {
        setVerificationUserId(userId);
        setDeviceFingerprint(fingerprint);
        setSessionData(sessData); // Store session to set after 2FA
        setShow2FA(true);
        setIsLoading(false);
        toast({
          title: "Verificação necessária 🔒",
          description: "Um código de segurança foi enviado para seu email.",
        });
        return;
      }

      toast({
        title: "Login realizado! ✅",
        description: "Bem-vindo de volta ao Bot Reals Zapp.",
      });
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
        isOpen={show2FA}
        userId={verificationUserId}
        deviceFingerprint={deviceFingerprint}
        sessionData={sessionData}
        onSuccess={() => {
          setShow2FA(false);
          toast({
            title: "Login realizado com sucesso! 🎉",
            description: "Bem-vindo ao Bot Reals Zapp.",
          });
          navigate("/dashboard");
        }}
      />
    );
  }

  return (
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

      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-48 h-48 sm:w-64 sm:h-64 bg-white/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-72 h-72 sm:w-96 sm:h-96 bg-white/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8 items-center relative z-10">
        {/* Logo e Descrição - Apenas Desktop */}
        <div className="hidden md:block text-white space-y-6 px-0">
          <div className="flex items-center gap-3 mb-8 animate-fade-in">
            <div className="bg-white/20 backdrop-blur-sm p-4 rounded-2xl shadow-glow">
              {logoUrl ? (
                <img src={logoUrl} alt="Logo" className="w-12 h-12 object-contain" />
              ) : (
                <Bot className="w-12 h-12" />
              )}
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-bold">Bot Reals Zapp</h1>
              <p className="text-lg md:text-xl text-white/90">Automação Inteligente</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-start gap-3 glass p-5 rounded-xl hover-scale transition-smooth animate-fade-in bg-white/90">
              <div className="bg-primary/20 p-2 rounded-lg">
                <Zap className="w-6 h-6 flex-shrink-0 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1 text-gray-900">Conexão Instantânea</h3>
                <p className="text-gray-800 text-sm">Conecte seu WhatsApp em segundos via QR Code</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 glass p-5 rounded-xl hover-scale transition-smooth animate-fade-in bg-white/90" style={{ animationDelay: '0.1s' }}>
              <div className="bg-primary/20 p-2 rounded-lg">
                <Bot className="w-6 h-6 flex-shrink-0 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1 text-gray-900">Chatbots Inteligentes</h3>
                <p className="text-gray-800 text-sm">Crie automações e agentes IA sem programar</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 glass p-5 rounded-xl hover-scale transition-smooth animate-fade-in bg-white/90" style={{ animationDelay: '0.2s' }}>
              <div className="bg-primary/20 p-2 rounded-lg">
                <Zap className="w-6 h-6 flex-shrink-0 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1 text-gray-900">3 Dias Grátis</h3>
                <p className="text-gray-800 text-sm">Teste todas as funcionalidades sem compromisso</p>
              </div>
            </div>
          </div>
        </div>

        {/* Formulário de Auth */}
        <Card className="w-full p-6 sm:p-8 md:p-10 shadow-2xl backdrop-blur-sm bg-card/95 border-white/10 animate-scale-in">
          {/* Logo Mobile - Aparece apenas no mobile */}
          <div className="md:hidden flex items-center justify-center gap-2 mb-6">
            <div className="bg-primary/10 p-2 rounded-lg">
              {logoUrl ? (
                <img src={logoUrl} alt="Logo" className="w-8 h-8 object-contain" />
              ) : (
                <Bot className="w-8 h-8 text-primary" />
              )}
            </div>
            <span className="text-xl font-bold">Bot Reals Zapp</span>
          </div>
          
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
  );
};

export default Auth;
