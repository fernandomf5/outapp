import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { ShoppingCart } from "lucide-react";
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

  if (loading) {
    return <div className="flex items-center justify-center p-12">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <ShoppingCart className="h-5 w-5" />
        Pedidos
      </h3>
      <div className="grid gap-4">
        {orders.map((order) => (
          <Card key={order.id} className="p-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">{order.customer?.name}</h4>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  order.status === 'completed' ? 'bg-success/10 text-success' :
                  order.status === 'cancelled' ? 'bg-destructive/10 text-destructive' :
                  'bg-warning/10 text-warning'
                }`}>
                  {order.status}
                </span>
              </div>
              <p className="text-lg font-bold">R$ {order.total}</p>
              <p className="text-sm text-muted-foreground">
                {formatDistanceToNow(new Date(order.created_at), { 
                  addSuffix: true,
                  locale: ptBR 
                })}
              </p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};