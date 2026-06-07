import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  BarChart3, 
  MessageSquare, 
  Copy, 
  Link2, 
  DollarSign, 
  Users, 
  UserCircle,
  TrendingUp,
  Activity
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useUserFeatures } from "@/hooks/useUserFeatures";
import AgentAnalyticsPanel from "@/components/AgentAnalyticsPanel";
import { AnalyticsPanel as ClonerAnalyticsPanel } from "@/components/cloner/AnalyticsPanel";
import { FinancialAnalyticsPanel } from "@/components/financial/FinancialAnalyticsPanel";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

export const DetailedAnalytics = () => {
  const { user } = useAuth();
  const { hasFeature } = useUserFeatures();
  const [selectedFeature, setSelectedFeature] = useState("general");
  const [aiAgents, setAiAgents] = useState<any[]>([]);
  const [clonedPages, setClonedPages] = useState<any[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string>("");

  useEffect(() => {
    if (!user) return;
    
    const fetchData = async () => {
      if (selectedFeature === "ai_agent") {
        const { data } = await supabase
          .from('ai_agents')
          .select('id, name')
          .eq('user_id', user.id);
        setAiAgents(data || []);
        if (data && data.length > 0) setSelectedItemId(data[0].id);
      } else if (selectedFeature === "cloner") {
        const { data } = await supabase
          .from('cloned_pages')
          .select('id, slug')
          .eq('user_id', user.id);
        setClonedPages(data || []);
        if (data && data.length > 0) setSelectedItemId(data[0].id);
      }
    };

    fetchData();
  }, [selectedFeature, user]);

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-card/50 to-background/50 backdrop-blur-sm shadow-xl">
      <CardHeader className="pb-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              Analytics Detalhado
            </CardTitle>
            <CardDescription>
              Selecione um recurso para ver métricas específicas
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Select value={selectedFeature} onValueChange={(val) => {
              setSelectedFeature(val);
              setSelectedItemId("");
            }}>
              <SelectTrigger className="w-[200px] bg-background/50 border-primary/20">
                <SelectValue placeholder="Escolha um recurso" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="general">Geral (Visão Geral)</SelectItem>
                {hasFeature('ai_agent') && <SelectItem value="ai_agent">Agentes IA</SelectItem>}
                {hasFeature('page_cloner') && <SelectItem value="cloner">Clonador de Páginas</SelectItem>}
                <SelectItem value="financial">Financeiro</SelectItem>
                <SelectItem value="crm">CRM / Clientes</SelectItem>
              </SelectContent>
            </Select>

            {(selectedFeature === "ai_agent" && aiAgents.length > 0) && (
              <Select value={selectedItemId} onValueChange={setSelectedItemId}>
                <SelectTrigger className="w-[200px] bg-background/50 border-primary/20">
                  <SelectValue placeholder="Selecione o Agente" />
                </SelectTrigger>
                <SelectContent>
                  {aiAgents.map(agent => (
                    <SelectItem key={agent.id} value={agent.id}>{agent.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {(selectedFeature === "cloner" && clonedPages.length > 0) && (
              <Select value={selectedItemId} onValueChange={setSelectedItemId}>
                <SelectTrigger className="w-[200px] bg-background/50 border-primary/20">
                <SelectValue placeholder="Selecione a Página" />
              </SelectTrigger>
              <SelectContent>
                {clonedPages.map(page => (
                  <SelectItem key={page.id} value={page.id}>{page.slug || 'Página sem nome'}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="min-h-[400px]">
          {selectedFeature === "general" && <GeneralAnalyticsView />}
          {selectedFeature === "ai_agent" && selectedItemId && (
            <AgentAnalyticsPanel agentId={selectedItemId} />
          )}
          {selectedFeature === "cloner" && selectedItemId && (
            <ClonerAnalyticsPanel pageId={selectedItemId} />
          )}
          {selectedFeature === "financial" && <FinancialAnalyticsProxy />}
          {selectedFeature === "crm" && <CRMAnalyticsView />}
          
          {(selectedFeature === "ai_agent" && aiAgents.length === 0) && (
            <EmptyAnalyticsState title="Nenhum Agente IA encontrado" />
          )}
          {(selectedFeature === "cloner" && clonedPages.length === 0) && (
            <EmptyAnalyticsState title="Nenhuma Página Clonada encontrada" />
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const GeneralAnalyticsView = () => {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    // Mock data for initial view
    const mockData = [
      { name: 'Seg', valor: 40 },
      { name: 'Ter', valor: 65 },
      { name: 'Qua', valor: 45 },
      { name: 'Qui', valor: 90 },
      { name: 'Sex', valor: 85 },
      { name: 'Sáb', valor: 110 },
      { name: 'Dom', valor: 75 },
    ];
    setData(mockData);
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-primary/5 border-primary/10">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2 bg-primary/20 rounded-lg">
              <Activity className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Engajamento Total</p>
              <h4 className="text-2xl font-bold">1,284</h4>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-green-500/5 border-green-500/10">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Conversão Média</p>
              <h4 className="text-2xl font-bold">12.4%</h4>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-blue-500/5 border-blue-500/10">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Users className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Novos Leads</p>
              <h4 className="text-2xl font-bold">+245</h4>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="h-[300px] w-full">
        <h4 className="text-sm font-semibold mb-4 text-muted-foreground">Tráfego nos últimos 7 dias</h4>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted-foreground))" opacity={0.1} />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: 'hsl(var(--muted-foreground))', fontSize: 12}} />
            <YAxis axisLine={false} tickLine={false} tick={{fill: 'hsl(var(--muted-foreground))', fontSize: 12}} />
            <Tooltip 
              contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
              itemStyle={{ color: 'hsl(var(--primary))' }}
            />
            <Area type="monotone" dataKey="valor" stroke="hsl(var(--primary))" strokeWidth={2} fillOpacity={1} fill="url(#colorValue)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

const FinancialAnalyticsProxy = () => {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTransactions = async () => {
      const { data } = await supabase.from('financial_transactions').select('*');
      setTransactions(data || []);
      setLoading(false);
    };
    fetchTransactions();
  }, []);

  if (loading) return <div>Carregando financeiro...</div>;
  if (transactions.length === 0) return <EmptyAnalyticsState title="Nenhuma transação encontrada" />;

  return (
    <div className="animate-in fade-in duration-500">
      <FinancialAnalyticsPanel 
        transactions={transactions} 
        selectedYear={new Date().getFullYear()} 
        businessName="Minha Conta" 
      />
    </div>
  );
};

const CRMAnalyticsView = () => {
  const [stats, setStats] = useState({ customers: 0, leads: 0, active: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      // Usar contagens separadas para evitar erros de tipos complexos
      const { count: c } = await supabase.from('customers').select('*', { count: 'exact', head: true });
      const { count: l } = await supabase.from('cloned_page_leads').select('*', { count: 'exact', head: true });
      
      setStats({ 
        customers: c || 0, 
        leads: l || 0, 
        active: (c || 0) + (l || 0) 
      });
    };
    fetchStats();
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 bg-orange-500/5 border-orange-500/10">
          <div className="flex items-center gap-3">
            <UserCircle className="w-5 h-5 text-orange-500" />
            <div>
              <p className="text-xl font-bold">{stats.customers}</p>
              <p className="text-xs text-muted-foreground">Clientes Totais</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-blue-500/5 border-blue-500/10">
          <div className="flex items-center gap-3">
            <Activity className="w-5 h-5 text-blue-500" />
            <div>
              <p className="text-xl font-bold">{stats.leads}</p>
              <p className="text-xs text-muted-foreground">Leads Capturados</p>
            </div>
          </div>
        </Card>
      </div>
      <Card className="p-6 border-dashed border-muted">
        <div className="text-center py-8">
          <p className="text-muted-foreground">Gráficos de funil e segmentação em desenvolvimento</p>
        </div>
      </Card>
    </div>
  );
};

const EmptyAnalyticsState = ({ title }: { title: string }) => (
  <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground border-2 border-dashed border-muted rounded-xl">
    <BarChart3 className="w-12 h-12 mb-2 opacity-20" />
    <p>{title}</p>
    <p className="text-sm">Comece a usar o recurso para gerar dados.</p>
  </div>
);
