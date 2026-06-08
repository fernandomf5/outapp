import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Wallet, ArrowRight } from "lucide-react";

interface FinanceSummaryProps {
  currentBalance: number;
  pendingExpenses: number;
}

export const FinanceSummary = ({ currentBalance, pendingExpenses }: FinanceSummaryProps) => {
  const predictedBalance = currentBalance - pendingExpenses;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Saldo em Contas</p>
              <h3 className="text-2xl font-bold">R$ {currentBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
            </div>
            <div className="p-3 bg-primary/10 rounded-full">
              <Wallet className="w-6 h-6 text-primary" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-destructive/5 border-destructive/20">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Despesas Pendentes</p>
              <h3 className="text-2xl font-bold text-destructive">R$ {pendingExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
            </div>
            <div className="p-3 bg-destructive/10 rounded-full">
              <TrendingDown className="w-6 h-6 text-destructive" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-green-500/5 border-green-500/20">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Saldo Previsto</p>
              <h3 className="text-2xl font-bold text-green-600">R$ {predictedBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
            </div>
            <div className="p-3 bg-green-500/10 rounded-full">
              <ArrowRight className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
