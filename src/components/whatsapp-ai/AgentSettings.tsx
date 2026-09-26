import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import type { WaConnection } from "./types";

export function AgentSettings({ connection }: { connection: WaConnection }) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [f, setF] = useState({
    agent_enabled: connection.agent_enabled,
    agent_name: connection.agent_name,
    personality: connection.personality,
    system_prompt: connection.system_prompt,
    rules: connection.rules,
    handoff_keywords: connection.handoff_keywords.join(", "),
    handoff_message: connection.handoff_message,
  });

  const save = async () => {
    if (!f.agent_name.trim()) return toast({ title: "Informe o nome do agente", variant: "destructive" });
    setSaving(true);
    const { error } = await supabase.from("whatsapp_ai_connections").update({
      ...f,
      agent_name: f.agent_name.trim().slice(0, 80),
      handoff_keywords: f.handoff_keywords.split(",").map((k) => k.trim()).filter(Boolean).slice(0, 30),
      updated_at: new Date().toISOString(),
    }).eq("id", connection.id);
    setSaving(false);
    toast(error ? { title: "Erro ao salvar", description: error.message, variant: "destructive" } : { title: "Agente salvo" });
  };

  const area = (k: keyof typeof f, label: string, hint: string, rows = 4) => (
    <div className="space-y-1.5">
      <Label htmlFor={k}>{label}</Label>
      <Textarea id={k} rows={rows} value={String(f[k])} onChange={(e) => setF({ ...f, [k]: e.target.value })} />
      <p className="text-xs text-muted-foreground">{hint}</p>
    </div>
  );

  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        <div className="flex items-center justify-between rounded-md border border-border p-3">
          <div>
            <p className="font-medium">Responder automaticamente com IA</p>
            <p className="text-xs text-muted-foreground">Desligado, todas as conversas ficam para atendimento humano.</p>
          </div>
          <Switch checked={f.agent_enabled} onCheckedChange={(v) => setF({ ...f, agent_enabled: v })} aria-label="Ativar agente" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="agent_name">Nome do agente</Label>
          <Input id="agent_name" value={f.agent_name} onChange={(e) => setF({ ...f, agent_name: e.target.value })} />
        </div>
        {area("personality", "Personalidade", "Ex.: simpático, usa linguagem informal e emojis com moderação.", 2)}
        {area("system_prompt", "Prompt de atendimento", "Explique o negócio, produtos, preços, horários e como o agente deve conduzir a conversa.", 6)}
        {area("rules", "Regras", "O que o agente nunca pode fazer. Ex.: não dar descontos, não prometer prazos.", 4)}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="handoff_keywords">Palavras que chamam um humano</Label>
            <Input id="handoff_keywords" value={f.handoff_keywords} onChange={(e) => setF({ ...f, handoff_keywords: e.target.value })} />
            <p className="text-xs text-muted-foreground">Separe por vírgula. A IA também transfere quando não souber responder.</p>
          </div>
          {area("handoff_message", "Mensagem de transferência", "Enviada ao cliente quando a conversa passa para um humano.", 2)}
        </div>
        <Button onClick={save} disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Salvar agente</Button>
      </CardContent>
    </Card>
  );
}
