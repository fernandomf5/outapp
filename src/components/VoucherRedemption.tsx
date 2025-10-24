import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Ticket, CheckCircle2 } from "lucide-react";

export const VoucherRedemption = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleRedeem = async () => {
    if (!code.trim()) {
      toast({
        title: "Erro",
        description: "Digite um código de voucher",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      // Normalizar código (trim + uppercase)
      const normalizedCode = code.trim().toUpperCase();

      // Buscar voucher
      const { data: voucher, error: voucherError } = await supabase
        .from('vouchers')
        .select('*, plans(*)')
        .eq('code', normalizedCode)
        .eq('is_active', true)
        .maybeSingle();

      if (voucherError || !voucher) {
        toast({
          title: "Voucher inválido",
          description: "Código não encontrado ou inativo",
          variant: "destructive"
        });
        return;
      }

      // Verificar se já foi usado
      const { data: existingRedemption } = await supabase
        .from('voucher_redemptions')
        .select('*')
        .eq('voucher_id', voucher.id)
        .eq('user_id', user!.id)
        .maybeSingle();

      if (existingRedemption) {
        toast({
          title: "Voucher já utilizado",
          description: "Você já resgatou este voucher",
          variant: "destructive"
        });
        return;
      }

      // Verificar limite de usos
      if (voucher.current_uses >= voucher.max_uses) {
        toast({
          title: "Voucher esgotado",
          description: "Este voucher atingiu o limite de usos",
          variant: "destructive"
        });
        return;
      }

      // Verificar expiração
      if (voucher.expires_at && new Date(voucher.expires_at) < new Date()) {
        toast({
          title: "Voucher expirado",
          description: "Este voucher não é mais válido",
          variant: "destructive"
        });
        return;
      }

      // Todo voucher agora deve ter um plan_id vinculado
      if (!voucher.plan_id) {
        toast({
          title: "Erro no voucher",
          description: "Voucher sem plano configurado. Contate o administrador.",
          variant: "destructive"
        });
        return;
      }

      // Buscar dados do plano
      const { data: plan, error: planFetchError } = await supabase
        .from('plans')
        .select('*')
        .eq('id', voucher.plan_id)
        .maybeSingle();

      if (planFetchError || !plan) {
        toast({
          title: "Erro no voucher",
          description: "Plano associado ao voucher não encontrado",
          variant: "destructive"
        });
        return;
      }

      // Determinar data de expiração
      let expiresAt: Date;
      if (plan.duration_days === null) {
        // Vitalício - 100 anos no futuro
        expiresAt = new Date();
        expiresAt.setFullYear(expiresAt.getFullYear() + 100);
      } else {
        expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + plan.duration_days);
      }

      // Cancelar assinaturas antigas do usuário antes de criar a nova
      const { error: cancelError } = await supabase
        .from('subscriptions')
        .update({ status: 'cancelled' })
        .eq('user_id', user!.id)
        .eq('status', 'active');

      if (cancelError) {
        console.error('Erro ao cancelar assinaturas antigas:', cancelError);
      }

      // Criar nova assinatura
      const { error: subscriptionError } = await supabase
        .from('subscriptions')
        .insert({
          user_id: user!.id,
          plan_id: voucher.plan_id,
          status: 'active',
          expires_at: expiresAt.toISOString()
        });

      if (subscriptionError) {
        console.error('Erro ao criar subscription:', subscriptionError);
        throw new Error('Não foi possível ativar o plano. Verifique se você tem permissão.');
      }

      const planName = plan.name;

      // Registrar resgate
      const { error: redemptionError } = await supabase
        .from('voucher_redemptions')
        .insert({
          voucher_id: voucher.id,
          user_id: user!.id
        });

      if (redemptionError) throw redemptionError;

      // Atualizar contador de usos
      await supabase
        .from('vouchers')
        .update({ current_uses: voucher.current_uses + 1 })
        .eq('id', voucher.id);

      toast({
        title: "Voucher resgatado! 🎉",
        description: `Você ativou: ${planName}`
      });

      setCode("");
      
      // Recarregar página para atualizar assinatura
      setTimeout(() => window.location.reload(), 2000);
    } catch (error: any) {
      console.error('Erro ao resgatar voucher:', error);
      toast({
        title: "Erro ao resgatar",
        description: error.message || "Tente novamente",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-primary/10 p-3 rounded-xl">
          <Ticket className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h3 className="text-xl font-bold">Resgatar Voucher</h3>
          <p className="text-sm text-muted-foreground">
            Ative um plano ou recursos usando um código promocional
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <Label>Código do Voucher</Label>
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="Digite o código"
            maxLength={20}
            disabled={isLoading}
          />
        </div>

        <Button
          onClick={handleRedeem}
          disabled={isLoading || !code.trim()}
          className="w-full gradient-primary"
        >
          {isLoading ? "Resgatando..." : "Resgatar Voucher"}
        </Button>

        <div className="bg-accent/50 p-4 rounded-lg">
          <h4 className="font-semibold mb-2 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-success" />
            Como funciona:
          </h4>
          <ul className="text-sm space-y-1 text-muted-foreground">
            <li>• Digite o código do voucher no campo acima</li>
            <li>• O plano ou recursos serão ativados automaticamente</li>
            <li>• Vouchers só podem ser usados uma vez por usuário</li>
            <li>• Verifique a data de validade do código</li>
          </ul>
        </div>
      </div>
    </Card>
  );
};
