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
  Edit,
  Sparkles
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
  cashbox: number;
  created_at: string;
}

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
  engagement_cost?: number;
  reach?: number;
  frequency?: number;
  cpm?: number;
  video_views?: number;
  video_watch_time?: number;
  cpv?: number;
  leads_generated?: number;
  cpl?: number;
  messages_count?: number;
  cost_per_message?: number;
  response_rate?: number;
  catalog_sales?: number;
  roas_by_category?: number;
  cpa_by_product?: number;
  recovery_rate?: number;
  followers_gained?: number;
  cost_per_follower?: number;
  app_installs?: number;
  cpi?: number;
  retention_rate?: number;
  custom_conversions?: number;
  brand_recall?: number;
  qualified_reach?: number;
  created_at: string;
  client_id?: string;
  start_date?: string;
  end_date?: string;
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
  const [startDateFilter, setStartDateFilter] = useState<string>('');
  const [endDateFilter, setEndDateFilter] = useState<string>('');
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  
  const [clientFormData, setClientFormData] = useState({
    name: '',
    client_type: 'personal' as 'personal' | 'company',
    description: '',
    cashbox: ''
  });
  
  const [isEditClientDialogOpen, setIsEditClientDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<AdClient | null>(null);

  const [campaignFormData, setCampaignFormData] = useState({
    name: '',
    platform: 'meta' as 'meta' | 'google' | 'tiktok',
    campaign_type: 'conversion',
    budget: '',
    spent: '',
    impressions: '',
    clicks: '',
    conversions: '',
    product_cost: '',
    revenue: '',
    engagement_count: '',
    reach: '',
    frequency: '',
    video_views: '',
    video_watch_time: '',
    leads_generated: '',
    messages_count: '',
    response_rate: '',
    catalog_sales: '',
    recovery_rate: '',
    followers_gained: '',
    app_installs: '',
    retention_rate: '',
    custom_conversions: '',
    brand_recall: '',
    qualified_reach: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    client_id: ''
  });

  // Definir quais campos aparecem para cada tipo de campanha
  const campaignTypeFields: Record<string, string[]> = {
    conversion: ['impressions', 'clicks', 'conversions', 'product_cost', 'revenue'],
    traffic: ['impressions', 'clicks'],
    engagement: ['impressions', 'engagement_count'],
    reach: ['reach', 'frequency'],
    video: ['video_views', 'video_watch_time'],
    leads: ['leads_generated'],
    messages: ['messages_count', 'response_rate'],
    catalog: ['catalog_sales', 'conversions', 'revenue'],
    remarketing: ['impressions', 'clicks', 'conversions', 'recovery_rate'],
    ab_test: ['impressions', 'clicks', 'conversions'],
    followers: ['followers_gained'],
    app_install: ['app_installs', 'retention_rate'],
    custom_conversion: ['custom_conversions'],
    promotion: ['impressions', 'clicks', 'conversions', 'revenue'],
    branding: ['reach', 'qualified_reach', 'brand_recall']
  };

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
          description: clientFormData.description || null,
          cashbox: parseFloat(clientFormData.cashbox) || 0
        }]);

      if (error) throw error;

      toast.success("Cliente adicionado com sucesso!");
      setIsAddClientDialogOpen(false);
      loadData();
      
      setClientFormData({
        name: '',
        client_type: 'personal',
        description: '',
        cashbox: ''
      });
    } catch (error: any) {
      toast.error("Erro ao adicionar cliente");
    }
  };

  const handleEditClient = async () => {
    if (!editingClient) return;

    try {
      const { error } = await supabase
        .from('ad_clients')
        .update({
          name: clientFormData.name,
          client_type: clientFormData.client_type,
          description: clientFormData.description || null,
          cashbox: parseFloat(clientFormData.cashbox) || 0
        })
        .eq('id', editingClient.id);

      if (error) throw error;

      toast.success("Cliente atualizado!");
      setIsEditClientDialogOpen(false);
      setEditingClient(null);
      loadData();
      
      setClientFormData({
        name: '',
        client_type: 'personal',
        description: '',
        cashbox: ''
      });
    } catch (error: any) {
      toast.error("Erro ao atualizar cliente");
    }
  };

  const openEditClient = (client: AdClient) => {
    setEditingClient(client);
    setClientFormData({
      name: client.name,
      client_type: client.client_type,
      description: client.description || '',
      cashbox: client.cashbox.toString()
    });
    setIsEditClientDialogOpen(true);
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

  const generateScenarioData = (type: 'positive' | 'negative', campaignType: string) => {
    const commonFields = {
      budget: type === 'positive' ? '5000' : '3000',
      spent: type === 'positive' ? '4200' : '2900',
    };

    const scenarioData: any = { ...campaignFormData, ...commonFields };

    // Dados específicos por tipo de campanha
    switch (campaignType) {
      case 'conversion':
        if (type === 'positive') {
          scenarioData.impressions = '85000';
          scenarioData.clicks = '4250';
          scenarioData.conversions = '425';
          scenarioData.revenue = '21250';
          scenarioData.product_cost = '8500';
        } else {
          scenarioData.impressions = '45000';
          scenarioData.clicks = '900';
          scenarioData.conversions = '45';
          scenarioData.revenue = '2250';
          scenarioData.product_cost = '1800';
        }
        break;

      case 'traffic':
        if (type === 'positive') {
          scenarioData.impressions = '120000';
          scenarioData.clicks = '9600';
          scenarioData.engagement_count = '4800';
        } else {
          scenarioData.impressions = '60000';
          scenarioData.clicks = '1800';
          scenarioData.engagement_count = '900';
        }
        break;

      case 'engagement':
        if (type === 'positive') {
          scenarioData.impressions = '95000';
          scenarioData.engagement_count = '19000';
        } else {
          scenarioData.impressions = '50000';
          scenarioData.engagement_count = '5000';
        }
        break;

      case 'reach':
        if (type === 'positive') {
          scenarioData.reach = '150000';
          scenarioData.frequency = '2.8';
        } else {
          scenarioData.reach = '45000';
          scenarioData.frequency = '1.5';
        }
        break;

      case 'video':
        if (type === 'positive') {
          scenarioData.video_views = '75000';
          scenarioData.video_watch_time = '1125000';
        } else {
          scenarioData.video_views = '25000';
          scenarioData.video_watch_time = '187500';
        }
        break;

      case 'leads':
        if (type === 'positive') {
          scenarioData.leads_generated = '850';
        } else {
          scenarioData.leads_generated = '145';
        }
        break;

      case 'messages':
        if (type === 'positive') {
          scenarioData.messages_count = '680';
          scenarioData.response_rate = '78.5';
        } else {
          scenarioData.messages_count = '145';
          scenarioData.response_rate = '32.8';
        }
        break;

      case 'catalog':
        if (type === 'positive') {
          scenarioData.catalog_sales = '340';
          scenarioData.conversions = '340';
          scenarioData.revenue = '17000';
        } else {
          scenarioData.catalog_sales = '58';
          scenarioData.conversions = '58';
          scenarioData.revenue = '2900';
        }
        break;

      case 'remarketing':
        if (type === 'positive') {
          scenarioData.impressions = '42000';
          scenarioData.clicks = '2520';
          scenarioData.conversions = '252';
          scenarioData.recovery_rate = '22.5';
        } else {
          scenarioData.impressions = '25000';
          scenarioData.clicks = '500';
          scenarioData.conversions = '25';
          scenarioData.recovery_rate = '5.8';
        }
        break;

      case 'ab_test':
        if (type === 'positive') {
          scenarioData.impressions = '50000';
          scenarioData.clicks = '3000';
          scenarioData.conversions = '300';
        } else {
          scenarioData.impressions = '30000';
          scenarioData.clicks = '600';
          scenarioData.conversions = '30';
        }
        break;

      case 'followers':
        if (type === 'positive') {
          scenarioData.followers_gained = '2500';
        } else {
          scenarioData.followers_gained = '420';
        }
        break;

      case 'app_install':
        if (type === 'positive') {
          scenarioData.app_installs = '1250';
          scenarioData.retention_rate = '65.8';
        } else {
          scenarioData.app_installs = '210';
          scenarioData.retention_rate = '22.5';
        }
        break;

      case 'custom_conversion':
        if (type === 'positive') {
          scenarioData.custom_conversions = '425';
        } else {
          scenarioData.custom_conversions = '72';
        }
        break;

      case 'promotion':
        if (type === 'positive') {
          scenarioData.impressions = '110000';
          scenarioData.clicks = '5500';
          scenarioData.conversions = '550';
          scenarioData.revenue = '27500';
        } else {
          scenarioData.impressions = '48000';
          scenarioData.clicks = '960';
          scenarioData.conversions = '48';
          scenarioData.revenue = '2400';
        }
        break;

      case 'branding':
        if (type === 'positive') {
          scenarioData.reach = '180000';
          scenarioData.qualified_reach = '135000';
          scenarioData.brand_recall = '45.8';
        } else {
          scenarioData.reach = '58000';
          scenarioData.qualified_reach = '29000';
          scenarioData.brand_recall = '12.5';
        }
        break;
    }

    return scenarioData;
  };

  const handleGenerateScenario = (type: 'positive' | 'negative') => {
    if (!campaignFormData.campaign_type) {
      toast.error("Selecione o tipo de campanha primeiro");
      return;
    }
    
    const scenarioData = generateScenarioData(type, campaignFormData.campaign_type);
    setCampaignFormData(scenarioData);
    toast.success(`Cenário ${type === 'positive' ? 'positivo' : 'negativo'} gerado!`);
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
          campaign_type: campaignFormData.campaign_type,
          budget: parseFloat(campaignFormData.budget),
          spent: parseFloat(campaignFormData.spent),
          impressions: parseInt(campaignFormData.impressions) || 0,
          clicks: parseInt(campaignFormData.clicks) || 0,
          conversions: parseInt(campaignFormData.conversions) || 0,
          product_cost: parseFloat(campaignFormData.product_cost) || 0,
          revenue: parseFloat(campaignFormData.revenue) || 0,
          engagement_count: parseInt(campaignFormData.engagement_count) || 0,
          reach: parseInt(campaignFormData.reach) || 0,
          frequency: parseFloat(campaignFormData.frequency) || 0,
          video_views: parseInt(campaignFormData.video_views) || 0,
          video_watch_time: parseInt(campaignFormData.video_watch_time) || 0,
          leads_generated: parseInt(campaignFormData.leads_generated) || 0,
          messages_count: parseInt(campaignFormData.messages_count) || 0,
          response_rate: parseFloat(campaignFormData.response_rate) || 0,
          catalog_sales: parseInt(campaignFormData.catalog_sales) || 0,
          recovery_rate: parseFloat(campaignFormData.recovery_rate) || 0,
          followers_gained: parseInt(campaignFormData.followers_gained) || 0,
          app_installs: parseInt(campaignFormData.app_installs) || 0,
          retention_rate: parseFloat(campaignFormData.retention_rate) || 0,
          custom_conversions: parseInt(campaignFormData.custom_conversions) || 0,
          brand_recall: parseFloat(campaignFormData.brand_recall) || 0,
          qualified_reach: parseInt(campaignFormData.qualified_reach) || 0,
          status: 'active',
          start_date: campaignFormData.start_date || null,
          end_date: campaignFormData.end_date || null,
          client_id: campaignFormData.client_id
        }]);

      if (error) throw error;

      toast.success("Campanha adicionada com sucesso!");
      setIsAddCampaignDialogOpen(false);
      loadData();
      
      setCampaignFormData({
        name: '',
        platform: 'meta',
        campaign_type: 'conversion',
        budget: '',
        spent: '',
        impressions: '',
        clicks: '',
        conversions: '',
        product_cost: '',
        revenue: '',
        engagement_count: '',
        reach: '',
        frequency: '',
        video_views: '',
        video_watch_time: '',
        leads_generated: '',
        messages_count: '',
        response_rate: '',
        catalog_sales: '',
        recovery_rate: '',
        followers_gained: '',
        app_installs: '',
        retention_rate: '',
        custom_conversions: '',
        brand_recall: '',
        qualified_reach: '',
        start_date: new Date().toISOString().split('T')[0],
        end_date: '',
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
      campaign_type: campaign.campaign_type || 'conversion',
      budget: campaign.budget.toString(),
      spent: campaign.spent.toString(),
      impressions: campaign.impressions.toString(),
      clicks: campaign.clicks.toString(),
      conversions: campaign.conversions.toString(),
      product_cost: campaign.product_cost?.toString() || '0',
      revenue: campaign.revenue?.toString() || '0',
      engagement_count: campaign.engagement_count?.toString() || '',
      reach: campaign.reach?.toString() || '',
      frequency: campaign.frequency?.toString() || '',
      video_views: campaign.video_views?.toString() || '',
      video_watch_time: campaign.video_watch_time?.toString() || '',
      leads_generated: campaign.leads_generated?.toString() || '',
      messages_count: campaign.messages_count?.toString() || '',
      response_rate: campaign.response_rate?.toString() || '',
      catalog_sales: campaign.catalog_sales?.toString() || '',
      recovery_rate: campaign.recovery_rate?.toString() || '',
      followers_gained: campaign.followers_gained?.toString() || '',
      app_installs: campaign.app_installs?.toString() || '',
      retention_rate: campaign.retention_rate?.toString() || '',
      custom_conversions: campaign.custom_conversions?.toString() || '',
      brand_recall: campaign.brand_recall?.toString() || '',
      qualified_reach: campaign.qualified_reach?.toString() || '',
      start_date: campaign.start_date || new Date(campaign.created_at).toISOString().split('T')[0],
      end_date: campaign.end_date || '',
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

      // Calcular diferença de gasto para atualizar caixa do cliente
      const spentDifference = parseFloat(campaignFormData.spent) - editingCampaign.spent;

      const { error } = await supabase
        .from('ad_campaigns')
        .update({
          name: campaignFormData.name,
          platform: campaignFormData.platform,
          campaign_type: campaignFormData.campaign_type,
          budget: parseFloat(campaignFormData.budget),
          spent: parseFloat(campaignFormData.spent),
          impressions: parseInt(campaignFormData.impressions) || 0,
          clicks: parseInt(campaignFormData.clicks) || 0,
          conversions: parseInt(campaignFormData.conversions) || 0,
          product_cost: parseFloat(campaignFormData.product_cost) || 0,
          revenue: parseFloat(campaignFormData.revenue) || 0,
          engagement_count: parseInt(campaignFormData.engagement_count) || 0,
          reach: parseInt(campaignFormData.reach) || 0,
          frequency: parseFloat(campaignFormData.frequency) || 0,
          video_views: parseInt(campaignFormData.video_views) || 0,
          video_watch_time: parseInt(campaignFormData.video_watch_time) || 0,
          leads_generated: parseInt(campaignFormData.leads_generated) || 0,
          messages_count: parseInt(campaignFormData.messages_count) || 0,
          response_rate: parseFloat(campaignFormData.response_rate) || 0,
          catalog_sales: parseInt(campaignFormData.catalog_sales) || 0,
          recovery_rate: parseFloat(campaignFormData.recovery_rate) || 0,
          followers_gained: parseInt(campaignFormData.followers_gained) || 0,
          app_installs: parseInt(campaignFormData.app_installs) || 0,
          retention_rate: parseFloat(campaignFormData.retention_rate) || 0,
          custom_conversions: parseInt(campaignFormData.custom_conversions) || 0,
          brand_recall: parseFloat(campaignFormData.brand_recall) || 0,
          qualified_reach: parseInt(campaignFormData.qualified_reach) || 0,
          start_date: campaignFormData.start_date || null,
          end_date: campaignFormData.end_date || null,
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
        campaign_type: 'conversion',
        budget: '',
        spent: '',
        impressions: '',
        clicks: '',
        conversions: '',
        product_cost: '',
        revenue: '',
        engagement_count: '',
        reach: '',
        frequency: '',
        video_views: '',
        video_watch_time: '',
        leads_generated: '',
        messages_count: '',
        response_rate: '',
        catalog_sales: '',
        recovery_rate: '',
        followers_gained: '',
        app_installs: '',
        retention_rate: '',
        custom_conversions: '',
        brand_recall: '',
        qualified_reach: '',
        start_date: new Date().toISOString().split('T')[0],
        end_date: '',
        client_id: ''
      });
    } catch (error: any) {
      toast.error("Erro ao atualizar campanha");
    }
  };

  // Filter campaigns by client and date
  const filteredCampaigns = campaigns.filter(c => {
    // Filter by specific campaign if selected
    if (selectedCampaignId && c.id !== selectedCampaignId) {
      return false;
    }
    
    // Filter by client
    if (selectedClientId !== 'all' && c.client_id !== selectedClientId) {
      return false;
    }
    
    // Filter by date range
    if (startDateFilter && c.start_date) {
      if (new Date(c.start_date) < new Date(startDateFilter)) {
        return false;
      }
    }
    
    if (endDateFilter && c.start_date) {
      if (new Date(c.start_date) > new Date(endDateFilter)) {
        return false;
      }
    }
    
    return true;
  });

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
  const currentClient = selectedClientId !== 'all' 
    ? clients.find(c => c.id === selectedClientId)
    : null;
  
  const clientInitialCashbox = currentClient?.cashbox || 0;
  const clientRemainingCashbox = clientInitialCashbox - totalSpent;
  
  const grossProfit = totalRevenue - totalSpent;
  const netProfit = totalRevenue - totalSpent - totalProductCost;
  const totalCashbox = clientRemainingCashbox + grossProfit;
  const profitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
  const roi = totalSpent > 0 ? (grossProfit / totalSpent) * 100 : 0;

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

  // Função para avaliar performance da campanha
  const evaluateCampaignPerformance = (campaign: AdCampaign) => {
    let score = 0;
    let maxScore = 0;
    let metrics: string[] = [];

    // ROI
    const campaignROI = campaign.spent > 0 ? ((campaign.revenue - campaign.spent) / campaign.spent) * 100 : 0;
    if (campaignROI > 100) {
      score += 3;
      metrics.push(`✅ ROI excelente (${campaignROI.toFixed(0)}%)`);
    } else if (campaignROI > 50) {
      score += 2;
      metrics.push(`✓ ROI bom (${campaignROI.toFixed(0)}%)`);
    } else if (campaignROI > 0) {
      score += 1;
      metrics.push(`⚠️ ROI positivo mas baixo (${campaignROI.toFixed(0)}%)`);
    } else {
      metrics.push(`❌ ROI negativo (${campaignROI.toFixed(0)}%)`);
    }
    maxScore += 3;

    // CTR (Click-through rate)
    const ctr = campaign.impressions > 0 ? (campaign.clicks / campaign.impressions) * 100 : 0;
    if (ctr > 2) {
      score += 2;
      metrics.push(`✅ CTR excelente (${ctr.toFixed(2)}%)`);
    } else if (ctr > 1) {
      score += 1;
      metrics.push(`✓ CTR razoável (${ctr.toFixed(2)}%)`);
    } else if (ctr > 0) {
      metrics.push(`⚠️ CTR baixo (${ctr.toFixed(2)}%)`);
    } else {
      metrics.push(`❌ CTR muito baixo`);
    }
    maxScore += 2;

    // Taxa de conversão
    if (campaign.clicks > 0 && campaign.conversions > 0) {
      const convRate = (campaign.conversions / campaign.clicks) * 100;
      if (convRate > 5) {
        score += 3;
        metrics.push(`✅ Taxa de conversão excelente (${convRate.toFixed(2)}%)`);
      } else if (convRate > 2) {
        score += 2;
        metrics.push(`✓ Taxa de conversão boa (${convRate.toFixed(2)}%)`);
      } else if (convRate > 0.5) {
        score += 1;
        metrics.push(`⚠️ Taxa de conversão baixa (${convRate.toFixed(2)}%)`);
      } else {
        metrics.push(`❌ Taxa de conversão muito baixa (${convRate.toFixed(2)}%)`);
      }
      maxScore += 3;
    }

    // Métricas específicas por tipo
    switch (campaign.campaign_type) {
      case 'engagement':
        if (campaign.engagement_count && campaign.impressions) {
          const engRate = (campaign.engagement_count / campaign.impressions) * 100;
          if (engRate > 10) {
            score += 2;
            metrics.push(`✅ Taxa de engajamento excelente (${engRate.toFixed(2)}%)`);
          } else if (engRate > 5) {
            score += 1;
            metrics.push(`✓ Taxa de engajamento boa (${engRate.toFixed(2)}%)`);
          } else {
            metrics.push(`⚠️ Taxa de engajamento baixa (${engRate.toFixed(2)}%)`);
          }
          maxScore += 2;
        }
        break;
      
      case 'video':
        if (campaign.video_views && campaign.video_watch_time) {
          const avgWatchTime = campaign.video_watch_time / campaign.video_views;
          if (avgWatchTime > 30) {
            score += 2;
            metrics.push(`✅ Tempo médio de visualização excelente (${avgWatchTime.toFixed(0)}s)`);
          } else if (avgWatchTime > 15) {
            score += 1;
            metrics.push(`✓ Tempo médio razoável (${avgWatchTime.toFixed(0)}s)`);
          } else {
            metrics.push(`⚠️ Tempo médio baixo (${avgWatchTime.toFixed(0)}s)`);
          }
          maxScore += 2;
        }
        break;

      case 'messages':
        if (campaign.response_rate) {
          if (campaign.response_rate > 60) {
            score += 2;
            metrics.push(`✅ Taxa de resposta excelente (${campaign.response_rate.toFixed(1)}%)`);
          } else if (campaign.response_rate > 40) {
            score += 1;
            metrics.push(`✓ Taxa de resposta boa (${campaign.response_rate.toFixed(1)}%)`);
          } else {
            metrics.push(`⚠️ Taxa de resposta baixa (${campaign.response_rate.toFixed(1)}%)`);
          }
          maxScore += 2;
        }
        break;

      case 'app_install':
        if (campaign.retention_rate) {
          if (campaign.retention_rate > 50) {
            score += 2;
            metrics.push(`✅ Retenção excelente (${campaign.retention_rate.toFixed(1)}%)`);
          } else if (campaign.retention_rate > 30) {
            score += 1;
            metrics.push(`✓ Retenção razoável (${campaign.retention_rate.toFixed(1)}%)`);
          } else {
            metrics.push(`⚠️ Retenção baixa (${campaign.retention_rate.toFixed(1)}%)`);
          }
          maxScore += 2;
        }
        break;

      case 'branding':
        if (campaign.brand_recall) {
          if (campaign.brand_recall > 40) {
            score += 2;
            metrics.push(`✅ Recall de marca excelente (${campaign.brand_recall.toFixed(1)}%)`);
          } else if (campaign.brand_recall > 25) {
            score += 1;
            metrics.push(`✓ Recall de marca bom (${campaign.brand_recall.toFixed(1)}%)`);
          } else {
            metrics.push(`⚠️ Recall de marca baixo (${campaign.brand_recall.toFixed(1)}%)`);
          }
          maxScore += 2;
        }
        break;
    }

    const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0;
    let status: 'excellent' | 'good' | 'fair' | 'poor';
    let message: string;
    let icon: string;

    if (percentage >= 80) {
      status = 'excellent';
      message = 'Campanha Excelente!';
      icon = '🎉';
    } else if (percentage >= 60) {
      status = 'good';
      message = 'Campanha Boa';
      icon = '👍';
    } else if (percentage >= 40) {
      status = 'fair';
      message = 'Campanha Regular';
      icon = '⚠️';
    } else {
      status = 'poor';
      message = 'Campanha Precisa Melhorar';
      icon = '📉';
    }

    return { status, message, icon, metrics, score, maxScore, percentage };
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
              const clientProfit = clientRevenue - clientSpent;
              const totalCashbox = client.cashbox - clientSpent + clientProfit;
              
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
                        <span className="text-muted-foreground">Caixa Inicial:</span>
                        <span className="font-medium text-primary">R$ {client.cashbox.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Lucro:</span>
                        <span className={`font-medium ${clientProfit >= 0 ? 'text-success' : 'text-destructive'}`}>
                          R$ {clientProfit.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between font-semibold">
                        <span className="text-muted-foreground">Caixa Total:</span>
                        <span className={`${totalCashbox >= 0 ? 'text-success' : 'text-destructive'}`}>
                          R$ {totalCashbox.toFixed(2)}
                        </span>
                      </div>
                      <div className="h-px bg-border my-2" />
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Campanhas:</span>
                        <span className="font-medium">{clientCampaigns.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Gasto Total:</span>
                        <span className="font-medium">R$ {clientSpent.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Faturado:</span>
                        <span className="font-medium text-success">R$ {clientRevenue.toFixed(2)}</span>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full mt-2"
                        onClick={(e) => { e.stopPropagation(); openEditClient(client); }}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Editar
                      </Button>
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
              {selectedCampaignId && (
                <p className="text-muted-foreground">
                  Visualizando campanha: {campaigns.find(c => c.id === selectedCampaignId)?.name}
                </p>
              )}
            </div>
            <div className="flex items-center gap-3">
              {selectedCampaignId && (
                <Button
                  variant="outline" 
                  onClick={() => setSelectedCampaignId(null)}
                >
                  Ver Todas as Campanhas
                </Button>
              )}
              {clients.length > 0 && (
                <>
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
                  
                </>
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
                <Card className="glass border-destructive/30 bg-gradient-to-br from-destructive/10 to-transparent">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-base font-bold">📉 Gasto com Anúncios</CardTitle>
                    <TrendingDown className="h-6 w-6 text-destructive" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-4xl font-bold text-destructive">
                      R$ {totalSpent.toFixed(2)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Total investido em campanhas
                    </p>
                  </CardContent>
                </Card>

                <Card className="glass border-primary/30 bg-gradient-to-br from-primary/10 to-transparent">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-base font-bold">📊 Faturamento Total</CardTitle>
                    <DollarSign className="h-6 w-6 text-primary" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-4xl font-bold text-primary">
                      R$ {totalRevenue.toFixed(2)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Receita bruta total das campanhas
                    </p>
                  </CardContent>
                </Card>

                <Card className="glass border-success/40 bg-gradient-to-br from-success/10 to-transparent shadow-lg">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-lg font-bold">💰 Lucro</CardTitle>
                    <TrendingUp className="h-7 w-7 text-success" />
                  </CardHeader>
                  <CardContent>
                    <div className={`text-5xl font-bold ${grossProfit >= 0 ? 'text-success' : 'text-destructive'}`}>
                      R$ {grossProfit.toFixed(2)}
                    </div>
                    <p className="text-sm font-medium text-muted-foreground mt-3">
                      Faturamento - Gasto Anúncios
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Campaign Performance Evaluation */}
              {selectedCampaignId && filteredCampaigns.length > 0 && (() => {
                const campaign = filteredCampaigns[0];
                const evaluation = evaluateCampaignPerformance(campaign);
                const statusColors = {
                  excellent: 'border-success bg-gradient-to-br from-success/20 to-transparent',
                  good: 'border-primary bg-gradient-to-br from-primary/20 to-transparent',
                  fair: 'border-warning bg-gradient-to-br from-warning/20 to-transparent',
                  poor: 'border-destructive bg-gradient-to-br from-destructive/20 to-transparent'
                };

                return (
                  <Card className={`glass ${statusColors[evaluation.status]} mb-6`}>
                    <CardHeader>
                      <CardTitle className="text-2xl flex items-center gap-3">
                        <span className="text-4xl">{evaluation.icon}</span>
                        {evaluation.message}
                        <Badge variant={evaluation.status === 'excellent' || evaluation.status === 'good' ? 'default' : 'destructive'} className="ml-auto">
                          {evaluation.percentage.toFixed(0)}% de performance
                        </Badge>
                      </CardTitle>
                      <CardDescription className="text-base">
                        Análise detalhada da campanha {campaign.name}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-2">
                        {evaluation.metrics.map((metric, idx) => (
                          <div key={idx} className="text-sm font-medium">
                            {metric}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                );
              })()}

              {/* Metrics Cards - Performance */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {selectedCampaignId && filteredCampaigns.length > 0 ? (
                  // Métricas específicas por tipo de campanha
                  (() => {
                    const campaign = filteredCampaigns[0];
                    const metricsCards = [];

                    // Métricas básicas (sempre mostram)
                    metricsCards.push(
                      <Card key="impressions" className="glass">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">Impressões</CardTitle>
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{campaign.impressions.toLocaleString()}</div>
                          <p className="text-xs text-muted-foreground">
                            CPM: R$ {campaign.impressions > 0 ? ((campaign.spent / campaign.impressions) * 1000).toFixed(2) : '0'}
                          </p>
                        </CardContent>
                      </Card>,
                      <Card key="clicks" className="glass">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">Cliques</CardTitle>
                          <MousePointerClick className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{campaign.clicks.toLocaleString()}</div>
                          <p className="text-xs text-muted-foreground">
                            CTR: {campaign.impressions > 0 ? ((campaign.clicks / campaign.impressions) * 100).toFixed(2) : '0'}%
                          </p>
                        </CardContent>
                      </Card>
                    );

                    // Métricas específicas por tipo de campanha
                    if (['conversion', 'catalog', 'promotion', 'remarketing'].includes(campaign.campaign_type)) {
                      metricsCards.push(
                        <Card key="conversions" className="glass">
                          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Conversões</CardTitle>
                            <Target className="h-4 w-4 text-muted-foreground" />
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold">{campaign.conversions}</div>
                            <p className="text-xs text-muted-foreground">
                              Taxa: {campaign.clicks > 0 ? ((campaign.conversions / campaign.clicks) * 100).toFixed(2) : '0'}%
                            </p>
                          </CardContent>
                        </Card>,
                        <Card key="roi" className="glass">
                          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">ROI</CardTitle>
                            <Percent className="h-4 w-4 text-muted-foreground" />
                          </CardHeader>
                          <CardContent>
                            <div className={`text-2xl font-bold ${(campaign.revenue - campaign.spent) >= 0 ? 'text-success' : 'text-destructive'}`}>
                              {campaign.spent > 0 ? (((campaign.revenue - campaign.spent) / campaign.spent) * 100).toFixed(1) : '0'}%
                            </div>
                            <p className="text-xs text-muted-foreground">
                              CPA: R$ {campaign.conversions > 0 ? (campaign.spent / campaign.conversions).toFixed(2) : '0'}
                            </p>
                          </CardContent>
                        </Card>
                      );

                      if (campaign.revenue > 0) {
                        metricsCards.push(
                          <Card key="revenue" className="glass">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                              <CardTitle className="text-sm font-medium">Receita</CardTitle>
                              <DollarSign className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                              <div className="text-2xl font-bold text-success">R$ {campaign.revenue.toFixed(2)}</div>
                              <p className="text-xs text-muted-foreground">
                                Ticket: R$ {campaign.conversions > 0 ? (campaign.revenue / campaign.conversions).toFixed(2) : '0'}
                              </p>
                            </CardContent>
                          </Card>
                        );
                      }
                    }

                    if (['traffic', 'engagement'].includes(campaign.campaign_type) && campaign.engagement_count) {
                      metricsCards.push(
                        <Card key="engagement" className="glass">
                          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Engajamentos</CardTitle>
                            <Target className="h-4 w-4 text-muted-foreground" />
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold">{campaign.engagement_count.toLocaleString()}</div>
                            <p className="text-xs text-muted-foreground">
                              Taxa: {campaign.impressions > 0 ? ((campaign.engagement_count / campaign.impressions) * 100).toFixed(2) : '0'}%
                            </p>
                          </CardContent>
                        </Card>
                      );
                    }

                    if (['reach', 'branding'].includes(campaign.campaign_type)) {
                      if (campaign.reach) {
                        metricsCards.push(
                          <Card key="reach" className="glass">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                              <CardTitle className="text-sm font-medium">Alcance</CardTitle>
                              <Eye className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                              <div className="text-2xl font-bold">{campaign.reach.toLocaleString()}</div>
                            </CardContent>
                          </Card>
                        );
                      }
                      if (campaign.frequency) {
                        metricsCards.push(
                          <Card key="frequency" className="glass">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                              <CardTitle className="text-sm font-medium">Frequência</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="text-2xl font-bold">{campaign.frequency.toFixed(2)}</div>
                              <p className="text-xs text-muted-foreground">Vezes por pessoa</p>
                            </CardContent>
                          </Card>
                        );
                      }
                      if (campaign.qualified_reach) {
                        metricsCards.push(
                          <Card key="qualified_reach" className="glass">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                              <CardTitle className="text-sm font-medium">Alcance Qualificado</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="text-2xl font-bold">{campaign.qualified_reach.toLocaleString()}</div>
                              <p className="text-xs text-muted-foreground">
                                {campaign.reach ? ((campaign.qualified_reach / campaign.reach) * 100).toFixed(1) : '0'}% do alcance
                              </p>
                            </CardContent>
                          </Card>
                        );
                      }
                      if (campaign.brand_recall) {
                        metricsCards.push(
                          <Card key="brand_recall" className="glass">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                              <CardTitle className="text-sm font-medium">Recall de Marca</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="text-2xl font-bold">{campaign.brand_recall.toFixed(1)}%</div>
                            </CardContent>
                          </Card>
                        );
                      }
                    }

                    if (campaign.campaign_type === 'video') {
                      if (campaign.video_views) {
                        metricsCards.push(
                          <Card key="video_views" className="glass">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                              <CardTitle className="text-sm font-medium">Visualizações</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="text-2xl font-bold">{campaign.video_views.toLocaleString()}</div>
                              <p className="text-xs text-muted-foreground">
                                CPV: R$ {campaign.video_views > 0 ? (campaign.spent / campaign.video_views).toFixed(2) : '0'}
                              </p>
                            </CardContent>
                          </Card>
                        );
                      }
                      if (campaign.video_watch_time) {
                        metricsCards.push(
                          <Card key="watch_time" className="glass">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                              <CardTitle className="text-sm font-medium">Tempo Total</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="text-2xl font-bold">{(campaign.video_watch_time / 60).toFixed(0)}min</div>
                              <p className="text-xs text-muted-foreground">
                                Média: {campaign.video_views ? (campaign.video_watch_time / campaign.video_views).toFixed(0) : '0'}s por view
                              </p>
                            </CardContent>
                          </Card>
                        );
                      }
                    }

                    if (campaign.campaign_type === 'leads' && campaign.leads_generated) {
                      metricsCards.push(
                        <Card key="leads" className="glass">
                          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Leads Gerados</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold">{campaign.leads_generated.toLocaleString()}</div>
                            <p className="text-xs text-muted-foreground">
                              CPL: R$ {campaign.leads_generated > 0 ? (campaign.spent / campaign.leads_generated).toFixed(2) : '0'}
                            </p>
                          </CardContent>
                        </Card>
                      );
                    }

                    if (campaign.campaign_type === 'messages') {
                      if (campaign.messages_count) {
                        metricsCards.push(
                          <Card key="messages" className="glass">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                              <CardTitle className="text-sm font-medium">Mensagens</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="text-2xl font-bold">{campaign.messages_count.toLocaleString()}</div>
                              <p className="text-xs text-muted-foreground">
                                Custo/msg: R$ {campaign.messages_count > 0 ? (campaign.spent / campaign.messages_count).toFixed(2) : '0'}
                              </p>
                            </CardContent>
                          </Card>
                        );
                      }
                      if (campaign.response_rate) {
                        metricsCards.push(
                          <Card key="response_rate" className="glass">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                              <CardTitle className="text-sm font-medium">Taxa de Resposta</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="text-2xl font-bold">{campaign.response_rate.toFixed(1)}%</div>
                            </CardContent>
                          </Card>
                        );
                      }
                    }

                    if (campaign.campaign_type === 'catalog' && campaign.catalog_sales) {
                      metricsCards.push(
                        <Card key="catalog_sales" className="glass">
                          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Vendas Catálogo</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold">{campaign.catalog_sales.toLocaleString()}</div>
                          </CardContent>
                        </Card>
                      );
                    }

                    if (campaign.campaign_type === 'remarketing' && campaign.recovery_rate) {
                      metricsCards.push(
                        <Card key="recovery" className="glass">
                          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Taxa de Recuperação</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold">{campaign.recovery_rate.toFixed(1)}%</div>
                          </CardContent>
                        </Card>
                      );
                    }

                    if (campaign.campaign_type === 'followers' && campaign.followers_gained) {
                      metricsCards.push(
                        <Card key="followers" className="glass">
                          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Seguidores Ganhos</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold">{campaign.followers_gained.toLocaleString()}</div>
                            <p className="text-xs text-muted-foreground">
                              Custo/seguidor: R$ {campaign.followers_gained > 0 ? (campaign.spent / campaign.followers_gained).toFixed(2) : '0'}
                            </p>
                          </CardContent>
                        </Card>
                      );
                    }

                    if (campaign.campaign_type === 'app_install') {
                      if (campaign.app_installs) {
                        metricsCards.push(
                          <Card key="app_installs" className="glass">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                              <CardTitle className="text-sm font-medium">Instalações</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="text-2xl font-bold">{campaign.app_installs.toLocaleString()}</div>
                              <p className="text-xs text-muted-foreground">
                                CPI: R$ {campaign.app_installs > 0 ? (campaign.spent / campaign.app_installs).toFixed(2) : '0'}
                              </p>
                            </CardContent>
                          </Card>
                        );
                      }
                      if (campaign.retention_rate) {
                        metricsCards.push(
                          <Card key="retention" className="glass">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                              <CardTitle className="text-sm font-medium">Retenção</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="text-2xl font-bold">{campaign.retention_rate.toFixed(1)}%</div>
                            </CardContent>
                          </Card>
                        );
                      }
                    }

                    if (campaign.campaign_type === 'custom_conversion' && campaign.custom_conversions) {
                      metricsCards.push(
                        <Card key="custom_conversions" className="glass">
                          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Conversões Personalizadas</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold">{campaign.custom_conversions.toLocaleString()}</div>
                          </CardContent>
                        </Card>
                      );
                    }

                    return <>{metricsCards}</>;
                  })()
                ) : (
                  // Métricas gerais
                  <>
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
                        <CardTitle className="text-sm font-medium">Ticket do Produto</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-primary">
                          R$ {totalConversions > 0 ? (totalRevenue / totalConversions).toFixed(2) : '0.00'}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Ticket médio por venda
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
                  </>
                )}
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
                  <CardDescription>Clique em uma campanha para ver seus dados detalhados no dashboard</CardDescription>
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
                        const isSelected = selectedCampaignId === campaign.id;
                        
                        return (
                          <TableRow 
                            key={campaign.id}
                            className={`cursor-pointer transition-colors ${isSelected ? 'bg-primary/10 border-primary' : 'hover:bg-muted/50'}`}
                            onClick={() => setSelectedCampaignId(isSelected ? null : campaign.id)}
                          >
                            <TableCell className="font-medium">
                              {isSelected && '✓ '}{getPlatformIcon(campaign.platform)} {campaign.name}
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
                              <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
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
            <div className="grid gap-2">
              <Label>Caixa para Anúncios (R$) *</Label>
              <Input 
                type="number"
                step="0.01"
                value={clientFormData.cashbox}
                onChange={(e) => setClientFormData({...clientFormData, cashbox: e.target.value})}
                placeholder="0.00"
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
            <div className="grid gap-2">
              <Label>Tipo de Campanha *</Label>
              <Select value={campaignFormData.campaign_type} onValueChange={(value) => setCampaignFormData({...campaignFormData, campaign_type: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="conversion">Conversão</SelectItem>
                  <SelectItem value="traffic">Tráfego</SelectItem>
                  <SelectItem value="engagement">Engajamento</SelectItem>
                  <SelectItem value="reach">Alcance</SelectItem>
                  <SelectItem value="video">Visualização de Vídeo</SelectItem>
                  <SelectItem value="leads">Geração de Leads</SelectItem>
                  <SelectItem value="messages">Mensagens/WhatsApp</SelectItem>
                  <SelectItem value="catalog">Catálogo/Vendas</SelectItem>
                  <SelectItem value="remarketing">Remarketing</SelectItem>
                  <SelectItem value="ab_test">Teste A/B</SelectItem>
                  <SelectItem value="followers">Seguidores</SelectItem>
                  <SelectItem value="app_install">Instalação de App</SelectItem>
                  <SelectItem value="custom_conversion">Conversão Personalizada</SelectItem>
                  <SelectItem value="promotion">Lançamento/Promoção</SelectItem>
                  <SelectItem value="branding">Branding</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {campaignFormData.campaign_type && (
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => handleGenerateScenario('positive')}
                >
                  <Sparkles className="mr-2 h-4 w-4 text-green-500" />
                  Gerar Cenário Positivo
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => handleGenerateScenario('negative')}
                >
                  <TrendingDown className="mr-2 h-4 w-4 text-red-500" />
                  Gerar Cenário Negativo
                </Button>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Data de Início *</Label>
                <Input 
                  type="date"
                  value={campaignFormData.start_date}
                  onChange={(e) => setCampaignFormData({...campaignFormData, start_date: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <Label>Data de Fim</Label>
                <Input 
                  type="date"
                  value={campaignFormData.end_date}
                  onChange={(e) => setCampaignFormData({...campaignFormData, end_date: e.target.value})}
                />
              </div>
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
            
            {/* Campos dinâmicos baseados no tipo de campanha */}
            {(campaignFormData.campaign_type === 'conversion' || campaignFormData.campaign_type === 'catalog' || campaignFormData.campaign_type === 'promotion') && (
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
                  <Label>Ticket do Produto (R$)</Label>
                  <Input 
                    type="number"
                    step="0.01"
                    value={campaignFormData.product_cost}
                    onChange={(e) => setCampaignFormData({...campaignFormData, product_cost: e.target.value})}
                    placeholder="150.00"
                  />
                </div>
              </div>
            )}
            
            {['conversion', 'traffic', 'remarketing', 'ab_test', 'promotion'].includes(campaignFormData.campaign_type) && (
              <div className="grid grid-cols-2 gap-4">
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
              </div>
            )}
            
            {['conversion', 'catalog', 'remarketing', 'ab_test', 'custom_conversion', 'promotion'].includes(campaignFormData.campaign_type) && (
              <div className="grid gap-2">
                <Label>Conversões</Label>
                <Input 
                  type="number"
                  value={campaignFormData.conversions}
                  onChange={(e) => setCampaignFormData({...campaignFormData, conversions: e.target.value})}
                  placeholder="50"
                />
              </div>
            )}
            
            {['engagement', 'traffic'].includes(campaignFormData.campaign_type) && (
              <div className="grid gap-2">
                <Label>Interações/Engajamentos</Label>
                <Input 
                  type="number"
                  value={campaignFormData.engagement_count}
                  onChange={(e) => setCampaignFormData({...campaignFormData, engagement_count: e.target.value})}
                  placeholder="200"
                />
              </div>
            )}
            
            {['reach', 'branding'].includes(campaignFormData.campaign_type) && (
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Alcance</Label>
                  <Input 
                    type="number"
                    value={campaignFormData.reach}
                    onChange={(e) => setCampaignFormData({...campaignFormData, reach: e.target.value})}
                    placeholder="50000"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Frequência</Label>
                  <Input 
                    type="number"
                    step="0.01"
                    value={campaignFormData.frequency}
                    onChange={(e) => setCampaignFormData({...campaignFormData, frequency: e.target.value})}
                    placeholder="2.5"
                  />
                </div>
              </div>
            )}
            
            {campaignFormData.campaign_type === 'video' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Visualizações de Vídeo</Label>
                  <Input 
                    type="number"
                    value={campaignFormData.video_views}
                    onChange={(e) => setCampaignFormData({...campaignFormData, video_views: e.target.value})}
                    placeholder="8000"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Tempo Assistido (segundos)</Label>
                  <Input 
                    type="number"
                    value={campaignFormData.video_watch_time}
                    onChange={(e) => setCampaignFormData({...campaignFormData, video_watch_time: e.target.value})}
                    placeholder="180000"
                  />
                </div>
              </div>
            )}
            
            {campaignFormData.campaign_type === 'leads' && (
              <div className="grid gap-2">
                <Label>Leads Gerados</Label>
                <Input 
                  type="number"
                  value={campaignFormData.leads_generated}
                  onChange={(e) => setCampaignFormData({...campaignFormData, leads_generated: e.target.value})}
                  placeholder="100"
                />
              </div>
            )}
            
            {campaignFormData.campaign_type === 'messages' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Conversas Iniciadas</Label>
                  <Input 
                    type="number"
                    value={campaignFormData.messages_count}
                    onChange={(e) => setCampaignFormData({...campaignFormData, messages_count: e.target.value})}
                    placeholder="150"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Taxa de Resposta (%)</Label>
                  <Input 
                    type="number"
                    step="0.01"
                    value={campaignFormData.response_rate}
                    onChange={(e) => setCampaignFormData({...campaignFormData, response_rate: e.target.value})}
                    placeholder="85.50"
                  />
                </div>
              </div>
            )}
            
            {campaignFormData.campaign_type === 'catalog' && (
              <div className="grid gap-2">
                <Label>Vendas de Catálogo</Label>
                <Input 
                  type="number"
                  value={campaignFormData.catalog_sales}
                  onChange={(e) => setCampaignFormData({...campaignFormData, catalog_sales: e.target.value})}
                  placeholder="75"
                />
              </div>
            )}
            
            {campaignFormData.campaign_type === 'remarketing' && (
              <div className="grid gap-2">
                <Label>Taxa de Recuperação (%)</Label>
                <Input 
                  type="number"
                  step="0.01"
                  value={campaignFormData.recovery_rate}
                  onChange={(e) => setCampaignFormData({...campaignFormData, recovery_rate: e.target.value})}
                  placeholder="15.5"
                />
              </div>
            )}
            
            {campaignFormData.campaign_type === 'followers' && (
              <div className="grid gap-2">
                <Label>Novos Seguidores</Label>
                <Input 
                  type="number"
                  value={campaignFormData.followers_gained}
                  onChange={(e) => setCampaignFormData({...campaignFormData, followers_gained: e.target.value})}
                  placeholder="500"
                />
              </div>
            )}
            
            {campaignFormData.campaign_type === 'app_install' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Instalações de App</Label>
                  <Input 
                    type="number"
                    value={campaignFormData.app_installs}
                    onChange={(e) => setCampaignFormData({...campaignFormData, app_installs: e.target.value})}
                    placeholder="300"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Taxa de Retenção (%)</Label>
                  <Input 
                    type="number"
                    step="0.01"
                    value={campaignFormData.retention_rate}
                    onChange={(e) => setCampaignFormData({...campaignFormData, retention_rate: e.target.value})}
                    placeholder="45.5"
                  />
                </div>
              </div>
            )}
            
            {campaignFormData.campaign_type === 'custom_conversion' && (
              <div className="grid gap-2">
                <Label>Conversões Personalizadas</Label>
                <Input 
                  type="number"
                  value={campaignFormData.custom_conversions}
                  onChange={(e) => setCampaignFormData({...campaignFormData, custom_conversions: e.target.value})}
                  placeholder="120"
                />
              </div>
            )}
            
            {campaignFormData.campaign_type === 'branding' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Alcance Qualificado</Label>
                  <Input 
                    type="number"
                    value={campaignFormData.qualified_reach}
                    onChange={(e) => setCampaignFormData({...campaignFormData, qualified_reach: e.target.value})}
                    placeholder="30000"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Recall da Marca (%)</Label>
                  <Input 
                    type="number"
                    step="0.01"
                    value={campaignFormData.brand_recall}
                    onChange={(e) => setCampaignFormData({...campaignFormData, brand_recall: e.target.value})}
                    placeholder="65.5"
                  />
                </div>
              </div>
            )}
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
            <div className="grid gap-2">
              <Label>Tipo de Campanha *</Label>
              <Select value={campaignFormData.campaign_type} onValueChange={(value) => setCampaignFormData({...campaignFormData, campaign_type: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="conversion">Conversão</SelectItem>
                  <SelectItem value="traffic">Tráfego</SelectItem>
                  <SelectItem value="engagement">Engajamento</SelectItem>
                  <SelectItem value="reach">Alcance</SelectItem>
                  <SelectItem value="video">Visualização de Vídeo</SelectItem>
                  <SelectItem value="leads">Geração de Leads</SelectItem>
                  <SelectItem value="messages">Mensagens/WhatsApp</SelectItem>
                  <SelectItem value="catalog">Catálogo/Vendas</SelectItem>
                  <SelectItem value="remarketing">Remarketing</SelectItem>
                  <SelectItem value="ab_test">Teste A/B</SelectItem>
                  <SelectItem value="followers">Seguidores</SelectItem>
                  <SelectItem value="app_install">Instalação de App</SelectItem>
                  <SelectItem value="custom_conversion">Conversão Personalizada</SelectItem>
                  <SelectItem value="promotion">Lançamento/Promoção</SelectItem>
                  <SelectItem value="branding">Branding</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Data de Início</Label>
                <Input 
                  type="date"
                  value={campaignFormData.start_date}
                  onChange={(e) => setCampaignFormData({...campaignFormData, start_date: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <Label>Data de Fim</Label>
                <Input 
                  type="date"
                  value={campaignFormData.end_date}
                  onChange={(e) => setCampaignFormData({...campaignFormData, end_date: e.target.value})}
                />
              </div>
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
            
            {/* Campos dinâmicos baseados no tipo de campanha - mesma lógica do Add Dialog */}
            {(campaignFormData.campaign_type === 'conversion' || campaignFormData.campaign_type === 'catalog' || campaignFormData.campaign_type === 'promotion') && (
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Quanto Faturei (R$)</Label>
                  <Input 
                    type="number"
                    step="0.01"
                    value={campaignFormData.revenue}
                    onChange={(e) => setCampaignFormData({...campaignFormData, revenue: e.target.value})}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Ticket do Produto (R$)</Label>
                  <Input 
                    type="number"
                    step="0.01"
                    value={campaignFormData.product_cost}
                    onChange={(e) => setCampaignFormData({...campaignFormData, product_cost: e.target.value})}
                  />
                </div>
              </div>
            )}
            
            {['conversion', 'traffic', 'remarketing', 'ab_test', 'promotion'].includes(campaignFormData.campaign_type) && (
              <div className="grid grid-cols-2 gap-4">
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
              </div>
            )}
            
            {['conversion', 'catalog', 'remarketing', 'ab_test', 'custom_conversion', 'promotion'].includes(campaignFormData.campaign_type) && (
              <div className="grid gap-2">
                <Label>Conversões</Label>
                <Input 
                  type="number"
                  value={campaignFormData.conversions}
                  onChange={(e) => setCampaignFormData({...campaignFormData, conversions: e.target.value})}
                />
              </div>
            )}
            
            {['engagement', 'traffic'].includes(campaignFormData.campaign_type) && (
              <div className="grid gap-2">
                <Label>Interações/Engajamentos</Label>
                <Input 
                  type="number"
                  value={campaignFormData.engagement_count}
                  onChange={(e) => setCampaignFormData({...campaignFormData, engagement_count: e.target.value})}
                />
              </div>
            )}
            
            {['reach', 'branding'].includes(campaignFormData.campaign_type) && (
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Alcance</Label>
                  <Input 
                    type="number"
                    value={campaignFormData.reach}
                    onChange={(e) => setCampaignFormData({...campaignFormData, reach: e.target.value})}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Frequência</Label>
                  <Input 
                    type="number"
                    step="0.01"
                    value={campaignFormData.frequency}
                    onChange={(e) => setCampaignFormData({...campaignFormData, frequency: e.target.value})}
                  />
                </div>
              </div>
            )}
            
            {campaignFormData.campaign_type === 'video' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Visualizações de Vídeo</Label>
                  <Input 
                    type="number"
                    value={campaignFormData.video_views}
                    onChange={(e) => setCampaignFormData({...campaignFormData, video_views: e.target.value})}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Tempo Assistido (segundos)</Label>
                  <Input 
                    type="number"
                    value={campaignFormData.video_watch_time}
                    onChange={(e) => setCampaignFormData({...campaignFormData, video_watch_time: e.target.value})}
                  />
                </div>
              </div>
            )}
            
            {campaignFormData.campaign_type === 'leads' && (
              <div className="grid gap-2">
                <Label>Leads Gerados</Label>
                <Input 
                  type="number"
                  value={campaignFormData.leads_generated}
                  onChange={(e) => setCampaignFormData({...campaignFormData, leads_generated: e.target.value})}
                />
              </div>
            )}
            
            {campaignFormData.campaign_type === 'messages' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Conversas Iniciadas</Label>
                  <Input 
                    type="number"
                    value={campaignFormData.messages_count}
                    onChange={(e) => setCampaignFormData({...campaignFormData, messages_count: e.target.value})}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Taxa de Resposta (%)</Label>
                  <Input 
                    type="number"
                    step="0.01"
                    value={campaignFormData.response_rate}
                    onChange={(e) => setCampaignFormData({...campaignFormData, response_rate: e.target.value})}
                  />
                </div>
              </div>
            )}
            
            {campaignFormData.campaign_type === 'catalog' && (
              <div className="grid gap-2">
                <Label>Vendas de Catálogo</Label>
                <Input 
                  type="number"
                  value={campaignFormData.catalog_sales}
                  onChange={(e) => setCampaignFormData({...campaignFormData, catalog_sales: e.target.value})}
                />
              </div>
            )}
            
            {campaignFormData.campaign_type === 'remarketing' && (
              <div className="grid gap-2">
                <Label>Taxa de Recuperação (%)</Label>
                <Input 
                  type="number"
                  step="0.01"
                  value={campaignFormData.recovery_rate}
                  onChange={(e) => setCampaignFormData({...campaignFormData, recovery_rate: e.target.value})}
                />
              </div>
            )}
            
            {campaignFormData.campaign_type === 'followers' && (
              <div className="grid gap-2">
                <Label>Novos Seguidores</Label>
                <Input 
                  type="number"
                  value={campaignFormData.followers_gained}
                  onChange={(e) => setCampaignFormData({...campaignFormData, followers_gained: e.target.value})}
                />
              </div>
            )}
            
            {campaignFormData.campaign_type === 'app_install' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Instalações de App</Label>
                  <Input 
                    type="number"
                    value={campaignFormData.app_installs}
                    onChange={(e) => setCampaignFormData({...campaignFormData, app_installs: e.target.value})}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Taxa de Retenção (%)</Label>
                  <Input 
                    type="number"
                    step="0.01"
                    value={campaignFormData.retention_rate}
                    onChange={(e) => setCampaignFormData({...campaignFormData, retention_rate: e.target.value})}
                  />
                </div>
              </div>
            )}
            
            {campaignFormData.campaign_type === 'custom_conversion' && (
              <div className="grid gap-2">
                <Label>Conversões Personalizadas</Label>
                <Input 
                  type="number"
                  value={campaignFormData.custom_conversions}
                  onChange={(e) => setCampaignFormData({...campaignFormData, custom_conversions: e.target.value})}
                />
              </div>
            )}
            
            {campaignFormData.campaign_type === 'branding' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Alcance Qualificado</Label>
                  <Input 
                    type="number"
                    value={campaignFormData.qualified_reach}
                    onChange={(e) => setCampaignFormData({...campaignFormData, qualified_reach: e.target.value})}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Recall da Marca (%)</Label>
                  <Input 
                    type="number"
                    step="0.01"
                    value={campaignFormData.brand_recall}
                    onChange={(e) => setCampaignFormData({...campaignFormData, brand_recall: e.target.value})}
                  />
                </div>
              </div>
            )}
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

      {/* Edit Client Dialog */}
      <Dialog open={isEditClientDialogOpen} onOpenChange={setIsEditClientDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Cliente</DialogTitle>
            <DialogDescription>Atualize as informações do cliente</DialogDescription>
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
            <div className="grid gap-2">
              <Label>Caixa para Anúncios (R$) *</Label>
              <Input 
                type="number"
                step="0.01"
                value={clientFormData.cashbox}
                onChange={(e) => setClientFormData({...clientFormData, cashbox: e.target.value})}
                placeholder="0.00"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditClientDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEditClient} className="gradient-primary">
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};