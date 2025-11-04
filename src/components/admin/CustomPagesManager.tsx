import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, FileText } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface CustomPage {
  id: string;
  title: string;
  slug: string;
  content: string;
  is_active: boolean;
  order_index: number;
}

export const CustomPagesManager = () => {
  const { toast } = useToast();
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

  const handleSave = async () => {
    if (!editingPage) return;

    if (!editingPage.title || !editingPage.slug) {
      toast({ 
        title: "Erro", 
        description: "Título e slug são obrigatórios",
        variant: "destructive" 
      });
      return;
    }

    const pageData = {
      title: editingPage.title,
      slug: editingPage.slug.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
      content: editingPage.content,
      is_active: editingPage.is_active,
      order_index: editingPage.order_index,
    };

    if (editingPage.id === 'new') {
      const { data, error } = await supabase
        .from('custom_pages')
        .insert([pageData])
        .select()
        .single();

      if (error) {
        toast({ 
          title: "Erro ao criar página", 
          description: error.message,
          variant: "destructive" 
        });
        return;
      }

      if (data) {
        await fetchPages();
        toast({ title: "Página criada com sucesso!" });
      }
    } else {
      const { error } = await supabase
        .from('custom_pages')
        .update(pageData)
        .eq('id', editingPage.id);

      if (error) {
        toast({ 
          title: "Erro ao atualizar página", 
          description: error.message,
          variant: "destructive" 
        });
        return;
      }

      await fetchPages();
      toast({ title: "Página atualizada com sucesso!" });
    }

    setDialogOpen(false);
    setEditingPage(null);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from('custom_pages')
      .delete()
      .eq('id', id);

    if (!error) {
      setPages(pages.filter(p => p.id !== id));
      toast({ title: "Página excluída com sucesso!" });
    }
  };

  const createNewPage = () => {
    setEditingPage({
      id: 'new',
      title: '',
      slug: '',
      content: '',
      is_active: true,
      order_index: pages.length,
    });
    setDialogOpen(true);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            <CardTitle>Páginas Personalizadas</CardTitle>
          </div>
          <Button onClick={createNewPage} size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Nova Página
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {pages.map((page) => (
            <div
              key={page.id}
              className="flex items-center justify-between p-4 border rounded-lg"
            >
              <div className="flex-1">
                <h4 className="font-semibold">{page.title}</h4>
                <p className="text-sm text-muted-foreground">
                  {page.is_active ? 'Ativo' : 'Inativo'}
                </p>
                <p className="text-xs text-muted-foreground">
                  Link: <Link to={`/${page.slug}`} className="text-primary hover:underline">/{page.slug}</Link>
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" asChild>
                  <Link
                    to={`/${page.slug}`}
                    aria-label="Ver página"
                  >
                    <FileText className="w-4 h-4" />
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setEditingPage(page);
                    setDialogOpen(true);
                  }}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(page.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingPage?.id === 'new' ? 'Nova Página' : 'Editar Página'}
              </DialogTitle>
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
                      placeholder="termos-de-uso"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="active">Página ativa</Label>
                  <Switch
                    id="active"
                    checked={editingPage.is_active}
                    onCheckedChange={(checked) =>
                      setEditingPage({ ...editingPage, is_active: checked })
                    }
                  />
                </div>

                <div>
                  <Label>Conteúdo da Página</Label>
                  <Textarea
                    value={editingPage.content}
                    onChange={(e) =>
                      setEditingPage({ ...editingPage, content: e.target.value })
                    }
                    placeholder="Digite o conteúdo da página aqui... Você pode usar parágrafos, listas, etc."
                    className="min-h-[400px] font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    O conteúdo será exibido formatado na página
                  </p>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSave}>Salvar</Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};