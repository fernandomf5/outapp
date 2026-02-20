import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Plus, Edit2, Trash2, CalendarIcon, DollarSign, Users, Clock, AlertTriangle, CheckCircle, CreditCard, Eye } from "lucide-react";

interface Debtor {
  id: string;
  user_id: string;
  business_id: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  description: string | null;
  amount: number;
  due_date: string | null;
  status: 'pending' | 'partial' | 'paid' | 'overdue' | 'cancelled';
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface DebtorPayment {
  id: string;
  debtor_id: string;
  amount: number;
  payment_date: string;
  payment_method: string | null;
  notes: string | null;
  created_at: string;
}

interface DebtorsPanelProps {
  businessId: string;
  teamContext?: {
    adminUserId: string;
    allowedIds: string[];
  };
}

export const DebtorsPanel = ({ businessId, teamContext }: DebtorsPanelProps) => {
  const [debtors, setDebtors] = useState<Debtor[]>([]);
  const [payments, setPayments] = useState<Record<string, DebtorPayment[]>>({});
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [isPaymentsListOpen, setIsPaymentsListOpen] = useState(false);
  const [selectedDebtor, setSelectedDebtor] = useState<Debtor | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    description: '',
    amount: '',
    due_date: '',
    notes: ''
  });

  const [paymentFormData, setPaymentFormData] = useState({
    amount: '',
    payment_date: format(new Date(), 'yyyy-MM-dd'),
    payment_method: 'pix',
    notes: ''
  });

  useEffect(() => {
    loadDebtors();
  }, [businessId]);

  const loadDebtors = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const targetUserId = teamContext?.adminUserId || user.id;

      const { data, error } = await supabase
        .from('financial_debtors')
        .select('*')
        .eq('user_id', targetUserId)
        .eq('business_id', businessId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDebtors((data || []) as Debtor[]);

      // Load payments for each debtor
      if (data && data.length > 0) {
        const debtorIds = data.map(d => d.id);
        const { data: paymentsData, error: paymentsError } = await supabase
          .from('financial_debtor_payments')
          .select('*')
          .in('debtor_id', debtorIds)
          .order('payment_date', { ascending: false });

        if (!paymentsError && paymentsData) {
          const grouped: Record<string, DebtorPayment[]> = {};
          paymentsData.forEach((p: DebtorPayment) => {
            if (!grouped[p.debtor_id]) grouped[p.debtor_id] = [];
            grouped[p.debtor_id].push(p);
          });
          setPayments(grouped);
        }
      }
    } catch (error: any) {
      toast.error('Erro ao carregar devedores');
    } finally {
      setLoading(false);
    }
  };

  const handleAddDebtor = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('financial_debtors')
        .insert({
          user_id: user.id,
          business_id: businessId,
          name: formData.name,
          email: formData.email || null,
          phone: formData.phone || null,
          description: formData.description || null,
          amount: parseFloat(formData.amount) || 0,
          due_date: formData.due_date || null,
          notes: formData.notes || null,
          status: 'pending'
        });

      if (error) throw error;

      toast.success('Devedor cadastrado com sucesso!');
      setIsAddDialogOpen(false);
      resetForm();
      loadDebtors();
    } catch (error: any) {
      toast.error('Erro ao cadastrar devedor');
    }
  };

  const handleEditDebtor = async () => {
    if (!selectedDebtor) return;
    
    try {
      const { error } = await supabase
        .from('financial_debtors')
        .update({
          name: formData.name,
          email: formData.email || null,
          phone: formData.phone || null,
          description: formData.description || null,
          amount: parseFloat(formData.amount) || 0,
          due_date: formData.due_date || null,
          notes: formData.notes || null
        })
        .eq('id', selectedDebtor.id);

      if (error) throw error;

      toast.success('Devedor atualizado!');
      setIsEditDialogOpen(false);
      resetForm();
      loadDebtors();
    } catch (error: any) {
      toast.error('Erro ao atualizar devedor');
    }
  };

  const handleDeleteDebtor = async (id: string) => {
    if (!confirm('Deseja excluir este devedor e todos os pagamentos relacionados?')) return;

    try {
      const { error } = await supabase
        .from('financial_debtors')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Devedor excluído!');
      loadDebtors();
    } catch (error: any) {
      toast.error('Erro ao excluir devedor');
    }
  };

  const handleAddPayment = async () => {
    if (!selectedDebtor) return;

    try {
      const paymentAmount = parseFloat(paymentFormData.amount) || 0;
      const totalPaid = (payments[selectedDebtor.id] || []).reduce((sum, p) => sum + Number(p.amount), 0) + paymentAmount;
      const newStatus = totalPaid >= Number(selectedDebtor.amount) ? 'paid' : 'partial';

      const { error: paymentError } = await supabase
        .from('financial_debtor_payments')
        .insert({
          debtor_id: selectedDebtor.id,
          amount: paymentAmount,
          payment_date: paymentFormData.payment_date,
          payment_method: paymentFormData.payment_method || null,
          notes: paymentFormData.notes || null
        });

      if (paymentError) throw paymentError;

      const { error: updateError } = await supabase
        .from('financial_debtors')
        .update({ status: newStatus })
        .eq('id', selectedDebtor.id);

      if (updateError) throw updateError;

      toast.success('Pagamento registrado!');
      setIsPaymentDialogOpen(false);
      setPaymentFormData({
        amount: '',
        payment_date: format(new Date(), 'yyyy-MM-dd'),
        payment_method: 'pix',
        notes: ''
      });
      loadDebtors();
    } catch (error: any) {
      toast.error('Erro ao registrar pagamento');
    }
  };

  const handleUpdateStatus = async (debtor: Debtor, newStatus: Debtor['status']) => {
    try {
      const { error } = await supabase
        .from('financial_debtors')
        .update({ status: newStatus })
        .eq('id', debtor.id);

      if (error) throw error;
      loadDebtors();
    } catch (error: any) {
      toast.error('Erro ao atualizar status');
    }
  };

  const openEditDialog = (debtor: Debtor) => {
    setSelectedDebtor(debtor);
    setFormData({
      name: debtor.name,
      email: debtor.email || '',
      phone: debtor.phone || '',
      description: debtor.description || '',
      amount: debtor.amount.toString(),
      due_date: debtor.due_date || '',
      notes: debtor.notes || ''
    });
    setIsEditDialogOpen(true);
  };

  const openPaymentDialog = (debtor: Debtor) => {
    setSelectedDebtor(debtor);
    const remaining = Number(debtor.amount) - (payments[debtor.id] || []).reduce((sum, p) => sum + Number(p.amount), 0);
    setPaymentFormData({
      amount: remaining > 0 ? remaining.toFixed(2) : '',
      payment_date: format(new Date(), 'yyyy-MM-dd'),
      payment_method: 'pix',
      notes: ''
    });
    setIsPaymentDialogOpen(true);
  };

  const openPaymentsList = (debtor: Debtor) => {
    setSelectedDebtor(debtor);
    setIsPaymentsListOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      description: '',
      amount: '',
      due_date: '',
      notes: ''
    });
    setSelectedDebtor(null);
  };

  const getStatusBadge = (debtor: Debtor) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      pending: { label: 'Pendente', className: 'bg-yellow-500' },
      partial: { label: 'Parcial', className: 'bg-blue-500' },
      paid: { label: 'Pago', className: 'bg-green-500' },
      overdue: { label: 'Atrasado', className: 'bg-red-500' },
      cancelled: { label: 'Cancelado', className: 'bg-gray-500' }
    };
    
    const config = statusConfig[debtor.status] || statusConfig.pending;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const getRemainingAmount = (debtor: Debtor) => {
    const paid = (payments[debtor.id] || []).reduce((sum, p) => sum + Number(p.amount), 0);
    return Number(debtor.amount) - paid;
  };

  const getDaysOverdue = (debtor: Debtor) => {
    if (!debtor.due_date) return null;
    const days = differenceInDays(new Date(), new Date(debtor.due_date));
    return days > 0 ? days : null;
  };

  const filteredDebtors = debtors.filter(d => {
    if (statusFilter === 'all') return true;
    return d.status === statusFilter;
  });

  // Totais - considera pagamentos registrados E devedores com status 'paid' ou 'cancelled' sem pagamentos
  const totalToReceive = debtors.reduce((sum, d) => sum + Number(d.amount), 0);

  const totalReceived = debtors.reduce((sum, debtor) => {
    const paymentsForDebtor = (payments[debtor.id] || []).reduce((s, p) => s + Number(p.amount), 0);
    if (paymentsForDebtor > 0) {
      // Tem pagamentos registrados — usa o valor real pago
      return sum + paymentsForDebtor;
    } else if (debtor.status === 'paid' || debtor.status === 'cancelled') {
      // Status marcado manualmente sem pagamento registrado — considera o valor total como recebido
      return sum + Number(debtor.amount);
    }
    return sum;
  }, 0);

  const totalPending = debtors.reduce((sum, debtor) => {
    if (debtor.status === 'paid' || debtor.status === 'cancelled') return sum;
    const paymentsForDebtor = (payments[debtor.id] || []).reduce((s, p) => s + Number(p.amount), 0);
    const remaining = Number(debtor.amount) - paymentsForDebtor;
    return sum + (remaining > 0 ? remaining : 0);
  }, 0);

  const overdueCount = debtors.filter(d => d.status === 'overdue' || (d.due_date && new Date(d.due_date) < new Date() && d.status === 'pending')).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cards de resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total a Receber</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {totalToReceive.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">{debtors.length} devedores</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Já Recebido</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">R$ {totalReceived.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Pagamentos realizados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pendente</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">R$ {totalPending.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Aguardando pagamento</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Atrasados</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{overdueCount}</div>
            <p className="text-xs text-muted-foreground">Vencidos</p>
          </CardContent>
        </Card>
      </div>

      {/* Header com botões */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Filtrar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="pending">Pendentes</SelectItem>
              <SelectItem value="partial">Parciais</SelectItem>
              <SelectItem value="paid">Pagos</SelectItem>
              <SelectItem value="overdue">Atrasados</SelectItem>
              <SelectItem value="cancelled">Cancelados</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Devedor
        </Button>
      </div>

      {/* Tabela de devedores */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead>Valor Total</TableHead>
                  <TableHead>Restante</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDebtors.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      Nenhum devedor cadastrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDebtors.map((debtor) => {
                    const remaining = getRemainingAmount(debtor);
                    const daysOverdue = getDaysOverdue(debtor);
                    
                    return (
                      <TableRow key={debtor.id} className={daysOverdue ? 'bg-red-50 dark:bg-red-950/20' : ''}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{debtor.name}</p>
                            {debtor.description && (
                              <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                                {debtor.description}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {debtor.email && <p>{debtor.email}</p>}
                            {debtor.phone && <p className="text-muted-foreground">{debtor.phone}</p>}
                            {!debtor.email && !debtor.phone && <span className="text-muted-foreground">-</span>}
                          </div>
                        </TableCell>
                        <TableCell className="font-semibold">
                          R$ {Number(debtor.amount).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <span className={remaining > 0 ? 'text-red-600 font-medium' : 'text-green-600'}>
                            R$ {remaining.toFixed(2)}
                          </span>
                        </TableCell>
                        <TableCell>
                          {debtor.due_date ? (
                            <div>
                              <p>{format(new Date(debtor.due_date + 'T00:00:00'), 'dd/MM/yyyy')}</p>
                              {daysOverdue && (
                                <p className="text-xs text-red-500">{daysOverdue} dias atrasado</p>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Select 
                            value={debtor.status} 
                            onValueChange={(v) => handleUpdateStatus(debtor, v as Debtor['status'])}
                          >
                            <SelectTrigger className="w-[120px]">
                              {getStatusBadge(debtor)}
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pendente</SelectItem>
                              <SelectItem value="partial">Parcial</SelectItem>
                              <SelectItem value="paid">Pago</SelectItem>
                              <SelectItem value="overdue">Atrasado</SelectItem>
                              <SelectItem value="cancelled">Cancelado</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => openPaymentDialog(debtor)}
                              disabled={debtor.status === 'paid' || debtor.status === 'cancelled'}
                              title="Registrar pagamento"
                            >
                              <CreditCard className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => openPaymentsList(debtor)}
                              title="Ver pagamentos"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => openEditDialog(debtor)}>
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteDebtor(debtor.id)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Dialog Adicionar Devedor */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Novo Devedor</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div>
              <Label>Nome *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nome do devedor"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@exemplo.com"
                />
              </div>
              <div>
                <Label>Telefone</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="(11) 99999-9999"
                />
              </div>
            </div>
            <div>
              <Label>Descrição</Label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Motivo da dívida"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Valor *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="0,00"
                />
              </div>
              <div>
                <Label>Vencimento</Label>
                <Input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label>Observações</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Notas adicionais..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsAddDialogOpen(false); resetForm(); }}>
              Cancelar
            </Button>
            <Button onClick={handleAddDebtor} disabled={!formData.name || !formData.amount}>
              Cadastrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Editar Devedor */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Devedor</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div>
              <Label>Nome *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div>
                <Label>Telefone</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label>Descrição</Label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Valor *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                />
              </div>
              <div>
                <Label>Vencimento</Label>
                <Input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label>Observações</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsEditDialogOpen(false); resetForm(); }}>
              Cancelar
            </Button>
            <Button onClick={handleEditDebtor} disabled={!formData.name || !formData.amount}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Registrar Pagamento */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Registrar Pagamento</DialogTitle>
          </DialogHeader>
          {selectedDebtor && (
            <div className="space-y-4">
              <div className="p-3 bg-muted rounded-lg">
                <p className="font-medium">{selectedDebtor.name}</p>
                <p className="text-sm text-muted-foreground">
                  Total: R$ {Number(selectedDebtor.amount).toFixed(2)} | 
                  Restante: R$ {getRemainingAmount(selectedDebtor).toFixed(2)}
                </p>
              </div>
              <div>
                <Label>Valor do Pagamento *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={paymentFormData.amount}
                  onChange={(e) => setPaymentFormData({ ...paymentFormData, amount: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Data</Label>
                  <Input
                    type="date"
                    value={paymentFormData.payment_date}
                    onChange={(e) => setPaymentFormData({ ...paymentFormData, payment_date: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Método</Label>
                  <Select 
                    value={paymentFormData.payment_method} 
                    onValueChange={(v) => setPaymentFormData({ ...paymentFormData, payment_method: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pix">PIX</SelectItem>
                      <SelectItem value="dinheiro">Dinheiro</SelectItem>
                      <SelectItem value="cartao">Cartão</SelectItem>
                      <SelectItem value="transferencia">Transferência</SelectItem>
                      <SelectItem value="boleto">Boleto</SelectItem>
                      <SelectItem value="outro">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Observações</Label>
                <Textarea
                  value={paymentFormData.notes}
                  onChange={(e) => setPaymentFormData({ ...paymentFormData, notes: e.target.value })}
                  placeholder="Notas sobre o pagamento..."
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPaymentDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddPayment} disabled={!paymentFormData.amount}>
              Registrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Lista de Pagamentos */}
      <Dialog open={isPaymentsListOpen} onOpenChange={setIsPaymentsListOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Histórico de Pagamentos</DialogTitle>
          </DialogHeader>
          {selectedDebtor && (
            <div className="space-y-4">
              <div className="p-3 bg-muted rounded-lg">
                <p className="font-medium">{selectedDebtor.name}</p>
                <p className="text-sm text-muted-foreground">
                  Total: R$ {Number(selectedDebtor.amount).toFixed(2)} | 
                  Restante: R$ {getRemainingAmount(selectedDebtor).toFixed(2)}
                </p>
              </div>
              <div className="max-h-[300px] overflow-y-auto">
                {(!payments[selectedDebtor.id] || payments[selectedDebtor.id].length === 0) ? (
                  <p className="text-center text-muted-foreground py-4">Nenhum pagamento registrado</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Método</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payments[selectedDebtor.id].map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell>
                            {format(new Date(payment.payment_date + 'T00:00:00'), 'dd/MM/yyyy')}
                          </TableCell>
                          <TableCell className="font-medium text-green-600">
                            R$ {Number(payment.amount).toFixed(2)}
                          </TableCell>
                          <TableCell>
                            {payment.payment_method || '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
