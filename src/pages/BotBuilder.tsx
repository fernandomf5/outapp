import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Plus,
  MessageSquare,
  MousePointer2,
  Save,
  Play,
  Trash2,
  Clock,
  Zap,
  Users,
  BarChart3,
  Tag,
  Split,
  Grid3x3,
  FileText,
} from "lucide-react";

interface FlowNode {
  id: string;
  type: "trigger" | "message" | "question" | "action" | "quick-reply" | "condition" | "collect-data" | "transfer";
  content: string;
  position: { x: number; y: number };
  connections: string[];
  config?: {
    buttons?: string[];
    condition?: string;
    fields?: { name: string; type: string }[];
  };
}

const BotBuilder = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [botName, setBotName] = useState("Novo Chatbot");
  const [nodes, setNodes] = useState<FlowNode[]>([
    {
      id: "1",
      type: "trigger",
      content: "Quando receber mensagem",
      position: { x: 50, y: 50 },
      connections: [],
    },
  ]);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  const addNode = (type: FlowNode["type"]) => {
    const newNode: FlowNode = {
      id: Date.now().toString(),
      type,
      content: type === "message" ? "Digite sua mensagem..." : type === "question" ? "Faça uma pergunta..." : "Ação",
      position: { x: 50 + nodes.length * 50, y: 150 + nodes.length * 30 },
      connections: [],
    };
    setNodes([...nodes, newNode]);
    setSelectedNode(newNode.id);
  };

  const deleteNode = (id: string) => {
    if (nodes.length <= 1) {
      toast({
        title: "Não é possível excluir",
        description: "Você precisa ter pelo menos um bloco no fluxo.",
        variant: "destructive",
      });
      return;
    }
    setNodes(nodes.filter(node => node.id !== id));
    setSelectedNode(null);
  };

  const updateNodeContent = (id: string, content: string) => {
    setNodes(nodes.map(node => node.id === id ? { ...node, content } : node));
  };

  const handleSave = () => {
    toast({
      title: "Chatbot salvo! 💾",
      description: "Suas alterações foram salvas com sucesso.",
    });
  };

  const handleTest = () => {
    toast({
      title: "Teste iniciado! 🧪",
      description: "Abra o WhatsApp para testar seu chatbot.",
    });
  };

  const selectedNodeData = nodes.find(n => n.id === selectedNode);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary-light/20 to-background flex flex-col">
      {/* Header */}
      <header className="bg-card/95 backdrop-blur-sm border-b border-border px-6 py-5 shadow-md">
        <div className="max-w-full flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate("/dashboard")}
              className="hover:bg-primary/10 hover:scale-110 transition-smooth"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <Input
              value={botName}
              onChange={(e) => setBotName(e.target.value)}
              className="text-xl font-bold border-none bg-transparent max-w-xs focus-visible:ring-0"
            />
          </div>

          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              onClick={handleTest}
              className="hover:bg-primary/10 hover:border-primary hover:scale-105 transition-smooth"
            >
              <Play className="w-4 h-4 mr-2" />
              Testar Bot
            </Button>
            <Button 
              onClick={handleSave} 
              className="gradient-primary hover:scale-105 transition-smooth shadow-md hover:shadow-glow"
            >
              <Save className="w-4 h-4 mr-2" />
              Salvar Alterações
            </Button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex">
        {/* Sidebar - Node Types */}
        <aside className="w-72 bg-card/80 backdrop-blur-sm border-r border-border p-5 space-y-4 overflow-y-auto shadow-lg">
          <div className="mb-6">
            <h3 className="font-bold text-base text-foreground mb-2 flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              BLOCOS BÁSICOS
            </h3>
            <p className="text-xs text-muted-foreground">Clique para adicionar ao fluxo</p>
          </div>

          <Card
            className="p-4 cursor-pointer hover:bg-primary/10 hover:border-primary hover:shadow-lg hover:scale-105 transition-smooth border-2"
            onClick={() => addNode("message")}
          >
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-primary/20 to-primary/10 p-3 rounded-xl">
                <MessageSquare className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h4 className="font-semibold text-sm">Enviar Mensagem</h4>
                <p className="text-xs text-muted-foreground">Texto automático</p>
              </div>
            </div>
          </Card>

          <Card
            className="p-4 cursor-pointer hover:bg-primary/10 hover:border-primary hover:shadow-lg hover:scale-105 transition-smooth border-2"
            onClick={() => addNode("question")}
          >
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-primary/20 to-primary/10 p-3 rounded-xl">
                <MessageSquare className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h4 className="font-semibold text-sm">Fazer Pergunta</h4>
                <p className="text-xs text-muted-foreground">Coletar resposta</p>
              </div>
            </div>
          </Card>

          <div className="mb-6 mt-8">
            <h3 className="font-bold text-base text-foreground mb-2 flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              BLOCOS AVANÇADOS
            </h3>
            <p className="text-xs text-muted-foreground">Recursos profissionais</p>
          </div>

          <Card
            className="p-4 cursor-pointer hover:bg-primary/10 hover:border-primary hover:shadow-lg hover:scale-105 transition-smooth border-2"
            onClick={() => addNode("quick-reply")}
          >
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-primary/20 to-primary/10 p-3 rounded-xl">
                <Grid3x3 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h4 className="font-semibold text-sm">Botões Rápidos</h4>
                <p className="text-xs text-muted-foreground">Menu de opções</p>
              </div>
            </div>
          </Card>

          <Card
            className="p-4 cursor-pointer hover:bg-primary/10 hover:border-primary hover:shadow-lg hover:scale-105 transition-smooth border-2"
            onClick={() => addNode("condition")}
          >
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-primary/20 to-primary/10 p-3 rounded-xl">
                <Split className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h4 className="font-semibold text-sm">Condição</h4>
                <p className="text-xs text-muted-foreground">Fluxo condicional</p>
              </div>
            </div>
          </Card>

          <Card
            className="p-4 cursor-pointer hover:bg-primary/10 hover:border-primary hover:shadow-lg hover:scale-105 transition-smooth border-2"
            onClick={() => addNode("collect-data")}
          >
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-primary/20 to-primary/10 p-3 rounded-xl">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h4 className="font-semibold text-sm">Coletar Dados</h4>
                <p className="text-xs text-muted-foreground">Formulário</p>
              </div>
            </div>
          </Card>

          <Card
            className="p-4 cursor-pointer hover:bg-primary/10 hover:border-primary hover:shadow-lg hover:scale-105 transition-smooth border-2"
            onClick={() => addNode("transfer")}
          >
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-primary/20 to-primary/10 p-3 rounded-xl">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h4 className="font-semibold text-sm">Transferir</h4>
                <p className="text-xs text-muted-foreground">Para humano</p>
              </div>
            </div>
          </Card>

          <Card
            className="p-4 cursor-pointer hover:bg-primary/10 hover:border-primary hover:shadow-lg hover:scale-105 transition-smooth border-2"
            onClick={() => addNode("action")}
          >
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-primary/20 to-primary/10 p-3 rounded-xl">
                <MousePointer2 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h4 className="font-semibold text-sm">Ação</h4>
                <p className="text-xs text-muted-foreground">Lógica extra</p>
              </div>
            </div>
          </Card>

          <div className="mb-6 mt-8">
            <h3 className="font-bold text-base text-foreground mb-2 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              CONFIGURAÇÕES
            </h3>
            <p className="text-xs text-muted-foreground">Ajustes do bot</p>
          </div>

          <Card className="p-4 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20 hover:scale-105 transition-smooth cursor-pointer">
            <div className="flex items-center gap-3 mb-2">
              <Clock className="w-5 h-5 text-primary" />
              <h4 className="font-semibold text-sm">Horário de Atendimento</h4>
            </div>
            <p className="text-xs text-muted-foreground">Seg-Sex: 8h-18h</p>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20 hover:scale-105 transition-smooth cursor-pointer">
            <div className="flex items-center gap-3 mb-2">
              <Tag className="w-5 h-5 text-primary" />
              <h4 className="font-semibold text-sm">Palavras-Chave</h4>
            </div>
            <p className="text-xs text-muted-foreground">5 triggers configurados</p>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20 hover:scale-105 transition-smooth cursor-pointer">
            <div className="flex items-center gap-3 mb-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              <h4 className="font-semibold text-sm">Analytics</h4>
            </div>
            <p className="text-xs text-muted-foreground">Ver métricas detalhadas</p>
          </Card>
        </aside>

        {/* Canvas - Flow Builder */}
        <main className="flex-1 bg-gradient-to-br from-accent/20 via-background to-accent/30 p-10 overflow-auto">
          <div className="space-y-6 max-w-5xl mx-auto">
            <div className="mb-8 text-center">
              <h2 className="text-2xl font-bold text-foreground mb-2">Fluxo de Conversação</h2>
              <p className="text-muted-foreground">Clique nos blocos para editar • Arraste para reordenar</p>
            </div>

            {nodes.map((node, index) => (
              <div key={node.id} className="relative">
                <Card
                  className={`p-6 cursor-pointer transition-smooth hover:scale-[1.02] ${
                    selectedNode === node.id
                      ? "border-primary border-2 shadow-glow bg-primary/5"
                      : "hover:border-primary/50 hover:shadow-lg bg-card/95 backdrop-blur-sm"
                  }`}
                  onClick={() => setSelectedNode(node.id)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-4">
                      <div className="bg-gradient-to-br from-primary/20 to-primary/10 p-3 rounded-xl shadow-md">
                        {node.type === "trigger" && <Play className="w-6 h-6 text-primary" />}
                        {node.type === "message" && <MessageSquare className="w-6 h-6 text-primary" />}
                        {node.type === "question" && <MessageSquare className="w-6 h-6 text-primary" />}
                        {node.type === "action" && <MousePointer2 className="w-6 h-6 text-primary" />}
                        {node.type === "quick-reply" && <Grid3x3 className="w-6 h-6 text-primary" />}
                        {node.type === "condition" && <Split className="w-6 h-6 text-primary" />}
                        {node.type === "collect-data" && <FileText className="w-6 h-6 text-primary" />}
                        {node.type === "transfer" && <Users className="w-6 h-6 text-primary" />}
                      </div>
                      <div>
                        <span className="text-sm font-bold text-primary uppercase tracking-wide">
                          {node.type === "trigger" && "🚀 Gatilho"}
                          {node.type === "message" && "💬 Mensagem"}
                          {node.type === "question" && "❓ Pergunta"}
                          {node.type === "action" && "⚡ Ação"}
                          {node.type === "quick-reply" && "🔘 Botões Rápidos"}
                          {node.type === "condition" && "🔀 Condição"}
                          {node.type === "collect-data" && "📝 Coletar Dados"}
                          {node.type === "transfer" && "👤 Transferir"}
                        </span>
                      </div>
                    </div>
                    {node.type !== "trigger" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNode(node.id);
                        }}
                        className="hover:bg-destructive/10 hover:scale-110 transition-smooth"
                      >
                        <Trash2 className="w-5 h-5 text-destructive" />
                      </Button>
                    )}
                  </div>
                  <p className="text-foreground text-base pl-16">{node.content}</p>
                </Card>
                {index < nodes.length - 1 && (
                  <div className="flex justify-center my-4">
                    <div className="w-1 h-12 bg-gradient-to-b from-primary via-primary/50 to-primary rounded-full"></div>
                  </div>
                )}
              </div>
            ))}

            <Button
              variant="outline"
              className="w-full border-dashed border-2 py-8 hover:bg-primary/10 hover:border-primary hover:scale-105 transition-smooth text-base font-semibold"
              onClick={() => addNode("message")}
            >
              <Plus className="w-5 h-5 mr-2" />
              Adicionar Novo Bloco ao Fluxo
            </Button>
          </div>
        </main>

        {/* Properties Panel */}
        {selectedNodeData && (
          <aside className="w-96 bg-card/95 backdrop-blur-sm border-l border-border p-6 space-y-6 shadow-lg">
            <div>
              <h3 className="font-bold text-xl mb-4 flex items-center gap-2">
                <Zap className="w-6 h-6 text-primary" />
                Editar Bloco
              </h3>
              <div className="flex items-center gap-4 mb-6 p-4 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl border border-primary/20">
                <div className="bg-gradient-to-br from-primary/30 to-primary/10 p-3 rounded-xl shadow-md">
                  {selectedNodeData.type === "trigger" && <Play className="w-6 h-6 text-primary" />}
                  {selectedNodeData.type === "message" && <MessageSquare className="w-6 h-6 text-primary" />}
                  {selectedNodeData.type === "question" && <MessageSquare className="w-6 h-6 text-primary" />}
                  {selectedNodeData.type === "action" && <MousePointer2 className="w-6 h-6 text-primary" />}
                  {selectedNodeData.type === "quick-reply" && <Grid3x3 className="w-6 h-6 text-primary" />}
                  {selectedNodeData.type === "condition" && <Split className="w-6 h-6 text-primary" />}
                  {selectedNodeData.type === "collect-data" && <FileText className="w-6 h-6 text-primary" />}
                  {selectedNodeData.type === "transfer" && <Users className="w-6 h-6 text-primary" />}
                </div>
                <span className="font-bold text-base">
                  {selectedNodeData.type === "trigger" && "Gatilho"}
                  {selectedNodeData.type === "message" && "Mensagem"}
                  {selectedNodeData.type === "question" && "Pergunta"}
                  {selectedNodeData.type === "action" && "Ação"}
                  {selectedNodeData.type === "quick-reply" && "Botões Rápidos"}
                  {selectedNodeData.type === "condition" && "Condição"}
                  {selectedNodeData.type === "collect-data" && "Coletar Dados"}
                  {selectedNodeData.type === "transfer" && "Transferir"}
                </span>
              </div>
            </div>

            {selectedNodeData.type !== "trigger" && (
              <div className="space-y-5">
                <div>
                  <label className="text-sm font-semibold mb-3 block">Conteúdo do Bloco</label>
                  <Textarea
                    value={selectedNodeData.content}
                    onChange={(e) => updateNodeContent(selectedNodeData.id, e.target.value)}
                    placeholder="Digite o conteúdo do bloco..."
                    rows={8}
                    className="border-2 focus:border-primary transition-smooth"
                  />
                </div>

                <div className="p-5 bg-gradient-to-br from-accent/70 to-accent/50 rounded-xl border border-primary/10">
                  <h4 className="font-bold text-sm mb-3 flex items-center gap-2">
                    <span className="text-xl">💡</span>
                    Dicas Profissionais
                  </h4>
                  <ul className="text-xs text-muted-foreground space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span>Use {"{nome}"} para personalizar mensagens</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span>Quebre linhas para facilitar leitura</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span>Seja claro, direto e objetivo</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span>Use emojis para tornar mais amigável</span>
                    </li>
                  </ul>
                </div>
              </div>
            )}
          </aside>
        )}
      </div>
    </div>
  );
};

export default BotBuilder;
