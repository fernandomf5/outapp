import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp, TrendingDown, DollarSign, BarChart3, MousePointer, Eye, Target, Megaphone } from "lucide-react";

interface Campaign {
  id: string;
  name: string;
  platform: string;
  status: string;
  budget: number;
  spent: number;
  revenue: number | null;
  clicks: number;
  impressions: number;
  conversions: number;
  start_date: string;
  end_date: string | null;
}

interface AdClient {
  id: string;
  name: string;
  cashbox: number;
}

interface Props {
  clientId: string;
  accentColor: string;
  cardTextColor: string;
  cardBackgroundColor: string;
}

export function AdsDashboardBlock({ clientId, accentColor, cardTextColor, cardBackgroundColor }: Props) {
  const [client, setClient] = useState<AdClient | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    
    // Realtime subscription para atualizar automaticamente
    const channel = supabase
      .channel(`ads-dashboard-${clientId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ad_campaigns', filter: `client_id=eq.${clientId}` }, () => loadData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ad_clients', filter: `id=eq.${clientId}` }, () => loadData())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [clientId]);

  const loadData = async () => {
    try {
      const [clientRes, campaignsRes] = await Promise.all([
        supabase.from('ad_clients').select('id, name, cashbox').eq('id', clientId).single(),
        supabase.from('ad_campaigns').select('*').eq('client_id', clientId).order('start_date', { ascending: true })
      ]);

      if (clientRes.data) setClient(clientRes.data);
      if (campaignsRes.data) setCampaigns(campaignsRes.data);
    } catch (error) {
      console.error('Error loading ads data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: accentColor }} />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="text-center py-8" style={{ color: cardTextColor }}>
        <Megaphone className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>Cliente de anúncios não encontrado</p>
      </div>
    );
  }

  const totalSpent = campaigns.reduce((sum, c) => sum + (c.spent || 0), 0);
  const totalRevenue = campaigns.reduce((sum, c) => sum + (c.revenue || 0), 0);
  const totalClicks = campaigns.reduce((sum, c) => sum + (c.clicks || 0), 0);
  const totalImpressions = campaigns.reduce((sum, c) => sum + (c.impressions || 0), 0);
  const totalConversions = campaigns.reduce((sum, c) => sum + (c.conversions || 0), 0);
  const profit = totalRevenue - totalSpent;
  const roas = totalSpent > 0 ? totalRevenue / totalSpent : 0;
  const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const activeCampaigns = campaigns.filter(c => c.status === 'active');
  const pausedCampaigns = campaigns.filter(c => c.status === 'paused');
  const completedCampaigns = campaigns.filter(c => c.status === 'completed');

  return (
    <div className="space-y-4">
      {/* Caixa do Cliente */}
      <div className="p-4 rounded-xl" style={{ backgroundColor: `${accentColor}15`, border: `1px solid ${accentColor}30` }}>
        <div className="flex items-center gap-2 mb-3">
          <DollarSign className="w-5 h-5" style={{ color: accentColor }} />
          <h3 className="font-bold text-base" style={{ color: cardTextColor }}>Caixa - {client.name}</h3>
        </div>
        <div className="text-3xl font-bold" style={{ color: profit >= 0 ? '#10b981' : '#ef4444' }}>
          {formatCurrency(client.cashbox)}
        </div>
        <p className="text-xs mt-1 opacity-70" style={{ color: cardTextColor }}>Saldo atual do caixa</p>
      </div>

      {/* Métricas Resumo */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <MetricCard
          icon={<DollarSign className="w-4 h-4" />}
          label="Investido"
          value={formatCurrency(totalSpent)}
          accentColor={accentColor}
          cardTextColor={cardTextColor}
        />
        <MetricCard
          icon={<TrendingUp className="w-4 h-4" />}
          label="Receita"
          value={formatCurrency(totalRevenue)}
          accentColor="#10b981"
          cardTextColor={cardTextColor}
        />
        <MetricCard
          icon={profit >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
          label="Lucro"
          value={formatCurrency(profit)}
          accentColor={profit >= 0 ? '#10b981' : '#ef4444'}
          cardTextColor={cardTextColor}
        />
        <MetricCard
          icon={<BarChart3 className="w-4 h-4" />}
          label="ROAS"
          value={`${roas.toFixed(2)}x`}
          accentColor={accentColor}
          cardTextColor={cardTextColor}
        />
        <MetricCard
          icon={<MousePointer className="w-4 h-4" />}
          label="CTR"
          value={`${ctr.toFixed(2)}%`}
          accentColor={accentColor}
          cardTextColor={cardTextColor}
        />
        <MetricCard
          icon={<Target className="w-4 h-4" />}
          label="Conversões"
          value={totalConversions.toString()}
          accentColor={accentColor}
          cardTextColor={cardTextColor}
        />
      </div>

      {/* Status das Campanhas */}
      <div className="flex gap-2 flex-wrap">
        <span className="px-3 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: '#10b98120', color: '#10b981' }}>
          {activeCampaigns.length} ativas
        </span>
        <span className="px-3 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: '#f59e0b20', color: '#f59e0b' }}>
          {pausedCampaigns.length} pausadas
        </span>
        <span className="px-3 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: '#6b728020', color: '#6b7280' }}>
          {completedCampaigns.length} finalizadas
        </span>
      </div>

      {/* Lista de Campanhas */}
      <div className="space-y-2">
        <h4 className="font-semibold text-sm flex items-center gap-2" style={{ color: cardTextColor }}>
          <Megaphone className="w-4 h-4" style={{ color: accentColor }} />
          Campanhas ({campaigns.length})
        </h4>
        {campaigns.length === 0 ? (
          <p className="text-sm opacity-60" style={{ color: cardTextColor }}>Nenhuma campanha cadastrada</p>
        ) : (
          <div className="space-y-2">
            {campaigns.map((campaign) => (
              <CampaignCard
                key={campaign.id}
                campaign={campaign}
                accentColor={accentColor}
                cardTextColor={cardTextColor}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function MetricCard({ icon, label, value, accentColor, cardTextColor }: { icon: React.ReactNode; label: string; value: string; accentColor: string; cardTextColor: string }) {
  return (
    <div className="p-3 rounded-lg" style={{ backgroundColor: `${accentColor}10` }}>
      <div className="flex items-center gap-1.5 mb-1">
        <span style={{ color: accentColor }}>{icon}</span>
        <span className="text-xs opacity-70" style={{ color: cardTextColor }}>{label}</span>
      </div>
      <p className="font-bold text-sm" style={{ color: cardTextColor }}>{value}</p>
    </div>
  );
}

function CampaignCard({ campaign, accentColor, cardTextColor }: { campaign: Campaign; accentColor: string; cardTextColor: string }) {
  const statusColor = campaign.status === 'active' ? '#10b981' : campaign.status === 'paused' ? '#f59e0b' : '#6b7280';
  const statusLabel = campaign.status === 'active' ? 'Ativa' : campaign.status === 'paused' ? 'Pausada' : 'Finalizada';
  const revenue = campaign.revenue || 0;
  const profit = revenue - campaign.spent;
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  return (
    <div className="p-3 rounded-lg border" style={{ borderColor: `${accentColor}20`, backgroundColor: `${accentColor}05` }}>
      <div className="flex items-center justify-between mb-2">
        <h5 className="font-medium text-sm truncate flex-1" style={{ color: cardTextColor }}>{campaign.name}</h5>
        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium ml-2 shrink-0" style={{ backgroundColor: `${statusColor}20`, color: statusColor }}>
          {statusLabel}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2 text-xs">
        <div>
          <span className="opacity-60" style={{ color: cardTextColor }}>Gasto</span>
          <p className="font-medium" style={{ color: cardTextColor }}>{formatCurrency(campaign.spent)}</p>
        </div>
        <div>
          <span className="opacity-60" style={{ color: cardTextColor }}>Receita</span>
          <p className="font-medium" style={{ color: '#10b981' }}>{formatCurrency(revenue)}</p>
        </div>
        <div>
          <span className="opacity-60" style={{ color: cardTextColor }}>Lucro</span>
          <p className="font-medium" style={{ color: profit >= 0 ? '#10b981' : '#ef4444' }}>{formatCurrency(profit)}</p>
        </div>
      </div>
      <div className="flex gap-3 mt-2 text-[10px] opacity-60" style={{ color: cardTextColor }}>
        <span>{campaign.platform}</span>
        <span>•</span>
        <span><Eye className="w-3 h-3 inline mr-0.5" />{campaign.impressions.toLocaleString()}</span>
        <span>•</span>
        <span><MousePointer className="w-3 h-3 inline mr-0.5" />{campaign.clicks.toLocaleString()}</span>
      </div>
    </div>
  );
}
