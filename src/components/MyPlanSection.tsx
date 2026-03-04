import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSearchParams } from "react-router-dom";
import { MercadoPagoCheckout } from "@/components/MercadoPagoCheckout";
import { CountdownTimer } from "@/components/CountdownTimer";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Subscription {
  id: string;
  status: string;
  expires_at: string;
  started_at: string;
  plan_id: string;
}

interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  duration_days: number;
  plan_type: string;
  features: any;
  countdown_enabled?: boolean;
  countdown_ends_at?: string;
  limited_offer_banner?: string;
  is_visible?: boolean;
}

export const MyPlanSection = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [currentPlan, setCurrentPlan] = useState<Plan | null>(null);
  const [allPlans, setAllPlans] = useState<Plan[]>([]);
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedPlanForCheckout, setSelectedPlanForCheckout] = useState<Plan | null>(null);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      // Buscar assinatura atual
      const { data: subData } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();

      if (subData) {
        setSubscription(subData);

        // Buscar plano atual
        const { data: planData } = await supabase
          .from('plans')
          .select('*')
          .eq('id', subData.plan_id)
          .single();

        if (planData) {
          setCurrentPlan(planData);
        }
      }

      // Buscar todos os planos disponíveis
      const { data: plansData } = await supabase
        .from('plans')
        .select('*')
        .eq('is_active', true)
        .eq('is_visible', true)
        .neq('plan_type', 'free_trial')
        .order('order_index', { ascending: true });

      if (plansData) {
        setAllPlans(plansData);
      }

      setLoading(false);
    };

    fetchData();
  }, [user]);

  const fetchPlans = async () => {
    const { data: plansData } = await supabase
      .from('plans')
      .select('*')
      .eq('is_active', true)
      .eq('is_visible', true)
      .neq('plan_type', 'free_trial')
      .order('order_index', { ascending: true });

    if (plansData) {
      setAllPlans(plansData);
    }
  };

  // Refresh plans when the upgrade dialog opens
  useEffect(() => {
    if (upgradeDialogOpen) {
      fetchPlans();
    }
  }, [upgradeDialogOpen]);

  // Check if should open upgrade dialog from URL
  useEffect(() => {
    if (searchParams.get('upgrade') === 'true') {
      setUpgradeDialogOpen(true);
      // Remove the upgrade param from URL
      searchParams.delete('upgrade');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const handleUpgrade = async (planId: string) => {
    if (!user) return;

    // Encontrar o plano selecionado
    const plan = allPlans.find(p => p.id === planId);
    if (plan) {
      setSelectedPlanForCheckout(plan);
      setUpgradeDialogOpen(false);
    }
  };

  const getDaysLeft = () => {
    if (!subscription) return 0;
    const expiresAt = new Date(subscription.expires_at);
    const now = new Date();
    const diffTime = expiresAt.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          Carregando informações do plano...
        </CardContent>
      </Card>
    );
  }

  const daysLeft = getDaysLeft();
  const isTrial = currentPlan?.plan_type === 'free_trial';

  return (
    <>
      <div className="space-y-6">
        {/* Current Plan Card */}
        <Card className={isTrial ? "border-primary/50" : "border-primary shadow-glow"}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  {isTrial ? (
                    <Sparkles className="w-5 h-5" />
                  ) : (
                    <Crown className="w-5 h-5 text-primary" />
                  )}
                  {currentPlan?.name || "Sem plano ativo"}
                </CardTitle>
                <CardDescription>
                  {currentPlan?.description || "Assine um plano para começar"}
                </CardDescription>
              </div>
              <Badge variant={isTrial ? "secondary" : "default"}>
                {subscription?.status === 'active' ? 'Ativo' : 'Inativo'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {subscription && currentPlan ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-accent/50 rounded-lg">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {(currentPlan.plan_type === 'lifetime' || currentPlan.duration_days === null)
                        ? 'Plano' 
                        : (isTrial ? 'Dias restantes no trial' : 'Próxima renovação em')
                      }
                    </p>
                    <p className="text-2xl font-bold">
                      {(currentPlan.plan_type === 'lifetime' || currentPlan.duration_days === null)
                        ? 'Vitalício' 
                        : `${daysLeft} ${daysLeft === 1 ? 'dia' : 'dias'}`
                      }
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Valor</p>
                    <p className="text-2xl font-bold">
                      {currentPlan.price === 0 ? 'Grátis' : `R$ ${currentPlan.price}`}
                    </p>
                  </div>
                </div>

                {currentPlan.features && Array.isArray(currentPlan.features) && currentPlan.features.length > 0 && (
                  <div>
                    <p className="font-semibold mb-2">Recursos incluídos:</p>
                    <ul className="space-y-2">
                      {currentPlan.features.map((feature: string, index: number) => (
                        <li key={index} className="flex items-center gap-2 text-sm">
                          <Check className="w-4 h-4 text-primary" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <Button
                  onClick={() => setUpgradeDialogOpen(true)}
                  className="w-full gradient-primary shadow-glow"
                  size="lg"
                >
                  Fazer Upgrade do Plano
                </Button>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">
                  Você não tem um plano ativo no momento.
                </p>
                <Button
                  onClick={() => setUpgradeDialogOpen(true)}
                  className="gradient-primary shadow-glow"
                >
                  Ver Planos Disponíveis
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Upgrade Dialog */}
      <Dialog open={upgradeDialogOpen} onOpenChange={setUpgradeDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Escolha seu Plano</DialogTitle>
            <DialogDescription>
              Selecione o plano ideal para o seu negócio
            </DialogDescription>
          </DialogHeader>

          <div className="grid sm:grid-cols-2 gap-6 mt-4">
            {allPlans.map((plan) => {
              const isOfferActive = plan.countdown_enabled && plan.countdown_ends_at && new Date(plan.countdown_ends_at) > new Date();
              
              return (
                <Card
                  key={plan.id}
                  className={
                    plan.plan_type === 'professional'
                      ? "border-primary shadow-glow"
                      : ""
                  }
                >
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      {plan.name}
                      {plan.plan_type === 'professional' && (
                        <Badge>Mais Popular</Badge>
                      )}
                    </CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                    
                    {isOfferActive && (
                      <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                        {plan.limited_offer_banner && (
                          <p className="text-sm font-semibold text-destructive mb-2 text-center">
                            {plan.limited_offer_banner}
                          </p>
                        )}
                        <CountdownTimer 
                          endDate={plan.countdown_ends_at!}
                          className="text-destructive justify-center"
                          onExpire={() => {
                            toast({
                              title: "Oferta expirada",
                              description: "A oferta especial deste plano expirou.",
                            });
                            fetchPlans();
                          }}
                        />
                      </div>
                    )}
                    
                    <div className="mt-4">
                      <span className="text-3xl font-bold">
                        {plan.price === 0 ? 'Grátis' : `R$ ${plan.price}`}
                      </span>
                      {plan.price > 0 && (
                        <span className="text-muted-foreground">
                          /{plan.plan_type === 'monthly' ? 'mês' : plan.plan_type === 'annual' ? 'ano' : plan.plan_type === 'lifetime' ? 'vitalício' : 'mês'}
                        </span>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {plan.features && Array.isArray(plan.features) && plan.features.length > 0 && (
                      <ul className="space-y-2 mb-6">
                        {plan.features.map((feature: string, index: number) => (
                          <li key={index} className="flex items-start gap-2 text-sm">
                            <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                    <Button
                      onClick={() => handleUpgrade(plan.id)}
                      className={
                        plan.plan_type === 'professional'
                          ? "w-full gradient-primary shadow-glow"
                          : "w-full"
                      }
                      variant={
                        plan.plan_type === 'professional' ? "default" : "outline"
                      }
                    >
                      Assinar Agora
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      {/* Mercado Pago Checkout */}
      {selectedPlanForCheckout && (
        <MercadoPagoCheckout
          plan={selectedPlanForCheckout}
          onClose={() => setSelectedPlanForCheckout(null)}
        />
      )}
    </>
  );
};
