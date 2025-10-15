import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bot, Send, Loader2, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: string;
  role: "user" | "bot";
  content: string;
  timestamp: Date;
}

const PublicChat = () => {
  const { botId } = useParams();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [botData, setBotData] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchBotData();
  }, [botId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
      const config = chatbot.config as any || {};
      setMessages([{
        id: '1',
        role: 'bot',
        content: config.welcomeMessage || 'Olá! Como posso ajudar você hoje?',
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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !botData) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    try {
      if (botData.type === 'agent') {
        // Processar com IA
        const { data, error } = await supabase.functions.invoke('process-ai-message', {
          body: {
            agentId: botId,
            message: inputMessage,
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
        // Chatbot simples - resposta baseada em config
        const config = (botData.config as any) || {};
        let response = "Obrigado pela sua mensagem! Como posso ajudar?";

        // Lógica básica de resposta
        const lowerMessage = inputMessage.toLowerCase();
        if (lowerMessage.includes('preço') || lowerMessage.includes('valor')) {
          response = config.pricing || "Entre em contato para informações sobre preços.";
        } else if (lowerMessage.includes('horário') || lowerMessage.includes('funciona')) {
          response = config.schedule || "Estamos disponíveis de segunda a sexta, das 9h às 18h.";
        } else if (lowerMessage.includes('localização') || lowerMessage.includes('endereço')) {
          response = config.location || "Nossa localização está disponível no site.";
        }

        const botResponse: Message = {
          id: (Date.now() + 1).toString(),
          role: 'bot',
          content: response,
          timestamp: new Date()
        };

        setTimeout(() => {
          setMessages(prev => [...prev, botResponse]);
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
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] sm:max-w-[70%] rounded-2xl px-4 py-3 ${
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground ml-auto'
                    : 'bg-card border border-border'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                <span className="text-xs opacity-70 mt-1 block">
                  {message.timestamp.toLocaleTimeString('pt-BR', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </span>
              </div>
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
        <div className="max-w-4xl mx-auto flex gap-2">
          <Input
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
            placeholder="Digite sua mensagem..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button
            onClick={handleSendMessage}
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
