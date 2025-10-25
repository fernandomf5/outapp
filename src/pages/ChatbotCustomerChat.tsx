import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Send, LogOut } from "lucide-react";

interface Message {
  id: string;
  role: 'user' | 'bot';
  content: string;
  created_at: string;
}

export default function ChatbotCustomerChat() {
  const { chatbotId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [customer, setCustomer] = useState<any>(null);
  const [chatbotInfo, setChatbotInfo] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check authentication
    const customerData = localStorage.getItem(`chatbot_customer_${chatbotId}`);
    if (!customerData) {
      navigate(`/chatbot-auth/${chatbotId}`);
      return;
    }

    const parsedCustomer = JSON.parse(customerData);
    setCustomer(parsedCustomer);

    loadChatbotAndConversation(parsedCustomer.id);
    setupRealtimeSubscription();
  }, [chatbotId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadChatbotAndConversation = async (customerId: string) => {
    // Load chatbot info
    const { data: chatbot } = await supabase
      .from('chatbots')
      .select('*')
      .eq('id', chatbotId)
      .single();

    setChatbotInfo(chatbot);

    // Load or create conversation
    const { data: existingConv } = await supabase
      .from('chatbot_conversations')
      .select('*')
      .eq('chatbot_id', chatbotId)
      .eq('visitor_email', customer?.email)
      .eq('status', 'active')
      .single();

    if (existingConv) {
      setConversationId(existingConv.id);
      loadMessages(existingConv.id);
    } else {
      const sessionId = `customer_${customerId}_${Date.now()}`;
      const { data: newConv } = await supabase
        .from('chatbot_conversations')
        .insert({
          chatbot_id: chatbotId,
          session_id: sessionId,
          visitor_email: customer?.email,
          visitor_name: customer?.name,
          visitor_phone: customer?.phone,
        })
        .select()
        .single();

      setConversationId(newConv.id);
    }
  };

  const loadMessages = async (convId: string) => {
    const { data } = await supabase
      .from('chatbot_messages')
      .select('*')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true });

    setMessages((data || []) as Message[]);
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel('chatbot-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chatbot_messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleSendMessage = async () => {
    if (!input.trim() || !conversationId || !customer) return;

    setLoading(true);
    const userMessage = input;
    setInput("");

    try {
      // Save user message
      await supabase.from('chatbot_messages').insert({
        conversation_id: conversationId,
        role: 'user',
        content: userMessage,
      });

      // Process with AI
      const { data, error } = await supabase.functions.invoke('process-ai-message', {
        body: {
          chatbotId,
          conversationId,
          message: userMessage,
          sessionId: conversationId,
        }
      });

      if (error) throw error;

      // Save bot response
      if (data?.response) {
        await supabase.from('chatbot_messages').insert({
          conversation_id: conversationId,
          role: 'bot',
          content: data.response,
        });
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(`chatbot_customer_${chatbotId}`);
    navigate(`/chatbot-auth/${chatbotId}`);
  };

  return (
    <div className="min-h-screen gradient-primary">
      <div className="container mx-auto max-w-4xl h-screen flex flex-col p-4">
        <Card className="flex-1 flex flex-col">
          <div className="p-4 border-b flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">{chatbotInfo?.name || 'Chat'}</h2>
              <p className="text-sm text-muted-foreground">Olá, {customer?.name}!</p>
            </div>
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="w-5 h-5" />
            </Button>
          </div>

          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{message.content}</p>
                    <span className="text-xs opacity-70 mt-1 block">
                      {new Date(message.created_at).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          <div className="p-4 border-t">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Digite sua mensagem..."
                disabled={loading}
              />
              <Button onClick={handleSendMessage} disabled={loading || !input.trim()}>
                <Send className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
