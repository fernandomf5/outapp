import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { QrCode, Smartphone, CheckCircle2, ArrowLeft } from "lucide-react";

const WhatsAppConnect = () => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleConnect = () => {
    setIsConnecting(true);
    
    // Simular conexão após 3 segundos
    setTimeout(() => {
      setIsConnecting(false);
      setIsConnected(true);
      toast({
        title: "WhatsApp Conectado! ✅",
        description: "Sua conta está pronta para usar chatbots.",
      });
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Conectar WhatsApp</h1>
            <p className="text-sm text-muted-foreground">Configure sua conexão em segundos</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {!isConnected ? (
          <div className="grid md:grid-cols-2 gap-8 items-start">
            {/* QR Code Area */}
            <Card className="p-8 text-center">
              <div className="mb-6">
                <h2 className="text-2xl font-bold mb-2">Escaneie o QR Code</h2>
                <p className="text-muted-foreground">
                  Use seu WhatsApp para escanear o código
                </p>
              </div>

              {!isConnecting ? (
                <div className="bg-accent/30 rounded-2xl p-8 mb-6">
                  <QrCode className="w-48 h-48 mx-auto text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mt-4">
                    Clique em "Gerar QR Code" para começar
                  </p>
                </div>
              ) : (
                <div className="bg-accent/30 rounded-2xl p-8 mb-6 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
                </div>
              )}

              <Button
                onClick={handleConnect}
                disabled={isConnecting}
                className="w-full gradient-primary shadow-glow"
                size="lg"
              >
                {isConnecting ? "Aguardando conexão..." : "Gerar QR Code"}
              </Button>
            </Card>

            {/* Instructions */}
            <div className="space-y-6">
              <Card className="p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Smartphone className="w-6 h-6 text-primary" />
                  Como Conectar
                </h3>
                <ol className="space-y-4 text-muted-foreground">
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-primary/20 text-primary rounded-full flex items-center justify-center text-sm font-semibold">
                      1
                    </span>
                    <span>Abra o WhatsApp no seu celular</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-primary/20 text-primary rounded-full flex items-center justify-center text-sm font-semibold">
                      2
                    </span>
                    <span>Toque em Menu (⋮) ou Configurações</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-primary/20 text-primary rounded-full flex items-center justify-center text-sm font-semibold">
                      3
                    </span>
                    <span>Selecione "Aparelhos conectados"</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-primary/20 text-primary rounded-full flex items-center justify-center text-sm font-semibold">
                      4
                    </span>
                    <span>Toque em "Conectar um aparelho"</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-primary/20 text-primary rounded-full flex items-center justify-center text-sm font-semibold">
                      5
                    </span>
                    <span>Escaneie o QR code exibido na tela</span>
                  </li>
                </ol>
              </Card>

              <Card className="p-6 bg-primary/5 border-primary/20">
                <h3 className="text-lg font-semibold mb-2 text-primary">
                  💡 Dica Importante
                </h3>
                <p className="text-sm text-muted-foreground">
                  Certifique-se de que seu celular está conectado à internet e que o
                  WhatsApp está atualizado para a versão mais recente.
                </p>
              </Card>
            </div>
          </div>
        ) : (
          <Card className="p-12 text-center max-w-2xl mx-auto">
            <div className="bg-success/10 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-12 h-12 text-success" />
            </div>
            
            <h2 className="text-3xl font-bold mb-4">WhatsApp Conectado! 🎉</h2>
            <p className="text-muted-foreground mb-8 text-lg">
              Sua conta está pronta para começar a usar chatbots e agentes IA.
            </p>

            <div className="flex gap-4 justify-center">
              <Button
                onClick={() => navigate("/bot-builder")}
                className="gradient-primary shadow-glow"
                size="lg"
              >
                Criar Chatbot
              </Button>
              <Button
                onClick={() => navigate("/ai-agent")}
                variant="outline"
                size="lg"
              >
                Criar Agente IA
              </Button>
            </div>

            <Button
              onClick={() => navigate("/dashboard")}
              variant="ghost"
              className="mt-6"
            >
              Voltar ao Dashboard
            </Button>
          </Card>
        )}
      </main>
    </div>
  );
};

export default WhatsAppConnect;
