import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Link2, 
  Unlink,
  Bot,
  Smartphone,
  ArrowRight,
  Check,
  Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface WhatsAppInstance {
  id: string;
  instance_name: string;
  phone_number: string | null;
  status: string;
  agent_id: string | null;
}

interface AIAgent {
  id: string;
  name: string;
  attendant_name: string | null;
  niche: string;
}

interface AgentWhatsAppLinkerProps {
  instances: WhatsAppInstance[];
  agents: AIAgent[];
  onRefresh: () => void;
}

export function AgentWhatsAppLinker({ instances, agents, onRefresh }: AgentWhatsAppLinkerProps) {
  const { toast } = useToast();
  const [isLinking, setIsLinking] = useState<string | null>(null);

  const handleLinkAgent = async (instanceId: string, agentId: string | null) => {
    setIsLinking(instanceId);
    try {
      const { error } = await supabase
        .from('whatsapp_instances')
        .update({ agent_id: agentId })
        .eq('id', instanceId);

      if (error) throw error;

      toast({
        title: agentId ? "Agente Vinculado! 🔗" : "Agente Desvinculado",
        description: agentId 
          ? "O agente agora responderá neste WhatsApp."
          : "O WhatsApp não tem mais agente vinculado.",
      });

      onRefresh();
    } catch (error) {
      console.error('Error linking agent:', error);
      toast({
        title: "Erro",
        description: "Não foi possível vincular o agente.",
        variant: "destructive",
      });
    } finally {
      setIsLinking(null);
    }
  };

  const getLinkedAgent = (agentId: string | null) => {
    if (!agentId) return null;
    return agents.find(a => a.id === agentId);
  };

  if (instances.length === 0 || agents.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Link2 className="w-12 h-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Vincular Agente ao WhatsApp</h3>
          <p className="text-muted-foreground text-center mb-4 max-w-md">
            {instances.length === 0 && agents.length === 0 
              ? "Crie um WhatsApp e um Agente IA primeiro para poder vincular."
              : instances.length === 0 
                ? "Adicione um WhatsApp primeiro."
                : "Crie um Agente IA primeiro."
            }
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Link2 className="w-5 h-5 text-primary" />
          Vincular Agentes aos WhatsApp
        </h3>
        <p className="text-sm text-muted-foreground">
          Escolha qual agente IA vai responder em cada WhatsApp
        </p>
      </div>

      <div className="space-y-4">
        {instances.map((instance) => {
          const linkedAgent = getLinkedAgent(instance.agent_id);
          
          return (
            <Card key={instance.id} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="flex flex-col md:flex-row md:items-center">
                  {/* WhatsApp Side */}
                  <div className="flex-1 p-4 border-b md:border-b-0 md:border-r">
                    <div className="flex items-center gap-3">
                      <div className={`p-3 rounded-full ${
                        instance.status === 'connected' ? 'bg-green-500/20' : 'bg-muted'
                      }`}>
                        <Smartphone className={`w-5 h-5 ${
                          instance.status === 'connected' ? 'text-green-500' : 'text-muted-foreground'
                        }`} />
                      </div>
                      <div>
                        <h4 className="font-medium">{instance.instance_name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {instance.phone_number || 'Não conectado'}
                        </p>
                        <Badge 
                          variant="outline" 
                          className={instance.status === 'connected' ? 'text-green-500 border-green-500/30' : ''}
                        >
                          {instance.status === 'connected' ? 'Conectado' : 
                           instance.status === 'demo' ? 'Demo' : 'Desconectado'}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Arrow */}
                  <div className="hidden md:flex items-center justify-center px-4">
                    <ArrowRight className="w-5 h-5 text-muted-foreground" />
                  </div>

                  {/* Agent Selector */}
                  <div className="flex-1 p-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-3 rounded-full ${linkedAgent ? 'bg-primary/20' : 'bg-muted'}`}>
                        <Bot className={`w-5 h-5 ${linkedAgent ? 'text-primary' : 'text-muted-foreground'}`} />
                      </div>
                      
                      <div className="flex-1">
                        <Select 
                          value={instance.agent_id || 'none'} 
                          onValueChange={(value) => handleLinkAgent(instance.id, value === 'none' ? null : value)}
                          disabled={isLinking === instance.id}
                        >
                          <SelectTrigger className="w-full">
                            {isLinking === instance.id ? (
                              <div className="flex items-center gap-2">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>Salvando...</span>
                              </div>
                            ) : (
                              <SelectValue placeholder="Selecione um agente" />
                            )}
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">
                              <div className="flex items-center gap-2">
                                <Unlink className="w-4 h-4" />
                                Sem agente (manual)
                              </div>
                            </SelectItem>
                            {agents.map((agent) => (
                              <SelectItem key={agent.id} value={agent.id}>
                                <div className="flex items-center gap-2">
                                  <Bot className="w-4 h-4" />
                                  {agent.name}
                                  <span className="text-muted-foreground">
                                    ({agent.attendant_name || 'Assistente'})
                                  </span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        
                        {linkedAgent && (
                          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                            <Check className="w-3 h-3 text-green-500" />
                            {linkedAgent.attendant_name || linkedAgent.name} responderá automaticamente
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Info */}
      <Card className="bg-muted/50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Bot className="w-5 h-5 text-primary mt-0.5" />
            <div>
              <p className="font-medium text-sm">Como funciona?</p>
              <ul className="text-xs text-muted-foreground space-y-1 mt-1">
                <li>• Quando um cliente envia mensagem, o agente responde automaticamente</li>
                <li>• O agente usa o treinamento (FAQs, documentos) para responder</li>
                <li>• Você pode desativar o agente a qualquer momento</li>
                <li>• Sem agente vinculado, as mensagens ficam sem resposta automática</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
