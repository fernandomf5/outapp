import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ShoppingBag, User, Phone, Mail, MapPin, Package } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Order {
  id: string;
  order_number: string;
  items: any;
  total_amount: number;
  status: string;
  delivery_address: string;
  customer_notes: string;
  created_at: string;
  agent_customers: {
    name: string;
    email: string;
    phone: string;
  };
}

export default function AgentOrdersPanel({ agentId }: { agentId: string }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadOrders();
    setupRealtimeSubscription();
  }, [agentId]);

  const loadOrders = async () => {
    const { data, error } = await supabase
      .from('agent_orders')
      .select(`
        *,
        agent_customers (
          name,
          email,
          phone
        )
      `)
      .eq('agent_id', agentId)
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: "Erro ao carregar pedidos",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setOrders(data || []);
    }
    setLoading(false);
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel('agent-orders')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'agent_orders',
          filter: `agent_id=eq.${agentId}`,
        },
        () => {
          loadOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const updateStatus = async (orderId: string, newStatus: string) => {
    const { error } = await supabase
      .from('agent_orders')
      .update({ status: newStatus })
      .eq('id', orderId);

    if (error) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Status atualizado!",
        description: "Pedido atualizado com sucesso.",
      });
      loadOrders();
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-500",
      confirmed: "bg-blue-500",
      preparing: "bg-purple-500",
      ready: "bg-green-500",
      delivered: "bg-gray-500",
      cancelled: "bg-red-500",
    };
    return colors[status] || "bg-gray-500";
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: "Pendente",
      confirmed: "Confirmado",
      preparing: "Preparando",
      ready: "Pronto",
      delivered: "Entregue",
      cancelled: "Cancelado",
    };
    return labels[status] || status;
  };

  if (loading) {
    return <div>Carregando pedidos...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold">Pedidos</h3>
        <Badge variant="outline">{orders.length} total</Badge>
      </div>

      {orders.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <ShoppingBag className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Nenhum pedido ainda</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {orders.map((order) => (
            <Card key={order.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">Pedido #{order.order_number}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {new Date(order.created_at).toLocaleString('pt-BR')}
                    </p>
                  </div>
                  <Badge className={getStatusColor(order.status)}>
                    {getStatusLabel(order.status)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span>{order.agent_customers.name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span>{order.agent_customers.email}</span>
                  </div>
                  {order.agent_customers.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span>{order.agent_customers.phone}</span>
                    </div>
                  )}
                  {order.delivery_address && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span>{order.delivery_address}</span>
                    </div>
                  )}

                  <div className="mt-3 p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Package className="w-4 h-4" />
                      <p className="text-sm font-medium">Itens do Pedido:</p>
                    </div>
                    <ul className="space-y-1">
                      {Array.isArray(order.items) && order.items.map((item: any, idx: number) => (
                        <li key={idx} className="text-sm flex justify-between">
                          <span>{item.quantity}x {item.name}</span>
                          <span>R$ {item.price.toFixed(2)}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-2 pt-2 border-t flex justify-between font-bold">
                      <span>Total:</span>
                      <span>R$ {order.total_amount.toFixed(2)}</span>
                    </div>
                  </div>

                  {order.customer_notes && (
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-sm font-medium mb-1">Observações:</p>
                      <p className="text-sm">{order.customer_notes}</p>
                    </div>
                  )}

                  <div className="pt-2">
                    <Select
                      value={order.status}
                      onValueChange={(value) => updateStatus(order.id, value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pendente</SelectItem>
                        <SelectItem value="confirmed">Confirmar</SelectItem>
                        <SelectItem value="preparing">Preparando</SelectItem>
                        <SelectItem value="ready">Pronto</SelectItem>
                        <SelectItem value="delivered">Entregue</SelectItem>
                        <SelectItem value="cancelled">Cancelar</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}