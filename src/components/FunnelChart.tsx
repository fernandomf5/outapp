import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Users, DollarSign, Target, Trophy } from 'lucide-react';

interface FunnelStage {
  id: string;
  name: string;
  color: string;
  order_index: number;
}

interface FunnelLead {
  id: string;
  stage_id: string;
  value: number;
}

interface FunnelChartProps {
  stages: FunnelStage[];
  leads: FunnelLead[];
}

export default function FunnelChart({ stages, leads }: FunnelChartProps) {
  const funnelData = useMemo(() => {
    return stages
      .sort((a, b) => a.order_index - b.order_index)
      .map((stage, index) => {
        const stageLeads = leads.filter(l => l.stage_id === stage.id);
        const count = stageLeads.length;
        const value = stageLeads.reduce((acc, l) => acc + (l.value || 0), 0);
        
        return {
          ...stage,
          count,
          value,
          index,
        };
      });
  }, [stages, leads]);

  const maxCount = Math.max(...funnelData.map(d => d.count), 1);
  const totalLeads = leads.length;
  const totalValue = leads.reduce((acc, l) => acc + (l.value || 0), 0);
  
  // Calcular taxa de conversão (primeiro estágio vs último)
  const firstStageLeads = funnelData[0]?.count || 0;
  const lastStageLeads = funnelData[funnelData.length - 1]?.count || 0;
  const conversionRate = firstStageLeads > 0 
    ? ((lastStageLeads / firstStageLeads) * 100).toFixed(1) 
    : '0';

  // Calcular valor médio por lead
  const averageValue = totalLeads > 0 ? totalValue / totalLeads : 0;

  if (stages.length === 0) {
    return null;
  }

  return (
    <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-card to-card/80">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <div className="p-2 rounded-lg bg-primary/10">
            <Target className="w-5 h-5 text-primary" />
          </div>
          Visualização do Funil
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 rounded-xl p-3 border border-blue-500/20">
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-4 h-4 text-blue-500" />
              <span className="text-xs text-muted-foreground">Prospecção</span>
            </div>
            <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
              {funnelData[0]?.count || 0}
            </p>
          </div>
          
          <div className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 rounded-xl p-3 border border-amber-500/20">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-amber-500" />
              <span className="text-xs text-muted-foreground">Em Andamento</span>
            </div>
            <p className="text-xl font-bold text-amber-600 dark:text-amber-400">
              {funnelData.slice(1, -1).reduce((acc, s) => acc + s.count, 0)}
            </p>
          </div>
          
          <div className="bg-gradient-to-br from-green-500/10 to-green-600/5 rounded-xl p-3 border border-green-500/20">
            <div className="flex items-center gap-2 mb-1">
              <Trophy className="w-4 h-4 text-green-500" />
              <span className="text-xs text-muted-foreground">Fechados</span>
            </div>
            <p className="text-xl font-bold text-green-600 dark:text-green-400">
              {funnelData[funnelData.length - 1]?.count || 0}
            </p>
          </div>
          
          <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 rounded-xl p-3 border border-purple-500/20">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="w-4 h-4 text-purple-500" />
              <span className="text-xs text-muted-foreground">Conversão</span>
            </div>
            <p className="text-xl font-bold text-purple-600 dark:text-purple-400">
              {conversionRate}%
            </p>
          </div>
        </div>

        {/* Funnel Visualization */}
        <div className="relative py-4">
          {/* Background glow effect */}
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent rounded-3xl" />
          
          <div className="relative flex flex-col items-center gap-0">
            {funnelData.map((stage, index) => {
              const percentage = maxCount > 0 ? (stage.count / maxCount) * 100 : 0;
              // Largura mínima de 30% e máxima de 100%
              const width = Math.max(30, 100 - (index * (70 / Math.max(funnelData.length - 1, 1))));
              
              // Taxa de conversão para próxima etapa
              const nextStage = funnelData[index + 1];
              const dropRate = nextStage && stage.count > 0
                ? (((stage.count - nextStage.count) / stage.count) * 100).toFixed(0)
                : null;

              return (
                <div key={stage.id} className="w-full flex flex-col items-center">
                  {/* Stage bar */}
                  <div 
                    className="relative group transition-all duration-500 ease-out"
                    style={{ width: `${width}%` }}
                  >
                    {/* Main bar */}
                    <div 
                      className="relative h-14 sm:h-16 rounded-xl overflow-hidden shadow-lg group-hover:shadow-xl transition-shadow cursor-pointer"
                      style={{ 
                        background: `linear-gradient(135deg, ${stage.color}dd, ${stage.color}99)`,
                      }}
                    >
                      {/* Animated shimmer */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                      
                      {/* Content */}
                      <div className="absolute inset-0 flex items-center justify-between px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-bold text-white text-sm">
                            {stage.count}
                          </div>
                          <div>
                            <p className="font-semibold text-white text-sm sm:text-base truncate max-w-[120px] sm:max-w-none">
                              {stage.name}
                            </p>
                            <p className="text-white/70 text-xs hidden sm:block">
                              R$ {stage.value.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                            </p>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <p className="text-white/90 text-xs sm:text-sm font-medium">
                            {percentage.toFixed(0)}%
                          </p>
                        </div>
                      </div>
                      
                      {/* Progress indicator */}
                      <div 
                        className="absolute bottom-0 left-0 h-1 bg-white/30"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    
                    {/* Side indicators */}
                    <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white shadow-md" style={{ backgroundColor: stage.color }} />
                    <div className="absolute -right-1 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white shadow-md" style={{ backgroundColor: stage.color }} />
                  </div>
                  
                  {/* Connector with drop rate */}
                  {index < funnelData.length - 1 && (
                    <div className="relative flex items-center justify-center h-8 w-full">
                      {/* Connecting lines */}
                      <div 
                        className="absolute h-full w-0.5 bg-gradient-to-b from-transparent via-border to-transparent"
                      />
                      
                      {/* Drop rate badge */}
                      {dropRate && parseInt(dropRate) > 0 && (
                        <div className="absolute z-10 flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/20">
                          <TrendingDown className="w-3 h-3 text-red-500" />
                          <span className="text-[10px] font-medium text-red-600 dark:text-red-400">
                            -{dropRate}%
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Summary Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-border/50">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-500 to-green-500" />
            <span>Topo → Fundo do Funil</span>
          </div>
          <div className="text-sm font-medium">
            Ticket Médio: <span className="text-primary">R$ {averageValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
