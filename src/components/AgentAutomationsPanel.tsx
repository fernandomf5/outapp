import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Plus, Zap, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface AgentAutomationsPanelProps {
  agentId: string;
}

interface AutoMessage {
  id: string;
  trigger_type: string;
  message_content: string;
  delay_hours: number | null;
  is_active: boolean;
  created_at: string;
}

const triggerTypes = [
  { value: "welcome", label: "Boas-vindas" },
  { value: "no_response", label: "Sem resposta" },
  { value: "order_confirmation", label: "Confirmação de pedido" },
  { value: "appointment_reminder", label: "Lembrete de agendamento" },
  { value: "follow_up", label: "Follow-up" },
  { value: "abandoned_cart", label: "Carrinho abandonado" }
];

export default function AgentAutomationsPanel({ agentId }: AgentAutomationsPanelProps) {
  const [autoMessages, setAutoMessages] = useState<AutoMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  const [newAutoMessage, setNewAutoMessage] = useState({
    trigger_type: "welcome",
    message_content: "",
    delay_hours: 0,
    is_active: true
  });

  useEffect(() => {
    fetchAutoMessages();
  }, [agentId]);

  const fetchAutoMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('agent_auto_messages')
        .select('*')
        .eq('agent_id', agentId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAutoMessages(data || []);
    } catch (error) {
      console.error('Error fetching auto messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAutoMessage = async () => {
    try {
      const { error } = await supabase
        .from('agent_auto_messages')
        .insert([{ ...newAutoMessage, agent_id: agentId }]);

      if (error) throw error;

      toast.success('Automação criada com sucesso!');
      setDialogOpen(false);
      fetchAutoMessages();
      setNewAutoMessage({
        trigger_type: "welcome",
        message_content: "",
        delay_hours: 0,
        is_active: true
      });
    } catch (error) {
      console.error('Error creating auto message:', error);
      toast.error('Erro ao criar automação');
    }
  };

  const toggleAutoMessage = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('agent_auto_messages')
        .update({ is_active: !isActive })
        .eq('id', id);

      if (error) throw error;
      fetchAutoMessages();
      toast.success('Status atualizado!');
    } catch (error) {
      console.error('Error toggling auto message:', error);
      toast.error('Erro ao atualizar status');
    }
  };

  const deleteAutoMessage = async (id: string) => {
    try {
      const { error } = await supabase
        .from('agent_auto_messages')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchAutoMessages();
      toast.success('Automação removida!');
    } catch (error) {
      console.error('Error deleting auto message:', error);
      toast.error('Erro ao remover automação');
    }
  };

  const getTriggerLabel = (triggerType: string) => {
    return triggerTypes.find(t => t.value === triggerType)?.label || triggerType;
  };

  if (loading) {
    return <div className="p-8 text-center">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Mensagens Automáticas
          </CardTitle>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Nova Automação
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Criar Mensagem Automática</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Tipo de Gatilho</Label>
                  <select
                    className="w-full mt-1 p-2 border rounded"
                    value={newAutoMessage.trigger_type}
                    onChange={(e) => setNewAutoMessage({...newAutoMessage, trigger_type: e.target.value})}
                  >
                    {triggerTypes.map((trigger) => (
                      <option key={trigger.value} value={trigger.value}>
                        {trigger.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Mensagem</Label>
                  <Textarea
                    value={newAutoMessage.message_content}
                    onChange={(e) => setNewAutoMessage({...newAutoMessage, message_content: e.target.value})}
                    placeholder="Digite a mensagem automática..."
                    rows={5}
                  />
                </div>
                <div>
                  <Label>Atraso (em horas)</Label>
                  <Input
                    type="number"
                    value={newAutoMessage.delay_hours}
                    onChange={(e) => setNewAutoMessage({...newAutoMessage, delay_hours: Number(e.target.value)})}
                    min={0}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Tempo de espera antes de enviar a mensagem (0 = imediato)
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={newAutoMessage.is_active}
                    onCheckedChange={(checked) => setNewAutoMessage({...newAutoMessage, is_active: checked})}
                  />
                  <Label>Ativar imediatamente</Label>
                </div>
                <Button onClick={handleCreateAutoMessage} className="w-full">
                  Criar Automação
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {autoMessages.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhuma automação configurada
              </div>
            ) : (
              autoMessages.map((autoMsg) => (
                <Card key={autoMsg.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge>{getTriggerLabel(autoMsg.trigger_type)}</Badge>
                          <Badge className={autoMsg.is_active ? "bg-green-500" : "bg-gray-500"}>
                            {autoMsg.is_active ? "Ativo" : "Inativo"}
                          </Badge>
                          {autoMsg.delay_hours !== null && autoMsg.delay_hours > 0 && (
                            <Badge variant="outline">
                              Atraso: {autoMsg.delay_hours}h
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {autoMsg.message_content}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <Switch
                          checked={autoMsg.is_active}
                          onCheckedChange={() => toggleAutoMessage(autoMsg.id, autoMsg.is_active)}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteAutoMessage(autoMsg.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
