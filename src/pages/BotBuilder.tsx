import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Save, Link2, MessageCircle } from "lucide-react";
import { useChatbot } from '@/hooks/useChatbot';
import { useAuth } from '@/contexts/AuthContext';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ChatWidgetGenerator } from '@/components/ChatWidgetGenerator';
import { ChatbotFlowBuilder } from '@/components/ChatbotFlowBuilder';

const BotBuilder = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const chatbotId = searchParams.get('id');
  const { saveChatbot, loadChatbot, toggleActive, isSaving } = useChatbot();
  
  const [botName, setBotName] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [accessType, setAccessType] = useState<'public' | 'anonymous'>('public');
  const [enableQueue, setEnableQueue] = useState(true);
  const [enableAutoReply, setEnableAutoReply] = useState(true);
  const [autoReplyMessage, setAutoReplyMessage] = useState("Olá! Envie sua mensagem que responderei assim que possível. 😊");
  const [showWidgetDialog, setShowWidgetDialog] = useState(false);

  // Carregar chatbot existente
  useEffect(() => {
    if (chatbotId && user) {
      loadChatbot(chatbotId).then(chatbot => {
        setBotName(chatbot.name);
        setDescription(chatbot.description || "");
        setIsActive(chatbot.is_active);
        setAccessType((chatbot as any).access_type || 'public');
        setEnableQueue((chatbot as any).enable_queue !== false);
        setEnableAutoReply((chatbot as any).enable_auto_reply !== false);
        setAutoReplyMessage((chatbot as any).auto_reply_message || "Olá! Envie sua mensagem que responderei assim que possível. 😊");
      }).catch(console.error);
    }
  }, [chatbotId, user]);

  const handleSave = useCallback(async () => {
    if (!botName.trim()) {
      toast({
        title: "Nome obrigatório! ⚠️",
        description: "Por favor, dê um nome ao seu chat online.",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Erro de autenticação",
        description: "Você precisa estar logado para salvar.",
        variant: "destructive",
      });
      return;
    }

    try {
      const chatbotData: any = {
        id: chatbotId || undefined,
        name: botName,
        description: description,
        config: { nodes: [], edges: [] },
        is_active: isActive,
        user_id: user.id,
        access_type: accessType,
        enable_queue: enableQueue,
        enable_auto_reply: enableAutoReply,
        auto_reply_message: autoReplyMessage,
      };

      const result = await saveChatbot(chatbotData);
      
      if (!chatbotId && result) {
        navigate(`/bot-builder?id=${result.id}`);
      }
    } catch (error) {
      console.error('Save error:', error);
    }
  }, [botName, description, isActive, accessType, enableQueue, autoReplyMessage, user, chatbotId, saveChatbot, navigate]);

  const handleCopyLink = useCallback(() => {
    if (!chatbotId) {
      toast({
        title: "Salve primeiro! 💾",
        description: "Você precisa salvar o chat online antes de gerar o link.",
        variant: "destructive",
      });
      return;
    }

    const link = `${window.location.origin}/chatbot-auth/${chatbotId}`;
    navigator.clipboard.writeText(link);
    toast({
      title: "Link copiado! 🔗",
      description: "O link do chat online foi copiado para a área de transferência.",
    });
  }, [chatbotId, toast]);

  const handleToggleActive = useCallback(async (checked: boolean) => {
    if (!chatbotId) {
      toast({
        title: "Salve primeiro! 💾",
        description: "Você precisa salvar o chat online antes de ativá-lo.",
        variant: "destructive",
      });
      return;
    }

    try {
      await toggleActive(chatbotId, checked);
      setIsActive(checked);
    } catch (error) {
      console.error('Toggle active error:', error);
    }
  }, [chatbotId, toggleActive, toast]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/dashboard?tab=chatbots")}
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div className="flex flex-col">
                <h1 className="text-2xl font-bold">
                  {chatbotId ? "Editar Chat Online" : "Criar Chat Online"}
                </h1>
                <p className="text-sm text-muted-foreground">
                  Configure seu chat online para atendimento em tempo real
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <Switch
                  id="active"
                  checked={isActive}
                  onCheckedChange={handleToggleActive}
                />
                <Label htmlFor="active" className="cursor-pointer">
                  {isActive ? 'Ativo' : 'Inativo'}
                </Label>
              </div>
              <Button
                variant="outline"
                onClick={handleCopyLink}
                disabled={!chatbotId}
              >
                <Link2 className="w-4 h-4 mr-2" />
                Copiar Link
              </Button>
              
              <Dialog open={showWidgetDialog} onOpenChange={setShowWidgetDialog}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    disabled={!chatbotId}
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Gerar Botão Flutuante
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Gerar Botão Flutuante para o Site</DialogTitle>
                  </DialogHeader>
                  {chatbotId && <ChatWidgetGenerator botId={chatbotId} type="chatbot" />}
                </DialogContent>
              </Dialog>

              <Button onClick={handleSave} disabled={isSaving}>
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto space-y-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Informações Básicas</h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Nome do Chat Online *</Label>
                <Input
                  id="name"
                  placeholder="Ex: Suporte ao Cliente"
                  value={botName}
                  onChange={(e) => setBotName(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  placeholder="Descreva a finalidade deste chat online..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="mt-1 min-h-[100px]"
                />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Configurações de Acesso</h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="access-type">Tipo de Acesso</Label>
                <Select value={accessType} onValueChange={(value: any) => setAccessType(value)}>
                  <SelectTrigger id="access-type" className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Público - Requer cadastro</SelectItem>
                    <SelectItem value="anonymous">Anônimo - Sem cadastro</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground mt-2">
                  {accessType === 'public' && 'Qualquer pessoa pode criar uma conta e conversar'}
                  {accessType === 'anonymous' && 'Conversas sem necessidade de identificação'}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Sistema de Fila</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="enable-queue">Ativar Sistema de Fila</Label>
                  <p className="text-sm text-muted-foreground">
                    Evita que clientes fiquem sem resposta. Mostra posição na fila de atendimento.
                  </p>
                </div>
                <Switch
                  id="enable-queue"
                  checked={enableQueue}
                  onCheckedChange={setEnableQueue}
                />
              </div>
              {enableQueue && (
                <div className="bg-primary/5 p-4 rounded-xl border border-primary/20">
                  <p className="text-sm text-muted-foreground">
                    ✅ Com a fila ativa, os clientes verão sua posição e tempo estimado de espera.
                    Isso melhora a experiência e reduz a ansiedade durante o atendimento.
                  </p>
                </div>
              )}
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Mensagem Automática</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="enable-auto-reply">Ativar Mensagem Automática</Label>
                  <p className="text-sm text-muted-foreground">
                    Envia uma mensagem automática quando o cliente enviar a primeira mensagem.
                  </p>
                </div>
                <Switch
                  id="enable-auto-reply"
                  checked={enableAutoReply}
                  onCheckedChange={setEnableAutoReply}
                />
              </div>
              {enableAutoReply && (
                <div>
                  <Label htmlFor="auto-reply">Mensagem de Ausência/Espera</Label>
                  <Textarea
                    id="auto-reply"
                    placeholder="Ex: Olá! Envie sua mensagem que responderei assim que possível."
                    value={autoReplyMessage}
                    onChange={(e) => setAutoReplyMessage(e.target.value)}
                    className="mt-1 min-h-[100px]"
                  />
                  <p className="text-sm text-muted-foreground mt-2">
                    Esta mensagem será enviada automaticamente quando o cliente enviar a primeira mensagem,
                    informando que você está ocupado ou atendendo outras pessoas.
                  </p>
                </div>
              )}
            </div>
          </Card>

          {chatbotId && (
            <ChatbotFlowBuilder chatbotId={chatbotId} />
          )}

          <Card className="p-6 bg-muted/50">
            <h2 className="text-xl font-semibold mb-2">Como Funciona</h2>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Clientes acessam o chat através do link compartilhado</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Você atende as conversas em tempo real na aba "Conversas"</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Suporte para envio de texto, emojis e imagens</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Histórico completo de conversas na aba "Clientes"</span>
              </li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default BotBuilder;
