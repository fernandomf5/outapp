import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, ShoppingBag, MessageSquare, Users, Package, Wrench, Clock, BarChart3, ArrowLeft, Workflow } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";
import AgentAppointmentsPanel from "./AgentAppointmentsPanel";
import AgentOrdersPanel from "./AgentOrdersPanel";
import AgentCustomersPanel from "./AgentCustomersPanel";
import AgentConversationsPanel from "./AgentConversationsPanel";
import AgentProductsPanel from "./AgentProductsPanel";
import AgentServicesPanel from "./AgentServicesPanel";
import AgentSchedulePanel from "./AgentSchedulePanel";
import AgentAnalyticsPanel from "./AgentAnalyticsPanel";
import AgentFlowsPanel from "./AgentFlowsPanel";

interface AgentManagementPanelProps {
  agentId: string;
  agentName: string;
}

interface MenuOption {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
}

export default function AgentManagementPanel({ agentId, agentName }: AgentManagementPanelProps) {
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [pendingAppointments, setPendingAppointments] = useState(0);
  const [pendingOrders, setPendingOrders] = useState(0);
  const isMobile = useIsMobile();

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

  const menuOptions: MenuOption[] = [
    { id: "conversations", label: "Conversas", icon: <MessageSquare className="w-6 h-6" /> },
    { id: "flows", label: "Fluxos", icon: <Workflow className="w-6 h-6" /> },
    { id: "services", label: "Serviços", icon: <Wrench className="w-6 h-6" /> },
    { id: "products", label: "Produtos", icon: <Package className="w-6 h-6" /> },
    { id: "schedule", label: "Horários", icon: <Clock className="w-6 h-6" /> },
    { id: "appointments", label: "Agendamentos", icon: <Calendar className="w-6 h-6" />, badge: pendingAppointments },
    { id: "orders", label: "Pedidos", icon: <ShoppingBag className="w-6 h-6" />, badge: pendingOrders },
    { id: "customers", label: "Clientes", icon: <Users className="w-6 h-6" /> },
    { id: "analytics", label: "Analytics", icon: <BarChart3 className="w-6 h-6" /> },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "conversations":
        return <AgentConversationsPanel agentId={agentId} />;
      case "flows":
        return <AgentFlowsPanel agentId={agentId} />;
      case "services":
        return <AgentServicesPanel agentId={agentId} />;
      case "products":
        return <AgentProductsPanel agentId={agentId} />;
      case "schedule":
        return <AgentSchedulePanel agentId={agentId} />;
      case "appointments":
        return <AgentAppointmentsPanel agentId={agentId} />;
      case "orders":
        return <AgentOrdersPanel agentId={agentId} />;
      case "customers":
        return <AgentCustomersPanel agentId={agentId} />;
      case "analytics":
        return <AgentAnalyticsPanel agentId={agentId} />;
      default:
        return null;
    }
  };

  // Mobile layout: grid de ícones ou conteúdo
  if (isMobile) {
    if (activeTab) {
      return (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => setActiveTab(null)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h2 className="text-xl font-bold">
              {menuOptions.find(opt => opt.id === activeTab)?.label}
            </h2>
          </div>
          {renderContent()}
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-2">Gestão: {agentName}</h2>
          <p className="text-muted-foreground text-sm">
            Gerencie agendamentos, pedidos e clientes do seu agente IA
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {menuOptions.map((option) => (
            <Card 
              key={option.id}
              className="p-4 cursor-pointer hover:bg-accent/50 transition-colors active:scale-95"
              onClick={() => setActiveTab(option.id)}
            >
              <div className="flex flex-col items-center gap-2 text-center relative">
                <div className="p-3 rounded-full bg-primary/10 text-primary">
                  {option.icon}
                </div>
                <span className="text-sm font-medium">{option.label}</span>
                {option.badge && option.badge > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-1 -right-1 h-5 min-w-5 flex items-center justify-center rounded-full text-xs"
                  >
                    {option.badge}
                  </Badge>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Desktop layout: tabs tradicionais
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-2">Gestão: {agentName}</h2>
        <p className="text-muted-foreground">
          Gerencie agendamentos, pedidos e clientes do seu agente IA
        </p>
      </div>

      <Tabs value={activeTab || "conversations"} onValueChange={setActiveTab} className="w-full">
        <TabsList className="flex flex-wrap gap-1 h-auto p-1">
          {menuOptions.map((option) => (
            <TabsTrigger 
              key={option.id} 
              value={option.id}
              className="flex items-center gap-2 px-3 py-2"
            >
              {option.icon}
              <span className="hidden lg:inline">{option.label}</span>
              {option.badge && option.badge > 0 && (
                <Badge variant="destructive" className="h-5 min-w-5 flex items-center justify-center rounded-full text-xs">
                  {option.badge}
                </Badge>
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="conversations">
          <AgentConversationsPanel agentId={agentId} />
        </TabsContent>

        <TabsContent value="flows">
          <AgentFlowsPanel agentId={agentId} />
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
