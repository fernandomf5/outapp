import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Building2,
  ChevronDown,
  ChevronUp,
  History,
  Wallet
} from "lucide-react";

interface AdCampaign {
  id: string;
  name: string;
  platform: string;
  spent: number;
  revenue: number;
  created_at: string;
}

interface ClientCashboxCardProps {
  clientName: string;
  clientType: 'personal' | 'company';
  initialCashbox: number;
  campaigns: AdCampaign[];
}

export const ClientCashboxCard = ({ 
  clientName, 
  clientType, 
  initialCashbox, 
  campaigns 
}: ClientCashboxCardProps) => {
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Calcular totais
  const totalSpent = campaigns.reduce((sum, c) => sum + c.spent, 0);
  const totalRevenue = campaigns.reduce((sum, c) => sum + (c.revenue || 0), 0);
  const totalProfit = totalRevenue - totalSpent;

  // Caixa 1: Caixa inicial - gastos (quanto sobrou do investimento inicial)
  const cashboxAfterSpent = initialCashbox - totalSpent;

  // Caixa 2: Lucro das campanhas
  const profitCashbox = totalProfit;

  // Caixa Total: Caixa 1 + Caixa 2
  const totalCashbox = cashboxAfterSpent + profitCashbox;

  const getPlatformName = (platform: string) => {
    switch(platform) {
      case 'meta': return 'Meta';
      case 'google': return 'Google';
      case 'tiktok': return 'TikTok';
      default: return platform;
    }
  };

  // Ordenar campanhas por data (mais recente primeiro)
  const sortedCampaigns = [...campaigns].sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return (
    <Card className="border-2">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-primary" />
          <div>
            <CardTitle className="text-lg">{clientName}</CardTitle>
            <Badge variant="outline" className="mt-1">
              {clientType === 'personal' ? 'Pessoal' : 'Empresa'}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Caixa Inicial */}
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Caixa Inicial</span>
          </div>
          <span className="font-semibold text-primary">R$ {initialCashbox.toFixed(2)}</span>
        </div>

        {/* Grid dos 3 Caixas */}
        <div className="grid grid-cols-3 gap-2">
          {/* Caixa 1: Após Gastos */}
          <div className="p-3 bg-gradient-to-br from-orange-500/10 to-transparent rounded-lg border border-orange-500/20">
            <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
              <DollarSign className="h-3 w-3" />
              Caixa 1
            </div>
            <div className="text-xs text-muted-foreground">(Após Gastos)</div>
            <div className={`text-lg font-bold mt-1 ${cashboxAfterSpent >= 0 ? 'text-orange-500' : 'text-destructive'}`}>
              R$ {cashboxAfterSpent.toFixed(2)}
            </div>
          </div>

          {/* Caixa 2: Lucro */}
          <div className={`p-3 bg-gradient-to-br ${profitCashbox >= 0 ? 'from-success/10' : 'from-destructive/10'} to-transparent rounded-lg border ${profitCashbox >= 0 ? 'border-success/20' : 'border-destructive/20'}`}>
            <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
              {profitCashbox >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              Caixa 2
            </div>
            <div className="text-xs text-muted-foreground">(Lucro)</div>
            <div className={`text-lg font-bold mt-1 ${profitCashbox >= 0 ? 'text-success' : 'text-destructive'}`}>
              R$ {profitCashbox.toFixed(2)}
            </div>
          </div>

          {/* Caixa Total */}
          <div className={`p-3 bg-gradient-to-br ${totalCashbox >= 0 ? 'from-primary/10' : 'from-destructive/10'} to-transparent rounded-lg border-2 ${totalCashbox >= 0 ? 'border-primary/30' : 'border-destructive/30'}`}>
            <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
              <Wallet className="h-3 w-3" />
              Total
            </div>
            <div className="text-xs text-muted-foreground">(1 + 2)</div>
            <div className={`text-lg font-bold mt-1 ${totalCashbox >= 0 ? 'text-primary' : 'text-destructive'}`}>
              R$ {totalCashbox.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Resumo de Métricas */}
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total Gasto:</span>
            <span className="font-medium text-destructive">-R$ {totalSpent.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Faturado:</span>
            <span className="font-medium text-success">+R$ {totalRevenue.toFixed(2)}</span>
          </div>
        </div>

        {/* Histórico de Campanhas */}
        {campaigns.length > 0 && (
          <Collapsible open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="outline" size="sm" className="w-full">
                <History className="h-4 w-4 mr-2" />
                Histórico de Campanhas ({campaigns.length})
                {isHistoryOpen ? <ChevronUp className="h-4 w-4 ml-auto" /> : <ChevronDown className="h-4 w-4 ml-auto" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-3">
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {/* Linha inicial do caixa */}
                <div className="flex items-center justify-between p-2 bg-primary/5 rounded text-xs border-l-2 border-primary">
                  <div className="flex items-center gap-2">
                    <Wallet className="h-3 w-3 text-primary" />
                    <span className="font-medium">Caixa Inicial</span>
                  </div>
                  <span className="font-semibold text-primary">+R$ {initialCashbox.toFixed(2)}</span>
                </div>

                {/* Campanhas */}
                {sortedCampaigns.map((campaign, index) => {
                  const campaignProfit = (campaign.revenue || 0) - campaign.spent;
                  const runningTotal = initialCashbox - 
                    sortedCampaigns.slice(0, index + 1).reduce((sum, c) => sum + c.spent, 0) +
                    sortedCampaigns.slice(0, index + 1).reduce((sum, c) => sum + ((c.revenue || 0) - c.spent), 0);
                  
                  return (
                    <div 
                      key={campaign.id} 
                      className={`flex flex-col p-2 rounded text-xs border-l-2 ${campaignProfit >= 0 ? 'bg-success/5 border-success' : 'bg-destructive/5 border-destructive'}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {campaignProfit >= 0 ? (
                            <TrendingUp className="h-3 w-3 text-success" />
                          ) : (
                            <TrendingDown className="h-3 w-3 text-destructive" />
                          )}
                          <span className="font-medium truncate max-w-[120px]">{campaign.name}</span>
                          <Badge variant="outline" className="text-[10px] px-1 py-0">
                            {getPlatformName(campaign.platform)}
                          </Badge>
                        </div>
                        <span className={`font-semibold ${campaignProfit >= 0 ? 'text-success' : 'text-destructive'}`}>
                          {campaignProfit >= 0 ? '+' : ''}R$ {campaignProfit.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between mt-1 text-muted-foreground">
                        <span>Gasto: R$ {campaign.spent.toFixed(2)} | Fat: R$ {(campaign.revenue || 0).toFixed(2)}</span>
                        <span className="font-medium">Caixa: R$ {runningTotal.toFixed(2)}</span>
                      </div>
                    </div>
                  );
                })}

                {/* Linha final */}
                <div className={`flex items-center justify-between p-2 rounded text-xs border-l-2 ${totalCashbox >= 0 ? 'bg-primary/10 border-primary' : 'bg-destructive/10 border-destructive'}`}>
                  <div className="flex items-center gap-2">
                    <Wallet className="h-3 w-3" />
                    <span className="font-semibold">Caixa Final</span>
                  </div>
                  <span className={`font-bold ${totalCashbox >= 0 ? 'text-primary' : 'text-destructive'}`}>
                    R$ {totalCashbox.toFixed(2)}
                  </span>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}

        {campaigns.length === 0 && (
          <div className="text-center text-sm text-muted-foreground py-2">
            Nenhuma campanha cadastrada
          </div>
        )}
      </CardContent>
    </Card>
  );
};
