import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Package, CreditCard, Wrench, Clock } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface CustomerHistoryTimelineProps {
  customerId: string;
  primaryColor?: string;
}

interface HistoryItem {
  id: string;
  type: 'service' | 'purchase' | 'payment';
  title: string;
  description?: string;
  amount?: number;
  date: string;
  status?: string;
}

export function CustomerHistoryTimeline({ customerId, primaryColor = '#8B5CF6' }: CustomerHistoryTimelineProps) {
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (customerId) {
      loadHistory();
    }
  }, [customerId]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      setError(null);

      // Buscar histórico de serviços
      const { data: services, error: servicesError } = await supabase
        .from('customer_services_history')
        .select('*')
        .eq('customer_id', customerId)
        .order('service_date', { ascending: false });

      if (servicesError) throw servicesError;

      // Buscar histórico de compras
      const { data: purchases, error: purchasesError } = await supabase
        .from('customer_purchases_history')
        .select('*')
        .eq('customer_id', customerId)
        .order('purchase_date', { ascending: false });

      if (purchasesError) throw purchasesError;

      // Buscar histórico de pagamentos
      const { data: payments, error: paymentsError } = await supabase
        .from('customer_payments_history')
        .select('*')
        .eq('customer_id', customerId)
        .order('payment_date', { ascending: false });

      if (paymentsError) throw paymentsError;

      // Combinar e formatar os dados
      const allItems: HistoryItem[] = [];

      if (services) {
        services.forEach((s: any) => {
          allItems.push({
            id: s.id,
            type: 'service',
            title: s.service_name || 'Serviço',
            description: s.notes,
            amount: s.value,
            date: s.service_date,
            status: s.status,
          });
        });
      }

      if (purchases) {
        purchases.forEach((p: any) => {
          allItems.push({
            id: p.id,
            type: 'purchase',
            title: p.product_name || 'Compra',
            description: `Qtd: ${p.quantity || 1}`,
            amount: p.total_value,
            date: p.purchase_date,
            status: p.status,
          });
        });
      }

      if (payments) {
        payments.forEach((pay: any) => {
          allItems.push({
            id: pay.id,
            type: 'payment',
            title: pay.description || 'Pagamento',
            description: pay.payment_method,
            amount: pay.amount,
            date: pay.payment_date,
            status: pay.status,
          });
        });
      }

      // Ordenar por data (mais recente primeiro)
      allItems.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      setHistoryItems(allItems);
    } catch (err: any) {
      console.error('Error loading customer history:', err);
      setError(err.message || 'Erro ao carregar histórico');
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'service':
        return <Wrench className="w-4 h-4" />;
      case 'purchase':
        return <Package className="w-4 h-4" />;
      case 'payment':
        return <CreditCard className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'service':
        return 'Serviço';
      case 'purchase':
        return 'Compra';
      case 'payment':
        return 'Pagamento';
      default:
        return type;
    }
  };

  const getStatusBadge = (status?: string) => {
    if (!status) return null;
    const statusColors: Record<string, string> = {
      completed: 'bg-green-500/10 text-green-500',
      pending: 'bg-yellow-500/10 text-yellow-500',
      cancelled: 'bg-red-500/10 text-red-500',
      paid: 'bg-green-500/10 text-green-500',
      concluido: 'bg-green-500/10 text-green-500',
      pendente: 'bg-yellow-500/10 text-yellow-500',
      cancelado: 'bg-red-500/10 text-red-500',
      pago: 'bg-green-500/10 text-green-500',
    };
    return (
      <Badge className={statusColors[status.toLowerCase()] || 'bg-muted text-muted-foreground'}>
        {status}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>{error}</p>
      </div>
    );
  }

  if (historyItems.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>Nenhum histórico encontrado para este cliente</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Timeline line */}
      <div 
        className="absolute left-4 top-0 bottom-0 w-0.5"
        style={{ backgroundColor: `${primaryColor}30` }}
      />

      <div className="space-y-4">
        {historyItems.map((item, index) => (
          <div key={item.id} className="relative pl-10">
            {/* Timeline dot */}
            <div 
              className="absolute left-2.5 w-3 h-3 rounded-full border-2 bg-background"
              style={{ borderColor: primaryColor }}
            />

            <Card>
              <CardContent className="pt-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div 
                        className="p-1.5 rounded-md" 
                        style={{ backgroundColor: `${primaryColor}15` }}
                      >
                        {getIcon(item.type)}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {getTypeLabel(item.type)}
                      </span>
                      {getStatusBadge(item.status)}
                    </div>
                    <h4 className="font-medium">{item.title}</h4>
                    {item.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {item.description}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
                      {format(new Date(item.date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </p>
                  </div>
                  {item.amount !== undefined && item.amount > 0 && (
                    <div className="text-right">
                      <span className="font-semibold" style={{ color: primaryColor }}>
                        R$ {item.amount.toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
}
