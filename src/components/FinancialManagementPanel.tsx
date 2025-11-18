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
  Filter,
  Edit2,
  ChevronUp,
  ChevronDown
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { DeleteConfirmDialog } from "@/components/ui/delete-confirm-dialog";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ImageUpload } from "@/components/ImageUpload";

interface Business {
  id: string;
  name: string;
  business_type: 'personal' | 'company';
  description?: string;
  logo_url?: string;
  order_index: number;
  created_at: string;
}

interface Category {
  id: string;
  name: string;
  color: string;
  business_id: string;
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
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>(format(new Date(), 'yyyy-MM'));
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isBusinessDialogOpen, setIsBusinessDialogOpen] = useState(false);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [consolidationMode, setConsolidationMode] = useState(false);
  const [deleteTransactionId, setDeleteTransactionId] = useState<string | null>(null);
  const [deleteBusinessId, setDeleteBusinessId] = useState<string | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingBusiness, setEditingBusiness] = useState<Business | null>(null);
  const [isEditTransactionDialogOpen, setIsEditTransactionDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const [categoryFormData, setCategoryFormData] = useState({
    name: '',
    color: '#6366f1'
  });

  const [businessFormData, setBusinessFormData] = useState({
    name: '',
    business_type: 'personal' as 'personal' | 'company',
    description: '',
    logo_url: ''
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
      loadCategories();
    }
  }, [selectedBusiness]);

  useEffect(() => {
    if (selectedBusiness) {
      loadTransactions();
    }
  }, [selectedMonth]);

  const loadBusinesses = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('financial_businesses')
        .select('*')
        .eq('user_id', user.id)
        .order('order_index', { ascending: true });

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

  const loadCategories = async () => {
    try {
      if (!selectedBusiness) return;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('financial_categories')
        .select('*')
        .eq('business_id', selectedBusiness.id)
        .order('name');

      if (error) throw error;
      setCategories((data || []) as Category[]);
    } catch (error: any) {
      toast.error("Erro ao carregar categorias");
    }
  };

  const handleAddCategory = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !selectedBusiness) return;

      if (!categoryFormData.name.trim()) {
        toast.error("Nome da categoria é obrigatório");
        return;
      }

      const { error } = await supabase
        .from('financial_categories')
        .insert([{
          user_id: user.id,
          business_id: selectedBusiness.id,
          ...categoryFormData
        }]);

      if (error) throw error;

      toast.success("Categoria adicionada com sucesso!");
      setIsCategoryDialogOpen(false);
      loadCategories();
      
      setCategoryFormData({
        name: '',
        color: '#6366f1'
      });
    } catch (error: any) {
      toast.error("Erro ao adicionar categoria");
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

      // Get max order_index
      const { data: maxOrderData } = await supabase
        .from('financial_businesses')
        .select('order_index')
        .eq('user_id', user.id)
        .order('order_index', { ascending: false })
        .limit(1);

      const maxOrder = maxOrderData?.[0]?.order_index ?? -1;

      const { error } = await supabase
        .from('financial_businesses')
        .insert([{
          user_id: user.id,
          ...businessFormData,
          order_index: maxOrder + 1
        }]);

      if (error) throw error;

      toast.success("Negócio adicionado com sucesso!");
      setIsBusinessDialogOpen(false);
      loadBusinesses();
      
      setBusinessFormData({
        name: '',
        business_type: 'personal',
        description: '',
        logo_url: ''
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

  const handleEditBusiness = async () => {
    if (!editingBusiness) return;

    try {
      if (!businessFormData.name.trim()) {
        toast.error("Nome do negócio é obrigatório");
        return;
      }

      const { error } = await supabase
        .from('financial_businesses')
        .update({
          name: businessFormData.name,
          business_type: businessFormData.business_type,
          description: businessFormData.description,
          logo_url: businessFormData.logo_url
        })
        .eq('id', editingBusiness.id);

      if (error) throw error;

      toast.success("Negócio atualizado com sucesso!");
      setIsEditDialogOpen(false);
      setEditingBusiness(null);
      loadBusinesses();
      
      setBusinessFormData({
        name: '',
        business_type: 'personal',
        description: '',
        logo_url: ''
      });
    } catch (error: any) {
      toast.error("Erro ao atualizar negócio");
    }
  };

  const openEditDialog = (business: Business) => {
    setEditingBusiness(business);
    setBusinessFormData({
      name: business.name,
      business_type: business.business_type,
      description: business.description || '',
      logo_url: business.logo_url || ''
    });
    setIsEditDialogOpen(true);
  };

  const moveBusiness = async (business: Business, direction: 'up' | 'down') => {
    const currentIndex = businesses.findIndex(b => b.id === business.id);
    if (
      (direction === 'up' && currentIndex === 0) || 
      (direction === 'down' && currentIndex === businesses.length - 1)
    ) {
      return;
    }

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    const targetBusiness = businesses[targetIndex];

    try {
      // Swap order_index values
      await supabase
        .from('financial_businesses')
        .update({ order_index: targetBusiness.order_index })
        .eq('id', business.id);

      await supabase
        .from('financial_businesses')
        .update({ order_index: business.order_index })
        .eq('id', targetBusiness.id);

      loadBusinesses();
    } catch (error: any) {
      toast.error("Erro ao reordenar negócios");
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

  const openEditTransactionDialog = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setFormData({
      type: transaction.type,
      category: transaction.category,
      description: transaction.description,
      amount: transaction.amount.toString(),
      date: transaction.date,
      payment_method: transaction.payment_method,
      status: transaction.status
    });
    setIsEditTransactionDialogOpen(true);
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
          date: formData.date,
          payment_method: formData.payment_method,
          status: formData.status
        })
        .eq('id', editingTransaction.id);

      if (error) throw error;

      toast.success("Transação atualizada com sucesso!");
      setIsEditTransactionDialogOpen(false);
      setEditingTransaction(null);
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
      toast.error("Erro ao atualizar transação");
    }
  };

  const filteredTransactions = transactions.filter(t => {
    // Filter by category
    if (selectedCategory !== 'all' && t.category !== selectedCategory) return false;
    
    // Filter by type
    if (filter !== 'all' && t.type !== filter) return false;
    
    // Filter by selected month
    const transactionDate = new Date(t.date);
    const [year, month] = selectedMonth.split('-');
    
    if (transactionDate.getFullYear() !== parseInt(year) || 
        transactionDate.getMonth() !== parseInt(month) - 1) {
      return false;
    }
    
    return true;
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
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Adicionar Negócio</DialogTitle>
                <DialogDescription>Crie um novo negócio para gerenciar suas finanças</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <ImageUpload
                  currentImage={businessFormData.logo_url}
                  onImageSelect={(url) => setBusinessFormData({...businessFormData, logo_url: url})}
                  bucketName="business-logos"
                  label="Logo do Negócio (opcional)"
                />
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
                {businesses.map((business, index) => (
                  <Card 
                    key={business.id}
                    className={`cursor-pointer transition-smooth hover:shadow-glow ${
                      selectedBusiness?.id === business.id ? 'border-primary shadow-glow' : ''
                    }`}
                    onClick={() => setSelectedBusiness(business)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {business.logo_url && (
                            <img 
                              src={business.logo_url} 
                              alt={business.name}
                              className="w-12 h-12 rounded-lg object-cover flex-shrink-0 border"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-base truncate">{business.name}</CardTitle>
                            <Badge variant="outline" className="mt-2">
                              {business.business_type === 'personal' ? 'Pessoa Física' : 'Pessoa Jurídica'}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex flex-col gap-1 flex-shrink-0">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={(e) => {
                              e.stopPropagation();
                              moveBusiness(business, 'up');
                            }}
                            disabled={index === 0}
                          >
                            <ChevronUp className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={(e) => {
                              e.stopPropagation();
                              moveBusiness(business, 'down');
                            }}
                            disabled={index === businesses.length - 1}
                          >
                            <ChevronDown className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      {business.description && (
                        <p className="text-sm text-muted-foreground mt-2">{business.description}</p>
                      )}
                      <div className="flex gap-2 mt-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditDialog(business);
                          }}
                          className="flex-1"
                        >
                          <Edit2 className="h-3 w-3 mr-1" />
                          Editar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteBusinessId(business.id);
                          }}
                          className="flex-1"
                        >
                          <Trash2 className="h-3 w-3 mr-1 text-destructive" />
                          Excluir
                        </Button>
                      </div>
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
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h3 className="text-xl font-semibold">
              {consolidationMode 
                ? `Consolidado (${selectedBusinessesForSum.length} negócios)` 
                : selectedBusiness?.name}
            </h3>
            <div className="flex items-center gap-2 flex-wrap">
              <Input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-auto"
              />
              <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" disabled={!selectedBusiness}>
                    <Plus className="mr-2 h-4 w-4" />
                    Cadastrar Categoria
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[400px]">
                  <DialogHeader>
                    <DialogTitle>Nova Categoria</DialogTitle>
                    <DialogDescription>
                      Adicione uma categoria para organizar suas transações
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label>Nome da Categoria *</Label>
                      <Input 
                        value={categoryFormData.name}
                        onChange={(e) => setCategoryFormData({...categoryFormData, name: e.target.value})}
                        placeholder="Ex: Vendas, Marketing, Salários..."
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Cor</Label>
                      <Input 
                        type="color"
                        value={categoryFormData.color}
                        onChange={(e) => setCategoryFormData({...categoryFormData, color: e.target.value})}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsCategoryDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleAddCategory} className="gradient-primary">
                      Adicionar
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
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
                    <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.name}>
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-3 h-3 rounded-full" 
                                style={{ backgroundColor: cat.color }}
                              />
                              {cat.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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

          {/* Abas de Categorias */}
          {categories.length > 0 && (
            <Card className="glass">
              <CardHeader>
                <CardTitle>Categorias</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
                  <TabsList className="w-full justify-start flex-wrap h-auto">
                    <TabsTrigger value="all">
                      Todas
                    </TabsTrigger>
                    {categories.map((category) => (
                      <TabsTrigger key={category.id} value={category.name} className="gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: category.color }}
                        />
                        {category.name}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
              </CardContent>
            </Card>
          )}

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
                            <div className="flex items-center justify-end gap-1">
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => openEditTransactionDialog(transaction)}
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => setDeleteTransactionId(transaction.id)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
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

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Negócio</DialogTitle>
            <DialogDescription>Atualize as informações do negócio</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <ImageUpload
              currentImage={businessFormData.logo_url}
              onImageSelect={(url) => setBusinessFormData({...businessFormData, logo_url: url})}
              bucketName="business-logos"
              label="Logo do Negócio (opcional)"
            />
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
            <Button variant="outline" onClick={() => {
              setIsEditDialogOpen(false);
              setEditingBusiness(null);
              setBusinessFormData({
                name: '',
                business_type: 'personal',
                description: '',
                logo_url: ''
              });
            }}>
              Cancelar
            </Button>
            <Button onClick={handleEditBusiness} className="gradient-primary">
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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

      <Dialog open={isEditTransactionDialogOpen} onOpenChange={setIsEditTransactionDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Transação</DialogTitle>
            <DialogDescription>Atualize os dados da transação</DialogDescription>
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
              <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.name}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: cat.color }}
                        />
                        {cat.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Descrição</Label>
              <Input 
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Descrição detalhada..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
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
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Método de Pagamento</Label>
                <Select value={formData.payment_method} onValueChange={(value) => setFormData({...formData, payment_method: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dinheiro">Dinheiro</SelectItem>
                    <SelectItem value="pix">PIX</SelectItem>
                    <SelectItem value="credito">Cartão de Crédito</SelectItem>
                    <SelectItem value="debito">Cartão de Débito</SelectItem>
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsEditTransactionDialogOpen(false);
              setEditingTransaction(null);
              setFormData({
                type: 'income',
                category: '',
                description: '',
                amount: '',
                date: format(new Date(), 'yyyy-MM-dd'),
                payment_method: 'dinheiro',
                status: 'paid'
              });
            }}>
              Cancelar
            </Button>
            <Button onClick={handleEditTransaction} className="gradient-primary">
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};