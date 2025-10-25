import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, ShoppingBag, MessageSquare, Users, TrendingUp, Package } from "lucide-react";
import AgentAppointmentsPanel from "./AgentAppointmentsPanel";
import AgentOrdersPanel from "./AgentOrdersPanel";
import AgentAnalyticsPanel from "./AgentAnalyticsPanel";
import AgentCustomersPanel from "./AgentCustomersPanel";
import AgentConversationsPanel from "./AgentConversationsPanel";
import AgentProductsPanel from "./AgentProductsPanel";

interface AgentManagementPanelProps {
  agentId: string;
  agentName: string;
}

export default function AgentManagementPanel({ agentId, agentName }: AgentManagementPanelProps) {
  const [activeTab, setActiveTab] = useState("analytics");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-2">Gestão: {agentName}</h2>
        <p className="text-muted-foreground">
          Gerencie todos os aspectos do seu agente IA
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="analytics">
            <TrendingUp className="w-4 h-4 mr-2" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="customers">
            <Users className="w-4 h-4 mr-2" />
            Clientes
          </TabsTrigger>
          <TabsTrigger value="conversations">
            <MessageSquare className="w-4 h-4 mr-2" />
            Conversas
          </TabsTrigger>
          <TabsTrigger value="appointments">
            <Calendar className="w-4 h-4 mr-2" />
            Agendamentos
          </TabsTrigger>
          <TabsTrigger value="orders">
            <ShoppingBag className="w-4 h-4 mr-2" />
            Pedidos
          </TabsTrigger>
          <TabsTrigger value="products">
            <Package className="w-4 h-4 mr-2" />
            Produtos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="analytics">
          <AgentAnalyticsPanel agentId={agentId} />
        </TabsContent>

        <TabsContent value="customers">
          <AgentCustomersPanel agentId={agentId} />
        </TabsContent>

        <TabsContent value="conversations">
          <AgentConversationsPanel agentId={agentId} />
        </TabsContent>

        <TabsContent value="appointments">
          <AgentAppointmentsPanel agentId={agentId} />
        </TabsContent>

        <TabsContent value="orders">
          <AgentOrdersPanel agentId={agentId} />
        </TabsContent>

        <TabsContent value="products">
          <AgentProductsPanel agentId={agentId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}