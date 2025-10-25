import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { BarChart3, Users, Clock, TrendingUp, MousePointerClick } from "lucide-react";

interface AnalyticsData {
  totalViews: number;
  totalConversions: number;
  conversionRate: number;
  avgTimeOnPage: number;
  avgScrollDepth: number;
  deviceBreakdown: {
    mobile: number;
    tablet: number;
    desktop: number;
  };
  topSources: Array<{
    source: string;
    count: number;
  }>;
}

interface AnalyticsPanelProps {
  pageId: string;
}

export const AnalyticsPanel = ({ pageId }: AnalyticsPanelProps) => {
  const { toast } = useToast();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, [pageId]);

  const fetchAnalytics = async () => {
    try {
      const { data, error } = await supabase
        .from('cloned_page_analytics')
        .select('*')
        .eq('page_id', pageId);

      if (error) throw error;

      if (data) {
        // Calcular métricas
        const totalViews = data.length;
        const totalConversions = data.filter(d => d.converted).length;
        const conversionRate = totalViews > 0 ? (totalConversions / totalViews) * 100 : 0;
        
        const avgTimeOnPage = data.reduce((sum, d) => sum + (d.time_on_page || 0), 0) / (data.length || 1);
        const avgScrollDepth = data.reduce((sum, d) => sum + (d.scroll_depth || 0), 0) / (data.length || 1);

        // Device breakdown
        const devices = data.reduce((acc: any, d) => {
          const device = d.device_type || 'desktop';
          acc[device] = (acc[device] || 0) + 1;
          return acc;
        }, {});

        // Top sources
        const sources = data.reduce((acc: any, d) => {
          const source = d.utm_source || d.referrer || 'Direct';
          acc[source] = (acc[source] || 0) + 1;
          return acc;
        }, {});

        const topSources = Object.entries(sources)
          .map(([source, count]) => ({ source, count: count as number }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);

        setAnalytics({
          totalViews,
          totalConversions,
          conversionRate,
          avgTimeOnPage: Math.round(avgTimeOnPage),
          avgScrollDepth: Math.round(avgScrollDepth),
          deviceBreakdown: {
            mobile: devices.mobile || 0,
            tablet: devices.tablet || 0,
            desktop: devices.desktop || 0,
          },
          topSources
        });
      }
    } catch (error: any) {
      toast({
        title: "Erro ao carregar analytics",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Carregando analytics...</div>;
  }

  if (!analytics) {
    return <div className="text-center py-8">Nenhum dado disponível</div>;
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Analytics Detalhado</h3>

      {/* Métricas principais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-3 rounded-lg">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{analytics.totalViews}</p>
              <p className="text-xs text-muted-foreground">Visualizações</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="bg-success/10 p-3 rounded-lg">
              <TrendingUp className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold">{analytics.totalConversions}</p>
              <p className="text-xs text-muted-foreground">Conversões</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="bg-warning/10 p-3 rounded-lg">
              <BarChart3 className="w-5 h-5 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold">{analytics.conversionRate.toFixed(1)}%</p>
              <p className="text-xs text-muted-foreground">Taxa de Conversão</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-500/10 p-3 rounded-lg">
              <Clock className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{analytics.avgTimeOnPage}s</p>
              <p className="text-xs text-muted-foreground">Tempo Médio</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Dispositivos */}
      <Card className="p-6">
        <h4 className="font-semibold mb-4">Dispositivos</h4>
        <div className="space-y-3">
          {Object.entries(analytics.deviceBreakdown).map(([device, count]) => (
            <div key={device} className="flex items-center justify-between">
              <span className="text-sm capitalize">{device === 'mobile' ? 'Mobile' : device === 'tablet' ? 'Tablet' : 'Desktop'}</span>
              <div className="flex items-center gap-3 flex-1 ml-4">
                <div className="flex-1 bg-muted rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full" 
                    style={{ width: `${(count / analytics.totalViews) * 100}%` }}
                  />
                </div>
                <span className="text-sm font-medium w-12 text-right">{count}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Top Sources */}
      <Card className="p-6">
        <h4 className="font-semibold mb-4">Principais Fontes de Tráfego</h4>
        <div className="space-y-3">
          {analytics.topSources.map((source, index) => (
            <div key={index} className="flex items-center justify-between">
              <span className="text-sm">{source.source}</span>
              <div className="flex items-center gap-3 flex-1 ml-4">
                <div className="flex-1 bg-muted rounded-full h-2">
                  <div 
                    className="bg-success h-2 rounded-full" 
                    style={{ width: `${(source.count / analytics.totalViews) * 100}%` }}
                  />
                </div>
                <span className="text-sm font-medium w-12 text-right">{source.count}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Scroll Depth */}
      <Card className="p-6">
        <h4 className="font-semibold mb-2">Profundidade Média de Rolagem</h4>
        <div className="flex items-center gap-3">
          <div className="flex-1 bg-muted rounded-full h-4">
            <div 
              className="bg-primary h-4 rounded-full" 
              style={{ width: `${analytics.avgScrollDepth}%` }}
            />
          </div>
          <span className="text-sm font-bold">{analytics.avgScrollDepth}%</span>
        </div>
      </Card>
    </div>
  );
};