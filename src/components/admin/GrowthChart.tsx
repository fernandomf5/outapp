import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { BarChart3 } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";

interface ChartData {
  month: string;
  users: number;
  revenue: number;
  subscriptions: number;
}

export const GrowthChart = () => {
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChartData();
  }, []);

  const fetchChartData = async () => {
    setLoading(true);
    const data: ChartData[] = [];
    
    // Buscar dados dos últimos 6 meses
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      const monthStart = startOfMonth(date);
      const monthEnd = endOfMonth(date);
      
      // Usuários cadastrados no mês
      const { count: usersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', monthStart.toISOString())
        .lte('created_at', monthEnd.toISOString());

      // Assinaturas do mês
      const { data: subs } = await supabase
        .from('subscriptions')
        .select(`
          *,
          plan:plans(price)
        `)
        .gte('started_at', monthStart.toISOString())
        .lte('started_at', monthEnd.toISOString());

      const revenue = subs?.reduce((sum, sub: any) => 
        sum + (sub.plan?.price || 0), 0
      ) || 0;

      data.push({
        month: format(date, 'MMM'),
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
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-primary/10 p-3 rounded-xl">
          <BarChart3 className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Crescimento nos Últimos 6 Meses</h2>
          <p className="text-sm text-muted-foreground">
            Análise detalhada de usuários, receita e assinaturas
          </p>
        </div>
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
