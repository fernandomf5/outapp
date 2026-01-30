import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  Package,
  Plus,
  Minus,
  ArrowUpDown,
  Search,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
  RotateCcw,
  Truck,
  AlertTriangle,
  History,
  Filter,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Product {
  id: string;
  name: string;
  stock_quantity: number | null;
  min_stock_alert: number | null;
  unit: string | null;
  image_url: string | null;
}

interface StockMovement {
  id: string;
  product_id: string;
  movement_type: string;
  quantity: number;
  previous_quantity: number;
  new_quantity: number;
  unit_cost: number | null;
  total_cost: number | null;
  reason: string | null;
  notes: string | null;
  created_at: string;
}

const movementTypeLabels: Record<string, { label: string; color: string; icon: any }> = {
  entry: { label: "Entrada", color: "bg-green-500", icon: ArrowUpRight },
  exit: { label: "Saída", color: "bg-red-500", icon: ArrowDownRight },
  adjustment: { label: "Ajuste", color: "bg-blue-500", icon: ArrowUpDown },
  sale: { label: "Venda", color: "bg-purple-500", icon: ArrowDownRight },
  return: { label: "Devolução", color: "bg-yellow-500", icon: RotateCcw },
  loss: { label: "Perda", color: "bg-red-600", icon: AlertTriangle },
  transfer: { label: "Transferência", color: "bg-gray-500", icon: Truck },
};

export default function StockManagementPanel() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMovements, setLoadingMovements] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);

  const [movementForm, setMovementForm] = useState({
    movement_type: "entry",
    quantity: "",
    unit_cost: "",
    reason: "",
    notes: "",
  });

  useEffect(() => {
    if (user) {
      loadProducts();
      loadMovements();
    }
  }, [user]);

  const loadProducts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("products" as any)
      .select("id, name, stock_quantity, min_stock_alert, unit, image_url")
      .eq("user_id", user?.id)
      .eq("product_type", "physical")
      .order("name");

    if (error) {
      toast({ title: "Erro ao carregar produtos", description: error.message, variant: "destructive" });
    } else {
      setProducts((data as any) || []);
    }
    setLoading(false);
  };

  const loadMovements = async () => {
    setLoadingMovements(true);
    const { data, error } = await supabase
      .from("stock_movements" as any)
      .select("*")
      .eq("user_id", user?.id)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      toast({ title: "Erro ao carregar movimentações", description: error.message, variant: "destructive" });
    } else {
      setMovements((data as any) || []);
    }
    setLoadingMovements(false);
  };

  const handleOpenMovement = (product: Product) => {
    setSelectedProduct(product);
    setMovementForm({
      movement_type: "entry",
      quantity: "",
      unit_cost: "",
      reason: "",
      notes: "",
    });
    setDialogOpen(true);
  };

  const handleSaveMovement = async () => {
    if (!selectedProduct || !movementForm.quantity) {
      toast({ title: "Erro", description: "Preencha a quantidade", variant: "destructive" });
      return;
    }

    const quantity = parseInt(movementForm.quantity);
    if (isNaN(quantity) || quantity <= 0) {
      toast({ title: "Erro", description: "Quantidade inválida", variant: "destructive" });
      return;
    }

    const currentStock = selectedProduct.stock_quantity || 0;
    let newQuantity: number;

    // Calculate new quantity based on movement type
    if (["entry", "return"].includes(movementForm.movement_type)) {
      newQuantity = currentStock + quantity;
    } else if (["exit", "sale", "loss", "transfer"].includes(movementForm.movement_type)) {
      newQuantity = currentStock - quantity;
      if (newQuantity < 0) {
        toast({ title: "Erro", description: "Estoque insuficiente", variant: "destructive" });
        return;
      }
    } else {
      // adjustment - direct set
      newQuantity = quantity;
    }

    setSaving(true);

    const movementData = {
      user_id: user?.id,
      product_id: selectedProduct.id,
      movement_type: movementForm.movement_type,
      quantity: movementForm.movement_type === "adjustment" ? newQuantity - currentStock : quantity,
      previous_quantity: currentStock,
      new_quantity: newQuantity,
      unit_cost: movementForm.unit_cost ? parseFloat(movementForm.unit_cost) : null,
      total_cost: movementForm.unit_cost ? parseFloat(movementForm.unit_cost) * quantity : null,
      reason: movementForm.reason || null,
      notes: movementForm.notes || null,
    };

    const { error } = await supabase.from("stock_movements" as any).insert(movementData);

    if (error) {
      toast({ title: "Erro ao salvar movimentação", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Movimentação registrada!" });
      setDialogOpen(false);
      loadProducts();
      loadMovements();
    }

    setSaving(false);
  };

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredMovements = movements.filter((m) => {
    if (filterType !== "all" && m.movement_type !== filterType) return false;
    return true;
  });

  const getProductName = (productId: string) => {
    return products.find((p) => p.id === productId)?.name || "Produto não encontrado";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Products Stock Overview */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Estoque de Produtos
            </CardTitle>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar produto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredProducts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Nenhum produto físico encontrado</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produto</TableHead>
                    <TableHead className="text-center">Estoque Atual</TableHead>
                    <TableHead className="text-center">Mínimo</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => {
                    const stock = product.stock_quantity || 0;
                    const minStock = product.min_stock_alert || 5;
                    const isLow = stock <= minStock;
                    const isOut = stock === 0;

                    return (
                      <TableRow key={product.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {product.image_url ? (
                              <img
                                src={product.image_url}
                                alt={product.name}
                                className="h-10 w-10 rounded object-cover"
                              />
                            ) : (
                              <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
                                <Package className="h-5 w-5 text-muted-foreground" />
                              </div>
                            )}
                            <span className="font-medium">{product.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="font-bold text-lg">{stock}</span>
                          <span className="text-muted-foreground ml-1">{product.unit || "un"}</span>
                        </TableCell>
                        <TableCell className="text-center text-muted-foreground">{minStock}</TableCell>
                        <TableCell className="text-center">
                          {isOut ? (
                            <Badge variant="destructive">Sem estoque</Badge>
                          ) : isLow ? (
                            <Badge variant="outline" className="border-yellow-500 text-yellow-600">
                              Baixo
                            </Badge>
                          ) : (
                            <Badge variant="secondary">Normal</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-green-600"
                              onClick={() => {
                                setSelectedProduct(product);
                                setMovementForm({ ...movementForm, movement_type: "entry" });
                                setDialogOpen(true);
                              }}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600"
                              onClick={() => {
                                setSelectedProduct(product);
                                setMovementForm({ ...movementForm, movement_type: "exit" });
                                setDialogOpen(true);
                              }}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleOpenMovement(product)}>
                              <ArrowUpDown className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Movement History */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Histórico de Movimentações
            </CardTitle>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Filtrar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="entry">Entradas</SelectItem>
                  <SelectItem value="exit">Saídas</SelectItem>
                  <SelectItem value="sale">Vendas</SelectItem>
                  <SelectItem value="adjustment">Ajustes</SelectItem>
                  <SelectItem value="return">Devoluções</SelectItem>
                  <SelectItem value="loss">Perdas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loadingMovements ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : filteredMovements.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <History className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Nenhuma movimentação encontrada</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredMovements.map((movement) => {
                const typeInfo = movementTypeLabels[movement.movement_type] || {
                  label: movement.movement_type,
                  color: "bg-gray-500",
                  icon: ArrowUpDown,
                };
                const Icon = typeInfo.icon;

                return (
                  <div
                    key={movement.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${typeInfo.color}/10`}>
                        <Icon className={`h-4 w-4 ${typeInfo.color.replace("bg-", "text-")}`} />
                      </div>
                      <div>
                        <p className="font-medium">{getProductName(movement.product_id)}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Badge variant="outline" className="text-xs">
                            {typeInfo.label}
                          </Badge>
                          {movement.reason && <span>• {movement.reason}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">{movement.previous_quantity}</span>
                        <span>→</span>
                        <span className="font-bold">{movement.new_quantity}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(movement.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Movement Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Movimentação de Estoque</DialogTitle>
            <DialogDescription>
              {selectedProduct?.name} - Estoque atual: {selectedProduct?.stock_quantity || 0}{" "}
              {selectedProduct?.unit || "un"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Tipo de Movimentação</Label>
              <Select
                value={movementForm.movement_type}
                onValueChange={(v) => setMovementForm({ ...movementForm, movement_type: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="entry">➕ Entrada</SelectItem>
                  <SelectItem value="exit">➖ Saída</SelectItem>
                  <SelectItem value="sale">💰 Venda</SelectItem>
                  <SelectItem value="return">↩️ Devolução</SelectItem>
                  <SelectItem value="loss">⚠️ Perda/Avaria</SelectItem>
                  <SelectItem value="adjustment">🔧 Ajuste de Inventário</SelectItem>
                  <SelectItem value="transfer">🚚 Transferência</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>
                {movementForm.movement_type === "adjustment" ? "Nova Quantidade" : "Quantidade"}
              </Label>
              <Input
                type="number"
                min="1"
                value={movementForm.quantity}
                onChange={(e) => setMovementForm({ ...movementForm, quantity: e.target.value })}
                placeholder={movementForm.movement_type === "adjustment" ? "Novo estoque" : "Quantidade"}
              />
            </div>

            {["entry", "return"].includes(movementForm.movement_type) && (
              <div>
                <Label>Custo Unitário (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={movementForm.unit_cost}
                  onChange={(e) => setMovementForm({ ...movementForm, unit_cost: e.target.value })}
                  placeholder="0.00"
                />
              </div>
            )}

            <div>
              <Label>Motivo</Label>
              <Input
                value={movementForm.reason}
                onChange={(e) => setMovementForm({ ...movementForm, reason: e.target.value })}
                placeholder="Ex: Compra de fornecedor, Venda balcão..."
              />
            </div>

            <div>
              <Label>Observações</Label>
              <Textarea
                value={movementForm.notes}
                onChange={(e) => setMovementForm({ ...movementForm, notes: e.target.value })}
                placeholder="Informações adicionais..."
              />
            </div>

            <Button onClick={handleSaveMovement} disabled={saving} className="w-full">
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Registrar Movimentação
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
