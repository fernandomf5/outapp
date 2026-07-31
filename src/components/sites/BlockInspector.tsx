import { FieldDef } from "./siteTypes";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ImageUpload } from "@/components/ImageUpload";
import { Plus, Trash2, ChevronUp, ChevronDown } from "lucide-react";

interface FieldEditorProps {
  field: FieldDef;
  value: any;
  onChange: (value: any) => void;
}

export function FieldEditor({ field, value, onChange }: FieldEditorProps) {
  if (field.type === "switch") {
    return (
      <div className="flex items-center justify-between gap-3 rounded-lg border p-3">
        <Label className="text-sm">{field.label}</Label>
        <Switch checked={!!value} onCheckedChange={onChange} />
      </div>
    );
  }

  if (field.type === "list") {
    const items: any[] = Array.isArray(value) ? value : [];
    const update = (i: number, patch: any) => {
      const next = [...items];
      next[i] = { ...next[i], ...patch };
      onChange(next);
    };
    const move = (i: number, dir: number) => {
      const j = i + dir;
      if (j < 0 || j >= items.length) return;
      const next = [...items];
      [next[i], next[j]] = [next[j], next[i]];
      onChange(next);
    };
    return (
      <div className="space-y-3">
        <Label className="text-sm font-semibold">{field.label}</Label>
        {items.map((item, i) => (
          <div key={i} className="rounded-lg border p-3 space-y-3 bg-muted/30">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                {field.itemLabel || "Item"} {i + 1}
              </span>
              <div className="flex items-center gap-1">
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => move(i, -1)}>
                  <ChevronUp className="h-3.5 w-3.5" />
                </Button>
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => move(i, 1)}>
                  <ChevronDown className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-destructive"
                  onClick={() => onChange(items.filter((_, k) => k !== i))}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
            {(field.itemFields || []).map((sub) => (
              <FieldEditor
                key={sub.key}
                field={sub}
                value={item?.[sub.key]}
                onChange={(v) => update(i, { [sub.key]: v })}
              />
            ))}
          </div>
        ))}
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => onChange([...items, { ...(field.defaultItem || {}) }])}
        >
          <Plus className="h-4 w-4 mr-1" /> Adicionar {field.itemLabel?.toLowerCase() || "item"}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <Label className="text-sm">{field.label}</Label>
      {field.type === "textarea" && (
        <Textarea rows={4} value={value ?? ""} placeholder={field.placeholder} onChange={(e) => onChange(e.target.value)} />
      )}
      {field.type === "text" && (
        <Input value={value ?? ""} placeholder={field.placeholder} onChange={(e) => onChange(e.target.value)} />
      )}
      {field.type === "number" && (
        <Input type="number" value={value ?? 0} onChange={(e) => onChange(Number(e.target.value))} />
      )}
      {field.type === "color" && (
        <div className="flex items-center gap-2">
          <input
            type="color"
            className="h-9 w-12 rounded border bg-transparent"
            value={value || "#000000"}
            onChange={(e) => onChange(e.target.value)}
          />
          <Input value={value ?? ""} onChange={(e) => onChange(e.target.value)} />
        </div>
      )}
      {field.type === "select" && (
        <Select value={String(value ?? "")} onValueChange={onChange}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione" />
          </SelectTrigger>
          <SelectContent className="z-[300]">
            {(field.options || []).map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      {field.type === "image" && (
        <ImageUpload label="" currentImage={value || ""} bucketName="cloned-pages" onImageSelect={onChange} />
      )}
    </div>
  );
}
