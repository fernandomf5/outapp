import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Eye, MousePointerClick, ShoppingCart, DollarSign, Percent, Users, Smartphone, Monitor, Tablet } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Props {
  checkout: any | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const brl = (n: number) => `R$ ${Number(n || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const STATUS_LABEL: Record<string, string> = {
  paid: "Pago", approved: "Pago", pending: "Pendente", rejected: "Recusado",
  cancelled: "Cancelado", refunded: "Reembolsado", in_process: "Em análise",
};
const METHOD_LABEL: Record<string, string> = {
  pix: "PIX", manual_pix: "PIX Manual", credit_card: "Cartão de Crédito",
  debit_card: "Cartão de Débito", bolbradesco: "Boleto", boleto: "Boleto",
};

export const CheckoutAnalyticsDialog = ({ checkout, open, onOpenChange }: Props) => {
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [range, setRange] = useState("30");

  useEffect(() => {
    if (!open || !checkout?.id) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const since = range === "all" ? null : new Date(Date.now() - Number(range) * 86400000).toISOString();
      let evq = supabase.from("checkout_events").select("*").eq("checkout_id", checkout.id).order("created_at", { ascending: false }).limit(5000);
      let odq = supabase.from("checkout_orders").select("*").eq("checkout_id", checkout.id).order("created_at", { ascending: false }).limit(2000);
      if (since) { evq = evq.gte("created_at", since); odq = odq.gte("created_at", since); }
      const [{ data: ev }, { data: od }] = await Promise.all([evq, odq]);
      if (cancelled) return;
      setEvents(ev || []);
      setOrders(od || []);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [open, checkout?.id, range]);

  const stats = useMemo(() => {
    const byType = (t: string) => events.filter((e) => e.event_type === t);
    const uniq = (rows: any[]) => new Set(rows.map((r) => r.session_id || r.id)).size;

    const views = byType("view").length;
    const visitors = uniq(byType("view"));
    const formStarts = uniq(byType("form_start"));
    const clicks = byType("checkout_start").length;
    const clickSessions = uniq(byType("checkout_start"));
    const bumps = byType("bump_added").length;

    const paid = orders.filter((o) => ["paid", "approved"].includes(String(o.status)));
    const pending = orders.filter((o) => String(o.status) === "pending");
    const revenue = paid.reduce((s, o) => s + Number(o.amount || 0), 0);
    const ticket = paid.length ? revenue / paid.length : 0;
    const convRate = visitors ? (paid.length / visitors) * 100 : 0;
    const clickRate = visitors ? (clickSessions / visitors) * 100 : 0;
    const abandonRate = orders.length ? (1 - paid.length / orders.length) * 100 : 0;

    const group = (rows: any[], key: (r: any) => string) => {
      const m = new Map<string, number>();
      rows.forEach((r) => { const k = key(r) || "—"; m.set(k, (m.get(k) || 0) + 1); });
      return [...m.entries()].sort((a, b) => b[1] - a[1]);
    };

    const devices = group(byType("view"), (r) => r.device);
    const sources = group(byType("view"), (r) => {
      const ref = r.referrer;
      if (!ref) return "Direto";
      try { return new URL(ref).hostname.replace(/^www\./, ""); } catch { return ref; }
    }).slice(0, 8);
    const methods = group(orders.filter((o) => o.payment_method), (o) => METHOD_LABEL[o.payment_method] || o.payment_method);
    const statuses = group(orders, (o) => STATUS_LABEL[o.status] || o.status);

    // últimos 14 dias
    const days: { label: string; views: number; sales: number; revenue: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      const key = d.toISOString().slice(0, 10);
      const dv = byType("view").filter((e) => String(e.created_at).slice(0, 10) === key).length;
      const dp = paid.filter((o) => String(o.created_at).slice(0, 10) === key);
      days.push({
        label: d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
        views: dv, sales: dp.length,
        revenue: dp.reduce((s, o) => s + Number(o.amount || 0), 0),
      });
    }

    return { views, visitors, formStarts, clicks, clickSessions, bumps, paid, pending, revenue, ticket, convRate, clickRate, abandonRate, devices, sources, methods, statuses, days };
  }, [events, orders]);

  const maxDay = Math.max(1, ...stats.days.map((d) => Math.max(d.views, d.sales)));

  const kpi = (icon: any, label: string, value: string, sub?: string, color = "text-slate-900") => {
    const Icon = icon;
    return (
      <Card className="p-4 border-none shadow-sm rounded-xl bg-white">
        <div className="flex items-center gap-2 text-slate-500 text-xs font-medium mb-2">
          <Icon className="w-4 h-4" /> {label}
        </div>
        <div className={`text-2xl font-bold ${color}`}>{value}</div>
        {sub && <div className="text-[11px] text-slate-400 mt-1">{sub}</div>}
      </Card>
    );
  };

  const bar = (rows: [string, number][], total: number) => (
    <div className="space-y-2">
      {rows.length === 0 && <p className="text-xs text-slate-400">Sem dados ainda.</p>}
      {rows.map(([label, count]) => (
        <div key={label}>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-slate-600 truncate max-w-[70%]">{label}</span>
            <span className="text-slate-500 font-medium">{count} ({total ? Math.round((count / total) * 100) : 0}%)</span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-[#10b981] rounded-full" style={{ width: `${total ? (count / total) * 100 : 0}%` }} />
          </div>
        </div>
      ))}
    </div>
  );

  const funnel = [
    { label: "Visitas", value: stats.visitors, icon: Eye },
    { label: "Iniciaram formulário", value: stats.formStarts, icon: Users },
    { label: "Clicaram em comprar", value: stats.clickSessions, icon: MousePointerClick },
    { label: "Pedidos criados", value: orders.length, icon: ShoppingCart },
    { label: "Compras aprovadas", value: stats.paid.length, icon: DollarSign },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] p-0 flex flex-col z-[250]">
        <DialogHeader className="p-5 pb-3 border-b">
          <DialogTitle className="flex flex-wrap items-center gap-3">
            <span>Analytics — {checkout?.name}</span>
            <Select value={range} onValueChange={setRange}>
              <SelectTrigger className="h-8 w-[150px] text-xs"><SelectValue /></SelectTrigger>
              <SelectContent className="z-[300]">
                <SelectItem value="7">Últimos 7 dias</SelectItem>
                <SelectItem value="30">Últimos 30 dias</SelectItem>
                <SelectItem value="90">Últimos 90 dias</SelectItem>
                <SelectItem value="all">Todo o período</SelectItem>
              </SelectContent>
            </Select>
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 min-h-0">
          <div className="p-5 space-y-5 bg-slate-50">
            {loading ? (
              <div className="py-20 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-[#10b981]" /></div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {kpi(Eye, "Visitas", String(stats.views), `${stats.visitors} visitantes únicos`)}
                  {kpi(MousePointerClick, "Cliques em comprar", String(stats.clicks), `Taxa de clique ${stats.clickRate.toFixed(1)}%`)}
                  {kpi(ShoppingCart, "Pedidos", String(orders.length), `${stats.pending.length} pendentes`)}
                  {kpi(DollarSign, "Compras aprovadas", String(stats.paid.length), undefined, "text-[#10b981]")}
                  {kpi(DollarSign, "Faturamento", brl(stats.revenue), undefined, "text-[#10b981]")}
                  {kpi(DollarSign, "Ticket médio", brl(stats.ticket))}
                  {kpi(Percent, "Conversão", `${stats.convRate.toFixed(1)}%`, "Visitantes → compras")}
                  {kpi(Percent, "Abandono", `${stats.abandonRate.toFixed(1)}%`, "Pedidos não pagos", "text-orange-600")}
                </div>

                <Card className="p-4 border-none shadow-sm rounded-xl bg-white">
                  <h4 className="font-semibold text-sm mb-3 text-slate-800">Funil de conversão</h4>
                  <div className="space-y-2">
                    {funnel.map((f, i) => {
                      const pct = funnel[0].value ? (f.value / funnel[0].value) * 100 : 0;
                      const Icon = f.icon;
                      return (
                        <div key={f.label} className="flex items-center gap-3">
                          <Icon className="w-4 h-4 text-slate-400 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-slate-600">{f.label}</span>
                              <span className="font-medium text-slate-700">{f.value} ({pct.toFixed(0)}%)</span>
                            </div>
                            <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full rounded-full" style={{ width: `${pct}%`, background: `hsl(${160 - i * 12} 70% 45%)` }} />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Card>

                <Card className="p-4 border-none shadow-sm rounded-xl bg-white">
                  <h4 className="font-semibold text-sm mb-3 text-slate-800">Últimos 14 dias</h4>
                  <div className="flex items-end gap-1 h-32">
                    {stats.days.map((d) => (
                      <div key={d.label} className="flex-1 flex flex-col items-center justify-end gap-0.5 group relative">
                        <div className="w-full bg-slate-200 rounded-t" style={{ height: `${(d.views / maxDay) * 90}%` }} />
                        <div className="w-full bg-[#10b981] rounded-t" style={{ height: `${(d.sales / maxDay) * 90}%` }} />
                        <span className="text-[8px] text-slate-400 rotate-0">{d.label}</span>
                        <div className="absolute bottom-full mb-1 hidden group-hover:block bg-slate-900 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap z-10">
                          {d.views} visitas · {d.sales} vendas · {brl(d.revenue)}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-4 mt-2 text-[10px] text-slate-500">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 bg-slate-200 rounded-sm" /> Visitas</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 bg-[#10b981] rounded-sm" /> Vendas</span>
                  </div>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="p-4 border-none shadow-sm rounded-xl bg-white">
                    <h4 className="font-semibold text-sm mb-3 text-slate-800">Origem do tráfego</h4>
                    {bar(stats.sources, stats.views)}
                  </Card>
                  <Card className="p-4 border-none shadow-sm rounded-xl bg-white">
                    <h4 className="font-semibold text-sm mb-3 text-slate-800 flex items-center gap-2">
                      <Smartphone className="w-4 h-4" /><Tablet className="w-4 h-4" /><Monitor className="w-4 h-4" /> Dispositivos
                    </h4>
                    {bar(stats.devices, stats.views)}
                  </Card>
                  <Card className="p-4 border-none shadow-sm rounded-xl bg-white">
                    <h4 className="font-semibold text-sm mb-3 text-slate-800">Formas de pagamento</h4>
                    {bar(stats.methods, orders.filter((o) => o.payment_method).length)}
                  </Card>
                  <Card className="p-4 border-none shadow-sm rounded-xl bg-white">
                    <h4 className="font-semibold text-sm mb-3 text-slate-800">Status dos pedidos</h4>
                    {bar(stats.statuses, orders.length)}
                  </Card>
                </div>

                <Card className="p-4 border-none shadow-sm rounded-xl bg-white">
                  <h4 className="font-semibold text-sm mb-3 text-slate-800">Últimos pedidos</h4>
                  <div className="max-h-[300px] overflow-y-auto space-y-2">
                    {orders.length === 0 && <p className="text-xs text-slate-400">Nenhum pedido no período.</p>}
                    {orders.slice(0, 50).map((o) => (
                      <div key={o.id} className="flex items-center justify-between gap-3 p-2 rounded-lg border border-slate-100">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-800 truncate">{o.customer_name || "—"}</p>
                          <p className="text-[11px] text-slate-400 truncate">{o.customer_email}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-semibold text-slate-800">{brl(o.amount)}</p>
                          <Badge variant="secondary" className="text-[10px]">{STATUS_LABEL[o.status] || o.status}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
