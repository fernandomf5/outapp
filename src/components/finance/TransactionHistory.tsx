import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, Landmark, TrendingUp, TrendingDown, Wallet } from "lucide-react";
import { format, parseISO, startOfWeek, endOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale";

interface TransactionHistoryProps {
  transactions: any[];
  bankAccounts: any[];
}

type Granularity = "day" | "week" | "month" | "year";

const GRANULARITY_LABEL: Record<Granularity, string> = {
  day: "Por dia",
  week: "Por semana",
  month: "Por mês",
  year: "Por ano",
};

const currency = (value: number) =>
  `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const parseDate = (value: string) => parseISO(`${String(value).slice(0, 10)}T00:00:00`);

const buildPeriod = (date: Date, granularity: Granularity) => {
  if (granularity === "day") {
    return { key: format(date, "yyyy-MM-dd"), label: format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR }) };
  }
  if (granularity === "week") {
    const start = startOfWeek(date, { weekStartsOn: 1 });
    const end = endOfWeek(date, { weekStartsOn: 1 });
    return {
      key: format(start, "yyyy-'W'II"),
      label: `${format(start, "dd/MM")} a ${format(end, "dd/MM/yyyy")}`,
    };
  }
  if (granularity === "month") {
    return { key: format(date, "yyyy-MM"), label: format(date, "MMMM 'de' yyyy", { locale: ptBR }) };
  }
  return { key: format(date, "yyyy"), label: format(date, "yyyy") };
};

export const TransactionHistory = ({ transactions, bankAccounts }: TransactionHistoryProps) => {
  const [granularity, setGranularity] = useState<Granularity>("month");
  const [statusFilter, setStatusFilter] = useState<"all" | "paid" | "pending">("all");
  const [bankFilter, setBankFilter] = useState("all");
  const [openKeys, setOpenKeys] = useState<string[]>([]);

  const bankNameById = useMemo(
    () => new Map<string, string>(bankAccounts.map((a: any) => [a.id, a.bank_name])),
    [bankAccounts]
  );

  const filtered = useMemo(
    () =>
      transactions.filter((t) => {
        const matchesStatus = statusFilter === "all" || t.status === statusFilter;
        const matchesBank =
          bankFilter === "all" ||
          (bankFilter === "none" ? !t.bank_account_id : t.bank_account_id === bankFilter);
        return matchesStatus && matchesBank && t.due_date;
      }),
    [transactions, statusFilter, bankFilter]
  );

  const groups = useMemo(() => {
    const map = new Map<string, { key: string; label: string; sort: string; items: any[] }>();
    filtered.forEach((t) => {
      const date = parseDate(t.due_date);
      const { key, label } = buildPeriod(date, granularity);
      if (!map.has(key)) map.set(key, { key, label, sort: format(date, "yyyy-MM-dd"), items: [] });
      const group = map.get(key)!;
      group.items.push(t);
      if (format(date, "yyyy-MM-dd") > group.sort) group.sort = format(date, "yyyy-MM-dd");
    });

    return Array.from(map.values())
      .sort((a, b) => (a.sort < b.sort ? 1 : -1))
      .map((group) => {
        const income = group.items
          .filter((t) => t.type === "income")
          .reduce((sum, t) => sum + Number(t.amount || 0), 0);
        const expense = group.items
          .filter((t) => t.type === "expense")
          .reduce((sum, t) => sum + Number(t.amount || 0), 0);

        const byBank = new Map<string, { income: number; expense: number }>();
        group.items.forEach((t) => {
          const id = t.bank_account_id || "none";
          const entry = byBank.get(id) || { income: 0, expense: 0 };
          if (t.type === "income") entry.income += Number(t.amount || 0);
          else entry.expense += Number(t.amount || 0);
          byBank.set(id, entry);
        });

        return {
          ...group,
          income,
          expense,
          balance: income - expense,
          byBank: Array.from(byBank.entries()).map(([id, values]) => ({
            id,
            name: id === "none" ? "Sem conta" : bankNameById.get(id) || "Conta removida",
            ...values,
          })),
          items: [...group.items].sort((a, b) => (a.due_date < b.due_date ? 1 : -1)),
        };
      });
  }, [filtered, granularity, bankNameById]);

  const totals = useMemo(() => {
    const income = groups.reduce((sum, g) => sum + g.income, 0);
    const expense = groups.reduce((sum, g) => sum + g.expense, 0);
    return { income, expense, balance: income - expense };
  }, [groups]);

  const toggle = (key: string) =>
    setOpenKeys((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-2 md:items-center md:justify-between">
        <div className="flex flex-wrap gap-2">
          <Select value={granularity} onValueChange={(v: Granularity) => setGranularity(v)}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(GRANULARITY_LABEL) as Granularity[]).map((g) => (
                <SelectItem key={g} value={g}>
                  {GRANULARITY_LABEL[g]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="paid">Somente pagas</SelectItem>
              <SelectItem value="pending">Somente pendentes</SelectItem>
            </SelectContent>
          </Select>

          <Select value={bankFilter} onValueChange={setBankFilter}>
            <SelectTrigger className="w-[180px]">
              <Landmark className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as contas</SelectItem>
              <SelectItem value="none">Sem conta</SelectItem>
              {bankAccounts.map((acc: any) => (
                <SelectItem key={acc.id} value={acc.id}>
                  {acc.bank_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setOpenKeys(openKeys.length ? [] : groups.map((g) => g.key))}
        >
          {openKeys.length ? "Recolher tudo" : "Expandir tudo"}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <TrendingUp className="h-5 w-5 text-green-600" />
            <div>
              <p className="text-xs text-muted-foreground">Entradas no período</p>
              <p className="text-xl font-bold text-green-600">{currency(totals.income)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <TrendingDown className="h-5 w-5 text-red-600" />
            <div>
              <p className="text-xs text-muted-foreground">Saídas no período</p>
              <p className="text-xl font-bold text-red-600">{currency(totals.expense)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Wallet className="h-5 w-5 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Saldo</p>
              <p className={`text-xl font-bold ${totals.balance >= 0 ? "text-green-600" : "text-red-600"}`}>
                {currency(totals.balance)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {groups.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            Nenhuma transação no histórico.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {groups.map((group) => {
            const isOpen = openKeys.includes(group.key);
            return (
              <Card key={group.key}>
                <Collapsible open={isOpen} onOpenChange={() => toggle(group.key)}>
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer py-4">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                        <CardTitle className="text-base capitalize flex items-center gap-2">
                          <ChevronDown
                            className={`h-4 w-4 transition-transform ${isOpen ? "" : "-rotate-90"}`}
                          />
                          {group.label}
                          <Badge variant="secondary">{group.items.length}</Badge>
                        </CardTitle>
                        <div className="flex flex-wrap gap-3 text-sm">
                          <span className="text-green-600 font-semibold">+ {currency(group.income)}</span>
                          <span className="text-red-600 font-semibold">- {currency(group.expense)}</span>
                          <span
                            className={`font-bold ${group.balance >= 0 ? "text-green-600" : "text-red-600"}`}
                          >
                            = {currency(group.balance)}
                          </span>
                        </div>
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <CardContent className="space-y-4">
                      <div className="flex flex-wrap gap-2">
                        {group.byBank.map((bank) => (
                          <div
                            key={bank.id}
                            className="rounded-lg border px-3 py-2 text-xs bg-muted/30"
                          >
                            <div className="font-medium flex items-center gap-1">
                              <Landmark className="h-3.5 w-3.5 text-muted-foreground" />
                              {bank.name}
                            </div>
                            <div className="flex gap-2 mt-1">
                              <span className="text-green-600">+{currency(bank.income)}</span>
                              <span className="text-red-600">-{currency(bank.expense)}</span>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Data</TableHead>
                              <TableHead>Descrição</TableHead>
                              <TableHead>Categoria</TableHead>
                              <TableHead>Conta</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead className="text-right">Valor</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {group.items.map((t) => (
                              <TableRow key={t.id}>
                                <TableCell>{format(parseDate(t.due_date), "dd/MM/yyyy")}</TableCell>
                                <TableCell className="font-medium">{t.description}</TableCell>
                                <TableCell>
                                  {t.category ? (
                                    <Badge variant="secondary">{t.category}</Badge>
                                  ) : (
                                    <span className="text-xs text-muted-foreground">—</span>
                                  )}
                                </TableCell>
                                <TableCell className="text-sm">
                                  {t.bank_account_id
                                    ? bankNameById.get(t.bank_account_id) || "Conta removida"
                                    : "Sem conta"}
                                </TableCell>
                                <TableCell>
                                  <Badge variant={t.status === "paid" ? "default" : "outline"}>
                                    {t.status === "paid" ? "Pago" : "Pendente"}
                                  </Badge>
                                </TableCell>
                                <TableCell
                                  className={`text-right font-semibold ${
                                    t.type === "income" ? "text-green-600" : "text-red-600"
                                  }`}
                                >
                                  {t.type === "income" ? "+" : "-"} {currency(Number(t.amount || 0))}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
