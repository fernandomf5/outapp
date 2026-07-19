import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Save, Eye, EyeOff, Link2, Copy, Power, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";


interface FunnelData {
  id?: string;
  name: string;
  description: string;
  config: {
    nodes: any[];
    edges: any[];
  };
  is_active: boolean;
}

const FunnelBuilder = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const funnelId = searchParams.get('id');

  const [funnelName, setFunnelName] = useState("Meu Funil de Vendas");
  const [funnelDescription, setFunnelDescription] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [showPreview, setShowPreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [nodes, setNodes] = useState<any[]>([
    {
      id: "1",
      type: "trigger",
      position: { x: 250, y: 50 },
      data: { label: "Início do Funil" },
    },
  ]);
  const [edges, setEdges] = useState<any[]>([]);

  useEffect(() => {
    if (funnelId) {
      loadFunnel(funnelId);
    }
  }, [funnelId]);

  const loadFunnel = async (id: string) => {
    const { data, error } = await supabase
      .from('funnels')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      toast({
        title: "Erro ao carregar funil",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

      if (data) {
      setFunnelName(data.name);
      setFunnelDescription(data.description || "");
      setIsActive(data.is_active);
      if (data.config && typeof data.config === 'object' && !Array.isArray(data.config)) {
        const config = data.config as { nodes?: any[]; edges?: any[] };
        setNodes(config.nodes || []);
        setEdges(config.edges || []);
      }
    }
  };

  const handleSave = async () => {
    if (!user) return;

    setIsSaving(true);
    const funnelData: FunnelData = {
      name: funnelName,
      description: funnelDescription,
      config: { nodes, edges },
      is_active: isActive,
    };

    try {
      if (funnelId) {
        const { error } = await supabase
          .from('funnels')
          .update(funnelData)
          .eq('id', funnelId);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('funnels')
          .insert([{ ...funnelData, user_id: user.id }])
          .select()
          .single();

        if (error) throw error;
        if (data) {
          navigate(`/funnel-builder?id=${data.id}`, { replace: true });
        }
      }

      toast({
        title: "Funil salvo! 🎉",
        description: "Seu funil de vendas foi salvo com sucesso.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao salvar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyLink = () => {
    if (!funnelId) {
      toast({
        title: "Salve o funil primeiro",
        description: "Você precisa salvar o funil antes de copiar o link.",
        variant: "destructive",
      });
      return;
    }

    const link = `${window.location.origin}/funnel/${funnelId}`;
    navigator.clipboard.writeText(link);
    toast({
      title: "Link copiado! 🔗",
      description: "O link do funil foi copiado para a área de transferência.",
    });
  };

  const handleTestInNewTab = () => {
    if (!funnelId) {
      toast({
        title: "Salve o funil primeiro",
        description: "Você precisa salvar o funil antes de testá-lo.",
        variant: "destructive",
      });
      return;
    }
    window.open(`/funnel/${funnelId}`, '_blank');
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      <header className="bg-card border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <Input
              value={funnelName}
              onChange={(e) => setFunnelName(e.target.value)}
              className="font-bold text-lg border-none focus-visible:ring-0 px-2"
              placeholder="Nome do funil"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Label htmlFor="active-toggle" className="text-sm">
              {isActive ? "Ativo" : "Inativo"}
            </Label>
            <Switch
              id="active-toggle"
              checked={isActive}
              onCheckedChange={setIsActive}
            />
            <Power className={`w-4 h-4 ${isActive ? "text-success" : "text-muted-foreground"}`} />
          </div>

          <Button variant="outline" onClick={() => setShowPreview(!showPreview)}>
            {showPreview ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
            {showPreview ? "Ocultar" : "Visualizar"} Lado a Lado
          </Button>

          <Button variant="outline" onClick={handleCopyLink}>
            <Link2 className="w-4 h-4 mr-2" />
            Copiar Link
          </Button>

          <Button variant="outline" onClick={handleTestInNewTab}>
            <Eye className="w-4 h-4 mr-2" />
            Testar Funil
          </Button>

          <Button onClick={handleSave} disabled={isSaving}>
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
        <Sparkles className="w-16 h-16 text-primary mb-6 animate-pulse" />
        <h2 className="text-3xl font-bold mb-4">O Funil de Vendas está sendo integrado à Inteligência Artificial</h2>
        <p className="text-muted-foreground max-w-md">
          Estamos removendo o sistema de fluxos manuais para dar lugar a um sistema de funil completamente humanizado e gerido por Agentes IA. Em breve você poderá criar estratégias de vendas automáticas usando apenas prompts.
        </p>
        <Button onClick={() => navigate("/dashboard")} className="mt-8">
          Voltar para o Dashboard
        </Button>
      </div>
    </div>
  );
};

export default FunnelBuilder;
