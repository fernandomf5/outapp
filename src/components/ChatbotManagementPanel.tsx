import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
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

interface ChatbotManagementPanelProps {
  chatbot: { id: string; name: string };
}

export const ChatbotManagementPanel = ({ chatbot }: ChatbotManagementPanelProps) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-2">Gestão do Chatbot: {chatbot.name}</h2>
        <p className="text-muted-foreground">
          Gerencie todos os aspectos do seu chatbot de forma centralizada
        </p>
      </div>

      <Tabs defaultValue="analytics" className="space-y-6">
        <TabsList className="grid w-full grid-cols-12 h-auto gap-2">
          <TabsTrigger value="analytics" className="text-xs">Analytics</TabsTrigger>
          <TabsTrigger value="customers" className="text-xs">Clientes</TabsTrigger>
          <TabsTrigger value="conversations" className="text-xs">Conversas</TabsTrigger>
          <TabsTrigger value="products" className="text-xs">Produtos</TabsTrigger>
          <TabsTrigger value="appointments" className="text-xs">Agendamentos</TabsTrigger>
          <TabsTrigger value="orders" className="text-xs">Pedidos</TabsTrigger>
          <TabsTrigger value="financial" className="text-xs">Financeiro</TabsTrigger>
          <TabsTrigger value="schedule" className="text-xs">Horários</TabsTrigger>
          <TabsTrigger value="automations" className="text-xs">Automações</TabsTrigger>
          <TabsTrigger value="reviews" className="text-xs">Avaliações</TabsTrigger>
          <TabsTrigger value="notifications" className="text-xs">Notificações</TabsTrigger>
          <TabsTrigger value="reports" className="text-xs">Relatórios</TabsTrigger>
        </TabsList>

        <TabsContent value="analytics">
          <ChatbotAnalyticsPanel chatbotId={chatbot.id} />
        </TabsContent>

        <TabsContent value="customers">
          <ChatbotCustomersPanel chatbotId={chatbot.id} />
        </TabsContent>

        <TabsContent value="conversations">
          <ChatbotConversationsPanel chatbotId={chatbot.id} />
        </TabsContent>

        <TabsContent value="products">
          <ChatbotProductsPanel chatbotId={chatbot.id} />
        </TabsContent>

        <TabsContent value="appointments">
          <ChatbotAppointmentsPanel chatbotId={chatbot.id} />
        </TabsContent>

        <TabsContent value="orders">
          <ChatbotOrdersPanel chatbotId={chatbot.id} />
        </TabsContent>

        <TabsContent value="financial">
          <ChatbotFinancialPanel chatbotId={chatbot.id} />
        </TabsContent>

        <TabsContent value="schedule">
          <ChatbotSchedulePanel chatbotId={chatbot.id} />
        </TabsContent>

        <TabsContent value="automations">
          <ChatbotAutomationsPanel chatbotId={chatbot.id} />
        </TabsContent>

        <TabsContent value="reviews">
          <ChatbotReviewsPanel chatbotId={chatbot.id} />
        </TabsContent>

        <TabsContent value="notifications">
          <ChatbotNotificationsPanel chatbotId={chatbot.id} />
        </TabsContent>

        <TabsContent value="reports">
          <ChatbotReportsPanel chatbotId={chatbot.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
};