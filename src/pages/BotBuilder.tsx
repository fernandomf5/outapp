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
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-card border-b border-border px-6 py-4">
        <div className="max-w-full flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <Input
              value={botName}
              onChange={(e) => setBotName(e.target.value)}
              className="text-xl font-bold border-none bg-transparent max-w-xs"
            />
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={handleTest}>
              <Play className="w-4 h-4 mr-2" />
              Testar
            </Button>
            <Button onClick={handleSave} className="gradient-primary">
              <Save className="w-4 h-4 mr-2" />
              Salvar
            </Button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex">
        {/* Sidebar - Node Types */}
        <aside className="w-64 bg-card border-r border-border p-4 space-y-3 overflow-y-auto">
          <h3 className="font-semibold text-sm text-muted-foreground mb-4">
            BLOCOS BÁSICOS
          </h3>

          <Card
            className="p-3 cursor-pointer hover:bg-primary/5 hover:border-primary transition-smooth"
            onClick={() => addNode("message")}
          >
            <div className="flex items-center gap-2">
              <div className="bg-primary/10 p-2 rounded-lg">
                <MessageSquare className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h4 className="font-semibold text-xs">Enviar Mensagem</h4>
                <p className="text-xs text-muted-foreground">Texto automático</p>
              </div>
            </div>
          </Card>

          <Card
            className="p-3 cursor-pointer hover:bg-primary/5 hover:border-primary transition-smooth"
            onClick={() => addNode("question")}
          >
            <div className="flex items-center gap-2">
              <div className="bg-primary/10 p-2 rounded-lg">
                <MessageSquare className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h4 className="font-semibold text-xs">Fazer Pergunta</h4>
                <p className="text-xs text-muted-foreground">Coletar resposta</p>
              </div>
            </div>
          </Card>

          <h3 className="font-semibold text-sm text-muted-foreground mb-4 mt-6">
            BLOCOS AVANÇADOS
          </h3>

          <Card
            className="p-3 cursor-pointer hover:bg-primary/5 hover:border-primary transition-smooth"
            onClick={() => addNode("quick-reply")}
          >
            <div className="flex items-center gap-2">
              <div className="bg-primary/10 p-2 rounded-lg">
                <Grid3x3 className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h4 className="font-semibold text-xs">Botões Rápidos</h4>
                <p className="text-xs text-muted-foreground">Menu de opções</p>
              </div>
            </div>
          </Card>

          <Card
            className="p-3 cursor-pointer hover:bg-primary/5 hover:border-primary transition-smooth"
            onClick={() => addNode("condition")}
          >
            <div className="flex items-center gap-2">
              <div className="bg-primary/10 p-2 rounded-lg">
                <Split className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h4 className="font-semibold text-xs">Condição</h4>
                <p className="text-xs text-muted-foreground">Fluxo condicional</p>
              </div>
            </div>
          </Card>

          <Card
            className="p-3 cursor-pointer hover:bg-primary/5 hover:border-primary transition-smooth"
            onClick={() => addNode("collect-data")}
          >
            <div className="flex items-center gap-2">
              <div className="bg-primary/10 p-2 rounded-lg">
                <FileText className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h4 className="font-semibold text-xs">Coletar Dados</h4>
                <p className="text-xs text-muted-foreground">Formulário</p>
              </div>
            </div>
          </Card>

          <Card
            className="p-3 cursor-pointer hover:bg-primary/5 hover:border-primary transition-smooth"
            onClick={() => addNode("transfer")}
          >
            <div className="flex items-center gap-2">
              <div className="bg-primary/10 p-2 rounded-lg">
                <Users className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h4 className="font-semibold text-xs">Transferir</h4>
                <p className="text-xs text-muted-foreground">Para humano</p>
              </div>
            </div>
          </Card>

          <Card
            className="p-3 cursor-pointer hover:bg-primary/5 hover:border-primary transition-smooth"
            onClick={() => addNode("action")}
          >
            <div className="flex items-center gap-2">
              <div className="bg-primary/10 p-2 rounded-lg">
                <MousePointer2 className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h4 className="font-semibold text-xs">Ação</h4>
                <p className="text-xs text-muted-foreground">Lógica extra</p>
              </div>
            </div>
          </Card>

          <h3 className="font-semibold text-sm text-muted-foreground mb-4 mt-6">
            CONFIGURAÇÕES
          </h3>

          <Card className="p-3 bg-accent/50">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-primary" />
              <h4 className="font-semibold text-xs">Horário</h4>
            </div>
            <p className="text-xs text-muted-foreground">Seg-Sex: 8h-18h</p>
          </Card>

          <Card className="p-3 bg-accent/50">
            <div className="flex items-center gap-2 mb-3">
              <Tag className="w-4 h-4 text-primary" />
              <h4 className="font-semibold text-xs">Triggers</h4>
            </div>
            <p className="text-xs text-muted-foreground">Palavras-chave: 5</p>
          </Card>

          <Card className="p-3 bg-accent/50">
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 className="w-4 h-4 text-primary" />
              <h4 className="font-semibold text-xs">Analytics</h4>
            </div>
            <p className="text-xs text-muted-foreground">Ver métricas</p>
          </Card>
        </aside>

        {/* Canvas - Flow Builder */}
        <main className="flex-1 bg-accent/30 p-8 overflow-auto">
          <div className="space-y-4 max-w-4xl">
            {nodes.map((node, index) => (
              <Card
                key={node.id}
                className={`p-6 cursor-pointer transition-smooth ${
                  selectedNode === node.id
                    ? "border-primary shadow-glow"
                    : "hover:border-primary/50"
                }`}
                onClick={() => setSelectedNode(node.id)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 p-2 rounded-lg">
                      {node.type === "trigger" && <Play className="w-5 h-5 text-primary" />}
                      {node.type === "message" && <MessageSquare className="w-5 h-5 text-primary" />}
                      {node.type === "question" && <MessageSquare className="w-5 h-5 text-primary" />}
                      {node.type === "action" && <MousePointer2 className="w-5 h-5 text-primary" />}
                      {node.type === "quick-reply" && <Grid3x3 className="w-5 h-5 text-primary" />}
                      {node.type === "condition" && <Split className="w-5 h-5 text-primary" />}
                      {node.type === "collect-data" && <FileText className="w-5 h-5 text-primary" />}
                      {node.type === "transfer" && <Users className="w-5 h-5 text-primary" />}
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-primary uppercase">
                        {node.type === "trigger" && "Gatilho"}
                        {node.type === "message" && "Mensagem"}
                        {node.type === "question" && "Pergunta"}
                        {node.type === "action" && "Ação"}
                        {node.type === "quick-reply" && "Botões Rápidos"}
                        {node.type === "condition" && "Condição"}
                        {node.type === "collect-data" && "Coletar Dados"}
                        {node.type === "transfer" && "Transferir"}
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
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  )}
                </div>
                <p className="text-foreground">{node.content}</p>
                {index < nodes.length - 1 && (
                  <div className="mt-4 flex justify-center">
                    <div className="w-px h-8 bg-border"></div>
                  </div>
                )}
              </Card>
            ))}

            <Button
              variant="outline"
              className="w-full border-dashed"
              onClick={() => addNode("message")}
            >
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Bloco
            </Button>
          </div>
        </main>

        {/* Properties Panel */}
        {selectedNodeData && (
          <aside className="w-96 bg-card border-l border-border p-6 space-y-6">
            <div>
              <h3 className="font-bold text-lg mb-4">Editar Bloco</h3>
              <div className="flex items-center gap-3 mb-6 p-3 bg-accent/50 rounded-lg">
                <div className="bg-primary/10 p-2 rounded-lg">
                  {selectedNodeData.type === "trigger" && <Play className="w-5 h-5 text-primary" />}
                  {selectedNodeData.type === "message" && <MessageSquare className="w-5 h-5 text-primary" />}
                  {selectedNodeData.type === "question" && <MessageSquare className="w-5 h-5 text-primary" />}
                  {selectedNodeData.type === "action" && <MousePointer2 className="w-5 h-5 text-primary" />}
                  {selectedNodeData.type === "quick-reply" && <Grid3x3 className="w-5 h-5 text-primary" />}
                  {selectedNodeData.type === "condition" && <Split className="w-5 h-5 text-primary" />}
                  {selectedNodeData.type === "collect-data" && <FileText className="w-5 h-5 text-primary" />}
                  {selectedNodeData.type === "transfer" && <Users className="w-5 h-5 text-primary" />}
                </div>
                <span className="font-semibold">
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
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Conteúdo</label>
                  <Textarea
                    value={selectedNodeData.content}
                    onChange={(e) => updateNodeContent(selectedNodeData.id, e.target.value)}
                    placeholder="Digite o conteúdo do bloco..."
                    rows={6}
                  />
                </div>

                <div className="p-4 bg-accent/50 rounded-lg">
                  <h4 className="font-semibold text-sm mb-2">💡 Dicas</h4>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• Use {"{nome}"} para personalizar</li>
                    <li>• Quebre linhas para facilitar leitura</li>
                    <li>• Seja claro e objetivo</li>
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
