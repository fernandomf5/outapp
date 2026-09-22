import { Card } from "@/components/ui/card";
import { Shield } from "lucide-react";

export const AdminSecurityPanel = () => {
  return (
    <div className="space-y-6">
      <Card className="p-6 bg-gradient-to-br from-card via-card to-primary/5 border-primary/20">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-gradient-to-br from-primary/20 to-primary/10 p-3 rounded-xl shadow-glow">
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Segurança da Conta</h2>
            <p className="text-sm text-muted-foreground">
              Acesso protegido por e-mail e senha
            </p>
          </div>
        </div>

        <div className="p-4 bg-muted/50 rounded-lg border border-border">
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• O cadastro é confirmado por um link enviado ao e-mail.</li>
            <li>• O acesso é feito apenas com e-mail e senha.</li>
            <li>• A recuperação de senha continua disponível na tela de login.</li>
          </ul>
        </div>
      </Card>
    </div>
  );
};
