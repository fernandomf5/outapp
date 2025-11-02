import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Shield, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface TwoFactorVerificationProps {
  onSuccess: () => void;
  userId: string;
  deviceFingerprint: string;
  sessionData?: any;
  onBack: () => void;
}

export const TwoFactorVerification = ({
  onSuccess,
  userId,
  deviceFingerprint,
  sessionData,
  onBack,
}: TwoFactorVerificationProps) => {
  const [code, setCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendTimer, setResendTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const { toast } = useToast();

  // Timer para habilitar botão de reenviar
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => {
        setResendTimer(resendTimer - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [resendTimer]);

  const handleVerify = async () => {
    if (code.length !== 6) {
      toast({
        title: "Código inválido",
        description: "O código deve ter 6 dígitos",
        variant: "destructive",
      });
      return;
    }

    setIsVerifying(true);

    try {
      const { data, error } = await supabase.functions.invoke('user-auth', {
        body: {
          action: 'verify-2fa',
          userId,
          code,
          deviceFingerprint,
          deviceName: navigator.userAgent.split('(')[1]?.split(')')[0] || 'Navegador',
        }
      });

      if (error) throw error;

      if (data.error) {
        toast({
          title: "Erro na verificação",
          description: data.error,
          variant: "destructive",
        });
        return;
      }

      // Set session after successful 2FA verification
      if (sessionData) {
        await supabase.auth.setSession(sessionData);
      }

      toast({
        title: "Verificação bem-sucedida! ✅",
        description: "Este dispositivo foi marcado como confiável por 30 dias.",
      });

      onSuccess();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendCode = async () => {
    setIsResending(true);
    setCode("");

    try {
      const { data, error } = await supabase.functions.invoke('user-auth', {
        body: {
          action: 'resend-2fa',
          userId,
        }
      });

      if (error) throw error;

      if (data.error) {
        toast({
          title: "Erro ao reenviar",
          description: data.error,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Código reenviado! 📧",
        description: "Verifique seu email novamente.",
      });

      // Reset timer
      setResendTimer(30);
      setCanResend(false);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center gradient-primary p-4 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 bg-white/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      {/* Botão Voltar */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onBack}
        className="absolute top-4 left-4 text-white hover:bg-white/10 active:scale-95 transition-transform z-20"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Voltar
      </Button>

      <Card className="w-full max-w-md p-8 shadow-2xl backdrop-blur-sm bg-card/95 border-white/10 animate-scale-in relative z-10">
        <div className="flex flex-col items-center mb-6">
          <div className="bg-primary/10 p-4 rounded-2xl mb-4 shadow-glow">
            <Shield className="w-12 h-12 text-primary" />
          </div>
          <h2 className="text-3xl font-bold text-center mb-2">Verificação de Duas Etapas</h2>
          <p className="text-muted-foreground text-center">
            Um código de verificação foi enviado para seu email. Digite-o abaixo para continuar.
          </p>
        </div>

        <div className="space-y-6">
          <div>
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="000000"
              maxLength={6}
              className="text-center text-3xl tracking-widest font-bold h-16"
              autoFocus
            />
            <p className="text-sm text-muted-foreground mt-3 text-center">
              ⏱️ O código expira em 10 minutos
            </p>
          </div>

          <Button
            onClick={handleVerify}
            disabled={code.length !== 6 || isVerifying}
            className="w-full text-lg py-6 gradient-primary shadow-glow hover-scale font-semibold active:scale-95 transition-transform"
          >
            {isVerifying ? "Verificando..." : "Verificar Código"}
          </Button>

          <Button
            onClick={handleResendCode}
            disabled={!canResend || isResending}
            variant="outline"
            className="w-full"
          >
            {isResending 
              ? "Reenviando..." 
              : canResend 
                ? "Reenviar Código" 
                : `Reenviar em ${resendTimer}s`
            }
          </Button>

          <div className="glass p-4 rounded-xl text-center">
            <p className="text-sm text-muted-foreground">
              🔒 Este dispositivo será marcado como confiável por 30 dias após a verificação
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};
