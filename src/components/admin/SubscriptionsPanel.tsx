import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { Crown, Calendar, DollarSign, User } from "lucide-react";
import { format } from "date-fns";

interface Subscription {
  id: string;
  user_id: string;
  status: string;
  expires_at: string;
  started_at: string;
  plan: {
    name: string;
    price: number;
    plan_type: string;
  };
  profile: {
    full_name: string;
    email: string;
  };
}

export const SubscriptionsPanel = () => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeDisplayCount, setActiveDisplayCount] = useState(5);
  const [inactiveDisplayCount, setInactiveDisplayCount] = useState(5);

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    setLoading(true);
    
    // Fetch subscriptions
    const { data: subsData, error: subsError } = await supabase
      .from('subscriptions')
      .select(`
        *,
        plan:plans(name, price, plan_type)
      `)
      .order('created_at', { ascending: false });

    if (subsError || !subsData) {
      console.error('Error fetching subscriptions:', subsError);
      setLoading(false);
      return;
    }

    // Fetch profiles for all users
    const userIds = [...new Set(subsData.map(s => s.user_id))];
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('user_id, full_name, email')
      .in('user_id', userIds);

    // Merge profiles into subscriptions
    const subscriptionsWithProfiles = subsData.map(sub => ({
      ...sub,
      profile: profilesData?.find(p => p.user_id === sub.user_id) || null
    }));

    setSubscriptions(subscriptionsWithProfiles as any);
    setLoading(false);
  };

  // Agrupar por usuário e pegar apenas a assinatura mais recente de cada um
  const latestSubscriptionByUser = subscriptions.reduce((acc, sub) => {
    const existing = acc[sub.user_id];
    if (!existing || new Date(sub.started_at) > new Date(existing.started_at)) {
      acc[sub.user_id] = sub;
    }
    return acc;
  }, {} as Record<string, Subscription>);

  const uniqueSubscriptions = Object.values(latestSubscriptionByUser);

  // Helper para verificar se expirou (planos vitalícios nunca expiram)
  const isSubscriptionExpired = (sub: Subscription) => {
    if (sub.plan?.plan_type === 'lifetime') return false;
    return new Date(sub.expires_at) <= new Date();
  };

  // Ativos: status 'active' E (não expirado OU vitalício)
  const activeSubscriptions = uniqueSubscriptions.filter(sub => 
    sub.status === 'active' && !isSubscriptionExpired(sub)
  );

  // Inativos: status diferente de 'active' OU expirado (exceto vitalícios)
  const inactiveSubscriptions = uniqueSubscriptions.filter(sub => 
    sub.status !== 'active' || isSubscriptionExpired(sub)
  );

  const displayedActiveSubscriptions = activeSubscriptions.slice(0, activeDisplayCount);
  const displayedInactiveSubscriptions = inactiveSubscriptions.slice(0, inactiveDisplayCount);
  
  const hasMoreActive = activeDisplayCount < activeSubscriptions.length;
  const hasMoreInactive = inactiveDisplayCount < inactiveSubscriptions.length;

  const loadMoreActive = () => {
    setActiveDisplayCount(prev => Math.min(prev + 5, activeSubscriptions.length));
  };

  const loadMoreInactive = () => {
    setInactiveDisplayCount(prev => Math.min(prev + 5, inactiveSubscriptions.length));
  };

  const renderSubscriptionCard = (sub: Subscription) => {
    const isLifetime = sub.plan?.plan_type === 'lifetime';
    const isExpired = isLifetime ? false : new Date(sub.expires_at) <= new Date();
    const daysUntilExpiry = Math.ceil((new Date(sub.expires_at).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    
    return (
      <div
        key={sub.id}
        className="p-4 rounded-lg border border-border bg-card hover:bg-accent/5 transition-colors"
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Crown className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-lg">{sub.plan?.name || 'Plano não encontrado'}</h3>
              {isLifetime ? (
                <Badge variant="default" className="bg-gradient-to-r from-amber-500 to-yellow-500 text-white">
                  Vitalício
                </Badge>
              ) : (
                <Badge variant={sub.status === 'active' && !isExpired ? 'default' : 'secondary'}>
                  {sub.status === 'active' && !isExpired ? 'Ativa' : isExpired ? 'Expirada' : 'Inativa'}
                </Badge>
              )}
            </div>
            
            <div className="space-y-2 text-sm text-muted-foreground mt-3">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                <div className="flex flex-col">
                  <span className="font-medium text-foreground">{sub.profile?.full_name || 'Nome não disponível'}</span>
                  <span className="text-xs">{sub.profile?.email}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <div className="flex flex-col">
                  <span>Iniciou em: {format(new Date(sub.started_at), 'dd/MM/yyyy')}</span>
                  {isLifetime ? (
                    <span className="text-amber-600 dark:text-amber-400 font-medium">
                      Acesso vitalício - Nunca expira
                    </span>
                  ) : (
                    <span className={isExpired ? 'text-destructive font-medium' : daysUntilExpiry <= 7 ? 'text-yellow-600 dark:text-yellow-500 font-medium' : ''}>
                      {isExpired ? 'Expirou' : 'Expira'} em: {format(new Date(sub.expires_at), 'dd/MM/yyyy')}
                      {!isExpired && daysUntilExpiry <= 7 && ` (${daysUntilExpiry} dias)`}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                <span className="text-success font-semibold">
                  R$ {sub.plan?.price?.toFixed(2) || '0.00'}/mês
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card className="p-6 glass">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-primary/10 p-3 rounded-xl">
          <Crown className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Assinaturas</h2>
          <p className="text-sm text-muted-foreground">
            Ativas: {activeSubscriptions.length} | Inativas: {inactiveSubscriptions.length}
          </p>
        </div>
      </div>

      <Tabs defaultValue="active" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="active">
            Ativas ({activeSubscriptions.length})
          </TabsTrigger>
          <TabsTrigger value="inactive">
            Inativas ({inactiveSubscriptions.length})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="active" className="mt-4">
          <div className="space-y-3">
            {loading ? (
              <p className="text-center text-muted-foreground py-8">Carregando...</p>
            ) : activeSubscriptions.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhuma assinatura ativa
              </p>
            ) : (
              <>
                {displayedActiveSubscriptions.map(renderSubscriptionCard)}
                {hasMoreActive && (
                  <div className="text-center pt-4">
                    <Button variant="outline" onClick={loadMoreActive}>
                      Carregar mais assinaturas
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="inactive" className="mt-4">
          <div className="space-y-3">
            {loading ? (
              <p className="text-center text-muted-foreground py-8">Carregando...</p>
            ) : inactiveSubscriptions.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhuma assinatura inativa
              </p>
            ) : (
              <>
                {displayedInactiveSubscriptions.map(renderSubscriptionCard)}
                {hasMoreInactive && (
                  <div className="text-center pt-4">
                    <Button variant="outline" onClick={loadMoreInactive}>
                      Carregar mais assinnaturas
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
};
