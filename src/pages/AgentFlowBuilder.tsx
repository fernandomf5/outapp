import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Save, Eye, EyeOff, Power, Workflow } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { FlowCanvas } from "@/components/flowbuilder/FlowCanvas";
import { Sidebar } from "@/components/flowbuilder/Sidebar";
import { PropertiesPanel } from "@/components/flowbuilder/PropertiesPanel";
import { ChatPreview } from "@/components/flowbuilder/ChatPreview";
import { ReactFlowProvider } from "reactflow";
import { Node } from "reactflow";

const AgentFlowBuilder = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const flowId = searchParams.get("id");
  const agentId = searchParams.get("agentId");

  const [flowName, setFlowName] = useState("Novo Fluxo");
  const [isActive, setIsActive] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [nodes, setNodes] = useState<any[]>([
    {
      id: "trigger-1",
      type: "trigger",
      position: { x: 300, y: 50 },
      data: { label: "Início do Fluxo" },
    },
  ]);
  const [edges, setEdges] = useState<any[]>([]);

  useEffect(() => {
    if (flowId) loadFlow(flowId);
  }, [flowId]);

  const loadFlow = async (id: string) => {
    const { data, error } = await supabase
      .from("agent_chat_flows")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      toast({ title: "Erro ao carregar fluxo", description: error.message, variant: "destructive" });
      return;
    }

    if (data) {
      setFlowName(data.name);
      setIsActive(data.is_active);
      const config = data.config as any;
      if (config?.nodes) setNodes(config.nodes);
      if (config?.edges) setEdges(config.edges);
    }
  };

  const handleSave = async () => {
    if (!user || !agentId) return;
    setIsSaving(true);

    try {
      const flowData = {
        name: flowName,
        config: { nodes, edges },
        is_active: isActive,
      };

      // Se este for o primeiro fluxo ou o usuário estiver salvando como ativo,
      // garantir que o agente tenha fluxos habilitados na config
      const { data: agentData } = await supabase
        .from("ai_agents")
        .select("config")
        .eq("id", agentId)
        .single();

      if (agentData) {
        const currentConfig = agentData.config as any || {};
        if (currentConfig.flows_enabled === false) {
          await supabase
            .from("ai_agents")
            .update({
              config: { ...currentConfig, flows_enabled: true }
            })
            .eq("id", agentId);
        }
      }

      if (flowId) {
        const { error } = await supabase
          .from("agent_chat_flows")
          .update(flowData)
          .eq("id", flowId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("agent_chat_flows")
          .insert([{ ...flowData, agent_id: agentId, user_id: user.id }])
          .select()
          .single();
        if (error) throw error;
        if (data) {
          navigate(`/agent-flow-builder?id=${data.id}&agentId=${agentId}`, { replace: true });
        }
      }

      toast({ title: "Fluxo salvo! 🎉", description: "Seu fluxo de atendimento foi salvo com sucesso." });
    } catch (error: any) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleNodeClick = useCallback((node: Node) => {
    setSelectedNode(node);
    setShowPreview(false);
  }, []);

  const handleUpdateNode = useCallback((id: string, data: any) => {
    setNodes((nds) =>
      nds.map((n) => (n.id === id ? { ...n, data: { ...n.data, ...data } } : n))
    );
    setSelectedNode((prev) => (prev?.id === id ? { ...prev, data: { ...prev.data, ...data } } : prev));
  }, []);

  const handleDeleteNode = useCallback((id: string) => {
    setNodes((nds) => nds.filter((n) => n.id !== id));
    setEdges((eds) => eds.filter((e) => e.source !== id && e.target !== id));
    setSelectedNode(null);
  }, []);

  const handleDuplicateNode = useCallback((node: Node) => {
    const newNode: Node = {
      ...node,
      id: `${Date.now()}`,
      position: { x: node.position.x + 50, y: node.position.y + 80 },
      selected: false,
    };
    setNodes((nds) => [...nds, newNode]);
  }, []);

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border px-4 py-3 flex items-center justify-between z-50">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard?tab=ai-agents")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2 bg-primary/10 px-3 py-1.5 rounded-full">
            <Workflow className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Fluxo de Atendimento</span>
          </div>
          <Input
            value={flowName}
            onChange={(e) => setFlowName(e.target.value)}
            className="font-bold text-lg border-none focus-visible:ring-0 px-2 max-w-[250px] bg-transparent"
            placeholder="Nome do fluxo"
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Label htmlFor="active-toggle" className="text-sm hidden sm:block">
              {isActive ? "Ativo" : "Inativo"}
            </Label>
            <Switch id="active-toggle" checked={isActive} onCheckedChange={setIsActive} />
            <Power className={`w-4 h-4 ${isActive ? "text-green-500" : "text-muted-foreground"}`} />
          </div>

          <Button variant="outline" size="sm" onClick={() => { setShowPreview(!showPreview); setSelectedNode(null); }}>
            {showPreview ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
            {showPreview ? "Ocultar" : "Preview"}
          </Button>

          <Button onClick={handleSave} disabled={isSaving} size="sm">
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          onAddNode={(type) => {
            const newNode = {
              id: `${Date.now()}`,
              type,
              position: { x: 300 + Math.random() * 200, y: 150 + Math.random() * 300 },
              data: {
                label:
                  type === "text" ? "Digite seu texto..." :
                  type === "image" ? "Adicione uma imagem" :
                  type === "video" ? "Adicione um vídeo" :
                  type === "audio" ? "Adicione um áudio" :
                  type === "document" ? "Adicione um documento" :
                  type === "button" ? "Adicione botões" :
                  type === "humanAgent" ? "Transferir para atendente" :
                  `Novo ${type}`,
                buttons: type === "button" ? ["Opção 1", "Opção 2"] : undefined,
              },
            };
            setNodes((nds) => [...nds, newNode]);
          }}
        />

        <div className="flex-1 flex">
          <ReactFlowProvider>
            <div className="flex-1">
              <FlowCanvas
                initialNodes={nodes}
                initialEdges={edges}
                onNodesChange={setNodes}
                onEdgesChange={setEdges}
                onNodeClick={handleNodeClick}
              />
            </div>
          </ReactFlowProvider>

          {showPreview && (
            <div className="w-96 border-l border-border bg-card">
              <ChatPreview nodes={nodes} edges={edges} botName={flowName} />
            </div>
          )}

          {selectedNode && !showPreview && (
            <PropertiesPanel
              selectedNode={selectedNode}
              onUpdateNode={handleUpdateNode}
              onDeleteNode={handleDeleteNode}
              onDuplicateNode={handleDuplicateNode}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default AgentFlowBuilder;
