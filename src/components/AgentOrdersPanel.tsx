import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ShoppingBag, User, Phone, Mail, MapPin, Package, Printer, FileText, DollarSign } from "lucide-react";
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
  conversation_id: string;
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
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

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
      return;
    }

    // Enviar mensagem ao chat quando o status é atualizado
    const statusMessages: Record<string, string> = {
      confirmed: `✅ *Pedido Confirmado!*\n\n📦 *Pedido:* ${order.order_number}\n💰 *Valor:* R$ ${order.total_amount.toFixed(2)}\n\nSeu pedido foi confirmado e está sendo preparado!`,
      preparing: `👨‍🍳 *Pedido em Preparo*\n\n📦 *Pedido:* ${order.order_number}\n\nSeu pedido está sendo preparado com cuidado!`,
      ready: `✨ *Pedido Pronto!*\n\n📦 *Pedido:* ${order.order_number}\n\nSeu pedido está pronto para entrega/retirada!`,
      delivered: `🎉 *Pedido Entregue!*\n\n📦 *Pedido:* ${order.order_number}\n\nObrigado pela preferência!`,
      cancelled: `❌ *Pedido Cancelado*\n\n📦 *Pedido:* ${order.order_number}\n💰 *Valor:* R$ ${order.total_amount.toFixed(2)}\n\nSeu pedido foi cancelado. Entre em contato para mais informações.`,
    };

    if (statusMessages[newStatus] && order.conversation_id) {
      await supabase.from('agent_messages').insert({
        conversation_id: order.conversation_id,
        role: 'assistant',
        content: statusMessages[newStatus],
        sender_name: 'Sistema'
      });
    }

    toast({
      title: "Status atualizado!",
      description: "Pedido atualizado e cliente notificado.",
    });
    loadOrders();
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

  const printOrder = (order: Order) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const itemsRows = Array.isArray(order.items) ? order.items.map((item: any) => `
      <tr>
        <td>${item.name}</td>
        <td style="text-align: center;">${item.quantity}</td>
        <td style="text-align: right;">R$ ${Number(item.price).toFixed(2)}</td>
        <td style="text-align: right;">R$ ${(item.quantity * item.price).toFixed(2)}</td>
      </tr>
    `).join('') : '';

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Pedido #${order.order_number}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
            h1 { color: #333; border-bottom: 2px solid #333; padding-bottom: 10px; }
            .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
            .section { margin: 20px 0; }
            .label { font-weight: bold; color: #666; }
            .value { margin-left: 10px; }
            .status { display: inline-block; padding: 5px 15px; border-radius: 20px; font-weight: bold; }
            .status-confirmed { background: #3b82f6; color: white; }
            .status-pending { background: #eab308; color: white; }
            .status-preparing { background: #a855f7; color: white; }
            .status-ready { background: #22c55e; color: white; }
            .status-delivered { background: #6b7280; color: white; }
            .status-cancelled { background: #ef4444; color: white; }
            .info-row { margin: 10px 0; display: flex; align-items: center; }
            .items-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            .items-table th, .items-table td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
            .items-table th { background: #f5f5f5; font-weight: bold; }
            .total-row { font-weight: bold; font-size: 18px; background: #f9f9f9; }
            .notes { background: #f5f5f5; padding: 15px; border-radius: 8px; margin-top: 20px; }
            @media print {
              body { padding: 20px; }
              button { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🛒 Pedido #${order.order_number}</h1>
            <button onclick="window.print()" style="padding: 10px 20px; background: #3b82f6; color: white; border: none; border-radius: 5px; cursor: pointer;">Imprimir</button>
          </div>
          
          <div class="section">
            <p class="info-row"><span class="label">ID:</span><span class="value">#${order.id.substring(0, 8)}</span></p>
            <p class="info-row"><span class="label">Status:</span> <span class="status status-${order.status}">${getStatusLabel(order.status)}</span></p>
            <p class="info-row"><span class="label">Data:</span><span class="value">${new Date(order.created_at).toLocaleString('pt-BR')}</span></p>
          </div>

          <div class="section">
            <h2>👤 Dados do Cliente</h2>
            <p class="info-row"><span class="label">Nome:</span><span class="value">${order.agent_customers.name}</span></p>
            <p class="info-row"><span class="label">Email:</span><span class="value">${order.agent_customers.email}</span></p>
            ${order.agent_customers.phone ? `<p class="info-row"><span class="label">Telefone:</span><span class="value">${order.agent_customers.phone}</span></p>` : ''}
          </div>

          ${order.delivery_address ? `
          <div class="section">
            <h2>📍 Endereço de Entrega</h2>
            <p>${order.delivery_address}</p>
          </div>
          ` : ''}

          <div class="section">
            <h2>📦 Itens do Pedido</h2>
            <table class="items-table">
              <thead>
                <tr>
                  <th>Produto</th>
                  <th style="text-align: center;">Qtd</th>
                  <th style="text-align: right;">Preço Unit.</th>
                  <th style="text-align: right;">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                ${itemsRows}
                <tr class="total-row">
                  <td colspan="3" style="text-align: right;">TOTAL:</td>
                  <td style="text-align: right;">R$ ${Number(order.total_amount).toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          ${order.customer_notes ? `
          <div class="section">
            <h2>📝 Observações do Cliente</h2>
            <div class="notes">${order.customer_notes}</div>
          </div>
          ` : ''}

          <div class="section" style="margin-top: 40px; color: #999; font-size: 12px;">
            <p>Pedido realizado em: ${new Date(order.created_at).toLocaleString('pt-BR')}</p>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
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
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                        <p className="text-sm font-medium">Observações do Cliente:</p>
                      </div>
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

                  <Button 
                    onClick={() => printOrder(order)}
                    variant="outline"
                    className="w-full mt-2"
                  >
                    <Printer className="w-4 h-4 mr-2" />
                    Imprimir Pedido
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}