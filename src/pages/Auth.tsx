import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Bot, Zap } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, isAdmin, signUp, signIn, loading } = useAuth();

  // Redirect if already logged in
  useEffect(() => {
    if (user && !loading) {
      // Pequeno delay para garantir que isAdmin foi definido
      setTimeout(() => {
        navigate(isAdmin ? "/admin" : "/dashboard");
      }, 200);
    }
  }, [user, isAdmin, loading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Validação de email real
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast({
        title: "Email inválido",
        description: "Por favor, insira um email válido.",
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

      if (password.length < 6) {
        toast({
          title: "Senha muito curta",
          description: "A senha deve ter pelo menos 6 caracteres.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Sign Up
      const { error } = await signUp(email, password, name);
      
      if (error) {
        toast({
          title: "Erro ao criar conta",
          description: error.message,
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      toast({
        title: "Conta criada com sucesso! 🎉",
        description: "Verificação de email enviada. Você já pode fazer login!",
      });
      
      setIsLoading(false);
    } else {
      // Sign In
      const { error } = await signIn(email, password);
      
      if (error) {
        toast({
          title: "Erro ao fazer login",
          description: error.message,
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      toast({
        title: "Login realizado! ✅",
        description: "Bem-vindo de volta ao Bot Reals Zapp.",
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center gradient-primary p-4 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 bg-white/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="w-full max-w-6xl grid md:grid-cols-2 gap-8 items-center relative z-10">
        {/* Logo e Descrição - Mobile Visível */}
        <div className="text-white space-y-6">
          <div className="flex items-center gap-3 mb-8 animate-fade-in">
            <div className="bg-white/20 backdrop-blur-sm p-4 rounded-2xl shadow-glow">
              <Bot className="w-12 h-12" />
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-bold">Bot Reals Zapp</h1>
              <p className="text-lg md:text-xl text-white/90">Automação Inteligente para WhatsApp</p>
            </div>
          </div>
          
          <div className="space-y-4 hidden md:block">
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
        <Card className="p-8 md:p-10 shadow-2xl backdrop-blur-sm bg-card/95 border-white/10 animate-scale-in">
          <div className="mb-8 text-center">
            <div className="inline-block p-3 bg-primary/10 rounded-full mb-4">
              <Bot className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
              {isLogin ? "Bem-vindo de volta!" : "Crie sua conta"}
            </h2>
            <p className="text-muted-foreground text-base">
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
                  className="pr-10"
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
                    className="pr-10"
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
                  className="text-sm text-primary hover:underline"
                  onClick={() => {
                    toast({
                      title: "Link enviado! 📧",
                      description: "Verifique seu email para redefinir a senha.",
                    });
                  }}
                >
                  Esqueceu a senha?
                </button>
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full text-lg py-6 gradient-primary shadow-glow hover-scale font-semibold"
              disabled={isLoading}
            >
              {isLoading ? "Aguarde..." : (isLogin ? "Entrar na Plataforma" : "Criar Conta Grátis 🚀")}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-muted-foreground">
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
