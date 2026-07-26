import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  MessageSquare,
  MousePointerClick,
  Users,
  Inbox,
  Timer,
  Activity,
  RefreshCw,
  TrendingUp,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface DayPoint {
  name: string;
  date: string;
  conversas: number;
  mensagens: number;
}

interface AnalyticsData {
  chatOpens: number;
  conversations: number;
  activeConversations: number;
  archivedConversations: number;
  uniqueVisitors: number;
  totalMessages: number;
  customerMessages: number;
  agentMessages: number;
  formSubmissions: number;
  unreadForms: number;
  answeredRate: number;
  avgMessagesPerConversation: number;
  avgFirstResponseMin: number | null;
  perDay: DayPoint[];
  perHour: { name: string; mensagens: number }[];
  statusBreakdown: { name: string; value: number }[];
}

const COLORS = ["hsl(var(--primary))", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

const emptyData: AnalyticsData = {
  chatOpens: 0,
  conversations: 0,
  activeConversations: 0,
  archivedConversations: 0,
  uniqueVisitors: 0,
  totalMessages: 0,
  customerMessages: 0,
  agentMessages: 0,
  formSubmissions: 0,
  unreadForms: 0,
  answeredRate: 0,
  avgMessagesPerConversation: 0,
  avgFirstResponseMin: null,
  perDay: [],
  perHour: [],
  statusBreakdown: [],
};

const RANGES = [
  { label: "7 dias", days: 7 },
  { label: "14 dias", days: 14 },
  { label: "30 dias", days: 30 },
];

export default function AgentAnalyticsPanel({ agentId }: { agentId: string }) {
  const [data, setData] = useState<AnalyticsData>(emptyData);
  const [days, setDays] = useState(14);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (agentId) loadAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agentId, days]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

      const [convRes, custRes, formsRes] = await Promise.all([
        supabase
          .from("agent_conversations")
          .select("id, status, created_at")
          .eq("agent_id", agentId)
          .gte("created_at", since)
          .order("created_at"),
        supabase
          .from("agent_customers")
          .select("id, created_at")
          .eq("agent_id", agentId)
          .gte("created_at", since),
        supabase
          .from("contact_form_submissions")
          .select("id, is_read, replied_at, created_at")
          .eq("agent_id", agentId)
          .gte("created_at", since),
      ]);

      const conversations = convRes.data || [];
      const convIds = conversations.map((c) => c.id);

      let messages: any[] = [];
      if (convIds.length > 0) {
        const { data: msgs } = await supabase
          .from("agent_messages")
          .select("id, conversation_id, role, created_at")
          .in("conversation_id", convIds)
          .order("created_at");
        messages = msgs || [];
      }

      // Séries por dia
      const perDay: DayPoint[] = Array.from({ length: days }, (_, i) => {
        const d = new Date(Date.now() - (days - 1 - i) * 24 * 60 * 60 * 1000);
        return {
          name: d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
          date: d.toISOString().split("T")[0],
          conversas: 0,
          mensagens: 0,
        };
      });
      const dayIndex = new Map(perDay.map((p, i) => [p.date, i]));

      conversations.forEach((c) => {
        const key = new Date(c.created_at).toISOString().split("T")[0];
        const i = dayIndex.get(key);
        if (i !== undefined) perDay[i].conversas++;
      });
      messages.forEach((m) => {
        const key = new Date(m.created_at).toISOString().split("T")[0];
        const i = dayIndex.get(key);
        if (i !== undefined) perDay[i].mensagens++;
      });

      // Mensagens por hora do dia
      const perHour = Array.from({ length: 24 }, (_, h) => ({
        name: `${String(h).padStart(2, "0")}h`,
        mensagens: 0,
      }));
      messages.forEach((m) => {
        perHour[new Date(m.created_at).getHours()].mensagens++;
      });

      // Primeira resposta do atendente por conversa
      const firstCustomer = new Map<string, number>();
      const firstAgentAfter = new Map<string, number>();
      messages.forEach((m) => {
        const t = new Date(m.created_at).getTime();
        if (m.role === "customer") {
          if (!firstCustomer.has(m.conversation_id)) firstCustomer.set(m.conversation_id, t);
        } else {
          const c = firstCustomer.get(m.conversation_id);
          if (c !== undefined && !firstAgentAfter.has(m.conversation_id) && t >= c) {
            firstAgentAfter.set(m.conversation_id, t);
          }
        }
      });
      const diffs: number[] = [];
      firstAgentAfter.forEach((t, convId) => {
        const c = firstCustomer.get(convId);
        if (c !== undefined) diffs.push((t - c) / 60000);
      });
      const avgFirstResponseMin =
        diffs.length > 0 ? diffs.reduce((a, b) => a + b, 0) / diffs.length : null;

      const customerMessages = messages.filter((m) => m.role === "customer").length;
      const agentMessages = messages.length - customerMessages;
      const answered = firstAgentAfter.size;
      const withCustomerMsg = firstCustomer.size;

      const statusCounts: Record<string, number> = {};
      conversations.forEach((c) => {
        const s = c.status || "unknown";
        statusCounts[s] = (statusCounts[s] || 0) + 1;
      });
      const statusLabels: Record<string, string> = {
        active: "Ativas",
        archived: "Arquivadas",
        closed: "Encerradas",
        unknown: "Sem status",
      };

      const forms = formsRes.data || [];

      setData({
        chatOpens: (custRes.data || []).length,
        conversations: conversations.length,
        activeConversations: statusCounts["active"] || 0,
        archivedConversations:
          (statusCounts["archived"] || 0) + (statusCounts["closed"] || 0),
        uniqueVisitors: (custRes.data || []).length,
        totalMessages: messages.length,
        customerMessages,
        agentMessages,
        formSubmissions: forms.length,
        unreadForms: forms.filter((f) => !f.is_read).length,
        answeredRate: withCustomerMsg > 0 ? (answered / withCustomerMsg) * 100 : 0,
        avgMessagesPerConversation:
          conversations.length > 0 ? messages.length / conversations.length : 0,
        avgFirstResponseMin,
        perDay,
        perHour,
        statusBreakdown: Object.entries(statusCounts).map(([k, v]) => ({
          name: statusLabels[k] || k,
          value: v,
        })),
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

  const kpis = [
    {
      label: "Cliques no chat",
      value: data.chatOpens,
      hint: "Sessões iniciadas no widget",
      icon: MousePointerClick,
    },
    {
      label: "Conversas iniciadas",
      value: data.conversations,
      hint: `${data.activeConversations} ativas · ${data.archivedConversations} encerradas`,
      icon: MessageSquare,
    },
    {
      label: "Visitantes únicos",
      value: data.uniqueVisitors,
      hint: "Pessoas diferentes no período",
      icon: Users,
    },
    {
      label: "Mensagens trocadas",
      value: data.totalMessages,
      hint: `${data.customerMessages} do cliente · ${data.agentMessages} do atendente`,
      icon: Activity,
    },
    {
      label: "Taxa de resposta",
      value: `${data.answeredRate.toFixed(0)}%`,
      hint: "Conversas com resposta do atendente",
      icon: TrendingUp,
    },
    {
      label: "1ª resposta média",
      value:
        data.avgFirstResponseMin === null
          ? "—"
          : data.avgFirstResponseMin < 60
          ? `${data.avgFirstResponseMin.toFixed(0)} min`
          : `${(data.avgFirstResponseMin / 60).toFixed(1)} h`,
      hint: "Tempo médio até o atendente responder",
      icon: Timer,
    },
    {
      label: "Formulários recebidos",
      value: data.formSubmissions,
      hint: `${data.unreadForms} não lida(s)`,
      icon: Inbox,
    },
    {
      label: "Msgs por conversa",
      value: data.avgMessagesPerConversation.toFixed(1),
      hint: "Profundidade média do atendimento",
      icon: MessageSquare,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
        <div>
          <h3 className="text-xl sm:text-2xl font-bold">Analytics do Chat Online</h3>
          <p className="text-sm text-muted-foreground">
            Desempenho do atendimento nos últimos {days} dias
          </p>
        </div>
        <div className="flex items-center gap-2">
          {RANGES.map((r) => (
            <Button
              key={r.days}
              size="sm"
              variant={days === r.days ? "default" : "outline"}
              onClick={() => setDays(r.days)}
            >
              {r.label}
            </Button>
          ))}
          <Button size="icon" variant="ghost" onClick={loadAnalytics} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-xl" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
            {kpis.map((kpi) => (
              <Card key={kpi.label} className="rounded-xl">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2">
                  <CardTitle className="text-[11px] sm:text-sm font-medium leading-tight">
                    {kpi.label}
                  </CardTitle>
                  <kpi.icon className="h-4 w-4 text-primary shrink-0" />
                </CardHeader>
                <CardContent>
                  <div className="text-xl sm:text-2xl font-bold">{kpi.value}</div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 leading-snug">
                    {kpi.hint}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base sm:text-lg">
                Conversas e mensagens por dia
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={data.perDay}>
                  <defs>
                    <linearGradient id="convGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.6} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="msgGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00C49F" stopOpacity={0.5} />
                      <stop offset="95%" stopColor="#00C49F" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="name" fontSize={11} />
                  <YAxis fontSize={11} allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="conversas"
                    stroke="hsl(var(--primary))"
                    fill="url(#convGrad)"
                    name="Conversas iniciadas"
                  />
                  <Area
                    type="monotone"
                    dataKey="mensagens"
                    stroke="#00C49F"
                    fill="url(#msgGrad)"
                    name="Mensagens"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base sm:text-lg">
                  Horários de maior movimento
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={data.perHour}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="name" fontSize={10} interval={2} />
                    <YAxis fontSize={11} allowDecimals={false} />
                    <Tooltip />
                    <Bar
                      dataKey="mensagens"
                      fill="hsl(var(--primary))"
                      name="Mensagens"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base sm:text-lg">
                  Situação das conversas
                </CardTitle>
              </CardHeader>
              <CardContent>
                {data.statusBreakdown.length === 0 ? (
                  <div className="h-[260px] flex flex-col items-center justify-center text-muted-foreground text-sm gap-2">
                    <MessageSquare className="w-8 h-8 opacity-40" />
                    Nenhuma conversa no período
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie
                        data={data.statusBreakdown}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={90}
                        dataKey="value"
                        label={({ name, percent }) =>
                          `${name}: ${(percent * 100).toFixed(0)}%`
                        }
                        labelLine={false}
                      >
                        {data.statusBreakdown.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base sm:text-lg">Resumo do período</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2 text-xs sm:text-sm">
              <Badge variant="secondary">
                Conversão clique → conversa:{" "}
                {data.chatOpens > 0
                  ? `${((data.conversations / data.chatOpens) * 100).toFixed(0)}%`
                  : "—"}
              </Badge>
              <Badge variant="secondary">
                Mensagens do cliente: {data.customerMessages}
              </Badge>
              <Badge variant="secondary">
                Mensagens do atendente: {data.agentMessages}
              </Badge>
              <Badge variant="secondary">
                Formulários respondidos por e-mail: {data.formSubmissions - data.unreadForms}
              </Badge>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
