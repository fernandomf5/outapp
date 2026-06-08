import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format, startOfMonth, addMonths, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface Transaction {
  amount: number;
  type: 'income' | 'expense';
  due_date: string;
}

interface ReportCenterProps {
  transactions: Transaction[];
}

export const ReportCenter = ({ transactions }: ReportCenterProps) => {
  const cashFlowData = useMemo(() => {
    const months = Array.from({ length: 6 }).map((_, i) => {
      const date = addMonths(startOfMonth(new Date()), i);
      return {
        key: format(date, 'yyyy-MM'),
        label: format(date, 'MMM/yy', { locale: ptBR }),
        income: 0,
        expense: 0
      };
    });

    transactions.forEach(t => {
      const monthKey = t.due_date.substring(0, 7);
      const monthData = months.find(m => m.key === monthKey);
      if (monthData) {
        if (t.type === 'income') monthData.income += t.amount;
        else monthData.expense += t.amount;
      }
    });

    return months.map(m => ({
      ...m,
      balance: m.income - m.expense
    }));
  }, [transactions]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Projeção de Fluxo de Caixa (Próximos 6 meses)</CardTitle>
        </CardHeader>
        <CardContent className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={cashFlowData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" />
              <YAxis />
              <Tooltip 
                formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 'Valor']}
              />
              <Legend />
              <Bar dataKey="income" name="Receitas" fill="#22c55e" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expense" name="Despesas" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Demonstrativo Detalhado</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mês</TableHead>
                  <TableHead className="text-right">Receitas Estimadas</TableHead>
                  <TableHead className="text-right">Despesas Estimadas</TableHead>
                  <TableHead className="text-right">Saldo Previsto</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cashFlowData.map(m => (
                  <TableRow key={m.key}>
                    <TableCell className="font-medium">{m.label}</TableCell>
                    <TableCell className="text-right text-green-600">R$ {m.income.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell className="text-right text-red-600">R$ {m.expense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell className={`text-right font-bold ${m.balance >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                      R$ {m.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};