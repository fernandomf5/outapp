import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { downloadReceiptPDF } from "@/utils/receiptPdfGenerator";
import { 
  DollarSign, FileText, Calendar, ChevronDown, ChevronUp, 
  CheckCircle2, Receipt, TrendingUp, Download 
} from "lucide-react";

interface SavedReceipt {
  id: string;
  receipt_number: string;
  receipt_data: any;
  total_amount: number;
  client_name: string | null;
  created_at: string;
}

interface PaymentHistoryBlockProps {
  customerId?: string;
  accentColor: string;
  cardTextColor: string;
  cardBackgroundColor: string;
}

export function PaymentHistoryBlock({ customerId, accentColor, cardTextColor, cardBackgroundColor }: PaymentHistoryBlockProps) {
  const [receipts, setReceipts] = useState<SavedReceipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedClient, setExpandedClient] = useState<string | null>(null);

  useEffect(() => {
    const fetchReceipts = async () => {
      if (!customerId) return;

      // Get client name from customers table
      const { data: customer } = await supabase
        .from('customers')
        .select('name, user_id')
        .eq('id', customerId)
        .single();

      if (!customer) { setLoading(false); return; }

      const { data } = await supabase
        .from('saved_receipts')
        .select('*')
        .eq('user_id', customer.user_id)
        .eq('client_name', customer.name)
        .order('created_at', { ascending: false });

      setReceipts((data as any[]) || []);
      setLoading(false);
    };

    fetchReceipts();
  }, [customerId]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const totalPaid = useMemo(() => receipts.reduce((sum, r) => sum + (r.total_amount || 0), 0), [receipts]);

  if (loading) {
    return (
      <div className="text-center py-8 animate-pulse" style={{ color: cardTextColor }}>
        <Receipt className="w-10 h-10 mx-auto mb-2 opacity-40" />
        <p className="text-sm">Carregando histórico...</p>
      </div>
    );
  }

  if (receipts.length === 0) {
    return (
      <div className="text-center py-8" style={{ color: cardTextColor }}>
        <Receipt className="w-10 h-10 mx-auto mb-3 opacity-40" />
        <p className="text-sm font-medium">Nenhum pagamento registrado</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { icon: DollarSign, label: "Total Pago", value: formatCurrency(totalPaid) },
          { icon: FileText, label: "Recibos", value: String(receipts.length) },
          { icon: TrendingUp, label: "Ticket Médio", value: formatCurrency(totalPaid / receipts.length) },
        ].map(({ icon: Icon, label, value }) => (
          <div
            key={label}
            className="rounded-lg p-3 text-center"
            style={{ backgroundColor: `${accentColor}15`, color: cardTextColor }}
          >
            <Icon className="w-4 h-4 mx-auto mb-1" style={{ color: accentColor }} />
            <p className="text-[10px] opacity-70">{label}</p>
            <p className="text-sm font-bold" style={{ color: accentColor }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Receipts list */}
      <ScrollArea className="max-h-[400px]">
        <div className="space-y-2">
          {receipts.map((r) => {
            const date = r.receipt_data?.date || r.created_at;
            const paymentMethod = r.receipt_data?.payment_method;
            const methodLabels: Record<string, string> = {
              pix: 'PIX', cash: 'Dinheiro', credit_card: 'Cartão Crédito',
              debit_card: 'Cartão Débito', bank_transfer: 'Transferência', boleto: 'Boleto', other: 'Outro',
            };

            return (
              <div
                key={r.id}
                className="flex items-center gap-3 p-3 rounded-lg border transition-colors"
                style={{ borderColor: `${accentColor}30`, color: cardTextColor }}
              >
                <div
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: accentColor }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{r.receipt_number}</p>
                    <Badge
                      className="text-[10px] h-5 border-0"
                      style={{ backgroundColor: `${accentColor}20`, color: accentColor }}
                    >
                      <CheckCircle2 className="w-3 h-3 mr-0.5" /> Pago
                    </Badge>
                  </div>
                  {r.receipt_data?.title && (
                    <p className="text-xs opacity-60 truncate max-w-[200px]">{r.receipt_data.title}</p>
                  )}
                  <div className="flex items-center gap-2 text-xs opacity-70 mt-0.5">
                    <span className="flex items-center gap-0.5">
                      <Calendar className="w-3 h-3" /> {new Date(date).toLocaleDateString('pt-BR')}
                    </span>
                    {paymentMethod && <span>• {methodLabels[paymentMethod] || paymentMethod}</span>}
                  </div>
                </div>
                <p className="font-bold text-sm flex-shrink-0" style={{ color: accentColor }}>
                  {formatCurrency(r.total_amount)}
                </p>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 flex-shrink-0"
                  title="Baixar PDF"
                  style={{ color: accentColor }}
                  onClick={() => {
                    try {
                      downloadReceiptPDF(r.receipt_data, r.receipt_data?.logo_url || undefined);
                    } catch {}
                  }}
                >
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
