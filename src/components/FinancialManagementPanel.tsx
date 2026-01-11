import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Plus, Edit2, Trash2, Check, GripVertical, Calculator, CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Switch } from "@/components/ui/switch";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
}

const SortableRow = ({ transaction, onStatusChange, onEdit, onDelete, autoSumMode, isSelected, onSelect }: SortableRowProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: transaction.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || 'transform 200ms ease',
    zIndex: isDragging ? 9999 : 'auto',
    opacity: isDragging ? 0.95 : 1,
    position: 'relative' as const,
    boxShadow: isDragging ? '0 10px 30px rgba(0,0,0,0.3)' : undefined,
  };

  return (
    <>
      {/* Desktop Row */}
      <TableRow ref={setNodeRef} style={style} className={cn(
        "hidden md:table-row",
        transaction.status === 'paid' ? 'bg-green-500/15 hover:bg-green-500/20' : '',
        isSelected ? 'bg-primary/10 hover:bg-primary/15' : '',
        isDragging ? 'bg-background border-2 border-primary rounded' : ''
      )}>
        {autoSumMode && (
          <TableCell className="w-[40px]">
            <Checkbox
              checked={isSelected}
              onCheckedChange={(checked) => onSelect?.(transaction.id, !!checked)}
            />
          </TableCell>
        )}
        <TableCell>
          <div className="flex items-center gap-2">
            <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-2 -m-1 hover:bg-muted rounded select-none">
              <GripVertical className="w-5 h-5 text-muted-foreground pointer-events-none" />
            </button>
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
      <tr ref={setNodeRef} style={style} className={cn(
        "md:hidden block",
        transaction.status === 'paid' ? 'bg-green-500/15' : '',
        isSelected ? 'bg-primary/10' : '',
        isDragging ? 'bg-background border-2 border-primary rounded-lg' : ''
      )}>
        <td colSpan={8} className="p-0">
          <div className="p-3 border-b space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {autoSumMode && (
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={(checked) => onSelect?.(transaction.id, !!checked)}
                  />
                )}
                <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing shrink-0 p-2 -m-1 hover:bg-muted rounded select-none">
                  <GripVertical className="w-5 h-5 text-muted-foreground pointer-events-none" />
                </button>
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
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'MMMM', { locale: ptBR }));
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
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
    business_id: ''
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 3,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    loadBusinesses();
    loadCategories();
  }, [teamContext?.adminUserId]);

  useEffect(() => {
    if (selectedBusinessId) {
      loadTransactions();
    }
  }, [selectedBusinessId, selectedMonth, selectedYear, teamContext?.adminUserId]);

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
      
      if (data && data.length > 0) {
        setSelectedBusinessId(data[0].id);
      }
    } catch (error: any) {
      toast.error('Erro ao carregar negócios');
    }
  };

  const loadTransactions = async () => {
    if (!selectedBusinessId) return;
    
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Use adminUserId if teamContext is provided
      const targetUserId = teamContext?.adminUserId || user.id;

      const { data, error } = await supabase
        .from('financial_transactions')
        .select('*')
        .eq('user_id', targetUserId)
        .eq('business_id', selectedBusinessId)
        .eq('year', selectedYear)
        .order('due_date', { ascending: true});

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
      setCategories((data || []).map(c => c.name));
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

      // Converte a data para o formato correto sem problemas de timezone
      const dueDate = new Date(formData.due_date + 'T12:00:00');

      const { error } = await supabase
        .from('financial_transactions')
        .insert({
          user_id: user.id,
          business_id: selectedBusinessId,
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
      business_id: selectedBusinessId
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
      business_id: transaction.business_id || selectedBusinessId
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

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = transactionsWithMonthStatus.findIndex((t) => t.id === active.id);
    const newIndex = transactionsWithMonthStatus.findIndex((t) => t.id === over.id);

    const newOrder = arrayMove(transactionsWithMonthStatus, oldIndex, newIndex);
    
    // Atualizar order_index de todas as transações afetadas
    const updates = newOrder.map((transaction, index) => ({
      id: transaction.id,
      order_index: index
    }));

    try {
      // Atualizar no banco de dados
      for (const update of updates) {
        await supabase
          .from('financial_transactions')
          .update({ order_index: update.order_index })
          .eq('id', update.id);
      }

      // Recarregar transações
      await loadTransactions();
      toast.success('Ordem atualizada');
    } catch (error) {
      console.error('Erro ao atualizar ordem:', error);
      toast.error('Erro ao atualizar ordem');
    }
  };

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
  }).filter(t => selectedCategory === 'all' || t.category === selectedCategory);

  // Ajustar totais considerando o status específico por mês
  const transactionsWithMonthStatus = monthTransactions
    .map(t => ({
      ...t,
      status: getTransactionStatus(t)
    }))
    .filter(t => statusFilter === 'all' || t.status === statusFilter)
    .sort((a, b) => (a.order_index || 0) - (b.order_index || 0));

  const totalIncome = transactionsWithMonthStatus
    .filter(t => t.type === 'income' && t.status === 'paid')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const totalExpense = transactionsWithMonthStatus
    .filter(t => t.type === 'expense' && t.status === 'paid')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const pendingAmount = transactionsWithMonthStatus
    .filter(t => t.status === 'pending')
    .reduce((sum, t) => sum + Number(t.amount), 0);

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

  if (businesses.length === 0) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Gestão Financeira</CardTitle>
            <CardDescription>Primeiro, crie um negócio para começar</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <DollarSign className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">Nenhum negócio cadastrado</p>
            <Button onClick={() => setIsBusinessDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Criar Primeiro Negócio
            </Button>
          </CardContent>
        </Card>

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
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold">Gestão Financeira</h2>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => setIsCategoryDialogOpen(true)} className="text-xs sm:text-sm">
            Categorias
          </Button>
          <Select value={selectedBusinessId} onValueChange={setSelectedBusinessId}>
            <SelectTrigger className="w-full sm:w-[180px] text-xs sm:text-sm">
              <SelectValue placeholder="Selecione o negócio" />
            </SelectTrigger>
            <SelectContent>
              {businesses.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.name} ({b.business_type === 'personal' ? 'PF' : 'PJ'})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex gap-1">
            <Button variant="outline" size="icon" className="h-8 w-8 sm:h-9 sm:w-9" onClick={() => setIsBusinessDialogOpen(true)}>
              <Plus className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="icon" className="h-8 w-8 sm:h-9 sm:w-9" onClick={() => {
              const current = businesses.find(b => b.id === selectedBusinessId);
              if (current) openEditBusiness(current);
            }}>
              <Edit2 className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="icon" className="h-8 w-8 sm:h-9 sm:w-9" onClick={() => {
              if (selectedBusinessId) handleDeleteBusiness(selectedBusinessId);
            }}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
          <Button onClick={() => setIsAddDialogOpen(true)} size="sm" className="text-xs sm:text-sm">
            <Plus className="w-4 h-4 mr-1" />
            <span className="hidden xs:inline">Nova </span>Transação
          </Button>
        </div>
      </div>

      {/* Seletores de Ano, Mês e Categoria */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
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
              <Label>Categoria</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
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
            
            <div className="ml-4 flex items-center gap-2">
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
        <Card>
          <CardHeader className="pb-2 p-3 sm:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium">Pendentes</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 p-3 sm:p-6">
            <p className="text-lg sm:text-2xl font-bold text-yellow-600">R$ {pendingAmount.toFixed(2)}</p>
            <Button variant="link" className="p-0 h-auto text-[10px] sm:text-xs mt-1" onClick={() => setIsDetailsDialogOpen(true)}>Ver detalhes</Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 p-3 sm:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium">Saldo</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 p-3 sm:p-6">
            <p className={cn(
              "text-lg sm:text-2xl font-bold",
              (totalIncome - totalExpense) >= 0 ? 'text-green-600' : 'text-red-600'
            )}>
              R$ {(totalIncome - totalExpense).toFixed(2)}
            </p>
            <Button variant="link" className="p-0 h-auto text-[10px] sm:text-xs mt-1" onClick={() => setIsComparisonOpen(true)}>Comparar meses</Button>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Transações */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base sm:text-lg">{selectedMonth} {selectedYear}</CardTitle>
          <CardDescription className="text-xs sm:text-sm">Transações do mês selecionado e transações fixas</CardDescription>
        </CardHeader>
        <CardContent className="p-0 sm:p-6">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <Table>
              <TableHeader className="hidden md:table-header-group">
                <TableRow>
                  {autoSumMode && <TableHead className="w-[40px]">Sel.</TableHead>}
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
                <SortableContext
                  items={transactionsWithMonthStatus.map((t) => t.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {transactionsWithMonthStatus.map((transaction) => (
                    <SortableRow
                      key={transaction.id}
                      transaction={transaction}
                      onStatusChange={handleStatusChange}
                      onEdit={openEdit}
                      onDelete={handleDelete}
                      autoSumMode={autoSumMode}
                      isSelected={selectedTransactionIds.has(transaction.id)}
                      onSelect={handleTransactionSelect}
                    />
                  ))}
                </SortableContext>
                {transactionsWithMonthStatus.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={autoSumMode ? 8 : 7} className="text-center text-muted-foreground py-8 text-sm">
                      Nenhuma transação neste mês
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </DndContext>
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
    </div>
  );
};