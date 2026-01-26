import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, 
  MessageSquare, 
  Loader2,
  Smartphone,
  Bot,
  Volume2,
  Link2
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { WhatsAppInstancesManager } from '@/components/whatsapp-ai/WhatsAppInstancesManager';
import { AIAgentCreator } from '@/components/whatsapp-ai/AIAgentCreator';
import { VoiceSelector } from '@/components/whatsapp-ai/VoiceSelector';
import { AgentWhatsAppLinker } from '@/components/whatsapp-ai/AgentWhatsAppLinker';

interface WhatsAppInstance {
  id: string;
  user_id: string;
  agent_id: string | null;
  instance_name: string;
  instance_key: string | null;
  phone_number: string | null;
  status: 'disconnected' | 'connecting' | 'connected' | 'qr_code' | 'demo';
  qr_code: string | null;
  qr_code_expires_at: string | null;
  webhook_url: string | null;
  created_at: string;
  updated_at: string;
}

interface AIAgent {
  id: string;
  name: string;
  description: string | null;
  niche: string;
  attendant_name: string | null;
  config: any;
  is_active: boolean;
}

export default function WhatsAppAIPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [activeTab, setActiveTab] = useState('whatsapps');
  const [isLoading, setIsLoading] = useState(true);
  
  // Data
  const [instances, setInstances] = useState<WhatsAppInstance[]>([]);
  const [agents, setAgents] = useState<AIAgent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<AIAgent | null>(null);
  
  // Voice settings
  const [selectedVoiceId, setSelectedVoiceId] = useState<string | null>(null);
  const [selectedVoiceName, setSelectedVoiceName] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    try {
      // Load WhatsApp instances
      const { data: instancesData, error: instancesError } = await supabase
        .from('whatsapp_instances')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!instancesError) {
        setInstances((instancesData || []) as WhatsAppInstance[]);
      }

      // Load AI Agents
      const { data: agentsData, error: agentsError } = await supabase
        .from('ai_agents')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (!agentsError) {
        setAgents((agentsData || []) as AIAgent[]);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSelectVoice = (voiceId: string, voiceName: string) => {
    setSelectedVoiceId(voiceId);
    setSelectedVoiceName(voiceName);
    
    // If agent is selected, update its config
    if (selectedAgent) {
      updateAgentVoice(selectedAgent.id, voiceId, voiceName);
    }
  };

  const updateAgentVoice = async (agentId: string, voiceId: string, voiceName: string) => {
    try {
      const agent = agents.find(a => a.id === agentId);
      if (!agent) return;

      const updatedConfig = {
        ...agent.config,
        voiceId,
        voiceName,
      };

      await supabase
        .from('ai_agents')
        .update({ config: updatedConfig })
        .eq('id', agentId);

      loadData();
    } catch (error) {
      console.error('Error updating agent voice:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>WhatsApp AI - Agentes Inteligentes</title>
      </Helmet>

      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-green-500" />
                WhatsApp AI
              </h1>
              <p className="text-sm text-muted-foreground">
                Conecte seu WhatsApp e crie agentes IA inteligentes
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="whatsapps" className="gap-2">
              <Smartphone className="w-4 h-4" />
              <span className="hidden sm:inline">WhatsApps</span>
            </TabsTrigger>
            <TabsTrigger value="agents" className="gap-2">
              <Bot className="w-4 h-4" />
              <span className="hidden sm:inline">Agentes IA</span>
            </TabsTrigger>
            <TabsTrigger value="link" className="gap-2">
              <Link2 className="w-4 h-4" />
              <span className="hidden sm:inline">Vincular</span>
            </TabsTrigger>
            <TabsTrigger value="voice" className="gap-2">
              <Volume2 className="w-4 h-4" />
              <span className="hidden sm:inline">Voz</span>
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: WhatsApp Instances */}
          <TabsContent value="whatsapps">
            <WhatsAppInstancesManager 
              instances={instances}
              onRefresh={loadData}
            />
          </TabsContent>

          {/* Tab 2: AI Agents */}
          <TabsContent value="agents">
            <AIAgentCreator 
              agents={agents}
              selectedAgent={selectedAgent}
              onSelectAgent={(agent) => {
                setSelectedAgent(agent);
                if (agent?.config?.voiceId) {
                  setSelectedVoiceId(agent.config.voiceId);
                  setSelectedVoiceName(agent.config.voiceName || null);
                }
              }}
              onRefresh={loadData}
            />
          </TabsContent>

          {/* Tab 3: Link Agent to WhatsApp */}
          <TabsContent value="link">
            <AgentWhatsAppLinker 
              instances={instances}
              agents={agents}
              onRefresh={loadData}
            />
          </TabsContent>

          {/* Tab 4: Voice Selection */}
          <TabsContent value="voice">
            {selectedAgent ? (
              <div className="space-y-4">
                <Card className="bg-primary/5 border-primary/20">
                  <CardContent className="p-4">
                    <p className="text-sm">
                      Configurando voz para: <strong>{selectedAgent.name}</strong>
                    </p>
                  </CardContent>
                </Card>
                <VoiceSelector 
                  selectedVoiceId={selectedVoiceId}
                  onSelectVoice={handleSelectVoice}
                />
              </div>
            ) : (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Volume2 className="w-12 h-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">Selecione um Agente</h3>
                  <p className="text-muted-foreground text-center mb-4">
                    Primeiro selecione um agente na aba "Agentes IA" para configurar sua voz.
                  </p>
                  <Button variant="outline" onClick={() => setActiveTab('agents')}>
                    <Bot className="w-4 h-4 mr-2" />
                    Ir para Agentes
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
