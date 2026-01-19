import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  TrendingDown, 
  ArrowUpRight, 
  ArrowDownRight,
  Target,
  AlertTriangle,
  CheckCircle2,
  BarChart3
} from "lucide-react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { cn } from "@/lib/utils";

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
  year: number;
}

interface FinancialAnalyticsPanelProps {
  transactions: Transaction[];
  selectedYear: number;
  businessName: string;
}

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const COLORS = ['#22c55e', '#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

export const FinancialAnalyticsPanel = ({ transactions, selectedYear, businessName }: FinancialAnalyticsPanelProps) => {
  const getMonthIndex = (month: string) => MONTHS.indexOf(month);
  const currentMonthIndex = new Date().getMonth();
  const currentMonth = MONTHS[currentMonthIndex];

  // Calculate monthly data
  const monthlyData = useMemo(() => {
    return MONTHS.map((month, idx) => {
      const monthTrans = transactions.filter(t => {
        if (t.is_recurring) {
          const transMonthIdx = getMonthIndex(t.month);
          return transMonthIdx <= idx;
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

      return {
        month: month.slice(0, 3),
        fullMonth: month,
        income,
        expense,
        balance: income - expense,
        pending
      };
    });
  }, [transactions]);

  // Calculate category breakdown
  const categoryData = useMemo(() => {
    const categoryTotals: Record<string, { income: number; expense: number }> = {};
    
    transactions.filter(t => t.status === 'paid').forEach(t => {
      if (!categoryTotals[t.category]) {
        categoryTotals[t.category] = { income: 0, expense: 0 };
      }
      if (t.type === 'income') {
        categoryTotals[t.category].income += Number(t.amount);
      } else {
        categoryTotals[t.category].expense += Number(t.amount);
      }
    });

    return Object.entries(categoryTotals).map(([name, data]) => ({
      name,
      value: data.expense > 0 ? data.expense : data.income,
      type: data.expense > 0 ? 'expense' : 'income'
    })).sort((a, b) => b.value - a.value);
  }, [transactions]);

  // Calculate insights
  const insights = useMemo(() => {
    const currentData = monthlyData[currentMonthIndex];
    const previousData = currentMonthIndex > 0 ? monthlyData[currentMonthIndex - 1] : null;
    
    const totalYearIncome = monthlyData.reduce((sum, m) => sum + m.income, 0);
    const totalYearExpense = monthlyData.reduce((sum, m) => sum + m.expense, 0);
    const totalYearBalance = totalYearIncome - totalYearExpense;
    
    const avgMonthlyIncome = totalYearIncome / (currentMonthIndex + 1);
    const avgMonthlyExpense = totalYearExpense / (currentMonthIndex + 1);
    
    let incomeChange = 0;
    let expenseChange = 0;
    let balanceChange = 0;
    
    if (previousData && previousData.income > 0) {
      incomeChange = ((currentData.income - previousData.income) / previousData.income) * 100;
    }
    if (previousData && previousData.expense > 0) {
      expenseChange = ((currentData.expense - previousData.expense) / previousData.expense) * 100;
    }
    if (previousData && Math.abs(previousData.balance) > 0) {
      balanceChange = currentData.balance - previousData.balance;
    }

    // Find best and worst months
    const monthsWithData = monthlyData.filter((m, idx) => idx <= currentMonthIndex && (m.income > 0 || m.expense > 0));
    const bestMonth = monthsWithData.reduce((best, curr) => curr.balance > best.balance ? curr : best, monthsWithData[0] || { balance: 0, fullMonth: 'N/A' });
    const worstMonth = monthsWithData.reduce((worst, curr) => curr.balance < worst.balance ? curr : worst, monthsWithData[0] || { balance: 0, fullMonth: 'N/A' });

    // Recurring expenses
    const recurringExpenses = transactions
      .filter(t => t.is_recurring && t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    return {
      currentData,
      previousData,
      incomeChange,
      expenseChange,
      balanceChange,
      totalYearIncome,
      totalYearExpense,
      totalYearBalance,
      avgMonthlyIncome,
      avgMonthlyExpense,
      bestMonth,
      worstMonth,
      recurringExpenses
    };
  }, [monthlyData, currentMonthIndex, transactions]);

  const getInsightStatus = () => {
    if (insights.totalYearBalance > 0 && insights.balanceChange >= 0) {
      return { status: 'excellent', message: 'Excelente! Suas finanças estão no caminho certo.', icon: CheckCircle2, color: 'text-green-600' };
    } else if (insights.totalYearBalance > 0) {
      return { status: 'good', message: 'Bom desempenho, mas houve queda em relação ao mês anterior.', icon: TrendingDown, color: 'text-yellow-600' };
    } else if (insights.totalYearBalance < 0 && insights.balanceChange >= 0) {
      return { status: 'improving', message: 'Melhorando! Continue assim para sair do negativo.', icon: TrendingUp, color: 'text-blue-600' };
    } else {
      return { status: 'warning', message: 'Atenção! Despesas superando receitas.', icon: AlertTriangle, color: 'text-red-600' };
    }
  };

  const insightStatus = getInsightStatus();

  return (
    <div className="space-y-6">
      {/* Header with insights */}
      <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Análise Financeira - {businessName}
              </CardTitle>
              <CardDescription>Visão geral de {selectedYear}</CardDescription>
            </div>
            <Badge className={cn("text-sm", insightStatus.color)} variant="outline">
              <insightStatus.icon className="w-4 h-4 mr-1" />
              {insightStatus.status === 'excellent' ? 'Excelente' : 
               insightStatus.status === 'good' ? 'Bom' :
               insightStatus.status === 'improving' ? 'Melhorando' : 'Atenção'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className={cn("text-sm font-medium", insightStatus.color)}>
            {insightStatus.message}
          </p>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Receita Total</p>
                <p className="text-2xl font-bold text-green-600">
                  R$ {insights.totalYearIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                {insights.incomeChange !== 0 && (
                  <div className={cn("flex items-center text-xs mt-1", insights.incomeChange > 0 ? "text-green-600" : "text-red-600")}>
                    {insights.incomeChange > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    {Math.abs(insights.incomeChange).toFixed(1)}% vs mês anterior
                  </div>
                )}
              </div>
              <TrendingUp className="h-8 w-8 text-green-600/30" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Despesa Total</p>
                <p className="text-2xl font-bold text-red-600">
                  R$ {insights.totalYearExpense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                {insights.expenseChange !== 0 && (
                  <div className={cn("flex items-center text-xs mt-1", insights.expenseChange < 0 ? "text-green-600" : "text-red-600")}>
                    {insights.expenseChange < 0 ? <ArrowDownRight className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                    {Math.abs(insights.expenseChange).toFixed(1)}% vs mês anterior
                  </div>
                )}
              </div>
              <TrendingDown className="h-8 w-8 text-red-600/30" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Saldo Anual</p>
                <p className={cn("text-2xl font-bold", insights.totalYearBalance >= 0 ? "text-green-600" : "text-red-600")}>
                  R$ {insights.totalYearBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Média mensal: R$ {(insights.totalYearBalance / (currentMonthIndex + 1)).toFixed(2)}
                </p>
              </div>
              <Target className="h-8 w-8 text-primary/30" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Despesas Fixas</p>
                <p className="text-2xl font-bold text-yellow-600">
                  R$ {insights.recurringExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Mensal
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-600/30" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Evolução Mensal</CardTitle>
            <CardDescription>Receitas vs Despesas por mês</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyData}>
                  <defs>
                    <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis className="text-xs" tickFormatter={(v) => `R$${(v/1000).toFixed(0)}k`} />
                  <Tooltip 
                    formatter={(value: number) => [`R$ ${value.toFixed(2)}`, '']}
                    contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                  />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="income" 
                    name="Receitas"
                    stroke="#22c55e" 
                    fillOpacity={1} 
                    fill="url(#colorIncome)" 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="expense" 
                    name="Despesas"
                    stroke="#ef4444" 
                    fillOpacity={1} 
                    fill="url(#colorExpense)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Balance Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Saldo Mensal</CardTitle>
            <CardDescription>Balanço por mês (Receitas - Despesas)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis className="text-xs" tickFormatter={(v) => `R$${(v/1000).toFixed(0)}k`} />
                  <Tooltip 
                    formatter={(value: number) => [`R$ ${value.toFixed(2)}`, 'Saldo']}
                    contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                  />
                  <Bar 
                    dataKey="balance" 
                    name="Saldo"
                    fill="#3b82f6"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Breakdown and Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category Pie Chart */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Por Categoria</CardTitle>
            <CardDescription>Distribuição das despesas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData.filter(c => c.type === 'expense').slice(0, 6)}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {categoryData.filter(c => c.type === 'expense').slice(0, 6).map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => [`R$ ${value.toFixed(2)}`, '']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Smart Insights */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Insights Inteligentes</CardTitle>
            <CardDescription>Análise automática do seu desempenho</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  <span className="font-medium text-green-600">Melhor Mês</span>
                </div>
                <p className="text-lg font-bold">{insights.bestMonth?.fullMonth || 'N/A'}</p>
                <p className="text-sm text-muted-foreground">
                  Saldo: R$ {(insights.bestMonth?.balance || 0).toFixed(2)}
                </p>
              </div>

              <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingDown className="w-4 h-4 text-red-600" />
                  <span className="font-medium text-red-600">Pior Mês</span>
                </div>
                <p className="text-lg font-bold">{insights.worstMonth?.fullMonth || 'N/A'}</p>
                <p className="text-sm text-muted-foreground">
                  Saldo: R$ {(insights.worstMonth?.balance || 0).toFixed(2)}
                </p>
              </div>

              <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-4 h-4 text-blue-600" />
                  <span className="font-medium text-blue-600">Média Mensal</span>
                </div>
                <p className="text-lg font-bold text-green-600">
                  +R$ {insights.avgMonthlyIncome.toFixed(2)}
                </p>
                <p className="text-lg font-bold text-red-600">
                  -R$ {insights.avgMonthlyExpense.toFixed(2)}
                </p>
              </div>

              <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-600" />
                  <span className="font-medium text-yellow-600">Comprometido</span>
                </div>
                <p className="text-lg font-bold">
                  {insights.avgMonthlyIncome > 0 
                    ? ((insights.recurringExpenses / insights.avgMonthlyIncome) * 100).toFixed(1)
                    : 0}%
                </p>
                <p className="text-sm text-muted-foreground">
                  da receita em despesas fixas
                </p>
              </div>
            </div>

            {/* Recommendations */}
            <div className="mt-4 p-4 rounded-lg bg-muted/50">
              <h4 className="font-medium mb-2">💡 Recomendações</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                {insights.totalYearBalance < 0 && (
                  <li>• Reduza despesas não essenciais para equilibrar o orçamento</li>
                )}
                {insights.recurringExpenses > insights.avgMonthlyIncome * 0.5 && (
                  <li>• Suas despesas fixas estão altas. Considere renegociar ou cancelar serviços</li>
                )}
                {insights.incomeChange < 0 && (
                  <li>• Receitas em queda. Busque novas fontes de renda ou aumente vendas</li>
                )}
                {insights.totalYearBalance > 0 && (
                  <li>• Ótimo trabalho! Considere investir parte do saldo positivo</li>
                )}
                {categoryData.filter(c => c.type === 'expense').length > 0 && (
                  <li>• Maior gasto: {categoryData.filter(c => c.type === 'expense')[0]?.name} - R$ {categoryData.filter(c => c.type === 'expense')[0]?.value.toFixed(2)}</li>
                )}
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
