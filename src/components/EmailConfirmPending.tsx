import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { MailCheck, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface EmailConfirmPendingProps {
  email: string;
  onBack: () => void;
}

/**
 * Tela exibida após o cadastro: o usuário confirma a conta pelo link
 * enviado por e-mail (fluxo nativo de autenticação), sem código numérico.
 */
export const EmailConfirmPending = ({ email, onBack }: EmailConfirmPendingProps) => {
  const [isResending, setIsResending] = useState(false);
  const { toast } = useToast();

  const handleResend = async (): Promise<void> => {
    setIsResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
        options: { emailRedirectTo: `${window.location.origin}/email-confirmed` },
      });

      if (error) {
        toast({
          title: "Não foi possível reenviar",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "E-mail reenviado ✉️",
        description: "Confira sua caixa de entrada e também o spam.",
      });
    } finally {
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

      <Card className="w-full max-w-md p-8 shadow-2xl backdrop-blur-sm bg-card/95 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
          <MailCheck className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold mb-2">Confirme seu e-mail</h2>
        <p className="text-muted-foreground">
          Enviamos um link de confirmação para
          <br />
          <strong className="break-all">{email}</strong>
        </p>

        <div className="mt-6 space-y-3 text-sm text-muted-foreground">
          <p>Abra o e-mail e clique em confirmar para ativar sua conta.</p>
          <p>Se não encontrar, verifique a caixa de spam ou promoções.</p>
        </div>

        <div className="mt-6 space-y-2">
          <Button
            onClick={handleResend}
            disabled={isResending}
            className="w-full gradient-primary shadow-glow"
          >
            {isResending ? "Reenviando..." : "Reenviar e-mail de confirmação"}
          </Button>
          <Button variant="link" onClick={onBack} className="text-primary">
            Já confirmei, fazer login
          </Button>
        </div>
      </Card>
    </div>
  );
};
