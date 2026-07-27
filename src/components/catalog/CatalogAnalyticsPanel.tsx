import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import {
  DollarSign,
  ShoppingBag,
  Clock,
  CheckCircle2,
  TrendingUp,
  Download,
  Loader2,
  Users,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

interface Props {
  catalogId: string;
}

interface OrderRow {
  order_number: string;
  customer_name: string | null;
  total_amount: number;
  status: string;
  payment_status: string | null;
  payment_method: string | null;
  created_at: string;
  items: any;
}

const money = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);

export default function CatalogAnalyticsPanel({ catalogId }: Props) {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [customers, setCustomers] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [{ data }, { count }] = await Promise.all([
        supabase
          .from("catalog_orders" as any)
          .select("order_number, customer_name, total_amount, status, payment_status, payment_method, created_at, items")
          .eq("catalog_id", catalogId)
          .order("created_at", { ascending: false }),
        supabase
          .from("catalog_customers" as any)
          .select("*", { count: "exact", head: true })
          .eq("catalog_id", catalogId),
      ]);
      setOrders((data as unknown as OrderRow[]) || []);
      setCustomers(count || 0);
      setLoading(false);
    };
    load();
  }, [catalogId]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const paid = orders.filter((o) => o.payment_status === "paid");
  const pending = orders.filter((o) => !o.payment_status || o.payment_status === "pending");
  const awaiting = orders.filter((o) => o.payment_status === "awaiting_confirmation");

  const revenue = paid.reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
  const pipeline = orders
    .filter((o) => o.payment_status !== "paid")
    .reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
  const ticket = paid.length ? revenue / paid.length : 0;

  // last 30 days chart
  const days: { day: string; pedidos: number; receita: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const dayOrders = orders.filter((o) => (o.created_at || "").slice(0, 10) === key);
    days.push({
      day: `${d.getDate()}/${d.getMonth() + 1}`,
      pedidos: dayOrders.length,
      receita: dayOrders
        .filter((o) => o.payment_status === "paid")
        .reduce((s, o) => s + Number(o.total_amount || 0), 0),
    });
  }

  // top products
  const productMap = new Map<string, { name: string; qty: number; total: number }>();
  orders.forEach((o) => {
    const items = Array.isArray(o.items) ? o.items : [];
    items.forEach((item: any) => {
      const name = String(item?.name || "Item");
      const entry = productMap.get(name) || { name, qty: 0, total: 0 };
      entry.qty += Number(item?.quantity) || 0;
      entry.total += (Number(item?.price) || 0) * (Number(item?.quantity) || 0);
      productMap.set(name, entry);
    });
  });
  const topProducts = Array.from(productMap.values()).sort((a, b) => b.qty - a.qty).slice(0, 8);

  const methodCounts = orders.reduce<Record<string, number>>((acc, o) => {
    const key = o.payment_method || "nao_informado";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  const methodLabels: Record<string, string> = {
    pix_manual: "PIX manual",
    mercadopago: "Mercado Pago",
    whatsapp: "WhatsApp",
    nao_informado: "Não informado",
  };

  const exportCsv = () => {
    const header = ["Pedido", "Cliente", "Total", "Status", "Pagamento", "Método", "Data"];
    const rows = orders.map((o) => [
      o.order_number,
      o.customer_name || "",
      Number(o.total_amount || 0).toFixed(2),
      o.status,
      o.payment_status || "pending",
      o.payment_method || "",
      new Date(o.created_at).toLocaleString("pt-BR"),
    ]);
    const csv = [header, ...rows]
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(";"))
      .join("\n");
    const url = URL.createObjectURL(new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `relatorio-catalogo-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const stats = [
    { label: "Receita paga", value: money(revenue), icon: DollarSign, tone: "text-green-600" },
    { label: "A receber", value: money(pipeline), icon: Clock, tone: "text-amber-600" },
    { label: "Ticket médio", value: money(ticket), icon: TrendingUp, tone: "text-primary" },
    { label: "Pedidos", value: String(orders.length), icon: ShoppingBag, tone: "text-primary" },
    { label: "Pagos", value: String(paid.length), icon: CheckCircle2, tone: "text-green-600" },
    { label: "Clientes", value: String(customers), icon: Users, tone: "text-primary" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h3 className="text-sm font-semibold text-muted-foreground">
          Visão geral de vendas e pagamentos
        </h3>
        <Button size="sm" variant="outline" onClick={exportCsv} disabled={orders.length === 0}>
          <Download className="w-4 h-4 mr-1" /> Exportar CSV
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <s.icon className={`w-5 h-5 mb-2 ${s.tone}`} />
              <p className="text-lg font-bold leading-tight">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pedidos e receita (30 dias)</CardTitle>
        </CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={days}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="day" fontSize={11} interval={4} />
              <YAxis fontSize={11} allowDecimals={false} />
              <Tooltip
                formatter={(value: any, name: string) =>
                  name === "receita" ? money(Number(value)) : value
                }
              />
              <Bar dataKey="pedidos" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Produtos mais vendidos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {topProducts.length === 0 && (
              <p className="text-sm text-muted-foreground">Nenhum item vendido ainda.</p>
            )}
            {topProducts.map((p) => (
              <div key={p.name} className="flex items-center justify-between text-sm border-b pb-2 last:border-0">
                <span className="truncate mr-3">{p.name}</span>
                <span className="flex items-center gap-3 shrink-0">
                  <Badge variant="secondary">{p.qty}x</Badge>
                  <span className="font-semibold">{money(p.total)}</span>
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Formas de pagamento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(methodCounts).length === 0 && (
              <p className="text-sm text-muted-foreground">Nenhum pedido registrado.</p>
            )}
            {Object.entries(methodCounts).map(([key, count]) => (
              <div key={key} className="flex items-center justify-between text-sm">
                <span>{methodLabels[key] || key}</span>
                <Badge variant="outline">{count}</Badge>
              </div>
            ))}
            <div className="pt-3 border-t text-xs text-muted-foreground space-y-1">
              <p>Aguardando confirmação: {awaiting.length}</p>
              <p>Pendentes: {pending.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
