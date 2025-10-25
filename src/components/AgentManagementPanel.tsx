import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, ShoppingBag, MessageSquare, Users, TrendingUp, Package, DollarSign, Clock, Zap, Star, Bell, FileText } from "lucide-react";
import AgentAppointmentsPanel from "./AgentAppointmentsPanel";
import AgentOrdersPanel from "./AgentOrdersPanel";
import AgentAnalyticsPanel from "./AgentAnalyticsPanel";
import AgentCustomersPanel from "./AgentCustomersPanel";
import AgentConversationsPanel from "./AgentConversationsPanel";
import AgentProductsPanel from "./AgentProductsPanel";
import AgentFinancialPanel from "./AgentFinancialPanel";
import AgentSchedulePanel from "./AgentSchedulePanel";
import AgentAutomationsPanel from "./AgentAutomationsPanel";
import AgentReviewsPanel from "./AgentReviewsPanel";
import AgentNotificationsPanel from "./AgentNotificationsPanel";
import AgentReportsPanel from "./AgentReportsPanel";

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
        <TabsList className="grid w-full grid-cols-6 lg:grid-cols-12 gap-1">
          <TabsTrigger value="analytics">
            <TrendingUp className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Analytics</span>
          </TabsTrigger>
          <TabsTrigger value="customers">
            <Users className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Clientes</span>
          </TabsTrigger>
          <TabsTrigger value="conversations">
            <MessageSquare className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Conversas</span>
          </TabsTrigger>
          <TabsTrigger value="appointments">
            <Calendar className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Agendamentos</span>
          </TabsTrigger>
          <TabsTrigger value="orders">
            <ShoppingBag className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Pedidos</span>
          </TabsTrigger>
          <TabsTrigger value="products">
            <Package className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Produtos</span>
          </TabsTrigger>
          <TabsTrigger value="financial">
            <DollarSign className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Financeiro</span>
          </TabsTrigger>
          <TabsTrigger value="schedule">
            <Clock className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Horários</span>
          </TabsTrigger>
          <TabsTrigger value="automations">
            <Zap className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Automações</span>
          </TabsTrigger>
          <TabsTrigger value="reviews">
            <Star className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Avaliações</span>
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Notificações</span>
          </TabsTrigger>
          <TabsTrigger value="reports">
            <FileText className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Relatórios</span>
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

        <TabsContent value="financial">
          <AgentFinancialPanel agentId={agentId} />
        </TabsContent>

        <TabsContent value="schedule">
          <AgentSchedulePanel agentId={agentId} />
        </TabsContent>

        <TabsContent value="automations">
          <AgentAutomationsPanel agentId={agentId} />
        </TabsContent>

        <TabsContent value="reviews">
          <AgentReviewsPanel agentId={agentId} />
        </TabsContent>

        <TabsContent value="notifications">
          <AgentNotificationsPanel agentId={agentId} />
        </TabsContent>

        <TabsContent value="reports">
          <AgentReportsPanel agentId={agentId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}