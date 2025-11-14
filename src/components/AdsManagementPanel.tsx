import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Percent,
  Building2,
  Edit
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { DeleteConfirmDialog } from "@/components/ui/delete-confirm-dialog";
import { toast } from "sonner";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface AdClient {
  id: string;
  name: string;
  client_type: 'personal' | 'company';
  description?: string;
  created_at: string;
}

interface AdCampaign {
  id: string;
  name: string;
  platform: 'meta' | 'google' | 'tiktok';
  budget: number;
  spent: number;
  impressions: number;
  clicks: number;
  conversions: number;
  product_cost: number;
  revenue: number;
  created_at: string;
  client_id?: string;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--success))'];

export const AdsManagementPanel = () => {
  const [clients, setClients] = useState<AdClient[]>([]);
  const [campaigns, setCampaigns] = useState<AdCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddClientDialogOpen, setIsAddClientDialogOpen] = useState(false);
  const [isAddCampaignDialogOpen, setIsAddCampaignDialogOpen] = useState(false);
  const [isEditCampaignDialogOpen, setIsEditCampaignDialogOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<AdCampaign | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<string>('all');
  
  const [clientFormData, setClientFormData] = useState({
    name: '',
    client_type: 'personal' as 'personal' | 'company',
    description: ''
  });

  const [campaignFormData, setCampaignFormData] = useState({
    name: '',
    platform: 'meta' as 'meta' | 'google' | 'tiktok',
    budget: '',
    spent: '',
    impressions: '',
    clicks: '',
    conversions: '',
    product_cost: '',
    revenue: '',
    start_date: new Date().toISOString().split('T')[0],
    client_id: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load clients
      const { data: clientsData, error: clientsError } = await supabase
        .from('ad_clients')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (clientsError) throw clientsError;
      setClients((clientsData || []) as AdClient[]);

      // Load campaigns
      const { data: campaignsData, error: campaignsError } = await supabase
        .from('ad_campaigns')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (campaignsError) throw campaignsError;
      setCampaigns((campaignsData || []) as AdCampaign[]);
    } catch (error: any) {
      toast.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  };

  const handleAddClient = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (!clientFormData.name) {
        toast.error("Preencha o nome do cliente");
        return;
      }

      const { error } = await supabase
        .from('ad_clients')
        .insert([{
          user_id: user.id,
          name: clientFormData.name,
          client_type: clientFormData.client_type,
          description: clientFormData.description || null
        }]);

      if (error) throw error;

      toast.success("Cliente adicionado com sucesso!");
      setIsAddClientDialogOpen(false);
      loadData();
      
      setClientFormData({
        name: '',
        client_type: 'personal',
        description: ''
      });
    } catch (error: any) {
      toast.error("Erro ao adicionar cliente");
    }
  };

  const [deleteClientId, setDeleteClientId] = useState<string | null>(null);

  const handleDeleteClient = async () => {
    if (!deleteClientId) return;

    try {
      const { error } = await supabase
        .from('ad_clients')
        .delete()
        .eq('id', deleteClientId);

      if (error) throw error;

      toast.success("Cliente excluído!");
      loadData();
    } catch (error: any) {
      toast.error("Erro ao excluir cliente");
    } finally {
      setDeleteClientId(null);
    }
  };

  const handleAddCampaign = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (!campaignFormData.name || !campaignFormData.budget || !campaignFormData.spent || !campaignFormData.client_id) {
        toast.error("Preencha os campos obrigatórios");
        return;
      }

      const { error } = await supabase
        .from('ad_campaigns')
        .insert([{
          user_id: user.id,
          name: campaignFormData.name,
          platform: campaignFormData.platform,
          budget: parseFloat(campaignFormData.budget),
          spent: parseFloat(campaignFormData.spent),
          impressions: parseInt(campaignFormData.impressions) || 0,
          clicks: parseInt(campaignFormData.clicks) || 0,
          conversions: parseInt(campaignFormData.conversions) || 0,
          product_cost: parseFloat(campaignFormData.product_cost) || 0,
          revenue: parseFloat(campaignFormData.revenue) || 0,
          status: 'active',
          start_date: campaignFormData.start_date,
          client_id: campaignFormData.client_id
        }]);

      if (error) throw error;

      toast.success("Campanha adicionada com sucesso!");
      setIsAddCampaignDialogOpen(false);
      loadData();
      
      setCampaignFormData({
        name: '',
        platform: 'meta',
        budget: '',
        spent: '',
        impressions: '',
        clicks: '',
        conversions: '',
        product_cost: '',
        revenue: '',
        start_date: new Date().toISOString().split('T')[0],
        client_id: ''
      });
    } catch (error: any) {
      toast.error("Erro ao adicionar campanha");
    }
  };

  const [deleteCampaignId, setDeleteCampaignId] = useState<string | null>(null);

  const handleDeleteCampaign = async () => {
    if (!deleteCampaignId) return;

    try {
      const { error } = await supabase
        .from('ad_campaigns')
        .delete()
        .eq('id', deleteCampaignId);

      if (error) throw error;

      toast.success("Campanha excluída!");
      loadData();
    } catch (error: any) {
      toast.error("Erro ao excluir campanha");
    } finally {
      setDeleteCampaignId(null);
    }
  };

  const handleEditCampaign = (campaign: AdCampaign) => {
    setEditingCampaign(campaign);
    setCampaignFormData({
      name: campaign.name,
      platform: campaign.platform,
      budget: campaign.budget.toString(),
      spent: campaign.spent.toString(),
      impressions: campaign.impressions.toString(),
      clicks: campaign.clicks.toString(),
      conversions: campaign.conversions.toString(),
      product_cost: campaign.product_cost?.toString() || '0',
      revenue: campaign.revenue?.toString() || '0',
      start_date: new Date(campaign.created_at).toISOString().split('T')[0],
      client_id: campaign.client_id || ''
    });
    setIsEditCampaignDialogOpen(true);
  };

  const handleUpdateCampaign = async () => {
    if (!editingCampaign) return;
    
    try {
      if (!campaignFormData.name || !campaignFormData.budget || !campaignFormData.spent) {
        toast.error("Preencha os campos obrigatórios");
        return;
      }

      const { error } = await supabase
        .from('ad_campaigns')
        .update({
          name: campaignFormData.name,
          platform: campaignFormData.platform,
          budget: parseFloat(campaignFormData.budget),
          spent: parseFloat(campaignFormData.spent),
          impressions: parseInt(campaignFormData.impressions) || 0,
          clicks: parseInt(campaignFormData.clicks) || 0,
          conversions: parseInt(campaignFormData.conversions) || 0,
          product_cost: parseFloat(campaignFormData.product_cost) || 0,
          revenue: parseFloat(campaignFormData.revenue) || 0,
          client_id: campaignFormData.client_id || null
        })
        .eq('id', editingCampaign.id);

      if (error) throw error;

      toast.success("Campanha atualizada com sucesso!");
      setIsEditCampaignDialogOpen(false);
      setEditingCampaign(null);
      loadData();
      
      setCampaignFormData({
        name: '',
        platform: 'meta',
        budget: '',
        spent: '',
        impressions: '',
        clicks: '',
        conversions: '',
        product_cost: '',
        revenue: '',
        start_date: new Date().toISOString().split('T')[0],
        client_id: ''
      });
    } catch (error: any) {
      toast.error("Erro ao atualizar campanha");
    }
  };

  // Filter campaigns by client
  const filteredCampaigns = selectedClientId === 'all' 
    ? campaigns 
    : campaigns.filter(c => c.client_id === selectedClientId);

  // Metrics calculations
  const totalBudget = filteredCampaigns.reduce((sum, c) => sum + c.budget, 0);
  const totalSpent = filteredCampaigns.reduce((sum, c) => sum + c.spent, 0);
  const totalImpressions = filteredCampaigns.reduce((sum, c) => sum + c.impressions, 0);
  const totalClicks = filteredCampaigns.reduce((sum, c) => sum + c.clicks, 0);
  const totalConversions = filteredCampaigns.reduce((sum, c) => sum + c.conversions, 0);
  const totalRevenue = filteredCampaigns.reduce((sum, c) => sum + (c.revenue || 0), 0);
  const totalProductCost = filteredCampaigns.reduce((sum, c) => sum + (c.product_cost || 0), 0);
  
  const avgCPC = totalClicks > 0 ? totalSpent / totalClicks : 0;
  const avgCTR = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
  const conversionRate = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0;
  const costPerConversion = totalConversions > 0 ? totalSpent / totalConversions : 0;
  
  // Cálculos financeiros
  const availableBalance = totalBudget - totalSpent; // Saldo disponível (quanto sobrou do investimento)
  const netProfit = totalRevenue - totalSpent - totalProductCost; // Lucro líquido
  const totalCashbox = availableBalance + netProfit; // Caixa total
  const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
  const roi = totalSpent > 0 ? ((totalRevenue - totalSpent - totalProductCost) / totalSpent) * 100 : 0;

  // Chart data
  const campaignPerformanceData = filteredCampaigns.map(c => ({
    name: c.name.substring(0, 15),
    impressions: c.impressions,
    clicks: c.clicks,
    conversions: c.conversions
  }));

  const platformDistributionData = filteredCampaigns.reduce((acc, c) => {
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

  const spendingData = filteredCampaigns.map(c => ({
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

  if (loading) {
    return <div className="flex items-center justify-center p-8">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="campaigns" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="clients">Clientes</TabsTrigger>
          <TabsTrigger value="campaigns">Campanhas</TabsTrigger>
        </TabsList>

        <TabsContent value="clients" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Meus Clientes</h2>
              <p className="text-muted-foreground">Gerencie seus clientes e negócios</p>
            </div>
            <Button className="gradient-primary" onClick={() => setIsAddClientDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Cliente
            </Button>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {clients.map((client) => {
              const clientCampaigns = campaigns.filter(c => c.client_id === client.id);
              const clientSpent = clientCampaigns.reduce((sum, c) => sum + c.spent, 0);
              const clientRevenue = clientCampaigns.reduce((sum, c) => sum + (c.revenue || 0), 0);
              
              return (
                <Card key={client.id} className="relative">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-primary" />
                        <div>
                          <CardTitle className="text-lg">{client.name}</CardTitle>
                          <Badge variant="outline" className="mt-1">
                            {client.client_type === 'personal' ? 'Pessoal' : 'Empresa'}
                          </Badge>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteClientId(client.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                    {client.description && (
                      <p className="text-sm text-muted-foreground mt-2">{client.description}</p>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Campanhas:</span>
                        <span className="font-medium">{clientCampaigns.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Investido:</span>
                        <span className="font-medium">R$ {clientSpent.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Faturado:</span>
                        <span className="font-medium text-success">R$ {clientRevenue.toFixed(2)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {clients.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">Nenhum cliente cadastrado</p>
                <Button onClick={() => setIsAddClientDialogOpen(true)}>
                  Adicionar Primeiro Cliente
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="campaigns" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Dashboard de Anúncios</h2>
              <p className="text-muted-foreground">Insira seus dados e visualize as métricas automaticamente</p>
            </div>
            <div className="flex items-center gap-3">
              {clients.length > 0 && (
                <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Filtrar por cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Clientes</SelectItem>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <Button 
                className="gradient-primary shadow-glow" 
                disabled={clients.length === 0}
                onClick={() => setIsAddCampaignDialogOpen(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Campanha
              </Button>
            </div>
          </div>

          {clients.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">Adicione um cliente primeiro para gerenciar campanhas</p>
                <Button onClick={() => setIsAddClientDialogOpen(true)}>
                  Adicionar Cliente
                </Button>
              </CardContent>
            </Card>
          ) : campaigns.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">Nenhuma campanha adicionada ainda</p>
                <Button onClick={() => setIsAddCampaignDialogOpen(true)}>
                  Adicionar Primeira Campanha
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Metrics Cards - Financeiro */}
              <div className="grid gap-6 md:grid-cols-3 mb-6">
                <Card className="glass border-primary/20">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Saldo Disponível</CardTitle>
                    <DollarSign className="h-5 w-5 text-primary" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-primary">R$ {availableBalance.toFixed(2)}</div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Orçamento: R$ {totalBudget.toFixed(2)} | Gasto: R$ {totalSpent.toFixed(2)}
                    </p>
                  </CardContent>
                </Card>

                <Card className="glass border-success/30 bg-gradient-to-br from-success/5 to-transparent">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-base font-bold">💰 Lucro Líquido</CardTitle>
                    <TrendingUp className="h-6 w-6 text-success" />
                  </CardHeader>
                  <CardContent>
                    <div className={`text-4xl font-bold ${netProfit >= 0 ? 'text-success' : 'text-destructive'}`}>
                      R$ {netProfit.toFixed(2)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Receita: R$ {totalRevenue.toFixed(2)} | Custos: R$ {(totalSpent + totalProductCost).toFixed(2)}
                    </p>
                  </CardContent>
                </Card>

                <Card className="glass border-accent/20">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Caixa Total</CardTitle>
                    <DollarSign className="h-5 w-5 text-accent" />
                  </CardHeader>
                  <CardContent>
                    <div className={`text-3xl font-bold ${totalCashbox >= 0 ? 'text-accent' : 'text-destructive'}`}>
                      R$ {totalCashbox.toFixed(2)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Saldo + Lucro
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Metrics Cards - Performance */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="glass">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">ROI</CardTitle>
                    <Percent className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className={`text-2xl font-bold ${roi >= 0 ? 'text-success' : 'text-destructive'}`}>
                      {roi.toFixed(1)}%
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Margem: {profitMargin.toFixed(1)}%
                    </p>
                  </CardContent>
                </Card>

                <Card className="glass">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Conversões</CardTitle>
                    <Target className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{totalConversions}</div>
                    <p className="text-xs text-muted-foreground">
                      Taxa: {conversionRate.toFixed(2)}%
                    </p>
                  </CardContent>
                </Card>

                <Card className="glass">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Impressões</CardTitle>
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{totalImpressions.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">
                      CTR: {avgCTR.toFixed(2)}%
                    </p>
                  </CardContent>
                </Card>

                <Card className="glass">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Cliques</CardTitle>
                    <MousePointerClick className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{totalClicks.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">
                      CPC: R$ {avgCPC.toFixed(2)}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Charts */}
              <div className="grid gap-4 md:grid-cols-2">
                <Card className="glass">
                  <CardHeader>
                    <CardTitle>Performance por Campanha</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={campaignPerformanceData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
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
                    <CardTitle>Distribuição por Plataforma</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={platformDistributionData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={(entry) => `${entry.name}: R$ ${entry.value.toFixed(2)}`}
                          outerRadius={80}
                          fill="hsl(var(--primary))"
                          dataKey="value"
                        >
                          {platformDistributionData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Campaigns Table */}
              <Card className="glass">
                <CardHeader>
                  <CardTitle>Todas as Campanhas</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Campanha</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Plataforma</TableHead>
                        <TableHead>Investido</TableHead>
                        <TableHead>Faturado</TableHead>
                        <TableHead>ROI</TableHead>
                        <TableHead>Conversões</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCampaigns.map((campaign) => {
                        const campaignROI = campaign.spent > 0 ? ((campaign.revenue - campaign.spent) / campaign.spent) * 100 : 0;
                        const client = clients.find(c => c.id === campaign.client_id);
                        
                        return (
                          <TableRow key={campaign.id}>
                            <TableCell className="font-medium">
                              {getPlatformIcon(campaign.platform)} {campaign.name}
                            </TableCell>
                            <TableCell>{client?.name || '-'}</TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {campaign.platform === 'meta' ? 'Meta' : campaign.platform === 'google' ? 'Google' : 'TikTok'}
                              </Badge>
                            </TableCell>
                            <TableCell>R$ {campaign.spent.toFixed(2)}</TableCell>
                            <TableCell className="text-success">R$ {campaign.revenue.toFixed(2)}</TableCell>
                            <TableCell className={campaignROI >= 0 ? 'text-success' : 'text-destructive'}>
                              {campaignROI.toFixed(1)}%
                            </TableCell>
                            <TableCell>{campaign.conversions}</TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEditCampaign(campaign)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setDeleteCampaignId(campaign.id)}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
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
        </TabsContent>
      </Tabs>

      {/* Add Client Dialog */}
      <Dialog open={isAddClientDialogOpen} onOpenChange={setIsAddClientDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Cliente</DialogTitle>
            <DialogDescription>Crie um novo cliente ou negócio</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Nome *</Label>
              <Input 
                value={clientFormData.name}
                onChange={(e) => setClientFormData({...clientFormData, name: e.target.value})}
                placeholder="Ex: Loja ABC"
              />
            </div>
            <div className="grid gap-2">
              <Label>Tipo</Label>
              <Select value={clientFormData.client_type} onValueChange={(value: any) => setClientFormData({...clientFormData, client_type: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="personal">Pessoal</SelectItem>
                  <SelectItem value="company">Empresa</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Descrição</Label>
              <Input 
                value={clientFormData.description}
                onChange={(e) => setClientFormData({...clientFormData, description: e.target.value})}
                placeholder="Informações adicionais"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddClientDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddClient} className="gradient-primary">
              Adicionar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Campaign Dialog */}
      <Dialog open={isAddCampaignDialogOpen} onOpenChange={setIsAddCampaignDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Adicionar Dados de Campanha</DialogTitle>
            <DialogDescription>Insira os dados da sua campanha para gerar o dashboard</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="grid gap-2">
              <Label>Cliente *</Label>
              <Select value={campaignFormData.client_id} onValueChange={(value) => setCampaignFormData({...campaignFormData, client_id: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Nome da Campanha *</Label>
              <Input 
                value={campaignFormData.name}
                onChange={(e) => setCampaignFormData({...campaignFormData, name: e.target.value})}
                placeholder="Ex: Black Friday 2024"
              />
            </div>
            <div className="grid gap-2">
              <Label>Plataforma</Label>
              <Select value={campaignFormData.platform} onValueChange={(value: any) => setCampaignFormData({...campaignFormData, platform: value})}>
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
                  value={campaignFormData.budget}
                  onChange={(e) => setCampaignFormData({...campaignFormData, budget: e.target.value})}
                  placeholder="1000.00"
                />
              </div>
              <div className="grid gap-2">
                <Label>Quanto Gastei (R$) *</Label>
                <Input 
                  type="number"
                  step="0.01"
                  value={campaignFormData.spent}
                  onChange={(e) => setCampaignFormData({...campaignFormData, spent: e.target.value})}
                  placeholder="850.00"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Quanto Faturei (R$)</Label>
                <Input 
                  type="number"
                  step="0.01"
                  value={campaignFormData.revenue}
                  onChange={(e) => setCampaignFormData({...campaignFormData, revenue: e.target.value})}
                  placeholder="1500.00"
                />
              </div>
              <div className="grid gap-2">
                <Label>Custo do Produto (R$)</Label>
                <Input 
                  type="number"
                  step="0.01"
                  value={campaignFormData.product_cost}
                  onChange={(e) => setCampaignFormData({...campaignFormData, product_cost: e.target.value})}
                  placeholder="150.00"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label>Impressões</Label>
                <Input 
                  type="number"
                  value={campaignFormData.impressions}
                  onChange={(e) => setCampaignFormData({...campaignFormData, impressions: e.target.value})}
                  placeholder="10000"
                />
              </div>
              <div className="grid gap-2">
                <Label>Cliques</Label>
                <Input 
                  type="number"
                  value={campaignFormData.clicks}
                  onChange={(e) => setCampaignFormData({...campaignFormData, clicks: e.target.value})}
                  placeholder="500"
                />
              </div>
              <div className="grid gap-2">
                <Label>Conversões</Label>
                <Input 
                  type="number"
                  value={campaignFormData.conversions}
                  onChange={(e) => setCampaignFormData({...campaignFormData, conversions: e.target.value})}
                  placeholder="50"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddCampaignDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddCampaign} className="gradient-primary">
              Adicionar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Campaign Dialog */}
      <Dialog open={isEditCampaignDialogOpen} onOpenChange={setIsEditCampaignDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Editar Campanha</DialogTitle>
            <DialogDescription>Atualize os dados da campanha</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="grid gap-2">
              <Label>Cliente</Label>
              <Select value={campaignFormData.client_id} onValueChange={(value) => setCampaignFormData({...campaignFormData, client_id: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Nome da Campanha *</Label>
              <Input 
                value={campaignFormData.name}
                onChange={(e) => setCampaignFormData({...campaignFormData, name: e.target.value})}
              />
            </div>
            <div className="grid gap-2">
              <Label>Plataforma</Label>
              <Select value={campaignFormData.platform} onValueChange={(value: any) => setCampaignFormData({...campaignFormData, platform: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="meta">Meta Ads</SelectItem>
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
                  value={campaignFormData.budget}
                  onChange={(e) => setCampaignFormData({...campaignFormData, budget: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <Label>Quanto Gastei (R$) *</Label>
                <Input 
                  type="number"
                  step="0.01"
                  value={campaignFormData.spent}
                  onChange={(e) => setCampaignFormData({...campaignFormData, spent: e.target.value})}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Faturei (R$)</Label>
                <Input 
                  type="number"
                  step="0.01"
                  value={campaignFormData.revenue}
                  onChange={(e) => setCampaignFormData({...campaignFormData, revenue: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <Label>Custo Produto (R$)</Label>
                <Input 
                  type="number"
                  step="0.01"
                  value={campaignFormData.product_cost}
                  onChange={(e) => setCampaignFormData({...campaignFormData, product_cost: e.target.value})}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label>Impressões</Label>
                <Input 
                  type="number"
                  value={campaignFormData.impressions}
                  onChange={(e) => setCampaignFormData({...campaignFormData, impressions: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <Label>Cliques</Label>
                <Input 
                  type="number"
                  value={campaignFormData.clicks}
                  onChange={(e) => setCampaignFormData({...campaignFormData, clicks: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <Label>Conversões</Label>
                <Input 
                  type="number"
                  value={campaignFormData.conversions}
                  onChange={(e) => setCampaignFormData({...campaignFormData, conversions: e.target.value})}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditCampaignDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdateCampaign} className="gradient-primary">
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog
        open={!!deleteClientId}
        onOpenChange={() => setDeleteClientId(null)}
        onConfirm={handleDeleteClient}
        description="Você tem certeza que deseja excluir este cliente? Isso excluirá todas as campanhas associadas. Esta ação não pode ser desfeita."
      />

      <DeleteConfirmDialog
        open={!!deleteCampaignId}
        onOpenChange={() => setDeleteCampaignId(null)}
        onConfirm={handleDeleteCampaign}
        description="Você tem certeza que deseja excluir esta campanha? Esta ação não pode ser desfeita."
      />
    </div>
  );
};