import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download, Calendar } from "lucide-react";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

interface AgentReportsPanelProps {
  agentId: string;
}

interface ReportData {
  totalOrders: number;
  totalRevenue: number;
  totalAppointments: number;
  totalCustomers: number;
  totalConversations: number;
  averageRating: number;
  topProducts: any[];
  topServices: any[];
}

export default function AgentReportsPanel({ agentId }: AgentReportsPanelProps) {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  useEffect(() => {
    generateReport();
  }, [agentId, selectedMonth]);

  const generateReport = async () => {
    setLoading(true);
    try {
      const startDate = startOfMonth(selectedMonth);
      const endDate = endOfMonth(selectedMonth);

      // Buscar pedidos
      const { data: orders } = await supabase
        .from('agent_orders')
        .select('*, items')
        .eq('agent_id', agentId)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      // Buscar agendamentos
      const { data: appointments } = await supabase
        .from('agent_appointments')
        .select('*')
        .eq('agent_id', agentId)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      // Buscar clientes
      const { data: customers } = await supabase
        .from('agent_customers')
        .select('id')
        .eq('agent_id', agentId)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      // Buscar conversas
      const { data: conversations } = await supabase
        .from('agent_conversations')
        .select('id')
        .eq('agent_id', agentId)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      // Buscar avaliações
      const { data: reviews } = await supabase
        .from('agent_reviews')
        .select('rating')
        .eq('agent_id', agentId)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      // Calcular métricas
      const totalRevenue = orders?.reduce((sum, order) => sum + Number(order.total_amount), 0) || 0;
      const averageRating = reviews && reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0;

      // Produtos mais vendidos
      const productCounts: Record<string, number> = {};
      orders?.forEach(order => {
        if (Array.isArray(order.items)) {
          order.items.forEach((item: any) => {
            const key = item.product_name || item.name;
            productCounts[key] = (productCounts[key] || 0) + (item.quantity || 1);
          });
        }
      });

      const topProducts = Object.entries(productCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Serviços mais agendados
      const serviceCounts: Record<string, number> = {};
      appointments?.forEach(appt => {
        serviceCounts[appt.service_name] = (serviceCounts[appt.service_name] || 0) + 1;
      });

      const topServices = Object.entries(serviceCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      setReportData({
        totalOrders: orders?.length || 0,
        totalRevenue,
        totalAppointments: appointments?.length || 0,
        totalCustomers: customers?.length || 0,
        totalConversations: conversations?.length || 0,
        averageRating,
        topProducts,
        topServices
      });
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Erro ao gerar relatório');
    } finally {
      setLoading(false);
    }
  };

  const exportReport = () => {
    if (!reportData) return;

    const reportText = `
RELATÓRIO DO AGENTE IA
Período: ${format(selectedMonth, "MMMM 'de' yyyy", { locale: ptBR })}

MÉTRICAS GERAIS
- Total de Pedidos: ${reportData.totalOrders}
- Receita Total: R$ ${reportData.totalRevenue.toFixed(2)}
- Total de Agendamentos: ${reportData.totalAppointments}
- Novos Clientes: ${reportData.totalCustomers}
- Total de Conversas: ${reportData.totalConversations}
- Avaliação Média: ${reportData.averageRating.toFixed(1)} estrelas

PRODUTOS MAIS VENDIDOS
${reportData.topProducts.map((p, i) => `${i + 1}. ${p.name} - ${p.count} vendas`).join('\n')}

SERVIÇOS MAIS AGENDADOS
${reportData.topServices.map((s, i) => `${i + 1}. ${s.name} - ${s.count} agendamentos`).join('\n')}

Gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm")}
    `.trim();

    const blob = new Blob([reportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio_${format(selectedMonth, 'yyyy-MM')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Relatório exportado com sucesso!');
  };

  if (loading) {
    return <div className="p-8 text-center">Gerando relatório...</div>;
  }

  if (!reportData) {
    return <div className="p-8 text-center text-muted-foreground">Erro ao carregar dados</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Relatórios e Insights
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedMonth(subMonths(selectedMonth, 1))}
            >
              ← Mês Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedMonth(new Date())}
            >
              <Calendar className="h-4 w-4 mr-2" />
              {format(selectedMonth, "MMMM 'de' yyyy", { locale: ptBR })}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1))}
              disabled={selectedMonth >= new Date()}
            >
              Próximo Mês →
            </Button>
            <Button onClick={exportReport}>
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Total de Pedidos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{reportData.totalOrders}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Receita Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">R$ {reportData.totalRevenue.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Total de Agendamentos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{reportData.totalAppointments}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Novos Clientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{reportData.totalCustomers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Total de Conversas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{reportData.totalConversations}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Avaliação Média</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{reportData.averageRating.toFixed(1)} ⭐</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Produtos Mais Vendidos</CardTitle>
          </CardHeader>
          <CardContent>
            {reportData.topProducts.length === 0 ? (
              <p className="text-muted-foreground">Nenhum produto vendido</p>
            ) : (
              <div className="space-y-2">
                {reportData.topProducts.map((product, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span>{index + 1}. {product.name}</span>
                    <span className="font-medium">{product.count} vendas</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Serviços Mais Agendados</CardTitle>
          </CardHeader>
          <CardContent>
            {reportData.topServices.length === 0 ? (
              <p className="text-muted-foreground">Nenhum serviço agendado</p>
            ) : (
              <div className="space-y-2">
                {reportData.topServices.map((service, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span>{index + 1}. {service.name}</span>
                    <span className="font-medium">{service.count} agendamentos</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
