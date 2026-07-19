import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Brain, Save, Loader2, Sparkles, MessageSquare, Info } from "lucide-react";

interface AgentAIPanelProps {
  agentId: string;
}

export default function AgentAIPanel({ agentId }: AgentAIPanelProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(false);
  const [knowledge, setKnowledge] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    loadAgentData();
  }, [agentId]);

  const loadAgentData = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("ai_agents")
      .select("*")
      .eq("id", agentId)
      .single();

    if (error) {
      toast({ title: "Erro", description: "Não foi possível carregar os dados do agente.", variant: "destructive" });
    } else {
      const config = (data.config as any) || {};
      const trainingData = (data.training_data as any) || {};
      
      setAiEnabled(config.ai_enabled !== false);
      setKnowledge(trainingData.knowledge || "");
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    
    // Buscar config atual para não sobrescrever outros campos
    const { data: currentAgent } = await supabase
      .from("ai_agents")
      .select("config, training_data")
      .eq("id", agentId)
      .single();

    const config = { ...(currentAgent?.config as any || {}), ai_enabled: aiEnabled };
    
    // Se ativar IA, desativar fluxos do agente
    if (aiEnabled) {
      const { error: flowError } = await supabase
        .from("agent_chat_flows")
        .update({ is_active: false })
        .eq("agent_id", agentId);
        
      if (flowError) {
        console.error("Erro ao desativar fluxos:", flowError);
      }
    }

    const trainingData = { ...(currentAgent?.training_data as any || {}), knowledge };

    const { error } = await supabase
      .from("ai_agents")
      .update({ config, training_data: trainingData })
      .eq("id", agentId);

    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    } else {
      toast({ 
        title: "Configurações salvas", 
        description: aiEnabled 
          ? "O agente IA foi ativado e os fluxos automáticos foram desativados." 
          : "Configurações atualizadas com sucesso." 
      });
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Brain className="w-5 h-5 text-primary" />
            Agente IA (Inteligente)
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Treine seu agente com informações específicas para que ele responda como um especialista.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-card border p-2 rounded-lg">
          <Label htmlFor="ai-toggle" className="text-sm font-medium cursor-pointer">
            Ativar Inteligência
          </Label>
          <Switch 
            id="ai-toggle"
            checked={aiEnabled}
            onCheckedChange={setAiEnabled}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card className="p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-primary font-semibold">
                <Sparkles className="w-4 h-4" />
                <span>Base de Conhecimento e Prompt do Agente</span>
              </div>
              <Label className="block text-sm text-muted-foreground">
                Forneça todos os dados da sua empresa, produtos, serviços, preços e o objetivo do atendimento. O Agente usará isso para responder de forma humanizada, como um GPT.
              </Label>
              <Textarea 
                value={knowledge}
                onChange={(e) => setKnowledge(e.target.value)}
                placeholder="Ex: Somos a Out App. Vendemos soluções de marketing digital. Nosso objetivo é captar leads e tirar dúvidas sobre nossos planos (R$99-R$499). Responda sempre de forma gentil e profissional..."
                className="min-h-[400px] text-sm leading-relaxed"
              />
              <p className="text-xs text-muted-foreground italic">
                Dica: Quanto mais detalhado for o prompt sobre seu negócio, mais inteligente e humanizado o agente será nas respostas.
              </p>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-6 bg-primary/5 border-primary/20">
            <h4 className="font-semibold flex items-center gap-2 mb-4">
              <Info className="w-4 h-4 text-primary" />
              Treinamento Real e Humanizado
            </h4>
            <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
              <p>
                1. <strong>Identidade:</strong> Defina quem é seu agente e como ele deve se comportar (ex: "Você é um consultor de vendas experiente").
              </p>
              <p>
                2. <strong>Dados da Empresa:</strong> Liste seus produtos, serviços, valores e diferenciais. Ele saberá tudo sobre seu negócio.
              </p>
              <p>
                3. <strong>Inteligência:</strong> Ele utiliza tecnologia de ponta (similar ao ChatGPT/Gemini) para entender o contexto e responder naturalmente.
              </p>
              <p>
                4. <strong>Falar com Humano:</strong> O cliente sempre pode solicitar falar com um atendente real se preferir.
              </p>
              <div className="pt-2">
                <Alert className="bg-background border-primary/20">
                  <MessageSquare className="w-4 h-4" />
                  <AlertDescription className="text-xs">
                    Com a IA ativa, seu atendimento funciona 24/7 de forma inteligente.
                  </AlertDescription>
                </Alert>
              </div>
            </div>
          </Card>

          <Button 
            className="w-full h-12 gap-2 text-base shadow-lg shadow-primary/20" 
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            Salvar Treinamento
          </Button>
        </div>
      </div>
    </div>
  );
}

import { Alert } from "@/components/ui/alert";
import { AlertDescription } from "@/components/ui/alert";