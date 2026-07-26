import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Plus, X, LayoutGrid } from "lucide-react";

interface Props {
  groups: string[];
  onChange: (groups: string[]) => void;
}

/** Editor de subcategorias (ex: Blusas, Calças) usadas para dividir os itens da categoria. */
export function ItemGroupsEditor({ groups, onChange }: Props) {
  const [value, setValue] = useState("");

  const add = () => {
    const v = value.trim();
    if (!v) return;
    if (groups.some((g) => g.toLowerCase() === v.toLowerCase())) {
      setValue("");
      return;
    }
    onChange([...groups, v]);
    setValue("");
  };

  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-2 text-sm">
        <LayoutGrid className="h-4 w-4" />
        Subcategorias (opcional)
      </Label>
      <p className="text-xs text-muted-foreground">
        Divida seus itens em grupos, ex: Blusas, Calças, Shorts. Eles aparecem separados no catálogo.
      </p>
      <div className="flex gap-2">
        <Input
          value={value}
          placeholder="Ex: Blusas"
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
        />
        <Button type="button" variant="outline" onClick={add}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      {groups.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {groups.map((g) => (
            <Badge key={g} variant="secondary" className="gap-1 pr-1">
              {g}
              <button
                type="button"
                aria-label={`Remover ${g}`}
                className="rounded-full p-0.5 hover:bg-muted-foreground/20"
                onClick={() => onChange(groups.filter((x) => x !== g))}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
