import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface TwoFactorVerificationProps {
  isOpen: boolean;
  onSuccess: () => void;
  userId: string;
  deviceFingerprint: string;
}

export const TwoFactorVerification = ({
  isOpen,
  onSuccess,
  userId,
  deviceFingerprint,
}: TwoFactorVerificationProps) => {
  const [code, setCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const { toast } = useToast();

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

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-primary/10 p-3 rounded-xl">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <div>
              <DialogTitle>Verificação de Duas Etapas</DialogTitle>
            </div>
          </div>
          <DialogDescription>
            Um código de verificação foi enviado para seu email. Digite-o abaixo para continuar.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="000000"
              maxLength={6}
              className="text-center text-2xl tracking-widest"
              autoFocus
            />
            <p className="text-xs text-muted-foreground mt-2 text-center">
              O código expira em 10 minutos
            </p>
          </div>

          <Button
            onClick={handleVerify}
            disabled={code.length !== 6 || isVerifying}
            className="w-full gradient-primary shadow-glow"
          >
            {isVerifying ? "Verificando..." : "Verificar"}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Este dispositivo será marcado como confiável por 30 dias após a verificação
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
