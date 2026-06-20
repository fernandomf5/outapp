import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Trash2, Copy, Key, ExternalLink, Clock } from "lucide-react";

interface AccessCode {
  id: string;
  access_code: string;
  customer_name: string | null;
  customer_email: string | null;
  expires_at: string | null;
  is_active: boolean | null;
  created_at: string | null;
}

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  areaId: string;
  areaSlug: string;
  areaName: string;
}

const DURATION_OPTIONS: Record<string, number | null> = {
  never: null,
  "1h": 1,
  "24h": 24,
  "3d": 72,
  "7d": 168,
  "30d": 720,
  "90d": 2160,
};

export function AccessCodesDialog({ open, onOpenChange, areaId, areaSlug, areaName }: Props) {
  const [codes, setCodes] = useState<AccessCode[]>([]);
  const [loading, setLoading] = useState(false);
  const [studentName, setStudentName] = useState("");
  const [duration, setDuration] = useState<string>("never");
  const [creating, setCreating] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("members_area_access_codes" as any)
      .select("*")
      .eq("members_area_id", areaId)
      .order("created_at", { ascending: false });
    if (error) {
      toast.error("Erro ao carregar códigos");
    } else {
      setCodes((data as any) || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (open) load();
  }, [open, areaId]);

  const generateCode = () =>
    Math.random().toString(36).substring(2, 6).toUpperCase() +
    Math.random().toString(36).substring(2, 6).toUpperCase();

  const handleCreate = async () => {
    setCreating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Você precisa estar logado");
        return;
      }
      const hours = DURATION_OPTIONS[duration];
      const expires_at = hours ? new Date(Date.now() + hours * 60 * 60 * 1000).toISOString() : null;
      const { error } = await supabase.from("members_area_access_codes" as any).insert({
        members_area_id: areaId,
        user_id: user.id,
        access_code: generateCode(),
        customer_name: studentName.trim() || "Acesso Avulso",
        expires_at,
        is_active: true,
      });
      if (error) throw error;
      toast.success("Código gerado com sucesso!");
      setStudentName("");
      setDuration("never");
      load();
    } catch (e: any) {
      toast.error(e.message || "Erro ao gerar código");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("members_area_access_codes" as any).delete().eq("id", id);
    if (error) toast.error("Erro ao excluir");
    else {
      toast.success("Código excluído");
      setCodes((prev) => prev.filter((c) => c.id !== id));
    }
  };

  const buildUrl = (code: string) =>
    `${window.location.origin}/members/${areaSlug}?code=${code}`;

  const copy = async (text: string, msg: string) => {
    await navigator.clipboard.writeText(text);
    toast.success(msg);
  };

  const isExpired = (c: AccessCode) =>
    c.expires_at ? new Date(c.expires_at).getTime() < Date.now() : false;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-[700px] h-[calc(100dvh-2rem)] sm:h-[90dvh] !max-h-[90dvh] !flex flex-col !overflow-hidden">
        <DialogHeader className="shrink-0 pr-8">
          <DialogTitle className="flex items-center gap-2">
            <Key className="w-5 h-5" />
            Códigos de Acesso — {areaName}
          </DialogTitle>
          <DialogDescription>
            Gere códigos avulsos para você testar ou compartilhar com alunos.
          </DialogDescription>
        </DialogHeader>

        <div className="shrink-0 grid grid-cols-1 sm:grid-cols-[1fr_180px_auto] gap-2 items-end border rounded-md p-3 bg-muted/30">
          <div>
            <Label className="text-xs">Nome (opcional)</Label>
            <Input
              placeholder="Ex: João ou Teste"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
            />
          </div>
          <div>
            <Label className="text-xs">Validade</Label>
            <Select value={duration} onValueChange={setDuration}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="never">Sem expiração</SelectItem>
                <SelectItem value="1h">1 hora</SelectItem>
                <SelectItem value="24h">24 horas</SelectItem>
                <SelectItem value="3d">3 dias</SelectItem>
                <SelectItem value="7d">7 dias</SelectItem>
                <SelectItem value="30d">30 dias</SelectItem>
                <SelectItem value="90d">90 dias</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleCreate} disabled={creating}>
            <Plus className="w-4 h-4 mr-2" />
            Gerar
          </Button>
        </div>

        <div className="flex-1 min-h-0 mt-2 overflow-y-auto overscroll-contain pr-3">
          <div className="space-y-2 pb-2">
            {loading ? (
              <p className="text-sm text-muted-foreground text-center py-6">Carregando...</p>
            ) : codes.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                Nenhum código gerado ainda
              </p>
            ) : (
              codes.map((c) => {
                const expired = isExpired(c);
                return (
                  <div
                    key={c.id}
                    className="flex flex-col sm:flex-row sm:items-center gap-2 p-3 border rounded-md"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <code className="font-mono font-bold text-base">{c.access_code}</code>
                        {expired ? (
                          <Badge variant="destructive">Expirado</Badge>
                        ) : c.expires_at ? (
                          <Badge variant="secondary" className="gap-1">
                            <Clock className="w-3 h-3" />
                            até {new Date(c.expires_at).toLocaleString("pt-BR")}
                          </Badge>
                        ) : (
                          <Badge variant="outline">Sem expiração</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 truncate">
                        {c.customer_name || "Acesso Avulso"}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copy(c.access_code, "Código copiado!")}
                        title="Copiar código"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copy(buildUrl(c.access_code), "Link copiado!")}
                        title="Copiar link com código"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(buildUrl(c.access_code), "_blank")}
                        title="Abrir"
                      >
                        <Key className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(c.id)}
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
