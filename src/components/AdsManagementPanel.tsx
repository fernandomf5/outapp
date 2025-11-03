import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  DollarSign, 
  Eye,
  MousePointerClick,
  BarChart3,
  Plus,
  Play,
  Pause,
  Edit,
  Trash2,
  Target
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";

interface AdCampaign {
  id: string;
  name: string;
  platform: 'meta' | 'google' | 'tiktok';
  status: 'active' | 'paused' | 'completed';
  budget: number;
  spent: number;
  impressions: number;
  clicks: number;
  conversions: number;
  start_date: string;
  end_date?: string;
  created_at: string;
}

export const AdsManagementPanel = () => {
  const [campaigns, setCampaigns] = useState<AdCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [platformFilter, setPlatformFilter] = useState<'all' | 'meta' | 'google' | 'tiktok'>('all');
  
  const [formData, setFormData] = useState({
    name: '',
    platform: 'meta' as 'meta' | 'google' | 'tiktok',
    budget: '',
    start_date: '',
    end_date: ''
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
      setCampaigns(data || []);
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

      const { error } = await supabase
        .from('ad_campaigns')
        .insert([{
          user_id: user.id,
          ...formData,
          budget: parseFloat(formData.budget),
          status: 'active',
          spent: 0,
          impressions: 0,
          clicks: 0,
          conversions: 0
        }]);

      if (error) throw error;

      toast.success("Campanha criada com sucesso!");
      setIsAddDialogOpen(false);
      loadCampaigns();
      
      setFormData({
        name: '',
        platform: 'meta',
        budget: '',
        start_date: '',
        end_date: ''
      });
    } catch (error: any) {
      toast.error("Erro ao criar campanha");
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'active' ? 'paused' : 'active';
      const { error } = await supabase
        .from('ad_campaigns')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;

      toast.success(`Campanha ${newStatus === 'active' ? 'ativada' : 'pausada'}!`);
      loadCampaigns();
    } catch (error: any) {
      toast.error("Erro ao atualizar status");
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

  const filteredCampaigns = platformFilter === 'all' 
    ? campaigns 
    : campaigns.filter(c => c.platform === platformFilter);

  const totalBudget = campaigns.reduce((sum, c) => sum + c.budget, 0);
  const totalSpent = campaigns.reduce((sum, c) => sum + c.spent, 0);
  const totalImpressions = campaigns.reduce((sum, c) => sum + c.impressions, 0);
  const totalClicks = campaigns.reduce((sum, c) => sum + c.clicks, 0);
  const totalConversions = campaigns.reduce((sum, c) => sum + c.conversions, 0);
  const avgCPC = totalClicks > 0 ? totalSpent / totalClicks : 0;
  const avgCTR = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
  const conversionRate = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0;

  const getPlatformIcon = (platform: string) => {
    switch(platform) {
      case 'meta': return '📘';
      case 'google': return '🔍';
      case 'tiktok': return '🎵';
      default: return '📱';
    }
  };

  const getPlatformColor = (platform: string) => {
    switch(platform) {
      case 'meta': return 'bg-blue-500/20 text-blue-500';
      case 'google': return 'bg-green-500/20 text-green-500';
      case 'tiktok': return 'bg-pink-500/20 text-pink-500';
      default: return '';
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'active': return 'bg-success/20 text-success';
      case 'paused': return 'bg-warning/20 text-warning';
      case 'completed': return 'bg-muted text-muted-foreground';
      default: return '';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Gestão de Anúncios</h2>
          <p className="text-muted-foreground">Gerencie suas campanhas de tráfego pago</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-primary shadow-glow">
              <Plus className="mr-2 h-4 w-4" />
              Nova Campanha
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Criar Nova Campanha</DialogTitle>
              <DialogDescription>Configure sua campanha de anúncios</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Nome da Campanha</Label>
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
              <div className="grid gap-2">
                <Label>Orçamento (R$)</Label>
                <Input 
                  type="number"
                  step="0.01"
                  value={formData.budget}
                  onChange={(e) => setFormData({...formData, budget: e.target.value})}
                  placeholder="1000.00"
                />
              </div>
              <div className="grid gap-2">
                <Label>Data de Início</Label>
                <Input 
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <Label>Data de Término (Opcional)</Label>
                <Input 
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleAddCampaign} className="gradient-primary">
                Criar Campanha
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Estatísticas Gerais */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="glass hover:shadow-glow transition-smooth">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Orçamento Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {totalBudget.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Gasto: R$ {totalSpent.toFixed(2)} ({((totalSpent / totalBudget) * 100).toFixed(1)}%)
            </p>
          </CardContent>
        </Card>

        <Card className="glass hover:shadow-glow transition-smooth">
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

        <Card className="glass hover:shadow-glow transition-smooth">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cliques</CardTitle>
            <MousePointerClick className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalClicks.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              CPC Médio: R$ {avgCPC.toFixed(2)}
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
            <p className="text-xs text-muted-foreground">
              Taxa: {conversionRate.toFixed(2)}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Campanhas */}
      <Card className="glass">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Campanhas Ativas</CardTitle>
            <Select value={platformFilter} onValueChange={(value: any) => setPlatformFilter(value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas Plataformas</SelectItem>
                <SelectItem value="meta">Meta Ads</SelectItem>
                <SelectItem value="google">Google Ads</SelectItem>
                <SelectItem value="tiktok">TikTok Ads</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Carregando...</div>
          ) : filteredCampaigns.length === 0 ? (
            <div className="text-center py-12">
              <BarChart3 className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">
                Nenhuma campanha criada ainda
              </p>
              <Button onClick={() => setIsAddDialogOpen(true)} className="gradient-primary">
                <Plus className="mr-2 h-4 w-4" />
                Criar Primeira Campanha
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredCampaigns.map((campaign) => (
                <Card key={campaign.id} className="p-4 hover:shadow-lg transition-smooth">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">{getPlatformIcon(campaign.platform)}</span>
                        <h3 className="font-semibold text-lg">{campaign.name}</h3>
                        <Badge className={getPlatformColor(campaign.platform)}>
                          {campaign.platform.toUpperCase()}
                        </Badge>
                        <Badge className={getStatusColor(campaign.status)}>
                          {campaign.status === 'active' ? 'Ativa' : 
                           campaign.status === 'paused' ? 'Pausada' : 'Finalizada'}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4">
                        <div>
                          <p className="text-xs text-muted-foreground">Orçamento</p>
                          <p className="font-semibold">R$ {campaign.budget.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Gasto</p>
                          <p className="font-semibold text-warning">R$ {campaign.spent.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Impressões</p>
                          <p className="font-semibold">{campaign.impressions.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Cliques</p>
                          <p className="font-semibold">{campaign.clicks.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Conversões</p>
                          <p className="font-semibold text-success">{campaign.conversions}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <Button 
                        variant="outline" 
                        size="icon"
                        onClick={() => handleToggleStatus(campaign.id, campaign.status)}
                      >
                        {campaign.status === 'active' ? (
                          <Pause className="h-4 w-4" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                      </Button>
                      <Button variant="outline" size="icon">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="icon"
                        onClick={() => handleDeleteCampaign(campaign.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
