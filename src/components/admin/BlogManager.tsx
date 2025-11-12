import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, FileText, Eye } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ImageUpload } from "@/components/ImageUpload";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  author_name: string;
  featured_image_url: string | null;
  category: string | null;
  tags: string[];
  is_published: boolean;
  published_at: string | null;
  views_count: number;
  created_at: string;
}

export function BlogManager() {
  const { toast } = useToast();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setPosts(data);
    }
  };

  const handleSave = async () => {
    if (!editingPost) return;

    setLoading(true);

    const slug = editingPost.slug || 
      editingPost.title.toLowerCase()
        .normalize('NFD').replace(/\p{Diacritic}/gu, '')
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');

    const postData = {
      title: editingPost.title,
      slug,
      content: editingPost.content,
      excerpt: editingPost.excerpt,
      author_name: editingPost.author_name || 'Admin',
      featured_image_url: editingPost.featured_image_url,
      category: editingPost.category,
      tags: editingPost.tags || [],
      is_published: editingPost.is_published,
      published_at: editingPost.is_published && !editingPost.published_at 
        ? new Date().toISOString() 
        : editingPost.published_at,
    };

    if (editingPost.id === 'new') {
      const { data, error } = await supabase
        .from('blog_posts')
        .insert([postData])
        .select()
        .single();

      if (!error && data) {
        setPosts([data, ...posts]);
        toast({ title: "Post criado com sucesso!" });
      } else {
        toast({ title: "Erro ao criar post", description: error?.message, variant: "destructive" });
      }
    } else {
      const { error } = await supabase
        .from('blog_posts')
        .update(postData)
        .eq('id', editingPost.id);

      if (!error) {
        setPosts(posts.map(p => p.id === editingPost.id ? { ...p, ...postData } : p));
        toast({ title: "Post atualizado com sucesso!" });
      } else {
        toast({ title: "Erro ao atualizar post", description: error?.message, variant: "destructive" });
      }
    }

    setDialogOpen(false);
    setEditingPost(null);
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este post?')) return;

    const { error } = await supabase
      .from('blog_posts')
      .delete()
      .eq('id', id);

    if (!error) {
      setPosts(posts.filter(p => p.id !== id));
      toast({ title: "Post excluído com sucesso!" });
    }
  };

  const createNewPost = () => {
    setEditingPost({
      id: 'new',
      title: '',
      slug: '',
      content: '',
      excerpt: '',
      author_name: 'Admin',
      featured_image_url: '',
      category: '',
      tags: [],
      is_published: false,
      published_at: null,
      views_count: 0,
      created_at: new Date().toISOString(),
    });
    setDialogOpen(true);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            <CardTitle>Gerenciar Blog</CardTitle>
          </div>
          <Button onClick={createNewPost} size="sm" className="gradient-primary">
            <Plus className="w-4 h-4 mr-2" />
            Novo Post
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {posts.map((post) => (
            <div
              key={post.id}
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="font-semibold">{post.title}</h4>
                  {post.is_published ? (
                    <Badge className="bg-green-500/20 text-green-500">Publicado</Badge>
                  ) : (
                    <Badge variant="outline">Rascunho</Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {post.excerpt || post.content.substring(0, 150)}...
                </p>
                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                  <span>{post.author_name}</span>
                  {post.category && <span className="flex items-center gap-1">• {post.category}</span>}
                  <span className="flex items-center gap-1">
                    <Eye className="w-3 h-3" /> {post.views_count} visualizações
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setEditingPost(post);
                    setDialogOpen(true);
                  }}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(post.id)}
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
                {editingPost?.id === 'new' ? 'Novo Post' : 'Editar Post'}
              </DialogTitle>
            </DialogHeader>

            {editingPost && (
              <div className="space-y-4">
                <div>
                  <Label>Título</Label>
                  <Input
                    value={editingPost.title}
                    onChange={(e) =>
                      setEditingPost({ ...editingPost, title: e.target.value })
                    }
                    placeholder="Título do post"
                  />
                </div>

                <div>
                  <Label>Slug (URL)</Label>
                  <Input
                    value={editingPost.slug}
                    onChange={(e) =>
                      setEditingPost({ ...editingPost, slug: e.target.value })
                    }
                    placeholder="titulo-do-post"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Autor</Label>
                    <Input
                      value={editingPost.author_name}
                      onChange={(e) =>
                        setEditingPost({ ...editingPost, author_name: e.target.value })
                      }
                      placeholder="Nome do autor"
                    />
                  </div>

                  <div>
                    <Label>Categoria</Label>
                    <Input
                      value={editingPost.category || ''}
                      onChange={(e) =>
                        setEditingPost({ ...editingPost, category: e.target.value })
                      }
                      placeholder="Notícias, Atualizações, etc"
                    />
                  </div>
                </div>

                <div>
                  <ImageUpload
                    label="Imagem Destaque"
                    currentImage={editingPost.featured_image_url || ''}
                    onImageSelect={(url) =>
                      setEditingPost({ ...editingPost, featured_image_url: url })
                    }
                    bucketName="blog-images"
                  />
                </div>

                <div>
                  <Label>Resumo</Label>
                  <Textarea
                    value={editingPost.excerpt || ''}
                    onChange={(e) =>
                      setEditingPost({ ...editingPost, excerpt: e.target.value })
                    }
                    placeholder="Breve descrição do post..."
                    rows={3}
                  />
                </div>

                <div>
                  <Label>Conteúdo</Label>
                  <Textarea
                    value={editingPost.content}
                    onChange={(e) =>
                      setEditingPost({ ...editingPost, content: e.target.value })
                    }
                    placeholder="Conteúdo do post... (Markdown suportado)"
                    className="min-h-[300px] font-mono"
                  />
                </div>

                <div>
                  <Label>Tags (separadas por vírgula)</Label>
                  <Input
                    value={editingPost.tags.join(', ')}
                    onChange={(e) =>
                      setEditingPost({ 
                        ...editingPost, 
                        tags: e.target.value.split(',').map(t => t.trim()).filter(t => t) 
                      })
                    }
                    placeholder="bot, automação, ia"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="published">Publicar Post</Label>
                  <Switch
                    id="published"
                    checked={editingPost.is_published}
                    onCheckedChange={(checked) =>
                      setEditingPost({ ...editingPost, is_published: checked })
                    }
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSave} disabled={loading} className="gradient-primary">
                    Salvar
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
