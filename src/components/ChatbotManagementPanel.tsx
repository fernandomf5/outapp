import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { ChatbotAnalyticsPanel } from "./ChatbotAnalyticsPanel";
import { ChatbotCustomersPanel } from "./ChatbotCustomersPanel";
import { ChatbotConversationsPanel } from "./ChatbotConversationsPanel";
import { ChatbotProductsPanel } from "./ChatbotProductsPanel";
import { ChatbotAppointmentsPanel } from "./ChatbotAppointmentsPanel";
import { ChatbotOrdersPanel } from "./ChatbotOrdersPanel";
import { ChatbotFinancialPanel } from "./ChatbotFinancialPanel";
import { ChatbotSchedulePanel } from "./ChatbotSchedulePanel";
import { ChatbotAutomationsPanel } from "./ChatbotAutomationsPanel";
import { ChatbotReviewsPanel } from "./ChatbotReviewsPanel";
import { ChatbotNotificationsPanel } from "./ChatbotNotificationsPanel";
import { ChatbotReportsPanel } from "./ChatbotReportsPanel";
import { ChatbotServicesPanel } from "./ChatbotServicesPanel";

interface ChatbotManagementPanelProps {
  chatbot: { id: string; name: string };
}

export const ChatbotManagementPanel = ({ chatbot }: ChatbotManagementPanelProps) => {
  const [pendingAppointments, setPendingAppointments] = useState(0);
  const [pendingOrders, setPendingOrders] = useState(0);

  useEffect(() => {
    fetchNotifications();

    const appointmentsSubscription = supabase
      .channel(`chatbot_appointments_${chatbot.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'chatbot_appointments',
        filter: `chatbot_id=eq.${chatbot.id}`
      }, () => {
        fetchNotifications();
      })
      .subscribe();

    const ordersSubscription = supabase
      .channel(`chatbot_orders_${chatbot.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'chatbot_orders',
        filter: `chatbot_id=eq.${chatbot.id}`
      }, () => {
        fetchNotifications();
      })
      .subscribe();

    return () => {
      appointmentsSubscription.unsubscribe();
      ordersSubscription.unsubscribe();
    };
  }, [chatbot.id]);

  const fetchNotifications = async () => {
    const { count: appointmentsCount } = await supabase
      .from('chatbot_appointments')
      .select('*', { count: 'exact', head: true })
      .eq('chatbot_id', chatbot.id)
      .eq('status', 'pending');

    const { count: ordersCount } = await supabase
      .from('chatbot_orders')
      .select('*', { count: 'exact', head: true })
      .eq('chatbot_id', chatbot.id)
      .eq('status', 'pending');

    setPendingAppointments(appointmentsCount || 0);
    setPendingOrders(ordersCount || 0);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-2">Gestão do Chatbot: {chatbot.name}</h2>
        <p className="text-muted-foreground">
          Gerencie todos os aspectos do seu chatbot de forma centralizada
        </p>
      </div>

      <Tabs defaultValue="analytics" className="space-y-6">
        <TabsList className="grid w-full grid-cols-7 h-auto gap-2">
          <TabsTrigger value="analytics" className="text-xs">Analytics</TabsTrigger>
          <TabsTrigger value="services" className="text-xs">Serviços</TabsTrigger>
          <TabsTrigger value="products" className="text-xs">Produtos</TabsTrigger>
          <TabsTrigger value="schedule" className="text-xs">Horários</TabsTrigger>
          <TabsTrigger value="appointments" className="text-xs relative">
            Agendamentos
            {pendingAppointments > 0 && (
              <Badge variant="destructive" className="ml-2 h-5 min-w-5 flex items-center justify-center rounded-full text-xs">
                {pendingAppointments}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="orders" className="text-xs relative">
            Pedidos
            {pendingOrders > 0 && (
              <Badge variant="destructive" className="ml-2 h-5 min-w-5 flex items-center justify-center rounded-full text-xs">
                {pendingOrders}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="customers" className="text-xs">Clientes</TabsTrigger>
          <TabsTrigger value="conversations" className="text-xs">Conversas</TabsTrigger>
        </TabsList>

        <TabsContent value="analytics">
          <ChatbotAnalyticsPanel chatbotId={chatbot.id} />
        </TabsContent>

        <TabsContent value="services">
          <ChatbotServicesPanel chatbotId={chatbot.id} />
        </TabsContent>

        <TabsContent value="products">
          <ChatbotProductsPanel chatbotId={chatbot.id} />
        </TabsContent>

        <TabsContent value="schedule">
          <ChatbotSchedulePanel chatbotId={chatbot.id} />
        </TabsContent>

        <TabsContent value="appointments">
          <ChatbotAppointmentsPanel chatbotId={chatbot.id} />
        </TabsContent>

        <TabsContent value="orders">
          <ChatbotOrdersPanel chatbotId={chatbot.id} />
        </TabsContent>

        <TabsContent value="customers">
          <ChatbotCustomersPanel chatbotId={chatbot.id} />
        </TabsContent>

        <TabsContent value="conversations">
          <ChatbotConversationsPanel chatbotId={chatbot.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
};