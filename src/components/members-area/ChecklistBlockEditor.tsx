import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, ArrowUp, ArrowDown, ListChecks } from "lucide-react";

export interface ChecklistItem {
  id: string;
  text: string;
  description?: string;
}

export interface ChecklistData {
  items: ChecklistItem[];
  showProgress: boolean;
  allowCheck: boolean;
}

const DEFAULT: ChecklistData = { items: [], showProgress: true, allowCheck: true };

export function parseChecklist(content: string): ChecklistData {
  if (!content) return { ...DEFAULT, items: [] };
  try {
    const parsed = JSON.parse(content);
    if (parsed && Array.isArray(parsed.items)) {
      return {
        items: parsed.items.map((i: any, idx: number) => ({
          id: i.id || `i${idx}`,
          text: String(i.text ?? ""),
          description: i.description || "",
        })),
        showProgress: parsed.showProgress !== false,
        allowCheck: parsed.allowCheck !== false,
      };
    }
  } catch {
    // legacy: plain text / HTML lines -> items
  }
  const lines = content
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "\n")
    .split("\n")
    .map((l) => l.replace(/^\s*([-*•]|\[\s*[xX]?\s*\])\s*/, "").trim())
    .filter(Boolean);
  return { ...DEFAULT, items: lines.map((text, idx) => ({ id: `i${idx}`, text })) };
}

interface Props {
  content: string;
  onChange: (content: string) => void;
}

export function ChecklistBlockEditor({ content, onChange }: Props) {
  const data = useMemo(() => parseChecklist(content), [content]);

  const update = (next: Partial<ChecklistData>) =>
    onChange(JSON.stringify({ ...data, ...next }));

  const setItem = (id: string, patch: Partial<ChecklistItem>) =>
    update({ items: data.items.map((i) => (i.id === id ? { ...i, ...patch } : i)) });

  const addItem = () =>
    update({
      items: [...data.items, { id: `i${Date.now()}`, text: "", description: "" }],
    });

  const removeItem = (id: string) =>
    update({ items: data.items.filter((i) => i.id !== id) });

  const move = (index: number, dir: -1 | 1) => {
    const next = [...data.items];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    update({ items: next });
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-4 rounded-lg border p-3">
        <div className="flex items-center gap-2">
          <Switch
            checked={data.showProgress}
            onCheckedChange={(v) => update({ showProgress: v })}
          />
          <Label className="text-xs">Mostrar progresso</Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            checked={data.allowCheck}
            onCheckedChange={(v) => update({ allowCheck: v })}
          />
          <Label className="text-xs">Permitir marcar itens</Label>
        </div>
      </div>

      <div className="space-y-2">
        {data.items.map((item, index) => (
          <div key={item.id} className="rounded-lg border p-3 space-y-2">
            <div className="flex items-start gap-2">
              <ListChecks className="w-4 h-4 mt-2.5 text-muted-foreground shrink-0" />
              <div className="flex-1 space-y-2">
                <Input
                  value={item.text}
                  onChange={(e) => setItem(item.id, { text: e.target.value })}
                  placeholder={`Item ${index + 1}`}
                />
                <Input
                  value={item.description || ""}
                  onChange={(e) => setItem(item.id, { description: e.target.value })}
                  placeholder="Descrição (opcional)"
                  className="text-xs"
                />
              </div>
              <div className="flex flex-col gap-1 shrink-0">
                <Button type="button" size="icon" variant="ghost" className="h-7 w-7" onClick={() => move(index, -1)}>
                  <ArrowUp className="w-3.5 h-3.5" />
                </Button>
                <Button type="button" size="icon" variant="ghost" className="h-7 w-7" onClick={() => move(index, 1)}>
                  <ArrowDown className="w-3.5 h-3.5" />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-destructive"
                  onClick={() => removeItem(item.id)}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </div>
        ))}
        {data.items.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-4">
            Nenhum item ainda. Adicione as tarefas do checklist.
          </p>
        )}
      </div>

      <Button type="button" variant="outline" size="sm" onClick={addItem} className="w-full">
        <Plus className="w-4 h-4 mr-1" /> Adicionar item
      </Button>
    </div>
  );
}
