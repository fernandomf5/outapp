import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, Globe, Pencil, Trash2, Copy, ExternalLink, 
  Eye, EyeOff, MoreVertical, Search, FileCode, Layout
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface BuilderPage {
  id: string;
  name: string;
  slug: string;
  is_published: boolean;
  views_count: number;
  created_at: string;
  updated_at: string;
}

export const PageBuilderPanel = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [pages, setPages] = useState<BuilderPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [deletingPageId, setDeletingPageId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchPages();
    }
  }, [user]);

  const fetchPages = async () => {
    try {
      const { data, error } = await supabase
        .from('builder_pages')
        .select('id, name, slug, is_published, views_count, created_at, updated_at')
        .eq('user_id', user?.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setPages(data || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar páginas",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingPageId) return;

    try {
      const { error } = await supabase
        .from('builder_pages')
        .delete()
        .eq('id', deletingPageId);

      if (error) throw error;

      setPages(pages.filter(p => p.id !== deletingPageId));
      toast({ title: "Página excluída com sucesso!" });
    } catch (error: any) {
      toast({
        title: "Erro ao excluir",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setDeletingPageId(null);
    }
  };

  const handleDuplicate = async (page: BuilderPage) => {
    try {
      const { data: original, error: fetchError } = await supabase
        .from('builder_pages')
        .select('*')
        .eq('id', page.id)
        .single();

      if (fetchError) throw fetchError;

      const { error: insertError } = await supabase
        .from('builder_pages')
        .insert({
          user_id: user?.id,
          name: `${page.name} (cópia)`,
          slug: `${page.slug}-copia-${Date.now()}`,
          elements: (original as any).elements,
          settings: (original as any).settings,
          is_published: false
        });

      if (insertError) throw insertError;

      fetchPages();
      toast({ title: "Página duplicada com sucesso!" });
    } catch (error: any) {
      toast({
        title: "Erro ao duplicar",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleTogglePublish = async (page: BuilderPage) => {
    try {
      const { error } = await supabase
        .from('builder_pages')
        .update({ 
          is_published: !page.is_published,
          published_at: !page.is_published ? new Date().toISOString() : null
        })
        .eq('id', page.id);

      if (error) throw error;

      setPages(pages.map(p => 
        p.id === page.id ? { ...p, is_published: !p.is_published } : p
      ));
      
      toast({ 
        title: page.is_published ? "Página despublicada" : "Página publicada!",
        description: !page.is_published ? "Sua página está disponível publicamente." : undefined
      });
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const copyLink = (slug: string) => {
    const url = `${window.location.origin}/p/${slug}`;
    navigator.clipboard.writeText(url);
    toast({ title: "Link copiado!" });
  };

  const filteredPages = pages.filter(page =>
    page.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    page.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Layout className="w-6 h-6 text-primary" />
            Criador de Páginas
          </h2>
          <p className="text-muted-foreground mt-1">
            Crie landing pages e sites profissionais com arrasta e solta
          </p>
        </div>
        <Button onClick={() => navigate('/page-builder')} className="gradient-primary gap-2">
          <Plus className="w-4 h-4" />
          Nova Página
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar páginas..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Pages Grid */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-muted rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-4 bg-muted rounded w-1/2 mb-4"></div>
                <div className="h-8 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredPages.length === 0 ? (
        <Card className="p-8 text-center">
          <FileCode className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
          <h3 className="font-semibold text-lg mb-2">
            {searchTerm ? 'Nenhuma página encontrada' : 'Nenhuma página criada'}
          </h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm 
              ? 'Tente buscar com outros termos'
              : 'Comece criando sua primeira página profissional'}
          </p>
          {!searchTerm && (
            <Button onClick={() => navigate('/page-builder')} className="gradient-primary gap-2">
              <Plus className="w-4 h-4" />
              Criar Primeira Página
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredPages.map((page) => (
            <Card key={page.id} className="group hover:border-primary/50 transition-all">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base truncate">{page.name}</CardTitle>
                    <p className="text-sm text-muted-foreground truncate mt-1">
                      /p/{page.slug}
                    </p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => navigate(`/page-builder/${page.id}`)}>
                        <Pencil className="w-4 h-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDuplicate(page)}>
                        <Copy className="w-4 h-4 mr-2" />
                        Duplicar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => copyLink(page.slug)}>
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Copiar Link
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleTogglePublish(page)}>
                        {page.is_published ? (
                          <>
                            <EyeOff className="w-4 h-4 mr-2" />
                            Despublicar
                          </>
                        ) : (
                          <>
                            <Eye className="w-4 h-4 mr-2" />
                            Publicar
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => setDeletingPageId(page.id)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge variant={page.is_published ? 'default' : 'secondary'}>
                    {page.is_published ? 'Publicada' : 'Rascunho'}
                  </Badge>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    {page.views_count} views
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => navigate(`/page-builder/${page.id}`)}
                  >
                    <Pencil className="w-3 h-3 mr-1.5" />
                    Editar
                  </Button>
                  {page.is_published && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => window.open(`/p/${page.slug}`, '_blank')}
                    >
                      <ExternalLink className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingPageId} onOpenChange={() => setDeletingPageId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir página?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A página será permanentemente removida.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
