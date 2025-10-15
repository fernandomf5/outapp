import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Lock, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { z } from "zod";

const passwordSchema = z
  .string()
  .min(6, "A senha deve ter pelo menos 6 caracteres")
  .max(100, "A senha não pode ter mais de 100 caracteres");

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validação da senha
    const validation = passwordSchema.safeParse(password);
    if (!validation.success) {
      toast({
        title: "Senha inválida",
        description: validation.error.issues[0].message,
        variant: "destructive",
      });
      return;
    }

    // Verificar se as senhas coincidem
    if (password !== confirmPassword) {
      toast({
        title: "Senhas não coincidem",
        description: "Por favor, certifique-se de que as senhas são idênticas.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) throw error;

      setSuccess(true);
      toast({
        title: "Senha redefinida! ✅",
        description: "Sua senha foi alterada com sucesso.",
      });

      // Redirecionar após 2 segundos
      setTimeout(() => {
        navigate("/dashboard");
      }, 2000);
    } catch (error: any) {
      console.error("Erro ao redefinir senha:", error);
      toast({
        title: "Erro ao redefinir senha",
        description: error.message || "Não foi possível alterar sua senha. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-primary/5 via-background to-accent/10">
        <Card className="w-full max-w-md p-8 text-center space-y-6 shadow-xl">
          <div className="flex justify-center">
            <div className="bg-green-100 p-4 rounded-full">
              <CheckCircle2 className="w-12 h-12 text-green-600" />
            </div>
          </div>
          
          <div className="space-y-3">
            <h1 className="text-2xl font-bold">Senha Alterada!</h1>
            <p className="text-muted-foreground">
              Sua senha foi redefinida com sucesso. Redirecionando para o dashboard...
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-primary/5 via-background to-accent/10">
      <Card className="w-full max-w-md p-8 space-y-6 shadow-xl">
        <div className="space-y-2 text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-primary/10 p-3 rounded-full">
              <Lock className="w-8 h-8 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl font-bold">Nova Senha</h1>
          <p className="text-muted-foreground">
            Crie uma senha forte e segura para sua conta
          </p>
        </div>

        <form onSubmit={handleResetPassword} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">
              Nova senha
            </label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Digite sua nova senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                className="h-12 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            <p className="text-xs text-muted-foreground">Mínimo de 6 caracteres</p>
          </div>

          <div className="space-y-2">
            <label htmlFor="confirmPassword" className="text-sm font-medium">
              Confirmar nova senha
            </label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Digite novamente sua senha"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={isLoading}
                className="h-12 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full h-12 text-base" 
            disabled={isLoading}
          >
            {isLoading ? "Alterando senha..." : "Confirmar Nova Senha"}
          </Button>
        </form>

        <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg text-sm space-y-2">
          <p className="font-semibold text-blue-900 dark:text-blue-100">🔒 Dicas de Segurança</p>
          <ul className="space-y-1 text-blue-800 dark:text-blue-200 text-xs">
            <li>• Use letras maiúsculas e minúsculas</li>
            <li>• Inclua números e caracteres especiais</li>
            <li>• Evite informações pessoais óbvias</li>
            <li>• Não reutilize senhas de outros sites</li>
          </ul>
        </div>
      </Card>
    </div>
  );
};

export default ResetPassword;
