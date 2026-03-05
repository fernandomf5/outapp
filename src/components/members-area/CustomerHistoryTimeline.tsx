import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, Package, CreditCard, Wrench, Clock, Receipt, Download, Eye } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { downloadReceiptPDF } from "@/utils/receiptPdfGenerator";

interface CustomerHistoryTimelineProps {
  customerId: string;
  primaryColor?: string;
}

interface HistoryItem {
  id: string;
  type: 'service' | 'purchase' | 'payment' | 'receipt';
  title: string;
  description?: string;
  amount?: number;
  date: string;
  status?: string;
  receiptData?: any;
}

export function CustomerHistoryTimeline({ customerId, primaryColor = '#8B5CF6' }: CustomerHistoryTimelineProps) {
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previewReceipt, setPreviewReceipt] = useState<any>(null);

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

      // Buscar recibos vinculados ao cliente
      const { data: customer } = await supabase
        .from('customers')
        .select('name, user_id')
        .eq('id', customerId)
        .single();

      let receiptsData: any[] = [];
      if (customer) {
        const { data: receipts } = await supabase
          .from('saved_receipts')
          .select('*')
          .eq('user_id', customer.user_id)
          .eq('client_name', customer.name)
          .order('created_at', { ascending: false });
        receiptsData = (receipts as any[]) || [];
      }

      // Combinar e formatar os dados
      const allItems: HistoryItem[] = [];

      if (services) {
        services.forEach((s: any) => {
          allItems.push({
            id: s.id,
            type: 'service',
            title: s.service_name || 'Serviço',
            description: s.notes || s.description,
            amount: s.price,
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
            description: `Qtd: ${p.quantity || 1}${p.unit_price ? ` • Unit: R$ ${Number(p.unit_price).toFixed(2)}` : ''}`,
            amount: p.total_price,
            date: p.purchase_date,
          });
        });
      }

      const receiptFingerprints = new Set<string>();

      receiptsData.forEach((r: any) => {
        const receiptTitle = r.receipt_data?.receipt_title || `Recibo ${r.receipt_number}`;
        const receiptDate = r.receipt_data?.date || r.created_at;
        const normalizedDate = String(receiptDate).slice(0, 10);
        const normalizedAmount = Number(r.total_amount || 0).toFixed(2);
        const normalizedTitle = String(receiptTitle).trim().toLowerCase();

        receiptFingerprints.add(`${normalizedDate}|${normalizedAmount}`);

        allItems.push({
          id: r.id,
          type: 'receipt',
          title: receiptTitle,
          description: r.receipt_number,
          amount: r.total_amount,
          date: receiptDate,
          status: 'paid',
          receiptData: r.receipt_data,
        });
      });

      if (payments) {
        payments.forEach((pay: any) => {
          const normalizedDate = String(pay.payment_date).slice(0, 10);
          const normalizedAmount = Number(pay.amount || 0).toFixed(2);
          const paymentFingerprint = `${normalizedDate}|${normalizedAmount}`;

          if (receiptFingerprints.has(paymentFingerprint)) return;

          allItems.push({
            id: pay.id,
            type: 'payment',
            title: pay.description || 'Pagamento',
            description: pay.payment_method || pay.notes,
            amount: pay.amount,
            date: pay.payment_date,
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
      case 'service': return <Wrench className="w-4 h-4" />;
      case 'purchase': return <Package className="w-4 h-4" />;
      case 'payment': return <CreditCard className="w-4 h-4" />;
      case 'receipt': return <Receipt className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'service': return 'Serviço';
      case 'purchase': return 'Compra';
      case 'payment': return 'Pagamento';
      case 'receipt': return 'Recibo';
      default: return type;
    }
  };

  const getStatusLabel = (status: string): string => {
    const labels: Record<string, string> = {
      completed: 'Concluído',
      pending: 'Pendente',
      in_progress: 'Em Andamento',
      scheduled: 'Agendado',
      cancelled: 'Cancelado',
      paid: 'Pago',
      overdue: 'Atrasado',
    };
    return labels[status.toLowerCase()] || status;
  };

  const getStatusBadge = (status?: string) => {
    if (!status) return null;
    const statusColors: Record<string, string> = {
      completed: 'bg-green-500/10 text-green-500',
      pending: 'bg-yellow-500/10 text-yellow-500',
      in_progress: 'bg-yellow-500/10 text-yellow-500',
      scheduled: 'bg-blue-500/10 text-blue-500',
      cancelled: 'bg-red-500/10 text-red-500',
      paid: 'bg-green-500/10 text-green-500',
      overdue: 'bg-red-500/10 text-red-500',
    };
    return (
      <Badge className={statusColors[status.toLowerCase()] || 'bg-muted text-muted-foreground'}>
        {getStatusLabel(status)}
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
    <ScrollArea className="w-full whitespace-nowrap">
      <div className="relative pb-4">
        {/* Timeline horizontal line */}
        <div 
          className="absolute top-6 left-0 right-0 h-0.5"
          style={{ backgroundColor: `${primaryColor}30` }}
        />

        <div className="flex gap-4 px-2">
          {historyItems.map((item) => (
            <div key={item.id} className="relative flex-shrink-0 w-64">
              {/* Timeline dot */}
              <div 
                className="absolute left-1/2 -translate-x-1/2 top-4 w-4 h-4 rounded-full border-2 bg-background z-10"
                style={{ borderColor: primaryColor }}
              />

              <Card className="mt-10">
                <CardContent className="pt-4 pb-3">
                  <div className="flex items-center gap-2 mb-2">
                    <div 
                      className="p-1.5 rounded-md flex-shrink-0" 
                      style={{ backgroundColor: `${primaryColor}15` }}
                    >
                      {getIcon(item.type)}
                    </div>
                    <span className="text-xs text-muted-foreground truncate">
                      {getTypeLabel(item.type)}
                    </span>
                    {getStatusBadge(item.status)}
                  </div>
                  <h4 className="font-medium text-sm truncate whitespace-normal line-clamp-2">{item.title}</h4>
                  {item.description && (
                    <p className="text-xs text-muted-foreground mt-1 truncate whitespace-normal line-clamp-2">
                      {item.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between mt-2 gap-2">
                    <p className="text-xs text-muted-foreground">
                      {(() => {
                        const d = item.date;
                        if (typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d)) {
                          const [y, m, day] = d.split('-');
                          return `${day}/${m}/${y}`;
                        }
                        if (typeof d === 'string' && d.includes('-')) {
                          const parts = d.split('T')[0].split('-');
                          return `${parts[2]}/${parts[1]}/${parts[0]}`;
                        }
                        return format(new Date(d), "dd/MM/yyyy", { locale: ptBR });
                      })()}
                    </p>
                    {item.amount !== undefined && item.amount > 0 && (
                      <span className="font-semibold text-sm flex-shrink-0" style={{ color: primaryColor }}>
                        R$ {item.amount.toFixed(2)}
                      </span>
                    )}
                  </div>
                  {item.type === 'receipt' && item.receiptData && (
                    <div className="flex gap-1 mt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs flex-1"
                        onClick={() => setPreviewReceipt(item.receiptData)}
                      >
                        <Eye className="w-3 h-3 mr-1" /> Ver
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs flex-1"
                        onClick={() => {
                          try { downloadReceiptPDF(item.receiptData, item.receiptData?.logo_url); } catch {}
                        }}
                      >
                        <Download className="w-3 h-3 mr-1" /> PDF
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>
      <ScrollBar orientation="horizontal" />

      {/* Receipt Full Preview Dialog */}
      <Dialog open={!!previewReceipt} onOpenChange={() => setPreviewReceipt(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto p-0">
          {previewReceipt && (() => {
            const r = previewReceipt;
            const dateStr = r.date?.includes('-') ? r.date.split('-').reverse().join('/') : r.date;
            const items = r.items || [];
            const subtotal = items.reduce((s: number, i: any) => s + i.quantity * i.unit_price, 0);
            const discountValue = r.discount_value || 0;
            const discountAmount = r.discount_type === 'percentage' ? (subtotal * discountValue) / 100 : discountValue;
            const total = Math.max(0, subtotal - discountAmount);
            const paymentLabels: Record<string, string> = {
              pix: 'PIX', cash: 'Dinheiro', credit_card: 'Cartão de Crédito',
              debit_card: 'Cartão de Débito', bank_transfer: 'Transferência Bancária',
              boleto: 'Boleto', other: 'Outro',
            };

            return (
              <div className="flex flex-col">
                {/* Header */}
                <div className="p-6 text-white" style={{ backgroundColor: r.primary_color || primaryColor }}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {r.logo_url && (
                        <img src={r.logo_url} alt="Logo" className="w-12 h-12 object-contain rounded bg-white/20 p-1" />
                      )}
                      <div>
                        <h2 className="text-xl font-bold">{r.receipt_title || 'RECIBO'}</h2>
                        <p className="text-white/80 text-sm">Nº {r.receipt_number}</p>
                      </div>
                    </div>
                    <div className="text-right text-sm text-white/80">
                      <p>Data: {dateStr}</p>
                    </div>
                  </div>
                </div>

                <div className="p-6 space-y-5">
                  {/* Company Info */}
                  {(r.company_name || r.company_document) && (
                    <div className="space-y-1">
                      {r.company_name && <p className="font-semibold text-sm">{r.company_name}</p>}
                      {r.company_document && <p className="text-xs text-muted-foreground">CNPJ/CPF: {r.company_document}</p>}
                      {r.company_address && <p className="text-xs text-muted-foreground">{r.company_address}</p>}
                      {r.company_phone && <p className="text-xs text-muted-foreground">Tel: {r.company_phone}</p>}
                    </div>
                  )}

                  {/* Client Info */}
                  <div className="bg-muted/50 rounded-lg p-4 space-y-1">
                    <p className="font-semibold text-sm mb-2">CLIENTE</p>
                    {r.client_name && <p className="text-sm">Nome: {r.client_name}</p>}
                    {r.client_document && <p className="text-xs text-muted-foreground">CPF/CNPJ: {r.client_document}</p>}
                    {r.client_address && <p className="text-xs text-muted-foreground">Endereço: {r.client_address}</p>}
                    {r.client_email && <p className="text-xs text-muted-foreground">Email: {r.client_email}</p>}
                    {r.client_phone && <p className="text-xs text-muted-foreground">Tel: {r.client_phone}</p>}
                  </div>

                  {/* Items Table */}
                  {items.length > 0 && (
                    <div className="border rounded-lg overflow-hidden">
                      <div className="grid grid-cols-[1fr_60px_80px_80px] text-xs font-bold text-white p-2" style={{ backgroundColor: r.primary_color || primaryColor }}>
                        <span>Descrição</span>
                        <span className="text-center">Qtd</span>
                        <span className="text-right">Valor Unit.</span>
                        <span className="text-right">Subtotal</span>
                      </div>
                      {items.map((item: any, i: number) => (
                        <div key={i} className="grid grid-cols-[1fr_60px_80px_80px] text-xs p-2 border-b last:border-b-0">
                          <span>{item.description || '-'}</span>
                          <span className="text-center">{item.quantity}</span>
                          <span className="text-right">R$ {Number(item.unit_price).toFixed(2)}</span>
                          <span className="text-right">R$ {(item.quantity * item.unit_price).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Totals */}
                  <div className="border-t pt-3 space-y-1">
                    {discountAmount > 0 && (
                      <>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Subtotal:</span>
                          <span>R$ {subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm text-red-500">
                          <span>Desconto{r.discount_type === 'percentage' ? ` (${discountValue}%)` : ''}:</span>
                          <span>- R$ {discountAmount.toFixed(2)}</span>
                        </div>
                      </>
                    )}
                    <div className="flex justify-between text-base font-bold pt-1">
                      <span>TOTAL:</span>
                      <span style={{ color: r.primary_color || primaryColor }}>R$ {total.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Payment Method */}
                  {r.payment_method && (
                    <p className="text-sm">
                      <span className="text-muted-foreground">Forma de Pagamento:</span>{' '}
                      {paymentLabels[r.payment_method] || r.payment_method}
                    </p>
                  )}

                  {/* Notes */}
                  {r.notes && (
                    <p className="text-xs text-muted-foreground italic border-l-2 pl-3" style={{ borderColor: r.primary_color || primaryColor }}>
                      Observações: {r.notes}
                    </p>
                  )}

                  {/* Warranty */}
                  {r.warranty_text && (
                    <div className="space-y-1">
                      <p className="text-xs font-bold" style={{ color: r.primary_color || primaryColor }}>GARANTIA / LAUDO</p>
                      <p className="text-xs text-muted-foreground">{r.warranty_text}</p>
                    </div>
                  )}

                  {/* Terms */}
                  {r.terms_text && (
                    <div className="space-y-1">
                      <p className="text-xs font-bold" style={{ color: r.primary_color || primaryColor }}>TERMOS E CONDIÇÕES</p>
                      <p className="text-xs text-muted-foreground">{r.terms_text}</p>
                    </div>
                  )}

                  {/* Signatures */}
                  <div className="grid grid-cols-2 gap-8 pt-6">
                    <div className="text-center">
                      <div className="border-t border-foreground/30 pt-2">
                        <p className="text-xs">{r.issuer_signer_name || r.company_name || 'Emissor'}</p>
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="border-t border-foreground/30 pt-2">
                        <p className="text-xs">{r.client_signer_name || r.client_name || 'Cliente'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Download Button */}
                  <Button
                    className="w-full"
                    style={{ backgroundColor: r.primary_color || primaryColor }}
                    onClick={() => {
                      try { downloadReceiptPDF(r, r?.logo_url); } catch {}
                    }}
                  >
                    <Download className="w-4 h-4 mr-2" /> Baixar PDF
                  </Button>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </ScrollArea>
  );
}
