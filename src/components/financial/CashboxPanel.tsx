import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Wallet, Plus, Edit2, TrendingUp, TrendingDown, ArrowDownCircle, ArrowUpCircle, PiggyBank, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Transaction {
  id: string;
  type: 'income' | 'expense';
  category: string;
  description: string;
  amount: number;
  month: string;
  due_date: string;
  status: 'paid' | 'pending' | 'cancelled';
  is_recurring: boolean;
  monthly_status?: { [key: string]: 'paid' | 'pending' | 'cancelled' };
}

interface CashboxPanelProps {
  businessId: string;
  businessName: string;
  selectedMonth: string;
  selectedYear: number;
  transactions: Transaction[];
  teamContext?: { adminUserId: string; allowedIds: string[] };
}

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export const CashboxPanel = ({ businessId, businessName, selectedMonth, selectedYear, transactions, teamContext }: CashboxPanelProps) => {
  const [initialBalance, setInitialBalance] = useState(0);
  const [cashboxId, setCashboxId] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formBalance, setFormBalance] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCashbox();
  }, [businessId, selectedMonth, selectedYear]);

  const loadCashbox = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const targetUserId = teamContext?.adminUserId || user.id;

      const { data, error } = await supabase
        .from('financial_cashbox')
        .select('*')
        .eq('user_id', targetUserId)
        .eq('business_id', businessId)
        .eq('month', selectedMonth)
        .eq('year', selectedYear)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setInitialBalance(Number(data.initial_balance));
        setCashboxId(data.id);
        setDescription(data.description || '');
      } else {
        setInitialBalance(0);
        setCashboxId(null);
        setDescription('');
      }
    } catch (error) {
      console.error('Erro ao carregar caixa:', error);
    }
  };

  const getTransactionStatus = (t: Transaction) => {
    if (t.is_recurring && t.monthly_status) {
      const monthKey = `${selectedMonth}-${selectedYear}`;
      return t.monthly_status[monthKey] || t.status;
    }
    return t.status;
  };

  const getMonthIndex = (month: string) => MONTHS.indexOf(month);

  // Filter transactions for the selected month
  const monthTransactions = transactions.filter(t => {
    if (t.is_recurring) {
      return getMonthIndex(t.month) <= getMonthIndex(selectedMonth);
    }
    return t.month === selectedMonth;
  }).map(t => ({ ...t, status: getTransactionStatus(t) }));

  // Calculations
  const paidIncome = monthTransactions
    .filter(t => t.type === 'income' && t.status === 'paid')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const paidExpense = monthTransactions
    .filter(t => t.type === 'expense' && t.status === 'paid')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const pendingIncome = monthTransactions
    .filter(t => t.type === 'income' && t.status === 'pending')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const pendingExpense = monthTransactions
    .filter(t => t.type === 'expense' && t.status === 'pending')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const currentCashbox = initialBalance + paidIncome - paidExpense;
  const projectedAfterPaying = currentCashbox - pendingExpense;
  const projectedWithAllReceived = currentCashbox + pendingIncome - pendingExpense;

  const handleSave = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const payload = {
        user_id: user.id,
        business_id: businessId,
        month: selectedMonth,
        year: selectedYear,
        initial_balance: parseFloat(formBalance) || 0,
        description: formDescription || null,
      };

      if (cashboxId) {
        const { error } = await supabase
          .from('financial_cashbox')
          .update({ initial_balance: payload.initial_balance, description: payload.description })
          .eq('id', cashboxId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('financial_cashbox')
          .insert(payload);
        if (error) throw error;
      }

      toast.success('Caixa atualizado!');
      setIsDialogOpen(false);
      loadCashbox();
    } catch (error: any) {
      toast.error('Erro ao salvar caixa');
    } finally {
      setLoading(false);
    }
  };

  const openDialog = () => {
    setFormBalance(initialBalance.toString());
    setFormDescription(description);
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-lg bg-primary/10">
            <Wallet className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-bold">Caixa - {selectedMonth} {selectedYear}</h3>
            <p className="text-sm text-muted-foreground">{businessName}</p>
          </div>
        </div>
        <Button onClick={openDialog} variant={cashboxId ? "outline" : "default"} size="sm">
          {cashboxId ? <Edit2 className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
          {cashboxId ? "Editar Saldo Inicial" : "Definir Saldo Inicial"}
        </Button>
      </div>

      {/* Alert if no initial balance set */}
      {!cashboxId && (
        <Card className="border-yellow-500/30 bg-yellow-500/5">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 shrink-0" />
              <div>
                <p className="font-medium text-sm">Saldo inicial não definido</p>
                <p className="text-xs text-muted-foreground">
                  Defina o saldo inicial do caixa (salário, valor no banco, etc.) para ter uma visão completa das suas finanças.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Cashbox Card */}
      <Card className="border-primary/30 bg-primary/5">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">Saldo Inicial do Mês</CardTitle>
            <PiggyBank className="w-5 h-5 text-primary" />
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-primary">R$ {initialBalance.toFixed(2)}</p>
          {description && (
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          )}
        </CardContent>
      </Card>

      {/* Flow Cards */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="border-green-500/20">
          <CardHeader className="pb-1 p-3 sm:p-4">
            <div className="flex items-center gap-2">
              <ArrowDownCircle className="w-4 h-4 text-green-600" />
              <CardTitle className="text-xs sm:text-sm font-medium">Entrou no Caixa</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-0 p-3 sm:p-4">
            <p className="text-lg sm:text-xl font-bold text-green-600">+ R$ {paidIncome.toFixed(2)}</p>
            <p className="text-[10px] text-muted-foreground">Receitas recebidas</p>
          </CardContent>
        </Card>
        <Card className="border-red-500/20">
          <CardHeader className="pb-1 p-3 sm:p-4">
            <div className="flex items-center gap-2">
              <ArrowUpCircle className="w-4 h-4 text-red-600" />
              <CardTitle className="text-xs sm:text-sm font-medium">Saiu do Caixa</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-0 p-3 sm:p-4">
            <p className="text-lg sm:text-xl font-bold text-red-600">- R$ {paidExpense.toFixed(2)}</p>
            <p className="text-[10px] text-muted-foreground">Despesas pagas</p>
          </CardContent>
        </Card>
      </div>

      {/* Current Cashbox Balance */}
      <Card className={cn(
        "border-2",
        currentCashbox >= 0 ? "border-green-500/40 bg-green-500/5" : "border-red-500/40 bg-red-500/5"
      )}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">💰 Caixa Atual</CardTitle>
        </CardHeader>
        <CardContent>
          <p className={cn(
            "text-3xl font-bold",
            currentCashbox >= 0 ? "text-green-600" : "text-red-600"
          )}>
            R$ {currentCashbox.toFixed(2)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Saldo Inicial ({initialBalance.toFixed(2)}) + Entradas ({paidIncome.toFixed(2)}) - Saídas ({paidExpense.toFixed(2)})
          </p>
        </CardContent>
      </Card>

      {/* Projections */}
      <div className="space-y-3">
        <h4 className="font-semibold text-sm flex items-center gap-2">
          <TrendingUp className="w-4 h-4" />
          Projeções do Caixa
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Card className="border-orange-500/30 bg-orange-500/5">
            <CardHeader className="pb-1 p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs sm:text-sm font-medium">Após Pagar Pendências</CardTitle>
                <TrendingDown className="w-4 h-4 text-orange-600" />
              </div>
            </CardHeader>
            <CardContent className="pt-0 p-3 sm:p-4">
              <p className={cn(
                "text-xl sm:text-2xl font-bold",
                projectedAfterPaying >= 0 ? "text-green-600" : "text-red-600"
              )}>
                R$ {projectedAfterPaying.toFixed(2)}
              </p>
              <p className="text-[10px] text-muted-foreground mt-1">
                Caixa Atual - Despesas Pendentes (R$ {pendingExpense.toFixed(2)})
              </p>
              {projectedAfterPaying < 0 && (
                <Badge variant="destructive" className="mt-2 text-[10px]">
                  ⚠️ Caixa ficará negativo
                </Badge>
              )}
            </CardContent>
          </Card>
          <Card className="border-blue-500/30 bg-blue-500/5">
            <CardHeader className="pb-1 p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs sm:text-sm font-medium">Recebendo Tudo + Pagando</CardTitle>
                <TrendingUp className="w-4 h-4 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent className="pt-0 p-3 sm:p-4">
              <p className={cn(
                "text-xl sm:text-2xl font-bold",
                projectedWithAllReceived >= 0 ? "text-green-600" : "text-red-600"
              )}>
                R$ {projectedWithAllReceived.toFixed(2)}
              </p>
              <p className="text-[10px] text-muted-foreground mt-1">
                Caixa + A Receber (R$ {pendingIncome.toFixed(2)}) - A Pagar (R$ {pendingExpense.toFixed(2)})
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Pending Summary */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Resumo Pendente</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b">
            <span className="text-sm text-muted-foreground">A Receber</span>
            <span className="font-semibold text-blue-500">+ R$ {pendingIncome.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b">
            <span className="text-sm text-muted-foreground">A Pagar</span>
            <span className="font-semibold text-orange-500">- R$ {pendingExpense.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-sm font-medium">Balanço Pendente</span>
            <span className={cn(
              "font-bold",
              (pendingIncome - pendingExpense) >= 0 ? "text-green-600" : "text-red-600"
            )}>
              R$ {(pendingIncome - pendingExpense).toFixed(2)}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {cashboxId ? "Editar Saldo Inicial" : "Definir Saldo Inicial do Caixa"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label>Saldo Inicial (R$)</Label>
              <Input
                type="number"
                step="0.01"
                value={formBalance}
                onChange={(e) => setFormBalance(e.target.value)}
                placeholder="Ex: 5000.00"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Informe o valor que você tem disponível no início do mês (salário, valor no banco, etc.)
              </p>
            </div>
            <div>
              <Label>Descrição (opcional)</Label>
              <Input
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Ex: Salário + Saldo em conta"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={loading}>
              {loading ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
