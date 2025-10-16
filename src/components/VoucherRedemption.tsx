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
      // Buscar voucher
      const { data: voucher, error: voucherError } = await supabase
        .from('vouchers')
        .select('*, plans(*)')
        .eq('code', code.toUpperCase())
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

      let planName = "";
      
      // Se o voucher tem um plano, criar assinatura baseada no plano
      if (voucher.plan_id && voucher.plans) {
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + voucher.plans.duration_days);
        planName = voucher.plans.name;

        const { error: subscriptionError } = await supabase
          .from('subscriptions')
          .insert({
            user_id: user!.id,
            plan_id: voucher.plan_id,
            status: 'active',
            expires_at: expiresAt.toISOString()
          });

        if (subscriptionError) throw subscriptionError;
      } 
      // Se o voucher tem recursos customizados, criar assinatura temporária
      else if (voucher.duration_days) {
        // Buscar recursos do voucher
        const { data: voucherFeatures } = await supabase
          .from('voucher_features')
          .select('feature_id, features(name)')
          .eq('voucher_id', voucher.id);

        if (!voucherFeatures || voucherFeatures.length === 0) {
          toast({
            title: "Erro no voucher",
            description: "Voucher sem recursos configurados",
            variant: "destructive"
          });
          return;
        }

        // Criar um plano temporário para o voucher
        planName = `Voucher ${code}`;
        
        const { data: newPlan, error: planError } = await supabase
          .from('plans')
          .insert({
            name: planName,
            description: `Plano ativado por voucher ${code} com ${voucher.duration_days} dias de acesso`,
            price: 0,
            duration_days: voucher.duration_days,
            plan_type: 'paid' as any,
            is_active: false,
            features: null
          })
          .select()
          .single();

        if (planError) throw planError;

        // Associar features ao plano
        const planFeatureInserts = voucherFeatures.map((vf: any) => ({
          plan_id: newPlan.id,
          feature_id: vf.feature_id
        }));

        await supabase.from('plan_features').insert(planFeatureInserts);

        // Criar assinatura
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + voucher.duration_days);

        const { error: subscriptionError } = await supabase
          .from('subscriptions')
          .insert({
            user_id: user!.id,
            plan_id: newPlan.id,
            status: 'active',
            expires_at: expiresAt.toISOString()
          });

        if (subscriptionError) throw subscriptionError;
      }

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
