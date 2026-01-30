import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from "recharts";
import {
  Package,
  TrendingUp,
  TrendingDown,
  DollarSign,
  AlertTriangle,
  Layers,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Lightbulb,
} from "lucide-react";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Product {
  id: string;
  name: string;
  product_type: string;
  category: string | null;
  price: number;
  cost_price: number | null;
  stock_quantity: number | null;
  min_stock_alert: number | null;
  is_active: boolean;
}

interface StockMovement {
  id: string;
  product_id: string;
  movement_type: string;
  quantity: number;
  total_cost: number | null;
  created_at: string;
}

const COLORS = ["hsl(var(--primary))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

export default function ProductsAnalyticsPanel() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    const sixMonthsAgo = subMonths(new Date(), 6);

    const [productsRes, movementsRes] = await Promise.all([
      supabase
        .from("products" as any)
        .select("*")
        .eq("user_id", user?.id),
      supabase
        .from("stock_movements" as any)
        .select("*")
        .eq("user_id", user?.id)
        .gte("created_at", sixMonthsAgo.toISOString())
        .order("created_at", { ascending: true }),
    ]);

    if (productsRes.error) {
      toast({ title: "Erro ao carregar produtos", description: productsRes.error.message, variant: "destructive" });
    } else {
      setProducts((productsRes.data as any) || []);
    }

    if (!movementsRes.error) {
      setMovements((movementsRes.data as any) || []);
    }

    setLoading(false);
  };

  const stats = useMemo(() => {
    const totalProducts = products.length;
    const activeProducts = products.filter((p) => p.is_active).length;
    const physicalProducts = products.filter((p) => p.product_type === "physical");
    
    // Stock value calculation
    const stockValue = physicalProducts.reduce((sum, p) => {
      const qty = p.stock_quantity || 0;
      const cost = p.cost_price || p.price;
      return sum + qty * cost;
    }, 0);

    // Sale value (potential revenue)
    const saleValue = physicalProducts.reduce((sum, p) => {
      const qty = p.stock_quantity || 0;
      return sum + qty * p.price;
    }, 0);

    // Profit margin
    const potentialProfit = saleValue - stockValue;
    const profitMargin = stockValue > 0 ? (potentialProfit / stockValue) * 100 : 0;

    // Low stock alerts
    const lowStockProducts = physicalProducts.filter((p) => {
      const qty = p.stock_quantity || 0;
      const minAlert = p.min_stock_alert || 5;
      return qty <= minAlert;
    });

    // Out of stock
    const outOfStock = physicalProducts.filter((p) => (p.stock_quantity || 0) === 0);

    // Categories distribution
    const categories: Record<string, number> = {};
    products.forEach((p) => {
      const cat = p.category || "Sem categoria";
      categories[cat] = (categories[cat] || 0) + 1;
    });

    // Type distribution
    const typeDistribution = {
      physical: products.filter((p) => p.product_type === "physical").length,
      digital: products.filter((p) => p.product_type === "digital").length,
      affiliate: products.filter((p) => p.product_type === "affiliate").length,
    };

    return {
      totalProducts,
      activeProducts,
      stockValue,
      saleValue,
      potentialProfit,
      profitMargin,
      lowStockProducts,
      outOfStock,
      categories,
      typeDistribution,
    };
  }, [products]);

  const movementChartData = useMemo(() => {
    const months: Record<string, { entries: number; exits: number; month: string }> = {};
    
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      const key = format(date, "yyyy-MM");
      months[key] = {
        month: format(date, "MMM", { locale: ptBR }),
        entries: 0,
        exits: 0,
      };
    }

    movements.forEach((m) => {
      const key = format(new Date(m.created_at), "yyyy-MM");
      if (months[key]) {
        if (["entry", "return"].includes(m.movement_type)) {
          months[key].entries += Math.abs(m.quantity);
        } else if (["exit", "sale", "loss"].includes(m.movement_type)) {
          months[key].exits += Math.abs(m.quantity);
        }
      }
    });

    return Object.values(months);
  }, [movements]);

  const categoryChartData = useMemo(() => {
    return Object.entries(stats.categories)
      .map(([name, value]) => ({ name, value }))
      .slice(0, 5);
  }, [stats.categories]);

  const typeChartData = useMemo(() => {
    return [
      { name: "Físico", value: stats.typeDistribution.physical },
      { name: "Digital", value: stats.typeDistribution.digital },
      { name: "Afiliado", value: stats.typeDistribution.affiliate },
    ].filter((d) => d.value > 0);
  }, [stats.typeDistribution]);

  const topProducts = useMemo(() => {
    const productMovements: Record<string, number> = {};
    
    movements
      .filter((m) => ["sale", "exit"].includes(m.movement_type))
      .forEach((m) => {
        productMovements[m.product_id] = (productMovements[m.product_id] || 0) + Math.abs(m.quantity);
      });

    return Object.entries(productMovements)
      .map(([productId, quantity]) => {
        const product = products.find((p) => p.id === productId);
        return { name: product?.name || "Produto", quantity };
      })
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);
  }, [movements, products]);

  const insights = useMemo(() => {
    const tips: { type: "success" | "warning" | "info"; message: string }[] = [];

    if (stats.outOfStock.length > 0) {
      tips.push({
        type: "warning",
        message: `${stats.outOfStock.length} produto(s) estão sem estoque. Considere reabastecer.`,
      });
    }

    if (stats.lowStockProducts.length > 0) {
      tips.push({
        type: "warning",
        message: `${stats.lowStockProducts.length} produto(s) estão com estoque baixo.`,
      });
    }

    if (stats.profitMargin > 50) {
      tips.push({
        type: "success",
        message: `Excelente margem de lucro de ${stats.profitMargin.toFixed(1)}%! Continue assim.`,
      });
    } else if (stats.profitMargin < 20 && stats.profitMargin > 0) {
      tips.push({
        type: "info",
        message: `Margem de lucro de ${stats.profitMargin.toFixed(1)}%. Considere revisar preços ou custos.`,
      });
    }

    if (stats.totalProducts > 0 && stats.activeProducts < stats.totalProducts * 0.7) {
      tips.push({
        type: "info",
        message: `${stats.totalProducts - stats.activeProducts} produtos inativos. Considere reativá-los ou removê-los.`,
      });
    }

    if (stats.stockValue > 10000) {
      tips.push({
        type: "info",
        message: `R$ ${stats.stockValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} em estoque. Monitore o giro para evitar capital parado.`,
      });
    }

    return tips;
  }, [stats]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Package className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Produtos</p>
                <p className="text-2xl font-bold">{stats.totalProducts}</p>
                <p className="text-xs text-muted-foreground">{stats.activeProducts} ativos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <DollarSign className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Valor em Estoque</p>
                <p className="text-2xl font-bold">
                  R$ {stats.stockValue.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <TrendingUp className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Lucro Potencial</p>
                <p className="text-2xl font-bold">
                  R$ {stats.potentialProfit.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-muted-foreground">{stats.profitMargin.toFixed(1)}% margem</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${stats.lowStockProducts.length > 0 ? "bg-red-500/10" : "bg-green-500/10"}`}>
                <AlertTriangle className={`h-6 w-6 ${stats.lowStockProducts.length > 0 ? "text-red-500" : "text-green-500"}`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Alertas</p>
                <p className="text-2xl font-bold">{stats.lowStockProducts.length}</p>
                <p className="text-xs text-muted-foreground">{stats.outOfStock.length} sem estoque</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Insights */}
      {insights.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-500" />
              Insights e Recomendações
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {insights.map((insight, i) => (
                <div
                  key={i}
                  className={`flex items-start gap-2 p-3 rounded-lg ${
                    insight.type === "warning"
                      ? "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400"
                      : insight.type === "success"
                      ? "bg-green-500/10 text-green-700 dark:text-green-400"
                      : "bg-blue-500/10 text-blue-700 dark:text-blue-400"
                  }`}
                >
                  {insight.type === "warning" ? (
                    <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  ) : insight.type === "success" ? (
                    <TrendingUp className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  ) : (
                    <Lightbulb className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  )}
                  <span className="text-sm">{insight.message}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Charts Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Movement Evolution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Movimentação de Estoque
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={movementChartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Bar dataKey="entries" name="Entradas" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="exits" name="Saídas" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Category Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <PieChartIcon className="h-5 w-5" />
              Distribuição por Categoria
            </CardTitle>
          </CardHeader>
          <CardContent>
            {categoryChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={categoryChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    labelLine={false}
                  >
                    {categoryChartData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                Sem dados de categoria
              </div>
            )}
          </CardContent>
        </Card>

        {/* Type Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Layers className="h-5 w-5" />
              Tipos de Produto
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={typeChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {typeChartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Produtos Mais Movimentados
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topProducts.length > 0 ? (
              <div className="space-y-3">
                {topProducts.map((product, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-muted-foreground w-6">{i + 1}.</span>
                      <span className="font-medium truncate max-w-[200px]">{product.name}</span>
                    </div>
                    <Badge variant="secondary">{product.quantity} un</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                Sem movimentações registradas
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Low Stock Alert List */}
      {stats.lowStockProducts.length > 0 && (
        <Card className="border-yellow-500/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-yellow-600 dark:text-yellow-400">
              <AlertTriangle className="h-5 w-5" />
              Produtos com Estoque Baixo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
              {stats.lowStockProducts.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between p-3 bg-yellow-500/10 rounded-lg"
                >
                  <div>
                    <p className="font-medium truncate max-w-[180px]">{product.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Mínimo: {product.min_stock_alert || 5} un
                    </p>
                  </div>
                  <Badge variant={product.stock_quantity === 0 ? "destructive" : "outline"}>
                    {product.stock_quantity || 0} un
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
