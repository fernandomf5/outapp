import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
  location: 'header' | 'footer' | 'both';
  open_as_popup: boolean;
  is_active: boolean;
  order_index: number;
  custom_header_code?: string;
  custom_footer_code?: string;
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

    const pageData = {
      title: editingPage.title,
      slug: editingPage.slug,
      content: editingPage.content,
      location: editingPage.location,
      open_as_popup: editingPage.open_as_popup,
      is_active: editingPage.is_active,
      order_index: editingPage.order_index,
    };

    if (editingPage.id === 'new') {
      const { data, error } = await supabase
        .from('custom_pages')
        .insert([pageData])
        .select()
        .single();

      if (!error && data) {
        setPages([...pages, data as CustomPage]);
        toast({ title: "Página criada com sucesso!" });
      }
    } else {
      const { error } = await supabase
        .from('custom_pages')
        .update(pageData)
        .eq('id', editingPage.id);

      if (!error) {
        setPages(pages.map(p => p.id === editingPage.id ? { ...p, ...pageData } : p));
        toast({ title: "Página atualizada com sucesso!" });
      }
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
      location: 'footer',
      open_as_popup: false,
      is_active: true,
      order_index: pages.length,
      custom_header_code: '',
      custom_footer_code: '',
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
                  {page.location === 'header' ? 'Cabeçalho' : page.location === 'footer' ? 'Rodapé' : 'Ambos'} • Página •
                  {page.is_active ? ' Ativo' : ' Inativo'}
                </p>
                <p className="text-xs text-muted-foreground">Link: /custom/{page.slug}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" asChild>
                  <a
                    href={`/custom/${page.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Ver página"
                  >
                    <FileText className="w-4 h-4" />
                  </a>
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

                <div>
                  <Label>Localização</Label>
                  <RadioGroup
                    value={editingPage.location}
                    onValueChange={(value: 'header' | 'footer' | 'both') =>
                      setEditingPage({ ...editingPage, location: value })
                    }
                    className="space-y-3 mt-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="header" id="header" />
                      <Label htmlFor="header" className="font-normal">Cabeçalho (Menu Principal)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="footer" id="footer" />
                      <Label htmlFor="footer" className="font-normal">Rodapé</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="both" id="both" />
                      <Label htmlFor="both" className="font-normal">Ambos (Topo e Rodapé)</Label>
                    </div>
                  </RadioGroup>
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
                    placeholder="Digite o conteúdo da página aqui... (pressione Enter para pular linha)"
                    className="min-h-[300px]"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    O texto será exibido exatamente como você escrever, preservando quebras de linha
                  </p>
                </div>

                <div>
                  <Label>Código Header Personalizado (opcional)</Label>
                  <Textarea
                    value={editingPage.custom_header_code || ''}
                    onChange={(e) =>
                      setEditingPage({ ...editingPage, custom_header_code: e.target.value })
                    }
                    placeholder="<script>...</script> ou <style>...</style>"
                    className="min-h-[100px] font-mono text-xs"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Será inserido no &lt;head&gt; do site clonado
                  </p>
                </div>

                <div>
                  <Label>Código Footer Personalizado (opcional)</Label>
                  <Textarea
                    value={editingPage.custom_footer_code || ''}
                    onChange={(e) =>
                      setEditingPage({ ...editingPage, custom_footer_code: e.target.value })
                    }
                    placeholder="<script>...</script>"
                    className="min-h-[100px] font-mono text-xs"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Será inserido antes do &lt;/body&gt; do site clonado
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