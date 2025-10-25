import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { BarChart3 } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { format, subMonths, subDays, subYears, startOfMonth, endOfMonth, startOfDay, endOfDay, startOfYear, endOfYear } from "date-fns";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ChartData {
  month: string;
  users: number;
  revenue: number;
  subscriptions: number;
}

type PeriodType = 'days' | 'months' | 'years';

export const GrowthChart = () => {
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<PeriodType>('months');

  useEffect(() => {
    fetchChartData();
  }, [period]);

  const fetchChartData = async () => {
    setLoading(true);
    const data: ChartData[] = [];
    
    let periods = 0;
    let formatString = '';
    
    // Configurar período baseado no filtro
    if (period === 'days') {
      periods = 30; // Últimos 30 dias
      formatString = 'dd/MM';
    } else if (period === 'months') {
      periods = 12; // Últimos 12 meses
      formatString = 'MMM/yy';
    } else if (period === 'years') {
      periods = 5; // Últimos 5 anos
      formatString = 'yyyy';
    }
    
    for (let i = periods - 1; i >= 0; i--) {
      let date: Date;
      let periodStart: Date;
      let periodEnd: Date;
      
      if (period === 'days') {
        date = subDays(new Date(), i);
        periodStart = startOfDay(date);
        periodEnd = endOfDay(date);
      } else if (period === 'months') {
        date = subMonths(new Date(), i);
        periodStart = startOfMonth(date);
        periodEnd = endOfMonth(date);
      } else {
        date = subYears(new Date(), i);
        periodStart = startOfYear(date);
        periodEnd = endOfYear(date);
      }
      
      // Usuários cadastrados no período
      const { count: usersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', periodStart.toISOString())
        .lte('created_at', periodEnd.toISOString());

      // Assinaturas do período
      const { data: subs } = await supabase
        .from('subscriptions')
        .select(`
          *,
          plan:plans(price)
        `)
        .gte('started_at', periodStart.toISOString())
        .lte('started_at', periodEnd.toISOString());

      const revenue = subs?.reduce((sum, sub: any) => 
        sum + (sub.plan?.price || 0), 0
      ) || 0;

      data.push({
        month: format(date, formatString),
        users: usersCount || 0,
        revenue: revenue,
        subscriptions: subs?.length || 0,
      });
    }
    
    setChartData(data);
    setLoading(false);
  };

  return (
    <Card className="p-6 glass">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-3 rounded-xl">
            <BarChart3 className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Crescimento da Plataforma</h2>
            <p className="text-sm text-muted-foreground">
              Análise detalhada de usuários, receita e assinaturas
            </p>
          </div>
        </div>
        
        <Tabs value={period} onValueChange={(value) => setPeriod(value as PeriodType)}>
          <TabsList>
            <TabsTrigger value="days">Dias</TabsTrigger>
            <TabsTrigger value="months">Meses</TabsTrigger>
            <TabsTrigger value="years">Anos</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {loading ? (
        <p className="text-center text-muted-foreground py-8">Carregando dados...</p>
      ) : (
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
            <XAxis 
              dataKey="month" 
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="users" 
              name="Novos Usuários"
              stroke="hsl(var(--primary))" 
              strokeWidth={2}
              dot={{ fill: 'hsl(var(--primary))' }}
            />
            <Line 
              type="monotone" 
              dataKey="subscriptions" 
              name="Assinaturas"
              stroke="hsl(var(--success))" 
              strokeWidth={2}
              dot={{ fill: 'hsl(var(--success))' }}
            />
            <Line 
              type="monotone" 
              dataKey="revenue" 
              name="Receita (R$)"
              stroke="hsl(var(--warning))" 
              strokeWidth={2}
              dot={{ fill: 'hsl(var(--warning))' }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </Card>
  );
};
