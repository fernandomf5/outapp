import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { TrendingUp, Users, MessageSquare, DollarSign, Calendar as CalendarIcon, ShoppingCart } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

interface AnalyticsData {
  totalCustomers: number;
  totalConversations: number;
  totalOrders: number;
  totalAppointments: number;
  totalRevenue: number;
  averageRating: number;
  conversationsPerDay: any[];
  ordersPerDay: any[];
  topProducts: any[];
  topServices: any[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function AgentAnalyticsPanel({ agentId }: { agentId: string }) {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalCustomers: 0,
    totalConversations: 0,
    totalOrders: 0,
    totalAppointments: 0,
    totalRevenue: 0,
    averageRating: 0,
    conversationsPerDay: [],
    ordersPerDay: [],
    topProducts: [],
    topServices: [],
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadAnalytics();
  }, [agentId]);

  const loadAnalytics = async () => {
    try {
      // Total de clientes
      const { count: customersCount } = await supabase
        .from('agent_customers')
        .select('*', { count: 'exact', head: true })
        .eq('agent_id', agentId);

      // Total de conversas
      const { count: conversationsCount } = await supabase
        .from('agent_conversations')
        .select('*', { count: 'exact', head: true })
        .eq('agent_id', agentId);

      // Total de pedidos
      const { count: ordersCount } = await supabase
        .from('agent_orders')
        .select('*', { count: 'exact', head: true })
        .eq('agent_id', agentId);

      // Total de agendamentos
      const { count: appointmentsCount } = await supabase
        .from('agent_appointments')
        .select('*', { count: 'exact', head: true })
        .eq('agent_id', agentId);

      // Receita total
      const { data: orders } = await supabase
        .from('agent_orders')
        .select('total_amount')
        .eq('agent_id', agentId)
        .neq('status', 'cancelled');

      const totalRevenue = orders?.reduce((sum, order) => sum + Number(order.total_amount), 0) || 0;

      // Média de avaliações
      const { data: reviews } = await supabase
        .from('agent_reviews')
        .select('rating')
        .eq('agent_id', agentId);

      const averageRating = reviews && reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0;

      // Conversas por dia (últimos 7 dias)
      const { data: conversationsData } = await supabase
        .from('agent_conversations')
        .select('created_at')
        .eq('agent_id', agentId)
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at');

      const conversationsPerDay = processDataByDay(conversationsData);

      // Pedidos por dia
      const { data: ordersData } = await supabase
        .from('agent_orders')
        .select('created_at, total_amount')
        .eq('agent_id', agentId)
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at');

      const ordersPerDay = processOrdersByDay(ordersData);

      // Produtos mais vendidos
      const { data: allOrders } = await supabase
        .from('agent_orders')
        .select('items')
        .eq('agent_id', agentId);

      const topProducts = processTopItems(allOrders);

      // Serviços mais agendados
      const { data: appointments } = await supabase
        .from('agent_appointments')
        .select('service_name')
        .eq('agent_id', agentId);

      const topServices = processTopServices(appointments);

      setAnalytics({
        totalCustomers: customersCount || 0,
        totalConversations: conversationsCount || 0,
        totalOrders: ordersCount || 0,
        totalAppointments: appointmentsCount || 0,
        totalRevenue,
        averageRating,
        conversationsPerDay,
        ordersPerDay,
        topProducts,
        topServices,
      });
    } catch (error: any) {
      toast({
        title: "Erro ao carregar analytics",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const processDataByDay = (data: any[]) => {
    if (!data) return [];
    const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000);
      return {
        name: days[date.getDay()],
        value: 0,
        date: date.toISOString().split('T')[0]
      };
    });

    data.forEach(item => {
      const itemDate = new Date(item.created_at).toISOString().split('T')[0];
      const dayIndex = last7Days.findIndex(d => d.date === itemDate);
      if (dayIndex !== -1) {
        last7Days[dayIndex].value++;
      }
    });

    return last7Days;
  };

  const processOrdersByDay = (data: any[]) => {
    if (!data) return [];
    const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000);
      return {
        name: days[date.getDay()],
        pedidos: 0,
        receita: 0,
        date: date.toISOString().split('T')[0]
      };
    });

    data.forEach(item => {
      const itemDate = new Date(item.created_at).toISOString().split('T')[0];
      const dayIndex = last7Days.findIndex(d => d.date === itemDate);
      if (dayIndex !== -1) {
        last7Days[dayIndex].pedidos++;
        last7Days[dayIndex].receita += Number(item.total_amount);
      }
    });

    return last7Days;
  };

  const processTopItems = (orders: any[]) => {
    if (!orders) return [];
    const itemCounts: Record<string, number> = {};
    
    orders.forEach(order => {
      const items = Array.isArray(order.items) ? order.items : [];
      items.forEach((item: any) => {
        const name = item.name || 'Sem nome';
        itemCounts[name] = (itemCounts[name] || 0) + (item.quantity || 1);
      });
    });

    return Object.entries(itemCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  };

  const processTopServices = (appointments: any[]) => {
    if (!appointments) return [];
    const serviceCounts: Record<string, number> = {};
    
    appointments.forEach(apt => {
      const name = apt.service_name || 'Sem nome';
      serviceCounts[name] = (serviceCounts[name] || 0) + 1;
    });

    return Object.entries(serviceCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  };

  if (loading) {
    return <div>Carregando analytics...</div>;
  }

  return (
    <div className="space-y-6">
      <h3 className="text-2xl font-bold">Analytics & Métricas</h3>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Clientes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalCustomers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Conversas</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalConversations}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Pedidos</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalOrders}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Agendamentos</CardTitle>
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalAppointments}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {analytics.totalRevenue.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avaliação Média</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.averageRating.toFixed(1)} ⭐</div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Conversas nos últimos 7 dias</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={analytics.conversationsPerDay}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="value" stroke="#8884d8" name="Conversas" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pedidos nos últimos 7 dias</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={analytics.ordersPerDay}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="pedidos" fill="#82ca9d" name="Pedidos" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {analytics.topProducts.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Produtos Mais Vendidos</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={analytics.topProducts}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {analytics.topProducts.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {analytics.topServices.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Serviços Mais Agendados</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={analytics.topServices} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={100} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#8884d8" name="Agendamentos" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}