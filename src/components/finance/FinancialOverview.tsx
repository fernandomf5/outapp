import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  CalendarClock,
  CircleDollarSign,
  Clock,
  Landmark,
  Scale,
  Wallet,
} from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { FinancialMetricCard, type FinancialMetricTone } from "./FinancialMetricCard";

interface Transaction {
  id: string;
  amount: number;
  type: "income" | "expense";
  status: string;
  category: string;
  description: string;
  due_date: string;
}

interface BankAccount {
  id: string;
  current_balance: number | null;
}

interface FinancialOverviewProps {
  transactions: Transaction[];
  bankAccounts: BankAccount[];
}

const normalizeStatus = (status: string | null | undefined): string =>
  (status || "").trim().toLowerCase();

const amountOf = (amount: number): number => {
  const value = Number(amount);
  return Number.isFinite(value) ? value : 0;
};

const money = (value: number): string =>
  `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const FinancialOverview = ({ transactions, bankAccounts }: FinancialOverviewProps) => {
  const summary = useMemo(() => {
    const paidIncome = transactions.filter((item) => item.type === "income" && normalizeStatus(item.status) === "paid");
    const paidExpenses = transactions.filter((item) => item.type === "expense" && normalizeStatus(item.status) === "paid");
    const pendingIncome = transactions.filter((item) => item.type === "income" && normalizeStatus(item.status) === "pending");
    const pendingExpenses = transactions.filter((item) => item.type === "expense" && normalizeStatus(item.status) === "pending");
    const sum = (items: Transaction[]) => items.reduce((total, item) => total + amountOf(item.amount), 0);
    const income = sum(paidIncome);
    const expenses = sum(paidExpenses);
    const receivable = sum(pendingIncome);
    const payable = sum(pendingExpenses);

    return {
      income,
      expenses,
      receivable,
      payable,
      net: income - expenses,
      forecast: income + receivable - expenses - payable,
      bankBalance: bankAccounts.reduce((total, account) => total + amountOf(account.current_balance || 0), 0),
      pendingIncomeCount: pendingIncome.length,
      pendingExpenseCount: pendingExpenses.length,
    };
  }, [transactions, bankAccounts]);

  const pendingTransactions = useMemo(
    () => transactions
      .filter((item) => normalizeStatus(item.status) === "pending")
      .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
      .slice(0, 5),
    [transactions],
  );

  const expenseCategories = useMemo(() => {
    const totals = new Map<string, number>();
    transactions
      .filter((item) => item.type === "expense" && normalizeStatus(item.status) === "paid")
      .forEach((item) => totals.set(item.category || "Sem categoria", (totals.get(item.category || "Sem categoria") || 0) + amountOf(item.amount)));
    const entries = [...totals.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
    const total = entries.reduce((sum, [, value]) => sum + value, 0);
    return entries.map(([name, value]) => ({ name, value, percent: total > 0 ? (value / total) * 100 : 0 }));
  }, [transactions]);

  const metricCards: Array<{
    label: string;
    value: string;
    detail: string;
    icon: typeof Wallet;
    tone: FinancialMetricTone;
    emphasized?: boolean;
  }> = [
    { label: "Saldo em contas", value: money(summary.bankBalance), detail: "Todas as contas ativas", icon: Landmark, tone: "neutral" },
    { label: "Resultado do mês", value: money(summary.net), detail: "Recebido menos pago", icon: Scale, tone: summary.net >= 0 ? "positive" : "negative", emphasized: true },
    { label: "Saldo previsto", value: money(summary.forecast), detail: "Incluindo todas as pendências", icon: Wallet, tone: summary.forecast >= 0 ? "info" : "negative" },
    { label: "Receitas recebidas", value: money(summary.income), detail: "Valores já recebidos", icon: ArrowUpCircle, tone: "positive" },
    { label: "Despesas pagas", value: money(summary.expenses), detail: "Valores já quitados", icon: ArrowDownCircle, tone: "negative" },
    { label: "Receitas pendentes", value: money(summary.receivable), detail: `${summary.pendingIncomeCount} conta(s) a receber`, icon: Clock, tone: summary.receivable > 0 ? "warning" : "neutral", emphasized: summary.receivable > 0 },
    { label: "Despesas pendentes", value: money(summary.payable), detail: `${summary.pendingExpenseCount} conta(s) a pagar`, icon: CalendarClock, tone: summary.payable > 0 ? "warning" : "neutral", emphasized: summary.payable > 0 },
  ];

  const comparisonData = [
    { name: "Receitas", value: summary.income, fill: "hsl(var(--success))" },
    { name: "Despesas", value: summary.expenses, fill: "hsl(var(--destructive))" },
  ];

  return (
    <div className="space-y-6">
      <section aria-label="Resumo financeiro" className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {metricCards.map((metric) => <FinancialMetricCard key={metric.label} {...metric} />)}
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="overflow-hidden shadow-sm lg:col-span-2">
          <CardHeader className="border-b border-border/70 pb-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <CircleDollarSign className="h-4 w-4 text-primary" aria-hidden="true" />
              Comparativo do mês
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[280px] pt-6">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparisonData} barCategoryGap="34%">
                <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                <Tooltip formatter={(value: number) => [money(value), "Valor"]} cursor={{ fill: "hsl(var(--muted) / 0.35)" }} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="overflow-hidden shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between border-b border-border/70 pb-4">
            <CardTitle className="text-base">Próximos vencimentos</CardTitle>
            <span className="rounded-md bg-warning/10 px-2 py-1 text-xs font-semibold text-warning">{pendingTransactions.length} pendente(s)</span>
          </CardHeader>
          <CardContent className="p-0">
            {pendingTransactions.length > 0 ? (
              <div className="divide-y divide-border/60">
                {pendingTransactions.map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-3 px-5 py-3 transition-colors hover:bg-muted/30">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{item.description}</p>
                      <p className="text-xs text-muted-foreground">{new Date(`${item.due_date}T00:00:00`).toLocaleDateString("pt-BR")}</p>
                    </div>
                    <p className={item.type === "income" ? "shrink-0 text-sm font-bold text-success" : "shrink-0 text-sm font-bold text-destructive"}>
                      {item.type === "income" ? "+" : "-"} {money(amountOf(item.amount))}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex min-h-48 flex-col items-center justify-center gap-2 px-5 text-center">
                <CalendarClock className="h-7 w-7 text-muted-foreground" aria-hidden="true" />
                <p className="text-sm font-medium">Nenhum vencimento pendente</p>
                <p className="text-xs text-muted-foreground">As contas deste mês estão em dia.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="overflow-hidden shadow-sm">
        <CardHeader className="border-b border-border/70 pb-4">
          <CardTitle className="text-base">Despesas por categoria</CardTitle>
        </CardHeader>
        <CardContent className="pt-5">
          {expenseCategories.length > 0 ? (
            <div className="grid grid-cols-1 gap-x-8 gap-y-5 md:grid-cols-2">
              {expenseCategories.map((category) => (
                <div key={category.name}>
                  <div className="mb-2 flex items-center justify-between gap-4 text-sm">
                    <span className="truncate font-medium">{category.name}</span>
                    <span className="shrink-0 font-semibold tabular-nums">{money(category.value)} · {category.percent.toFixed(0)}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${category.percent}%` }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">Nenhuma despesa paga neste mês.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};