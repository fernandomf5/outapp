import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Bot, Zap } from "lucide-react";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validação de email real
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast({
        title: "Email inválido",
        description: "Por favor, insira um email válido.",
        variant: "destructive",
      });
      return;
    }

    if (!isLogin && password !== confirmPassword) {
      toast({
        title: "Senhas não coincidem",
        description: "As senhas digitadas não são iguais.",
        variant: "destructive",
      });
      return;
    }

    // Verificar se é o admin master
    if (email === "fernandomoraisgarcia2011@gmail.com" && password === "C@.ar3u#s2w8") {
      toast({
        title: "Bem-vindo, Admin Master! 👑",
        description: "Acesso administrativo concedido.",
      });
      navigate("/admin");
      return;
    }

    if (isLogin) {
      toast({
        title: "Login realizado! ✅",
        description: "Bem-vindo de volta ao Bot Reals Zapp.",
      });
      navigate("/dashboard");
    } else {
      // Simular envio de email de confirmação
      toast({
        title: "Conta criada! 📧",
        description: `Um email de confirmação foi enviado para ${email}`,
      });
      
      // Após 3 segundos, redirecionar para dashboard (simulando confirmação)
      setTimeout(() => {
        navigate("/dashboard");
      }, 3000);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center gradient-primary p-4">
      <div className="w-full max-w-6xl grid md:grid-cols-2 gap-8 items-center">
        {/* Logo e Descrição */}
        <div className="text-white space-y-6 hidden md:block">
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-white/20 backdrop-blur-sm p-4 rounded-2xl">
              <Bot className="w-12 h-12" />
            </div>
            <div>
              <h1 className="text-5xl font-bold">Bot Reals Zapp</h1>
              <p className="text-xl text-white/90">Automação Inteligente para WhatsApp</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-start gap-3 glass p-4 rounded-xl">
              <Zap className="w-6 h-6 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-lg">Conexão Instantânea</h3>
                <p className="text-white/80">Conecte seu WhatsApp em segundos via QR Code</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 glass p-4 rounded-xl">
              <Bot className="w-6 h-6 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-lg">Chatbots Inteligentes</h3>
                <p className="text-white/80">Crie automações e agentes IA sem programar</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 glass p-4 rounded-xl">
              <Zap className="w-6 h-6 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-lg">3 Dias Grátis</h3>
                <p className="text-white/80">Teste todas as funcionalidades sem compromisso</p>
              </div>
            </div>
          </div>
        </div>

        {/* Formulário de Auth */}
        <Card className="p-8 shadow-2xl">
          <div className="mb-6 text-center">
            <h2 className="text-3xl font-bold text-foreground mb-2">
              {isLogin ? "Bem-vindo de volta!" : "Crie sua conta"}
            </h2>
            <p className="text-muted-foreground">
              {isLogin
                ? "Entre para gerenciar seus chatbots"
                : "Comece grátis por 3 dias"}
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

            <Button type="submit" className="w-full text-lg py-6 gradient-primary shadow-glow">
              {isLogin ? "Entrar" : "Criar Conta Grátis"}
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
