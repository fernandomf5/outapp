import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { ShoppingCart, User, Phone, Mail, Printer, Package, DollarSign, FileText, CreditCard } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export const ChatbotOrdersPanel = ({ chatbotId }: { chatbotId: string }) => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrders();
  }, [chatbotId]);

  const loadOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('chatbot_orders')
        .select('*, customer:chatbot_customers(*)')
        .eq('chatbot_id', chatbotId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
      setLoading(false);
    } catch (error) {
      console.error('Error loading orders:', error);
      setLoading(false);
    }
  };

  const printOrder = (order: any) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Pedido #${order.id.substring(0, 8)}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
            h1 { color: #333; border-bottom: 2px solid #333; padding-bottom: 10px; }
            .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
            .section { margin: 20px 0; }
            .label { font-weight: bold; color: #666; }
            .value { margin-left: 10px; }
            .status { display: inline-block; padding: 5px 15px; border-radius: 20px; font-weight: bold; }
            .status-completed { background: #22c55e; color: white; }
            .status-pending { background: #eab308; color: white; }
            .status-cancelled { background: #ef4444; color: white; }
            .info-row { margin: 10px 0; display: flex; align-items: center; }
            .items-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            .items-table th, .items-table td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
            .items-table th { background: #f5f5f5; }
            .total { font-size: 20px; font-weight: bold; text-align: right; margin-top: 20px; }
            @media print {
              body { padding: 20px; }
              button { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🛒 Pedido</h1>
            <button onclick="window.print()" style="padding: 10px 20px; background: #3b82f6; color: white; border: none; border-radius: 5px; cursor: pointer;">Imprimir</button>
          </div>
          
          <div class="section">
            <p class="info-row"><span class="label">ID do Pedido:</span><span class="value">#${order.id.substring(0, 8)}</span></p>
            <p class="info-row"><span class="label">Status:</span> <span class="status status-${order.status}">${order.status === 'completed' ? 'Concluído' : order.status === 'cancelled' ? 'Cancelado' : 'Pendente'}</span></p>
            <p class="info-row"><span class="label">Data:</span><span class="value">${new Date(order.created_at).toLocaleString('pt-BR')}</span></p>
          </div>

          <div class="section">
            <h2>👤 Dados do Cliente</h2>
            <p class="info-row"><span class="label">Nome:</span><span class="value">${order.customer?.name || 'N/A'}</span></p>
            <p class="info-row"><span class="label">Email:</span><span class="value">${order.customer?.email || 'N/A'}</span></p>
            <p class="info-row"><span class="label">Telefone:</span><span class="value">${order.customer?.phone || 'N/A'}</span></p>
          </div>

          <div class="section">
            <h2>💰 Valor Total</h2>
            <div class="total">R$ ${Number(order.total).toFixed(2)}</div>
          </div>

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
    return <div className="flex items-center justify-center p-12">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold flex items-center gap-2">
          <ShoppingCart className="h-6 w-6" />
          Pedidos
        </h3>
        <Badge variant="outline">{orders.length} total</Badge>
      </div>

      {orders.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <ShoppingCart className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
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
                    <CardTitle className="text-lg">Pedido #{order.id.substring(0, 8)}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(order.created_at), { 
                        addSuffix: true,
                        locale: ptBR 
                      })}
                    </p>
                  </div>
                  <Badge className={
                    order.status === 'completed' ? 'bg-green-500' :
                    order.status === 'cancelled' ? 'bg-red-500' :
                    'bg-yellow-500'
                  }>
                    {order.status === 'completed' ? 'Concluído' : 
                     order.status === 'cancelled' ? 'Cancelado' : 'Pendente'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="border-t pt-3">
                    <h4 className="font-semibold mb-2">Dados do Cliente</h4>
                    <div className="grid gap-2">
                      <div className="flex items-center gap-2 text-sm">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">Nome:</span>
                        <span>{order.customer?.name || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">Email:</span>
                        <span>{order.customer?.email || 'N/A'}</span>
                      </div>
                      {order.customer?.phone && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">Telefone:</span>
                          <span>{order.customer.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="border-t pt-3">
                    <div className="flex items-center gap-2 mb-3">
                      <DollarSign className="w-4 h-4 text-muted-foreground" />
                      <h4 className="font-semibold">Valor Total</h4>
                    </div>
                    <div className="bg-muted p-4 rounded-lg">
                      <p className="text-2xl font-bold">R$ {Number(order.total).toFixed(2)}</p>
                    </div>
                  </div>

                  <Button 
                    onClick={() => printOrder(order)}
                    variant="outline"
                    className="w-full mt-4"
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
};