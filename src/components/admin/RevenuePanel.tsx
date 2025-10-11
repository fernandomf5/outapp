import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { DollarSign, TrendingUp, Calendar, Users } from "lucide-react";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";

interface RevenueData {
  totalRevenue: number;
  activeUsers: number;
  averageTicket: number;
  monthlyGrowth: number;
}

export const RevenuePanel = () => {
  const [revenueData, setRevenueData] = useState<RevenueData>({
    totalRevenue: 0,
    activeUsers: 0,
    averageTicket: 0,
    monthlyGrowth: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRevenueData();
  }, []);

  const fetchRevenueData = async () => {
    setLoading(true);
    
    const currentMonth = new Date();
    const lastMonth = subMonths(currentMonth, 1);
    
    // Buscar assinaturas ativas do mês atual
    const { data: currentSubs, error: currentError } = await supabase
      .from('subscriptions')
      .select(`
        *,
        plan:plans(price)
      `)
      .eq('status', 'active')
      .gte('started_at', startOfMonth(currentMonth).toISOString())
      .lte('started_at', endOfMonth(currentMonth).toISOString());

    // Buscar assinaturas do mês anterior
    const { data: lastSubs, error: lastError } = await supabase
      .from('subscriptions')
      .select(`
        *,
        plan:plans(price)
      `)
      .eq('status', 'active')
      .gte('started_at', startOfMonth(lastMonth).toISOString())
      .lte('started_at', endOfMonth(lastMonth).toISOString());

    if (!currentError && currentSubs) {
      const totalRevenue = currentSubs.reduce((sum, sub: any) => 
        sum + (sub.plan?.price || 0), 0
      );
      
      const lastMonthRevenue = lastSubs?.reduce((sum, sub: any) => 
        sum + (sub.plan?.price || 0), 0
      ) || 0;

      const growth = lastMonthRevenue > 0 
        ? ((totalRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 
        : 0;

      setRevenueData({
        totalRevenue,
        activeUsers: currentSubs.length,
        averageTicket: currentSubs.length > 0 ? totalRevenue / currentSubs.length : 0,
        monthlyGrowth: growth,
      });
    }
    
    setLoading(false);
  };

  return (
    <Card className="p-6 glass">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-primary/10 p-3 rounded-xl">
          <DollarSign className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Receita Mensal</h2>
          <p className="text-sm text-muted-foreground">
            Detalhamento do faturamento de {format(new Date(), 'MMMM/yyyy')}
          </p>
        </div>
      </div>

      {loading ? (
        <p className="text-center text-muted-foreground py-8">Carregando...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-5 h-5 text-primary" />
              <span className="text-sm text-muted-foreground">Receita Total</span>
            </div>
            <p className="text-3xl font-bold text-success">
              R$ {revenueData.totalRevenue.toFixed(2)}
            </p>
          </div>

          <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-5 h-5 text-primary" />
              <span className="text-sm text-muted-foreground">Assinaturas Ativas</span>
            </div>
            <p className="text-3xl font-bold text-success">
              {revenueData.activeUsers}
            </p>
          </div>

          <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-5 h-5 text-primary" />
              <span className="text-sm text-muted-foreground">Ticket Médio</span>
            </div>
            <p className="text-3xl font-bold text-success">
              R$ {revenueData.averageTicket.toFixed(2)}
            </p>
          </div>

          <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              <span className="text-sm text-muted-foreground">Crescimento Mensal</span>
            </div>
            <p className={`text-3xl font-bold ${
              revenueData.monthlyGrowth >= 0 ? 'text-success' : 'text-destructive'
            }`}>
              {revenueData.monthlyGrowth >= 0 ? '+' : ''}
              {revenueData.monthlyGrowth.toFixed(1)}%
            </p>
          </div>
        </div>
      )}
    </Card>
  );
};
