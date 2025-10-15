import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bot, Send, Loader2, Sparkles, FileText } from "lucide-react";
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
  const [botData, setBotData] = useState<any>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [sessionId] = useState(() => `session-${Date.now()}-${Math.random()}`);
  const [isHumanMode, setIsHumanMode] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchBotData();
    createConversation();
  }, [botId]);

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
          if (newMsg.role === 'admin') {
            setMessages(prev => [...prev, {
              id: newMsg.id,
              role: 'bot',
              content: newMsg.content,
              timestamp: new Date(newMsg.created_at)
            }]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  const createConversation = async () => {
    if (!botId) return;

    try {
      const { data, error } = await supabase
        .from('chatbot_conversations')
        .insert({
          chatbot_id: botId,
          session_id: sessionId,
          status: 'active'
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
          node_id: nodeId
        });
    } catch (error) {
      console.error('Erro ao salvar mensagem:', error);
    }
  };

  const fetchBotData = async () => {
    if (!botId) return;

    // Tentar buscar como chatbot
    let { data: chatbot } = await supabase
      .from('chatbots')
      .select('*')
      .eq('id', botId)
      .eq('is_active', true)
      .single();

    if (chatbot) {
      setBotData({ ...chatbot, type: 'chatbot' });
      setMessages([]);
      const config = chatbot.config as any || {};
      
      // Encontrar o primeiro bloco após o trigger OU iniciar pelo primeiro nó sem entradas
      const nodes = config.nodes || [];
      const edges = config.edges || [];
      const triggerNode = nodes.find((n: any) => n.type === 'trigger');

      // 1) Se houver trigger com saída, usar o alvo da primeira aresta
      if (triggerNode && edges.length > 0) {
        const firstEdge = edges.find((e: any) => e.source === triggerNode.id);
        if (firstEdge) {
          const firstNode = nodes.find((n: any) => n.id === firstEdge.target);
          if (firstNode) {
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
        processNode(firstStart, nodes, edges);
        return;
      }

      // 3) Fallback: nó mais alto do canvas
      const firstTopNode = nodes
        .filter((n: any) => n.type !== 'trigger')
        .sort((a: any, b: any) => (a.position?.y || 0) - (b.position?.y || 0))[0];

      if (firstTopNode) {
        processNode(firstTopNode, nodes, edges);
        return;
      }
      
      // Fallback para mensagem padrão
      setMessages([{
        id: '1',
        role: 'bot',
        content: 'Olá! Como posso ajudar você hoje?',
        timestamp: new Date()
      }]);
      return;
    }

    // Tentar buscar como agente IA
    let { data: agent } = await supabase
      .from('ai_agents')
      .select('*')
      .eq('id', botId)
      .eq('is_active', true)
      .single();

    if (agent) {
      setBotData({ ...agent, type: 'agent' });
      const config = agent.config as any || {};
      setMessages([{
        id: '1',
        role: 'bot',
        content: config.welcomeMessage || 'Olá! Sou seu assistente inteligente. Como posso ajudar?',
        timestamp: new Date()
      }]);
    } else {
      toast({
        title: "Bot não encontrado",
        description: "Este bot não existe ou está inativo.",
        variant: "destructive"
      });
    }
  };

  const processNode = (node: any, nodes: any[], edges: any[]) => {
    const messages: Message[] = [];
    
    // Processar diferentes tipos de nós
    if (node.type === 'message' || node.type === 'text') {
      messages.push({
        id: node.id,
        role: 'bot',
        content: node.data.label || '',
        timestamp: new Date(),
        imageUrl: node.data.imageUrl,
        nodeId: node.id
      } as any);
    } else if (node.type === 'image') {
      messages.push({
        id: node.id,
        role: 'bot',
        content: node.data.label || 'Imagem',
        timestamp: new Date(),
        imageUrl: node.data.imageUrl,
        nodeId: node.id
      } as any);
    } else if (node.type === 'audio') {
      messages.push({
        id: node.id,
        role: 'bot',
        content: `🎵 ${node.data.label || 'Áudio'}`,
        timestamp: new Date(),
        audioUrl: node.data.audioUrl,
        nodeId: node.id
      } as any);
    } else if (node.type === 'video') {
      messages.push({
        id: node.id,
        role: 'bot',
        content: `🎥 ${node.data.label || 'Vídeo'}`,
        timestamp: new Date(),
        videoUrl: node.data.videoUrl,
        nodeId: node.id
      } as any);
    } else if (node.type === 'document') {
      messages.push({
        id: node.id,
        role: 'bot',
        content: `📄 ${node.data.label || 'Documento'}`,
        timestamp: new Date(),
        documentUrl: node.data.documentUrl,
        documentName: node.data.documentName,
        nodeId: node.id
      } as any);
    } else if (node.type === 'question' || node.type === 'quickReply' || node.type === 'button') {
      messages.push({
        id: node.id,
        role: 'bot',
        content: node.data.label || '',
        timestamp: new Date(),
        imageUrl: node.data.imageUrl,
        buttons: node.data.buttons,
        nodeId: node.id
      } as any);
    }
    
    setMessages(prev => [...prev, ...messages]);
  };

  const findNextNode = (currentNodeId: string, userResponse?: string) => {
    if (!botData?.config) return null;
    
    const config = botData.config as any;
    const nodes = config.nodes || [];
    const edges = config.edges || [];
    
    // Encontrar próximo nó considerando Quick Replies com handles por botão
    const currentNode = nodes.find((n: any) => n.id === currentNodeId);

    if (currentNode?.type === 'quickReply' && typeof userResponse === 'string') {
      const btns: string[] = currentNode.data?.buttons || [];
      const idx = btns.findIndex((b: string) => (b || '').trim().toLowerCase() === userResponse.trim().toLowerCase());

      if (idx >= 0) {
        const edgeByHandle = edges.find((e: any) => e.source === currentNodeId && e.sourceHandle === `btn-${idx}`);
        if (edgeByHandle) {
          return nodes.find((n: any) => n.id === edgeByHandle.target);
        }
      }
    }

    // Fallback: primeira aresta de saída
    const nextEdge = edges.find((e: any) => e.source === currentNodeId);
    if (nextEdge) {
      return nodes.find((n: any) => n.id === nextEdge.target);
    }
    
    return null;
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async (messageText?: string) => {
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

    // Salvar mensagem do usuário
    await saveMessage('user', textToSend);

    // Se estiver em modo atendimento humano, apenas salvar e aguardar resposta
    if (isHumanMode) {
      setIsLoading(false);
      return;
    }

    try {
      if (botData.type === 'agent') {
        // Processar com IA
        const { data, error } = await supabase.functions.invoke('process-ai-message', {
          body: {
            agentId: botId,
            message: textToSend,
            conversationHistory: messages.map(m => ({
              role: m.role === 'user' ? 'user' : 'assistant',
              content: m.content
            }))
          }
        });

        if (error) throw error;

        const botResponse: Message = {
          id: (Date.now() + 1).toString(),
          role: 'bot',
          content: data.response || "Desculpe, não consegui processar sua mensagem.",
          timestamp: new Date()
        };

        setMessages(prev => [...prev, botResponse]);
      } else {
        // Chatbot com fluxo - encontrar próximo nó
        const lastBotMessage = [...messages].reverse().find(m => m.role === 'bot');
        if (lastBotMessage?.nodeId) {
          const nextNode = findNextNode(lastBotMessage.nodeId, textToSend);
          
          if (nextNode) {
            setTimeout(() => {
              processNode(nextNode, botData.config.nodes, botData.config.edges);
              setIsLoading(false);
            }, 500);
            return;
          }
        }
        
        // Fim do fluxo - apenas finaliza sem mensagem adicional
        setTimeout(() => {
          setIsLoading(false);
        }, 500);
        return;
      }
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
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <div className="bg-primary/10 p-3 rounded-xl">
            {botData.type === 'agent' ? (
              <Sparkles className="w-6 h-6 text-primary" />
            ) : (
              <Bot className="w-6 h-6 text-primary" />
            )}
          </div>
          <div>
            <h1 className="text-xl font-bold">{botData.name}</h1>
            <p className="text-sm text-muted-foreground">
              {botData.type === 'agent' ? 'Agente IA' : 'Chatbot'}
            </p>
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
                  className={`max-w-[80%] sm:max-w-[70%] rounded-2xl px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground ml-auto'
                      : 'bg-card border border-border'
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
                  {message.buttons.map((button, idx) => (
                    <Button
                      key={idx}
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (button === 'Falar com atendente') {
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
                        } else if (button === 'Finalizar atendimento') {
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
                          handleSendMessage(button);
                        }
                      }}
                      className="rounded-full"
                    >
                      {button}
                    </Button>
                  ))}
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
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
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
