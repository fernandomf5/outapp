import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { 
  Plus, 
  Trash2, 
  Bot, 
  Brain,
  Loader2, 
  Edit,
  Send,
  User,
  MessageSquare,
  BookOpen,
  HelpCircle,
  FileText,
  Link as LinkIcon,
  Play
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface AIAgent {
  id: string;
  name: string;
  description: string | null;
  niche: string;
  attendant_name: string | null;
  config: {
    personality?: string;
    tone?: string;
    language?: string;
    voiceId?: string;
    voiceName?: string;
  };
  is_active: boolean;
}

interface KnowledgeBase {
  id: string;
  agent_id: string;
  title: string;
  content: string;
  content_type: 'text' | 'faq' | 'document' | 'url';
  is_active: boolean;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface AIAgentCreatorProps {
  agents: AIAgent[];
  selectedAgent: AIAgent | null;
  onSelectAgent: (agent: AIAgent | null) => void;
  onRefresh: () => void;
}

export function AIAgentCreator({ 
  agents, 
  selectedAgent, 
  onSelectAgent, 
  onRefresh 
}: AIAgentCreatorProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [activeTab, setActiveTab] = useState('training');
  
  // New agent form
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newNiche, setNewNiche] = useState('atendimento');
  const [newAttendantName, setNewAttendantName] = useState('');
  const [newPersonality, setNewPersonality] = useState('');
  const [newTone, setNewTone] = useState('amigável');
  
  // Knowledge base
  const [knowledgeBase, setKnowledgeBase] = useState<KnowledgeBase[]>([]);
  const [showKnowledgeDialog, setShowKnowledgeDialog] = useState(false);
  const [editingKnowledge, setEditingKnowledge] = useState<KnowledgeBase | null>(null);
  const [knowledgeTitle, setKnowledgeTitle] = useState('');
  const [knowledgeContent, setKnowledgeContent] = useState('');
  const [knowledgeType, setKnowledgeType] = useState<'text' | 'faq' | 'document' | 'url'>('text');
  
  // Test chat
  const [testMessages, setTestMessages] = useState<ChatMessage[]>([]);
  const [testInput, setTestInput] = useState('');
  const [isTestLoading, setIsTestLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Load knowledge base when agent changes
  useEffect(() => {
    if (selectedAgent) {
      loadKnowledgeBase();
    }
  }, [selectedAgent]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [testMessages]);

  const loadKnowledgeBase = async () => {
    if (!selectedAgent) return;
    
    const { data, error } = await supabase
      .from('agent_knowledge_base')
      .select('*')
      .eq('agent_id', selectedAgent.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setKnowledgeBase(data as KnowledgeBase[]);
    }
  };

  const handleCreateAgent = async () => {
    if (!user?.id || !newName.trim()) return;
    
    setIsCreating(true);
    try {
      const { data, error } = await supabase
        .from('ai_agents')
        .insert({
          user_id: user.id,
          name: newName.trim(),
          description: newDescription.trim() || null,
          niche: newNiche,
          attendant_name: newAttendantName.trim() || newName.trim(),
          config: {
            personality: newPersonality || 'Profissional e prestativo',
            tone: newTone,
            language: 'pt-BR',
          },
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Agente Criado! 🤖",
        description: "Agora adicione conhecimentos para treinar seu agente.",
      });

      // Reset form
      setNewName('');
      setNewDescription('');
      setNewNiche('atendimento');
      setNewAttendantName('');
      setNewPersonality('');
      setNewTone('amigável');
      setShowNewDialog(false);
      
      onRefresh();
      onSelectAgent(data as AIAgent);
    } catch (error) {
      console.error('Error creating agent:', error);
      toast({
        title: "Erro",
        description: "Não foi possível criar o agente.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleSaveKnowledge = async () => {
    if (!selectedAgent || !knowledgeTitle.trim() || !knowledgeContent.trim()) return;

    try {
      if (editingKnowledge) {
        const { error } = await supabase
          .from('agent_knowledge_base')
          .update({
            title: knowledgeTitle,
            content: knowledgeContent,
            content_type: knowledgeType,
          })
          .eq('id', editingKnowledge.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('agent_knowledge_base')
          .insert({
            agent_id: selectedAgent.id,
            title: knowledgeTitle,
            content: knowledgeContent,
            content_type: knowledgeType,
          });

        if (error) throw error;
      }

      toast({
        title: editingKnowledge ? "Atualizado! ✓" : "Adicionado! 📚",
        description: "Conhecimento salvo com sucesso.",
      });

      setKnowledgeTitle('');
      setKnowledgeContent('');
      setKnowledgeType('text');
      setEditingKnowledge(null);
      setShowKnowledgeDialog(false);
      loadKnowledgeBase();
    } catch (error) {
      console.error('Error saving knowledge:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteKnowledge = async (id: string) => {
    const { error } = await supabase
      .from('agent_knowledge_base')
      .delete()
      .eq('id', id);

    if (!error) {
      loadKnowledgeBase();
      toast({ title: "Removido", description: "Conhecimento removido." });
    }
  };

  const handleDeleteAgent = async (agent: AIAgent) => {
    const { error } = await supabase
      .from('ai_agents')
      .delete()
      .eq('id', agent.id);

    if (!error) {
      toast({ title: "Removido", description: "Agente removido." });
      onSelectAgent(null);
      onRefresh();
    }
  };

  const handleTestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAgent || !testInput.trim() || isTestLoading) return;

    const userMessage = testInput.trim();
    setTestInput('');
    setTestMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsTestLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('whatsapp-ai-agent', {
        body: {
          action: 'test_chat',
          agentId: selectedAgent.id,
          message: userMessage,
          conversationHistory: testMessages,
        }
      });

      if (error) throw error;

      if (data.response) {
        setTestMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
      }
    } catch (error) {
      console.error('Test chat error:', error);
      toast({
        title: "Erro",
        description: "Não foi possível testar o agente.",
        variant: "destructive",
      });
    } finally {
      setIsTestLoading(false);
    }
  };

  const getKnowledgeTypeIcon = (type: string) => {
    switch (type) {
      case 'faq': return <HelpCircle className="w-4 h-4" />;
      case 'document': return <FileText className="w-4 h-4" />;
      case 'url': return <LinkIcon className="w-4 h-4" />;
      default: return <BookOpen className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Seus Agentes IA</h3>
          <p className="text-sm text-muted-foreground">
            Crie e treine agentes inteligentes
          </p>
        </div>
        
        <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" /> Criar Agente
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-primary" />
                Criar Novo Agente IA
              </DialogTitle>
              <DialogDescription>
                Configure as características do seu agente
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              <div>
                <Label>Nome do Agente *</Label>
                <Input
                  placeholder="Ex: Assistente de Vendas"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
              </div>
              
              <div>
                <Label>Nome do Atendente (como ele se apresenta)</Label>
                <Input
                  placeholder="Ex: Ana, Carlos, Assistente..."
                  value={newAttendantName}
                  onChange={(e) => setNewAttendantName(e.target.value)}
                />
              </div>
              
              <div>
                <Label>Nicho/Área</Label>
                <Select value={newNiche} onValueChange={setNewNiche}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="atendimento">Atendimento ao Cliente</SelectItem>
                    <SelectItem value="vendas">Vendas</SelectItem>
                    <SelectItem value="suporte">Suporte Técnico</SelectItem>
                    <SelectItem value="agendamento">Agendamentos</SelectItem>
                    <SelectItem value="restaurante">Restaurante/Delivery</SelectItem>
                    <SelectItem value="imobiliaria">Imobiliária</SelectItem>
                    <SelectItem value="saude">Saúde/Clínica</SelectItem>
                    <SelectItem value="educacao">Educação</SelectItem>
                    <SelectItem value="ecommerce">E-commerce</SelectItem>
                    <SelectItem value="outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Tom de Voz</Label>
                <Select value={newTone} onValueChange={setNewTone}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="amigável">Amigável e Casual</SelectItem>
                    <SelectItem value="profissional">Profissional</SelectItem>
                    <SelectItem value="formal">Formal</SelectItem>
                    <SelectItem value="divertido">Divertido</SelectItem>
                    <SelectItem value="tecnico">Técnico</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Personalidade (opcional)</Label>
                <Textarea
                  placeholder="Descreva como o agente deve se comportar..."
                  value={newPersonality}
                  onChange={(e) => setNewPersonality(e.target.value)}
                  rows={3}
                />
              </div>
              
              <div>
                <Label>Descrição (opcional)</Label>
                <Textarea
                  placeholder="Descreva o propósito deste agente..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  rows={2}
                />
              </div>
              
              <Button 
                onClick={handleCreateAgent} 
                disabled={isCreating || !newName.trim()}
                className="w-full"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Criando...
                  </>
                ) : (
                  <>
                    <Bot className="w-4 h-4 mr-2" />
                    Criar Agente
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Agents List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {agents.map((agent) => (
          <Card 
            key={agent.id} 
            className={`cursor-pointer transition-all hover:border-primary/50 ${
              selectedAgent?.id === agent.id ? 'border-primary bg-primary/5' : ''
            }`}
            onClick={() => {
              onSelectAgent(agent);
              setTestMessages([]);
            }}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-primary/20">
                    <Bot className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium">{agent.name}</h4>
                    <p className="text-xs text-muted-foreground">
                      {agent.attendant_name || 'Assistente'} • {agent.niche}
                    </p>
                  </div>
                </div>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Remover Agente?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Isso irá remover "{agent.name}" e todo seu treinamento.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={() => handleDeleteAgent(agent)}
                        className="bg-destructive"
                      >
                        Remover
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {agents.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Bot className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhum agente criado</h3>
            <p className="text-muted-foreground text-center mb-4">
              Crie seu primeiro agente IA para treinar e usar no WhatsApp
            </p>
            <Button onClick={() => setShowNewDialog(true)}>
              <Plus className="w-4 h-4 mr-2" /> Criar Primeiro Agente
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Selected Agent Panel */}
      {selectedAgent && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-primary" />
              {selectedAgent.name}
            </CardTitle>
            <CardDescription>
              Treine e teste seu agente IA
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="w-full grid grid-cols-2">
                <TabsTrigger value="training" className="gap-2">
                  <Brain className="w-4 h-4" /> Treinamento
                </TabsTrigger>
                <TabsTrigger value="test" className="gap-2">
                  <Play className="w-4 h-4" /> Testar
                </TabsTrigger>
              </TabsList>
              
              {/* Training Tab */}
              <TabsContent value="training" className="space-y-4 mt-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-medium">Base de Conhecimento</h4>
                    <p className="text-sm text-muted-foreground">
                      Adicione informações para o agente aprender
                    </p>
                  </div>
                  
                  <Dialog open={showKnowledgeDialog} onOpenChange={(open) => {
                    setShowKnowledgeDialog(open);
                    if (!open) {
                      setEditingKnowledge(null);
                      setKnowledgeTitle('');
                      setKnowledgeContent('');
                      setKnowledgeType('text');
                    }
                  }}>
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <Plus className="w-4 h-4 mr-1" /> Adicionar
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>
                          {editingKnowledge ? 'Editar Conhecimento' : 'Adicionar Conhecimento'}
                        </DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label>Tipo</Label>
                          <Select value={knowledgeType} onValueChange={(v: any) => setKnowledgeType(v)}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="text">Texto/Informação</SelectItem>
                              <SelectItem value="faq">Pergunta e Resposta (FAQ)</SelectItem>
                              <SelectItem value="document">Documento</SelectItem>
                              <SelectItem value="url">URL/Link</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>{knowledgeType === 'faq' ? 'Pergunta' : 'Título'}</Label>
                          <Input
                            placeholder={knowledgeType === 'faq' ? 'Ex: Qual o horário de funcionamento?' : 'Ex: Horários de Atendimento'}
                            value={knowledgeTitle}
                            onChange={(e) => setKnowledgeTitle(e.target.value)}
                          />
                        </div>
                        <div>
                          <Label>{knowledgeType === 'faq' ? 'Resposta' : 'Conteúdo'}</Label>
                          <Textarea
                            placeholder={knowledgeType === 'faq' ? 'Ex: Nosso horário é de segunda a sexta, das 9h às 18h.' : 'Descreva as informações...'}
                            value={knowledgeContent}
                            onChange={(e) => setKnowledgeContent(e.target.value)}
                            rows={5}
                          />
                        </div>
                        <Button onClick={handleSaveKnowledge} className="w-full">
                          Salvar
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                {knowledgeBase.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>Nenhum conhecimento adicionado ainda</p>
                    <p className="text-sm">Adicione FAQs, informações e documentos</p>
                  </div>
                ) : (
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-2">
                      {knowledgeBase.map((kb) => (
                        <Card key={kb.id} className="p-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3">
                              <div className="p-1.5 rounded bg-muted">
                                {getKnowledgeTypeIcon(kb.content_type)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm">{kb.title}</p>
                                <p className="text-xs text-muted-foreground line-clamp-2">
                                  {kb.content}
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-1">
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => {
                                  setEditingKnowledge(kb);
                                  setKnowledgeTitle(kb.title);
                                  setKnowledgeContent(kb.content);
                                  setKnowledgeType(kb.content_type);
                                  setShowKnowledgeDialog(true);
                                }}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => handleDeleteKnowledge(kb.id)}
                              >
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </TabsContent>
              
              {/* Test Tab */}
              <TabsContent value="test" className="mt-4">
                <div className="border rounded-lg bg-muted/30 h-[400px] flex flex-col">
                  <ScrollArea className="flex-1 p-4">
                    {testMessages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                        <MessageSquare className="w-12 h-12 mb-4 opacity-50" />
                        <p className="font-medium">Teste seu agente</p>
                        <p className="text-sm">Envie uma mensagem para ver como ele responde</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {testMessages.map((msg, idx) => (
                          <div
                            key={idx}
                            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                                msg.role === 'user'
                                  ? 'bg-primary text-primary-foreground rounded-br-md'
                                  : 'bg-card border rounded-bl-md'
                              }`}
                            >
                              <div className="flex items-center gap-2 mb-1">
                                {msg.role === 'assistant' ? (
                                  <Bot className="w-4 h-4" />
                                ) : (
                                  <User className="w-4 h-4" />
                                )}
                                <span className="text-xs font-medium">
                                  {msg.role === 'user' ? 'Você' : selectedAgent.attendant_name || selectedAgent.name}
                                </span>
                              </div>
                              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                            </div>
                          </div>
                        ))}
                        {isTestLoading && (
                          <div className="flex justify-start">
                            <div className="bg-card border rounded-2xl rounded-bl-md px-4 py-2">
                              <div className="flex items-center gap-2">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span className="text-sm text-muted-foreground">Digitando...</span>
                              </div>
                            </div>
                          </div>
                        )}
                        <div ref={chatEndRef} />
                      </div>
                    )}
                  </ScrollArea>

                  <form onSubmit={handleTestSubmit} className="p-3 border-t bg-card">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Digite uma mensagem para testar..."
                        value={testInput}
                        onChange={(e) => setTestInput(e.target.value)}
                        disabled={isTestLoading}
                        className="flex-1"
                      />
                      <Button type="submit" disabled={isTestLoading || !testInput.trim()}>
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </form>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
