import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import { Edit, Trash2, Eye } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RichTextEditor } from "./RichTextEditor";

interface CustomPage {
  id: string;
  title: string;
  slug: string;
  content: string;
  is_active: boolean;
  order_index: number;
}

export const PageCreator = () => {
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [content, setContent] = useState("");
  const [creating, setCreating] = useState(false);
  const [createdSlug, setCreatedSlug] = useState<string | null>(null);
  const [pages, setPages] = useState<CustomPage[]>([]);
  const [editingPage, setEditingPage] = useState<CustomPage | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    fetchPages();
  }, []);

  const fetchPages = async () => {
    const { data, error } = await supabase
      .from('custom_pages')
      .select('*')
      .order('order_index', { ascending: true });

    if (!error && data) {
      setPages(data as CustomPage[]);
    }
  };

  const slugify = (text: string) =>
    text
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "")
      .replace(/-+/g, "-");

  const handleCreate = async () => {
    if (!title || !slug) {
      toast({ title: "Campos obrigatórios", description: "Informe título e slug.", variant: "destructive" });
      return;
    }

    setCreating(true);
    setCreatedSlug(null);

    try {
      const cleanSlug = slugify(slug);

      // Definir order_index como a contagem atual para manter ordenação simples
      const { count } = await supabase
        .from('custom_pages')
        .select('*', { count: 'exact', head: true });

      const orderIndex = count ?? 0;

      const { data, error } = await supabase
        .from('custom_pages')
        .insert([
          {
            title,
            slug: cleanSlug,
            content,
            is_active: true,
            order_index: orderIndex,
          } as any,
        ])
        .select()
        .single();

      if (error) throw error;

      setCreatedSlug(data.slug);
      toast({ title: "Página criada!", description: `/${data.slug}` });
      // Abrir automaticamente a nova página criada
      window.open(`/${data.slug}`, '_blank');
      setTitle("");
      setSlug("");
      setContent("");
      await fetchPages();
    } catch (e: any) {
      toast({ title: "Erro ao criar página", description: e?.message || "Tente novamente.", variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  const handleEdit = (page: CustomPage) => {
    setEditingPage(page);
    setDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingPage) return;

    try {
      const { error } = await supabase
        .from('custom_pages')
        .update({
          title: editingPage.title,
          slug: slugify(editingPage.slug),
          content: editingPage.content,
        } as any)
        .eq('id', editingPage.id);

      if (error) throw error;

      toast({ title: "Página atualizada!" });
      setDialogOpen(false);
      setEditingPage(null);
      await fetchPages();
    } catch (e: any) {
      toast({ title: "Erro ao atualizar", description: e?.message, variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta página?")) return;

    try {
      const { error } = await supabase
        .from('custom_pages')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({ title: "Página excluída!" });
      await fetchPages();
    } catch (e: any) {
      toast({ title: "Erro ao excluir", description: e?.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Criar Nova Página</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Título</Label>
                <Input
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    if (!slug) setSlug(slugify(e.target.value));
                  }}
                  placeholder="Ex: Sobre nós"
                />
              </div>
              <div>
                <Label>Slug (URL)</Label>
                <Input
                  value={slug}
                  onChange={(e) => setSlug(slugify(e.target.value))}
                  placeholder="ex: sobre-nos"
                />
                <p className="text-xs text-muted-foreground mt-1">URL final: /{slugify(slug || title)}</p>
              </div>
            </div>

            <div>
              <Label>Conteúdo</Label>
              <RichTextEditor value={content} onChange={setContent} />
            </div>

            <div className="flex items-center gap-2">
              <Button onClick={handleCreate} disabled={creating}>
                {creating ? 'Criando...' : 'Criar página'}
              </Button>
              {createdSlug && (
              <Button asChild variant="outline">
                <a href={`/${createdSlug}`} target="_blank" rel="noopener noreferrer">
                  Ver página
                </a>
              </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Páginas Criadas</CardTitle>
        </CardHeader>
        <CardContent>
          {pages.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma página criada ainda.</p>
          ) : (
            <div className="space-y-3">
              {pages.map((page) => (
                <div
                  key={page.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <h4 className="font-semibold">{page.title}</h4>
                    <p className="text-sm text-muted-foreground">/{page.slug}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" asChild>
                      <a href={`/${page.slug}`} target="_blank" rel="noopener noreferrer">
                        <Eye className="w-4 h-4" />
                      </a>
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(page)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(page.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Página</DialogTitle>
          </DialogHeader>
          {editingPage && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Título</Label>
                  <Input
                    value={editingPage.title}
                    onChange={(e) =>
                      setEditingPage({ ...editingPage, title: e.target.value })
                    }
                    placeholder="Título da página"
                  />
                </div>
                <div>
                  <Label>Slug (URL)</Label>
                  <Input
                    value={editingPage.slug}
                    onChange={(e) =>
                      setEditingPage({ ...editingPage, slug: e.target.value })
                    }
                    placeholder="slug-da-pagina"
                  />
                </div>
              </div>

              <div>
                <Label>Conteúdo</Label>
                <RichTextEditor
                  value={editingPage.content}
                  onChange={(val) => setEditingPage({ ...editingPage, content: val })}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSaveEdit}>Salvar</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
