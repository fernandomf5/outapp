import { useMemo } from "react";
import {
  Activity,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  CalendarClock,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  Landmark,
  Receipt,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface Transaction {
  id: string;
  amount: number;
  type: "income" | "expense";
  status: string;
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
  /** Bank accounts are shared by every financial folder. */
  showBankBalance?: boolean;
  onShowTransactions?: () => void;
}

const amountOf = (value: number | string | null | undefined) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};
const money = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
const paid = (status: string | null | undefined) => status?.trim().toLowerCase() === "paid";
const pending = (status: string | null | undefined) => status?.trim().toLowerCase() === "pending";
const dateLabel = (date: string) => {
  if (!date) return "Sem vencimento";
  const parsed = new Date(date.slice(0, 10) + "T12:00:00");
  return Number.isNaN(parsed.getTime()) ? "Sem vencimento" : parsed.toLocaleDateString("pt-BR");
};

export const FinancialOverview = ({
  transactions,
  bankAccounts,
  showBankBalance = false,
  onShowTransactions,
}: FinancialOverviewProps) => {
  const summary = useMemo(() => {
    const sum = (type: "income" | "expense", status: "paid" | "pending") =>
      transactions.reduce(
        (total, item) => total + (item.type === type && (status === "paid" ? paid(item.status) : pending(item.status)) ? amountOf(item.amount) : 0),
        0,
      );

    const received = sum("income", "paid");
    const spent = sum("expense", "paid");
    const toReceive = sum("income", "pending");
    const toPay = sum("expense", "pending");

    return {
      received,
      spent,
      toReceive,
      toPay,
      realized: received - spent,
      forecast: received + toReceive - spent - toPay,
      pendingCount: transactions.filter((item) => pending(item.status)).length,
      bankBalance: bankAccounts.reduce((total, item) => total + amountOf(item.current_balance), 0),
    };
  }, [transactions, bankAccounts]);

  const upcoming = useMemo(() =>
    transactions
      .filter((item) => pending(item.status))
      .slice()
      .sort((a, b) => (a.due_date || "9999").localeCompare(b.due_date || "9999"))
      .slice(0, 5),
  [transactions]);

  const recent = useMemo(() =>
    transactions
      .slice()
      .sort((a, b) => (b.due_date || "").localeCompare(a.due_date || ""))
      .slice(0, 4),
  [transactions]);

  const comparisonData = [
    { label: "Recebido", amount: summary.received, fill: "#5be0b1" },
    { label: "Pago", amount: summary.spent, fill: "#ff8998" },
  ];

  const metrics = [
    {
      label: "Receitas recebidas",
      amount: summary.received,
      helper: "Entradas confirmadas no mês",
      tone: "positive",
      icon: ArrowUpRight,
    },
    {
      label: "Despesas pagas",
      amount: summary.spent,
      helper: "Saídas confirmadas no mês",
      tone: "negative",
      icon: ArrowDownRight,
    },
    {
      label: "A receber",
      amount: summary.toReceive,
      helper: "Receitas aguardando pagamento",
      tone: "warning",
      icon: Clock3,
    },
    {
      label: "A pagar",
      amount: summary.toPay,
      helper: "Despesas aguardando quitação",
      tone: "warning",
      icon: CalendarClock,
    },
  ];

  return (
    <div className="finance-overview">
      <section className="finance-overview-hero" aria-label="Resultado financeiro do mês">
        <div className="finance-result-card">
          <div className="finance-result-kicker"><Activity size={16} /> RESULTADO DO PERÍODO</div>
          <div className="finance-result-value">{money(summary.realized)}</div>
          <p className="finance-result-subtitle">Diferença entre tudo o que já entrou e o que já foi pago neste mês.</p>
          <div className="finance-result-insight">
            <span className={"finance-result-pill " + (summary.realized < 0 ? "negative" : "")}>
              {summary.realized >= 0 ? <TrendingUp size={14} /> : <ArrowDownRight size={14} />}
              {summary.realized >= 0 ? "Resultado positivo" : "Resultado negativo"}
            </span>
            <span>{transactions.length} movimentação(ões) no período</span>
          </div>
        </div>
        <div className="finance-forecast-card">
          <div>
            <span className="finance-forecast-icon"><Wallet size={19} /></span>
            <p style={{ marginTop: 14 }}>SALDO PREVISTO</p>
            <strong>{money(summary.forecast)}</strong>
            <small>Estimativa incluindo receitas e despesas pendentes da aba selecionada.</small>
          </div>
          {showBankBalance ? (
            <div style={{ borderTop: "1px solid rgba(125,182,222,.19)", paddingTop: 12 }}>
              <p><Landmark size={14} style={{ display: "inline", marginRight: 6 }} /> SALDO DAS CONTAS BANCÁRIAS</p>
              <strong style={{ fontSize: 18 }}>{money(summary.bankBalance)}</strong>
            </div>
          ) : (
            <div className="finance-result-insight" style={{ marginTop: 0 }}>
              <span className="finance-result-pill"><CheckCircle2 size={13} /> Valores desta aba</span>
            </div>
          )}
        </div>
      </section>

      <section className="finance-metric-grid" aria-label="Indicadores financeiros">
        {metrics.map(({ label, amount, helper, tone, icon: Icon }) => (
          <div key={label} className={"finance-metric " + tone}>
            <div className="finance-metric-top">
              <span className="finance-metric-label">{label}</span>
              <span className="finance-metric-icon"><Icon size={17} /></span>
            </div>
            <strong>{money(amount)}</strong>
            <small>{helper}</small>
          </div>
        ))}
      </section>

      <div className="finance-overview-panels">
        <section className="finance-panel" aria-label="Comparativo financeiro">
          <div className="finance-panel-title">
            <h3><CircleDollarSign size={16} color="#67dfff" /> Entradas x saídas</h3>
            <span className="finance-panel-aside">Valores efetivados</span>
          </div>
          <div className="finance-comparison">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparisonData} barCategoryGap="46%" margin={{ left: 2, right: 14, top: 8, bottom: 0 }}>
                <CartesianGrid stroke="#375672" strokeDasharray="3 5" vertical={false} opacity={0.45} />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "#aac5d7", fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} width={56} tick={{ fill: "#8baabe", fontSize: 10 }}
                  tickFormatter={(value: number) => value >= 1000 ? (value / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 1 }) + " mil" : String(value)} />
                <Tooltip
                  formatter={(value: number) => [money(amountOf(value)), "Valor"]}
                  contentStyle={{ background: "#0b2b47", color: "#f0faff", border: "1px solid #41647f", borderRadius: 10, fontSize: 12 }}
                  cursor={{ fill: "#65d9f212" }}
                />
                <Bar dataKey="amount" name="Valor" radius={[8, 8, 3, 3]} maxBarSize={84} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="finance-panel" aria-label="Próximos vencimentos">
          <div className="finance-panel-title">
            <h3><CalendarClock size={16} color="#ffd08a" /> Próximos vencimentos</h3>
            <span className="finance-panel-aside">{summary.pendingCount} pendente(s)</span>
          </div>
          {upcoming.length ? (
            <div className="finance-due-list">
              {upcoming.map((item) => (
                <div className="finance-due-row" key={item.id}>
                  <div className="finance-due-copy">
                    <strong title={item.description}>{item.description}</strong>
                    <span>Vence em {dateLabel(item.due_date)}</span>
                  </div>
                  <span className={"finance-due-amount " + item.type}>
                    {item.type === "income" ? "+" : "−"} {money(amountOf(item.amount))}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="finance-empty">
              <CheckCircle2 size={25} color="#66e4b8" />
              <span>Nenhuma conta pendente neste período.</span>
            </div>
          )}
        </section>
      </div>

      <section className="finance-panel" aria-label="Últimas movimentações">
        <div className="finance-panel-title">
          <h3><Receipt size={16} color="#67dfff" /> Movimentações recentes</h3>
          {onShowTransactions && (
            <button type="button" className="finance-panel-link" onClick={onShowTransactions}>
              Ver transações <ArrowRight size={15} />
            </button>
          )}
        </div>
        {recent.length ? recent.map((item) => (
          <div className="finance-recent-row" key={item.id}>
            <div className="finance-recent-copy">
              <strong title={item.description}>{item.description}</strong>
              <span>{dateLabel(item.due_date)} · {item.type === "income" ? "Receita" : "Despesa"}</span>
            </div>
            <span className={"finance-recent-status " + (pending(item.status) ? "pending" : "")}>
              {paid(item.status) ? "Pago" : pending(item.status) ? "Pendente" : item.status}
            </span>
            <strong className={"finance-recent-amount " + item.type}>
              {item.type === "income" ? "+" : "−"} {money(amountOf(item.amount))}
            </strong>
          </div>
        )) : (
          <div className="finance-empty">
            <Receipt size={25} />
            <span>Esta aba ainda não tem movimentações no período selecionado.</span>
            {onShowTransactions && <button type="button" className="finance-panel-link" onClick={onShowTransactions}>Adicionar transação <ArrowRight size={14}/></button>}
          </div>
        )}
      </section>
    </div>
  );
};