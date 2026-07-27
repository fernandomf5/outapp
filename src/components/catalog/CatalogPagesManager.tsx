import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { FileText, Plus, Pencil, Trash2, ExternalLink, Loader2 } from "lucide-react";

interface CatalogPage {
  id: string;
  title: string;
  slug: string;
  content: string;
  is_published: boolean;
  show_in_menu: boolean;
  sort_order: number;
}

interface Props {
  catalogId: string;
  catalogSlug: string;
  userId: string;
}

const slugify = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

export default function CatalogPagesManager({ catalogId, catalogSlug, userId }: Props) {
  const { toast } = useToast();
  const [pages, setPages] = useState<CatalogPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<Partial<CatalogPage> | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CatalogPage | null>(null);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [catalogId]);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("catalog_pages" as any)
      .select("*")
      .eq("catalog_id", catalogId)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });
    setPages((data as unknown as CatalogPage[]) || []);
    setLoading(false);
  };

  const handleSave = async () => {
    if (!editing?.title?.trim()) {
      toast({ title: "Informe o título da página", variant: "destructive" });
      return;
    }
    setSaving(true);
    const payload = {
      catalog_id: catalogId,
      user_id: userId,
      title: editing.title.trim(),
      slug: slugify(editing.slug || editing.title),
      content: editing.content || "",
      is_published: editing.is_published ?? true,
      show_in_menu: editing.show_in_menu ?? true,
      sort_order: editing.sort_order ?? pages.length,
    };

    const { error } = editing.id
      ? await supabase.from("catalog_pages" as any).update(payload).eq("id", editing.id)
      : await supabase.from("catalog_pages" as any).insert(payload);

    setSaving(false);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: editing.id ? "Página atualizada!" : "Página criada!" });
    setEditing(null);
    load();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const { error } = await supabase.from("catalog_pages" as any).delete().eq("id", deleteTarget.id);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return;
    }
    setPages((prev) => prev.filter((p) => p.id !== deleteTarget.id));
    setDeleteTarget(null);
    toast({ title: "Página excluída!" });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-sm text-muted-foreground">
          Crie páginas institucionais (Sobre, Trocas, Entregas, Contato) que aparecem no menu do catálogo.
        </p>
        <Button
          size="sm"
          onClick={() =>
            setEditing({ title: "", slug: "", content: "", is_published: true, show_in_menu: true })
          }
        >
          <Plus className="w-4 h-4 mr-1" /> Nova página
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : pages.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground">
          <FileText className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">Nenhuma página criada ainda.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {pages.map((page) => (
            <Card key={page.id}>
              <CardContent className="p-4 flex items-center gap-3 flex-wrap">
                <FileText className="w-5 h-5 text-primary/70" />
                <div className="flex-1 min-w-[180px]">
                  <p className="font-semibold text-sm flex items-center gap-2">
                    {page.title}
                    {!page.is_published && <Badge variant="outline">Rascunho</Badge>}
                    {page.show_in_menu && <Badge variant="secondary">No menu</Badge>}
                  </p>
                  <p className="text-xs text-muted-foreground">/catalogo/{catalogSlug}/p/{page.slug}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    window.open(`/catalogo/${catalogSlug}/p/${page.slug}`, "_blank")
                  }
                >
                  <ExternalLink className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setEditing(page)}>
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive"
                  onClick={() => setDeleteTarget(page)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing?.id ? "Editar página" : "Nova página"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Título</Label>
                <Input
                  value={editing?.title || ""}
                  onChange={(e) => setEditing((p) => ({ ...p, title: e.target.value }))}
                  placeholder="Sobre nós"
                />
              </div>
              <div className="space-y-2">
                <Label>Endereço (slug)</Label>
                <Input
                  value={editing?.slug || ""}
                  onChange={(e) => setEditing((p) => ({ ...p, slug: e.target.value }))}
                  placeholder="sobre-nos"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Conteúdo</Label>
              <Textarea
                rows={10}
                value={editing?.content || ""}
                onChange={(e) => setEditing((p) => ({ ...p, content: e.target.value }))}
                placeholder="Escreva o conteúdo da página..."
              />
            </div>
            <div className="flex flex-wrap gap-6">
              <div className="flex items-center gap-2">
                <Switch
                  checked={editing?.is_published ?? true}
                  onCheckedChange={(v) => setEditing((p) => ({ ...p, is_published: v }))}
                />
                <Label className="text-sm">Publicada</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={editing?.show_in_menu ?? true}
                  onCheckedChange={(v) => setEditing((p) => ({ ...p, show_in_menu: v }))}
                />
                <Label className="text-sm">Mostrar no menu do catálogo</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="z-[300]">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir página?</AlertDialogTitle>
            <AlertDialogDescription>
              A página "{deleteTarget?.title}" será removida do catálogo permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground"
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
