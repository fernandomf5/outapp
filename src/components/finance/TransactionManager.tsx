import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Filter, Trash2, Edit2, CheckCircle, Clock, ListPlus, X } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { SecureDeleteDialog } from "@/components/ui/secure-delete-dialog";

const PAYMENT_METHODS: Record<string, string> = {
  pix: "PIX",
  credit_card: "Cartão de Crédito",
  debit_card: "Cartão de Débito",
  cash: "Dinheiro",
  transfer: "Transferência",
  boleto: "Boleto"
};

interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  due_date: string;
  status: string;
  payment_method: string;
  is_recurring: boolean;
  bank_account_id?: string;
}

interface TransactionManagerProps {
  transactions: Transaction[];
  bankAccounts: any[];
  onRefresh: () => void;
  businessId: string;
}

export const TransactionManager = ({ transactions, bankAccounts, onRefresh, businessId }: TransactionManagerProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isBulkAddOpen, setIsBulkAddOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingTransactionId, setEditingTransactionId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);

  const [formData, setFormData] = useState({
    description: "",
    amount: "",
    type: "expense" as "income" | "expense",
    category: "",
    due_date: format(new Date(), "yyyy-MM-dd"),
    status: "pending",
    payment_method: "pix",
    bank_account_id: "",
    is_recurring: false
  });
  
  const [bulkRows, setBulkRows] = useState<any[]>([
    { description: "", amount: "", type: "expense", category: "", due_date: format(new Date(), "yyyy-MM-dd"), status: "pending", payment_method: "pix", bank_account_id: "" }
  ]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           t.category.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = typeFilter === "all" || t.type === typeFilter;
      const matchesStatus = statusFilter === "all" || t.status === statusFilter;
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [transactions, searchTerm, typeFilter, statusFilter]);

  const updateAccountBalance = async (accountId: string, amountChange: number) => {
    try {
      const { data: account, error: fetchError } = await supabase
        .from('financial_bank_accounts')
        .select('current_balance')
        .eq('id', accountId)
        .single();

      if (fetchError || !account) return;

      const newBalance = (account.current_balance || 0) + amountChange;

      await supabase
        .from('financial_bank_accounts')
        .update({ current_balance: newBalance })
        .eq('id', accountId);
    } catch (error) {
      console.error("Erro ao atualizar saldo:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const amount = parseFloat(formData.amount);
      const transactionData = {
        user_id: user.id,
        business_id: businessId,
        description: formData.description,
        amount: amount,
        type: formData.type,
        category: formData.category,
        due_date: formData.due_date,
        status: formData.status,
        payment_method: formData.payment_method,
        bank_account_id: formData.bank_account_id || null,
        is_recurring: formData.is_recurring,
        year: new Date(formData.due_date).getFullYear(),
        month: format(new Date(formData.due_date + 'T00:00:00'), 'MMMM', { locale: ptBR })
      };

      if (editingTransactionId) {
        // Obter transação antiga para comparar saldo
        const oldTransaction = transactions.find(t => t.id === editingTransactionId);
        
        const { error } = await supabase
          .from('financial_transactions')
          .update(transactionData)
          .eq('id', editingTransactionId);

        if (error) throw error;

        // Lógica de atualização de saldo se o status for 'paid'
        if (oldTransaction) {
          // Reverter transação antiga se era 'paid'
          if (oldTransaction.status === 'paid' && oldTransaction.bank_account_id) {
            const oldAmountChange = oldTransaction.type === 'income' ? -oldTransaction.amount : oldTransaction.amount;
            await updateAccountBalance(oldTransaction.bank_account_id, oldAmountChange);
          }
          // Aplicar nova transação se é 'paid'
          if (formData.status === 'paid' && formData.bank_account_id) {
            const newAmountChange = formData.type === 'income' ? amount : -amount;
            await updateAccountBalance(formData.bank_account_id, newAmountChange);
          }
        }

        toast.success("Transação atualizada!");
      } else {
        const { error } = await supabase.from('financial_transactions').insert(transactionData);
        if (error) throw error;

        // Atualizar saldo se o status for 'paid'
        if (formData.status === 'paid' && formData.bank_account_id) {
          const amountChange = formData.type === 'income' ? amount : -amount;
          await updateAccountBalance(formData.bank_account_id, amountChange);
        }

        toast.success("Transação adicionada!");
      }

      setIsAddOpen(false);
      resetForm();
      onRefresh();
    } catch (error) {
      toast.error(editingTransactionId ? "Erro ao atualizar transação" : "Erro ao adicionar transação");
    } finally {
      setLoading(false);
    }
  };

  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const validRows = bulkRows.filter(row => row.description && row.amount);
      if (validRows.length === 0) {
        toast.error("Preencha pelo menos uma transação válida");
        return;
      }

      for (const row of validRows) {
        const amount = parseFloat(row.amount);
        const transactionData = {
          user_id: user.id,
          business_id: businessId,
          description: row.description,
          amount: amount,
          type: row.type,
          category: row.category,
          due_date: row.due_date,
          status: row.status,
          payment_method: row.payment_method,
          bank_account_id: row.bank_account_id || null,
          is_recurring: false,
          year: new Date(row.due_date).getFullYear(),
          month: format(new Date(row.due_date + 'T00:00:00'), 'MMMM', { locale: ptBR })
        };

        const { error } = await supabase.from('financial_transactions').insert(transactionData);
        if (error) throw error;

        // Atualizar saldo se o status for 'paid'
        if (row.status === 'paid' && row.bank_account_id) {
          const amountChange = row.type === 'income' ? amount : -amount;
          await updateAccountBalance(row.bank_account_id, amountChange);
        }
      }

      toast.success(`${validRows.length} transações adicionadas!`);
      setIsBulkAddOpen(false);
      setBulkRows([{ description: "", amount: "", type: "expense", category: "", due_date: format(new Date(), "yyyy-MM-dd"), status: "pending", payment_method: "pix", bank_account_id: "" }]);
      onRefresh();
    } catch (error) {
      toast.error("Erro ao adicionar transações");
    } finally {
      setLoading(false);
    }
  };

  const addBulkRow = () => {
    setBulkRows([...bulkRows, { description: "", amount: "", type: "expense", category: "", due_date: format(new Date(), "yyyy-MM-dd"), status: "pending", payment_method: "pix", bank_account_id: "" }]);
  };

  const removeBulkRow = (index: number) => {
    if (bulkRows.length > 1) {
      const newRows = [...bulkRows];
      newRows.splice(index, 1);
      setBulkRows(newRows);
    }
  };

  const updateBulkRow = (index: number, field: string, value: any) => {
    const newRows = [...bulkRows];
    newRows[index] = { ...newRows[index], [field]: value };
    setBulkRows(newRows);
  };

  const resetForm = () => {
    setFormData({
      description: "",
      amount: "",
      type: "expense",
      category: "",
      due_date: format(new Date(), "yyyy-MM-dd"),
      status: "pending",
      payment_method: "pix",
      bank_account_id: "",
      is_recurring: false
    });
    setEditingTransactionId(null);
  };

  const handleEdit = (t: Transaction) => {
    setFormData({
      description: t.description,
      amount: t.amount.toString(),
      type: t.type,
      category: t.category,
      due_date: t.due_date,
      status: t.status,
      payment_method: t.payment_method,
      bank_account_id: t.bank_account_id || "",
      is_recurring: t.is_recurring
    });
    setEditingTransactionId(t.id);
    setIsAddOpen(true);
  };

  const confirmDelete = (t: Transaction) => {
    setTransactionToDelete(t);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!transactionToDelete) return;
    const t = transactionToDelete;
    try {
      const { error } = await supabase.from('financial_transactions').delete().eq('id', t.id);
      if (error) throw error;

      // Reverter saldo se estava paga
      if (t.status === 'paid' && t.bank_account_id) {
        const amountChange = t.type === 'income' ? -t.amount : t.amount;
        await updateAccountBalance(t.bank_account_id, amountChange);
      }

      toast.success("Transação excluída");
      onRefresh();
    } catch (error) {
      toast.error("Erro ao excluir");
    } finally {
      setDeleteDialogOpen(false);
      setTransactionToDelete(null);
    }
  };

  const handleToggleStatus = async (t: Transaction) => {
    const newStatus = t.status === 'paid' ? 'pending' : 'paid';
    try {
      const { error } = await supabase
        .from('financial_transactions')
        .update({ status: newStatus })
        .eq('id', t.id);
      
      if (error) throw error;

      // Atualizar saldo
      if (t.bank_account_id) {
        const amountChange = t.type === 'income' ? t.amount : -t.amount;
        // Se mudou para pago, aplica o valor. Se mudou para pendente, reverte.
        const direction = newStatus === 'paid' ? 1 : -1;
        await updateAccountBalance(t.bank_account_id, amountChange * direction);
      }

      onRefresh();
    } catch (error) {
      toast.error("Erro ao atualizar status");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div className="flex flex-1 w-full gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Pesquisar transações..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[130px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="income">Receitas</SelectItem>
              <SelectItem value="expense">Despesas</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          <Dialog open={isBulkAddOpen} onOpenChange={setIsBulkAddOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex-1 md:flex-none">
                <ListPlus className="h-4 w-4 mr-2" /> Adicionar Múltiplas
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Adicionar Múltiplas Transações</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleBulkSubmit} className="space-y-4 py-4">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[150px]">Tipo</TableHead>
                        <TableHead className="min-w-[200px]">Descrição</TableHead>
                        <TableHead className="w-[120px]">Valor</TableHead>
                        <TableHead className="w-[150px]">Categoria</TableHead>
                        <TableHead className="w-[150px]">Vencimento</TableHead>
                        <TableHead className="w-[150px]">Conta</TableHead>
                        <TableHead className="w-[150px]">Forma</TableHead>
                        <TableHead className="w-[100px]">Status</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bulkRows.map((row, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Select value={row.type} onValueChange={(v: any) => updateBulkRow(index, 'type', v)}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="income">Receita</SelectItem>
                                <SelectItem value="expense">Despesa</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Input 
                              value={row.description} 
                              onChange={e => updateBulkRow(index, 'description', e.target.value)}
                              placeholder="Descrição"
                            />
                          </TableCell>
                          <TableCell>
                            <Input 
                              type="number" 
                              step="0.01" 
                              value={row.amount} 
                              onChange={e => updateBulkRow(index, 'amount', e.target.value)}
                              placeholder="0,00"
                            />
                          </TableCell>
                          <TableCell>
                            <Input 
                              value={row.category} 
                              onChange={e => updateBulkRow(index, 'category', e.target.value)}
                              placeholder="Categoria"
                            />
                          </TableCell>
                          <TableCell>
                            <Input 
                              type="date" 
                              value={row.due_date} 
                              onChange={e => updateBulkRow(index, 'due_date', e.target.value)}
                            />
                          </TableCell>
                          <TableCell>
                            <Select value={row.bank_account_id} onValueChange={(v) => updateBulkRow(index, 'bank_account_id', v)}>
                              <SelectTrigger>
                                <SelectValue placeholder="..." />
                              </SelectTrigger>
                              <SelectContent>
                                {bankAccounts.map(acc => (
                                  <SelectItem key={acc.id} value={acc.id}>{acc.bank_name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Select value={row.payment_method} onValueChange={(v) => updateBulkRow(index, 'payment_method', v)}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pix">PIX</SelectItem>
                                <SelectItem value="credit_card">Cartão</SelectItem>
                                <SelectItem value="debit_card">Débito</SelectItem>
                                <SelectItem value="cash">Dinheiro</SelectItem>
                                <SelectItem value="transfer">Transf.</SelectItem>
                                <SelectItem value="boleto">Boleto</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Select value={row.status} onValueChange={(v) => updateBulkRow(index, 'status', v)}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">Pend.</SelectItem>
                                <SelectItem value="paid">Pago</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Button 
                              type="button" 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => removeBulkRow(index)}
                              disabled={bulkRows.length === 1}
                            >
                              <X className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                
                <div className="flex justify-between items-center">
                  <Button type="button" variant="outline" size="sm" onClick={addBulkRow}>
                    <Plus className="h-4 w-4 mr-2" /> Adicionar Linha
                  </Button>
                  <div className="text-sm text-muted-foreground">
                    {bulkRows.length} linhas
                  </div>
                </div>

                <DialogFooter>
                  <Button type="submit" disabled={loading} className="w-full">
                    {loading ? "Salvando..." : "Salvar Todas as Transações"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={isAddOpen} onOpenChange={(open) => {
            setIsAddOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="flex-1 md:flex-none">
                <Plus className="h-4 w-4 mr-2" /> Nova Transação
              </Button>
            </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{editingTransactionId ? "Editar Transação" : "Adicionar Transação"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select value={formData.type} onValueChange={(v: any) => setFormData({...formData, type: v})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="income">Receita</SelectItem>
                      <SelectItem value="expense">Despesa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Valor</Label>
                  <Input 
                    type="number" 
                    step="0.01" 
                    required 
                    value={formData.amount}
                    onChange={e => setFormData({...formData, amount: e.target.value})}
                    placeholder="0,00"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Descrição</Label>
                <Input 
                  required 
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  placeholder="Ex: Aluguel, Venda de Produto"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Categoria</Label>
                  <Input 
                    required 
                    value={formData.category}
                    onChange={e => setFormData({...formData, category: e.target.value})}
                    placeholder="Ex: Alimentação, Lazer"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Vencimento</Label>
                  <Input 
                    type="date" 
                    required 
                    value={formData.due_date}
                    onChange={e => setFormData({...formData, due_date: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Conta Bancária</Label>
                  <Select value={formData.bank_account_id} onValueChange={(v) => setFormData({...formData, bank_account_id: v})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {bankAccounts.map(acc => (
                        <SelectItem key={acc.id} value={acc.id}>{acc.bank_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Forma de Pagamento</Label>
                  <Select value={formData.payment_method} onValueChange={(v) => setFormData({...formData, payment_method: v})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pix">PIX</SelectItem>
                      <SelectItem value="credit_card">Cartão de Crédito</SelectItem>
                      <SelectItem value="debit_card">Cartão de Débito</SelectItem>
                      <SelectItem value="cash">Dinheiro</SelectItem>
                      <SelectItem value="transfer">Transferência</SelectItem>
                      <SelectItem value="boleto">Boleto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={formData.status} onValueChange={(v) => setFormData({...formData, status: v})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pendente</SelectItem>
                      <SelectItem value="paid">Pago</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="recurring" 
                  checked={formData.is_recurring} 
                  onCheckedChange={(checked) => setFormData({...formData, is_recurring: !!checked})}
                />
                <Label htmlFor="recurring" className="text-sm font-medium leading-none cursor-pointer">
                  Transação Recorrente (Mensal)
                </Label>
              </div>

              <DialogFooter>
                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? "Salvando..." : "Salvar Transação"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Nenhuma transação encontrada.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTransactions.map(t => (
                    <TableRow key={t.id} className={t.status === 'paid' ? 'bg-muted/30' : ''}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{t.description}</span>
                          <span className="text-xs text-muted-foreground">
                            {PAYMENT_METHODS[t.payment_method] || t.payment_method}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{t.category}</Badge>
                      </TableCell>
                      <TableCell>{format(new Date(t.due_date + 'T00:00:00'), 'dd/MM/yyyy')}</TableCell>
                      <TableCell className={t.type === 'income' ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>
                        {t.type === 'income' ? '+' : '-'} R$ {t.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className={t.status === 'paid' ? 'text-green-600' : 'text-orange-600'}
                          onClick={() => handleToggleStatus(t)}
                        >
                          {t.status === 'paid' ? <CheckCircle className="h-4 w-4 mr-1" /> : <Clock className="h-4 w-4 mr-1" />}
                          {t.status === 'paid' ? 'Pago' : 'Pendente'}
                        </Button>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(t)}>
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => confirmDelete(t)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <SecureDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDelete}
        title="Excluir Transação"
        description="Esta ação excluirá permanentemente os dados desta transação e reverterá qualquer impacto no saldo da conta vinculada (se paga). Para confirmar, digite 'excluir' abaixo."
        itemName={transactionToDelete?.description}
      />
    </div>
  );
};