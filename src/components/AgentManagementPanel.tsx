import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, ShoppingBag, MessageSquare, Users } from "lucide-react";
import AgentAppointmentsPanel from "./AgentAppointmentsPanel";
import AgentOrdersPanel from "./AgentOrdersPanel";

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
          Gerencie agendamentos e pedidos dos seus clientes
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="appointments">
            <Calendar className="w-4 h-4 mr-2" />
            Agendamentos
          </TabsTrigger>
          <TabsTrigger value="orders">
            <ShoppingBag className="w-4 h-4 mr-2" />
            Pedidos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="appointments">
          <AgentAppointmentsPanel agentId={agentId} />
        </TabsContent>

        <TabsContent value="orders">
          <AgentOrdersPanel agentId={agentId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}