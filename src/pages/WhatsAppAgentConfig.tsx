import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft, Bot, MessageSquare, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { WhatsAppAgentPanel } from '@/components/WhatsAppAgentPanel';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface Agent {
  id: string;
  name: string;
  description?: string;
  is_active: boolean;
}

export default function WhatsAppAgentConfig() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(searchParams.get('agentId'));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAgents = async () => {
      if (!user?.id) return;

      try {
        const { data, error } = await supabase
          .from('ai_agents')
          .select('id, name, description, is_active')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .order('name');

        if (error) throw error;
        setAgents(data || []);

        // If no agent selected but agents exist, select first one
        if (!selectedAgentId && data && data.length > 0) {
          setSelectedAgentId(data[0].id);
        }
      } catch (error) {
        console.error('Error fetching agents:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAgents();
  }, [user?.id, selectedAgentId]);

  const selectedAgent = agents.find(a => a.id === selectedAgentId);

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
        <title>WhatsApp IA - Configuração</title>
      </Helmet>

      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-green-500" />
                  WhatsApp IA
                </h1>
                <p className="text-sm text-muted-foreground">
                  Configure agentes inteligentes para WhatsApp
                </p>
              </div>
            </div>

            {agents.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Agente:</span>
                <Select value={selectedAgentId || ''} onValueChange={setSelectedAgentId}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Selecione um agente" />
                  </SelectTrigger>
                  <SelectContent>
                    {agents.map((agent) => (
                      <SelectItem key={agent.id} value={agent.id}>
                        <div className="flex items-center gap-2">
                          <Bot className="w-4 h-4" />
                          {agent.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {agents.length === 0 ? (
          <Card className="max-w-lg mx-auto">
            <CardHeader className="text-center">
              <Bot className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
              <CardTitle>Nenhum Agente Encontrado</CardTitle>
              <CardDescription>
                Você precisa criar um Chat Online primeiro para usar o WhatsApp IA.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <Button onClick={() => navigate('/ai-agent')}>
                <Bot className="w-4 h-4 mr-2" />
                Criar Chat Online
              </Button>
            </CardContent>
          </Card>
        ) : selectedAgent ? (
          <WhatsAppAgentPanel 
            agentId={selectedAgent.id} 
            agentName={selectedAgent.name}
          />
        ) : (
          <Card className="max-w-lg mx-auto">
            <CardHeader className="text-center">
              <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
              <CardTitle>Selecione um Agente</CardTitle>
              <CardDescription>
                Escolha um agente no menu acima para configurar o WhatsApp IA.
              </CardDescription>
            </CardHeader>
          </Card>
        )}
      </main>
    </div>
  );
}
