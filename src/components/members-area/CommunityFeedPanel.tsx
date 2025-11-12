import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Heart, MessageCircle, Pin, Trash2, Send } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ImageUpload } from "@/components/ImageUpload";

interface CommunityFeedPanelProps {
  areaId: string;
}

export function CommunityFeedPanel({ areaId }: CommunityFeedPanelProps) {
  const [posts, setPosts] = useState<any[]>([]);
  const [newPostContent, setNewPostContent] = useState("");
  const [newPostImage, setNewPostImage] = useState("");
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPosts();
  }, [areaId]);

  useEffect(() => {
    if (selectedPost) {
      loadComments(selectedPost.id);
    }
  }, [selectedPost]);

  const loadPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('members_community_posts')
        .select('*')
        .eq('members_area_id', areaId)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPosts(data || []);
    } catch (error: any) {
      toast.error('Erro ao carregar posts');
    } finally {
      setLoading(false);
    }
  };

  const loadComments = async (postId: string) => {
    try {
      const { data } = await supabase
        .from('members_community_comments')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      setComments(data || []);
    } catch (error) {
      console.error('Erro ao carregar comentários');
    }
  };

  const createPost = async () => {
    if (!newPostContent.trim()) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('members_community_posts')
        .insert([{
          members_area_id: areaId,
          author_email: user.email,
          author_name: user.email?.split('@')[0] || 'Admin',
          content: newPostContent,
          image_url: newPostImage || null
        }]);

      if (error) throw error;

      toast.success('Post criado!');
      setNewPostContent("");
      setNewPostImage("");
      loadPosts();
    } catch (error: any) {
      toast.error('Erro ao criar post');
    }
  };

  const togglePin = async (postId: string, currentState: boolean) => {
    try {
      const { error } = await supabase
        .from('members_community_posts')
        .update({ is_pinned: !currentState })
        .eq('id', postId);

      if (error) throw error;
      toast.success(currentState ? 'Post despinado' : 'Post pinado');
      loadPosts();
    } catch (error) {
      toast.error('Erro ao atualizar post');
    }
  };

  const deletePost = async (postId: string) => {
    try {
      const { error } = await supabase
        .from('members_community_posts')
        .delete()
        .eq('id', postId);

      if (error) throw error;
      toast.success('Post excluído');
      loadPosts();
    } catch (error) {
      toast.error('Erro ao excluir post');
    }
  };

  const addComment = async (postId: string) => {
    if (!newComment.trim()) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('members_community_comments')
        .insert([{
          post_id: postId,
          author_email: user.email,
          author_name: user.email?.split('@')[0] || 'Admin',
          content: newComment
        }]);

      if (error) throw error;

      setNewComment("");
      loadComments(postId);
      loadPosts(); // Recarregar para atualizar contadores
    } catch (error) {
      toast.error('Erro ao adicionar comentário');
    }
  };

  if (loading) {
    return <div className="text-center py-8">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Criar Novo Post */}
      <Card>
        <CardHeader>
          <CardTitle>Criar Post na Comunidade</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Compartilhe algo com a comunidade..."
            value={newPostContent}
            onChange={(e) => setNewPostContent(e.target.value)}
            rows={3}
          />
          <ImageUpload
            label="Adicionar Imagem (opcional)"
            onImageSelect={setNewPostImage}
            bucketName="members-content"
          />
          {newPostImage && (
            <img src={newPostImage} alt="Preview" className="w-32 h-32 object-cover rounded" />
          )}
          <Button onClick={createPost} className="w-full">
            <Send className="w-4 h-4 mr-2" />
            Publicar
          </Button>
        </CardContent>
      </Card>

      {/* Feed de Posts */}
      <div className="space-y-4">
        {posts.map((post) => (
          <Card key={post.id}>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback>{post.author_name[0].toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium flex items-center gap-2">
                      {post.author_name}
                      {post.is_pinned && (
                        <Badge variant="secondary" className="gap-1">
                          <Pin className="w-3 h-3" />
                          Fixado
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(post.created_at).toLocaleString('pt-BR')}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => togglePin(post.id, post.is_pinned)}
                  >
                    <Pin className={`w-4 h-4 ${post.is_pinned ? 'fill-current' : ''}`} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deletePost(post.id)}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>

              <div className="whitespace-pre-wrap">{post.content}</div>

              {post.image_url && (
                <img src={post.image_url} alt="Post" className="rounded-lg max-h-96 object-cover" />
              )}

              <div className="flex items-center gap-6 pt-2 border-t">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Heart className="w-4 h-4" />
                  {post.likes_count} curtidas
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2"
                  onClick={() => setSelectedPost(selectedPost?.id === post.id ? null : post)}
                >
                  <MessageCircle className="w-4 h-4" />
                  {post.comments_count} comentários
                </Button>
              </div>

              {/* Seção de Comentários */}
              {selectedPost?.id === post.id && (
                <div className="space-y-3 pt-3 border-t">
                  {comments.map((comment) => (
                    <div key={comment.id} className="flex gap-3">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback>{comment.author_name[0].toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="bg-muted rounded-lg p-3">
                          <div className="font-medium text-sm">{comment.author_name}</div>
                          <div className="text-sm">{comment.content}</div>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {new Date(comment.created_at).toLocaleString('pt-BR')}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <Textarea
                      placeholder="Escreva um comentário..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      rows={2}
                    />
                    <Button onClick={() => addComment(post.id)}>
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {posts.length === 0 && (
          <Card>
            <CardContent className="text-center py-12 text-muted-foreground">
              Nenhum post na comunidade ainda. Crie o primeiro!
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}