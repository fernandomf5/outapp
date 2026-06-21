import { Card, CardContent } from "@/components/ui/card";
import { TrendingDown, Wallet, ArrowRight, AlertCircle } from "lucide-react";

interface FinanceSummaryProps {
  currentBalance: number;
  pendingExpenses: number;
}

export const FinanceSummary = ({ currentBalance, pendingExpenses }: FinanceSummaryProps) => {
  const predictedBalance = currentBalance - pendingExpenses;
  const hasPending = pendingExpenses > 0;

  return (
    <div className="space-y-4 mb-6">
      {/* Destaque: Despesas Pendentes */}
      <Card
        className={
          hasPending
            ? "bg-destructive/10 border-destructive/40 border-2 shadow-md"
            : "bg-muted/40 border-muted"
        }
      >
        <CardContent className="py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div
                className={
                  hasPending
                    ? "p-4 bg-destructive/20 rounded-full"
                    : "p-4 bg-muted rounded-full"
                }
              >
                {hasPending ? (
                  <AlertCircle className="w-8 h-8 text-destructive" />
                ) : (
                  <TrendingDown className="w-8 h-8 text-muted-foreground" />
                )}
              </div>
              <div>
                <p className="text-base font-semibold text-muted-foreground uppercase tracking-wide">
                  Despesas Pendentes
                </p>
                <p className="text-xs text-muted-foreground">
                  {hasPending
                    ? "Valores a pagar que ainda não foram quitados"
                    : "Nenhuma despesa pendente no momento"}
                </p>
              </div>
            </div>
            <h3
              className={
                hasPending
                  ? "text-4xl md:text-5xl font-extrabold text-destructive tracking-tight"
                  : "text-4xl md:text-5xl font-extrabold text-muted-foreground tracking-tight"
              }
            >
              R$ {pendingExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </h3>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
    </div>
  );
};
