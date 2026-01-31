import { useEffect, useState } from "react";
import { useParams, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Eye, 
  MousePointerClick, 
  Target, 
  Percent,
  Loader2,
  BarChart3,
  Building2,
  User
} from "lucide-react";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface AdCampaign {
  id: string;
  name: string;
  platform: 'meta' | 'google' | 'tiktok';
  campaign_type: string;
  budget: number;
  spent: number;
  impressions: number;
  clicks: number;
  conversions: number;
  product_cost: number;
  revenue: number;
  start_date?: string;
  end_date?: string;
}

interface AdClient {
  id: string;
  name: string;
  client_type: 'personal' | 'company';
  description?: string;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(142 76% 36%)'];

const ClientCampaignsPublicView = () => {
  const { clientId } = useParams();
  const [client, setClient] = useState<AdClient | null>(null);
  const [campaigns, setCampaigns] = useState<AdCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!clientId) {
        setNotFound(true);
        return;
      }

      // Fetch client
      const { data: clientData, error: clientError } = await supabase
        .from("ad_clients")
        .select("id, name, client_type, description")
        .eq("id", clientId)
        .maybeSingle();

      if (clientError || !clientData) {
        console.error("Cliente não encontrado:", clientError);
        setNotFound(true);
        return;
      }

      setClient(clientData as AdClient);

      // Fetch campaigns for this client
      const { data: campaignsData, error: campaignsError } = await supabase
        .from("ad_campaigns")
        .select("*")
        .eq("client_id", clientId)
        .order("created_at", { ascending: false });

      if (campaignsError) {
        console.error("Erro ao buscar campanhas:", campaignsError);
      } else {
        setCampaigns((campaignsData || []) as AdCampaign[]);
      }

      setLoading(false);
    };

    fetchData();
  }, [clientId]);

  if (notFound) {
    return <Navigate to="/404" replace />;
  }

  if (loading || !client) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
          <p className="text-lg text-foreground font-semibold">Carregando campanhas...</p>
        </div>
      </div>
    );
  }

  const getPlatformIcon = (platform: string) => {
    switch(platform) {
      case 'meta': return '📘';
      case 'google': return '🔍';
      case 'tiktok': return '🎵';
      default: return '📊';
    }
  };

  const getPlatformName = (platform: string) => {
    switch(platform) {
      case 'meta': return 'Meta Ads';
      case 'google': return 'Google Ads';
      case 'tiktok': return 'TikTok Ads';
      default: return platform;
    }
  };

  const getCampaignTypeName = (type: string) => {
    const types: Record<string, string> = {
      conversion: 'Conversão',
      traffic: 'Tráfego',
      engagement: 'Engajamento',
      reach: 'Alcance',
      video: 'Visualização de Vídeo',
      leads: 'Geração de Leads',
      messages: 'Mensagens/WhatsApp',
      catalog: 'Catálogo/Vendas',
      remarketing: 'Remarketing',
      ab_test: 'Teste A/B',
      followers: 'Seguidores',
      app_install: 'Instalação de App',
      custom_conversion: 'Conversão Personalizada',
      promotion: 'Lançamento/Promoção',
      branding: 'Branding'
    };
    return types[type] || type;
  };

  // Calculate totals
  const totals = campaigns.reduce((acc, campaign) => ({
    budget: acc.budget + (campaign.budget || 0),
    spent: acc.spent + (campaign.spent || 0),
    revenue: acc.revenue + (campaign.revenue || 0),
    impressions: acc.impressions + (campaign.impressions || 0),
    clicks: acc.clicks + (campaign.clicks || 0),
    conversions: acc.conversions + (campaign.conversions || 0),
  }), { budget: 0, spent: 0, revenue: 0, impressions: 0, clicks: 0, conversions: 0 });

  const totalProfit = totals.revenue - totals.spent;
  const totalROI = totals.spent > 0 ? ((totals.revenue - totals.spent) / totals.spent) * 100 : 0;
  const totalCTR = totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0;
  const totalConversionRate = totals.clicks > 0 ? (totals.conversions / totals.clicks) * 100 : 0;

  // Platform distribution data
  const platformData = campaigns.reduce((acc, campaign) => {
    const existing = acc.find(p => p.name === getPlatformName(campaign.platform));
    if (existing) {
      existing.spent += campaign.spent || 0;
      existing.revenue += campaign.revenue || 0;
    } else {
      acc.push({
        name: getPlatformName(campaign.platform),
        spent: campaign.spent || 0,
        revenue: campaign.revenue || 0
      });
    }
    return acc;
  }, [] as { name: string; spent: number; revenue: number }[]);

  const financialData = [
    { name: 'Investido', value: totals.spent, color: 'hsl(var(--destructive))' },
    { name: 'Faturado', value: totals.revenue, color: 'hsl(var(--primary))' },
    { name: 'Lucro', value: totalProfit, color: totalProfit >= 0 ? 'hsl(142 76% 36%)' : 'hsl(var(--destructive))' }
  ];

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            {client.client_type === 'company' ? (
              <Building2 className="h-8 w-8 text-primary" />
            ) : (
              <User className="h-8 w-8 text-primary" />
            )}
            <h1 className="text-3xl font-bold">{client.name}</h1>
          </div>
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <Badge variant="outline">
              {client.client_type === 'company' ? 'Empresa' : 'Pessoa Física'}
            </Badge>
            <Badge variant="secondary">
              {campaigns.length} campanha{campaigns.length !== 1 ? 's' : ''}
            </Badge>
          </div>
          {client.description && (
            <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
              {client.description}
            </p>
          )}
        </div>

        {campaigns.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nenhuma campanha encontrada para este cliente.</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Financial Overview */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="border-destructive/30 bg-gradient-to-br from-destructive/10 to-transparent">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-base font-bold">📉 Total Investido</CardTitle>
                  <TrendingDown className="h-5 w-5 text-destructive" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-destructive">
                    R$ {totals.spent.toFixed(2)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Orçamento total: R$ {totals.budget.toFixed(2)}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-primary/30 bg-gradient-to-br from-primary/10 to-transparent">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-base font-bold">📊 Faturamento Total</CardTitle>
                  <DollarSign className="h-5 w-5 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary">
                    R$ {totals.revenue.toFixed(2)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Receita total gerada
                  </p>
                </CardContent>
              </Card>

              <Card className={`border-${totalProfit >= 0 ? 'green-500' : 'destructive'}/30 bg-gradient-to-br from-${totalProfit >= 0 ? 'green-500' : 'destructive'}/10 to-transparent`}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-base font-bold">{totalProfit >= 0 ? '📈' : '📉'} Lucro Total</CardTitle>
                  {totalProfit >= 0 ? <TrendingUp className="h-5 w-5 text-green-500" /> : <TrendingDown className="h-5 w-5 text-destructive" />}
                </CardHeader>
                <CardContent>
                  <div className={`text-3xl font-bold ${totalProfit >= 0 ? 'text-green-500' : 'text-destructive'}`}>
                    R$ {totalProfit.toFixed(2)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    ROI: {totalROI.toFixed(1)}%
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Performance Metrics */}
            <div className="grid gap-4 md:grid-cols-5">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">ROI</CardTitle>
                  <Percent className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${totalROI >= 0 ? 'text-green-500' : 'text-destructive'}`}>
                    {totalROI.toFixed(1)}%
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Impressões</CardTitle>
                  <Eye className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totals.impressions.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">
                    CTR: {totalCTR.toFixed(2)}%
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Cliques</CardTitle>
                  <MousePointerClick className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totals.clicks.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">
                    CPC: R$ {totals.clicks > 0 ? (totals.spent / totals.clicks).toFixed(2) : '0'}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Conversões</CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totals.conversions}</div>
                  <p className="text-xs text-muted-foreground">
                    Taxa: {totalConversionRate.toFixed(2)}%
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">CPA Médio</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    R$ {totals.conversions > 0 ? (totals.spent / totals.conversions).toFixed(2) : '0'}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts */}
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Performance por Plataforma
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={platformData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value: number) => `R$ ${value.toFixed(2)}`} />
                      <Legend />
                      <Bar dataKey="spent" name="Investido" fill="hsl(var(--destructive))" />
                      <Bar dataKey="revenue" name="Faturado" fill="hsl(var(--primary))" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Resumo Financeiro
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={financialData.filter(d => d.value > 0)}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(entry) => `${entry.name}: R$ ${entry.value.toFixed(2)}`}
                        outerRadius={80}
                        dataKey="value"
                      >
                        {financialData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => `R$ ${value.toFixed(2)}`} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Campaigns List */}
            <Card>
              <CardHeader>
                <CardTitle>Campanhas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {campaigns.map((campaign) => {
                    const profit = (campaign.revenue || 0) - (campaign.spent || 0);
                    const roi = campaign.spent > 0 ? ((campaign.revenue - campaign.spent) / campaign.spent) * 100 : 0;
                    
                    return (
                      <Card key={campaign.id} className="border">
                        <CardHeader className="pb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{getPlatformIcon(campaign.platform)}</span>
                            <CardTitle className="text-sm font-medium line-clamp-1">
                              {campaign.name}
                            </CardTitle>
                          </div>
                          <div className="flex gap-1 flex-wrap">
                            <Badge variant="outline" className="text-xs">
                              {getPlatformName(campaign.platform)}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              {getCampaignTypeName(campaign.campaign_type)}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <p className="text-muted-foreground text-xs">Investido</p>
                              <p className="font-medium text-destructive">R$ {campaign.spent.toFixed(2)}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground text-xs">Faturado</p>
                              <p className="font-medium text-primary">R$ {(campaign.revenue || 0).toFixed(2)}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground text-xs">Lucro</p>
                              <p className={`font-medium ${profit >= 0 ? 'text-green-500' : 'text-destructive'}`}>
                                R$ {profit.toFixed(2)}
                              </p>
                            </div>
                            <div>
                              <p className="text-muted-foreground text-xs">ROI</p>
                              <p className={`font-medium ${roi >= 0 ? 'text-green-500' : 'text-destructive'}`}>
                                {roi.toFixed(1)}%
                              </p>
                            </div>
                          </div>
                          <div className="flex justify-between text-xs text-muted-foreground pt-2 border-t">
                            <span>{campaign.impressions.toLocaleString()} impressões</span>
                            <span>{campaign.conversions} conversões</span>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Footer */}
            <div className="text-center text-sm text-muted-foreground pt-4 border-t">
              <p>Dashboard gerado automaticamente • Dados atualizados em tempo real</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ClientCampaignsPublicView;
