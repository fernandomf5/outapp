import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Check, X } from "lucide-react";
import { FinancialCategory } from "@/hooks/useFinancialCategories";

interface CategorySelectProps {
  value: string;
  onChange: (value: string) => void;
  categories: FinancialCategory[];
  onCreate: (name: string, color: string) => Promise<any>;
  className?: string;
  placeholder?: string;
}

const DEFAULT_COLOR = "#6366f1";

export const CategorySelect = ({
  value,
  onChange,
  categories,
  onCreate,
  className,
  placeholder = "Selecione a categoria",
}: CategorySelectProps) => {
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [saving, setSaving] = useState(false);

  const handleCreate = async () => {
    const name = newName.trim();
    if (!name) return;
    setSaving(true);
    await onCreate(name, DEFAULT_COLOR);
    setSaving(false);
    onChange(name);
    setNewName("");
    setCreating(false);
  };

  if (creating) {
    return (
      <div className="flex items-center gap-2">
        <Input
          autoFocus
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Nome da nova categoria"
          className={className}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleCreate();
            }
          }}
        />
        <Button type="button" size="icon" className="h-9 w-9 shrink-0" disabled={!newName.trim() || saving} onClick={handleCreate}>
          <Check className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="h-9 w-9 shrink-0"
          onClick={() => {
            setCreating(false);
            setNewName("");
          }}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Select
        value={value || undefined}
        onValueChange={(v) => {
          if (v === "__new__") {
            setCreating(true);
            return;
          }
          onChange(v);
        }}
      >
        <SelectTrigger className={className}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent className="z-[300]">
          {value && !categories.some((c) => c.name === value) && (
            <SelectItem value={value}>{value}</SelectItem>
          )}
          {categories.map((c) => (
            <SelectItem key={c.id} value={c.name}>
              <span className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: c.color || DEFAULT_COLOR }} />
                {c.name}
              </span>
            </SelectItem>
          ))}
          {categories.length === 0 && (
            <div className="px-2 py-1.5 text-xs text-muted-foreground">Nenhuma categoria criada</div>
          )}
          <SelectItem value="__new__">
            <span className="flex items-center gap-2 text-primary">
              <Plus className="h-3.5 w-3.5" /> Criar nova categoria
            </span>
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};
