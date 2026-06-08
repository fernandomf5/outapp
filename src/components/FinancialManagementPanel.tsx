import { useState, useEffect, useCallback, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Plus, Edit2, Trash2, Check, Calculator, CalendarIcon, BarChart3, ArrowLeft, TableIcon, LineChart, ListPlus, Users, Wallet, TrendingUp, TrendingDown, History, PieChart } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, startOfMonth, endOfMonth, isWithinInterval, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Switch } from "@/components/ui/switch";
import { arrayMove } from "@dnd-kit/sortable";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { BusinessSelector } from "@/components/financial/BusinessSelector";
import { FinancialAnalyticsPanel } from "@/components/financial/FinancialAnalyticsPanel";
import { DebtorsPanel } from "@/components/financial/DebtorsPanel";
import { CashboxPanel } from "@/components/financial/CashboxPanel";
import { BankAccountsPanel } from "@/components/financial/BankAccountsPanel";
import { FinanceSummary } from "@/components/financial/FinanceSummary";
import { useBankAccounts } from "@/hooks/useBankAccounts";



interface Business {
  id: string;
  name: string;
  business_type: 'personal' | 'company';
  description?: string;
}

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
  monthly_status?: { [key: string]: 'paid' | 'pending' | 'cancelled' };
  business_id?: string;
  order_index?: number;
}

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

interface SortableRowProps {
  transaction: Transaction;
  onStatusChange: (transaction: Transaction, status: 'paid' | 'pending' | 'cancelled') => void;
  onEdit: (transaction: Transaction) => void;
  onDelete: (id: string) => void;
  autoSumMode?: boolean;
  isSelected?: boolean;
  onSelect?: (id: string, selected: boolean) => void;
  totalCount: number;
  displayOrder: number;
  onChangeOrder: (transactionId: string, newOrder1Based: number) => void;
}

const SortableRow = ({ transaction, onStatusChange, onEdit, onDelete, autoSumMode, isSelected, onSelect, totalCount, displayOrder, onChangeOrder }: SortableRowProps) => {
  const [localOrder, setLocalOrder] = useState(displayOrder.toString());
  
  // Sync with external displayOrder when it changes
  useEffect(() => {
    setLocalOrder(displayOrder.toString());
  }, [displayOrder]);

  const handleOrderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocalOrder(value);
  };

  const handleOrderBlur = () => {
    const val = parseInt(localOrder, 10);
    if (!Number.isFinite(val) || val < 1) {
      setLocalOrder(displayOrder.toString());
      return;
    }
    const clamped = Math.max(1, Math.min(totalCount, val));
    if (clamped !== displayOrder) {
      onChangeOrder(transaction.id, clamped);
    } else {
      setLocalOrder(displayOrder.toString());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur();
    }
  };

  return (
    <>
      {/* Desktop Row */}
      <TableRow className={cn(
        "hidden md:table-row transition-all duration-300 ease-in-out",
        transaction.status === 'paid' ? 'bg-green-500/15 hover:bg-green-500/20' : '',
        isSelected ? 'bg-primary/10 hover:bg-primary/15' : ''
      )}>
        {autoSumMode && (
          <TableCell className="w-[40px]">
            <Checkbox
              checked={isSelected}
              onCheckedChange={(checked) => onSelect?.(transaction.id, !!checked)}
            />
          </TableCell>
        )}
        <TableCell className="w-[70px]">
          <Input
            type="number"
            min={1}
            max={totalCount}
            value={localOrder}
            onChange={handleOrderChange}
            onBlur={handleOrderBlur}
            onKeyDown={handleKeyDown}
            className="h-8 w-14 text-center font-semibold"
          />
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            <div>
              <Badge variant={transaction.type === 'income' ? 'default' : 'destructive'}>
                {transaction.type === 'income' ? 'Receita' : 'Despesa'}
              </Badge>
              {transaction.is_recurring && <Badge className="ml-2" variant="outline">Fixa</Badge>}
            </div>
          </div>
        </TableCell>
        <TableCell>{transaction.description}</TableCell>
        <TableCell>{transaction.category}</TableCell>
        <TableCell>{format(new Date(transaction.due_date + 'T00:00:00'), 'dd/MM/yyyy')}</TableCell>
        <TableCell className="font-semibold">R$ {Number(transaction.amount).toFixed(2)}</TableCell>
        <TableCell>
          <Select value={transaction.status} onValueChange={(v) => onStatusChange(transaction, v as any)}>
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
            <Button variant="ghost" size="icon" onClick={() => onEdit(transaction)}>
              <Edit2 className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => onDelete(transaction.id)}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </TableCell>
      </TableRow>

      {/* Mobile Card */}
      <tr className={cn(
        "md:hidden block transition-all duration-300 ease-in-out",
        transaction.status === 'paid' ? 'bg-green-500/15' : '',
        isSelected ? 'bg-primary/10' : ''
      )}>
        <td colSpan={9} className="p-0">
          <div className="p-3 border-b space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {autoSumMode && (
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={(checked) => onSelect?.(transaction.id, !!checked)}
                  />
                )}
                <Input
                  type="number"
                  min={1}
                  max={totalCount}
                  value={localOrder}
                  onChange={handleOrderChange}
                  onBlur={handleOrderBlur}
                  onKeyDown={handleKeyDown}
                  className="h-8 w-14 text-center font-semibold shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate">{transaction.description}</p>
                  <p className="text-xs text-muted-foreground">{transaction.category}</p>
                </div>
              </div>
              <div className="flex gap-1 shrink-0">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(transaction)}>
                  <Edit2 className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onDelete(transaction.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={transaction.type === 'income' ? 'default' : 'destructive'} className="text-xs">
                {transaction.type === 'income' ? 'Receita' : 'Despesa'}
              </Badge>
              {transaction.is_recurring && <Badge variant="outline" className="text-xs">Fixa</Badge>}
              <span className="text-xs text-muted-foreground">
                {format(new Date(transaction.due_date + 'T00:00:00'), 'dd/MM/yyyy')}
              </span>
            </div>
            
            <div className="flex items-center justify-between gap-2">
              <span className={cn(
                "text-lg font-bold",
                transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
              )}>
                R$ {Number(transaction.amount).toFixed(2)}
              </span>
              <Select value={transaction.status} onValueChange={(v) => onStatusChange(transaction, v as any)}>
                <SelectTrigger className="w-[110px] h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="paid">Pago</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </td>
      </tr>
    </>
  );
};

interface TeamContext {
  adminUserId: string;
  allowedIds: string[];
}

interface FinancialManagementPanelProps {
  teamContext?: TeamContext;
}

export const FinancialManagementPanel = ({ teamContext }: FinancialManagementPanelProps) => {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selectedBusinessId, setSelectedBusinessId] = useState<string>('');
  const [selectedBusinessIds, setSelectedBusinessIds] = useState<string[]>([]);
  const [isConsolidatedView, setIsConsolidatedView] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'MMMM', { locale: ptBR }));
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isBusinessDialogOpen, setIsBusinessDialogOpen] = useState(false);
  const [isEditBusinessDialogOpen, setIsEditBusinessDialogOpen] = useState(false);
  const [editingBusiness, setEditingBusiness] = useState<Business | null>(null);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [isEditCategoryDialogOpen, setIsEditCategoryDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [categoryFormData, setCategoryFormData] = useState({ name: '' });
  const [categories, setCategories] = useState<string[]>([]);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isComparisonOpen, setIsComparisonOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(false);
  
  // View modes
  const [viewMode, setViewMode] = useState<'selection' | 'management'>('selection');
  const [activeTab, setActiveTab] = useState<'table' | 'analytics' | 'debtors' | 'cashbox'>('table');
  
  
  // Filtro por data
  const [dateFilterStart, setDateFilterStart] = useState<Date | undefined>(undefined);
  const [dateFilterEnd, setDateFilterEnd] = useState<Date | undefined>(undefined);
  
  // Autosoma
  const [autoSumMode, setAutoSumMode] = useState(false);
  const [selectedTransactionIds, setSelectedTransactionIds] = useState<Set<string>>(new Set());
  const [businessFormData, setBusinessFormData] = useState({
    name: '',
    business_type: 'personal' as 'personal' | 'company',
    description: ''
  });

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
    business_id: '',
    bank_account_id: '',
    installments: 1
  });


  // Multi-transaction dialog state
  const [isMultiTransactionDialogOpen, setIsMultiTransactionDialogOpen] = useState(false);
  const [multiTransactionForm, setMultiTransactionForm] = useState({
    transactions: '',
    type: 'expense' as 'income' | 'expense',
    category: '',
    payment_method: 'pix',
    status: 'pending' as 'paid' | 'pending' | 'cancelled',
    is_recurring: false,
    due_date: format(new Date(), 'yyyy-MM-dd'),
  });

  // State for optimistic UI updates
  const [localTransactions, setLocalTransactions] = useState<Transaction[]>([]);

  const { bankAccounts, refetch: refetchBankAccounts } = useBankAccounts(selectedBusinessId);

  useEffect(() => {
    loadBusinesses();
    loadCategories();
  }, [teamContext?.adminUserId]);


  useEffect(() => {
    if (selectedBusinessId || (isConsolidatedView && selectedBusinessIds.length > 0)) {
      loadTransactions();
    }
  }, [selectedBusinessId, selectedBusinessIds, isConsolidatedView, selectedMonth, selectedYear, teamContext?.adminUserId]);

  const loadBusinesses = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // If teamContext is provided, use adminUserId and filter by allowedIds
      const targetUserId = teamContext?.adminUserId || user.id;

      let query = supabase
        .from('financial_businesses')
        .select('*')
        .eq('user_id', targetUserId)
        .order('created_at', { ascending: false });

      // If team member with specific allowed IDs, filter by them
      if (teamContext?.allowedIds && teamContext.allowedIds.length > 0) {
        query = query.in('id', teamContext.allowedIds);
      }

      const { data, error } = await query;

      if (error) throw error;
      setBusinesses((data || []) as Business[]);
      
      // Don't auto-select - let user choose
    } catch (error: any) {
      toast.error('Erro ao carregar negócios');
    }
  };

  const handleSelectBusiness = (businessId: string) => {
    setSelectedBusinessId(businessId);
    setIsConsolidatedView(false);
    setSelectedBusinessIds([]);
    setViewMode('management');
  };

  const handleSelectMultipleBusinesses = (businessIds: string[]) => {
    setSelectedBusinessIds(businessIds);
    setSelectedBusinessId('');
    setIsConsolidatedView(true);
    setViewMode('management');
  };

  const handleBackToSelection = () => {
    setViewMode('selection');
    setSelectedBusinessId('');
    setSelectedBusinessIds([]);
    setIsConsolidatedView(false);
  };

  const handleCreateBusinessFromSelector = async (data: { name: string; business_type: 'personal' | 'company'; description: string }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: newBusiness, error } = await supabase
        .from('financial_businesses')
        .insert({
          user_id: user.id,
          name: data.name,
          business_type: data.business_type,
          description: data.description || null
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Negócio criado com sucesso!');
      loadBusinesses();
      
      // Auto-select the new business
      if (newBusiness) {
        setSelectedBusinessId(newBusiness.id);
        setViewMode('management');
      }
    } catch (error: any) {
      toast.error('Erro ao criar negócio');
    }
  };

  const loadTransactions = async () => {
    if (!selectedBusinessId && !isConsolidatedView) return;
    
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const targetUserId = teamContext?.adminUserId || user.id;

      let query = supabase
        .from('financial_transactions')
        .select('*')
        .eq('user_id', targetUserId)
        .eq('year', selectedYear)
        .order('due_date', { ascending: true });

      if (isConsolidatedView && selectedBusinessIds.length > 0) {
        query = query.in('business_id', selectedBusinessIds);
      } else {
        query = query.eq('business_id', selectedBusinessId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setTransactions((data || []) as any);
    } catch (error: any) {
      toast.error('Erro ao carregar transações');
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Use adminUserId if teamContext is provided
      const targetUserId = teamContext?.adminUserId || user.id;

      const { data, error } = await supabase
        .from('financial_categories')
        .select('name')
        .eq('user_id', targetUserId)
        .order('name');

      if (error) throw error;
      setCategories((data || []).map(c => c.name).filter(n => n && n.trim() !== ''));
    } catch (error: any) {
      toast.error('Erro ao carregar categorias');
    }
  };

  const handleAddBusiness = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('financial_businesses')
        .insert({
          user_id: user.id,
          name: businessFormData.name,
          business_type: businessFormData.business_type,
          description: businessFormData.description || null
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Negócio adicionado!');
      setIsBusinessDialogOpen(false);
      setBusinessFormData({ name: '', business_type: 'personal', description: '' });
      loadBusinesses();
    } catch (error: any) {
      toast.error('Erro ao adicionar negócio');
    }
  };

  const handleEditBusiness = async () => {
    if (!editingBusiness) return;

    try {
      const { error } = await supabase
        .from('financial_businesses')
        .update({
          name: businessFormData.name,
          business_type: businessFormData.business_type,
          description: businessFormData.description || null
        })
        .eq('id', editingBusiness.id);

      if (error) throw error;

      toast.success('Negócio atualizado!');
      setIsEditBusinessDialogOpen(false);
      setEditingBusiness(null);
      setBusinessFormData({ name: '', business_type: 'personal', description: '' });
      loadBusinesses();
    } catch (error: any) {
      toast.error('Erro ao atualizar negócio');
    }
  };

  const handleDeleteBusiness = async (id: string) => {
    if (!confirm('Tem certeza? Todas as transações serão excluídas.')) return;

    try {
      const { error } = await supabase
        .from('financial_businesses')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Negócio excluído!');
      loadBusinesses();
    } catch (error: any) {
      toast.error('Erro ao excluir negócio');
    }
  };

  const openEditBusiness = (business: Business) => {
    setEditingBusiness(business);
    setBusinessFormData({
      name: business.name,
      business_type: business.business_type,
      description: business.description || ''
    });
    setIsEditBusinessDialogOpen(true);
  };

  const handleAddCategory = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('financial_categories')
        .insert({ user_id: user.id, name: categoryFormData.name });

      if (error) throw error;

      toast.success('Categoria adicionada!');
      setIsCategoryDialogOpen(false);
      setCategoryFormData({ name: '' });
      loadCategories();
    } catch (error: any) {
      toast.error('Erro ao adicionar categoria');
    }
  };

  const handleEditCategory = async () => {
    if (!editingCategory) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('financial_categories')
        .update({ name: categoryFormData.name })
        .eq('user_id', user.id)
        .eq('name', editingCategory);

      if (error) throw error;

      toast.success('Categoria atualizada!');
      setIsEditCategoryDialogOpen(false);
      setEditingCategory(null);
      setCategoryFormData({ name: '' });
      loadCategories();
    } catch (error: any) {
      toast.error('Erro ao atualizar categoria');
    }
  };

  const handleDeleteCategory = async (name: string) => {
    if (!confirm('Tem certeza? Transações com essa categoria não serão excluídas.')) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('financial_categories')
        .delete()
        .eq('user_id', user.id)
        .eq('name', name);

      if (error) throw error;
      toast.success('Categoria excluída!');
      loadCategories();
    } catch (error: any) {
      toast.error('Erro ao excluir categoria');
    }
  };

  const openEditCategory = (name: string) => {
    setEditingCategory(name);
    setCategoryFormData({ name });
    setIsEditCategoryDialogOpen(true);
  };

  const handleAddTransaction = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const isCardPayment = formData.payment_method === 'cartao_credito';
      const installments = isCardPayment ? Math.max(1, formData.installments) : 1;
      const totalAmount = parseFloat(formData.amount);
      const installmentAmount = totalAmount / installments;
      
      const baseDueDate = new Date(formData.due_date + 'T12:00:00');
      
      // Use the month selected by the user in the form, not derived from due_date
      const baseMonthIndex = MONTHS.indexOf(formData.month);
      
      const transactionsToInsert = [];
      
      for (let i = 0; i < installments; i++) {
        const installmentDate = new Date(baseDueDate);
        installmentDate.setMonth(installmentDate.getMonth() + i);
        
        // For the first installment, use the user-selected month directly
        // For subsequent installments, increment from the selected month
        const currentMonthIndex = (baseMonthIndex + i) % 12;
        const installmentMonth = MONTHS[currentMonthIndex];
        const installmentYear = baseMonthIndex + i >= 12 
          ? baseDueDate.getFullYear() + Math.floor((baseMonthIndex + i) / 12)
          : baseDueDate.getFullYear();
        
        const description = installments > 1 
          ? `${formData.description} (${i + 1}/${installments})`
          : formData.description;
        
        transactionsToInsert.push({
          user_id: user.id,
          business_id: selectedBusinessId,
          bank_account_id: formData.bank_account_id || null,
          type: formData.type,
          category: formData.category,
          description: description,
          amount: parseFloat(installmentAmount.toFixed(2)),
          month: installmentMonth,
          due_date: installmentDate.toISOString().split('T')[0],
          payment_method: formData.payment_method,
          status: formData.status,
          is_recurring: formData.is_recurring,
          reminder_enabled: formData.reminder_enabled,
          year: installmentYear,
          date: new Date().toISOString(),
          status_history: [{
            status: formData.status,
            changed_at: new Date().toISOString(),
            note: installments > 1 ? `Parcela ${i + 1} de ${installments} criada` : 'Transação criada'
          }]
        });

      }

      const { error } = await supabase
        .from('financial_transactions')
        .insert(transactionsToInsert);

      if (error) throw error;

      const successMessage = installments > 1 
        ? `${installments} parcelas adicionadas com sucesso!`
        : 'Transação adicionada!';
      
      toast.success(successMessage);
      setIsAddDialogOpen(false);
      resetForm();
      loadTransactions();
    } catch (error: any) {
      toast.error('Erro ao adicionar transação');
    }
  };

  const handleAddMultipleTransactions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const lines = multiTransactionForm.transactions
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);

      if (lines.length === 0) {
        toast.error('Digite pelo menos uma transação');
        return;
      }

      const baseDueDate = new Date(multiTransactionForm.due_date + 'T12:00:00');
      const monthIndex = baseDueDate.getMonth();
      const transactionMonth = MONTHS[monthIndex];
      const transactionYear = baseDueDate.getFullYear();

      const transactionsToInsert = lines.map(line => {
        // Check if line contains a value (format: "description - value" or "description: value" or "description value")
        const valueMatch = line.match(/[\s\-:]+(\d+[.,]?\d*)\s*$/);
        let description = line;
        let amount = 0;

        if (valueMatch) {
          description = line.replace(valueMatch[0], '').trim();
          amount = parseFloat(valueMatch[1].replace(',', '.'));
        }

        return {
          user_id: user.id,
          business_id: selectedBusinessId,
          type: multiTransactionForm.type,
          category: multiTransactionForm.category || 'Geral',
          description: description,
          amount: amount,
          month: transactionMonth,
          due_date: baseDueDate.toISOString().split('T')[0],
          payment_method: multiTransactionForm.payment_method,
          status: multiTransactionForm.status,
          is_recurring: multiTransactionForm.is_recurring,
          reminder_enabled: false,
          year: transactionYear,
          date: new Date().toISOString(),
          status_history: [{
            status: multiTransactionForm.status,
            changed_at: new Date().toISOString(),
            note: 'Transação criada em lote'
          }]
        };
      });

      const { error } = await supabase
        .from('financial_transactions')
        .insert(transactionsToInsert);

      if (error) throw error;

      toast.success(`${transactionsToInsert.length} transações adicionadas com sucesso!`);
      setIsMultiTransactionDialogOpen(false);
      setMultiTransactionForm({
        transactions: '',
        type: 'expense',
        category: '',
        payment_method: 'pix',
        status: 'pending',
        is_recurring: false,
        due_date: format(new Date(), 'yyyy-MM-dd'),
      });
      loadTransactions();
    } catch (error: any) {
      toast.error('Erro ao adicionar transações');
    }
  };

  const handleEditTransaction = async () => {
    if (!editingTransaction) return;

    try {
      // Converte a data para o formato correto sem problemas de timezone
      const dueDate = new Date(formData.due_date + 'T12:00:00');

      const { error } = await supabase
        .from('financial_transactions')
        .update({
          type: formData.type,
          category: formData.category,
          description: formData.description,
          amount: parseFloat(formData.amount),
          month: formData.month,
          due_date: dueDate.toISOString().split('T')[0],
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
        note: `Status alterado para ${newStatus} no mês ${selectedMonth}/${selectedYear}`
      }];

      // Se é transação fixa, salva o status específico do mês
      if (transaction.is_recurring) {
        const monthKey = `${selectedMonth}-${selectedYear}`;
        const monthlyStatus = transaction.monthly_status || {};
        monthlyStatus[monthKey] = newStatus;

        const { error } = await supabase
          .from('financial_transactions')
          .update({ 
            monthly_status: monthlyStatus as any,
            status_history: statusHistory as any
          })
          .eq('id', transaction.id);

        if (error) throw error;
      } else {
        // Para transações não fixas, atualiza o status global
        const { error } = await supabase
          .from('financial_transactions')
          .update({ 
            status: newStatus,
            status_history: statusHistory as any
          })
          .eq('id', transaction.id);

        if (error) throw error;
      }
      
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
      business_id: selectedBusinessId,
      bank_account_id: '',
      installments: 1
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
      business_id: transaction.business_id || selectedBusinessId,
      bank_account_id: (transaction as any).bank_account_id || '',
      installments: 1
    });
    setIsEditDialogOpen(true);
  };


  // Função para obter o status de uma transação fixa no mês selecionado
  const getTransactionStatus = (transaction: Transaction) => {
    if (transaction.is_recurring && transaction.monthly_status) {
      const monthKey = `${selectedMonth}-${selectedYear}`;
      return transaction.monthly_status[monthKey] || transaction.status;
    }
    return transaction.status;
  };

  // Função para alterar a ordem de uma transação por número (com atualização otimista)
  // Propaga a ordem para todos os meses futuros automaticamente
  const handleChangeOrder = useCallback(async (transactionId: string, newOrder1Based: number) => {
    // Work with current local state for optimistic update
    const currentList = [...localTransactions];
    const currentIndex = currentList.findIndex((t) => t.id === transactionId);
    if (currentIndex === -1) return;

    const newIndex = Math.max(0, Math.min(currentList.length - 1, newOrder1Based - 1));
    if (currentIndex === newIndex) return;

    // Optimistically update local state with animation
    const newList = arrayMove(currentList, currentIndex, newIndex).map((t, idx) => ({
      ...t,
      order_index: idx
    }));
    setLocalTransactions(newList);

    // Persist to database in background
    try {
      // Create a map of description -> new order_index for the current month
      const orderMap = new Map<string, number>();
      newList.forEach((transaction, index) => {
        orderMap.set(transaction.description.toLowerCase().trim(), index);
      });

      // Update transactions in current month
      const updates = newList.map((transaction, index) => ({
        id: transaction.id,
        order_index: index,
      }));

      for (const update of updates) {
        await supabase
          .from('financial_transactions')
          .update({ order_index: update.order_index })
          .eq('id', update.id);
      }

      // Propagate order to future months
      const currentMonthIndex = MONTHS.indexOf(selectedMonth);
      const futureMonths = MONTHS.slice(currentMonthIndex + 1);
      
      if (futureMonths.length > 0) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const targetUserId = teamContext?.adminUserId || user.id;

        // Get all transactions for the same year and business that could appear in future months
        // This includes:
        // 1. Non-recurring transactions in future months
        // 2. Recurring transactions that started in current or earlier months (they appear in future months too)
        const { data: allTransactions, error: fetchError } = await supabase
          .from('financial_transactions')
          .select('*')
          .eq('user_id', targetUserId)
          .eq('business_id', selectedBusinessId)
          .eq('year', selectedYear);

        if (fetchError) throw fetchError;

        if (allTransactions && allTransactions.length > 0) {
          // Filter transactions that would appear in future months
          const transactionsToUpdate = allTransactions.filter(tx => {
            // Skip transactions already in current month's list (already updated)
            if (newList.some(t => t.id === tx.id)) return false;
            
            const txMonthIndex = MONTHS.indexOf(tx.month);
            
            if (tx.is_recurring) {
              // Recurring transactions appear from their start month onwards
              // So if they started at or before current month, they appear in future months
              return txMonthIndex <= currentMonthIndex;
            } else {
              // Non-recurring transactions only appear in their specific month
              return txMonthIndex > currentMonthIndex;
            }
          });

          // Update order_index for matching transactions
          for (const tx of transactionsToUpdate) {
            const matchingOrder = orderMap.get(tx.description.toLowerCase().trim());
            if (matchingOrder !== undefined && tx.order_index !== matchingOrder) {
              await supabase
                .from('financial_transactions')
                .update({ order_index: matchingOrder })
                .eq('id', tx.id);
            }
          }
        }
      }
      
      toast.success('Ordem atualizada para este mês e meses futuros!');
    } catch (error) {
      console.error('Erro ao atualizar ordem:', error);
      toast.error('Erro ao atualizar ordem');
      // Revert on error
      loadTransactions();
    }
  }, [localTransactions, selectedMonth, selectedYear, selectedBusinessId, teamContext?.adminUserId]);

  // Filtrar transações fixas apenas a partir do mês adicionado
  const getMonthIndex = (month: string) => MONTHS.indexOf(month);
  
  const monthTransactions = transactions.filter(t => {
    // Filtro por data
    if (dateFilterStart || dateFilterEnd) {
      const dueDate = new Date(t.due_date + 'T00:00:00');
      if (dateFilterStart && dueDate < dateFilterStart) return false;
      if (dateFilterEnd && dueDate > dateFilterEnd) return false;
    }
    
    if (t.is_recurring) {
      const transactionMonthIndex = getMonthIndex(t.month);
      const selectedMonthIndex = getMonthIndex(selectedMonth);
      // Só mostra transações fixas do mês adicionado em diante
      return transactionMonthIndex <= selectedMonthIndex;
    }
    return t.month === selectedMonth;
  }).filter(t => selectedCategories.length === 0 || selectedCategories.includes(t.category || ''));

  // Todas as transações do mês com status correto (sem filtro de status) — usadas para calcular totais
  const allMonthTransactionsWithStatus = monthTransactions.map((t) => ({
    ...t,
    status: getTransactionStatus(t),
  }));

  // Ajustar totais considerando o status específico por mês (com filtro de status para exibição)
  const baseTransactionsWithMonthStatus = allMonthTransactionsWithStatus
    .filter((t) => statusFilter === "all" || t.status === statusFilter);

  // Sync local transactions when base data changes
  useEffect(() => {
    const sorted = [...baseTransactionsWithMonthStatus].sort((a, b) => {
      return (a.order_index || 0) - (b.order_index || 0);
    });
    setLocalTransactions(sorted);
  }, [transactions, selectedMonth, selectedYear, selectedCategories, statusFilter]);

  // Use localTransactions for display (respects statusFilter)
  const transactionsWithMonthStatus = localTransactions;

  // Totais calculados SEMPRE sobre todas as transações do mês (sem depender de statusFilter)
  const totalIncome = allMonthTransactionsWithStatus
    .filter(t => t.type === 'income' && t.status === 'paid')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const totalExpense = allMonthTransactionsWithStatus
    .filter(t => t.type === 'expense' && t.status === 'paid')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const pendingAmount = allMonthTransactionsWithStatus
    .filter(t => t.status === 'pending')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  // A Receber: receitas pendentes
  const pendingIncome = allMonthTransactionsWithStatus
    .filter(t => t.type === 'income' && t.status === 'pending')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  // A Pagar: despesas pendentes
  const pendingExpense = allMonthTransactionsWithStatus
    .filter(t => t.type === 'expense' && t.status === 'pending')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  // Saldo atual (só pagos)
  const currentBalance = totalIncome - totalExpense;

  // Projeção COM receitas pendentes recebidas
  const projectionWithIncome = currentBalance + pendingIncome - pendingExpense;

  // Projeção SEM receitas pendentes (só paga despesas pendentes)
  const projectionWithoutIncome = currentBalance - pendingExpense;

  // Cálculo da autosoma
  const handleTransactionSelect = (id: string, selected: boolean) => {
    const newSelected = new Set(selectedTransactionIds);
    if (selected) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedTransactionIds(newSelected);
  };

  const autoSumTotal = transactionsWithMonthStatus
    .filter(t => selectedTransactionIds.has(t.id))
    .reduce((sum, t) => {
      if (t.type === 'income') return sum + Number(t.amount);
      return sum - Number(t.amount);
    }, 0);

  const toggleAutoSumMode = () => {
    setAutoSumMode(!autoSumMode);
    if (autoSumMode) {
      setSelectedTransactionIds(new Set());
    }
  };

  // Show business selector when in selection mode or no business selected
  if (viewMode === 'selection' || (!selectedBusinessId && !isConsolidatedView)) {
    return (
      <BusinessSelector
        businesses={businesses}
        onSelectBusiness={handleSelectBusiness}
        onSelectMultipleBusinesses={handleSelectMultipleBusinesses}
        onCreateBusiness={handleCreateBusinessFromSelector}
      />
    );
  }

  const selectedBusiness = businesses.find(b => b.id === selectedBusinessId);
  const consolidatedBusinessNames = isConsolidatedView 
    ? businesses.filter(b => selectedBusinessIds.includes(b.id)).map(b => b.name)
    : [];

  return (
    <div className="space-y-6">
      {/* Finance Summary and Bank Accounts */}
      {!isConsolidatedView && (
        <>
          <FinanceSummary 
            currentBalance={bankAccounts.reduce((acc, curr) => acc + curr.current_balance, 0)}
            pendingExpenses={transactionsWithMonthStatus
              .filter(t => t.type === 'expense' && getTransactionStatus(t) === 'pending')
              .reduce((acc, curr) => acc + Number(curr.amount), 0)}
          />
          <BankAccountsPanel 
            businessId={selectedBusinessId} 
            bankAccounts={bankAccounts} 
            onRefresh={refetchBankAccounts} 
          />
        </>
      )}

      {/* Header with back button and tabs */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={handleBackToSelection}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold">
                {isConsolidatedView 
                  ? 'Visão Consolidada' 
                  : (selectedBusiness?.name || 'Gestão Financeira')}
              </h2>
              <p className="text-sm text-muted-foreground">
                {isConsolidatedView 
                  ? consolidatedBusinessNames.join(' + ')
                  : (selectedBusiness?.business_type === 'company' ? 'Pessoa Jurídica' : 'Pessoa Física')}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsCategoryDialogOpen(true)} className="text-xs sm:text-sm">
              Categorias
            </Button>
            {!isConsolidatedView && (
              <>
                <div className="flex gap-1">
                  <Button variant="outline" size="icon" className="h-8 w-8 sm:h-9 sm:w-9" onClick={() => {
                    if (selectedBusiness) openEditBusiness(selectedBusiness);
                  }}>
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="icon" className="h-8 w-8 sm:h-9 sm:w-9" onClick={() => {
                    if (selectedBusinessId) handleDeleteBusiness(selectedBusinessId);
                  }}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                <Button variant="outline" onClick={() => setIsMultiTransactionDialogOpen(true)} size="sm" className="text-xs sm:text-sm">
                  <ListPlus className="w-4 h-4 mr-1" />
                  <span className="hidden xs:inline">Múltiplas</span>
                </Button>
                <Button onClick={() => setIsAddDialogOpen(true)} size="sm" className="text-xs sm:text-sm">
                  <Plus className="w-4 h-4 mr-1" />
                  <span className="hidden xs:inline">Nova </span>Transação
                </Button>
              </>
            )}
          </div>
        </div>

        {/* View Mode Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'table' | 'analytics' | 'debtors' | 'cashbox')} className="w-full">
          <TabsList className={cn("grid w-full max-w-2xl", isConsolidatedView ? "grid-cols-3" : "grid-cols-4")}>
            <TabsTrigger value="table" className="flex items-center gap-2">
              <TableIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Planilha</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <LineChart className="w-4 h-4" />
              <span className="hidden sm:inline">Gráficos</span>
            </TabsTrigger>
            {!isConsolidatedView && (
              <TabsTrigger value="cashbox" className="flex items-center gap-2">
                <Wallet className="w-4 h-4" />
                <span className="hidden sm:inline">Caixa</span>
              </TabsTrigger>
            )}
            {!isConsolidatedView && (
              <TabsTrigger value="debtors" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span className="hidden sm:inline">Devedores</span>
              </TabsTrigger>
            )}
          </TabsList>

          {/* Analytics Tab Content */}
          <TabsContent value="analytics" className="mt-6">
            <FinancialAnalyticsPanel
              transactions={transactions}
              selectedYear={selectedYear}
              businessName={isConsolidatedView ? consolidatedBusinessNames.join(' + ') : (selectedBusiness?.name || '')}
            />
          </TabsContent>

          {/* Debtors Tab Content */}
          <TabsContent value="debtors" className="mt-6">
            <DebtorsPanel
              businessId={selectedBusinessId}
              teamContext={teamContext}
            />
          </TabsContent>

          {/* Cashbox Tab Content */}
          <TabsContent value="cashbox" className="mt-6">
            <CashboxPanel
              businessId={selectedBusinessId}
              businessName={selectedBusiness?.name || ''}
              selectedMonth={selectedMonth}
              selectedYear={selectedYear}
              transactions={transactions}
              teamContext={teamContext}
            />
          </TabsContent>


          {/* Table Tab Content */}
          <TabsContent value="table" className="mt-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
            <div>
              <Label>Data Início</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dateFilterStart && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateFilterStart ? format(dateFilterStart, "dd/MM/yyyy") : "Selecione"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateFilterStart}
                    onSelect={setDateFilterStart}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label>Data Fim</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dateFilterEnd && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateFilterEnd ? format(dateFilterEnd, "dd/MM/yyyy") : "Selecione"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateFilterEnd}
                    onSelect={setDateFilterEnd}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          
          <div className="flex items-center justify-between mt-4">
            <div className="flex-1">
              <Label className="mb-2 block">Filtrar por Status</Label>
              <Tabs value={statusFilter} onValueChange={setStatusFilter}>
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="all">Todos</TabsTrigger>
                  <TabsTrigger value="pending">Pendente</TabsTrigger>
                  <TabsTrigger value="paid">Pago</TabsTrigger>
                  <TabsTrigger value="cancelled">Cancelado</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            
            <div className="ml-4 flex flex-wrap items-center justify-end gap-2">
              {(dateFilterStart || dateFilterEnd) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setDateFilterStart(undefined);
                    setDateFilterEnd(undefined);
                  }}
                >
                  Limpar datas
                </Button>
              )}
              <Button
                variant={autoSumMode ? "default" : "outline"}
                onClick={toggleAutoSumMode}
                className="flex items-center gap-2"
              >
                <Calculator className="w-4 h-4" />
                {autoSumMode ? "Desativar Autosoma" : "Autosoma"}
              </Button>
            </div>
          </div>
          
        </CardContent>
      </Card>

      {/* Card de Autosoma Sticky */}
      {autoSumMode && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-2xl px-4">
          <Card className="bg-background/95 backdrop-blur-sm border-primary shadow-lg">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-full">
                    <Calculator className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <span className="font-medium block">Autosoma Ativa</span>
                    <span className="text-muted-foreground text-sm">
                      {selectedTransactionIds.size} item(s) selecionado(s)
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Total</p>
                  <p className={cn(
                    "text-2xl font-bold",
                    autoSumTotal >= 0 ? "text-green-600" : "text-red-600"
                  )}>
                    R$ {autoSumTotal.toFixed(2)}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleAutoSumMode}
                  className="ml-4"
                >
                  ✕
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Cards de Resumo */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setIsDetailsDialogOpen(true)}>
          <CardHeader className="pb-2 p-3 sm:p-6">
            <div className="flex justify-between items-center">
              <CardTitle className="text-xs sm:text-sm font-medium">Receitas Pagas</CardTitle>
              <Check className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent className="pt-0 p-3 sm:p-6">
            <p className="text-lg sm:text-2xl font-bold text-green-600">R$ {totalIncome.toFixed(2)}</p>
            <Button variant="link" className="p-0 h-auto text-[10px] sm:text-xs mt-1">Ver detalhes</Button>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setIsDetailsDialogOpen(true)}>
          <CardHeader className="pb-2 p-3 sm:p-6">
            <div className="flex justify-between items-center">
              <CardTitle className="text-xs sm:text-sm font-medium">Despesas Pagas</CardTitle>
              <Check className="w-3 h-3 sm:w-4 sm:h-4 text-red-600" />
            </div>
          </CardHeader>
          <CardContent className="pt-0 p-3 sm:p-6">
            <p className="text-lg sm:text-2xl font-bold text-red-600">R$ {totalExpense.toFixed(2)}</p>
            <Button variant="link" className="p-0 h-auto text-[10px] sm:text-xs mt-1">Ver detalhes</Button>
          </CardContent>
        </Card>
        <Card className="border-blue-500/30 bg-blue-500/5">
          <CardHeader className="pb-2 p-3 sm:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium">A Receber</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 p-3 sm:p-6">
            <p className="text-lg sm:text-2xl font-bold text-blue-500">R$ {pendingIncome.toFixed(2)}</p>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">Receitas pendentes</p>
          </CardContent>
        </Card>
        <Card className="border-orange-500/30 bg-orange-500/5">
          <CardHeader className="pb-2 p-3 sm:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium">A Pagar</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 p-3 sm:p-6">
            <p className="text-lg sm:text-2xl font-bold text-orange-500">R$ {pendingExpense.toFixed(2)}</p>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">Despesas pendentes</p>
          </CardContent>
        </Card>
      </div>

      {/* Segunda linha de cards - Projeções */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card>
          <CardHeader className="pb-2 p-3 sm:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium">Saldo Atual</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 p-3 sm:p-6">
            <p className={cn(
              "text-lg sm:text-2xl font-bold",
              currentBalance >= 0 ? 'text-green-600' : 'text-red-600'
            )}>
              R$ {currentBalance.toFixed(2)}
            </p>
            <Button variant="link" className="p-0 h-auto text-[10px] sm:text-xs mt-1" onClick={() => setIsComparisonOpen(true)}>Comparar meses</Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 p-3 sm:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium">Pendentes Total</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 p-3 sm:p-6">
            <p className="text-lg sm:text-2xl font-bold text-yellow-600">R$ {pendingAmount.toFixed(2)}</p>
            <Button variant="link" className="p-0 h-auto text-[10px] sm:text-xs mt-1" onClick={() => setIsDetailsDialogOpen(true)}>Ver detalhes</Button>
          </CardContent>
        </Card>
        <Card className="border-green-500/30 bg-green-500/5">
          <CardHeader className="pb-2 p-3 sm:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium">Projeção Otimista</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 p-3 sm:p-6">
            <p className={cn(
              "text-lg sm:text-2xl font-bold",
              projectionWithIncome >= 0 ? 'text-green-600' : 'text-red-600'
            )}>
              R$ {projectionWithIncome.toFixed(2)}
            </p>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">Recebendo tudo pendente</p>
          </CardContent>
        </Card>
        <Card className="border-red-500/30 bg-red-500/5">
          <CardHeader className="pb-2 p-3 sm:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium">Projeção Pessimista</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 p-3 sm:p-6">
            <p className={cn(
              "text-lg sm:text-2xl font-bold",
              projectionWithoutIncome >= 0 ? 'text-green-600' : 'text-red-600'
            )}>
              R$ {projectionWithoutIncome.toFixed(2)}
            </p>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">Sem receber pendentes</p>
          </CardContent>
        </Card>
      </div>

      {/* Category Browser Tabs - Multi-select */}
      <div className="overflow-x-auto -mx-1">
        <div className="flex items-center gap-0 border-b border-border min-w-max px-1">
          <button
            onClick={() => setSelectedCategories([])}
            className={cn(
              "px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors",
              selectedCategories.length === 0
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30"
            )}
          >
            Todas
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => {
                setSelectedCategories(prev => {
                  if (prev.includes(cat)) {
                    return prev.filter(c => c !== cat);
                  }
                  return [...prev, cat];
                });
              }}
              className={cn(
                "px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors",
                selectedCategories.includes(cat)
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30"
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base sm:text-lg">{selectedMonth} {selectedYear}</CardTitle>
          <CardDescription className="text-xs sm:text-sm">Transações do mês selecionado e transações fixas. Use o campo "Nº" para definir a ordem.</CardDescription>
        </CardHeader>
        <CardContent className="p-0 sm:p-6">
            <Table>
              <TableHeader className="hidden md:table-header-group">
                <TableRow>
                  {autoSumMode && <TableHead className="w-[40px]">Sel.</TableHead>}
                  <TableHead className="w-[70px]">Nº</TableHead>
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
                {transactionsWithMonthStatus.map((transaction, index) => (
                  <SortableRow
                    key={transaction.id}
                    transaction={transaction}
                    onStatusChange={handleStatusChange}
                    onEdit={openEdit}
                    onDelete={handleDelete}
                    autoSumMode={autoSumMode}
                    isSelected={selectedTransactionIds.has(transaction.id)}
                    onSelect={handleTransactionSelect}
                    totalCount={transactionsWithMonthStatus.length}
                    displayOrder={index + 1}
                    onChangeOrder={handleChangeOrder}
                  />
                ))}
                {transactionsWithMonthStatus.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={autoSumMode ? 9 : 8} className="text-center text-muted-foreground py-8 text-sm">
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg">Nova Transação</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 sm:gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <Label className="text-xs sm:text-sm">Tipo</Label>
                <Select value={formData.type} onValueChange={(v: any) => setFormData({ ...formData, type: v })}>
                  <SelectTrigger className="h-9">
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
                <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                <Select value={formData.payment_method} onValueChange={(v) => setFormData({ ...formData, payment_method: v, installments: (v === 'cartao_credito') ? formData.installments : 1 })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pix">PIX</SelectItem>
                    <SelectItem value="dinheiro">Dinheiro</SelectItem>
                    <SelectItem value="cartao_credito">💳 Cartão de Crédito</SelectItem>
                    <SelectItem value="cartao_debito">Cartão de Débito</SelectItem>
                    <SelectItem value="boleto">Boleto</SelectItem>
                    <SelectItem value="transferencia">Transferência</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {formData.payment_method === 'cartao_credito' && (
              <div className="p-4 border rounded-lg bg-muted/30 space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-lg">💳</span>
                  <Label className="text-base font-medium">Parcelamento no Cartão</Label>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Número de Parcelas</Label>
                    <Select 
                      value={formData.installments.toString()} 
                      onValueChange={(v) => setFormData({ ...formData, installments: parseInt(v) })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 18, 24, 36, 48].map(num => (
                          <SelectItem key={num} value={num.toString()}>
                            {num}x {formData.amount ? `de R$ ${(parseFloat(formData.amount) / num).toFixed(2)}` : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col justify-end">
                    {formData.amount && formData.installments > 1 && (
                      <div className="p-2 bg-primary/10 rounded-md">
                        <p className="text-xs text-muted-foreground">Valor por parcela</p>
                        <p className="text-lg font-bold text-primary">
                          R$ {(parseFloat(formData.amount) / formData.installments).toFixed(2)}
                        </p>
                      </div>
                    )}
                    {formData.amount && formData.installments === 1 && (
                      <p className="text-sm text-muted-foreground">Pagamento à vista</p>
                    )}
                  </div>
                </div>
                {formData.installments > 1 && (
                  <p className="text-xs text-muted-foreground">
                    Serão criadas {formData.installments} transações com vencimentos mensais consecutivos
                  </p>
                )}
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Conta Bancária (Opcional)</Label>
                <Select value={formData.bank_account_id} onValueChange={(v) => setFormData({ ...formData, bank_account_id: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma conta" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Sem conta específica</SelectItem>
                    {bankAccounts.map(account => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.bank_name} (R$ {account.current_balance.toLocaleString('pt-BR')})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Data de Vencimento</Label>
                <Input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val) {
                      const [year, month] = val.split('-').map(Number);
                      setFormData({ ...formData, due_date: val, month: MONTHS[month - 1] || formData.month });
                    } else {
                      setFormData({ ...formData, due_date: val });
                    }
                  }}
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

      {/* Dialog Múltiplas Transações */}
      <Dialog open={isMultiTransactionDialogOpen} onOpenChange={setIsMultiTransactionDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg">Adicionar Múltiplas Transações</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div>
              <Label>Transações (uma por linha)</Label>
              <p className="text-xs text-muted-foreground mb-2">
                Digite a descrição de cada transação em uma linha. Opcionalmente, adicione o valor no final (ex: "Aluguel - 1500" ou "Internet: 99.90")
              </p>
              <Textarea
                value={multiTransactionForm.transactions}
                onChange={(e) => setMultiTransactionForm({ ...multiTransactionForm, transactions: e.target.value })}
                placeholder="Aluguel - 1500&#10;Luz - 200&#10;Internet - 99.90&#10;Água - 80"
                className="min-h-[150px] font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {multiTransactionForm.transactions.split('\n').filter(l => l.trim()).length} transação(ões)
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Tipo</Label>
                <Select 
                  value={multiTransactionForm.type} 
                  onValueChange={(v: 'income' | 'expense') => setMultiTransactionForm({ ...multiTransactionForm, type: v })}
                >
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
                <Select 
                  value={multiTransactionForm.category} 
                  onValueChange={(v) => setMultiTransactionForm({ ...multiTransactionForm, category: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Método de Pagamento</Label>
                <Select 
                  value={multiTransactionForm.payment_method} 
                  onValueChange={(v) => setMultiTransactionForm({ ...multiTransactionForm, payment_method: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pix">PIX</SelectItem>
                    <SelectItem value="dinheiro">Dinheiro</SelectItem>
                    <SelectItem value="cartao_credito">Cartão de Crédito</SelectItem>
                    <SelectItem value="cartao_debito">Cartão de Débito</SelectItem>
                    <SelectItem value="boleto">Boleto</SelectItem>
                    <SelectItem value="transferencia">Transferência</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select 
                  value={multiTransactionForm.status} 
                  onValueChange={(v: 'paid' | 'pending' | 'cancelled') => setMultiTransactionForm({ ...multiTransactionForm, status: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="paid">Pago</SelectItem>
                    <SelectItem value="cancelled">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Data de Vencimento</Label>
              <Input
                type="date"
                value={multiTransactionForm.due_date}
                onChange={(e) => setMultiTransactionForm({ ...multiTransactionForm, due_date: e.target.value })}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="multi-recurring"
                checked={multiTransactionForm.is_recurring}
                onCheckedChange={(checked) => setMultiTransactionForm({ ...multiTransactionForm, is_recurring: checked })}
              />
              <Label htmlFor="multi-recurring">Transações Fixas (repetem todo mês)</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsMultiTransactionDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleAddMultipleTransactions}>
              Adicionar {multiTransactionForm.transactions.split('\n').filter(l => l.trim()).length} Transações
            </Button>
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
                <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                    <SelectItem value="cartao_credito">💳 Cartão de Crédito</SelectItem>
                    <SelectItem value="cartao_debito">Cartão de Débito</SelectItem>
                    <SelectItem value="boleto">Boleto</SelectItem>
                    <SelectItem value="transferencia">Transferência</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {formData.payment_method === 'cartao_credito' && (
              <div className="p-4 border rounded-lg bg-muted/30 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">💳</span>
                  <Label className="text-base font-medium">Informação do Cartão</Label>
                </div>
                <p className="text-sm text-muted-foreground">
                  Esta transação foi registrada como pagamento no cartão de crédito. 
                  Para editar parcelas, modifique cada transação individualmente na lista.
                </p>
              </div>
            )}
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

      {/* Dialog Detalhes */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhamento - {selectedMonth} {selectedYear}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Receitas Pagas</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-green-600">R$ {totalIncome.toFixed(2)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Despesas Pagas</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-red-600">R$ {totalExpense.toFixed(2)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Pendentes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-yellow-600">R$ {pendingAmount.toFixed(2)}</p>
                </CardContent>
              </Card>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">Transações do Mês</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {monthTransactions.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell>{format(new Date(t.due_date + 'T00:00:00'), 'dd/MM/yyyy')}</TableCell>
                      <TableCell>{t.description}</TableCell>
                      <TableCell>{t.category}</TableCell>
                      <TableCell>
                        <Badge variant={t.type === 'income' ? 'default' : 'destructive'}>
                          {t.type === 'income' ? 'Receita' : 'Despesa'}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-semibold">R$ {Number(t.amount).toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge variant={t.status === 'paid' ? 'default' : t.status === 'pending' ? 'secondary' : 'destructive'}>
                          {t.status === 'paid' ? 'Pago' : t.status === 'pending' ? 'Pendente' : 'Cancelado'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Comparação */}
      <Dialog open={isComparisonOpen} onOpenChange={setIsComparisonOpen}>
        <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Comparação de Meses - {selectedYear}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mês</TableHead>
                  <TableHead>Receitas</TableHead>
                  <TableHead>Despesas</TableHead>
                  <TableHead>Saldo</TableHead>
                  <TableHead>Pendentes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {MONTHS.map((month) => {
                  const monthTrans = transactions.filter(t => {
                    if (t.is_recurring) {
                      const transMonthIdx = getMonthIndex(t.month);
                      const currMonthIdx = getMonthIndex(month);
                      return transMonthIdx <= currMonthIdx;
                    }
                    return t.month === month;
                  });
                  
                  const income = monthTrans
                    .filter(t => t.type === 'income' && t.status === 'paid')
                    .reduce((sum, t) => sum + Number(t.amount), 0);
                  
                  const expense = monthTrans
                    .filter(t => t.type === 'expense' && t.status === 'paid')
                    .reduce((sum, t) => sum + Number(t.amount), 0);
                  
                  const pending = monthTrans
                    .filter(t => t.status === 'pending')
                    .reduce((sum, t) => sum + Number(t.amount), 0);
                  
                  const balance = income - expense;
                  
                  return (
                    <TableRow key={month} className={month === selectedMonth ? 'bg-muted/50' : ''}>
                      <TableCell className="font-medium">{month}</TableCell>
                      <TableCell className="text-green-600 font-semibold">R$ {income.toFixed(2)}</TableCell>
                      <TableCell className="text-red-600 font-semibold">R$ {expense.toFixed(2)}</TableCell>
                      <TableCell className={`font-bold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        R$ {balance.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-yellow-600">R$ {pending.toFixed(2)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Criar Negócio */}
      <Dialog open={isBusinessDialogOpen} onOpenChange={setIsBusinessDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Negócio</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div>
              <Label>Nome</Label>
              <Input
                value={businessFormData.name}
                onChange={(e) => setBusinessFormData({ ...businessFormData, name: e.target.value })}
                placeholder="Ex: Meu Negócio"
              />
            </div>
            <div>
              <Label>Tipo</Label>
              <Select value={businessFormData.business_type} onValueChange={(v: any) => setBusinessFormData({ ...businessFormData, business_type: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="personal">Pessoa Física</SelectItem>
                  <SelectItem value="company">Pessoa Jurídica</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Descrição</Label>
              <Input
                value={businessFormData.description}
                onChange={(e) => setBusinessFormData({ ...businessFormData, description: e.target.value })}
                placeholder="Opcional"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBusinessDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleAddBusiness}>Criar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Editar Negócio */}
      <Dialog open={isEditBusinessDialogOpen} onOpenChange={setIsEditBusinessDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Negócio</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div>
              <Label>Nome</Label>
              <Input
                value={businessFormData.name}
                onChange={(e) => setBusinessFormData({ ...businessFormData, name: e.target.value })}
              />
            </div>
            <div>
              <Label>Tipo</Label>
              <Select value={businessFormData.business_type} onValueChange={(v: any) => setBusinessFormData({ ...businessFormData, business_type: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="personal">Pessoa Física</SelectItem>
                  <SelectItem value="company">Pessoa Jurídica</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Descrição</Label>
              <Input
                value={businessFormData.description}
                onChange={(e) => setBusinessFormData({ ...businessFormData, description: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditBusinessDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleEditBusiness}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Gerenciar Categorias */}
      <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Gerenciar Categorias</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Nova categoria"
                value={categoryFormData.name}
                onChange={(e) => setCategoryFormData({ name: e.target.value })}
              />
              <Button onClick={handleAddCategory}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {categories.map((cat) => (
                <div key={cat} className="flex items-center justify-between p-2 border rounded">
                  <span>{cat}</span>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => openEditCategory(cat)}>
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => handleDeleteCategory(cat)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Editar Categoria */}
      <Dialog open={isEditCategoryDialogOpen} onOpenChange={setIsEditCategoryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Categoria</DialogTitle>
          </DialogHeader>
          <div>
            <Label>Nome</Label>
            <Input
              value={categoryFormData.name}
              onChange={(e) => setCategoryFormData({ name: e.target.value })}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditCategoryDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleEditCategory}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};