import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ShoppingCart, Plus, Minus, Trash2 } from "lucide-react";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  is_available: boolean;
  stock_quantity: number;
  image_url: string;
}

interface CartItem {
  product: Product;
  quantity: number;
}

interface AgentOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agentId: string;
  customerId: string;
  conversationId: string;
  onSuccess: () => void;
}

export default function AgentOrderDialog({
  open,
  onOpenChange,
  agentId,
  customerId,
  conversationId,
  onSuccess,
}: AgentOrderDialogProps) {
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      loadProducts();
    }
  }, [open, agentId]);

  const loadProducts = async () => {
    const { data, error } = await supabase
      .from('agent_products')
      .select('*')
      .eq('agent_id', agentId)
      .eq('is_available', true)
      .order('name');

    if (error) {
      toast({
        title: "Erro",
        description: "Erro ao carregar produtos",
        variant: "destructive",
      });
    } else {
      setProducts(data || []);
      if (!data || data.length === 0) {
        toast({
          title: "Aviso",
          description: "Nenhum produto disponível para pedidos",
          variant: "destructive",
        });
      }
    }
  };

  const addToCart = (product: Product) => {
    const existing = cart.find(item => item.product.id === product.id);
    if (existing) {
      if (product.stock_quantity && existing.quantity >= product.stock_quantity) {
        toast({
          title: "Estoque insuficiente",
          variant: "destructive",
        });
        return;
      }
      setCart(cart.map(item =>
        item.product.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { product, quantity: 1 }]);
    }
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(cart.map(item => {
      if (item.product.id === productId) {
        const newQuantity = item.quantity + delta;
        if (newQuantity <= 0) return item;
        if (item.product.stock_quantity && newQuantity > item.product.stock_quantity) {
          toast({
            title: "Estoque insuficiente",
            variant: "destructive",
          });
          return item;
        }
        return { ...item, quantity: newQuantity };
      }
      return item;
    }));
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.product.id !== productId));
  };

  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  };

  const handleSubmit = async () => {
    if (cart.length === 0) {
      toast({
        title: "Carrinho vazio",
        description: "Adicione produtos ao carrinho",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const orderNumber = `ORD-${Date.now()}`;
      const items = cart.map(item => ({
        name: item.product.name,
        quantity: item.quantity,
        price: item.product.price,
      }));

      const { error } = await supabase
        .from('agent_orders')
        .insert({
          agent_id: agentId,
          customer_id: customerId,
          conversation_id: conversationId,
          order_number: orderNumber,
          items: items,
          delivery_address: deliveryAddress || null,
          customer_notes: notes || null,
          total_amount: calculateTotal(),
          status: 'pending',
        });

      if (error) throw error;

      // Criar notificação
      await supabase.from('agent_notifications').insert({
        agent_id: agentId,
        notification_type: 'new_order',
        title: 'Novo Pedido',
        message: `Pedido ${orderNumber} no valor de R$ ${calculateTotal().toFixed(2)}`,
        is_read: false,
      });

      toast({
        title: "Pedido realizado! 🛍️",
        description: `Pedido ${orderNumber} aguardando confirmação`,
      });

      onSuccess();
      onOpenChange(false);
      resetForm();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setCart([]);
    setDeliveryAddress("");
    setNotes("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Fazer Pedido</DialogTitle>
          <DialogDescription>
            Selecione os produtos e finalize seu pedido
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-6">
          {/* Produtos */}
          <div className="space-y-4">
            <h3 className="font-semibold">Produtos Disponíveis</h3>
            {products.map((product) => (
              <Card key={product.id}>
                <CardContent className="p-4">
                  <div className="flex gap-3">
                    {product.image_url && (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-16 h-16 object-cover rounded"
                      />
                    )}
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium">{product.name}</h4>
                          {product.category && (
                            <Badge variant="outline" className="text-xs mt-1">
                              {product.category}
                            </Badge>
                          )}
                        </div>
                        <span className="font-bold text-green-600">
                          R$ {product.price.toFixed(2)}
                        </span>
                      </div>
                      {product.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {product.description}
                        </p>
                      )}
                      {product.stock_quantity !== null && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Estoque: {product.stock_quantity}
                        </p>
                      )}
                      <Button
                        size="sm"
                        className="mt-2"
                        onClick={() => addToCart(product)}
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Adicionar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Carrinho */}
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              Carrinho ({cart.length})
            </h3>
            
            {cart.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  Carrinho vazio
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="space-y-2">
                  {cart.map((item) => (
                    <Card key={item.product.id}>
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-sm">{item.product.name}</h4>
                            <p className="text-xs text-muted-foreground">
                              R$ {item.product.price.toFixed(2)} x {item.quantity}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              size="icon"
                              variant="outline"
                              className="h-6 w-6"
                              onClick={() => updateQuantity(item.product.id, -1)}
                            >
                              <Minus className="w-3 h-3" />
                            </Button>
                            <span className="text-sm font-medium w-8 text-center">
                              {item.quantity}
                            </span>
                            <Button
                              size="icon"
                              variant="outline"
                              className="h-6 w-6"
                              onClick={() => updateQuantity(item.product.id, 1)}
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                            <Button
                              size="icon"
                              variant="destructive"
                              className="h-6 w-6"
                              onClick={() => removeFromCart(item.product.id)}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div>
                  <Label htmlFor="address">Endereço de Entrega</Label>
                  <Input
                    id="address"
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder="Rua, número, bairro, cidade"
                  />
                </div>

                <div>
                  <Label htmlFor="notes">Observações</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Informações adicionais sobre o pedido"
                  />
                </div>

                <Card className="bg-primary/5">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between text-lg font-bold">
                      <span>Total:</span>
                      <span className="text-green-600">
                        R$ {calculateTotal().toFixed(2)}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? "Enviando..." : "Finalizar Pedido"}
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}