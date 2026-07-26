import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { FieldType, FIELD_TYPE_LABELS, KindField } from "./entityKinds";

interface KindFieldsBuilderProps {
  fields: KindField[];
  onChange: (fields: KindField[]) => void;
}

const slugify = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "") || `campo_${Date.now()}`;

export function KindFieldsBuilder({ fields, onChange }: KindFieldsBuilderProps) {
  const update = (index: number, patch: Partial<KindField>) => {
    onChange(fields.map((f, i) => (i === index ? { ...f, ...patch } : f)));
  };

  const add = () => {
    onChange([...fields, { key: `campo_${fields.length + 1}_${Date.now().toString(36)}`, label: "", type: "text" }]);
  };

  const remove = (index: number) => onChange(fields.filter((_, i) => i !== index));

  const move = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= fields.length) return;
    const next = [...fields];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>Campos personalizados</Label>
        <Button type="button" variant="outline" size="sm" onClick={add}>
          <Plus className="h-4 w-4 mr-1" /> Adicionar campo
        </Button>
      </div>

      {fields.length === 0 && (
        <p className="text-xs text-muted-foreground">
          Nenhum campo extra. Os campos padrão do tipo escolhido já serão exibidos no formulário.
        </p>
      )}

      <div className="space-y-2">
        {fields.map((f, i) => (
          <div key={f.key} className="rounded-lg border p-3 space-y-2 bg-muted/20">
            <div className="flex items-start gap-2">
              <div className="flex flex-col pt-2">
                <button type="button" onClick={() => move(i, -1)} className="text-muted-foreground hover:text-foreground text-xs leading-none">▲</button>
                <GripVertical className="h-3 w-3 text-muted-foreground my-0.5" />
                <button type="button" onClick={() => move(i, 1)} className="text-muted-foreground hover:text-foreground text-xs leading-none">▼</button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 flex-1">
                <Input
                  placeholder="Nome do campo (ex: Peso)"
                  value={f.label}
                  onChange={(e) => update(i, { label: e.target.value, key: f.label ? f.key : slugify(e.target.value) })}
                />
                <Select value={f.type} onValueChange={(v) => update(i, { type: v as FieldType })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(FIELD_TYPE_LABELS) as FieldType[]).map((t) => (
                      <SelectItem key={t} value={t}>{FIELD_TYPE_LABELS[t]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {f.type === "select" && (
                  <Input
                    className="sm:col-span-2"
                    placeholder="Opções separadas por vírgula (ex: Novo, Usado)"
                    value={(f.options || []).join(", ")}
                    onChange={(e) => update(i, { options: e.target.value.split(",").map((o) => o.trim()).filter(Boolean) })}
                  />
                )}
              </div>
              <Button type="button" variant="ghost" size="icon" onClick={() => remove(i)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
