import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { DollarSign } from "lucide-react";

export const ChatbotFinancialPanel = ({ chatbotId }: { chatbotId: string }) => {
  const [financial, setFinancial] = useState({
    totalRevenue: 0,
    pendingAmount: 0,
    completedAmount: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFinancial();
  }, [chatbotId]);

  const loadFinancial = async () => {
    try {
      const { data: orders } = await supabase
        .from('chatbot_orders')
        .select('total, status')
        .eq('chatbot_id', chatbotId);

      const totalRevenue = orders?.reduce((sum, order) => sum + Number(order.total), 0) || 0;
      const completedAmount = orders?.filter(o => o.status === 'completed').reduce((sum, order) => sum + Number(order.total), 0) || 0;
      const pendingAmount = orders?.filter(o => o.status === 'pending').reduce((sum, order) => sum + Number(order.total), 0) || 0;

      setFinancial({ totalRevenue, pendingAmount, completedAmount });
      setLoading(false);
    } catch (error) {
      console.error('Error loading financial:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center p-12">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>;
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Receita Total
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">R$ {financial.totalRevenue.toFixed(2)}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Recebido
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">R$ {financial.completedAmount.toFixed(2)}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Pendente
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">R$ {financial.pendingAmount.toFixed(2)}</p>
        </CardContent>
      </Card>
    </div>
  );
};