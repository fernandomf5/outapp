import { useState, useEffect, useRef } from 'react';
import { Node, Edge } from 'reactflow';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Bot, Send, RotateCcw, Loader2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Message {
  id: string;
  role: 'user' | 'bot';
  content: string;
  timestamp: Date;
  imageUrl?: string;
  buttons?: string[];
  nodeId?: string;
}

interface ChatPreviewProps {
  nodes: Node[];
  edges: Edge[];
  botName: string;
}

export const ChatPreview = ({ nodes, edges, botName }: ChatPreviewProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    initializeChat();
  }, [nodes, edges]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const initializeChat = () => {
    setMessages([]);
    setInputMessage('');
    
    // Encontrar nó inicial
    const triggerNode = nodes.find(n => n.type === 'trigger');
    
    if (triggerNode && edges.length > 0) {
      const firstEdge = edges.find(e => e.source === triggerNode.id);
      if (firstEdge) {
        const firstNode = nodes.find(n => n.id === firstEdge.target);
        if (firstNode) {
          processNode(firstNode);
          return;
        }
      }
    }

    // Nó sem entradas (start node)
    const incomingTargets = new Set(edges.map(e => e.target));
    const startCandidates = nodes.filter(n => n.type !== 'trigger' && !incomingTargets.has(n.id));

    if (startCandidates.length > 0) {
      const firstStart = [...startCandidates]
        .sort((a, b) => (a.position?.y || 0) - (b.position?.y || 0))[0];
      processNode(firstStart);
      return;
    }

    // Fallback: primeiro nó do canvas
    const firstNode = nodes
      .filter(n => n.type !== 'trigger')
      .sort((a, b) => (a.position?.y || 0) - (b.position?.y || 0))[0];

    if (firstNode) {
      processNode(firstNode);
    }
  };

  const processNode = (node: Node) => {
    if (node.type === 'message' || node.type === 'question' || node.type === 'quickReply' || node.type === 'button') {
      const newMessage: Message = {
        id: node.id,
        role: 'bot',
        content: node.data.label || '',
        timestamp: new Date(),
        imageUrl: node.data.imageUrl,
        buttons: node.data.buttons,
        nodeId: node.id
      };
      setMessages(prev => [...prev, newMessage]);
    }
  };

  const findNextNode = (currentNodeId: string, userResponse?: string): Node | null => {
    const currentNode = nodes.find(n => n.id === currentNodeId);

    const checkByIndex = (idx: number) => {
      const outgoing = edges.filter(e => e.source === currentNodeId);
      if (outgoing.length > idx) {
        return nodes.find(n => n.id === outgoing[idx].target) || null;
      }
      return null;
    };

    // Quick Reply, Botões e Perguntas com handles por botão
    if ((currentNode?.type === 'quickReply' || currentNode?.type === 'button' || currentNode?.type === 'question') && userResponse) {
      const btns: string[] = currentNode.data?.buttons || [];
      const idx = btns.findIndex(b => b?.trim().toLowerCase() === userResponse.trim().toLowerCase());

      if (idx >= 0) {
        const edgeByHandle = edges.find(e => e.source === currentNodeId && e.sourceHandle === `btn-${idx}`);
        if (edgeByHandle) {
          return nodes.find(n => n.id === edgeByHandle.target) || null;
        }
        // Fallback: usar a N-ésima aresta quando não houver sourceHandle
        const byIndex = checkByIndex(idx);
        if (byIndex) return byIndex;
      }
    }

    // Fallback: primeira aresta de saída
    const nextEdge = edges.find(e => e.source === currentNodeId);
    if (nextEdge) {
      return nodes.find(n => n.id === nextEdge.target) || null;
    }

    return null;
  };

  const handleSendMessage = (messageText?: string) => {
    const textToSend = messageText || inputMessage;
    if (!textToSend.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: textToSend,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    // Encontrar último nó do bot
    const lastBotMessage = [...messages].reverse().find(m => m.role === 'bot');
    
    if (lastBotMessage?.nodeId) {
      const nextNode = findNextNode(lastBotMessage.nodeId, textToSend);
      
      if (nextNode) {
        setTimeout(() => {
          processNode(nextNode);
          setIsLoading(false);
        }, 500);
        return;
      }
    }

    // Sem próximo nó - apenas finaliza sem mensagem
    setTimeout(() => {
      setIsLoading(false);
    }, 500);
  };

  const handleReset = () => {
    initializeChat();
  };

  return (
    <Card className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-primary/10 px-4 py-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-primary" />
          <div>
            <h3 className="font-semibold text-sm">Prévia do Chat</h3>
            <p className="text-xs text-muted-foreground">{botName || 'Teste seu fluxo'}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleReset}
          title="Reiniciar conversa"
        >
          <RotateCcw className="w-4 h-4" />
        </Button>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-3">
          {messages.map((message) => (
            <div key={message.id}>
              <div
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-xl px-3 py-2 ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  {message.imageUrl && (
                    <img 
                      src={message.imageUrl} 
                      alt="Imagem" 
                      className="w-full rounded-md mb-2 max-h-40 object-cover"
                    />
                  )}
                  <p className="text-xs whitespace-pre-wrap">{message.content}</p>
                  <span className="text-[10px] opacity-60 mt-1 block">
                    {message.timestamp.toLocaleTimeString('pt-BR', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </span>
                </div>
              </div>
              {message.buttons && message.buttons.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2 ml-1">
                  {message.buttons.map((button, idx) => (
                    <Button
                      key={idx}
                      variant="outline"
                      size="sm"
                      onClick={() => handleSendMessage(button)}
                      className="rounded-full text-xs h-7"
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
              <div className="bg-muted rounded-xl px-3 py-2">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-3 border-t border-border">
        <div className="flex gap-2">
          <Input
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
            placeholder="Digite uma mensagem..."
            disabled={isLoading}
            className="flex-1 h-9 text-sm"
          />
          <Button
            onClick={() => handleSendMessage()}
            disabled={!inputMessage.trim() || isLoading}
            size="icon"
            className="h-9 w-9"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
};
