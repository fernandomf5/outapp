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
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const { toast } = useToast();

  const trainingQuestions = [
    {
      id: "business_name",
      question: "Qual o nome da sua empresa ou negócio?",
      placeholder: "Ex: Out App Marketing",
      help: "Isso ajuda o agente a se identificar corretamente."
    },
    {
      id: "business_goal",
      question: "Qual o principal objetivo do atendimento?",
      placeholder: "Ex: Captar leads, vender mentorias, tirar dúvidas sobre o sistema...",
      help: "O agente focará as respostas para atingir esse objetivo."
    },
    {
      id: "products_services",
      question: "Quais produtos ou serviços você oferece e seus preços?",
      placeholder: "Ex: Plano Básico R$99, Plano Pro R$499. Oferecemos gestão de tráfego e criação de sites.",
      help: "Essencial para que o agente possa informar e vender para o cliente."
    },
    {
      id: "faq",
      question: "Quais são as dúvidas mais comuns dos seus clientes e as respostas?",
      placeholder: "Ex: Aceitam PIX? Sim. Tem garantia? Sim, 7 dias.",
      help: "Dê exemplos de perguntas e respostas reais para o agente aprender."
    },
    {
      id: "personality",
      question: "Como o agente deve se comportar? (Tom de voz)",
      placeholder: "Ex: Amigável, profissional, direto, usa emojis...",
      help: "Define a 'personalidade' do seu atendimento IA."
    }
  ];

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
      const initialKnowledge = trainingData.knowledge || "";
      
      setAiEnabled(config.ai_enabled !== false);
      setKnowledge(initialKnowledge);

      // Extrair respostas existentes do conhecimento formatado
      const extractedAnswers: Record<string, string> = {};
      trainingQuestions.forEach(q => {
        const marker = `[${q.id}]: `;
        if (initialKnowledge.includes(marker)) {
          const startIndex = initialKnowledge.indexOf(marker) + marker.length;
          // Procurar o início do próximo marcador ou o fim da string
          let nextMarkerIndex = initialKnowledge.length;
          trainingQuestions.forEach(otherQ => {
            const otherMarker = `[${otherQ.id}]: `;
            const otherIndex = initialKnowledge.indexOf(otherMarker, startIndex);
            if (otherIndex !== -1 && otherIndex < nextMarkerIndex) {
              nextMarkerIndex = otherIndex;
            }
          });
          extractedAnswers[q.id] = initialKnowledge.substring(startIndex, nextMarkerIndex).trim();
        }
      });
      setAnswers(extractedAnswers);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    
    // Construir o conhecimento final a partir das respostas atuais
    const finalKnowledge = trainingQuestions
      .map(q => `[${q.id}]: ${answers[q.id] || ""}`)
      .join("\n\n");

    const { data: currentAgent } = await supabase
      .from("ai_agents")
      .select("config, training_data")
      .eq("id", agentId)
      .single();

    const trainingData = { ...(currentAgent?.training_data as any || {}), knowledge: finalKnowledge };
    const config = { ...(currentAgent?.config as any || {}), ai_enabled: aiEnabled };
    
    // Se o Agente IA for ativado, garantimos que o status de atendimento 
    // mude para 'offline' (que no sistema representa modo Agente IA)
    // e desativamos fluxos manuais antigos
    const updates: any = { 
      config, 
      training_data: trainingData 
    };

    if (aiEnabled) {
      updates.attendant_status = 'offline';
      await supabase
        .from("agent_chat_flows")
        .update({ is_active: false })
        .eq("agent_id", agentId);
    }

    const { error } = await supabase
      .from("ai_agents")
      .update(updates)
      .eq("id", agentId);

    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    } else {
      setKnowledge(finalKnowledge);
      toast({ 
        title: "Configurações salvas", 
        description: aiEnabled 
          ? "O agente IA foi ativado e os fluxos automáticos foram desativados." 
          : "Configurações atualizadas com sucesso." 
      });
    }
    setSaving(false);
  };

  const updateAnswer = (id: string, value: string) => {
    setAnswers(prev => ({ ...prev, [id]: value }));
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
      <div className="flex items-center justify-between bg-card p-6 rounded-2xl border shadow-sm">
        <div>
          <h3 className="text-2xl font-black flex items-center gap-2 tracking-tight">
            <Brain className="w-6 h-6 text-primary" />
            Treinamento do Agente IA
          </h3>
          <p className="text-sm text-muted-foreground mt-1 font-medium">
            preciso que o agente ia comece a falar no chat online quando ele for ativado
          </p>
        </div>
        <div className="flex items-center gap-3 bg-muted/50 p-3 rounded-xl border border-primary/10">
          <Label htmlFor="ai-toggle" className="text-sm font-bold cursor-pointer uppercase tracking-wider">
            Status da IA
          </Label>
          <Switch 
            id="ai-toggle"
            checked={aiEnabled}
            onCheckedChange={setAiEnabled}
            className="data-[state=checked]:bg-primary"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          <div className="space-y-6">
            {trainingQuestions.map((q) => (
              <Card key={q.id} className="p-6 border-2 hover:border-primary/20 transition-all shadow-none rounded-2xl">
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <Label className="text-base font-bold leading-tight">
                      {q.question}
                    </Label>
                    <div className="group relative">
                      <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                      <div className="absolute right-0 bottom-full mb-2 w-48 p-2 bg-popover text-popover-foreground text-xs rounded-lg border shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                        {q.help}
                      </div>
                    </div>
                  </div>
                  <Textarea 
                    value={answers[q.id] || ""}
                    onChange={(e) => updateAnswer(q.id, e.target.value)}
                    placeholder={q.placeholder}
                    className="min-h-[100px] bg-muted/30 border-none focus-visible:ring-1 focus-visible:ring-primary rounded-xl text-sm"
                  />
                </div>
              </Card>
            ))}
          </div>

          <Card className="p-6 border-dashed border-2 bg-muted/10 rounded-2xl">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-primary font-bold uppercase tracking-widest text-xs">
                <Sparkles className="w-4 h-4" />
                <span>Resumo do Conhecimento (IA)</span>
              </div>
              <Textarea 
                value={knowledge}
                onChange={(e) => setKnowledge(e.target.value)}
                placeholder="O conhecimento do seu agente aparecerá aqui conforme você responde as perguntas..."
                className="min-h-[150px] text-xs font-mono bg-background/50 leading-relaxed border-none focus-visible:ring-0"
              />
              <p className="text-[10px] text-muted-foreground italic">
                Nota: O Agente usará todos os dados acima para responder seus clientes de forma inteligente.
              </p>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-6 bg-primary/5 border-primary/20 rounded-2xl sticky top-6">
            <h4 className="font-bold flex items-center gap-2 mb-6 text-lg tracking-tight">
              <Sparkles className="w-5 h-5 text-primary" />
              Como funciona?
            </h4>
            <div className="space-y-6 text-sm">
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0 border border-primary/20">1</div>
                <div>
                  <p className="font-bold text-foreground">Responda as perguntas</p>
                  <p className="text-muted-foreground text-xs mt-1">Dê o máximo de detalhes sobre seu negócio para o agente aprender.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0 border border-primary/20">2</div>
                <div>
                  <p className="font-bold text-foreground">Salve os dados</p>
                  <p className="text-muted-foreground text-xs mt-1">Clique no botão abaixo para processar o treinamento.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0 border border-primary/20">3</div>
                <div>
                  <p className="font-bold text-foreground">IA em Ação</p>
                  <p className="text-muted-foreground text-xs mt-1">Ative o "Status da IA" para que o agente comece a responder 24/7.</p>
                </div>
              </div>
              
              <div className="pt-4">
                <Alert className="bg-background/80 border-primary/20 rounded-xl">
                  <MessageSquare className="w-4 h-4 text-primary" />
                  <AlertDescription className="text-xs font-medium">
                    O Agente responderá de forma humanizada, similar ao ChatGPT, baseado nas suas respostas.
                  </AlertDescription>
                </Alert>
              </div>

              <Button 
                className="w-full h-14 gap-3 text-base font-bold shadow-xl shadow-primary/20 rounded-xl transition-all hover:scale-[1.02] active:scale-95 mt-4" 
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? <Loader2 className="w-6 h-6 animate-spin" /> : <Save className="w-6 h-6" />}
                FINALIZAR TREINAMENTO
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

import { Alert } from "@/components/ui/alert";
import { AlertDescription } from "@/components/ui/alert";