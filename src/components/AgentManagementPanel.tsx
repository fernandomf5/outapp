import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, ShoppingBag, MessageSquare, Users, Package, Wrench } from "lucide-react";
import AgentAppointmentsPanel from "./AgentAppointmentsPanel";
import AgentOrdersPanel from "./AgentOrdersPanel";
import AgentCustomersPanel from "./AgentCustomersPanel";
import AgentConversationsPanel from "./AgentConversationsPanel";
import AgentProductsPanel from "./AgentProductsPanel";
import AgentServicesPanel from "./AgentServicesPanel";

interface AgentManagementPanelProps {
  agentId: string;
  agentName: string;
}

export default function AgentManagementPanel({ agentId, agentName }: AgentManagementPanelProps) {
  const [activeTab, setActiveTab] = useState("appointments");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-2">Gestão: {agentName}</h2>
        <p className="text-muted-foreground">
          Gerencie agendamentos, pedidos e clientes do seu agente IA
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-6 gap-2">
          <TabsTrigger value="services">
            <Wrench className="w-4 h-4 mr-2" />
            Serviços
          </TabsTrigger>
          <TabsTrigger value="products">
            <Package className="w-4 h-4 mr-2" />
            Produtos
          </TabsTrigger>
          <TabsTrigger value="appointments">
            <Calendar className="w-4 h-4 mr-2" />
            Agendamentos
          </TabsTrigger>
          <TabsTrigger value="orders">
            <ShoppingBag className="w-4 h-4 mr-2" />
            Pedidos
          </TabsTrigger>
          <TabsTrigger value="customers">
            <Users className="w-4 h-4 mr-2" />
            Clientes
          </TabsTrigger>
          <TabsTrigger value="conversations">
            <MessageSquare className="w-4 h-4 mr-2" />
            Conversas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="services">
          <AgentServicesPanel agentId={agentId} />
        </TabsContent>

        <TabsContent value="products">
          <AgentProductsPanel agentId={agentId} />
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

        <TabsContent value="conversations">
          <AgentConversationsPanel agentId={agentId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}