import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CreditCard, Check, X, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

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
  const [bannerUrl, setBannerUrl] = useState("");
  const [checkoutBannerUrl, setCheckoutBannerUrl] = useState("");

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
      // Aqui você integraria com a API do Mercado Pago
      // Por enquanto, vamos simular o processo
      
      toast({
        title: "Processando pagamento",
        description: "Redirecionando para o Mercado Pago...",
      });

      // Simular criação de preferência de pagamento
      setTimeout(() => {
        toast({
          title: "Pagamento em processamento",
          description: "Você será redirecionado para completar o pagamento.",
        });
      }, 2000);

    } catch (error) {
      console.error('Erro no checkout:', error);
      toast({
        title: "Erro no pagamento",
        description: "Ocorreu um erro ao processar o pagamento. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

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
            <div className="pt-4 border-t border-primary/10">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Total</span>
                <span className="text-2xl font-bold text-primary">
                  {plan.price === 0 ? 'Grátis' : 
                   plan.plan_type === 'monthly' ? `R$ ${plan.price}/mês` :
                   plan.plan_type === 'yearly' ? `R$ ${plan.price}/ano` :
                   `R$ ${plan.price}/vitalício`}
                </span>
              </div>
            </div>
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
