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
  type: string;
  is_active: boolean;
}

interface CartItem {
  product: Product;
  quantity: number;
}

interface ChatbotOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chatbotId: string;
  customerId: string;
  conversationId: string;
  onSuccess: () => void;
}

export default function ChatbotOrderDialog({
  open,
  onOpenChange,
  chatbotId,
  customerId,
  conversationId,
  onSuccess,
}: ChatbotOrderDialogProps) {
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [customerName, setCustomerName] = useState("");

  useEffect(() => {
    if (open) {
      loadProducts();
      loadCustomerName();
    }
  }, [open, chatbotId, customerId]);

  const loadCustomerName = async () => {
    const { data } = await supabase
      .from('chatbot_customers')
      .select('name')
      .eq('id', customerId)
      .single();
    
    if (data) {
      setCustomerName(data.name);
    }
  };

  const loadProducts = async () => {
    const { data, error } = await supabase
      .from('chatbot_products')
      .select('*')
      .eq('chatbot_id', chatbotId)
      .eq('is_active', true)
      .eq('type', 'product')
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
      // Create order
      const { data: order, error: orderError } = await supabase
        .from('chatbot_orders')
        .insert({
          chatbot_id: chatbotId,
          customer_id: customerId,
          total: calculateTotal(),
          status: 'pending',
          payment_method: null,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = cart.map(item => ({
        order_id: order.id,
        product_id: item.product.id,
        quantity: item.quantity,
        price: item.product.price,
      }));

      const { error: itemsError } = await supabase
        .from('chatbot_order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Send message to chat
      const itemsList = cart.map((item) => 
        `• ${item.quantity}x ${item.product.name} - R$ ${item.product.price.toFixed(2)}`
      ).join('\n');

      await supabase.from('chatbot_messages').insert({
        conversation_id: conversationId,
        role: 'user',
        content: `🛍️ *Novo Pedido Realizado*\n\n👤 *Cliente:* ${customerName}\n\n*Itens:*\n${itemsList}\n\n💰 *Total:* R$ ${calculateTotal().toFixed(2)}${notes ? `\n\n📝 *Observações:* ${notes}` : ''}\n\n⏳ Aguardando confirmação...`,
        sender_name: customerName
      });

      toast({
        title: "Pedido realizado! 🛍️",
        description: "Aguardando confirmação",
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
          {/* Products */}
          <div className="space-y-4">
            <h3 className="font-semibold">Produtos Disponíveis</h3>
            {customerName && (
              <div className="p-3 border rounded-md bg-muted mb-4">
                <Label className="text-xs text-muted-foreground">Cliente</Label>
                <p className="font-medium">{customerName}</p>
              </div>
            )}
            {products.map((product) => (
              <Card key={product.id}>
                <CardContent className="p-4">
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <h4 className="font-medium">{product.name}</h4>
                      <span className="font-bold text-green-600">
                        R$ {product.price.toFixed(2)}
                      </span>
                    </div>
                    {product.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {product.description}
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
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Cart */}
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
