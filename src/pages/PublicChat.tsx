import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bot, Send, Loader2, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: string;
  role: "user" | "bot";
  content: string;
  timestamp: Date;
  imageUrl?: string;
  audioUrl?: string;
  videoUrl?: string;
  documentUrl?: string;
  documentName?: string;
  buttons?: string[];
  nodeId?: string;
}

const PublicChat = () => {
  const { botId } = useParams();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isAdminTyping, setIsAdminTyping] = useState(false);
  const [botData, setBotData] = useState<any>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [sessionId] = useState(() => `session-${Date.now()}-${Math.random()}`);
  const [isHumanMode, setIsHumanMode] = useState(false);
  const [showPreChatForm, setShowPreChatForm] = useState(true);
  const [visitorName, setVisitorName] = useState("");
  const [visitorPhone, setVisitorPhone] = useState("");
  const [visitorEmail, setVisitorEmail] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!showPreChatForm) {
      fetchBotData();
      createConversation();
    }
  }, [botId, showPreChatForm]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`conversation-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chatbot_messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          const newMsg = payload.new as any;
          console.log('📨 Nova mensagem recebida no chat:', newMsg);
          if (newMsg.role === 'admin') {
            setMessages(prev => [...prev, {
              id: newMsg.id,
              role: 'bot',
              content: newMsg.content,
              timestamp: new Date(newMsg.created_at),
              imageUrl: newMsg.media_url && newMsg.media_type === 'image' ? newMsg.media_url : undefined,
              audioUrl: newMsg.media_url && newMsg.media_type === 'audio' ? newMsg.media_url : undefined,
              videoUrl: newMsg.media_url && newMsg.media_type === 'video' ? newMsg.media_url : undefined,
            }]);
          }
        }
      )
      .subscribe();

    // Canal para receber status de typing do atendente
    const adminTypingChannel = supabase
      .channel(`admin-typing-${conversationId}`)
      .on('broadcast', { event: 'admin-typing' }, (payload) => {
        console.log('⌨️ Atendente digitando:', payload);
        if (payload.payload.conversationId === conversationId) {
          setIsAdminTyping(payload.payload.isTyping);
        }
      })
      .subscribe();

    // Canal de presença - indicar que o cliente está online
    const presenceChannel = supabase
      .channel(`presence-${conversationId}`)
      .on('presence', { event: 'sync' }, () => {
        console.log('👥 Presença sincronizada');
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel.track({
            user: 'visitor',
            online_at: new Date().toISOString(),
          });
          console.log('✅ Cliente marcado como online');
        }
      });

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(adminTypingChannel);
      supabase.removeChannel(presenceChannel);
      setIsAdminTyping(false);
    };
  }, [conversationId]);

  // Broadcast de typing status
  const handleInputChange = (value: string) => {
    setInputMessage(value);
    
    if (!conversationId) return;
    
    // Enviar status de "digitando"
    const channel = supabase.channel(`typing-${conversationId}`);
    channel.send({
      type: 'broadcast',
      event: 'typing',
      payload: { isTyping: value.length > 0, conversationId }
    });

    // Limpar timeout anterior
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Enviar "parou de digitar" após 2 segundos
    typingTimeoutRef.current = setTimeout(() => {
      channel.send({
        type: 'broadcast',
        event: 'typing',
        payload: { isTyping: false, conversationId }
      });
    }, 2000);
  };

  const createConversation = async () => {
    if (!botId) return;

    try {
      const { data, error } = await supabase
        .from('chatbot_conversations')
        .insert({
          chatbot_id: botId,
          session_id: sessionId,
          status: 'active',
          visitor_name: visitorName,
          visitor_phone: visitorPhone,
          visitor_email: visitorEmail
        })
        .select()
        .single();

      if (error) throw error;
      setConversationId(data.id);
    } catch (error) {
      console.error('Erro ao criar conversa:', error);
    }
  };

  const saveMessage = async (role: string, content: string, nodeId?: string) => {
    if (!conversationId) return;

    try {
      await supabase
        .from('chatbot_messages')
        .insert({
          conversation_id: conversationId,
          role,
          content,
          node_id: nodeId || null // Garantir que seja null quando undefined
        });
    } catch (error) {
      console.error('Erro ao salvar mensagem:', error);
    }
  };

  const fetchBotData = async () => {
    if (!botId) {
      toast({
        title: "Erro",
        description: "ID do bot não fornecido.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Tentar buscar como chatbot
      const { data: chatbot, error: chatbotError } = await supabase
        .from('chatbots')
        .select('*')
        .eq('id', botId)
        .maybeSingle();

      console.log('🔍 Buscando chatbot:', botId);
      console.log('📦 Resultado chatbot:', chatbot);
      console.log('❌ Erro chatbot:', chatbotError);

      if (chatbot && chatbot.is_active) {
        setBotData({ ...chatbot, type: 'chatbot' });
        setMessages([]);
        const config = chatbot.config as any || {};
        
        // Encontrar o primeiro bloco após o trigger OU iniciar pelo primeiro nó sem entradas
        const nodes = config.nodes || [];
        const edges = config.edges || [];
        
        console.log('📊 Nodes:', nodes);
        console.log('🔗 Edges:', edges);
        
        const triggerNode = nodes.find((n: any) => n.type === 'trigger');

        // 1) Se houver trigger com saída, usar o alvo da primeira aresta
        if (triggerNode && edges.length > 0) {
          const firstEdge = edges.find((e: any) => e.source === triggerNode.id);
          if (firstEdge) {
            const firstNode = nodes.find((n: any) => n.id === firstEdge.target);
            if (firstNode) {
              console.log('✅ Iniciando com nó após trigger:', firstNode);
              processNode(firstNode, nodes, edges);
              return;
            }
          }
        }

        // 2) Se não houver trigger/ligação, usar nó SEM entradas (start node)
        const incomingTargets = new Set((edges || []).map((e: any) => e.target));
        const startCandidates = nodes.filter((n: any) => n.type !== 'trigger' && !incomingTargets.has(n.id));

        if (startCandidates.length > 0) {
          // priorizar mais alto no canvas; se empatar, por id mais antigo
          const firstStart = [...startCandidates]
            .sort((a: any, b: any) => (a.position?.y || 0) - (b.position?.y || 0) || (parseInt(a.id) - parseInt(b.id)))[0];
          console.log('✅ Iniciando com nó sem entradas:', firstStart);
          processNode(firstStart, nodes, edges);
          return;
        }

        // 3) Fallback: nó mais alto do canvas
        const firstTopNode = nodes
          .filter((n: any) => n.type !== 'trigger')
          .sort((a: any, b: any) => (a.position?.y || 0) - (b.position?.y || 0))[0];

        if (firstTopNode) {
          console.log('✅ Iniciando com primeiro nó (fallback):', firstTopNode);
          processNode(firstTopNode, nodes, edges);
          return;
        }
        
        // Fallback para mensagem padrão
        console.log('⚠️ Usando mensagem padrão');
        setMessages([{
          id: '1',
          role: 'bot',
          content: 'Olá! Como posso ajudar você hoje?',
          timestamp: new Date()
        }]);
        return;
      }

      // Se chegou aqui, não encontrou chatbot - exibir erro
      console.error('❌ Chatbot não encontrado ou inativo');
      toast({
        title: "Chatbot não encontrado",
        description: "Este chatbot não existe ou está inativo.",
        variant: "destructive"
      });
    } catch (error) {
      console.error('❌ Erro ao buscar bot:', error);
      toast({
        title: "Erro ao carregar",
        description: "Não foi possível carregar o bot. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  const processNode = async (node: any, nodes: any[], edges: any[]) => {
    const newMessages: Message[] = [];
    
    // Processar diferentes tipos de nós
    if (node.type === 'message' || node.type === 'text') {
      newMessages.push({
        id: node.id,
        role: 'bot',
        content: node.data.label || '',
        timestamp: new Date(),
        imageUrl: node.data.imageUrl,
        buttons: node.data.buttons,
        nodeId: node.id
      } as any);
    } else if (node.type === 'image') {
      newMessages.push({
        id: node.id,
        role: 'bot',
        content: node.data.label || 'Imagem',
        timestamp: new Date(),
        imageUrl: node.data.imageUrl,
        buttons: node.data.buttons,
        nodeId: node.id
      } as any);
    } else if (node.type === 'audio') {
      newMessages.push({
        id: node.id,
        role: 'bot',
        content: `🎵 ${node.data.label || 'Áudio'}`,
        timestamp: new Date(),
        audioUrl: node.data.audioUrl,
        buttons: node.data.buttons,
        nodeId: node.id
      } as any);
    } else if (node.type === 'video') {
      newMessages.push({
        id: node.id,
        role: 'bot',
        content: `🎥 ${node.data.label || 'Vídeo'}`,
        timestamp: new Date(),
        videoUrl: node.data.videoUrl,
        buttons: node.data.buttons,
        nodeId: node.id
      } as any);
    } else if (node.type === 'document') {
      newMessages.push({
        id: node.id,
        role: 'bot',
        content: `📄 ${node.data.label || 'Documento'}`,
        timestamp: new Date(),
        documentUrl: node.data.documentUrl,
        documentName: node.data.documentName,
        buttons: node.data.buttons,
        nodeId: node.id
      } as any);
    } else if (node.type === 'question' || node.type === 'quickReply' || node.type === 'button') {
      newMessages.push({
        id: node.id,
        role: 'bot',
        content: node.data.label || '',
        timestamp: new Date(),
        imageUrl: node.data.imageUrl,
        buttons: node.data.buttons,
        nodeId: node.id
      } as any);
    } else if (node.type === 'humanAgent') {
      const transferMessage = node.data.label || 'Você está sendo transferido para um atendente humano. Aguarde um momento...';
      newMessages.push({
        id: node.id,
        role: 'bot',
        content: transferMessage,
        timestamp: new Date(),
        nodeId: node.id
      } as any);
      
      // Ativar modo atendimento humano
      setIsHumanMode(true);
      if (conversationId) {
        await supabase
          .from('chatbot_conversations')
          .update({ status: 'waiting_agent' })
          .eq('id', conversationId);
      }
    }
    
    // Adicionar mensagens ao chat e salvar no banco
    setMessages(prev => [...prev, ...newMessages]);
    
    // Salvar cada mensagem no banco de dados
    for (const msg of newMessages) {
      await saveMessage('bot', msg.content, msg.nodeId);
    }
  };

  const findNextNode = (currentNodeId: string, userResponse?: string) => {
    if (!botData?.config) return null;
    
    const config = botData.config as any;
    const nodes = config.nodes || [];
    const edges = config.edges || [];
    
    const currentNode = nodes.find((n: any) => n.id === currentNodeId);
    const hasButtons = Array.isArray(currentNode?.data?.buttons) && currentNode.data.buttons.length > 0;

    // Se o nó tiver botões, só avançar se existir conexão específica para o botão clicado
    if (hasButtons) {
      if (typeof userResponse !== 'string') {
        console.log('⛔ Nó com botões mas sem resposta de usuário — não avançar.');
        return null;
      }

      const btns: any[] = currentNode.data.buttons;
      // Normalizar botões para comparação (suportar string e objeto)
      const idx = btns.findIndex((b: any) => {
        const btnText = typeof b === 'string' ? b : (b?.text || '');
        return btnText.trim().toLowerCase() === userResponse.trim().toLowerCase();
      });

      if (idx < 0) {
        console.log('⛔ Rótulo do botão não encontrado entre as opções — não avançar.', { userResponse, btns });
        return null;
      }

      // Tentar aresta com handle específico do botão
      const edgeByHandle = edges.find((e: any) => e.source === currentNodeId && e.sourceHandle === `btn-${idx}`);
      if (edgeByHandle) {
        return nodes.find((n: any) => n.id === edgeByHandle.target) || null;
      }

      // Sem conexão para este botão: não avançar
      console.log('⛔ Botão clicado não possui conexão (handle btn-${idx}) — não avançar.');
      return null;
    }

    // Nó sem botões: seguir a primeira aresta de saída (comportamento padrão do fluxo linear)
    const nextEdge = edges.find((e: any) => e.source === currentNodeId);
    if (nextEdge) {
      return nodes.find((n: any) => n.id === nextEdge.target) || null;
    }
    
    return null;
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleStartChat = () => {
    if (!visitorName.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Por favor, insira seu nome para continuar.",
        variant: "destructive"
      });
      return;
    }
    setShowPreChatForm(false);
  };

const handleSendMessage = async (messageText?: string, originNodeId?: string) => {
    const textToSend = messageText || inputMessage;
    if (!textToSend.trim() || !botData) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: textToSend,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    // Salvar mensagem do usuário (com originNodeId quando vier de botão)
    await saveMessage('user', textToSend, originNodeId);

    // Criar notificação para nova mensagem do cliente (apenas se for chatbot)
    if (botData.type === 'chatbot' && conversationId && botId) {
      await supabase
        .from('chatbot_notifications')
        .insert({
          chatbot_id: botId,
          type: 'new_message',
          title: 'Nova Mensagem',
          message: `${visitorName || 'Visitante'}: ${textToSend.substring(0, 50)}${textToSend.length > 50 ? '...' : ''}`,
          is_read: false,
        });
    }

    // Se estiver em modo atendimento humano, apenas salvar e aguardar resposta
    if (isHumanMode) {
      setIsLoading(false);
      return;
    }

    // Verificar se a mensagem corresponde a alguma palavra-chave
    if (botData.type === 'chatbot' && !originNodeId) {
      const config = botData.config as any;
      const nodes = config.nodes || [];
      
      // Normalizar a mensagem do usuário para comparação
      const normalizedInput = textToSend.trim().toLowerCase();
      
      // Procurar por um nó que tenha a palavra-chave correspondente
      const matchedNode = nodes.find((node: any) => {
        const keyword = node.data?.keyword;
        if (!keyword) return false;
        return keyword.trim().toLowerCase() === normalizedInput;
      });
      
      if (matchedNode) {
        console.log('🔑 Palavra-chave detectada! Ativando bloco:', matchedNode);
        
        // Calcular delay
        const delayMs = 500 + ((matchedNode.data?.delaySeconds || 0) * 1000);
        
        setIsTyping(true);
        
        setTimeout(async () => {
          setIsTyping(false);
          await processNode(matchedNode, nodes, config.edges || []);
          setIsLoading(false);
        }, delayMs);
        
        return;
      }
    }

    try {
      // Chatbot sempre usa fluxo - só processar se veio de um botão (originNodeId definido)
      if (originNodeId) {
        const contextNodeId = originNodeId;
        console.log('🔍 Nó de contexto:', contextNodeId);
        console.log('📝 Texto enviado pelo usuário:', textToSend);
        
        const nextNode = findNextNode(contextNodeId, textToSend);
        console.log('➡️ Próximo nó encontrado:', nextNode);
        
        if (nextNode) {
          // Calcular delay total (500ms base + delay configurado)
          const delayMs = 500 + ((nextNode.data?.delaySeconds || 0) * 1000);
          
          // Mostrar indicador de digitando
          setIsTyping(true);
          
          setTimeout(async () => {
            setIsTyping(false);
            await processNode(nextNode, botData.config.nodes, botData.config.edges);
            setIsLoading(false);
          }, delayMs);
          return;
        } else {
          console.log('⚠️ Botão sem conexão - apenas salvando mensagem do usuário');
          // Não processar nenhum nó, apenas finalizar
          setIsLoading(false);
          return;
        }
      } else {
        console.log('💬 Mensagem livre do usuário - aguardando atendente');
      }
      
      // Finalizar carregamento
      setTimeout(() => {
        setIsLoading(false);
      }, 500);
      return;
    } catch (error) {
      console.error('Erro ao processar mensagem:', error);
      toast({
        title: "Erro",
        description: "Não foi possível processar sua mensagem.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (showPreChatForm) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8 shadow-xl">
          <div className="text-center mb-6">
            <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bot className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Bem-vindo!</h2>
            <p className="text-muted-foreground">
              Para iniciar o atendimento, por favor preencha seus dados
            </p>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Nome completo *
              </label>
              <Input
                value={visitorName}
                onChange={(e) => setVisitorName(e.target.value)}
                placeholder="Digite seu nome"
                className="w-full"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">
                Telefone (opcional)
              </label>
              <Input
                value={visitorPhone}
                onChange={(e) => setVisitorPhone(e.target.value)}
                placeholder="(00) 00000-0000"
                className="w-full"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">
                E-mail (opcional)
              </label>
              <Input
                type="email"
                value={visitorEmail}
                onChange={(e) => setVisitorEmail(e.target.value)}
                placeholder="seu@email.com"
                className="w-full"
              />
            </div>
            
            <Button
              onClick={handleStartChat}
              className="w-full gradient-primary shadow-glow"
              size="lg"
            >
              Iniciar Conversa
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (!botData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/20 via-background to-primary/10 flex items-center justify-center">
        <Card className="p-8 text-center">
          <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-primary" />
          <p className="text-muted-foreground">Carregando chat...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/20 via-background to-primary/10 flex flex-col">
      {/* Header */}
      <header className="bg-card/95 backdrop-blur-md border-b border-border px-6 py-4 sticky top-0 z-50 shadow-md">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-3 rounded-xl">
              <Bot className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold">
                {botData?.config?.attendantName || botData.name || 'Atendente'}
              </h1>
              <p className="text-sm text-muted-foreground">
                {isTyping ? 'Digitando...' : 'Online'}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium">{visitorName}</p>
            <p className="text-xs text-muted-foreground">Você</p>
          </div>
        </div>
      </header>

      {/* Messages */}
      <main className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.map((message) => (
            <div key={message.id}>
              <div
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] sm:max-w-[70%] rounded-2xl px-4 py-3 shadow-md hover:shadow-lg transition-shadow duration-200 ${
                    message.role === 'user'
                      ? 'bg-gradient-to-br from-primary to-primary/80 text-primary-foreground ml-auto'
                      : 'bg-gradient-to-br from-card to-card/80 border-2 border-primary/20'
                  }`}
                >
                  {message.imageUrl && (
                    <img 
                      src={message.imageUrl} 
                      alt="Imagem" 
                      className="w-full rounded-lg mb-2 max-h-64 object-cover"
                    />
                  )}
                  {message.audioUrl && (
                    <audio controls className="w-full mb-2">
                      <source src={message.audioUrl} />
                    </audio>
                  )}
                  {message.videoUrl && (
                    <video controls className="w-full rounded-lg mb-2 max-h-64">
                      <source src={message.videoUrl} />
                    </video>
                  )}
                  {message.documentUrl && (
                    <a 
                      href={message.documentUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-2 bg-accent rounded-md mb-2 hover:bg-accent/70 transition"
                    >
                      <FileText className="w-4 h-4" />
                      <span className="text-xs">{message.documentName || 'Documento'}</span>
                    </a>
                  )}
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  <span className="text-xs opacity-70 mt-1 block">
                    {message.timestamp.toLocaleTimeString('pt-BR', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </span>
                </div>
              </div>
              {message.buttons && message.buttons.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2 ml-2">
                  {message.buttons.map((button: any, idx: number) => {
                    // Suportar formato antigo (string) e novo (objeto com text/url)
                    const buttonText = typeof button === 'string' ? button : (button?.text || '');
                    const buttonUrl = typeof button === 'object' && button ? (button.url || '') : '';
                    
                    // Array de cores vibrantes para os botões (verde com letras brancas)
                    const buttonColors = [
                      'bg-green-600 hover:bg-green-700 text-white border-0',
                      'bg-green-600 hover:bg-green-700 text-white border-0',
                      'bg-green-600 hover:bg-green-700 text-white border-0',
                      'bg-green-600 hover:bg-green-700 text-white border-0',
                      'bg-green-600 hover:bg-green-700 text-white border-0',
                      'bg-green-600 hover:bg-green-700 text-white border-0',
                    ];
                    
                    const colorClass = buttonColors[idx % buttonColors.length];
                    
                    return (
                      <Button
                        key={idx}
                        variant="default"
                        size="sm"
                        onClick={async () => {
                          // Se tiver URL válida, abrir em nova aba e não processar fluxo
                          if (buttonUrl && buttonUrl.trim() !== '' && buttonUrl.trim().length > 0) {
                            // Registrar clique no botão
                            try {
                              await supabase
                                .from('button_link_clicks')
                                .insert({
                                  chatbot_id: botData.type === 'chatbot' ? botId : null,
                                  ai_agent_id: botData.type === 'agent' ? botId : null,
                                  conversation_id: conversationId,
                                  button_text: buttonText,
                                  button_url: buttonUrl.trim(),
                                  node_id: message.nodeId,
                                  visitor_id: sessionId
                                });
                            } catch (error) {
                              console.error('Erro ao registrar clique:', error);
                            }
                            
                            window.open(buttonUrl.trim(), '_blank', 'noopener,noreferrer');
                            return;
                          }
                          
                          // Ações especiais de botões
                          if (buttonText === 'Falar com atendente') {
                            setIsHumanMode(true);
                            setMessages(prev => [...prev, {
                              id: Date.now().toString(),
                              role: 'bot',
                              content: 'Você está sendo transferido para um atendente. Aguarde um momento...',
                              timestamp: new Date()
                            }]);
                            saveMessage('bot', 'Cliente solicitou falar com atendente');
                            if (conversationId) {
                              supabase
                                .from('chatbot_conversations')
                                .update({ status: 'waiting_agent' })
                                .eq('id', conversationId)
                                .then();
                            }
                          } else if (buttonText === 'Finalizar atendimento') {
                            setMessages(prev => [...prev, {
                              id: Date.now().toString(),
                              role: 'bot',
                              content: 'Obrigado pelo contato! Até a próxima! 👋',
                              timestamp: new Date()
                            }]);
                            if (conversationId) {
                              supabase
                                .from('chatbot_conversations')
                                .update({ status: 'closed' })
                                .eq('id', conversationId)
                                .then();
                            }
                          } else {
                            // Processar próximo nó do fluxo a partir deste bloco (nodeId de origem)
                            handleSendMessage(buttonText, message.nodeId);
                          }
                        }}
                        className={`rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 font-semibold ${colorClass}`}
                      >
                        {buttonText}
                      </Button>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-card border border-border rounded-2xl px-4 py-3">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
              </div>
            </div>
          )}
          {(isTyping || isAdminTyping) && (
            <div className="flex justify-start">
              <div className="bg-card border border-border rounded-2xl px-4 py-3">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input */}
      <footer className="bg-card/95 backdrop-blur-md border-t border-border px-4 py-4 sticky bottom-0">
        {isHumanMode && (
          <div className="max-w-4xl mx-auto mb-2 p-2 bg-primary/10 rounded-lg text-center">
            <p className="text-sm text-primary font-medium">
              💬 Modo atendimento humano ativo
            </p>
          </div>
        )}
        <div className="max-w-4xl mx-auto flex gap-2">
          <Input
            value={inputMessage}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder={isHumanMode ? "Aguardando atendente..." : "Digite sua mensagem..."}
            disabled={isLoading}
            className="flex-1"
          />
          <Button
            onClick={() => handleSendMessage()}
            disabled={!inputMessage.trim() || isLoading}
            className="gradient-primary shadow-glow"
            size="icon"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
        <p className="text-xs text-center text-muted-foreground mt-2">
          Powered by Bot Reals Zapp
        </p>
      </footer>
    </div>
  );
};

export default PublicChat;
