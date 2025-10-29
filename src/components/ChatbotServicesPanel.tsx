import { Card } from "@/components/ui/card";

interface ChatbotServicesPanelProps {
  chatbotId: string;
}

export const ChatbotServicesPanel = ({ chatbotId }: ChatbotServicesPanelProps) => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold">Serviços</h3>
        <p className="text-muted-foreground">Gerencie os serviços do seu chatbot</p>
      </div>

      <Card className="p-12 text-center">
        <p className="text-muted-foreground">Painel de serviços em desenvolvimento</p>
      </Card>
    </div>
  );
};