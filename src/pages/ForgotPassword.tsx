import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Mail, CheckCircle2 } from "lucide-react";
import { z } from "zod";

const emailSchema = z.string().email("Por favor, insira um e-mail válido");

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validação do email
    const validation = emailSchema.safeParse(email);
    if (!validation.success) {
      toast({
        title: "E-mail inválido",
        description: validation.error.issues[0].message,
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const redirectUrl = `${window.location.origin}/reset-password`;
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });

      if (error) throw error;

      setEmailSent(true);
      toast({
        title: "E-mail enviado! 📧",
        description: "Verifique sua caixa de entrada para redefinir sua senha.",
      });
    } catch (error: any) {
      console.error("Erro ao enviar e-mail de recuperação:", error);
      toast({
        title: "Erro ao enviar e-mail",
        description: error.message || "Não foi possível enviar o e-mail de recuperação. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-primary/5 via-background to-accent/10">
        <Card className="w-full max-w-md p-8 text-center space-y-6 shadow-xl">
          <div className="flex justify-center">
            <div className="bg-green-100 p-4 rounded-full">
              <CheckCircle2 className="w-12 h-12 text-green-600" />
            </div>
          </div>
          
          <div className="space-y-3">
            <h1 className="text-2xl font-bold">E-mail Enviado!</h1>
            <p className="text-muted-foreground">
              Enviamos um link de recuperação para:
            </p>
            <p className="font-semibold text-primary">{email}</p>
          </div>

          <div className="bg-muted/50 p-4 rounded-lg text-sm text-left space-y-2">
            <p className="font-semibold">📌 Próximos passos:</p>
            <ol className="space-y-1 ml-4 list-decimal text-muted-foreground">
              <li>Verifique sua caixa de entrada</li>
              <li>Clique no link recebido</li>
              <li>Crie sua nova senha</li>
            </ol>
          </div>

          <p className="text-xs text-muted-foreground">
            Não recebeu o e-mail? Verifique a pasta de spam ou tente novamente em alguns minutos.
          </p>

          <Button 
            onClick={() => navigate("/auth")} 
            variant="outline" 
            className="w-full"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para Login
          </Button>
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
              <Mail className="w-8 h-8 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl font-bold">Recuperar Senha</h1>
          <p className="text-muted-foreground">
            Digite seu e-mail cadastrado e enviaremos um link para redefinir sua senha
          </p>
        </div>

        <form onSubmit={handleResetPassword} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              E-mail cadastrado
            </label>
            <Input
              id="email"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
              className="h-12"
            />
          </div>

          <Button 
            type="submit" 
            className="w-full h-12 text-base" 
            disabled={isLoading}
          >
            {isLoading ? "Enviando..." : "Enviar Link de Recuperação"}
          </Button>

          <Button 
            type="button"
            onClick={() => navigate("/auth")} 
            variant="ghost" 
            className="w-full"
            disabled={isLoading}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para Login
          </Button>
        </form>

        <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg text-sm space-y-2">
          <p className="font-semibold text-blue-900 dark:text-blue-100">💡 Dica de Segurança</p>
          <p className="text-blue-800 dark:text-blue-200">
            O link de recuperação expira em 1 hora por questões de segurança.
          </p>
        </div>
      </Card>
    </div>
  );
};

export default ForgotPassword;
