import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CreditCard, Check, X, Loader2, Ticket, CheckCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";

interface Plan {
  id: string;
  name: string;
  price: number;
  plan_type: string;
  description: string;
  features: string[];
}

interface MercadoPagoCheckoutProps {
  plan: Plan;
  onClose: () => void;
}

export const MercadoPagoCheckout = ({ plan, onClose }: MercadoPagoCheckoutProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [mercadoPagoConfigured, setMercadoPagoConfigured] = useState(false);
  const [checkoutBannerUrl, setCheckoutBannerUrl] = useState("");
  
  // Cupom de desconto
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{
    id: string;
    code: string;
    discount_type: string;
    discount_value: number;
    discount_amount: number;
    final_price: number;
  } | null>(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);

  useEffect(() => {
    checkMercadoPagoConfig();
    fetchCheckoutSettings();
  }, []);

  const checkMercadoPagoConfig = async () => {
    const { data } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'mercadopago_access_token')
      .single();

    setMercadoPagoConfigured(!!data?.value);
  };

  const fetchCheckoutSettings = async () => {
    const { data } = await supabase
      .from('site_settings')
      .select('key, value')
      .in('key', ['checkout_banner_url']);

    if (data) {
      data.forEach(item => {
        if (item.key === 'checkout_banner_url') {
          setCheckoutBannerUrl(item.value || "");
        }
      });
    }
  };

  const validateCoupon = async () => {
    if (!couponCode.trim()) return;
    
    setValidatingCoupon(true);
    
    try {
      // Buscar cupom
      const { data: coupon, error } = await supabase
        .from("discount_coupons")
        .select("*")
        .eq("code", couponCode.toUpperCase())
        .eq("is_active", true)
        .single();

      if (error || !coupon) {
        toast({ title: "Cupom inválido", description: "Este cupom não existe ou está inativo", variant: "destructive" });
        setValidatingCoupon(false);
        return;
      }

      // Verificar validade
      const now = new Date();
      const validFrom = new Date(coupon.valid_from);
      const validUntil = coupon.valid_until ? new Date(coupon.valid_until) : null;

      if (now < validFrom) {
        toast({ title: "Cupom inválido", description: "Este cupom ainda não está válido", variant: "destructive" });
        setValidatingCoupon(false);
        return;
      }

      if (validUntil && now > validUntil) {
        toast({ title: "Cupom expirado", description: "Este cupom já expirou", variant: "destructive" });
        setValidatingCoupon(false);
        return;
      }

      // Verificar limite de usos
      if (coupon.max_uses && coupon.uses_count >= coupon.max_uses) {
        toast({ title: "Cupom esgotado", description: "Este cupom atingiu o limite de usos", variant: "destructive" });
        setValidatingCoupon(false);
        return;
      }

      // Verificar usos por usuário
      if (user) {
        const { count } = await supabase
          .from("coupon_usages")
          .select("*", { count: "exact", head: true })
          .eq("coupon_id", coupon.id)
          .eq("user_id", user.id);

        if (count && count >= coupon.max_uses_per_user) {
          toast({ title: "Limite atingido", description: `Você já usou este cupom ${count} vez(es)`, variant: "destructive" });
          setValidatingCoupon(false);
          return;
        }
      }

      // Verificar valor mínimo
      if (plan.price < coupon.min_purchase_amount) {
        toast({ title: "Valor mínimo", description: `Este cupom requer compra mínima de R$ ${coupon.min_purchase_amount}`, variant: "destructive" });
        setValidatingCoupon(false);
        return;
      }

      // Verificar plano aplicável
      if (coupon.applicable_plans && coupon.applicable_plans.length > 0 && !coupon.applicable_plans.includes(plan.id)) {
        toast({ title: "Cupom não aplicável", description: "Este cupom não é válido para este plano", variant: "destructive" });
        setValidatingCoupon(false);
        return;
      }

      // Calcular desconto
      let discountAmount: number;
      if (coupon.discount_type === "percentage") {
        discountAmount = (plan.price * coupon.discount_value) / 100;
      } else {
        discountAmount = coupon.discount_value;
      }
      discountAmount = Math.min(discountAmount, plan.price); // Não pode dar desconto maior que o preço

      const finalPrice = Math.max(0, plan.price - discountAmount);

      setAppliedCoupon({
        id: coupon.id,
        code: coupon.code,
        discount_type: coupon.discount_type,
        discount_value: coupon.discount_value,
        discount_amount: discountAmount,
        final_price: finalPrice,
      });

      toast({ title: "Cupom aplicado!", description: `Desconto de R$ ${discountAmount.toFixed(2)} aplicado` });
    } catch (error) {
      console.error("Erro ao validar cupom:", error);
      toast({ title: "Erro", description: "Erro ao validar cupom", variant: "destructive" });
    }
    
    setValidatingCoupon(false);
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
  };

  const handleCheckout = async () => {
    if (!mercadoPagoConfigured) {
      toast({
        title: "Erro",
        description: "Mercado Pago não está configurado. Entre em contato com o suporte.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      toast({
        title: "Processando pagamento",
        description: "Criando preferência de pagamento...",
      });

      // Chamar edge function para criar preferência no Mercado Pago
      const { data, error } = await supabase.functions.invoke('create-mercadopago-preference', {
        body: { 
          planId: plan.id,
          couponId: appliedCoupon?.id || null,
          discountAmount: appliedCoupon?.discount_amount || 0,
          finalPrice: appliedCoupon?.final_price ?? plan.price,
        }
      });

      if (error) {
        throw error;
      }

      if (!data?.init_point) {
        throw new Error('Erro ao criar preferência de pagamento');
      }

      toast({
        title: "Redirecionando",
        description: "Você será redirecionado para o Mercado Pago...",
      });

      // Redirecionar para o checkout do Mercado Pago
      window.location.href = data.init_point;

    } catch (error) {
      console.error('Erro no checkout:', error);
      toast({
        title: "Erro no pagamento",
        description: error.message || "Ocorreu um erro ao processar o pagamento. Tente novamente.",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  const displayPrice = appliedCoupon ? appliedCoupon.final_price : plan.price;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="relative">
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-4"
            onClick={onClose}
          >
            <X className="w-4 h-4" />
          </Button>
          
          {checkoutBannerUrl && (
            <div className="mb-4 rounded-lg overflow-hidden">
              <img 
                src={checkoutBannerUrl} 
                alt="Checkout Banner" 
                className="w-full h-auto object-cover max-h-48"
              />
            </div>
          )}
          
          <CardTitle className="text-2xl">Finalizar Assinatura</CardTitle>
          <CardDescription>
            Você está adquirindo o plano {plan.name}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Resumo do Plano */}
          <div className="p-6 rounded-lg bg-primary/5 border border-primary/10">
            <h3 className="text-lg font-semibold mb-4">{plan.name}</h3>
            <div className="space-y-2 mb-4">
              {plan.features && plan.features.length > 0 && plan.features.map((feature, idx) => (
                <div key={idx} className="flex items-start gap-2 text-sm">
                  <Check className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
            <div className="pt-4 border-t border-primary/10 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Preço original</span>
                <span className={appliedCoupon ? "line-through text-muted-foreground" : "text-xl font-bold text-primary"}>
                  R$ {plan.price.toFixed(2)}
                </span>
              </div>
              {appliedCoupon && (
                <>
                  <div className="flex justify-between items-center text-success">
                    <span className="flex items-center gap-1">
                      <Ticket className="w-4 h-4" />
                      Desconto ({appliedCoupon.code})
                    </span>
                    <span>- R$ {appliedCoupon.discount_amount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="font-medium">Total</span>
                    <span className="text-2xl font-bold text-primary">
                      R$ {displayPrice.toFixed(2)}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Cupom de Desconto */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Ticket className="w-4 h-4" />
              Cupom de Desconto
            </Label>
            {appliedCoupon ? (
              <div className="flex items-center justify-between p-3 bg-success/10 border border-success/20 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-success" />
                  <span className="font-medium">{appliedCoupon.code}</span>
                  <Badge variant="outline" className="text-success border-success">
                    {appliedCoupon.discount_type === "percentage" 
                      ? `-${appliedCoupon.discount_value}%` 
                      : `-R$ ${appliedCoupon.discount_value.toFixed(2)}`}
                  </Badge>
                </div>
                <Button variant="ghost" size="sm" onClick={removeCoupon}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Input
                  placeholder="Digite o código do cupom"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === "Enter" && validateCoupon()}
                />
                <Button 
                  variant="outline" 
                  onClick={validateCoupon}
                  disabled={validatingCoupon || !couponCode.trim()}
                >
                  {validatingCoupon ? <Loader2 className="w-4 h-4 animate-spin" /> : "Aplicar"}
                </Button>
              </div>
            )}
          </div>

          {/* Informações do Usuário */}
          <div className="space-y-4">
            <div>
              <Label>Email</Label>
              <Input value={user?.email || ""} disabled className="bg-muted" />
            </div>
          </div>

          {/* Botão de Pagamento */}
          {mercadoPagoConfigured ? (
            <Button 
              className="w-full h-12 text-lg gradient-primary shadow-glow"
              onClick={handleCheckout}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <CreditCard className="w-5 h-5 mr-2" />
                  Pagar com Mercado Pago
                </>
              )}
            </Button>
          ) : (
            <div className="text-center p-6 bg-warning/10 rounded-lg">
              <p className="text-sm text-muted-foreground">
                O sistema de pagamento está sendo configurado. Entre em contato com o suporte.
              </p>
            </div>
          )}

          {/* Segurança */}
          <div className="text-center text-xs text-muted-foreground">
            <p>🔒 Pagamento 100% seguro processado pelo Mercado Pago</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
