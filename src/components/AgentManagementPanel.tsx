import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Calendar, ShoppingBag, MessageSquare, Users, Package, Wrench, Clock, BarChart3 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import AgentAppointmentsPanel from "./AgentAppointmentsPanel";
import AgentOrdersPanel from "./AgentOrdersPanel";
import AgentCustomersPanel from "./AgentCustomersPanel";
import AgentConversationsPanel from "./AgentConversationsPanel";
import AgentProductsPanel from "./AgentProductsPanel";
import AgentServicesPanel from "./AgentServicesPanel";
import AgentSchedulePanel from "./AgentSchedulePanel";
import AgentAnalyticsPanel from "./AgentAnalyticsPanel";

interface AgentManagementPanelProps {
  agentId: string;
  agentName: string;
}

export default function AgentManagementPanel({ agentId, agentName }: AgentManagementPanelProps) {
  const [activeTab, setActiveTab] = useState("conversations");
  const [pendingAppointments, setPendingAppointments] = useState(0);
  const [pendingOrders, setPendingOrders] = useState(0);

  useEffect(() => {
    fetchNotifications();

    // Subscrição em tempo real para agendamentos
    const appointmentsSubscription = supabase
      .channel(`agent_appointments_${agentId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'agent_appointments',
        filter: `agent_id=eq.${agentId}`
      }, () => {
        fetchNotifications();
      })
      .subscribe();

    // Subscrição em tempo real para pedidos
    const ordersSubscription = supabase
      .channel(`agent_orders_${agentId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'agent_orders',
        filter: `agent_id=eq.${agentId}`
      }, () => {
        fetchNotifications();
      })
      .subscribe();

    return () => {
      appointmentsSubscription.unsubscribe();
      ordersSubscription.unsubscribe();
    };
  }, [agentId]);

  const fetchNotifications = async () => {
    // Buscar agendamentos pendentes
    const { count: appointmentsCount } = await supabase
      .from('agent_appointments')
      .select('*', { count: 'exact', head: true })
      .eq('agent_id', agentId)
      .eq('status', 'pending');

    // Buscar pedidos pendentes
    const { count: ordersCount } = await supabase
      .from('agent_orders')
      .select('*', { count: 'exact', head: true })
      .eq('agent_id', agentId)
      .eq('status', 'pending');

    setPendingAppointments(appointmentsCount || 0);
    setPendingOrders(ordersCount || 0);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-2">Gestão: {agentName}</h2>
        <p className="text-muted-foreground">
          Gerencie agendamentos, pedidos e clientes do seu agente IA
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-8 gap-2">
          <TabsTrigger value="conversations">
            <MessageSquare className="w-4 h-4 mr-2" />
            Conversas
          </TabsTrigger>
          <TabsTrigger value="services">
            <Wrench className="w-4 h-4 mr-2" />
            Serviços
          </TabsTrigger>
          <TabsTrigger value="products">
            <Package className="w-4 h-4 mr-2" />
            Produtos
          </TabsTrigger>
          <TabsTrigger value="schedule">
            <Clock className="w-4 h-4 mr-2" />
            Horários
          </TabsTrigger>
          <TabsTrigger value="appointments" className="relative">
            <Calendar className="w-4 h-4 mr-2" />
            Agendamentos
            {pendingAppointments > 0 && (
              <Badge variant="destructive" className="ml-2 h-5 min-w-5 flex items-center justify-center rounded-full text-xs">
                {pendingAppointments}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="orders" className="relative">
            <ShoppingBag className="w-4 h-4 mr-2" />
            Pedidos
            {pendingOrders > 0 && (
              <Badge variant="destructive" className="ml-2 h-5 min-w-5 flex items-center justify-center rounded-full text-xs">
                {pendingOrders}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="customers">
            <Users className="w-4 h-4 mr-2" />
            Clientes
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <BarChart3 className="w-4 h-4 mr-2" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="conversations">
          <AgentConversationsPanel agentId={agentId} />
        </TabsContent>

        <TabsContent value="services">
          <AgentServicesPanel agentId={agentId} />
        </TabsContent>

        <TabsContent value="products">
          <AgentProductsPanel agentId={agentId} />
        </TabsContent>

        <TabsContent value="schedule">
          <AgentSchedulePanel agentId={agentId} />
        </TabsContent>

        <TabsContent value="appointments">
          <AgentAppointmentsPanel agentId={agentId} />
        </TabsContent>

        <TabsContent value="orders">
          <AgentOrdersPanel agentId={agentId} />
        </TabsContent>

        <TabsContent value="customers">
          <AgentCustomersPanel agentId={agentId} />
        </TabsContent>

        <TabsContent value="analytics">
          <AgentAnalyticsPanel agentId={agentId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
