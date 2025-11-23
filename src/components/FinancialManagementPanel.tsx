import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Plus, Edit2, Trash2, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Switch } from "@/components/ui/switch";

interface Transaction {
  id: string;
  type: 'income' | 'expense';
  category: string;
  description: string;
  amount: number;
  month: string;
  due_date: string;
  payment_method: string;
  status: 'paid' | 'pending' | 'cancelled';
  is_recurring: boolean;
  reminder_enabled: boolean;
  year: number;
  status_history: any[];
}

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export const FinancialManagementPanel = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'MMMM', { locale: ptBR }));
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    type: 'expense' as 'income' | 'expense',
    category: '',
    description: '',
    amount: '',
    month: format(new Date(), 'MMMM', { locale: ptBR }),
    due_date: format(new Date(), 'yyyy-MM-dd'),
    payment_method: 'pix',
    status: 'pending' as 'paid' | 'pending' | 'cancelled',
    is_recurring: false,
    reminder_enabled: false,
  });

  useEffect(() => {
    loadTransactions();
  }, [selectedMonth, selectedYear]);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('financial_transactions')
        .select('*')
        .eq('user_id', user.id)
        .eq('year', selectedYear)
        .order('due_date', { ascending: true });

      if (error) throw error;
      setTransactions((data || []) as any);
    } catch (error: any) {
      toast.error('Erro ao carregar transações');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTransaction = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('financial_transactions')
        .insert({
          user_id: user.id,
          type: formData.type,
          category: formData.category,
          description: formData.description,
          amount: parseFloat(formData.amount),
          month: formData.month,
          due_date: formData.due_date,
          payment_method: formData.payment_method,
          status: formData.status,
          is_recurring: formData.is_recurring,
          reminder_enabled: formData.reminder_enabled,
          year: selectedYear,
          date: new Date().toISOString(),
          status_history: [{
            status: formData.status,
            changed_at: new Date().toISOString(),
            note: 'Transação criada'
          }]
        });

      if (error) throw error;

      toast.success('Transação adicionada!');
      setIsAddDialogOpen(false);
      resetForm();
      loadTransactions();
    } catch (error: any) {
      toast.error('Erro ao adicionar transação');
    }
  };

  const handleEditTransaction = async () => {
    if (!editingTransaction) return;

    try {
      const { error } = await supabase
        .from('financial_transactions')
        .update({
          type: formData.type,
          category: formData.category,
          description: formData.description,
          amount: parseFloat(formData.amount),
          month: formData.month,
          due_date: formData.due_date,
          payment_method: formData.payment_method,
          status: formData.status,
          is_recurring: formData.is_recurring,
          reminder_enabled: formData.reminder_enabled,
        })
        .eq('id', editingTransaction.id);

      if (error) throw error;

      toast.success('Transação atualizada!');
      setIsEditDialogOpen(false);
      setEditingTransaction(null);
      resetForm();
      loadTransactions();
    } catch (error: any) {
      toast.error('Erro ao atualizar transação');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('financial_transactions')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Transação excluída!');
      loadTransactions();
    } catch (error: any) {
      toast.error('Erro ao excluir');
    }
  };

  const handleStatusChange = async (transaction: Transaction, newStatus: 'paid' | 'pending' | 'cancelled') => {
    try {
      const statusHistory = [...(transaction.status_history || []), {
        status: newStatus,
        changed_at: new Date().toISOString(),
        note: `Status alterado para ${newStatus}`
      }];

      const { error } = await supabase
        .from('financial_transactions')
        .update({ 
          status: newStatus,
          status_history: statusHistory as any
        })
        .eq('id', transaction.id);

      if (error) throw error;
      toast.success('Status atualizado!');
      loadTransactions();
    } catch (error: any) {
      toast.error('Erro ao atualizar status');
    }
  };

  const resetForm = () => {
    setFormData({
      type: 'expense',
      category: '',
      description: '',
      amount: '',
      month: format(new Date(), 'MMMM', { locale: ptBR }),
      due_date: format(new Date(), 'yyyy-MM-dd'),
      payment_method: 'pix',
      status: 'pending',
      is_recurring: false,
      reminder_enabled: false,
    });
  };

  const openEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setFormData({
      type: transaction.type,
      category: transaction.category,
      description: transaction.description,
      amount: transaction.amount.toString(),
      month: transaction.month,
      due_date: transaction.due_date,
      payment_method: transaction.payment_method,
      status: transaction.status,
      is_recurring: transaction.is_recurring,
      reminder_enabled: transaction.reminder_enabled,
    });
    setIsEditDialogOpen(true);
  };

  const monthTransactions = transactions.filter(t => t.month === selectedMonth || t.is_recurring);

  const totalIncome = monthTransactions
    .filter(t => t.type === 'income' && t.status === 'paid')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const totalExpense = monthTransactions
    .filter(t => t.type === 'expense' && t.status === 'paid')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const pendingAmount = monthTransactions
    .filter(t => t.status === 'pending')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">Gestão Financeira</h2>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nova Transação
        </Button>
      </div>

      {/* Seletores de Ano e Mês */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Ano</Label>
              <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[2024, 2025, 2026, 2027].map(year => (
                    <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Mês</Label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map(month => (
                    <SelectItem key={month} value={month}>{month}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cards de Resumo */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Receitas Pagas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">R$ {totalIncome.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Despesas Pagas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">R$ {totalExpense.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Saldo</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">R$ {(totalIncome - totalExpense).toFixed(2)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Transações */}
      <Card>
        <CardHeader>
          <CardTitle>{selectedMonth} {selectedYear}</CardTitle>
          <CardDescription>Transações do mês selecionado e transações fixas</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {monthTransactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell>
                    <Badge variant={transaction.type === 'income' ? 'default' : 'destructive'}>
                      {transaction.type === 'income' ? 'Receita' : 'Despesa'}
                    </Badge>
                    {transaction.is_recurring && <Badge className="ml-2" variant="outline">Fixa</Badge>}
                  </TableCell>
                  <TableCell>{transaction.description}</TableCell>
                  <TableCell>{transaction.category}</TableCell>
                  <TableCell>{format(new Date(transaction.due_date), 'dd/MM/yyyy')}</TableCell>
                  <TableCell className="font-semibold">R$ {Number(transaction.amount).toFixed(2)}</TableCell>
                  <TableCell>
                    <Select value={transaction.status} onValueChange={(v) => handleStatusChange(transaction, v as any)}>
                      <SelectTrigger className="w-[120px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pendente</SelectItem>
                        <SelectItem value="paid">Pago</SelectItem>
                        <SelectItem value="cancelled">Cancelado</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(transaction)}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(transaction.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {monthTransactions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    Nenhuma transação neste mês
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog Adicionar */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nova Transação</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Tipo</Label>
                <Select value={formData.type} onValueChange={(v: any) => setFormData({ ...formData, type: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="income">Receita</SelectItem>
                    <SelectItem value="expense">Despesa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Categoria</Label>
                <Input
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="Ex: Aluguel, Salário..."
                />
              </div>
            </div>
            <div>
              <Label>Descrição</Label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descrição da transação"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Valor (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label>Método de Pagamento</Label>
                <Select value={formData.payment_method} onValueChange={(v) => setFormData({ ...formData, payment_method: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pix">PIX</SelectItem>
                    <SelectItem value="dinheiro">Dinheiro</SelectItem>
                    <SelectItem value="credito">Crédito</SelectItem>
                    <SelectItem value="debito">Débito</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Mês</Label>
                <Select value={formData.month} onValueChange={(v) => setFormData({ ...formData, month: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MONTHS.map(month => (
                      <SelectItem key={month} value={month}>{month}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Data de Vencimento</Label>
                <Input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="reminder"
                checked={formData.reminder_enabled}
                onCheckedChange={(checked) => setFormData({ ...formData, reminder_enabled: checked })}
              />
              <Label htmlFor="reminder">Ativar lembrete de vencimento</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="recurring"
                checked={formData.is_recurring}
                onCheckedChange={(checked) => setFormData({ ...formData, is_recurring: checked })}
              />
              <Label htmlFor="recurring">Transação Fixa (repete todo mês)</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleAddTransaction}>Adicionar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Editar */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Transação</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Tipo</Label>
                <Select value={formData.type} onValueChange={(v: any) => setFormData({ ...formData, type: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="income">Receita</SelectItem>
                    <SelectItem value="expense">Despesa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Categoria</Label>
                <Input
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
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
                <Label>Valor (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                />
              </div>
              <div>
                <Label>Método de Pagamento</Label>
                <Select value={formData.payment_method} onValueChange={(v) => setFormData({ ...formData, payment_method: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pix">PIX</SelectItem>
                    <SelectItem value="dinheiro">Dinheiro</SelectItem>
                    <SelectItem value="credito">Crédito</SelectItem>
                    <SelectItem value="debito">Débito</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Mês</Label>
                <Select value={formData.month} onValueChange={(v) => setFormData({ ...formData, month: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MONTHS.map(month => (
                      <SelectItem key={month} value={month}>{month}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Data de Vencimento</Label>
                <Input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="edit_reminder"
                checked={formData.reminder_enabled}
                onCheckedChange={(checked) => setFormData({ ...formData, reminder_enabled: checked })}
              />
              <Label htmlFor="edit_reminder">Ativar lembrete de vencimento</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="edit_recurring"
                checked={formData.is_recurring}
                onCheckedChange={(checked) => setFormData({ ...formData, is_recurring: checked })}
              />
              <Label htmlFor="edit_recurring">Transação Fixa (repete todo mês)</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsEditDialogOpen(false); resetForm(); }}>Cancelar</Button>
            <Button onClick={handleEditTransaction}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};