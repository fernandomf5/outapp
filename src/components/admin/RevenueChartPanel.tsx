import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { DollarSign, TrendingUp, Calendar, Users } from "lucide-react";
import { format, startOfMonth, endOfMonth, subMonths, eachDayOfInterval, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface RevenueData {
  totalRevenue: number;
  activeUsers: number;
  averageTicket: number;
  monthlyGrowth: number;
}

interface ChartDataPoint {
  date: string;
  assinantes: number;
  receita: number;
}

export const RevenueChartPanel = () => {
  const [revenueData, setRevenueData] = useState<RevenueData>({
    totalRevenue: 0,
    activeUsers: 0,
    averageTicket: 0,
    monthlyGrowth: 0,
  });
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));

  useEffect(() => {
    fetchRevenueData();
    fetchChartData();
  }, []);

  const fetchRevenueData = async () => {
    setLoading(true);
    
    const currentMonth = new Date();
    const lastMonth = subMonths(currentMonth, 1);
    const currentMonthStart = startOfMonth(currentMonth);
    const currentMonthEnd = endOfMonth(currentMonth);
    const lastMonthStart = startOfMonth(lastMonth);
    const lastMonthEnd = endOfMonth(lastMonth);
    
    const { data: currentSubs, error: currentError } = await supabase
      .from('subscriptions')
      .select(`
        *,
        plan:plans(price)
      `)
      .eq('status', 'active')
      .lte('started_at', currentMonthEnd.toISOString())
      .gte('expires_at', currentMonthStart.toISOString());

    const { data: lastSubs, error: lastError } = await supabase
      .from('subscriptions')
      .select(`
        *,
        plan:plans(price)
      `)
      .eq('status', 'active')
      .lte('started_at', lastMonthEnd.toISOString())
      .gte('expires_at', lastMonthStart.toISOString());

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

  const fetchChartData = async () => {
    const start = parseISO(startDate);
    const end = parseISO(endDate);
    
    const { data: subscriptions } = await supabase
      .from('subscriptions')
      .select(`
        *,
        plan:plans(price)
      `)
      .gte('started_at', start.toISOString())
      .lte('started_at', end.toISOString())
      .order('started_at', { ascending: true });

    if (subscriptions) {
      const days = eachDayOfInterval({ start, end });
      
      const dataByDay = days.map(day => {
        const dayStr = format(day, 'yyyy-MM-dd');
        const subsOnDay = subscriptions.filter(sub => 
          format(new Date(sub.started_at), 'yyyy-MM-dd') === dayStr
        );
        
        const revenue = subsOnDay.reduce((sum, sub: any) => 
          sum + (sub.plan?.price || 0), 0
        );
        
        return {
          date: format(day, 'dd/MM', { locale: ptBR }),
          assinantes: subsOnDay.length,
          receita: revenue
        };
      });
      
      setChartData(dataByDay);
    }
  };

  const handleFilterApply = () => {
    fetchChartData();
  };

  return (
    <div className="space-y-6">
      <Card className="p-6 glass">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-primary/10 p-3 rounded-xl">
            <DollarSign className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Receita e Assinaturas</h2>
            <p className="text-sm text-muted-foreground">
              Detalhamento do faturamento
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

      <Card className="p-6 glass">
        <div className="mb-6">
          <h3 className="text-lg font-bold mb-4">Gráfico de Assinaturas e Receita</h3>
          
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="flex-1 min-w-[200px]">
              <Label htmlFor="start-date">Data Inicial</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            
            <div className="flex-1 min-w-[200px]">
              <Label htmlFor="end-date">Data Final</Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            
            <div className="flex items-end">
              <Button onClick={handleFilterApply} className="gradient-primary">
                Aplicar Filtro
              </Button>
            </div>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12 }}
            />
            <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--background))', 
                border: '1px solid hsl(var(--border))' 
              }}
            />
            <Legend />
            <Line 
              yAxisId="left"
              type="monotone" 
              dataKey="assinantes" 
              stroke="hsl(var(--primary))" 
              strokeWidth={2}
              name="Novos Assinantes"
            />
            <Line 
              yAxisId="right"
              type="monotone" 
              dataKey="receita" 
              stroke="hsl(var(--success))" 
              strokeWidth={2}
              name="Receita (R$)"
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
};
