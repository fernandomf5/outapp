import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DeleteConfirmDialog } from "@/components/ui/delete-confirm-dialog";
import { useToast } from "@/hooks/use-toast";
import { downloadReceiptPDF } from "@/utils/receiptPdfGenerator";
import { 
  Users, Building2, Search, Calendar, DollarSign, 
  TrendingUp, FileText, ChevronDown, ChevronUp, Receipt, X, CheckCircle2, Clock, Edit, Trash2, Download 
} from "lucide-react";

interface SavedReceipt {
  id: string;
  receipt_number: string;
  receipt_data: any;
  total_amount: number;
  client_name: string | null;
  created_at: string;
  updated_at: string;
}

interface PaymentHistoryPanelProps {
  receipts: SavedReceipt[];
  onLoadReceipt: (receipt: SavedReceipt) => void;
  onEditReceipt?: (receipt: SavedReceipt) => void;
  onDeleteReceipt?: (id: string) => void;
}

interface ClientGroup {
  clientName: string;
  businessName: string;
  receipts: SavedReceipt[];
  totalPaid: number;
  receiptCount: number;
  firstDate: string;
  lastDate: string;
}

export function PaymentHistoryPanel({ receipts, onLoadReceipt, onEditReceipt, onDeleteReceipt }: PaymentHistoryPanelProps) {
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterClient, setFilterClient] = useState('all');
  const [filterBusiness, setFilterBusiness] = useState('all');
  const [filterMonth, setFilterMonth] = useState('all');
  const [expandedClient, setExpandedClient] = useState<string | null>(null);
  const { toast } = useToast();

  const handleDownloadPDF = (r: SavedReceipt) => {
    try {
      downloadReceiptPDF(r.receipt_data, r.receipt_data?.logo_url || undefined);
      toast({ title: "PDF baixado!", description: `Recibo ${r.receipt_number} baixado com sucesso.` });
    } catch (err) {
      toast({ title: "Erro ao gerar PDF", variant: "destructive" });
    }
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  // Extract unique values
  const uniqueClients = useMemo(() => 
    [...new Set(receipts.map(r => r.client_name).filter(Boolean))] as string[],
    [receipts]
  );

  const uniqueBusinesses = useMemo(() => 
    [...new Set(receipts.map(r => r.receipt_data?.company_name).filter(Boolean))] as string[],
    [receipts]
  );

  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    receipts.forEach(r => {
      const date = r.receipt_data?.date || r.created_at;
      if (date) {
        const d = new Date(date);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        months.add(key);
      }
    });
    return [...months].sort().reverse();
  }, [receipts]);

  const formatMonth = (key: string) => {
    const [year, month] = key.split('-');
    const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    return `${monthNames[parseInt(month) - 1]} ${year}`;
  };

  // Group receipts by client
  const clientGroups = useMemo(() => {
    const filtered = receipts.filter(r => {
      if (filterClient !== 'all' && r.client_name !== filterClient) return false;
      if (filterBusiness !== 'all' && r.receipt_data?.company_name !== filterBusiness) return false;
      if (filterMonth !== 'all') {
        const date = r.receipt_data?.date || r.created_at;
        if (date) {
          const d = new Date(date);
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
          if (key !== filterMonth) return false;
        }
      }
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          (r.client_name || '').toLowerCase().includes(q) ||
          r.receipt_number.toLowerCase().includes(q) ||
          (r.receipt_data?.company_name || '').toLowerCase().includes(q)
        );
      }
      return true;
    });

    const groups: Record<string, ClientGroup> = {};

    filtered.forEach(r => {
      const key = r.client_name || 'Sem Cliente';
      if (!groups[key]) {
        groups[key] = {
          clientName: key,
          businessName: r.receipt_data?.company_name || '',
          receipts: [],
          totalPaid: 0,
          receiptCount: 0,
          firstDate: r.receipt_data?.date || r.created_at,
          lastDate: r.receipt_data?.date || r.created_at,
        };
      }
      groups[key].receipts.push(r);
      groups[key].totalPaid += r.total_amount || 0;
      groups[key].receiptCount += 1;

      const date = r.receipt_data?.date || r.created_at;
      if (date < groups[key].firstDate) groups[key].firstDate = date;
      if (date > groups[key].lastDate) groups[key].lastDate = date;
    });

    // Sort receipts within each group by date desc
    Object.values(groups).forEach(g => {
      g.receipts.sort((a, b) => {
        const da = a.receipt_data?.date || a.created_at;
        const db = b.receipt_data?.date || b.created_at;
        return db.localeCompare(da);
      });
    });

    return Object.values(groups).sort((a, b) => b.totalPaid - a.totalPaid);
  }, [receipts, filterClient, filterBusiness, filterMonth, searchQuery]);

  const totalGeral = clientGroups.reduce((sum, g) => sum + g.totalPaid, 0);
  const totalRecibos = clientGroups.reduce((sum, g) => sum + g.receiptCount, 0);

  const hasFilters = filterClient !== 'all' || filterBusiness !== 'all' || filterMonth !== 'all' || searchQuery;

  if (receipts.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Receipt className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p className="font-medium">Nenhum recibo salvo</p>
        <p className="text-xs mt-1">Salve recibos para visualizar o histórico de pagamentos.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card>
          <CardContent className="pt-3 pb-3 px-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <DollarSign className="w-3 h-3" /> Total Recebido
            </div>
            <p className="text-lg font-bold text-primary">{formatCurrency(totalGeral)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-3 pb-3 px-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <FileText className="w-3 h-3" /> Recibos
            </div>
            <p className="text-lg font-bold">{totalRecibos}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-3 pb-3 px-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <Users className="w-3 h-3" /> Clientes
            </div>
            <p className="text-lg font-bold">{clientGroups.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-3 pb-3 px-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <TrendingUp className="w-3 h-3" /> Ticket Médio
            </div>
            <p className="text-lg font-bold">{totalRecibos > 0 ? formatCurrency(totalGeral / totalRecibos) : 'R$ 0,00'}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por cliente, número ou empresa..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {uniqueClients.length > 0 && (
            <div>
              <Label className="text-xs flex items-center gap-1 mb-1"><Users className="w-3 h-3" /> Cliente</Label>
              <Select value={filterClient} onValueChange={setFilterClient}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {uniqueClients.map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
          {uniqueBusinesses.length > 0 && (
            <div>
              <Label className="text-xs flex items-center gap-1 mb-1"><Building2 className="w-3 h-3" /> Negócio</Label>
              <Select value={filterBusiness} onValueChange={setFilterBusiness}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {uniqueBusinesses.map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
          {availableMonths.length > 0 && (
            <div>
              <Label className="text-xs flex items-center gap-1 mb-1"><Calendar className="w-3 h-3" /> Mês</Label>
              <Select value={filterMonth} onValueChange={setFilterMonth}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {availableMonths.map(m => <SelectItem key={m} value={m}>{formatMonth(m)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        {hasFilters && (
          <Button variant="ghost" size="sm" className="text-xs" onClick={() => { setFilterClient('all'); setFilterBusiness('all'); setFilterMonth('all'); setSearchQuery(''); }}>
            <X className="w-3 h-3 mr-1" /> Limpar filtros
          </Button>
        )}
      </div>

      {/* Client groups */}
      <ScrollArea className="max-h-[50vh]">
        <div className="space-y-3 pr-2">
          {clientGroups.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Nenhum resultado encontrado.</p>
            </div>
          ) : (
            clientGroups.map(group => {
              const isExpanded = expandedClient === group.clientName;
              return (
                <Card key={group.clientName} className="overflow-hidden">
                  <button
                    className="w-full text-left p-4 hover:bg-muted/30 transition-colors"
                    onClick={() => setExpandedClient(isExpanded ? null : group.clientName)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Users className="w-5 h-5 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-sm truncate">{group.clientName}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            {group.businessName && (
                              <span className="flex items-center gap-0.5">
                                <Building2 className="w-3 h-3" /> {group.businessName}
                              </span>
                            )}
                            <span>{group.receiptCount} recibo{group.receiptCount > 1 ? 's' : ''}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="font-bold text-sm text-primary">{formatCurrency(group.totalPaid)}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {new Date(group.firstDate).toLocaleDateString('pt-BR')} - {new Date(group.lastDate).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                      </div>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="border-t">
                      <div className="p-3 space-y-2">
                        {group.receipts.map((r, idx) => {
                          const date = r.receipt_data?.date || r.created_at;
                          const paymentMethod = r.receipt_data?.payment_method;
                          const methodLabels: Record<string, string> = {
                            pix: 'PIX', cash: 'Dinheiro', credit_card: 'Cartão Crédito',
                            debit_card: 'Cartão Débito', bank_transfer: 'Transferência', boleto: 'Boleto', other: 'Outro',
                          };

                          return (
                            <div
                              key={r.id}
                              className="flex items-center gap-3 p-2.5 rounded-lg border hover:bg-muted/30 transition-colors cursor-pointer"
                              onClick={() => onLoadReceipt(r)}
                            >
                              {/* Timeline indicator */}
                              <div className="flex flex-col items-center gap-1">
                                <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                                {idx < group.receipts.length - 1 && (
                                  <div className="w-px h-4 bg-border" />
                                )}
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="text-sm font-medium">{r.receipt_number}</p>
                                  <Badge variant="outline" className="text-[10px] h-5">
                                    <CheckCircle2 className="w-3 h-3 mr-0.5" /> Pago
                                  </Badge>
                                </div>
                                {(r.receipt_data?.receipt_title || r.receipt_data?.title) && (
                                  <p className="text-xs text-muted-foreground truncate max-w-[200px]">{r.receipt_data.receipt_title || r.receipt_data.title}</p>
                                )}
                                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                                  <span className="flex items-center gap-0.5">
                                    <Calendar className="w-3 h-3" /> {new Date(date).toLocaleDateString('pt-BR')}
                                  </span>
                                  {paymentMethod && (
                                    <span>• {methodLabels[paymentMethod] || paymentMethod}</span>
                                  )}
                                </div>
                              </div>

                              <p className="font-semibold text-sm text-primary flex-shrink-0">
                                {formatCurrency(r.total_amount)}
                              </p>

                              {/* Download, Edit & Delete buttons */}
                              <div className="flex items-center gap-1 flex-shrink-0" onClick={e => e.stopPropagation()}>
                                <Button variant="ghost" size="icon" className="h-7 w-7" title="Baixar PDF" onClick={() => handleDownloadPDF(r)}>
                                  <Download className="w-3.5 h-3.5" />
                                </Button>
                                {onEditReceipt && (
                                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEditReceipt(r)}>
                                    <Edit className="w-3.5 h-3.5" />
                                  </Button>
                                )}
                                {onDeleteReceipt && (
                                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleteConfirmId(r.id)}>
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Group summary */}
                      <div className="bg-muted/30 px-4 py-2.5 border-t flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          {group.receiptCount} pagamento{group.receiptCount > 1 ? 's' : ''} registrado{group.receiptCount > 1 ? 's' : ''}
                        </span>
                        <span className="text-sm font-bold text-primary">
                          Total: {formatCurrency(group.totalPaid)}
                        </span>
                      </div>
                    </div>
                  )}
                </Card>
              );
            })
          )}
        </div>
      </ScrollArea>

      <DeleteConfirmDialog
        open={!!deleteConfirmId}
        onOpenChange={(open) => { if (!open) setDeleteConfirmId(null); }}
        onConfirm={() => {
          if (deleteConfirmId && onDeleteReceipt) {
            onDeleteReceipt(deleteConfirmId);
            setDeleteConfirmId(null);
          }
        }}
        title="Excluir recibo?"
        description="Tem certeza que deseja excluir este recibo? Esta ação não pode ser desfeita."
        className="z-[200]"
      />
    </div>
  );
}
