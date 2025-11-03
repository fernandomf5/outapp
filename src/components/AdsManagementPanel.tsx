import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  TrendingUp, 
  DollarSign, 
  Eye,
  MousePointerClick,
  Target,
  Plus,
  Trash2,
  BarChart3,
  TrendingDown,
  Percent
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface AdCampaign {
  id: string;
  name: string;
  platform: 'meta' | 'google' | 'tiktok';
  budget: number;
  spent: number;
  impressions: number;
  clicks: number;
  conversions: number;
  created_at: string;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--success))'];

export const AdsManagementPanel = () => {
  const [campaigns, setCampaigns] = useState<AdCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    platform: 'meta' as 'meta' | 'google' | 'tiktok',
    budget: '',
    spent: '',
    impressions: '',
    clicks: '',
    conversions: '',
    start_date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    loadCampaigns();
  }, []);

  const loadCampaigns = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('ad_campaigns')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCampaigns(data as any || []);
    } catch (error: any) {
      toast.error("Erro ao carregar campanhas");
    } finally {
      setLoading(false);
    }
  };

  const handleAddCampaign = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (!formData.name || !formData.budget || !formData.spent) {
        toast.error("Preencha os campos obrigatórios");
        return;
      }

      const { error } = await supabase
        .from('ad_campaigns')
        .insert([{
          user_id: user.id,
          name: formData.name,
          platform: formData.platform,
          budget: parseFloat(formData.budget),
          spent: parseFloat(formData.spent),
          impressions: parseInt(formData.impressions) || 0,
          clicks: parseInt(formData.clicks) || 0,
          conversions: parseInt(formData.conversions) || 0,
          status: 'active',
          start_date: formData.start_date
        }]);

      if (error) throw error;

      toast.success("Campanha adicionada com sucesso!");
      setIsAddDialogOpen(false);
      loadCampaigns();
      
      setFormData({
        name: '',
        platform: 'meta',
        budget: '',
        spent: '',
        impressions: '',
        clicks: '',
        conversions: '',
        start_date: new Date().toISOString().split('T')[0]
      });
    } catch (error: any) {
      toast.error("Erro ao adicionar campanha");
    }
  };

  const handleDeleteCampaign = async (id: string) => {
    try {
      const { error } = await supabase
        .from('ad_campaigns')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success("Campanha excluída!");
      loadCampaigns();
    } catch (error: any) {
      toast.error("Erro ao excluir campanha");
    }
  };

  // Cálculos de métricas
  const totalBudget = campaigns.reduce((sum, c) => sum + c.budget, 0);
  const totalSpent = campaigns.reduce((sum, c) => sum + c.spent, 0);
  const totalImpressions = campaigns.reduce((sum, c) => sum + c.impressions, 0);
  const totalClicks = campaigns.reduce((sum, c) => sum + c.clicks, 0);
  const totalConversions = campaigns.reduce((sum, c) => sum + c.conversions, 0);
  
  const avgCPC = totalClicks > 0 ? totalSpent / totalClicks : 0;
  const avgCTR = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
  const conversionRate = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0;
  const costPerConversion = totalConversions > 0 ? totalSpent / totalConversions : 0;
  const roi = totalSpent > 0 ? ((totalBudget - totalSpent) / totalSpent) * 100 : 0;

  // Dados para gráficos
  const campaignPerformanceData = campaigns.map(c => ({
    name: c.name.substring(0, 15),
    impressions: c.impressions,
    clicks: c.clicks,
    conversions: c.conversions
  }));

  const platformDistributionData = campaigns.reduce((acc, c) => {
    const existing = acc.find(item => item.name === c.platform);
    if (existing) {
      existing.value += c.spent;
    } else {
      acc.push({ 
        name: c.platform === 'meta' ? 'Meta Ads' : c.platform === 'google' ? 'Google Ads' : 'TikTok Ads', 
        value: c.spent 
      });
    }
    return acc;
  }, [] as { name: string; value: number }[]);

  const spendingData = campaigns.map(c => ({
    name: c.name.substring(0, 15),
    orçamento: c.budget,
    gasto: c.spent
  }));

  const getPlatformIcon = (platform: string) => {
    switch(platform) {
      case 'meta': return '📘';
      case 'google': return '🔍';
      case 'tiktok': return '🎵';
      default: return '📱';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard de Anúncios</h2>
          <p className="text-muted-foreground">Insira seus dados e visualize as métricas automaticamente</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-primary shadow-glow">
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Campanha
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Adicionar Dados de Campanha</DialogTitle>
              <DialogDescription>Insira os dados da sua campanha para gerar o dashboard</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Nome da Campanha *</Label>
                <Input 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Ex: Black Friday 2024"
                />
              </div>
              <div className="grid gap-2">
                <Label>Plataforma</Label>
                <Select value={formData.platform} onValueChange={(value: any) => setFormData({...formData, platform: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="meta">Meta Ads (Facebook/Instagram)</SelectItem>
                    <SelectItem value="google">Google Ads</SelectItem>
                    <SelectItem value="tiktok">TikTok Ads</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Orçamento (R$) *</Label>
                  <Input 
                    type="number"
                    step="0.01"
                    value={formData.budget}
                    onChange={(e) => setFormData({...formData, budget: e.target.value})}
                    placeholder="1000.00"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Gasto (R$) *</Label>
                  <Input 
                    type="number"
                    step="0.01"
                    value={formData.spent}
                    onChange={(e) => setFormData({...formData, spent: e.target.value})}
                    placeholder="850.00"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="grid gap-2">
                  <Label>Impressões</Label>
                  <Input 
                    type="number"
                    value={formData.impressions}
                    onChange={(e) => setFormData({...formData, impressions: e.target.value})}
                    placeholder="10000"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Cliques</Label>
                  <Input 
                    type="number"
                    value={formData.clicks}
                    onChange={(e) => setFormData({...formData, clicks: e.target.value})}
                    placeholder="500"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Conversões</Label>
                  <Input 
                    type="number"
                    value={formData.conversions}
                    onChange={(e) => setFormData({...formData, conversions: e.target.value})}
                    placeholder="50"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleAddCampaign} className="gradient-primary">
                Adicionar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="text-center py-8 text-muted-foreground">Carregando...</div>
      ) : campaigns.length === 0 ? (
        <Card className="glass">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BarChart3 className="w-16 h-16 mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">Nenhuma campanha adicionada</h3>
            <p className="text-muted-foreground mb-6 text-center max-w-md">
              Adicione os dados da sua primeira campanha para visualizar o dashboard completo com métricas e gráficos
            </p>
            <Button onClick={() => setIsAddDialogOpen(true)} className="gradient-primary shadow-glow">
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Primeira Campanha
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Métricas Principais */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="glass hover:shadow-glow transition-smooth">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Orçamento Total</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">R$ {totalBudget.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</div>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                  <TrendingDown className="h-3 w-3" />
                  Gasto: R$ {totalSpent.toLocaleString('pt-BR', {minimumFractionDigits: 2})} ({((totalSpent / totalBudget) * 100).toFixed(1)}%)
                </p>
              </CardContent>
            </Card>

            <Card className="glass hover:shadow-glow transition-smooth">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Impressões</CardTitle>
                <Eye className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalImpressions.toLocaleString('pt-BR')}</div>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                  <Percent className="h-3 w-3" />
                  CTR: {avgCTR.toFixed(2)}%
                </p>
              </CardContent>
            </Card>

            <Card className="glass hover:shadow-glow transition-smooth">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Cliques</CardTitle>
                <MousePointerClick className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalClicks.toLocaleString('pt-BR')}</div>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                  <DollarSign className="h-3 w-3" />
                  CPC: R$ {avgCPC.toFixed(2)}
                </p>
              </CardContent>
            </Card>

            <Card className="glass hover:shadow-glow transition-smooth">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Conversões</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalConversions}</div>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                  <Percent className="h-3 w-3" />
                  Taxa: {conversionRate.toFixed(2)}%
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Métricas Calculadas */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="glass hover:shadow-glow transition-smooth">
              <CardHeader>
                <CardTitle className="text-sm font-medium">Custo por Conversão</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">R$ {costPerConversion.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Quanto você gasta para conseguir uma conversão
                </p>
              </CardContent>
            </Card>

            <Card className="glass hover:shadow-glow transition-smooth">
              <CardHeader>
                <CardTitle className="text-sm font-medium">ROI (Retorno sobre Investimento)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${roi >= 0 ? 'text-success' : 'text-destructive'}`}>
                  {roi.toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {roi >= 0 ? 'Campanha lucrativa' : 'Campanha com prejuízo'}
                </p>
              </CardContent>
            </Card>

            <Card className="glass hover:shadow-glow transition-smooth">
              <CardHeader>
                <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{conversionRate.toFixed(2)}%</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Percentual de cliques que convertem
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Gráficos */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="glass">
              <CardHeader>
                <CardTitle>Performance por Campanha</CardTitle>
                <CardDescription>Comparação de impressões, cliques e conversões</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={campaignPerformanceData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="name" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }} 
                    />
                    <Legend />
                    <Bar dataKey="impressions" fill="hsl(var(--primary))" name="Impressões" />
                    <Bar dataKey="clicks" fill="hsl(var(--secondary))" name="Cliques" />
                    <Bar dataKey="conversions" fill="hsl(var(--success))" name="Conversões" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="glass">
              <CardHeader>
                <CardTitle>Orçamento vs Gasto</CardTitle>
                <CardDescription>Análise de gastos por campanha</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={spendingData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="name" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }} 
                    />
                    <Legend />
                    <Bar dataKey="orçamento" fill="hsl(var(--primary))" name="Orçamento" />
                    <Bar dataKey="gasto" fill="hsl(var(--warning))" name="Gasto" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {platformDistributionData.length > 0 && (
              <Card className="glass">
                <CardHeader>
                  <CardTitle>Distribuição por Plataforma</CardTitle>
                  <CardDescription>Gasto total por plataforma de anúncios</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={platformDistributionData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {platformDistributionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--background))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                        formatter={(value: number) => `R$ ${value.toFixed(2)}`}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Tabela de Campanhas */}
          <Card className="glass">
            <CardHeader>
              <CardTitle>Histórico de Campanhas</CardTitle>
              <CardDescription>Todas as campanhas adicionadas</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Campanha</TableHead>
                    <TableHead>Plataforma</TableHead>
                    <TableHead className="text-right">Orçamento</TableHead>
                    <TableHead className="text-right">Gasto</TableHead>
                    <TableHead className="text-right">Impressões</TableHead>
                    <TableHead className="text-right">Cliques</TableHead>
                    <TableHead className="text-right">Conversões</TableHead>
                    <TableHead className="text-right">CTR</TableHead>
                    <TableHead className="text-right">CPC</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {campaigns.map((campaign) => {
                    const ctr = campaign.impressions > 0 ? (campaign.clicks / campaign.impressions) * 100 : 0;
                    const cpc = campaign.clicks > 0 ? campaign.spent / campaign.clicks : 0;
                    
                    return (
                      <TableRow key={campaign.id}>
                        <TableCell className="font-medium">{campaign.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="gap-1">
                            <span>{getPlatformIcon(campaign.platform)}</span>
                            {campaign.platform.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">R$ {campaign.budget.toFixed(2)}</TableCell>
                        <TableCell className="text-right text-warning">R$ {campaign.spent.toFixed(2)}</TableCell>
                        <TableCell className="text-right">{campaign.impressions.toLocaleString('pt-BR')}</TableCell>
                        <TableCell className="text-right">{campaign.clicks.toLocaleString('pt-BR')}</TableCell>
                        <TableCell className="text-right text-success">{campaign.conversions}</TableCell>
                        <TableCell className="text-right">{ctr.toFixed(2)}%</TableCell>
                        <TableCell className="text-right">R$ {cpc.toFixed(2)}</TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleDeleteCampaign(campaign.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};
