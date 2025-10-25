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
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export const ChatbotAnalyticsPanel = ({ chatbotId }: { chatbotId: string }) => {
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
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadAnalytics();
  }, [chatbotId]);

  const loadAnalytics = async () => {
    try {
      const { count: customersCount } = await supabase
        .from('chatbot_customers')
        .select('*', { count: 'exact', head: true })
        .eq('chatbot_id', chatbotId);

      const { count: conversationsCount } = await supabase
        .from('chatbot_conversations')
        .select('*', { count: 'exact', head: true })
        .eq('chatbot_id', chatbotId);

      const { count: ordersCount } = await supabase
        .from('chatbot_orders')
        .select('*', { count: 'exact', head: true })
        .eq('chatbot_id', chatbotId);

      const { count: appointmentsCount } = await supabase
        .from('chatbot_appointments')
        .select('*', { count: 'exact', head: true })
        .eq('chatbot_id', chatbotId);

      const { data: orders } = await supabase
        .from('chatbot_orders')
        .select('total')
        .eq('chatbot_id', chatbotId)
        .neq('status', 'cancelled');

      const totalRevenue = orders?.reduce((sum, order) => sum + Number(order.total), 0) || 0;

      const { data: reviews } = await supabase
        .from('chatbot_reviews')
        .select('rating')
        .eq('chatbot_id', chatbotId);

      const averageRating = reviews && reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0;

      setAnalytics({
        totalCustomers: customersCount || 0,
        totalConversations: conversationsCount || 0,
        totalOrders: ordersCount || 0,
        totalAppointments: appointmentsCount || 0,
        totalRevenue,
        averageRating,
        conversationsPerDay: [],
        ordersPerDay: [],
        topProducts: [],
      });

      setLoading(false);
    } catch (error) {
      console.error('Error loading analytics:', error);
      toast({
        title: "Erro ao carregar analytics",
        description: "Não foi possível carregar os dados de analytics.",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center p-12">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>;
  }

  return (
    <div className="space-y-6">
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
            <CardTitle className="text-sm font-medium">Total de Agendamentos</CardTitle>
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
    </div>
  );
};