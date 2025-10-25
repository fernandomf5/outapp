import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Zap, Plus } from "lucide-react";

export const ChatbotAutomationsPanel = ({ chatbotId }: { chatbotId: string }) => {
  const [automations, setAutomations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAutomations();
  }, [chatbotId]);

  const loadAutomations = async () => {
    try {
      const { data, error } = await supabase
        .from('chatbot_automations')
        .select('*')
        .eq('chatbot_id', chatbotId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAutomations(data || []);
      setLoading(false);
    } catch (error) {
      console.error('Error loading automations:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center p-12">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Mensagens Automáticas
        </h3>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Nova Automação
        </Button>
      </div>
      <div className="grid gap-4">
        {automations.map((automation) => (
          <Card key={automation.id} className="p-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">{automation.trigger_type}</h4>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  automation.is_active ? 'bg-success/10 text-success' : 'bg-muted'
                }`}>
                  {automation.is_active ? 'Ativo' : 'Inativo'}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">{automation.message}</p>
              <p className="text-xs text-muted-foreground">
                Atraso: {automation.delay_minutes} minutos
              </p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};