import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { ExternalLink, Loader2, Plus, Search, Trash2, Link2Off } from "lucide-react";
import {
  RESOURCE_TYPES,
  buildResourceTitle,
  buildResourceUrl,
  resourceIcon,
  resourceLabel,
} from "@/lib/resourceLinks";
import { useContactResources } from "@/hooks/useContactResourceLinks";

interface ContactResourcesTabProps {
  contactId: string;
  contactName: string;
  categoryId?: string | null;
}

export function ContactResourcesTab({ contactId, contactName, categoryId }: ContactResourcesTabProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { links, loading, reload, removeLink } = useContactResources(contactId);

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  // add dialog state
  const [addOpen, setAddOpen] = useState(false);
  const [addType, setAddType] = useState<string>(RESOURCE_TYPES[0].key);
  const [addSearch, setAddSearch] = useState("");
  const [addLoading, setAddLoading] = useState(false);
  const [addRows, setAddRows] = useState<Array<{ id: string; title: string }>>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const linkedIds = useMemo(
    () => new Set(links.filter((l) => l.resource_type === addType).map((l) => l.resource_id)),
    [links, addType]
  );

  useEffect(() => {
    const loadResources = async () => {
      if (!addOpen || !user?.id) return;
      const def = RESOURCE_TYPES.find((r) => r.key === addType);
      if (!def) return;
      setAddLoading(true);
      setSelected([]);
      const { data, error } = await supabase
        .from(def.table as any)
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) {
        setAddRows([]);
      } else {
        setAddRows(
          ((data || []) as any[]).map((row) => ({
            id: row.id,
            title: buildResourceTitle(addType, row),
          }))
        );
      }
      setAddLoading(false);
    };
    loadResources();
  }, [addOpen, addType, user?.id]);

  const availableTypes = useMemo(() => {
    const set = new Set(links.map((l) => l.resource_type));
    return RESOURCE_TYPES.filter((r) => set.has(r.key));
  }, [links]);

  const filtered = links.filter((l) => {
    if (typeFilter !== "all" && l.resource_type !== typeFilter) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (l.resource_title || "").toLowerCase().includes(q) ||
      resourceLabel(l.resource_type).toLowerCase().includes(q)
    );
  });

  const handleAttach = async () => {
    if (!user?.id || selected.length === 0) return;
    try {
      setSaving(true);
      const rows = selected.map((id) => {
        const row = addRows.find((r) => r.id === id);
        return {
          user_id: user.id,
          contact_id: contactId,
          category_id: categoryId ?? null,
          resource_type: addType,
          resource_id: id,
          resource_title: row?.title || null,
          resource_url: buildResourceUrl(addType, id),
        };
      });
      const { error } = await supabase.from("contact_resource_links" as any).insert(rows as any);
      if (error) throw error;
      toast.success(`${rows.length} recurso(s) atribuído(s) a ${contactName}`);
      setAddOpen(false);
      reload();
    } catch (e: any) {
      toast.error("Erro ao atribuir recurso: " + (e?.message || ""));
    } finally {
      setSaving(false);
    }
  };

  const addRowsFiltered = addRows.filter((r) =>
    addSearch.trim() ? r.title.toLowerCase().includes(addSearch.toLowerCase()) : true
  );

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <CardTitle className="text-lg">Atribuições de {contactName}</CardTitle>
              <p className="text-sm text-muted-foreground">
                Tudo que este cadastro possui na plataforma, com acesso em um clique.
              </p>
            </div>
            <Button size="sm" onClick={() => setAddOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" /> Atribuir recurso
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar recurso atribuído..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="md:w-[240px]">
                <SelectValue placeholder="Todos os recursos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os recursos</SelectItem>
                {availableTypes.map((t) => (
                  <SelectItem key={t.key} value={t.key}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-10 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mr-2" /> Carregando...
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
              <Link2Off className="h-10 w-10 text-muted-foreground/50" />
              <div>
                <p className="font-medium">Nenhum recurso atribuído ainda</p>
                <p className="text-sm text-muted-foreground">
                  Clique em "Atribuir recurso" para vincular gestões financeiras, tarefas, contratos e mais.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filtered.map((link) => {
                const Icon = resourceIcon(link.resource_type);
                return (
                  <div
                    key={link.id}
                    className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted/40 transition-colors"
                  >
                    <div className="h-9 w-9 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{link.resource_title || "Sem título"}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="secondary" className="text-[10px]">
                          {resourceLabel(link.resource_type)}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(link.created_at).toLocaleDateString("pt-BR")}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        title="Abrir recurso"
                        onClick={() =>
                          navigate(link.resource_url || buildResourceUrl(link.resource_type, link.resource_id))
                        }
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-destructive"
                        title="Remover atribuição"
                        onClick={async () => {
                          const ok = await removeLink(link.id);
                          if (ok) toast.success("Atribuição removida");
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>Atribuir recurso a {contactName}</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-2">
              <Label>Tipo de recurso</Label>
              <Select value={addType} onValueChange={setAddType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {RESOURCE_TYPES.map((t) => (
                    <SelectItem key={t.key} value={t.key}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar..."
                value={addSearch}
                onChange={(e) => setAddSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="max-h-[300px] overflow-y-auto rounded-md border divide-y">
              {addLoading ? (
                <div className="flex items-center justify-center py-8 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" /> Carregando...
                </div>
              ) : addRowsFiltered.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  Nenhum item encontrado neste recurso.
                </div>
              ) : (
                addRowsFiltered.map((row) => {
                  const already = linkedIds.has(row.id);
                  const checked = selected.includes(row.id);
                  return (
                    <label
                      key={row.id}
                      className={`flex items-center gap-3 p-3 text-sm ${
                        already ? "opacity-60" : "cursor-pointer hover:bg-muted/40"
                      }`}
                    >
                      <Checkbox
                        checked={already || checked}
                        disabled={already}
                        onCheckedChange={(v) =>
                          setSelected((prev) =>
                            v ? [...prev, row.id] : prev.filter((id) => id !== row.id)
                          )
                        }
                      />
                      <span className="flex-1 truncate">{row.title}</span>
                      {already && (
                        <Badge variant="outline" className="text-[10px]">
                          Já atribuído
                        </Badge>
                      )}
                    </label>
                  );
                })
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAttach} disabled={saving || selected.length === 0}>
              {saving ? "Atribuindo..." : `Atribuir (${selected.length})`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
