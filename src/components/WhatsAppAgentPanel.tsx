import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { 
  MessageSquare, 
  QrCode, 
  Wifi, 
  WifiOff, 
  Plus, 
  Trash2, 
  BookOpen, 
  Brain,
  Phone,
  RefreshCw,
  Send,
  Settings,
  Loader2,
  CheckCircle,
  XCircle,
  Edit,
  FileText,
  Link as LinkIcon,
  HelpCircle,
  Play,
  Bot,
  User
} from 'lucide-react';
import { useWhatsAppAgent, WhatsAppInstance, KnowledgeBase } from '@/hooks/useWhatsAppAgent';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface WhatsAppAgentPanelProps {
  agentId: string;
  agentName: string;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export function WhatsAppAgentPanel({ agentId, agentName }: WhatsAppAgentPanelProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const {
    instances,
    knowledgeBase,
    isLoading,
    isCreating,
    qrCode,
    connectionStatus,
    createInstance,
    getQrCode,
    checkConnection,
    disconnect,
    addKnowledge,
    updateKnowledge,
    deleteKnowledge,
    deleteInstance,
    setQrCode,
  } = useWhatsAppAgent(agentId);

  const [activeTab, setActiveTab] = useState('test');
  const [newInstanceName, setNewInstanceName] = useState('');
  const [showNewInstanceDialog, setShowNewInstanceDialog] = useState(false);
  const [selectedInstance, setSelectedInstance] = useState<WhatsAppInstance | null>(null);
  const [isPollingQr, setIsPollingQr] = useState(false);

  // Knowledge base form
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

  // Poll for QR code updates
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    
    if (selectedInstance && connectionStatus === 'qr_code' && isPollingQr) {
      interval = setInterval(async () => {
        const result = await checkConnection(selectedInstance.instance_key!);
        if (result?.status === 'connected') {
          setIsPollingQr(false);
        }
      }, 3000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [selectedInstance, connectionStatus, isPollingQr, checkConnection]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [testMessages]);

  // Handle test chat submission
  const handleTestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testInput.trim() || isTestLoading) return;

    const userMessage = testInput.trim();
    setTestInput('');
    setTestMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsTestLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('whatsapp-ai-agent', {
        body: {
          action: 'test_chat',
          agentId,
          message: userMessage,
          conversationHistory: testMessages.map(m => ({ role: m.role, content: m.content })),
        }
      });

      if (error) throw error;

      if (data.error) {
        toast({
          title: "Erro",
          description: data.error,
          variant: "destructive",
        });
      } else {
        setTestMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
      }
    } catch (error) {
      console.error('Test chat error:', error);
      toast({
        title: "Erro",
        description: "Não foi possível enviar a mensagem.",
        variant: "destructive",
      });
    } finally {
      setIsTestLoading(false);
    }
  };

  const handleCreateInstance = async () => {
    if (!user?.id || !newInstanceName.trim()) return;
    
    const instance = await createInstance(user.id, newInstanceName.trim());
    if (instance) {
      setNewInstanceName('');
      setShowNewInstanceDialog(false);
      setSelectedInstance(instance);
      
      // Get QR code
      setTimeout(async () => {
        await getQrCode(instance.instance_key);
        setIsPollingQr(true);
      }, 2000);
    }
  };

  const handleConnectInstance = async (instance: WhatsAppInstance) => {
    setSelectedInstance(instance);
    
    if (instance.status === 'connected') {
      return;
    }

    await getQrCode(instance.instance_key!);
    setIsPollingQr(true);
  };

  const handleDisconnect = async (instance: WhatsAppInstance) => {
    await disconnect(instance.instance_key!);
    setSelectedInstance(null);
    setIsPollingQr(false);
  };

  const handleSaveKnowledge = async () => {
    if (!knowledgeTitle.trim() || !knowledgeContent.trim()) return;

    if (editingKnowledge) {
      await updateKnowledge(editingKnowledge.id, {
        title: knowledgeTitle,
        content: knowledgeContent,
        content_type: knowledgeType,
      });
    } else {
      await addKnowledge(knowledgeTitle, knowledgeContent, knowledgeType);
    }

    setKnowledgeTitle('');
    setKnowledgeContent('');
    setKnowledgeType('text');
    setEditingKnowledge(null);
    setShowKnowledgeDialog(false);
  };

  const handleEditKnowledge = (kb: KnowledgeBase) => {
    setEditingKnowledge(kb);
    setKnowledgeTitle(kb.title);
    setKnowledgeContent(kb.content);
    setKnowledgeType(kb.content_type);
    setShowKnowledgeDialog(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'connected':
        return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" /> Conectado</Badge>;
      case 'connecting':
      case 'qr_code':
        return <Badge className="bg-yellow-500"><RefreshCw className="w-3 h-3 mr-1 animate-spin" /> Aguardando</Badge>;
      default:
        return <Badge variant="secondary"><XCircle className="w-3 h-3 mr-1" /> Desconectado</Badge>;
    }
  };

  const getKnowledgeTypeIcon = (type: string) => {
    switch (type) {
      case 'faq':
        return <HelpCircle className="w-4 h-4" />;
      case 'document':
        return <FileText className="w-4 h-4" />;
      case 'url':
        return <LinkIcon className="w-4 h-4" />;
      default:
        return <BookOpen className="w-4 h-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-green-500" />
            WhatsApp IA - {agentName}
          </h2>
          <p className="text-muted-foreground">
            Conecte seu WhatsApp e treine seu agente para atendimento automático
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 w-full max-w-lg">
          <TabsTrigger value="test" className="flex items-center gap-2">
            <Play className="w-4 h-4" /> Testar
          </TabsTrigger>
          <TabsTrigger value="training" className="flex items-center gap-2">
            <Brain className="w-4 h-4" /> Treinamento
          </TabsTrigger>
          <TabsTrigger value="connection" className="flex items-center gap-2">
            <Phone className="w-4 h-4" /> Conexão
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="w-4 h-4" /> Config
          </TabsTrigger>
        </TabsList>

        {/* Test Chat Tab */}
        <TabsContent value="test" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-primary" />
                Simulador de Chat
              </CardTitle>
              <CardDescription>
                Teste seu agente IA antes de conectar ao WhatsApp real. 
                Adicione conhecimentos na aba "Treinamento" para melhorar as respostas.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Chat Messages */}
              <div className="border rounded-lg bg-muted/30 h-[400px] flex flex-col">
                <ScrollArea className="flex-1 p-4">
                  {testMessages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                      <MessageSquare className="w-12 h-12 mb-4 opacity-50" />
                      <p className="font-medium">Comece uma conversa de teste</p>
                      <p className="text-sm">Envie uma mensagem para ver como seu agente responde</p>
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
                                {msg.role === 'user' ? 'Você' : agentName}
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

                {/* Input */}
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

              {/* Quick Tips */}
              <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                <p className="text-sm font-medium mb-2">💡 Dicas para testar:</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Pergunte sobre horário de funcionamento, preços, serviços</li>
                  <li>• Adicione FAQs na aba "Treinamento" para respostas específicas</li>
                  <li>• Peça para "falar com um humano" para testar transferência</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Connection Tab */}
        <TabsContent value="connection" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Instâncias WhatsApp</h3>
            <Dialog open={showNewInstanceDialog} onOpenChange={setShowNewInstanceDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" /> Nova Conexão
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Criar Nova Conexão WhatsApp</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Nome da Instância</Label>
                    <Input
                      placeholder="Ex: WhatsApp Vendas"
                      value={newInstanceName}
                      onChange={(e) => setNewInstanceName(e.target.value)}
                    />
                  </div>
                  <Button 
                    onClick={handleCreateInstance} 
                    disabled={isCreating || !newInstanceName.trim()}
                    className="w-full"
                  >
                    {isCreating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Criando...
                      </>
                    ) : (
                      <>
                        <QrCode className="w-4 h-4 mr-2" />
                        Criar e Gerar QR Code
                      </>
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {instances.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <MessageSquare className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Nenhuma conexão WhatsApp</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Crie uma nova conexão para começar a receber mensagens e responder automaticamente.
                </p>
                <Button onClick={() => setShowNewInstanceDialog(true)}>
                  <Plus className="w-4 h-4 mr-2" /> Criar Primeira Conexão
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {instances.map((instance) => (
                <Card key={instance.id} className={selectedInstance?.id === instance.id ? 'border-primary' : ''}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-full ${
                          instance.status === 'connected' ? 'bg-green-500/20' : 'bg-muted'
                        }`}>
                          {instance.status === 'connected' ? (
                            <Wifi className="w-6 h-6 text-green-500" />
                          ) : (
                            <WifiOff className="w-6 h-6 text-muted-foreground" />
                          )}
                        </div>
                        <div>
                          <h4 className="font-medium">{instance.instance_name}</h4>
                          {instance.phone_number && (
                            <p className="text-sm text-muted-foreground">
                              📱 {instance.phone_number}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(instance.status)}
                        
                        {instance.status !== 'connected' ? (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleConnectInstance(instance)}
                          >
                            <QrCode className="w-4 h-4 mr-2" /> Conectar
                          </Button>
                        ) : (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleDisconnect(instance)}
                          >
                            <WifiOff className="w-4 h-4 mr-2" /> Desconectar
                          </Button>
                        )}

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Remover Instância?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta ação não pode ser desfeita. A conexão será removida permanentemente.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteInstance(instance.id, instance.instance_key!)}
                                className="bg-destructive hover:bg-destructive/90"
                              >
                                Remover
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>

                    {/* QR Code Display */}
                    {selectedInstance?.id === instance.id && qrCode && instance.status !== 'connected' && (
                      <div className="mt-4 p-4 bg-white rounded-lg flex flex-col items-center">
                        <p className="text-sm text-gray-600 mb-2">
                          Escaneie o QR Code com seu WhatsApp
                        </p>
                        <img 
                          src={qrCode.startsWith('data:') ? qrCode : `data:image/png;base64,${qrCode}`}
                          alt="QR Code" 
                          className="w-64 h-64"
                        />
                        <p className="text-xs text-gray-500 mt-2">
                          O código expira em 60 segundos
                        </p>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="mt-2"
                          onClick={() => getQrCode(instance.instance_key!)}
                        >
                          <RefreshCw className="w-4 h-4 mr-2" /> Atualizar QR Code
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Training Tab */}
        <TabsContent value="training" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Base de Conhecimento</h3>
              <p className="text-sm text-muted-foreground">
                Adicione informações para o agente aprender e responder melhor
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
                <Button>
                  <Plus className="w-4 h-4 mr-2" /> Adicionar Conhecimento
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
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
                        <SelectItem value="text">📝 Texto / Informação</SelectItem>
                        <SelectItem value="faq">❓ Pergunta & Resposta (FAQ)</SelectItem>
                        <SelectItem value="document">📄 Documento</SelectItem>
                        <SelectItem value="url">🔗 Link / URL</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>
                      {knowledgeType === 'faq' ? 'Pergunta' : 'Título'}
                    </Label>
                    <Input
                      placeholder={knowledgeType === 'faq' 
                        ? "Ex: Qual o horário de funcionamento?"
                        : "Ex: Informações sobre produtos"
                      }
                      value={knowledgeTitle}
                      onChange={(e) => setKnowledgeTitle(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>
                      {knowledgeType === 'faq' ? 'Resposta' : 'Conteúdo'}
                    </Label>
                    <Textarea
                      placeholder={knowledgeType === 'faq'
                        ? "Ex: Funcionamos de segunda a sexta, das 9h às 18h."
                        : "Descreva as informações que o agente deve saber..."
                      }
                      value={knowledgeContent}
                      onChange={(e) => setKnowledgeContent(e.target.value)}
                      rows={6}
                    />
                  </div>
                  <Button onClick={handleSaveKnowledge} className="w-full">
                    {editingKnowledge ? 'Salvar Alterações' : 'Adicionar'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {knowledgeBase.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Brain className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Nenhum conhecimento cadastrado</h3>
                <p className="text-muted-foreground text-center mb-4 max-w-md">
                  Adicione informações sobre seu negócio, produtos, serviços e perguntas frequentes 
                  para que o agente responda de forma inteligente.
                </p>
                <Button onClick={() => setShowKnowledgeDialog(true)}>
                  <Plus className="w-4 h-4 mr-2" /> Adicionar Primeiro Conhecimento
                </Button>
              </CardContent>
            </Card>
          ) : (
            <ScrollArea className="h-[500px]">
              <div className="space-y-3">
                {knowledgeBase.map((kb) => (
                  <Card key={kb.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <div className={`p-2 rounded-lg ${
                            kb.is_active ? 'bg-primary/10' : 'bg-muted'
                          }`}>
                            {getKnowledgeTypeIcon(kb.content_type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium truncate">{kb.title}</h4>
                              <Badge variant="outline" className="text-xs">
                                {kb.content_type === 'faq' ? 'FAQ' : 
                                 kb.content_type === 'document' ? 'Doc' :
                                 kb.content_type === 'url' ? 'URL' : 'Texto'}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                              {kb.content}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <Switch
                            checked={kb.is_active}
                            onCheckedChange={(checked) => updateKnowledge(kb.id, { is_active: checked })}
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditKnowledge(kb)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Remover Conhecimento?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta ação não pode ser desfeita.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteKnowledge(kb.id)}
                                  className="bg-destructive hover:bg-destructive/90"
                                >
                                  Remover
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configurações da API</CardTitle>
              <CardDescription>
                Configure sua Evolution API ou WAHA para conectar o WhatsApp
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <h4 className="font-medium text-yellow-600 dark:text-yellow-400 mb-2">
                  ⚠️ Configuração Necessária
                </h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Para usar o WhatsApp IA, você precisa configurar uma instância da 
                  <strong> Evolution API</strong> ou <strong>WAHA</strong> hospedada em seu servidor.
                </p>
                <div className="space-y-2 text-sm">
                  <p><strong>Secrets necessários no Supabase:</strong></p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li><code className="bg-muted px-1 rounded">EVOLUTION_API_URL</code> - URL da sua API Evolution</li>
                    <li><code className="bg-muted px-1 rounded">EVOLUTION_API_KEY</code> - Chave de API</li>
                  </ul>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium">Links Úteis</h4>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <a href="https://doc.evolution-api.com/" target="_blank" rel="noopener noreferrer">
                      📚 Documentação Evolution API
                    </a>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <a href="https://github.com/EvolutionAPI/evolution-api" target="_blank" rel="noopener noreferrer">
                      🐙 GitHub Evolution API
                    </a>
                  </Button>
                </div>
              </div>

              <div className="pt-4 border-t">
                <h4 className="font-medium mb-2">Funcionalidades do Agente IA</h4>
                <div className="grid gap-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Resposta automática com GPT-5
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Transcrição de áudios
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Análise de imagens
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Base de conhecimento personalizável
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Transferência para atendente humano
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
