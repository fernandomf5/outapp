import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Package, Wrench, Info, RefreshCw, LayoutGrid } from "lucide-react";

const db = supabase as any;

interface FreeCategory {
  id: string;
  name: string;
  color: string | null;
  entity_kind: string | null;
  item_groups: string[] | null;
  count: number;
}

interface Props {
  userId: string;
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}

export default function CatalogRegistrationLinker({ userId, selectedIds, onChange }: Props) {
  const [categories, setCategories] = useState<FreeCategory[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!userId) return;
    setLoading(true);
    const { data: cats } = await db
      .from("registration_categories")
      .select("id,name,color,entity_kind,item_groups")
      .eq("user_id", userId)
      .in("entity_kind", ["product", "service"])
      .order("sort_order", { ascending: true });

    const list = (cats || []) as any[];
    const counts: Record<string, number> = {};
    if (list.length) {
      const { data: items } = await db
        .from("contacts")
        .select("id,registration_category_id")
        .eq("user_id", userId)
        .in("registration_category_id", list.map((c) => c.id));
      (items || []).forEach((i: any) => {
        counts[i.registration_category_id] = (counts[i.registration_category_id] || 0) + 1;
      });
    }
    setCategories(list.map((c) => ({ ...c, count: counts[c.id] || 0 })));
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const toggle = (id: string) =>
    onChange(selectedIds.includes(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <LayoutGrid className="h-4 w-4" />
              Produtos da Gestão Livre
            </CardTitle>
            <CardDescription>
              Vincule categorias de produtos/serviços cadastradas na Gestão Livre.
            </CardDescription>
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={load} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2 rounded-lg border border-dashed bg-muted/40 p-3 text-xs text-muted-foreground">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Para adicionar produtos: crie uma categoria de <strong>Produtos</strong> ou <strong>Serviços</strong> na
            Gestão Livre, cadastre seus itens (e, se quiser, crie subcategorias como Blusas, Calças, Shorts) e depois
            vincule a categoria aqui. Tudo aparece no catálogo exatamente como foi organizado na gestão.
          </span>
        </div>

        {loading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : categories.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            Nenhuma categoria de produtos ou serviços criada na Gestão Livre ainda.
          </p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {categories.map((cat) => {
              const checked = selectedIds.includes(cat.id);
              const Icon = cat.entity_kind === "service" ? Wrench : Package;
              return (
                <button
                  type="button"
                  key={cat.id}
                  onClick={() => toggle(cat.id)}
                  className={`flex items-start gap-3 rounded-lg border p-3 text-left transition ${
                    checked ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                  }`}
                >
                  <Checkbox checked={checked} className="pointer-events-none mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 shrink-0" style={{ color: cat.color || undefined }} />
                      <span className="truncate text-sm font-medium">{cat.name}</span>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-1">
                      <Badge variant="secondary" className="text-[10px]">
                        {cat.count} {cat.count === 1 ? "item" : "itens"}
                      </Badge>
                      {(cat.item_groups || []).map((g) => (
                        <Badge key={g} variant="outline" className="text-[10px]">{g}</Badge>
                      ))}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
