import { useState, useEffect, useRef } from "react";
import html2canvas from "html2canvas";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
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
  Sparkles,
  ArrowLeft,
  ArrowRight,
  User,
  Briefcase,
  Share2,
  Copy,
  Check,
  Download,
  ExternalLink,
  History,
  Wallet,
  Megaphone
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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

interface TeamContext {
  adminUserId: string;
  allowedIds: string[];
}

interface AdsManagementPanelProps {
  teamContext?: TeamContext;
}

interface ExistingCustomer {
  id: string;
  name: string;
  email?: string;
  company?: string;
}

interface ExistingBusiness {
  id: string;
  name: string;
  company_name?: string;
  logo_url?: string;
}

export const AdsManagementPanel = ({ teamContext }: AdsManagementPanelProps) => {
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
  const [viewMode, setViewMode] = useState<'selection' | 'management'>('selection');
  const [activeClientId, setActiveClientId] = useState<string | null>(null);
  const [copiedCampaignId, setCopiedCampaignId] = useState<string | null>(null);
  const [copiedClientId, setCopiedClientId] = useState<string | null>(null);
  const [isDownloadingImage, setIsDownloadingImage] = useState(false);
  const dashboardRef = useRef<HTMLDivElement>(null);
  const [clientFormData, setClientFormData] = useState({
    name: '',
    client_type: 'personal' as 'personal' | 'company',
    description: '',
    cashbox: ''
  });
  
  const [isEditClientDialogOpen, setIsEditClientDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<AdClient | null>(null);
  
  // New states for linking existing entities
  const [addClientMode, setAddClientMode] = useState<'new' | 'existing_customer' | 'existing_business'>('new');
  const [existingCustomers, setExistingCustomers] = useState<ExistingCustomer[]>([]);
  const [existingBusinesses, setExistingBusinesses] = useState<ExistingBusiness[]>([]);
  const [selectedExistingCustomerId, setSelectedExistingCustomerId] = useState<string>('');
  const [selectedExistingBusinessId, setSelectedExistingBusinessId] = useState<string>('');

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

  // Helper to get the correct user ID (admin's ID when team member)
  const getTargetUserId = async (): Promise<string | null> => {
    if (teamContext?.adminUserId) {
      return teamContext.adminUserId;
    }
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id || null;
  };

  useEffect(() => {
    loadData();
  }, [teamContext]);

  const loadData = async () => {
    try {
      const userId = await getTargetUserId();
      if (!userId) return;

      // Load clients
      let clientsQuery = supabase
        .from('ad_clients')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

      const { data: clientsData, error: clientsError } = await clientsQuery;

      if (clientsError) throw clientsError;
      setClients((clientsData || []) as AdClient[]);

      // Load campaigns
      let campaignsQuery = supabase
        .from('ad_campaigns')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

      // If team member with restrictions, filter by allowed campaign IDs
      if (teamContext?.allowedIds && teamContext.allowedIds.length > 0) {
        campaignsQuery = campaignsQuery.in('id', teamContext.allowedIds);
      }

      const { data: campaignsData, error: campaignsError } = await campaignsQuery;

      if (campaignsError) throw campaignsError;
      setCampaigns((campaignsData || []) as AdCampaign[]);
    } catch (error: any) {
      toast.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  };

  const loadExistingEntities = async () => {
    try {
      const userId = await getTargetUserId();
      if (!userId) return;

      // Load existing customers
      const { data: customersData } = await supabase
        .from('customers')
        .select('id, name, email, company')
        .eq('user_id', userId)
        .order('name');
      
      setExistingCustomers((customersData || []) as ExistingCustomer[]);

      // Load existing businesses
      const { data: businessesData } = await supabase
        .from('businesses')
        .select('id, name, company_name, logo_url')
        .eq('user_id', userId)
        .order('name');
      
      setExistingBusinesses((businessesData || []) as ExistingBusiness[]);
    } catch (error) {
      console.error('Error loading existing entities:', error);
    }
  };

  // Load existing entities when dialog opens
  useEffect(() => {
    if (isAddClientDialogOpen) {
      loadExistingEntities();
    }
  }, [isAddClientDialogOpen]);

  const handleDownloadImage = async () => {
    if (!dashboardRef.current) return;
    
    setIsDownloadingImage(true);
    try {
      const canvas = await html2canvas(dashboardRef.current, {
        backgroundColor: null,
        scale: 2,
        useCORS: true,
        logging: false
      });
      
      const link = document.createElement('a');
      link.download = `dashboard-campanha-${selectedCampaignId ? campaigns.find(c => c.id === selectedCampaignId)?.name || 'geral' : 'geral'}-${new Date().toISOString().split('T')[0]}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      
      toast.success('Imagem baixada com sucesso!');
    } catch (error) {
      console.error('Erro ao gerar imagem:', error);
      toast.error('Erro ao gerar imagem');
    } finally {
      setIsDownloadingImage(false);
    }
  };

  const handleAddClient = async () => {
    try {
      const userId = await getTargetUserId();
      if (!userId) return;

      if (!clientFormData.name) {
        toast.error("Preencha o nome do cliente");
        return;
      }

      const { error } = await supabase
        .from('ad_clients')
        .insert([{
          user_id: userId,
          name: clientFormData.name,
          client_type: clientFormData.client_type,
          description: clientFormData.description || null,
          cashbox: parseFloat(clientFormData.cashbox) || 0
        }]);

      if (error) throw error;

      toast.success("Cliente adicionado com sucesso!");
      setIsAddClientDialogOpen(false);
      loadData();
      resetClientDialog();
    } catch (error: any) {
      toast.error("Erro ao adicionar cliente");
    }
  };

  const handleAddFromExistingCustomer = async () => {
    try {
      const userId = await getTargetUserId();
      if (!userId || !selectedExistingCustomerId) return;

      const customer = existingCustomers.find(c => c.id === selectedExistingCustomerId);
      if (!customer) return;

      const { error } = await supabase
        .from('ad_clients')
        .insert([{
          user_id: userId,
          name: customer.name,
          client_type: 'personal',
          description: customer.company || customer.email || null,
          cashbox: parseFloat(clientFormData.cashbox) || 0
        }]);

      if (error) throw error;

      toast.success("Cliente vinculado com sucesso!");
      setIsAddClientDialogOpen(false);
      loadData();
      resetClientDialog();
    } catch (error: any) {
      toast.error("Erro ao vincular cliente");
    }
  };

  const handleAddFromExistingBusiness = async () => {
    try {
      const userId = await getTargetUserId();
      if (!userId || !selectedExistingBusinessId) return;

      const business = existingBusinesses.find(b => b.id === selectedExistingBusinessId);
      if (!business) return;

      const { error } = await supabase
        .from('ad_clients')
        .insert([{
          user_id: userId,
          name: business.name,
          client_type: 'company',
          description: business.company_name || null,
          cashbox: parseFloat(clientFormData.cashbox) || 0
        }]);

      if (error) throw error;

      toast.success("Negócio vinculado com sucesso!");
      setIsAddClientDialogOpen(false);
      loadData();
      resetClientDialog();
    } catch (error: any) {
      toast.error("Erro ao vincular negócio");
    }
  };

  const resetClientDialog = () => {
    setClientFormData({
      name: '',
      client_type: 'personal',
      description: '',
      cashbox: ''
    });
    setAddClientMode('new');
    setSelectedExistingCustomerId('');
    setSelectedExistingBusinessId('');
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
      const userId = await getTargetUserId();
      if (!userId) return;

      if (!campaignFormData.name || !campaignFormData.budget || !campaignFormData.spent || !campaignFormData.client_id) {
        toast.error("Preencha os campos obrigatórios");
        return;
      }

      const { error } = await supabase
        .from('ad_campaigns')
        .insert([{
          user_id: userId,
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

    const ctr = campaign.impressions > 0 ? (campaign.clicks / campaign.impressions) * 100 : 0;
    const campaignROI = campaign.spent > 0 ? ((campaign.revenue - campaign.spent) / campaign.spent) * 100 : 0;

    // Métricas específicas por tipo de campanha (prioridade)
    switch (campaign.campaign_type) {
      case 'engagement':
        if (campaign.engagement_count && campaign.impressions) {
          const engRate = (campaign.engagement_count / campaign.impressions) * 100;
          if (engRate > 10) { score += 3; metrics.push(`✅ Taxa de engajamento excelente (${engRate.toFixed(2)}%)`); }
          else if (engRate > 5) { score += 2; metrics.push(`✓ Taxa de engajamento boa (${engRate.toFixed(2)}%)`); }
          else if (engRate > 2) { score += 1; metrics.push(`⚠️ Taxa de engajamento baixa (${engRate.toFixed(2)}%)`); }
          else { metrics.push(`❌ Taxa de engajamento muito baixa (${engRate.toFixed(2)}%)`); }
          maxScore += 3;
        }
        if (campaign.engagement_cost) {
          if (campaign.engagement_cost < 0.10) { score += 2; metrics.push(`✅ Custo por engajamento ótimo (R$ ${campaign.engagement_cost.toFixed(2)})`); }
          else if (campaign.engagement_cost < 0.30) { score += 1; metrics.push(`✓ Custo por engajamento razoável (R$ ${campaign.engagement_cost.toFixed(2)})`); }
          else { metrics.push(`⚠️ Custo por engajamento alto (R$ ${campaign.engagement_cost.toFixed(2)})`); }
          maxScore += 2;
        }
        if (campaign.engagement_count) {
          metrics.push(`📊 Total de engajamentos: ${campaign.engagement_count.toLocaleString()}`);
        }
        // CTR como métrica secundária
        if (ctr > 2) { score += 1; metrics.push(`✅ CTR bom (${ctr.toFixed(2)}%)`); }
        else if (ctr > 1) { metrics.push(`✓ CTR razoável (${ctr.toFixed(2)}%)`); }
        maxScore += 1;
        break;

      case 'video':
        if (campaign.video_views) {
          const viewRate = campaign.impressions > 0 ? (campaign.video_views / campaign.impressions) * 100 : 0;
          if (viewRate > 30) { score += 2; metrics.push(`✅ Taxa de visualização excelente (${viewRate.toFixed(1)}%)`); }
          else if (viewRate > 15) { score += 1; metrics.push(`✓ Taxa de visualização razoável (${viewRate.toFixed(1)}%)`); }
          else { metrics.push(`⚠️ Taxa de visualização baixa (${viewRate.toFixed(1)}%)`); }
          maxScore += 2;
          metrics.push(`📊 Total de views: ${campaign.video_views.toLocaleString()}`);
        }
        if (campaign.video_views && campaign.video_watch_time) {
          const avgWatchTime = campaign.video_watch_time / campaign.video_views;
          if (avgWatchTime > 30) { score += 2; metrics.push(`✅ Tempo médio de visualização excelente (${avgWatchTime.toFixed(0)}s)`); }
          else if (avgWatchTime > 15) { score += 1; metrics.push(`✓ Tempo médio razoável (${avgWatchTime.toFixed(0)}s)`); }
          else { metrics.push(`⚠️ Tempo médio baixo (${avgWatchTime.toFixed(0)}s)`); }
          maxScore += 2;
        }
        if (campaign.cpv) {
          if (campaign.cpv < 0.05) { score += 2; metrics.push(`✅ CPV excelente (R$ ${campaign.cpv.toFixed(3)})`); }
          else if (campaign.cpv < 0.10) { score += 1; metrics.push(`✓ CPV razoável (R$ ${campaign.cpv.toFixed(3)})`); }
          else { metrics.push(`⚠️ CPV alto (R$ ${campaign.cpv.toFixed(3)})`); }
          maxScore += 2;
        }
        break;

      case 'reach':
      case 'branding':
        if (campaign.reach) {
          const reachRate = campaign.impressions > 0 ? (campaign.reach / campaign.impressions) * 100 : 0;
          metrics.push(`📊 Alcance total: ${campaign.reach.toLocaleString()}`);
          if (reachRate > 70) { score += 2; metrics.push(`✅ Eficiência de alcance excelente (${reachRate.toFixed(1)}%)`); }
          else if (reachRate > 50) { score += 1; metrics.push(`✓ Eficiência de alcance boa (${reachRate.toFixed(1)}%)`); }
          maxScore += 2;
        }
        if (campaign.cpm) {
          if (campaign.cpm < 10) { score += 2; metrics.push(`✅ CPM excelente (R$ ${campaign.cpm.toFixed(2)})`); }
          else if (campaign.cpm < 25) { score += 1; metrics.push(`✓ CPM razoável (R$ ${campaign.cpm.toFixed(2)})`); }
          else { metrics.push(`⚠️ CPM alto (R$ ${campaign.cpm.toFixed(2)})`); }
          maxScore += 2;
        }
        if (campaign.frequency) {
          if (campaign.frequency < 3) { score += 1; metrics.push(`✅ Frequência saudável (${campaign.frequency.toFixed(2)}x)`); }
          else { metrics.push(`⚠️ Frequência alta (${campaign.frequency.toFixed(2)}x)`); }
          maxScore += 1;
        }
        if (campaign.brand_recall) {
          if (campaign.brand_recall > 40) { score += 2; metrics.push(`✅ Recall de marca excelente (${campaign.brand_recall.toFixed(1)}%)`); }
          else if (campaign.brand_recall > 25) { score += 1; metrics.push(`✓ Recall de marca bom (${campaign.brand_recall.toFixed(1)}%)`); }
          else { metrics.push(`⚠️ Recall de marca baixo (${campaign.brand_recall.toFixed(1)}%)`); }
          maxScore += 2;
        }
        if (campaign.qualified_reach) {
          metrics.push(`📊 Alcance qualificado: ${campaign.qualified_reach.toLocaleString()}`);
        }
        break;

      case 'leads':
        if (campaign.leads_generated) {
          metrics.push(`📊 Leads gerados: ${campaign.leads_generated.toLocaleString()}`);
          if (campaign.cpl) {
            if (campaign.cpl < 5) { score += 3; metrics.push(`✅ CPL excelente (R$ ${campaign.cpl.toFixed(2)})`); }
            else if (campaign.cpl < 15) { score += 2; metrics.push(`✓ CPL bom (R$ ${campaign.cpl.toFixed(2)})`); }
            else if (campaign.cpl < 30) { score += 1; metrics.push(`⚠️ CPL alto (R$ ${campaign.cpl.toFixed(2)})`); }
            else { metrics.push(`❌ CPL muito alto (R$ ${campaign.cpl.toFixed(2)})`); }
            maxScore += 3;
          }
        }
        if (ctr > 2) { score += 1; metrics.push(`✅ CTR bom (${ctr.toFixed(2)}%)`); }
        else if (ctr > 1) { metrics.push(`✓ CTR razoável (${ctr.toFixed(2)}%)`); }
        maxScore += 1;
        break;

      case 'messages':
        if (campaign.messages_count) {
          metrics.push(`📊 Mensagens iniciadas: ${campaign.messages_count.toLocaleString()}`);
        }
        if (campaign.cost_per_message) {
          if (campaign.cost_per_message < 1) { score += 2; metrics.push(`✅ Custo por mensagem ótimo (R$ ${campaign.cost_per_message.toFixed(2)})`); }
          else if (campaign.cost_per_message < 3) { score += 1; metrics.push(`✓ Custo por mensagem razoável (R$ ${campaign.cost_per_message.toFixed(2)})`); }
          else { metrics.push(`⚠️ Custo por mensagem alto (R$ ${campaign.cost_per_message.toFixed(2)})`); }
          maxScore += 2;
        }
        if (campaign.response_rate) {
          if (campaign.response_rate > 60) { score += 2; metrics.push(`✅ Taxa de resposta excelente (${campaign.response_rate.toFixed(1)}%)`); }
          else if (campaign.response_rate > 40) { score += 1; metrics.push(`✓ Taxa de resposta boa (${campaign.response_rate.toFixed(1)}%)`); }
          else { metrics.push(`⚠️ Taxa de resposta baixa (${campaign.response_rate.toFixed(1)}%)`); }
          maxScore += 2;
        }
        break;

      case 'followers':
        if (campaign.followers_gained) {
          metrics.push(`📊 Seguidores ganhos: ${campaign.followers_gained.toLocaleString()}`);
          if (campaign.cost_per_follower) {
            if (campaign.cost_per_follower < 0.50) { score += 3; metrics.push(`✅ Custo por seguidor excelente (R$ ${campaign.cost_per_follower.toFixed(2)})`); }
            else if (campaign.cost_per_follower < 1.50) { score += 2; metrics.push(`✓ Custo por seguidor bom (R$ ${campaign.cost_per_follower.toFixed(2)})`); }
            else { score += 1; metrics.push(`⚠️ Custo por seguidor alto (R$ ${campaign.cost_per_follower.toFixed(2)})`); }
            maxScore += 3;
          }
        }
        break;

      case 'app_install':
        if (campaign.app_installs) {
          metrics.push(`📊 Instalações: ${campaign.app_installs.toLocaleString()}`);
          if (campaign.cpi) {
            if (campaign.cpi < 2) { score += 2; metrics.push(`✅ CPI excelente (R$ ${campaign.cpi.toFixed(2)})`); }
            else if (campaign.cpi < 5) { score += 1; metrics.push(`✓ CPI razoável (R$ ${campaign.cpi.toFixed(2)})`); }
            else { metrics.push(`⚠️ CPI alto (R$ ${campaign.cpi.toFixed(2)})`); }
            maxScore += 2;
          }
        }
        if (campaign.retention_rate) {
          if (campaign.retention_rate > 50) { score += 2; metrics.push(`✅ Retenção excelente (${campaign.retention_rate.toFixed(1)}%)`); }
          else if (campaign.retention_rate > 30) { score += 1; metrics.push(`✓ Retenção razoável (${campaign.retention_rate.toFixed(1)}%)`); }
          else { metrics.push(`⚠️ Retenção baixa (${campaign.retention_rate.toFixed(1)}%)`); }
          maxScore += 2;
        }
        break;

      case 'traffic':
        // CTR é a principal métrica para tráfego
        if (ctr > 3) { score += 3; metrics.push(`✅ CTR excelente (${ctr.toFixed(2)}%)`); }
        else if (ctr > 1.5) { score += 2; metrics.push(`✓ CTR bom (${ctr.toFixed(2)}%)`); }
        else if (ctr > 0.5) { score += 1; metrics.push(`⚠️ CTR baixo (${ctr.toFixed(2)}%)`); }
        else { metrics.push(`❌ CTR muito baixo (${ctr.toFixed(2)}%)`); }
        maxScore += 3;
        {
          const cpc = campaign.clicks > 0 ? campaign.spent / campaign.clicks : 0;
          if (cpc > 0) {
            if (cpc < 0.50) { score += 2; metrics.push(`✅ CPC excelente (R$ ${cpc.toFixed(2)})`); }
            else if (cpc < 1.50) { score += 1; metrics.push(`✓ CPC razoável (R$ ${cpc.toFixed(2)})`); }
            else { metrics.push(`⚠️ CPC alto (R$ ${cpc.toFixed(2)})`); }
            maxScore += 2;
          }
        }
        metrics.push(`📊 Total de cliques: ${campaign.clicks.toLocaleString()}`);
        break;

      // Tipos focados em conversão/financeiro: ROI + CTR + conversão
      case 'conversion':
      case 'catalog':
      case 'promotion':
      case 'remarketing':
      default:
        // ROI
        if (campaignROI > 100) { score += 3; metrics.push(`✅ ROI excelente (${campaignROI.toFixed(0)}%)`); }
        else if (campaignROI > 50) { score += 2; metrics.push(`✓ ROI bom (${campaignROI.toFixed(0)}%)`); }
        else if (campaignROI > 0) { score += 1; metrics.push(`⚠️ ROI positivo mas baixo (${campaignROI.toFixed(0)}%)`); }
        else { metrics.push(`❌ ROI negativo (${campaignROI.toFixed(0)}%)`); }
        maxScore += 3;

        // CTR
        if (ctr > 2) { score += 2; metrics.push(`✅ CTR excelente (${ctr.toFixed(2)}%)`); }
        else if (ctr > 1) { score += 1; metrics.push(`✓ CTR razoável (${ctr.toFixed(2)}%)`); }
        else if (ctr > 0) { metrics.push(`⚠️ CTR baixo (${ctr.toFixed(2)}%)`); }
        else { metrics.push(`❌ CTR muito baixo`); }
        maxScore += 2;

        // Taxa de conversão
        if (campaign.clicks > 0 && campaign.conversions > 0) {
          const convRate = (campaign.conversions / campaign.clicks) * 100;
          if (convRate > 5) { score += 3; metrics.push(`✅ Taxa de conversão excelente (${convRate.toFixed(2)}%)`); }
          else if (convRate > 2) { score += 2; metrics.push(`✓ Taxa de conversão boa (${convRate.toFixed(2)}%)`); }
          else if (convRate > 0.5) { score += 1; metrics.push(`⚠️ Taxa de conversão baixa (${convRate.toFixed(2)}%)`); }
          else { metrics.push(`❌ Taxa de conversão muito baixa (${convRate.toFixed(2)}%)`); }
          maxScore += 3;
        }

        if (campaign.campaign_type === 'catalog' && campaign.catalog_sales) {
          metrics.push(`📊 Vendas do catálogo: ${campaign.catalog_sales.toLocaleString()}`);
        }
        if (campaign.campaign_type === 'remarketing' && campaign.recovery_rate) {
          if (campaign.recovery_rate > 30) { score += 2; metrics.push(`✅ Taxa de recuperação excelente (${campaign.recovery_rate.toFixed(1)}%)`); }
          else if (campaign.recovery_rate > 15) { score += 1; metrics.push(`✓ Taxa de recuperação boa (${campaign.recovery_rate.toFixed(1)}%)`); }
          else { metrics.push(`⚠️ Taxa de recuperação baixa (${campaign.recovery_rate.toFixed(1)}%)`); }
          maxScore += 2;
        }
        break;
    }

    // Se não teve nenhuma métrica específica avaliada (maxScore = 0), usar métricas genéricas como fallback
    if (maxScore === 0) {
      if (campaignROI > 100) { score += 3; metrics.push(`✅ ROI excelente (${campaignROI.toFixed(0)}%)`); }
      else if (campaignROI > 0) { score += 1; metrics.push(`⚠️ ROI baixo (${campaignROI.toFixed(0)}%)`); }
      else { metrics.push(`❌ ROI negativo (${campaignROI.toFixed(0)}%)`); }
      maxScore += 3;
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

  const handleSelectClient = (clientId: string) => {
    setActiveClientId(clientId);
    setSelectedClientId(clientId === 'all' ? 'all' : clientId);
    setViewMode('management');
  };

  const handleBackToSelection = () => {
    setViewMode('selection');
    setActiveClientId(null);
    setSelectedClientId('all');
    setSelectedCampaignId(null);
  };

  const handleCreateClientFromSelector = async (data: { name: string; client_type: 'personal' | 'company'; description: string; cashbox: string }) => {
    try {
      const userId = await getTargetUserId();
      if (!userId) return;

      const { data: newClient, error } = await supabase
        .from('ad_clients')
        .insert([{
          user_id: userId,
          name: data.name,
          client_type: data.client_type,
          description: data.description || null,
          cashbox: parseFloat(data.cashbox) || 0
        }])
        .select()
        .single();

      if (error) throw error;

      toast.success("Cliente criado com sucesso!");
      await loadData();
      
      if (newClient) {
        handleSelectClient(newClient.id);
      }
    } catch (error: any) {
      toast.error("Erro ao criar cliente");
    }
  };

  const activeClient = activeClientId ? clients.find(c => c.id === activeClientId) : null;

  if (loading) {
    return <div className="flex items-center justify-center p-8">Carregando...</div>;
  }

  // Client Selection Screen
  if (viewMode === 'selection') {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight">Gestão de Anúncios</h2>
          <p className="text-muted-foreground mt-2">
            Selecione um cliente para gerenciar suas campanhas de anúncios
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* All Clients Option */}
          <Card 
            className="cursor-pointer hover:border-primary transition-all hover:shadow-md"
            onClick={() => handleSelectClient('all')}
          >
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <BarChart3 className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">Todos os Clientes</CardTitle>
                  <p className="text-sm text-muted-foreground">Ver campanhas de todos</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <Badge variant="secondary">{campaigns.length} campanhas</Badge>
                <ArrowRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          {clients.map((client) => {
            const clientCampaigns = campaigns.filter(c => c.client_id === client.id);
            const clientSpent = clientCampaigns.reduce((sum, c) => sum + c.spent, 0);
            const clientRevenue = clientCampaigns.reduce((sum, c) => sum + (c.revenue || 0), 0);
            const clientProfit = clientRevenue - clientSpent;
            const cashboxAfterSpent = client.cashbox - clientSpent;
            const totalCashbox = client.cashbox - clientSpent + clientRevenue;
            
            return (
              <Card 
                key={client.id}
                className="cursor-pointer hover:border-primary transition-all hover:shadow-md group"
                onClick={() => handleSelectClient(client.id)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                        {client.client_type === 'company' ? (
                          <Building2 className="h-6 w-6 text-primary" />
                        ) : (
                          <User className="h-6 w-6 text-primary" />
                        )}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{client.name}</CardTitle>
                        <Badge variant="outline" className="text-xs">
                          {client.client_type === 'personal' ? 'Pessoal' : 'Empresa'}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Share2 className="h-4 w-4" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80" align="end" onClick={(e) => e.stopPropagation()}>
                          <div className="space-y-3">
                            <h4 className="font-medium text-sm">Compartilhar Campanhas do Cliente</h4>
                            <p className="text-xs text-muted-foreground">
                              Compartilhe um dashboard com todas as campanhas deste cliente
                            </p>
                            <div className="flex gap-2">
                              <Input
                                readOnly
                                value={`${window.location.origin}/cliente-campanhas/${client.id}`}
                                className="text-xs"
                              />
                              <Button
                                size="icon"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigator.clipboard.writeText(`${window.location.origin}/cliente-campanhas/${client.id}`);
                                  setCopiedClientId(client.id);
                                  toast.success("Link copiado!");
                                  setTimeout(() => setCopiedClientId(null), 2000);
                                }}
                              >
                                {copiedClientId === client.id ? (
                                  <Check className="h-4 w-4" />
                                ) : (
                                  <Copy className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                            <Button
                              size="sm"
                              className="w-full"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(`${window.location.origin}/cliente-campanhas/${client.id}`, '_blank');
                              }}
                            >
                              <ExternalLink className="h-4 w-4 mr-2" />
                              Abrir Preview
                            </Button>
                          </div>
                        </PopoverContent>
                      </Popover>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => { e.stopPropagation(); openEditClient(client); }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={(e) => { e.stopPropagation(); setDeleteClientId(client.id); }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Caixa Inicial */}
                  <div className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                    <span className="text-xs text-muted-foreground">💰 Caixa Inicial</span>
                    <span className="font-semibold text-primary">R$ {client.cashbox.toFixed(2)}</span>
                  </div>

                  {/* Grid dos 3 Caixas */}
                  <div className="grid grid-cols-3 gap-1">
                    {/* Caixa 1: Após Gastos */}
                    <div className="p-2 bg-gradient-to-br from-orange-500/10 to-transparent rounded-lg border border-orange-500/20 text-center">
                      <div className="text-[10px] text-muted-foreground">Caixa 1</div>
                      <div className="text-[9px] text-muted-foreground">(Restante)</div>
                      <div className={`text-sm font-bold ${cashboxAfterSpent >= 0 ? 'text-orange-500' : 'text-destructive'}`}>
                        R$ {cashboxAfterSpent.toFixed(2)}
                      </div>
                    </div>

                    {/* Caixa 2: Lucro */}
                    <div className={`p-2 bg-gradient-to-br ${clientProfit >= 0 ? 'from-success/10' : 'from-destructive/10'} to-transparent rounded-lg border ${clientProfit >= 0 ? 'border-success/20' : 'border-destructive/20'} text-center`}>
                      <div className="text-[10px] text-muted-foreground">Caixa 2</div>
                      <div className="text-[9px] text-muted-foreground">(Lucro)</div>
                      <div className={`text-sm font-bold ${clientProfit >= 0 ? 'text-success' : 'text-destructive'}`}>
                        R$ {clientProfit.toFixed(2)}
                      </div>
                    </div>

                    {/* Caixa Total */}
                    <div className={`p-2 bg-gradient-to-br ${totalCashbox >= 0 ? 'from-primary/10' : 'from-destructive/10'} to-transparent rounded-lg border-2 ${totalCashbox >= 0 ? 'border-primary/30' : 'border-destructive/30'} text-center`}>
                      <div className="text-[10px] text-muted-foreground">Total</div>
                      <div className="text-[9px] text-muted-foreground">(1 + 2)</div>
                      <div className={`text-sm font-bold ${totalCashbox >= 0 ? 'text-primary' : 'text-destructive'}`}>
                        R$ {totalCashbox.toFixed(2)}
                      </div>
                    </div>
                  </div>

                  {/* Resumo */}
                  <div className="grid grid-cols-2 gap-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Gasto:</span>
                      <span className="font-medium text-destructive">-R$ {clientSpent.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Faturado:</span>
                      <span className="font-medium text-success">+R$ {clientRevenue.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Histórico breve */}
                  {clientCampaigns.length > 0 && (
                    <Collapsible>
                      <CollapsibleTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full text-xs"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <History className="h-3 w-3 mr-1" />
                          Ver Histórico ({clientCampaigns.length})
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="mt-2" onClick={(e) => e.stopPropagation()}>
                        <div className="space-y-1 max-h-40 overflow-y-auto text-xs">
                          <div className="flex justify-between p-1.5 bg-primary/5 rounded border-l-2 border-primary">
                            <span>💰 Caixa Inicial</span>
                            <span className="font-semibold text-primary">+R$ {client.cashbox.toFixed(2)}</span>
                          </div>
                          {clientCampaigns.slice().sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).map((campaign) => {
                            const profit = (campaign.revenue || 0) - campaign.spent;
                            return (
                              <div key={campaign.id} className={`flex justify-between p-1.5 rounded border-l-2 ${profit >= 0 ? 'bg-success/5 border-success' : 'bg-destructive/5 border-destructive'}`}>
                                <span className="truncate max-w-[140px]">{campaign.name}</span>
                                <span className={`font-semibold ${profit >= 0 ? 'text-success' : 'text-destructive'}`}>
                                  {profit >= 0 ? '+' : ''}R$ {profit.toFixed(2)}
                                </span>
                              </div>
                            );
                          })}
                          <div className={`flex justify-between p-1.5 rounded border-l-2 font-semibold ${totalCashbox >= 0 ? 'bg-primary/10 border-primary' : 'bg-destructive/10 border-destructive'}`}>
                            <span>📊 Caixa Final</span>
                            <span className={totalCashbox >= 0 ? 'text-primary' : 'text-destructive'}>
                              R$ {totalCashbox.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t">
                    <Badge variant="secondary">{clientCampaigns.length} campanhas</Badge>
                    <ArrowRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {/* Create New Client Card */}
          <Card 
            className="cursor-pointer border-dashed hover:border-primary transition-all hover:shadow-md"
            onClick={() => setIsAddClientDialogOpen(true)}
          >
            <CardContent className="flex flex-col items-center justify-center h-full min-h-[200px] py-8">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
                <Plus className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="font-medium">Criar Novo Cliente</p>
              <p className="text-sm text-muted-foreground">Adicionar novo cliente para gestão</p>
            </CardContent>
          </Card>
        </div>

        {/* Add Client Dialog - with options for existing entities */}
        <Dialog open={isAddClientDialogOpen} onOpenChange={(open) => {
          setIsAddClientDialogOpen(open);
          if (!open) resetClientDialog();
        }}>
          <DialogContent className="max-w-2xl sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader className="space-y-2 pb-3 border-b border-border/50">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center shadow-glow shrink-0">
                  <Megaphone className="h-5 w-5 text-primary-foreground" />
                </div>
                <div className="min-w-0">
                  <DialogTitle className="text-xl">Novo Cliente para Anúncios</DialogTitle>
                  <DialogDescription className="text-sm">Crie um novo cliente ou vincule um existente</DialogDescription>
                </div>
              </div>
            </DialogHeader>
            
            {/* Mode Selection Tabs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-4">
              <Button
                variant={addClientMode === 'new' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setAddClientMode('new')}
                className="w-full justify-center"
              >
                <Plus className="h-4 w-4 mr-1.5" />
                Criar Novo
              </Button>
              <Button
                variant={addClientMode === 'existing_customer' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setAddClientMode('existing_customer')}
                className="w-full justify-center"
                disabled={existingCustomers.length === 0}
              >
                <User className="h-4 w-4 mr-1.5" />
                Cliente Existente
              </Button>
              <Button
                variant={addClientMode === 'existing_business' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setAddClientMode('existing_business')}
                className="w-full justify-center"
                disabled={existingBusinesses.length === 0}
              >
                <Building2 className="h-4 w-4 mr-1.5" />
                Negócio Existente
              </Button>
            </div>

            <div className="grid gap-4 py-4">
              {addClientMode === 'new' && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  </div>
                  <div className="grid gap-2">
                    <Label>Descrição</Label>
                    <Input 
                      value={clientFormData.description}
                      onChange={(e) => setClientFormData({...clientFormData, description: e.target.value})}
                      placeholder="Informações adicionais"
                    />
                  </div>
                </>
              )}

              {addClientMode === 'existing_customer' && (
                <div className="grid gap-2">
                  <Label>Selecionar Cliente</Label>
                  <Select value={selectedExistingCustomerId} onValueChange={setSelectedExistingCustomerId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Escolha um cliente cadastrado" />
                    </SelectTrigger>
                    <SelectContent>
                      {existingCustomers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            <span>{customer.name}</span>
                            {customer.company && (
                              <span className="text-muted-foreground text-xs">({customer.company})</span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedExistingCustomerId && (
                    <p className="text-sm text-muted-foreground">
                      O cliente será adicionado como Pessoal
                    </p>
                  )}
                </div>
              )}

              {addClientMode === 'existing_business' && (
                <div className="grid gap-2">
                  <Label>Selecionar Negócio</Label>
                  <Select value={selectedExistingBusinessId} onValueChange={setSelectedExistingBusinessId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Escolha um negócio cadastrado" />
                    </SelectTrigger>
                    <SelectContent>
                      {existingBusinesses.map((business) => (
                        <SelectItem key={business.id} value={business.id}>
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4" />
                            <span>{business.name}</span>
                            {business.company_name && (
                              <span className="text-muted-foreground text-xs">({business.company_name})</span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedExistingBusinessId && (
                    <p className="text-sm text-muted-foreground">
                      O negócio será adicionado como Empresa
                    </p>
                  )}
                </div>
              )}

              <div className="grid gap-2 p-4 rounded-lg bg-muted/30 border border-border/50">
                <Label className="text-base font-semibold">Caixa para Anúncios (R$) *</Label>
                <Input 
                  type="number"
                  step="0.01"
                  value={clientFormData.cashbox}
                  onChange={(e) => setClientFormData({...clientFormData, cashbox: e.target.value})}
                  placeholder="0,00"
                  className="text-lg font-semibold"
                />
                <p className="text-xs text-muted-foreground">Valor inicial disponível para investir em anúncios</p>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setIsAddClientDialogOpen(false);
                resetClientDialog();
              }}>
                Cancelar
              </Button>
              {addClientMode === 'new' && (
                <Button 
                  onClick={() => {
                    handleCreateClientFromSelector({
                      name: clientFormData.name,
                      client_type: clientFormData.client_type,
                      description: clientFormData.description,
                      cashbox: clientFormData.cashbox
                    });
                    resetClientDialog();
                    setIsAddClientDialogOpen(false);
                  }} 
                  className="gradient-primary"
                  disabled={!clientFormData.name.trim()}
                >
                  Criar Cliente
                </Button>
              )}
              {addClientMode === 'existing_customer' && (
                <Button 
                  onClick={handleAddFromExistingCustomer} 
                  className="gradient-primary"
                  disabled={!selectedExistingCustomerId}
                >
                  Vincular Cliente
                </Button>
              )}
              {addClientMode === 'existing_business' && (
                <Button 
                  onClick={handleAddFromExistingBusiness} 
                  className="gradient-primary"
                  disabled={!selectedExistingBusinessId}
                >
                  Vincular Negócio
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Client Dialog */}
        <Dialog open={isEditClientDialogOpen} onOpenChange={setIsEditClientDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Cliente</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Nome *</Label>
                <Input 
                  value={clientFormData.name}
                  onChange={(e) => setClientFormData({...clientFormData, name: e.target.value})}
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
                />
              </div>
              <div className="grid gap-2">
                <Label>Caixa para Anúncios (R$)</Label>
                <Input 
                  type="number"
                  step="0.01"
                  value={clientFormData.cashbox}
                  onChange={(e) => setClientFormData({...clientFormData, cashbox: e.target.value})}
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

        {/* Delete Confirmation Dialog */}
        <DeleteConfirmDialog
          open={!!deleteClientId}
          onOpenChange={(open) => !open && setDeleteClientId(null)}
          onConfirm={handleDeleteClient}
          title="Excluir Cliente?"
          description="Esta ação removerá o cliente e não poderá ser desfeita. As campanhas associadas serão mantidas."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with back button and client info */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={handleBackToSelection}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold">
                {activeClientId === 'all' || !activeClient ? 'Todos os Clientes' : activeClient.name}
              </h2>
              {activeClient && (
                <Badge variant="outline">
                  {activeClient.client_type === 'personal' ? 'Pessoal' : 'Empresa'}
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground">
              Gestão de campanhas de anúncios
            </p>
          </div>
        </div>
      </div>
      
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
                      <div className="flex gap-1">
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="ghost" size="icon" title="Compartilhar campanhas">
                              <Share2 className="h-4 w-4" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-80" align="end">
                            <div className="space-y-3">
                              <h4 className="font-medium text-sm">Compartilhar Campanhas</h4>
                              <p className="text-xs text-muted-foreground">
                                Compartilhe um dashboard com todas as campanhas deste cliente
                              </p>
                              <div className="flex gap-2">
                                <Input
                                  readOnly
                                  value={`${window.location.origin}/cliente-campanhas/${client.id}`}
                                  className="text-xs"
                                />
                                <Button
                                  size="icon"
                                  variant="outline"
                                  onClick={() => {
                                    navigator.clipboard.writeText(`${window.location.origin}/cliente-campanhas/${client.id}`);
                                    setCopiedClientId(client.id);
                                    toast.success("Link copiado!");
                                    setTimeout(() => setCopiedClientId(null), 2000);
                                  }}
                                >
                                  {copiedClientId === client.id ? (
                                    <Check className="h-4 w-4" />
                                  ) : (
                                    <Copy className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>
                              <Button
                                size="sm"
                                className="w-full"
                                variant="outline"
                                onClick={() => window.open(`${window.location.origin}/cliente-campanhas/${client.id}`, '_blank')}
                              >
                                <ExternalLink className="h-4 w-4 mr-2" />
                                Abrir Preview
                              </Button>
                            </div>
                          </PopoverContent>
                        </Popover>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteClientId(client.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                    {client.description && (
                      <p className="text-sm text-muted-foreground mt-2">{client.description}</p>
                    )}
                  </CardHeader>
                   <CardContent>
                    <div className="space-y-3">
                      {/* Caixa Inicial */}
                      <div className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                        <span className="text-xs text-muted-foreground">💰 Caixa Inicial</span>
                        <span className="font-semibold text-primary">R$ {client.cashbox.toFixed(2)}</span>
                      </div>

                      {/* Grid dos 3 Caixas */}
                      <div className="grid grid-cols-3 gap-1">
                        {/* Caixa 1: Após Gastos */}
                        <div className="p-2 bg-gradient-to-br from-orange-500/10 to-transparent rounded-lg border border-orange-500/20 text-center">
                          <div className="text-[10px] text-muted-foreground">Caixa 1</div>
                          <div className="text-[9px] text-muted-foreground">(Restante)</div>
                          <div className={`text-sm font-bold ${(client.cashbox - clientSpent) >= 0 ? 'text-orange-500' : 'text-destructive'}`}>
                            R$ {(client.cashbox - clientSpent).toFixed(2)}
                          </div>
                        </div>

                        {/* Caixa 2: Lucro */}
                        <div className={`p-2 bg-gradient-to-br ${clientProfit >= 0 ? 'from-success/10' : 'from-destructive/10'} to-transparent rounded-lg border ${clientProfit >= 0 ? 'border-success/20' : 'border-destructive/20'} text-center`}>
                          <div className="text-[10px] text-muted-foreground">Caixa 2</div>
                          <div className="text-[9px] text-muted-foreground">(Lucro)</div>
                          <div className={`text-sm font-bold ${clientProfit >= 0 ? 'text-success' : 'text-destructive'}`}>
                            R$ {clientProfit.toFixed(2)}
                          </div>
                        </div>

                        {/* Caixa Total */}
                        <div className={`p-2 bg-gradient-to-br ${totalCashbox >= 0 ? 'from-primary/10' : 'from-destructive/10'} to-transparent rounded-lg border-2 ${totalCashbox >= 0 ? 'border-primary/30' : 'border-destructive/30'} text-center`}>
                          <div className="text-[10px] text-muted-foreground">Total</div>
                          <div className="text-[9px] text-muted-foreground">(1 + 2)</div>
                          <div className={`text-sm font-bold ${totalCashbox >= 0 ? 'text-primary' : 'text-destructive'}`}>
                            R$ {totalCashbox.toFixed(2)}
                          </div>
                        </div>
                      </div>

                      {/* Resumo */}
                      <div className="grid grid-cols-2 gap-1 text-xs">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Campanhas:</span>
                          <span className="font-medium">{clientCampaigns.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Gasto:</span>
                          <span className="font-medium text-destructive">-R$ {clientSpent.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Faturado:</span>
                          <span className="font-medium text-success">+R$ {clientRevenue.toFixed(2)}</span>
                        </div>
                      </div>

                      {/* Histórico breve */}
                      {clientCampaigns.length > 0 && (
                        <Collapsible>
                          <CollapsibleTrigger asChild>
                            <Button variant="outline" size="sm" className="w-full text-xs">
                              <History className="h-3 w-3 mr-1" />
                              Ver Histórico ({clientCampaigns.length})
                            </Button>
                          </CollapsibleTrigger>
                          <CollapsibleContent className="mt-2">
                            <div className="space-y-1 max-h-40 overflow-y-auto text-xs">
                              <div className="flex justify-between p-1.5 bg-primary/5 rounded border-l-2 border-primary">
                                <span>💰 Caixa Inicial</span>
                                <span className="font-semibold text-primary">+R$ {client.cashbox.toFixed(2)}</span>
                              </div>
                              {clientCampaigns.slice().sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).map((campaign, idx) => {
                                const profit = (campaign.revenue || 0) - campaign.spent;
                                return (
                                  <div key={campaign.id} className={`flex justify-between p-1.5 rounded border-l-2 ${profit >= 0 ? 'bg-success/5 border-success' : 'bg-destructive/5 border-destructive'}`}>
                                    <span className="truncate max-w-[140px]">{campaign.name}</span>
                                    <span className={`font-semibold ${profit >= 0 ? 'text-success' : 'text-destructive'}`}>
                                      {profit >= 0 ? '+' : ''}R$ {profit.toFixed(2)}
                                    </span>
                                  </div>
                                );
                              })}
                              <div className={`flex justify-between p-1.5 rounded border-l-2 font-semibold ${totalCashbox >= 0 ? 'bg-primary/10 border-primary' : 'bg-destructive/10 border-destructive'}`}>
                                <span>📊 Caixa Final</span>
                                <span className={totalCashbox >= 0 ? 'text-primary' : 'text-destructive'}>
                                  R$ {totalCashbox.toFixed(2)}
                                </span>
                              </div>
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      )}

                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full"
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
                  onClick={handleDownloadImage}
                  disabled={isDownloadingImage}
                >
                  <Download className="mr-2 h-4 w-4" />
                  {isDownloadingImage ? 'Gerando...' : 'Baixar PNG'}
                </Button>
              )}
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
            <div ref={dashboardRef} className="space-y-6">
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

              {/* Resumo por Tipo de Campanha */}
              {!selectedCampaignId && filteredCampaigns.length > 0 && (() => {
                // Agrupar campanhas por tipo
                const typeGroups: Record<string, AdCampaign[]> = {};
                filteredCampaigns.forEach(c => {
                  if (!typeGroups[c.campaign_type]) typeGroups[c.campaign_type] = [];
                  typeGroups[c.campaign_type].push(c);
                });

                const typeLabels: Record<string, string> = {
                  conversion: 'Conversão', traffic: 'Tráfego', engagement: 'Engajamento',
                  reach: 'Alcance', video: 'Vídeo', leads: 'Leads', messages: 'Mensagens',
                  catalog: 'Catálogo', remarketing: 'Remarketing', ab_test: 'Teste A/B',
                  followers: 'Seguidores', app_install: 'App Install', custom_conversion: 'Conv. Custom',
                  promotion: 'Promoção', branding: 'Branding'
                };

                const typeIcons: Record<string, string> = {
                  conversion: '🎯', traffic: '🚀', engagement: '💬', reach: '📡',
                  video: '🎬', leads: '📋', messages: '💌', catalog: '🛒',
                  remarketing: '🔄', ab_test: '🧪', followers: '👥', app_install: '📱',
                  custom_conversion: '⚙️', promotion: '🏷️', branding: '🏢'
                };

                // Só mostrar se há mais de um tipo ou se o tipo não é financeiro
                const nonFinancialTypes = Object.keys(typeGroups).filter(t => !['conversion', 'catalog', 'promotion', 'remarketing'].includes(t));
                
                if (nonFinancialTypes.length === 0 && Object.keys(typeGroups).length <= 1) return null;

                return (
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-primary" />
                      Resultados por Tipo de Campanha
                    </h3>
                    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                      {Object.entries(typeGroups).map(([type, camps]) => {
                        const totalSpentType = camps.reduce((s, c) => s + c.spent, 0);
                        
                        // Calcular métricas específicas por tipo
                        let mainMetric = '';
                        let mainValue = '';
                        let secondaryMetric = '';
                        let isGood = false;

                        switch (type) {
                          case 'engagement': {
                            const totalEng = camps.reduce((s, c) => s + (c.engagement_count || 0), 0);
                            const costPerEng = totalEng > 0 ? totalSpentType / totalEng : 0;
                            const totalImp = camps.reduce((s, c) => s + c.impressions, 0);
                            const engRate = totalImp > 0 ? (totalEng / totalImp) * 100 : 0;
                            mainMetric = `${totalEng.toLocaleString()} engajamentos`;
                            mainValue = `R$ ${costPerEng.toFixed(2)}/eng`;
                            secondaryMetric = `Taxa: ${engRate.toFixed(2)}%`;
                            isGood = engRate > 5;
                            break;
                          }
                          case 'followers': {
                            const totalFollowers = camps.reduce((s, c) => s + (c.followers_gained || 0), 0);
                            const costPerFollower = totalFollowers > 0 ? totalSpentType / totalFollowers : 0;
                            mainMetric = `${totalFollowers.toLocaleString()} seguidores`;
                            mainValue = `R$ ${costPerFollower.toFixed(2)}/seguidor`;
                            isGood = totalFollowers > 0 && costPerFollower < 5;
                            break;
                          }
                          case 'reach':
                          case 'branding': {
                            const totalReach = camps.reduce((s, c) => s + (c.reach || 0), 0);
                            const cpm = totalReach > 0 ? (totalSpentType / totalReach) * 1000 : 0;
                            const avgFreq = camps.reduce((s, c) => s + (c.frequency || 0), 0) / camps.length;
                            mainMetric = `${totalReach.toLocaleString()} alcance`;
                            mainValue = `CPM: R$ ${cpm.toFixed(2)}`;
                            secondaryMetric = avgFreq > 0 ? `Freq. média: ${avgFreq.toFixed(1)}x` : '';
                            isGood = totalReach > 0 && cpm < 30;
                            break;
                          }
                          case 'video': {
                            const totalViews = camps.reduce((s, c) => s + (c.video_views || 0), 0);
                            const cpv = totalViews > 0 ? totalSpentType / totalViews : 0;
                            const totalWatchTime = camps.reduce((s, c) => s + (c.video_watch_time || 0), 0);
                            const avgWatch = totalViews > 0 ? totalWatchTime / totalViews : 0;
                            mainMetric = `${totalViews.toLocaleString()} views`;
                            mainValue = `CPV: R$ ${cpv.toFixed(3)}`;
                            secondaryMetric = `Média: ${avgWatch.toFixed(0)}s`;
                            isGood = cpv < 0.10;
                            break;
                          }
                          case 'leads': {
                            const totalLeads = camps.reduce((s, c) => s + (c.leads_generated || 0), 0);
                            const cpl = totalLeads > 0 ? totalSpentType / totalLeads : 0;
                            mainMetric = `${totalLeads.toLocaleString()} leads`;
                            mainValue = `CPL: R$ ${cpl.toFixed(2)}`;
                            isGood = totalLeads > 0 && cpl < 20;
                            break;
                          }
                          case 'messages': {
                            const totalMsgs = camps.reduce((s, c) => s + (c.messages_count || 0), 0);
                            const costPerMsg = totalMsgs > 0 ? totalSpentType / totalMsgs : 0;
                            const avgResp = camps.reduce((s, c) => s + (c.response_rate || 0), 0) / camps.length;
                            mainMetric = `${totalMsgs.toLocaleString()} mensagens`;
                            mainValue = `R$ ${costPerMsg.toFixed(2)}/msg`;
                            secondaryMetric = avgResp > 0 ? `Resp: ${avgResp.toFixed(1)}%` : '';
                            isGood = avgResp > 40;
                            break;
                          }
                          case 'traffic': {
                            const totalClksType = camps.reduce((s, c) => s + c.clicks, 0);
                            const totalImpType = camps.reduce((s, c) => s + c.impressions, 0);
                            const cpc = totalClksType > 0 ? totalSpentType / totalClksType : 0;
                            const ctr = totalImpType > 0 ? (totalClksType / totalImpType) * 100 : 0;
                            mainMetric = `${totalClksType.toLocaleString()} cliques`;
                            mainValue = `CPC: R$ ${cpc.toFixed(2)}`;
                            secondaryMetric = `CTR: ${ctr.toFixed(2)}%`;
                            isGood = ctr > 2;
                            break;
                          }
                          case 'app_install': {
                            const totalInstalls = camps.reduce((s, c) => s + (c.app_installs || 0), 0);
                            const cpi = totalInstalls > 0 ? totalSpentType / totalInstalls : 0;
                            mainMetric = `${totalInstalls.toLocaleString()} instalações`;
                            mainValue = `CPI: R$ ${cpi.toFixed(2)}`;
                            isGood = totalInstalls > 0;
                            break;
                          }
                          default: {
                            const totalRev = camps.reduce((s, c) => s + (c.revenue || 0), 0);
                            const roiVal = totalSpentType > 0 ? ((totalRev - totalSpentType) / totalSpentType) * 100 : 0;
                            mainMetric = `R$ ${totalRev.toFixed(2)} receita`;
                            mainValue = `ROI: ${roiVal.toFixed(1)}%`;
                            isGood = roiVal > 0;
                            break;
                          }
                        }

                        // Avaliar campanhas do grupo
                        const evaluations = camps.map(c => evaluateCampaignPerformance(c));
                        const avgPerf = evaluations.reduce((s, e) => s + e.percentage, 0) / evaluations.length;
                        const perfIcon = avgPerf >= 80 ? '🎉' : avgPerf >= 60 ? '👍' : avgPerf >= 40 ? '⚠️' : '📉';

                        return (
                          <Card key={type} className={`glass border ${isGood ? 'border-success/30' : 'border-destructive/30'}`}>
                            <CardContent className="pt-4 pb-3">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <span className="text-lg">{typeIcons[type] || '📊'}</span>
                                  <span className="font-semibold text-sm">{typeLabels[type] || type}</span>
                                </div>
                                <Badge variant="outline" className="text-[10px]">
                                  {camps.length} camp.
                                </Badge>
                              </div>
                              <div className={`text-xl font-bold ${isGood ? 'text-success' : 'text-destructive'}`}>
                                {isGood ? '✅' : '❌'} {mainMetric}
                              </div>
                              <div className="text-sm text-muted-foreground mt-1">{mainValue}</div>
                              {secondaryMetric && <div className="text-xs text-muted-foreground">{secondaryMetric}</div>}
                              <div className="flex items-center justify-between mt-2 pt-2 border-t border-border">
                                <span className="text-xs text-muted-foreground">Investido: R$ {totalSpentType.toFixed(2)}</span>
                                <span className="text-xs">{perfIcon} {avgPerf.toFixed(0)}%</span>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}


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

              {/* Campaign Cashbox Impact - Impacto no Caixa da Campanha */}
              {selectedCampaignId && filteredCampaigns.length > 0 && (() => {
                const campaign = filteredCampaigns[0];
                const campaignClient = clients.find(c => c.id === campaign.client_id);
                
                if (!campaignClient) return null;

                // Ordenar campanhas por data de criação
                const clientCampaigns = campaigns
                  .filter(c => c.client_id === campaignClient.id)
                  .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
                
                const campaignIndex = clientCampaigns.findIndex(c => c.id === campaign.id);
                
                // Calcular caixa antes desta campanha
                const previousCampaigns = clientCampaigns.slice(0, campaignIndex);
                const previousSpent = previousCampaigns.reduce((sum, c) => sum + c.spent, 0);
                const previousRevenue = previousCampaigns.reduce((sum, c) => sum + (c.revenue || 0), 0);
                const cashboxBeforeCampaign = campaignClient.cashbox - previousSpent + previousRevenue;
                
                // Impacto desta campanha
                const campaignSpent = campaign.spent;
                const campaignRevenue = campaign.revenue || 0;
                const campaignProfit = campaignRevenue - campaignSpent;
                const campaignImpact = campaignRevenue - campaignSpent; // Lucro da campanha
                
                // Caixa depois desta campanha
                const cashboxAfterCampaign = cashboxBeforeCampaign - campaignSpent + campaignRevenue;

                return (
                  <Card className="glass border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-transparent mb-6">
                    <CardHeader>
                      <CardTitle className="text-xl flex items-center gap-3">
                        <Wallet className="h-6 w-6 text-primary" />
                        Impacto no Caixa - {campaignClient.name}
                      </CardTitle>
                      <CardDescription>
                        Como esta campanha afetou o caixa do cliente
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {/* Fluxo visual do caixa */}
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          {/* Caixa Antes */}
                          <div className="flex-1 min-w-[140px] p-3 bg-muted/50 rounded-lg text-center">
                            <div className="text-xs text-muted-foreground mb-1">💰 Caixa Antes</div>
                            <div className="text-lg font-bold text-primary">
                              R$ {cashboxBeforeCampaign.toFixed(2)}
                            </div>
                          </div>

                          {/* Seta e Impacto */}
                          <div className="flex flex-col items-center px-2">
                            <div className={`text-xl font-bold ${campaignImpact >= 0 ? 'text-success' : 'text-destructive'}`}>
                              {campaignImpact >= 0 ? '→ +' : '→ '}R$ {campaignImpact.toFixed(2)}
                            </div>
                            <div className="text-xs text-muted-foreground">Impacto</div>
                          </div>

                          {/* Caixa Depois */}
                          <div className={`flex-1 min-w-[140px] p-3 rounded-lg text-center border-2 ${cashboxAfterCampaign >= 0 ? 'bg-success/10 border-success/30' : 'bg-destructive/10 border-destructive/30'}`}>
                            <div className="text-xs text-muted-foreground mb-1">📊 Caixa Depois</div>
                            <div className={`text-lg font-bold ${cashboxAfterCampaign >= 0 ? 'text-success' : 'text-destructive'}`}>
                              R$ {cashboxAfterCampaign.toFixed(2)}
                            </div>
                          </div>
                        </div>

                        {/* Detalhamento */}
                        <div className="grid grid-cols-3 gap-3 pt-3 border-t border-border">
                          <div className="text-center p-2 bg-destructive/10 rounded-lg">
                            <div className="text-xs text-muted-foreground">Gasto</div>
                            <div className="text-sm font-bold text-destructive">-R$ {campaignSpent.toFixed(2)}</div>
                          </div>
                          <div className="text-center p-2 bg-primary/10 rounded-lg">
                            <div className="text-xs text-muted-foreground">Faturamento</div>
                            <div className="text-sm font-bold text-primary">+R$ {campaignRevenue.toFixed(2)}</div>
                          </div>
                          <div className={`text-center p-2 rounded-lg ${campaignProfit >= 0 ? 'bg-success/10' : 'bg-destructive/10'}`}>
                            <div className="text-xs text-muted-foreground">Lucro</div>
                            <div className={`text-sm font-bold ${campaignProfit >= 0 ? 'text-success' : 'text-destructive'}`}>
                              {campaignProfit >= 0 ? '+' : ''}R$ {campaignProfit.toFixed(2)}
                            </div>
                          </div>
                        </div>
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
                        <TableHead>Tipo</TableHead>
                        <TableHead>Investido</TableHead>
                        <TableHead>Resultado Principal</TableHead>
                        <TableHead>Avaliação</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCampaigns.map((campaign) => {
                        const client = clients.find(c => c.id === campaign.client_id);
                        const isSelected = selectedCampaignId === campaign.id;
                        
                        // Get type-specific result
                        const getTypeResult = (c: AdCampaign): { label: string; value: string; isGood: boolean } => {
                          switch (c.campaign_type) {
                            case 'conversion':
                            case 'promotion':
                            case 'catalog': {
                              const roiVal = c.spent > 0 ? ((c.revenue - c.spent) / c.spent) * 100 : 0;
                              return { label: 'ROI', value: `${roiVal.toFixed(1)}%`, isGood: roiVal > 0 };
                            }
                            case 'engagement': {
                              const engRate = c.impressions > 0 ? ((c.engagement_count || 0) / c.impressions) * 100 : 0;
                              const costPerEng = (c.engagement_count || 0) > 0 ? c.spent / (c.engagement_count || 1) : 0;
                              return { label: `${(c.engagement_count || 0).toLocaleString()} eng.`, value: `R$ ${costPerEng.toFixed(2)}/eng | ${engRate.toFixed(2)}%`, isGood: engRate > 5 };
                            }
                            case 'followers': {
                              const costPerFollower = (c.followers_gained || 0) > 0 ? c.spent / (c.followers_gained || 1) : 0;
                              return { label: `${(c.followers_gained || 0).toLocaleString()} seguidores`, value: `R$ ${costPerFollower.toFixed(2)}/seguidor`, isGood: costPerFollower < 5 && (c.followers_gained || 0) > 0 };
                            }
                            case 'reach':
                            case 'branding': {
                              const cpmVal = (c.reach || 0) > 0 ? (c.spent / (c.reach || 1)) * 1000 : 0;
                              const brandStr = c.brand_recall ? ` | Recall: ${c.brand_recall.toFixed(1)}%` : '';
                              return { label: `${(c.reach || 0).toLocaleString()} alcance`, value: `CPM: R$ ${cpmVal.toFixed(2)}${brandStr}`, isGood: (c.reach || 0) > 0 && cpmVal < 30 };
                            }
                            case 'video': {
                              const cpv = (c.video_views || 0) > 0 ? c.spent / (c.video_views || 1) : 0;
                              const avgWatch = (c.video_views || 0) > 0 && c.video_watch_time ? (c.video_watch_time / (c.video_views || 1)) : 0;
                              return { label: `${(c.video_views || 0).toLocaleString()} views`, value: `CPV: R$ ${cpv.toFixed(3)} | Média: ${avgWatch.toFixed(0)}s`, isGood: cpv < 0.10 && avgWatch > 15 };
                            }
                            case 'leads': {
                              const cpl = (c.leads_generated || 0) > 0 ? c.spent / (c.leads_generated || 1) : 0;
                              return { label: `${(c.leads_generated || 0).toLocaleString()} leads`, value: `CPL: R$ ${cpl.toFixed(2)}`, isGood: (c.leads_generated || 0) > 0 && cpl < 20 };
                            }
                            case 'messages': {
                              const costPerMsg = (c.messages_count || 0) > 0 ? c.spent / (c.messages_count || 1) : 0;
                              const respStr = c.response_rate ? ` | Resp: ${c.response_rate.toFixed(1)}%` : '';
                              return { label: `${(c.messages_count || 0).toLocaleString()} msgs`, value: `R$ ${costPerMsg.toFixed(2)}/msg${respStr}`, isGood: (c.response_rate || 0) > 40 };
                            }
                            case 'traffic': {
                              const cpc = c.clicks > 0 ? c.spent / c.clicks : 0;
                              const ctr = c.impressions > 0 ? (c.clicks / c.impressions) * 100 : 0;
                              return { label: `${c.clicks.toLocaleString()} cliques`, value: `CPC: R$ ${cpc.toFixed(2)} | CTR: ${ctr.toFixed(2)}%`, isGood: ctr > 2 };
                            }
                            case 'remarketing': {
                              const roiVal = c.spent > 0 ? ((c.revenue - c.spent) / c.spent) * 100 : 0;
                              const recStr = c.recovery_rate ? ` | Recup: ${c.recovery_rate.toFixed(1)}%` : '';
                              return { label: `${c.conversions} conv.`, value: `ROI: ${roiVal.toFixed(1)}%${recStr}`, isGood: roiVal > 0 };
                            }
                            case 'app_install': {
                              const cpi = (c.app_installs || 0) > 0 ? c.spent / (c.app_installs || 1) : 0;
                              const retStr = c.retention_rate ? ` | Ret: ${c.retention_rate.toFixed(1)}%` : '';
                              return { label: `${(c.app_installs || 0).toLocaleString()} installs`, value: `CPI: R$ ${cpi.toFixed(2)}${retStr}`, isGood: (c.retention_rate || 0) > 30 };
                            }
                            case 'ab_test': {
                              const convRate = c.clicks > 0 ? (c.conversions / c.clicks) * 100 : 0;
                              return { label: `${c.conversions} conv.`, value: `Taxa: ${convRate.toFixed(2)}%`, isGood: convRate > 2 };
                            }
                            case 'custom_conversion': {
                              const costPerConv = (c.custom_conversions || 0) > 0 ? c.spent / (c.custom_conversions || 1) : 0;
                              return { label: `${(c.custom_conversions || 0)} conv. custom`, value: `Custo: R$ ${costPerConv.toFixed(2)}`, isGood: (c.custom_conversions || 0) > 0 };
                            }
                            default: {
                              const roiVal = c.spent > 0 ? ((c.revenue - c.spent) / c.spent) * 100 : 0;
                              return { label: 'ROI', value: `${roiVal.toFixed(1)}%`, isGood: roiVal > 0 };
                            }
                          }
                        };

                        const getCampaignTypeLabel = (type: string) => {
                          const labels: Record<string, string> = {
                            conversion: 'Conversão',
                            traffic: 'Tráfego',
                            engagement: 'Engajamento',
                            reach: 'Alcance',
                            video: 'Vídeo',
                            leads: 'Leads',
                            messages: 'Mensagens',
                            catalog: 'Catálogo',
                            remarketing: 'Remarketing',
                            ab_test: 'Teste A/B',
                            followers: 'Seguidores',
                            app_install: 'App Install',
                            custom_conversion: 'Conv. Custom',
                            promotion: 'Promoção',
                            branding: 'Branding'
                          };
                          return labels[type] || type;
                        };

                        const result = getTypeResult(campaign);
                        const perf = evaluateCampaignPerformance(campaign);
                        
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
                              <Badge variant="outline" className="text-xs">
                                {getCampaignTypeLabel(campaign.campaign_type)}
                              </Badge>
                            </TableCell>
                            <TableCell>R$ {campaign.spent.toFixed(2)}</TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-0.5">
                                <span className={`font-medium text-sm ${result.isGood ? 'text-success' : 'text-destructive'}`}>
                                  {result.isGood ? '✅' : '❌'} {result.label}
                                </span>
                                <span className="text-xs text-muted-foreground">{result.value}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant={perf.status === 'excellent' ? 'default' : perf.status === 'good' ? 'secondary' : 'outline'}
                                className={`text-xs ${perf.status === 'poor' ? 'border-destructive text-destructive' : perf.status === 'fair' ? 'border-yellow-500 text-yellow-600' : ''}`}
                              >
                                {perf.icon} {perf.message}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      title="Compartilhar campanha"
                                    >
                                      <Share2 className="h-4 w-4" />
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-80" align="end">
                                    <div className="space-y-3">
                                      <div className="space-y-1">
                                        <h4 className="font-medium text-sm">Compartilhar Campanha</h4>
                                        <p className="text-xs text-muted-foreground">
                                          Envie este link para seu cliente visualizar os resultados
                                        </p>
                                      </div>
                                      <div className="flex gap-2">
                                        <Input
                                          readOnly
                                          value={`${window.location.origin}/campanha/${campaign.id}`}
                                          className="text-xs"
                                        />
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => {
                                            navigator.clipboard.writeText(`${window.location.origin}/campanha/${campaign.id}`);
                                            setCopiedCampaignId(campaign.id);
                                            toast.success("Link copiado!");
                                            setTimeout(() => setCopiedCampaignId(null), 2000);
                                          }}
                                        >
                                          {copiedCampaignId === campaign.id ? (
                                            <Check className="h-4 w-4" />
                                          ) : (
                                            <Copy className="h-4 w-4" />
                                          )}
                                        </Button>
                                      </div>
                                      <Button
                                        size="sm"
                                        className="w-full"
                                        variant="outline"
                                        onClick={() => window.open(`${window.location.origin}/campanha/${campaign.id}`, '_blank')}
                                      >
                                        <ExternalLink className="h-4 w-4 mr-2" />
                                        Abrir Preview
                                      </Button>
                                    </div>
                                  </PopoverContent>
                                </Popover>
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
            </div>
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
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full text-xs"
                  onClick={() => handleGenerateScenario('positive')}
                >
                  <Sparkles className="mr-1 h-3 w-3 text-success shrink-0" />
                  <span className="truncate">Gerar Cenário Positivo</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full text-xs"
                  onClick={() => handleGenerateScenario('negative')}
                >
                  <TrendingDown className="mr-1 h-3 w-3 text-destructive shrink-0" />
                  <span className="truncate">Gerar Cenário Negativo</span>
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
            
            {['conversion', 'traffic', 'remarketing', 'ab_test', 'promotion', 'engagement', 'video', 'leads'].includes(campaignFormData.campaign_type) && (
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
            
            {['conversion', 'traffic', 'remarketing', 'ab_test', 'promotion', 'engagement', 'video', 'leads'].includes(campaignFormData.campaign_type) && (
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