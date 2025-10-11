import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  };
  profile: {
    full_name: string;
    email: string;
  };
}

export const SubscriptionsPanel = () => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('subscriptions')
      .select(`
        *,
        plan:plans(name, price),
        profile:profiles(full_name, email)
      `)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setSubscriptions(data as any);
    }
    setLoading(false);
  };

  const activeSubscriptions = subscriptions.filter(sub => 
    sub.status === 'active' && new Date(sub.expires_at) > new Date()
  );

  const inactiveSubscriptions = subscriptions.filter(sub => 
    sub.status !== 'active' || new Date(sub.expires_at) <= new Date()
  );

  const renderSubscriptionCard = (sub: Subscription) => (
    <div
      key={sub.id}
      className="p-4 rounded-lg border border-border bg-card hover:bg-accent/5 transition-colors"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Crown className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-lg">{sub.plan?.name || 'Plano não encontrado'}</h3>
            <Badge variant={sub.status === 'active' ? 'default' : 'secondary'}>
              {sub.status === 'active' ? 'Ativa' : 'Inativa'}
            </Badge>
          </div>
          
          <div className="space-y-2 text-sm text-muted-foreground mt-3">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span>{sub.profile?.full_name || 'Nome não disponível'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>
                Expira em: {format(new Date(sub.expires_at), 'dd/MM/yyyy')}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              <span className="text-success">
                R$ {sub.plan?.price?.toFixed(2) || '0.00'}/mês
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

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
          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {loading ? (
              <p className="text-center text-muted-foreground py-8">Carregando...</p>
            ) : activeSubscriptions.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhuma assinatura ativa
              </p>
            ) : (
              activeSubscriptions.map(renderSubscriptionCard)
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="inactive" className="mt-4">
          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {loading ? (
              <p className="text-center text-muted-foreground py-8">Carregando...</p>
            ) : inactiveSubscriptions.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhuma assinatura inativa
              </p>
            ) : (
              inactiveSubscriptions.map(renderSubscriptionCard)
            )}
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
};
