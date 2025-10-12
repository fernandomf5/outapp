import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Clock, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Subscription {
  id: string;
  status: string;
  expires_at: string;
  plan_id: string;
}

interface Plan {
  name: string;
  plan_type: string;
}

export const SubscriptionBanner = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [daysLeft, setDaysLeft] = useState<number>(0);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!user) return;

    const fetchSubscription = async () => {
      const { data: subData, error: subError } = await supabase
        .from('subscriptions')
        .select('*, plans(name, plan_type)')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();

      if (subError || !subData) return;

      setSubscription(subData);
      setPlan(subData.plans as unknown as Plan);

      // Calcular dias restantes
      const expiresAt = new Date(subData.expires_at);
      const now = new Date();
      const diffTime = expiresAt.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      setDaysLeft(diffDays);
    };

    fetchSubscription();
  }, [user]);

  if (!subscription || !plan || dismissed) return null;

  // Se o plano expirou
  if (daysLeft <= 0 && plan.plan_type === 'free_trial') {
    return (
      <Alert className="bg-destructive/10 border-destructive mb-6 relative">
        <AlertTriangle className="h-5 w-5 text-destructive" />
        <AlertDescription className="ml-8 pr-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <p className="font-semibold text-destructive">Seu teste gratuito expirou!</p>
              <p className="text-sm text-muted-foreground mt-1">
                Assine um plano para continuar usando todas as funcionalidades.
              </p>
            </div>
            <Button
              onClick={() => navigate("/dashboard?tab=plan")}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 whitespace-nowrap"
            >
              Assinar Agora
            </Button>
          </div>
        </AlertDescription>
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 h-6 w-6"
          onClick={() => setDismissed(true)}
        >
          <X className="h-4 w-4" />
        </Button>
      </Alert>
    );
  }

  // Se o plano está para expirar (menos de 3 dias)
  if (daysLeft <= 3 && daysLeft > 0 && plan.plan_type === 'free_trial') {
    return (
      <Alert className="bg-warning/10 border-warning mb-6 relative">
        <Clock className="h-5 w-5 text-warning" />
        <AlertDescription className="ml-8 pr-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <p className="font-semibold text-warning">
                Seu teste gratuito expira em {daysLeft} {daysLeft === 1 ? 'dia' : 'dias'}!
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Assine um plano para continuar aproveitando todas as funcionalidades.
              </p>
            </div>
            <Button
              onClick={() => navigate("/dashboard?tab=plan&upgrade=true")}
              variant="outline"
              className="border-warning text-warning hover:bg-warning/10 whitespace-nowrap"
            >
              Ver Planos
            </Button>
          </div>
        </AlertDescription>
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 h-6 w-6"
          onClick={() => setDismissed(true)}
        >
          <X className="h-4 w-4" />
        </Button>
      </Alert>
    );
  }

  return null;
};
