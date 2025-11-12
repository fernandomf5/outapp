import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Calendar,
  Download,
  Plus,
  Eye,
  Trash2,
  CreditCard,
  Wallet,
  PieChart,
  BarChart3,
  Filter
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { DeleteConfirmDialog } from "@/components/ui/delete-confirm-dialog";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Business {
  id: string;
  name: string;
  business_type: 'personal' | 'company';
  description?: string;
  created_at: string;
}

interface Transaction {
  id: string;
  type: 'income' | 'expense';
  category: string;
  description: string;
  amount: number;
  date: string;
  payment_method: string;
  status: 'paid' | 'pending' | 'cancelled';
  created_at: string;
  business_id?: string;
}

export const FinancialManagementPanel = () => {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [selectedBusinessesForSum, setSelectedBusinessesForSum] = useState<string[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'month' | 'year' | 'all'>('month');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isBusinessDialogOpen, setIsBusinessDialogOpen] = useState(false);
  const [consolidationMode, setConsolidationMode] = useState(false);
  const [deleteTransactionId, setDeleteTransactionId] = useState<string | null>(null);
  const [deleteBusinessId, setDeleteBusinessId] = useState<string | null>(null);

  const [businessFormData, setBusinessFormData] = useState({
    name: '',
    business_type: 'personal' as 'personal' | 'company',
    description: ''
  });
  
  const [formData, setFormData] = useState({
    type: 'income' as 'income' | 'expense',
    category: '',
    description: '',
    amount: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    payment_method: 'dinheiro',
    status: 'paid' as 'paid' | 'pending' | 'cancelled'
  });

  useEffect(() => {
    loadBusinesses();
  }, []);

  useEffect(() => {
    if (selectedBusiness) {
      loadTransactions();
    }
  }, [selectedBusiness]);

  const loadBusinesses = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('financial_businesses')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBusinesses((data || []) as Business[]);
    } catch (error: any) {
      toast.error("Erro ao carregar negócios");
    } finally {
      setLoading(false);
    }
  };

  const loadTransactions = async () => {
    try {
      if (!selectedBusiness && !consolidationMode) return;
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let query = supabase
        .from('financial_transactions')
        .select('*')
        .eq('user_id', user.id);

      if (consolidationMode && selectedBusinessesForSum.length > 0) {
        query = query.in('business_id', selectedBusinessesForSum);
      } else if (selectedBusiness) {
        query = query.eq('business_id', selectedBusiness.id);
      }

      const { data, error } = await query.order('date', { ascending: false });

      if (error) throw error;
      setTransactions((data || []) as Transaction[]);
    } catch (error: any) {
      toast.error("Erro ao carregar transações");
    }
  };

  const handleAddBusiness = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (!businessFormData.name.trim()) {
        toast.error("Nome do negócio é obrigatório");
        return;
      }

      const { error } = await supabase
        .from('financial_businesses')
        .insert([{
          user_id: user.id,
          ...businessFormData
        }]);

      if (error) throw error;

      toast.success("Negócio adicionado com sucesso!");
      setIsBusinessDialogOpen(false);
      loadBusinesses();
      
      setBusinessFormData({
        name: '',
        business_type: 'personal',
        description: ''
      });
    } catch (error: any) {
      toast.error("Erro ao adicionar negócio");
    }
  };

  const handleDeleteBusiness = async () => {
    if (!deleteBusinessId) return;

    try {
      const { error } = await supabase
        .from('financial_businesses')
        .delete()
        .eq('id', deleteBusinessId);

      if (error) throw error;

      toast.success("Negócio excluído!");
      if (selectedBusiness?.id === deleteBusinessId) {
        setSelectedBusiness(null);
        setTransactions([]);
      }
      loadBusinesses();
    } catch (error: any) {
      toast.error("Erro ao excluir negócio");
    } finally {
      setDeleteBusinessId(null);
    }
  };

  const handleAddTransaction = async () => {
    try {
      if (!selectedBusiness) {
        toast.error("Selecione um negócio primeiro");
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('financial_transactions')
        .insert([{
          user_id: user.id,
          business_id: selectedBusiness.id,
          ...formData,
          amount: parseFloat(formData.amount)
        }]);

      if (error) throw error;

      toast.success("Transação adicionada com sucesso!");
      setIsAddDialogOpen(false);
      loadTransactions();
      
      setFormData({
        type: 'income',
        category: '',
        description: '',
        amount: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        payment_method: 'dinheiro',
        status: 'paid'
      });
    } catch (error: any) {
      toast.error("Erro ao adicionar transação");
    }
  };

  const handleDeleteTransaction = async () => {
    if (!deleteTransactionId) return;
    
    try {
      const { error } = await supabase
        .from('financial_transactions')
        .delete()
        .eq('id', deleteTransactionId);

      if (error) throw error;

      toast.success("Transação excluída!");
      loadTransactions();
    } catch (error: any) {
      toast.error("Erro ao excluir transação");
    } finally {
      setDeleteTransactionId(null);
    }
  };

  const filteredTransactions = transactions.filter(t => {
    if (filter !== 'all' && t.type !== filter) return false;
    
    const transactionDate = new Date(t.date);
    const now = new Date();
    
    switch(dateFilter) {
      case 'today':
        return transactionDate.toDateString() === now.toDateString();
      case 'week':
        const weekAgo = new Date(now.setDate(now.getDate() - 7));
        return transactionDate >= weekAgo;
      case 'month':
        return transactionDate.getMonth() === now.getMonth() && 
               transactionDate.getFullYear() === now.getFullYear();
      case 'year':
        return transactionDate.getFullYear() === now.getFullYear();
      default:
        return true;
    }
  });

  const totalIncome = filteredTransactions
    .filter(t => t.type === 'income' && t.status === 'paid')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = filteredTransactions
    .filter(t => t.type === 'expense' && t.status === 'paid')
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalIncome - totalExpense;

  const pendingAmount = filteredTransactions
    .filter(t => t.status === 'pending')
    .reduce((sum, t) => sum + (t.type === 'income' ? t.amount : -t.amount), 0);

  const toggleBusinessSelection = (businessId: string) => {
    setSelectedBusinessesForSum(prev => 
      prev.includes(businessId) 
        ? prev.filter(b => b !== businessId)
        : [...prev, businessId]
    );
  };

  useEffect(() => {
    if (consolidationMode) {
      loadTransactions();
    }
  }, [selectedBusinessesForSum]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Gestão Financeira</h2>
          <p className="text-muted-foreground">Controle completo das suas finanças por negócio</p>
        </div>
        <div className="flex items-center gap-3">
          <Dialog open={isBusinessDialogOpen} onOpenChange={setIsBusinessDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                Novo Negócio
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Adicionar Negócio</DialogTitle>
                <DialogDescription>Crie um novo negócio para gerenciar suas finanças</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label>Nome do Negócio/Cliente *</Label>
                  <Input 
                    value={businessFormData.name}
                    onChange={(e) => setBusinessFormData({...businessFormData, name: e.target.value})}
                    placeholder="Ex: Loja ABC, Cliente João..."
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Tipo</Label>
                  <Select value={businessFormData.business_type} onValueChange={(value: 'personal' | 'company') => setBusinessFormData({...businessFormData, business_type: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="personal">Pessoa Física</SelectItem>
                      <SelectItem value="company">Pessoa Jurídica</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Descrição (opcional)</Label>
                  <Input 
                    value={businessFormData.description}
                    onChange={(e) => setBusinessFormData({...businessFormData, description: e.target.value})}
                    placeholder="Descrição adicional..."
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsBusinessDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleAddBusiness} className="gradient-primary">
                  Adicionar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          {businesses.length > 1 && (
            <Button
              variant={consolidationMode ? "default" : "outline"}
              onClick={() => {
                setConsolidationMode(!consolidationMode);
                setSelectedBusinessesForSum([]);
                setSelectedBusiness(null);
                setTransactions([]);
              }}
            >
              {consolidationMode ? "Modo Simples" : "Consolidar Negócios"}
            </Button>
          )}
        </div>
      </div>

      {/* Lista de Negócios */}
      {!consolidationMode && (
        <Card className="glass">
          <CardHeader>
            <CardTitle>Meus Negócios</CardTitle>
            <CardDescription>Selecione um negócio para ver suas transações</CardDescription>
          </CardHeader>
          <CardContent>
            {businesses.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum negócio cadastrado. Adicione um negócio para começar.
              </div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {businesses.map((business) => (
                  <Card 
                    key={business.id}
                    className={`cursor-pointer transition-smooth hover:shadow-glow ${
                      selectedBusiness?.id === business.id ? 'border-primary shadow-glow' : ''
                    }`}
                    onClick={() => setSelectedBusiness(business)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-base">{business.name}</CardTitle>
                          <Badge variant="outline" className="mt-2">
                            {business.business_type === 'personal' ? 'Pessoa Física' : 'Pessoa Jurídica'}
                          </Badge>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteBusinessId(business.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                      {business.description && (
                        <p className="text-sm text-muted-foreground mt-2">{business.description}</p>
                      )}
                    </CardHeader>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Modo Consolidação */}
      {consolidationMode && businesses.length > 0 && (
        <Card className="glass">
          <CardHeader>
            <CardTitle>Consolidar Negócios</CardTitle>
            <CardDescription>Selecione os negócios que deseja somar nas métricas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {businesses.map((business) => (
                <Button
                  key={business.id}
                  variant={selectedBusinessesForSum.includes(business.id) ? "default" : "outline"}
                  onClick={() => toggleBusinessSelection(business.id)}
                  className="transition-smooth"
                >
                  {business.name}
                  <Badge variant="outline" className="ml-2">
                    {business.business_type === 'personal' ? 'PF' : 'PJ'}
                  </Badge>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Só mostra métricas e transações se tiver um negócio selecionado ou estiver em modo consolidação */}
      {(selectedBusiness || (consolidationMode && selectedBusinessesForSum.length > 0)) && (
        <>
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold">
              {consolidationMode 
                ? `Consolidado (${selectedBusinessesForSum.length} negócios)` 
                : selectedBusiness?.name}
            </h3>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gradient-primary shadow-glow" disabled={!selectedBusiness}>
                  <Plus className="mr-2 h-4 w-4" />
                  Nova Transação
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Adicionar Transação</DialogTitle>
                  <DialogDescription>
                    Transação para: <strong>{selectedBusiness?.name}</strong>
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label>Tipo</Label>
                    <Select value={formData.type} onValueChange={(value: 'income' | 'expense') => setFormData({...formData, type: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="income">Receita</SelectItem>
                        <SelectItem value="expense">Despesa</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Categoria</Label>
                    <Input 
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                      placeholder="Ex: Vendas, Marketing, Salários..."
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Descrição</Label>
                    <Input 
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      placeholder="Descreva a transação"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Valor (R$)</Label>
                    <Input 
                      type="number"
                      step="0.01"
                      value={formData.amount}
                      onChange={(e) => setFormData({...formData, amount: e.target.value})}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Data</Label>
                    <Input 
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({...formData, date: e.target.value})}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Método de Pagamento</Label>
                    <Select value={formData.payment_method} onValueChange={(value) => setFormData({...formData, payment_method: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="dinheiro">Dinheiro</SelectItem>
                        <SelectItem value="pix">PIX</SelectItem>
                        <SelectItem value="cartao_credito">Cartão de Crédito</SelectItem>
                        <SelectItem value="cartao_debito">Cartão de Débito</SelectItem>
                        <SelectItem value="transferencia">Transferência</SelectItem>
                        <SelectItem value="boleto">Boleto</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Status</Label>
                    <Select value={formData.status} onValueChange={(value: 'paid' | 'pending' | 'cancelled') => setFormData({...formData, status: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="paid">Pago</SelectItem>
                        <SelectItem value="pending">Pendente</SelectItem>
                        <SelectItem value="cancelled">Cancelado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleAddTransaction} className="gradient-primary">
                    Adicionar
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Resumo Financeiro */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="glass hover:shadow-glow transition-smooth">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Saldo Atual</CardTitle>
                <Wallet className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${balance >= 0 ? 'text-success' : 'text-destructive'}`}>
                  {balance >= 0 ? '+' : ''} R$ {balance.toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {balance >= 0 ? 'Positivo' : 'Negativo'}
                </p>
              </CardContent>
            </Card>

            <Card className="glass hover:shadow-glow transition-smooth">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Receitas</CardTitle>
                <TrendingUp className="h-4 w-4 text-success" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-success">
                  R$ {totalIncome.toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {filteredTransactions.filter(t => t.type === 'income').length} transações
                </p>
              </CardContent>
            </Card>

            <Card className="glass hover:shadow-glow transition-smooth">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Despesas</CardTitle>
                <TrendingDown className="h-4 w-4 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">
                  R$ {totalExpense.toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {filteredTransactions.filter(t => t.type === 'expense').length} transações
                </p>
              </CardContent>
            </Card>

            <Card className="glass hover:shadow-glow transition-smooth">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
                <Calendar className="h-4 w-4 text-warning" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-warning">
                  R$ {pendingAmount.toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {filteredTransactions.filter(t => t.status === 'pending').length} transações
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Filtros e Tabela */}
          <Card className="glass">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Histórico de Transações</CardTitle>
                <div className="flex gap-2">
                  <Select value={filter} onValueChange={(value: any) => setFilter(value)}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      <SelectItem value="income">Receitas</SelectItem>
                      <SelectItem value="expense">Despesas</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={dateFilter} onValueChange={(value: any) => setDateFilter(value)}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="today">Hoje</SelectItem>
                      <SelectItem value="week">Esta Semana</SelectItem>
                      <SelectItem value="month">Este Mês</SelectItem>
                      <SelectItem value="year">Este Ano</SelectItem>
                      <SelectItem value="all">Tudo</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="icon">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">Carregando...</div>
              ) : filteredTransactions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhuma transação encontrada
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Categoria</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead>Método</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Valor</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTransactions.map((transaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell>
                            {format(new Date(transaction.date), "dd/MM/yyyy", { locale: ptBR })}
                          </TableCell>
                          <TableCell>
                            <Badge variant={transaction.type === 'income' ? 'default' : 'destructive'}>
                              {transaction.type === 'income' ? 'Receita' : 'Despesa'}
                            </Badge>
                          </TableCell>
                          <TableCell>{transaction.category}</TableCell>
                          <TableCell>{transaction.description}</TableCell>
                          <TableCell className="capitalize">{transaction.payment_method.replace('_', ' ')}</TableCell>
                          <TableCell>
                            <Badge 
                              variant={
                                transaction.status === 'paid' ? 'default' : 
                                transaction.status === 'pending' ? 'secondary' : 
                                'outline'
                              }
                            >
                              {transaction.status === 'paid' ? 'Pago' : 
                               transaction.status === 'pending' ? 'Pendente' : 
                               'Cancelado'}
                            </Badge>
                          </TableCell>
                          <TableCell className={`text-right font-bold ${
                            transaction.type === 'income' ? 'text-success' : 'text-destructive'
                          }`}>
                            {transaction.type === 'income' ? '+' : '-'} R$ {transaction.amount.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => setDeleteTransactionId(transaction.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      <DeleteConfirmDialog
        open={!!deleteTransactionId}
        onOpenChange={() => setDeleteTransactionId(null)}
        onConfirm={handleDeleteTransaction}
        description="Você tem certeza que deseja excluir esta transação? Esta ação não pode ser desfeita e você perderá todos os dados relacionados."
      />

      <DeleteConfirmDialog
        open={!!deleteBusinessId}
        onOpenChange={() => setDeleteBusinessId(null)}
        onConfirm={handleDeleteBusiness}
        description="Você tem certeza que deseja excluir este negócio? Esta ação excluirá TODAS as transações associadas a ele e não pode ser desfeita!"
      />
    </div>
  );
};