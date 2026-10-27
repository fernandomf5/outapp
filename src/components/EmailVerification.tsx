import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Mail, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface EmailVerificationProps {
  userId: string;
  email: string;
  onVerified: () => void;
  onBack: () => void;
}

export const EmailVerification = ({ userId, email, onVerified, onBack }: EmailVerificationProps) => {
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const { toast } = useToast();

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: code.trim(),
        type: 'signup',
      });
      if (error) throw error;

      toast({
        title: "E-mail confirmado",
        description: "Sua conta foi ativada com sucesso.",
      });
      onVerified();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setIsResending(true);

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email.trim(),
      });
      if (error) throw error;

      toast({
        title: "Código reenviado",
        description: "Confira sua caixa de entrada e a pasta de spam.",
      });
      setIsResending(false);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center gradient-primary p-4">
      <Button
        variant="ghost"
        size="sm"
        onClick={onBack}
        className="absolute top-4 left-4 text-white hover:bg-white/10"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Voltar
      </Button>

      <Card className="w-full max-w-md p-8 shadow-2xl backdrop-blur-sm bg-card/95">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
            <Mail className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-3xl font-bold mb-2">Verifique seu Email</h2>
          <p className="text-muted-foreground">
            Enviamos um código de 6 dígitos para
            <br />
            <strong>{email}</strong>
          </p>
        </div>

        <form onSubmit={handleVerify} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="code">Código de Verificação</Label>
            <Input
              id="code"
              type="text"
              placeholder="000000"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              maxLength={6}
              required
              className="text-center text-2xl tracking-widest h-14"
            />
          </div>

          <Button 
            type="submit" 
            className="w-full gradient-primary shadow-glow"
            disabled={isLoading || code.length !== 6}
          >
            {isLoading ? "Verificando..." : "Verificar Email"}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground mb-2">
            Não recebeu o código?
          </p>
          <Button
            variant="link"
            onClick={handleResend}
            disabled={isResending}
            className="text-primary"
          >
            {isResending ? "Reenviando..." : "Reenviar código"}
          </Button>
        </div>

        <p className="text-xs text-muted-foreground text-center mt-4">
          Use o código mais recente recebido por e-mail
        </p>
      </Card>
    </div>
  );
};
