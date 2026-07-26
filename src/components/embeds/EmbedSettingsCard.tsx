import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Code2, MousePointerClick, Layers, RefreshCw, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { PageEmbedSettings, POPUP_SNAPSHOT_COLUMNS, PopupSnapshot } from "./pageEmbedTypes";

const db = supabase as any;
const NONE = "__none__";

interface Props {
  value: PageEmbedSettings;
  onChange: (value: PageEmbedSettings) => void;
}

export const EmbedSettingsCard = ({ value, onChange }: Props) => {
  const [buttons, setButtons] = useState<{ id: string; name: string; generated_code: string | null }[]>([]);
  const [popups, setPopups] = useState<PopupSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const patch = (p: Partial<PageEmbedSettings>) => onChange({ ...value, ...p });

  const load = async () => {
    setLoading(true);
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) {
      setLoading(false);
      return null;
    }
    const [{ data: btns }, { data: pops }] = await Promise.all([
      db.from("floating_buttons").select("id,name,generated_code").eq("user_id", auth.user.id).order("created_at", { ascending: false }),
      db.from("popups").select(POPUP_SNAPSHOT_COLUMNS).eq("user_id", auth.user.id).order("created_at", { ascending: false }),
    ]);
    setButtons(btns || []);
    setPopups(pops || []);
    setLoading(false);
    return { btns: btns || [], pops: pops || [] };
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectButton = (id: string) => {
    if (id === NONE) return patch({ floatingButtonId: "", floatingButtonCode: "" });
    const b = buttons.find((x) => x.id === id);
    if (b && !b.generated_code) toast.warning("Este botão ainda não tem código gerado. Salve-o novamente no gerador de botão flutuante.");
    patch({ floatingButtonId: id, floatingButtonCode: b?.generated_code || "" });
  };

  const selectPopup = (id: string) => {
    if (id === NONE) return patch({ popupId: "", popupConfig: null });
    const p = popups.find((x) => x.id === id) || null;
    patch({ popupId: id, popupConfig: p });
  };

  const refreshSnapshots = async () => {
    setRefreshing(true);
    const res = await load();
    if (res) {
      const next: PageEmbedSettings = { ...value };
      if (value.floatingButtonId) {
        const b = res.btns.find((x: any) => x.id === value.floatingButtonId);
        next.floatingButtonCode = b?.generated_code || "";
        if (!b) next.floatingButtonId = "";
      }
      if (value.popupId) {
        const p = res.pops.find((x: any) => x.id === value.popupId) || null;
        next.popupConfig = p as PopupSnapshot | null;
        if (!p) next.popupId = "";
      }
      onChange(next);
      toast.success("Botão e pop-up atualizados");
    }
    setRefreshing(false);
  };

  return (
    <>
      <Card className="space-y-3 p-4">
        <Label className="flex items-center gap-2 text-sm font-semibold">
          <Code2 className="h-4 w-4" />Scripts (head e rodapé)
        </Label>
        <div>
          <Label className="text-xs">Script no head</Label>
          <Textarea
            rows={4}
            className="font-mono text-xs"
            placeholder="<!-- Google Analytics, Meta Pixel, etc. -->"
            value={value.headScripts || ""}
            onChange={(e) => patch({ headScripts: e.target.value })}
          />
        </div>
        <div>
          <Label className="text-xs">Script no rodapé (antes de &lt;/body&gt;)</Label>
          <Textarea
            rows={4}
            className="font-mono text-xs"
            placeholder="<script>/* seu código */</script>"
            value={value.bodyScripts || ""}
            onChange={(e) => patch({ bodyScripts: e.target.value })}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Os scripts são executados somente na página pública publicada, não na prévia.
        </p>
      </Card>

      <Card className="space-y-3 p-4">
        <div className="flex items-center justify-between">
          <Label className="flex items-center gap-2 text-sm font-semibold">
            <Layers className="h-4 w-4" />Recursos da Out App
          </Label>
          <Button variant="ghost" size="sm" onClick={refreshSnapshots} disabled={refreshing || loading}>
            {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          </Button>
        </div>

        <div>
          <Label className="flex items-center gap-1 text-xs"><MousePointerClick className="h-3.5 w-3.5" />Botão flutuante</Label>
          <Select value={value.floatingButtonId || NONE} onValueChange={selectButton}>
            <SelectTrigger className="h-9"><SelectValue placeholder="Nenhum" /></SelectTrigger>
            <SelectContent className="z-[300]">
              <SelectItem value={NONE}>Nenhum</SelectItem>
              {buttons.map((b) => (
                <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {!loading && buttons.length === 0 && (
            <p className="mt-1 text-xs text-muted-foreground">Nenhum botão flutuante criado ainda.</p>
          )}
        </div>

        <div>
          <Label className="flex items-center gap-1 text-xs"><Layers className="h-3.5 w-3.5" />Pop-up</Label>
          <Select value={value.popupId || NONE} onValueChange={selectPopup}>
            <SelectTrigger className="h-9"><SelectValue placeholder="Nenhum" /></SelectTrigger>
            <SelectContent className="z-[300]">
              <SelectItem value={NONE}>Nenhum</SelectItem>
              {popups.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.name || p.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {!loading && popups.length === 0 && (
            <p className="mt-1 text-xs text-muted-foreground">Nenhum pop-up criado ainda.</p>
          )}
        </div>

        <p className="text-xs text-muted-foreground">
          Editou o botão ou o pop-up na Out App? Clique em atualizar e salve a página para aplicar.
        </p>
      </Card>
    </>
  );
};
