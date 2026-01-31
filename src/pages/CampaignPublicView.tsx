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
  BarChart3
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
  engagement_count?: number;
  reach?: number;
  frequency?: number;
  video_views?: number;
  video_watch_time?: number;
  leads_generated?: number;
  messages_count?: number;
  response_rate?: number;
  catalog_sales?: number;
  recovery_rate?: number;
  followers_gained?: number;
  app_installs?: number;
  retention_rate?: number;
  custom_conversions?: number;
  brand_recall?: number;
  qualified_reach?: number;
  start_date?: string;
  end_date?: string;
}

interface AdClient {
  id: string;
  name: string;
  client_type: 'personal' | 'company';
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--success))'];

const CampaignPublicView = () => {
  const { campaignId } = useParams();
  const [campaign, setCampaign] = useState<AdCampaign | null>(null);
  const [client, setClient] = useState<AdClient | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const fetchCampaign = async () => {
      if (!campaignId) {
        setNotFound(true);
        return;
      }

      const { data, error } = await supabase
        .from("ad_campaigns")
        .select("*")
        .eq("id", campaignId)
        .maybeSingle();

      if (error || !data) {
        console.error("Campanha não encontrada:", error);
        setNotFound(true);
        return;
      }

      setCampaign(data as AdCampaign);

      // Fetch client info if available
      if (data.client_id) {
        const { data: clientData } = await supabase
          .from("ad_clients")
          .select("id, name, client_type")
          .eq("id", data.client_id)
          .maybeSingle();
        
        if (clientData) {
          setClient(clientData as AdClient);
        }
      }

      setLoading(false);
    };

    fetchCampaign();
  }, [campaignId]);

  if (notFound) {
    return <Navigate to="/404" replace />;
  }

  if (loading || !campaign) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
          <p className="text-lg text-foreground font-semibold">Carregando campanha...</p>
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

  // Calculate metrics
  const profit = campaign.revenue - campaign.spent;
  const roi = campaign.spent > 0 ? ((campaign.revenue - campaign.spent) / campaign.spent) * 100 : 0;
  const profitMargin = campaign.revenue > 0 ? ((campaign.revenue - campaign.spent) / campaign.revenue) * 100 : 0;
  const conversionRate = campaign.clicks > 0 ? (campaign.conversions / campaign.clicks) * 100 : 0;
  const ctr = campaign.impressions > 0 ? (campaign.clicks / campaign.impressions) * 100 : 0;
  const cpc = campaign.clicks > 0 ? campaign.spent / campaign.clicks : 0;
  const cpa = campaign.conversions > 0 ? campaign.spent / campaign.conversions : 0;

  const performanceData = [
    { name: 'Impressões', value: campaign.impressions },
    { name: 'Cliques', value: campaign.clicks },
    { name: 'Conversões', value: campaign.conversions }
  ];

  const financialData = [
    { name: 'Investido', value: campaign.spent, color: 'hsl(var(--destructive))' },
    { name: 'Faturado', value: campaign.revenue, color: 'hsl(var(--primary))' },
    { name: 'Lucro', value: profit, color: profit >= 0 ? 'hsl(var(--success))' : 'hsl(var(--destructive))' }
  ];

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <span className="text-4xl">{getPlatformIcon(campaign.platform)}</span>
            <h1 className="text-3xl font-bold">{campaign.name}</h1>
          </div>
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <Badge variant="outline">{getPlatformName(campaign.platform)}</Badge>
            <Badge variant="secondary">{getCampaignTypeName(campaign.campaign_type)}</Badge>
            {client && (
              <Badge variant="outline" className="bg-primary/10">
                Cliente: {client.name}
              </Badge>
            )}
          </div>
          {(campaign.start_date || campaign.end_date) && (
            <p className="text-sm text-muted-foreground">
              {campaign.start_date && `Início: ${new Date(campaign.start_date).toLocaleDateString('pt-BR')}`}
              {campaign.start_date && campaign.end_date && ' • '}
              {campaign.end_date && `Fim: ${new Date(campaign.end_date).toLocaleDateString('pt-BR')}`}
            </p>
          )}
        </div>

        {/* Financial Overview */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-destructive/30 bg-gradient-to-br from-destructive/10 to-transparent">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-base font-bold">📉 Investido</CardTitle>
              <TrendingDown className="h-5 w-5 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-destructive">
                R$ {campaign.spent.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Orçamento: R$ {campaign.budget.toFixed(2)}
              </p>
            </CardContent>
          </Card>

          <Card className="border-primary/30 bg-gradient-to-br from-primary/10 to-transparent">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-base font-bold">📊 Faturamento</CardTitle>
              <DollarSign className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">
                R$ {campaign.revenue.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Receita total gerada
              </p>
            </CardContent>
          </Card>

          <Card className={`border-${profit >= 0 ? 'success' : 'destructive'}/30 bg-gradient-to-br from-${profit >= 0 ? 'success' : 'destructive'}/10 to-transparent`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-base font-bold">{profit >= 0 ? '📈' : '📉'} Lucro</CardTitle>
              {profit >= 0 ? <TrendingUp className="h-5 w-5 text-green-500" /> : <TrendingDown className="h-5 w-5 text-destructive" />}
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${profit >= 0 ? 'text-green-500' : 'text-destructive'}`}>
                R$ {profit.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                ROI: {roi.toFixed(1)}%
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
              <div className={`text-2xl font-bold ${roi >= 0 ? 'text-green-500' : 'text-destructive'}`}>
                {roi.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">
                Margem: {profitMargin.toFixed(1)}%
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Impressões</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{campaign.impressions.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                CTR: {ctr.toFixed(2)}%
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cliques</CardTitle>
              <MousePointerClick className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{campaign.clicks.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                CPC: R$ {cpc.toFixed(2)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conversões</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{campaign.conversions}</div>
              <p className="text-xs text-muted-foreground">
                Taxa: {conversionRate.toFixed(2)}%
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">CPA</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">R$ {cpa.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                Custo por aquisição
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Specific Metrics based on campaign type */}
        {campaign.campaign_type === 'video' && (campaign.video_views || campaign.video_watch_time) && (
          <div className="grid gap-4 md:grid-cols-2">
            {campaign.video_views && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Visualizações de Vídeo</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{campaign.video_views.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">
                    CPV: R$ {campaign.video_views > 0 ? (campaign.spent / campaign.video_views).toFixed(2) : '0'}
                  </p>
                </CardContent>
              </Card>
            )}
            {campaign.video_watch_time && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Tempo Total Assistido</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{(campaign.video_watch_time / 60).toFixed(0)} min</div>
                  <p className="text-xs text-muted-foreground">
                    Média: {campaign.video_views ? (campaign.video_watch_time / campaign.video_views).toFixed(0) : '0'}s por view
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {campaign.campaign_type === 'leads' && campaign.leads_generated && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Leads Gerados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{campaign.leads_generated.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                CPL: R$ {campaign.leads_generated > 0 ? (campaign.spent / campaign.leads_generated).toFixed(2) : '0'}
              </p>
            </CardContent>
          </Card>
        )}

        {campaign.campaign_type === 'messages' && (campaign.messages_count || campaign.response_rate) && (
          <div className="grid gap-4 md:grid-cols-2">
            {campaign.messages_count && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Mensagens Iniciadas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{campaign.messages_count.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">
                    Custo/msg: R$ {campaign.messages_count > 0 ? (campaign.spent / campaign.messages_count).toFixed(2) : '0'}
                  </p>
                </CardContent>
              </Card>
            )}
            {campaign.response_rate && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Taxa de Resposta</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{campaign.response_rate.toFixed(1)}%</div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {['reach', 'branding'].includes(campaign.campaign_type) && (campaign.reach || campaign.frequency) && (
          <div className="grid gap-4 md:grid-cols-2">
            {campaign.reach && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Alcance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{campaign.reach.toLocaleString()}</div>
                </CardContent>
              </Card>
            )}
            {campaign.frequency && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Frequência</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{campaign.frequency.toFixed(2)}</div>
                  <p className="text-xs text-muted-foreground">Vezes por pessoa</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Charts */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Financeiro
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

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground pt-4 border-t">
          <p>Dashboard gerado automaticamente • Dados atualizados em tempo real</p>
        </div>
      </div>
    </div>
  );
};

export default CampaignPublicView;
