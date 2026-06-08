import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, TrendingDown, Wallet, ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from "recharts";

interface Transaction {
  id: string;
  amount: number;
  type: 'income' | 'expense';
  status: string;
  category: string;
  description: string;
  due_date: string;
}

interface FinancialOverviewProps {
  transactions: Transaction[];
  bankAccounts: any[];
}

export const FinancialOverview = ({ transactions, bankAccounts }: FinancialOverviewProps) => {
  const stats = useMemo(() => {
    const totalIncome = transactions
      .filter(t => t.type === 'income' && t.status === 'paid')
      .reduce((acc, t) => acc + t.amount, 0);

    const totalExpense = transactions
      .filter(t => t.type === 'expense' && t.status === 'paid')
      .reduce((acc, t) => acc + t.amount, 0);

    const pendingIncome = transactions
      .filter(t => t.type === 'income' && t.status === 'pending')
      .reduce((acc, t) => acc + t.amount, 0);

    const pendingExpense = transactions
      .filter(t => t.type === 'expense' && t.status === 'pending')
      .reduce((acc, t) => acc + t.amount, 0);

    const bankBalance = bankAccounts.reduce((acc, b) => acc + (b.current_balance || 0), 0);

    return {
      totalIncome,
      totalExpense,
      netBalance: totalIncome - totalExpense,
      pendingIncome,
      pendingExpense,
      bankBalance
    };
  }, [transactions, bankAccounts]);

  const chartData = useMemo(() => {
    const categories: { [key: string]: number } = {};
    transactions
      .filter(t => t.status === 'paid')
      .forEach(t => {
        categories[t.category] = (categories[t.category] || 0) + (t.type === 'income' ? t.amount : -t.amount);
      });

    return Object.entries(categories).map(([name, value]) => ({ name, value }));
  }, [transactions]);

  const incomeVsExpense = [
    { name: 'Receitas', value: stats.totalIncome, color: '#22c55e' },
    { name: 'Despesas', value: stats.totalExpense, color: '#ef4444' }
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Saldo em Contas</CardTitle>
            <Wallet className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {stats.bankBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
            <p className="text-xs text-muted-foreground mt-1">Soma de todas as contas ativas</p>
          </CardContent>
        </Card>

        <Card className="bg-green-500/5 border-green-500/20">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Receitas (Pagas)</CardTitle>
            <ArrowUpCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">R$ {stats.totalIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
            {stats.pendingIncome > 0 && (
              <p className="text-xs text-muted-foreground mt-1">Pendente: R$ {stats.pendingIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-red-500/5 border-red-500/20">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Despesas (Pagas)</CardTitle>
            <ArrowDownCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">R$ {stats.totalExpense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
            {stats.pendingExpense > 0 && (
              <p className="text-xs text-muted-foreground mt-1">Pendente: R$ {stats.pendingExpense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            )}
          </CardContent>
        </Card>

        <Card className={stats.netBalance >= 0 ? "bg-blue-500/5 border-blue-500/20" : "bg-orange-500/5 border-orange-500/20"}>
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Resultado Líquido</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className={stats.netBalance >= 0 ? "text-2xl font-bold text-blue-600" : "text-2xl font-bold text-orange-600"}>
              R$ {stats.netBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Receitas - Despesas (Pagas)</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Comparativo Receitas vs Despesas</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={incomeVsExpense}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip 
                  formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 'Valor']}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {incomeVsExpense.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Próximos Vencimentos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {transactions
                .filter(t => t.status === 'pending')
                .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
                .slice(0, 5)
                .map(t => (
                  <div key={t.id} className="flex justify-between items-center p-2 rounded-lg bg-muted/50">
                    <div>
                      <p className="text-sm font-medium">{t.description}</p>
                      <p className="text-xs text-muted-foreground">{new Date(t.due_date + 'T00:00:00').toLocaleDateString('pt-BR')}</p>
                    </div>
                    <p className={`text-sm font-bold ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                      R$ {t.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                ))}
              {transactions.filter(t => t.status === 'pending').length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">Nenhum vencimento pendente.</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Distribuição por Categoria</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={`hsl(var(--primary) / ${Math.max(0.2, 1 - index * 0.1)})`} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 'Saldo']}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};