import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle, Bot, Loader2, Send, RefreshCw, Phone } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useWhatsApp } from "@/hooks/useWhatsApp";
import { useAuth } from "@/contexts/AuthContext";

const WhatsAppConnect = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { connection, isConnecting, connect, disconnect } = useWhatsApp();
  
  const [testPhone, setTestPhone] = useState("");
  const [testMessage, setTestMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  const handleConnect = async () => {
    if (!user?.id) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado para conectar o WhatsApp",
        variant: "destructive"
      });
      return;
    }
    
    try {
      await connect(user.id);
    } catch (error) {
      console.error('Erro ao conectar:', error);
    }
  };

  const handleDisconnect = async () => {
    if (!user?.id || !connection) return;
    
    try {
      await disconnect(user.id, connection.phone_number);
    } catch (error) {
      console.error('Erro ao desconectar:', error);
    }
  };

  const handleSendTestMessage = async () => {
    if (!testPhone || !testMessage || !connection) {
      toast({
        title: "Erro",
        description: "Preencha o número e a mensagem",
        variant: "destructive"
      });
      return;
    }

    setIsSending(true);
    try {
      const response = await fetch(
        `https://mlocikcfxbleddsvxciv.supabase.co/functions/v1/whatsapp-webhook`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'send_message',
            message: {
              to: testPhone,
              text: testMessage
            }
          })
        }
      );

      if (!response.ok) throw new Error('Erro ao enviar mensagem');

      toast({
        title: "Mensagem Enviada! ✅",
        description: `Mensagem enviada para ${testPhone}`
      });
      
      setTestMessage("");
    } catch (error) {
      console.error('Erro ao enviar:', error);
      toast({
        title: "Erro ao Enviar",
        description: "Não foi possível enviar a mensagem",
        variant: "destructive"
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">WhatsApp Business API</h1>
            <p className="text-sm text-muted-foreground">
              Conecte e teste seu número do WhatsApp Business
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        {!connection?.is_connected ? (
          <Card className="p-8 glass">
            <div className="mb-6 text-center">
              <h2 className="text-2xl font-bold mb-2">Conectar WhatsApp Business</h2>
              <p className="text-muted-foreground">
                Configure suas credenciais da API oficial do Meta
              </p>
            </div>

            <div className="space-y-6">
              <div className="bg-accent/30 rounded-xl p-6">
                <h3 className="font-semibold mb-3">📋 Credenciais Necessárias:</h3>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>✅ <strong>WHATSAPP_ACCESS_TOKEN</strong> - Token de acesso do Meta</p>
                  <p>✅ <strong>WHATSAPP_PHONE_NUMBER_ID</strong> - ID do número de telefone</p>
                </div>
              </div>

              <div className="bg-primary/5 rounded-xl p-6 border border-primary/20">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Phone className="w-5 h-5 text-primary" />
                  Onde Encontrar?
                </h3>
                <ol className="space-y-2 text-sm text-muted-foreground">
                  <li>1. Acesse <a href="https://developers.facebook.com" target="_blank" className="text-primary hover:underline">Meta for Developers</a></li>
                  <li>2. Vá em <strong>WhatsApp {'>'} API Setup</strong></li>
                  <li>3. Copie o <strong>Phone Number ID</strong></li>
                  <li>4. Copie o <strong>Access Token</strong> (temporário ou permanente)</li>
                  <li>5. Configure os secrets no Supabase</li>
                </ol>
              </div>

              <Button
                onClick={handleConnect}
                disabled={isConnecting}
                className="w-full gradient-primary shadow-glow"
                size="lg"
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Conectando...
                  </>
                ) : (
                  "Conectar WhatsApp Business"
                )}
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                💡 Certifique-se de que as credenciais foram configuradas nos secrets do Supabase antes de conectar
              </p>
            </div>
          </Card>
        ) : (
          <div className="animate-fade-in space-y-6">
            {/* Connection Status */}
            <Card className="p-6 glass">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-success rounded-full animate-pulse"></div>
                  <div>
                    <h3 className="font-semibold">WhatsApp Conectado</h3>
                    <p className="text-sm text-muted-foreground">
                      Número: {connection.phone_number}
                    </p>
                  </div>
                </div>
                <Button variant="outline" onClick={handleDisconnect}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Desconectar
                </Button>
              </div>
            </Card>

            {/* Test Message */}
            <Card className="p-6 glass">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-primary/10 p-3 rounded-xl">
                  <Send className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Enviar Mensagem de Teste</h2>
                  <p className="text-sm text-muted-foreground">
                    Teste o envio de mensagens via API oficial
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Número de Destino (com código do país)
                  </label>
                  <Input
                    value={testPhone}
                    onChange={(e) => setTestPhone(e.target.value)}
                    placeholder="Ex: 5511999999999"
                    type="tel"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Formato: código do país + DDD + número (sem espaços ou símbolos)
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Mensagem</label>
                  <Textarea
                    value={testMessage}
                    onChange={(e) => setTestMessage(e.target.value)}
                    placeholder="Digite sua mensagem de teste..."
                    rows={4}
                  />
                </div>

                <Button
                  onClick={handleSendTestMessage}
                  disabled={isSending || !testPhone || !testMessage}
                  className="w-full gradient-primary"
                  size="lg"
                >
                  {isSending ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5 mr-2" />
                      Enviar Mensagem de Teste
                    </>
                  )}
                </Button>
              </div>
            </Card>

            {/* Next Steps */}
            <Card className="p-6 bg-primary/5 border-primary/20">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-success" />
                Próximos Passos
              </h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>✅ Configure seu chatbot em <strong>Bot Builder</strong></li>
                <li>✅ Crie agentes de IA em <strong>AI Agent Builder</strong></li>
                <li>✅ Monitore mensagens e analytics no Dashboard</li>
                <li>✅ Para produção: verifique sua conta Meta Business</li>
              </ul>
              
              <div className="flex gap-3 mt-4">
                <Button variant="outline" onClick={() => navigate("/bot-builder")}>
                  <Bot className="w-4 h-4 mr-2" />
                  Bot Builder
                </Button>
                <Button variant="outline" onClick={() => navigate("/ai-agent")}>
                  <Bot className="w-4 h-4 mr-2" />
                  AI Agent
                </Button>
              </div>
            </Card>
          </div>

        )}
      </main>
    </div>
  );
};

export default WhatsAppConnect;
