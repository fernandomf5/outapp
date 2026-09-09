import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { 
  Plus, Search, Star, Copy, Trash2, Edit, FolderPlus, 
  MessageSquareText, MoreVertical, Building2, Briefcase,
  Check, Hash, Filter, Share2, ImagePlus, X, Film
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface ScriptCategory {
  id: string;
  name: string;
  color: string;
  icon: string;
  sort_order: number;
  business_id: string | null;
}

interface SavedScript {
  id: string;
  category_id: string | null;
  business_id: string | null;
  title: string;
  content: string;
  tags: string[];
  is_favorite: boolean;
  use_count: number;
  sort_order: number;
  created_at: string;
  media_url?: string | null;
  media_type?: 'image' | 'video' | null;
}

interface Business {
  id: string;
  name: string;
  logo_url: string | null;
  category: string | null;
}

const CATEGORY_COLORS = [
  "#3b82f6", "#ef4444", "#22c55e", "#f59e0b", "#8b5cf6", 
  "#ec4899", "#06b6d4", "#f97316", "#14b8a6", "#6366f1"
];

export function ScriptOrganizerPanel() {
  const { user } = useAuth();
  const [categories, setCategories] = useState<ScriptCategory[]>([]);
  const [scripts, setScripts] = useState<SavedScript[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  // Dialog states
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [showScriptDialog, setShowScriptDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ScriptCategory | null>(null);
  const [editingScript, setEditingScript] = useState<SavedScript | null>(null);

  // Form states
  const [categoryName, setCategoryName] = useState("");
  const [categoryColor, setCategoryColor] = useState("#3b82f6");
  
  const [scriptTitle, setScriptTitle] = useState("");
  const [scriptContent, setScriptContent] = useState("");
  const [scriptCategoryId, setScriptCategoryId] = useState<string>("");
  
  const [scriptTags, setScriptTags] = useState("");
  const [scriptMediaUrl, setScriptMediaUrl] = useState<string | null>(null);
  const [scriptMediaType, setScriptMediaType] = useState<'image' | 'video' | null>(null);
  const [uploadingMedia, setUploadingMedia] = useState(false);


  useEffect(() => {
    if (user) {
      fetchCategories();
      fetchScripts();
    }
  }, [user]);


  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from('script_categories')
      .select('*')
      .eq('user_id', user!.id)
      .order('sort_order', { ascending: true });
    if (!error && data) {
      const cats = data as unknown as ScriptCategory[];
      setCategories(cats);
      // Seleciona automaticamente a primeira categoria cadastrada
      setSelectedCategory((current) => {
        if (current && cats.some(c => c.id === current)) return current;
        return cats.length > 0 ? cats[0].id : null;
      });
    }
  };

  const fetchScripts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('saved_scripts')
      .select('*')
      .eq('user_id', user!.id)
      .order('is_favorite', { ascending: false })
      .order('sort_order', { ascending: true });
    if (!error && data) setScripts(data as any);
    setLoading(false);
  };

  // Category CRUD
  const handleSaveCategory = async () => {
    if (!categoryName.trim()) return;
    const bizId = null;
    
    if (editingCategory) {
      const { error } = await supabase
        .from('script_categories')
        .update({ name: categoryName.trim(), color: categoryColor, business_id: bizId } as any)
        .eq('id', editingCategory.id);
      if (error) { toast.error("Erro ao atualizar categoria"); return; }
      toast.success("Categoria atualizada!");
    } else {
      const { error } = await supabase
        .from('script_categories')
        .insert({ 
          user_id: user!.id, 
          name: categoryName.trim(), 
          color: categoryColor,
          business_id: bizId,
          sort_order: categories.length 
        } as any);
      if (error) { toast.error("Erro ao criar categoria"); return; }
      toast.success("Categoria criada!");
    }
    
    resetCategoryForm();
    fetchCategories();
  };

  const handleDeleteCategory = async (id: string) => {
    const { error } = await supabase.from('script_categories').delete().eq('id', id);
    if (error) { toast.error("Erro ao excluir"); return; }
    if (selectedCategory === id) setSelectedCategory(null);
    toast.success("Categoria excluída!");
    fetchCategories();
    fetchScripts();
  };

  // Script CRUD
  const handleSaveScript = async () => {
    if (!scriptTitle.trim() || !scriptContent.trim()) {
      toast.error("Preencha título e conteúdo");
      return;
    }
    
    const tags = scriptTags.split(",").map(t => t.trim()).filter(Boolean);
    const bizId = null;
    const catId = scriptCategoryId && scriptCategoryId !== "none" ? scriptCategoryId : null;
    const payload = {
      user_id: user!.id,
      title: scriptTitle.trim(),
      content: scriptContent.trim(),
      category_id: catId,
      business_id: bizId,
      tags,
      sort_order: scripts.length,
      media_url: scriptMediaUrl,
      media_type: scriptMediaType,
    };

    if (editingScript) {
      const { error } = await supabase.from('saved_scripts').update(payload as any).eq('id', editingScript.id);
      if (error) { toast.error("Erro ao atualizar"); return; }
      toast.success("Script atualizado!");
    } else {
      const { error } = await supabase.from('saved_scripts').insert(payload as any);
      if (error) { toast.error("Erro ao criar"); return; }
      toast.success("Script criado!");
    }

    resetScriptForm();
    fetchScripts();
  };

  const handleDeleteScript = async (id: string) => {
    const { error } = await supabase.from('saved_scripts').delete().eq('id', id);
    if (error) { toast.error("Erro ao excluir"); return; }
    toast.success("Script excluído!");
    fetchScripts();
  };

  const handleToggleFavorite = async (script: SavedScript) => {
    await supabase.from('saved_scripts').update({ is_favorite: !script.is_favorite }).eq('id', script.id);
    fetchScripts();
  };

  // Copia apenas o texto / script para a área de transferência.
  const handleCopyText = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      toast.success("Texto copiado!");
    } catch {
      toast.error("Não foi possível copiar o texto.");
    }
  };

  // A área de transferência do navegador só aceita imagem em PNG.
  // Converte qualquer formato (jpg/webp/etc) para PNG via canvas.
  const fetchImageAsPng = async (url: string): Promise<Blob> => {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Falha ao carregar a imagem');
    const blob = await response.blob();
    if (blob.type === 'image/png') return blob;
    const bitmap = await createImageBitmap(blob);
    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas não suportado');
    ctx.drawImage(bitmap, 0, 0);
    bitmap.close();
    const png = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
    if (!png) throw new Error('Falha ao converter a imagem');
    return png;
  };

  // Copia apenas a imagem (em PNG) para a área de transferência.
  const handleCopyImage = async (url: string) => {
    try {
      if (typeof ClipboardItem === 'undefined' || !navigator.clipboard?.write) {
        throw new Error('Navegador não suporta cópia de imagem');
      }
      const pngBlob = await fetchImageAsPng(url);
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': pngBlob }),
      ]);
      toast.success('Imagem copiada! Agora cole no WhatsApp, depois volte e copie o texto.');
    } catch (error) {
      console.error('Erro ao copiar imagem:', error);
      toast.error('Não foi possível copiar a imagem. Use o botão "Enviar".');
    }
  };

  // Copia o link do vídeo para a área de transferência.
  const handleCopyVideoLink = async (script: SavedScript) => {
    if (!script.media_url) return;
    try {
      await navigator.clipboard.writeText(script.media_url);
      toast.success('Link do vídeo copiado! Agora cole no WhatsApp, depois volte e copie o texto.');
    } catch {
      toast.error('Não foi possível copiar o link do vídeo.');
    }
  };

  // Compartilha texto + arquivo direto no WhatsApp / apps do celular
  const handleShareScript = async (script: SavedScript) => {
    try {
      if (script.media_url && typeof navigator.share === 'function') {
        const response = await fetch(script.media_url);
        const blob = await response.blob();
        const ext = script.media_type === 'video' ? 'mp4' : 'jpg';
        const file = new File([blob], `${script.title || 'mensagem'}.${ext}`, { type: blob.type });
        if (!navigator.canShare || navigator.canShare({ files: [file] })) {
          await navigator.share({ text: script.content, files: [file] });
          return;
        }
      }
      if (typeof navigator.share === 'function') {
        await navigator.share({ text: script.media_url ? `${script.content}\n\n${script.media_url}` : script.content });
        return;
      }
      await handleCopyText(script.content);
    } catch (error) {
      if ((error as DOMException)?.name === 'AbortError') return;
      console.error('Erro ao compartilhar:', error);
      toast.error('Não foi possível compartilhar. O texto foi copiado.');
      await handleCopyText(script.content);
    }
  };

  const handleUploadMedia = async (file: File) => {
    if (!user) return;
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    if (!isImage && !isVideo) {
      toast.error('Selecione uma imagem ou um vídeo');
      return;
    }
    if (file.size > 25 * 1024 * 1024) {
      toast.error('Arquivo muito grande. Máximo 25MB');
      return;
    }
    setUploadingMedia(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `${user.id}/scripts/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from('chatbot-media').upload(path, file, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from('chatbot-media').getPublicUrl(path);
      setScriptMediaUrl(data.publicUrl);
      setScriptMediaType(isImage ? 'image' : 'video');
      toast.success('Mídia anexada!');
    } catch (error) {
      console.error('Erro no upload:', error);
      toast.error('Erro ao enviar o arquivo');
    } finally {
      setUploadingMedia(false);
    }
  };

  const handleIncrementUse = async (script: SavedScript, mode: 'text' | 'media') => {
    if (mode === 'text') {
      await handleCopyText(script.content);
    } else if (script.media_type === 'image' && script.media_url) {
      await handleCopyImage(script.media_url);
    } else if (script.media_type === 'video' && script.media_url) {
      await handleCopyVideoLink(script);
    }
    await supabase.from('saved_scripts').update({ use_count: script.use_count + 1 }).eq('id', script.id);
    fetchScripts();
  };


  // Form helpers
  const resetCategoryForm = () => {
    setShowCategoryDialog(false);
    setEditingCategory(null);
    setCategoryName("");
    setCategoryColor("#3b82f6");
    
  };

  const resetScriptForm = () => {
    setShowScriptDialog(false);
    setEditingScript(null);
    setScriptTitle("");
    setScriptContent("");
    setScriptCategoryId("");
    
    setScriptTags("");
    setScriptMediaUrl(null);
    setScriptMediaType(null);
  };

  const openEditCategory = (cat: ScriptCategory) => {
    setEditingCategory(cat);
    setCategoryName(cat.name);
    setCategoryColor(cat.color);
    
    setShowCategoryDialog(true);
  };

  const openEditScript = (s: SavedScript) => {
    setEditingScript(s);
    setScriptTitle(s.title);
    setScriptContent(s.content);
    setScriptCategoryId(s.category_id || "");
    setScriptMediaUrl(s.media_url || null);
    setScriptMediaType(s.media_type || null);
    setScriptTags(s.tags?.join(", ") || "");
    setShowScriptDialog(true);
  };

  // Filtering
  const getCategoryById = (id: string | null) => categories.find(c => c.id === id);

  const filteredScripts = scripts.filter(s => {
    // Business filter removed


    // Category filter
    const matchCategory = !selectedCategory || 
      (selectedCategory === "none" ? !s.category_id : s.category_id === selectedCategory);

    // Search
    const matchSearch = !searchQuery || 
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.tags?.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchCategory && matchSearch;
  });


  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <MessageSquareText className="h-5 w-5 text-primary" />
                Organizador de Scripts
              </CardTitle>
              <CardDescription>
                Organize mensagens e scripts por negócios cadastrados ou avulsos
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setShowCategoryDialog(true)}>
                <FolderPlus className="h-4 w-4 mr-1" />
                Categoria
              </Button>
              <Button size="sm" onClick={() => setShowScriptDialog(true)}>
                <Plus className="h-4 w-4 mr-1" />
                Novo Script
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar scripts por título, conteúdo ou tag..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Category filter dropdown */}
          {categories.length > 0 ? (
            <Select
              value={selectedCategory || categories[0]?.id}
              onValueChange={(v) => setSelectedCategory(v)}
            >
              <SelectTrigger className="w-full sm:max-w-xs">
                <SelectValue placeholder="Selecione a categoria" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(cat => {
                  const count = scripts.filter(s => s.category_id === cat.id).length;
                  return (
                    <SelectItem key={cat.id} value={cat.id}>
                      <span className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                        {cat.name} ({count})
                      </span>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          ) : (
            !loading && (
              <p className="text-sm text-muted-foreground">
                Nenhuma categoria criada. Crie uma categoria para organizar seus scripts.
              </p>
            )
          )}

          {/* Category management */}
          {categories.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {categories.map(cat => {
                return (
                  <div key={cat.id} className="flex items-center gap-1 bg-muted rounded-lg px-2 py-1 text-xs">
                    <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                    <span className="font-medium">{cat.name}</span>
                    <button onClick={() => openEditCategory(cat)} className="text-muted-foreground hover:text-foreground ml-1">
                      <Edit className="h-3 w-3" />
                    </button>
                    <button onClick={() => handleDeleteCategory(cat.id)} className="text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Scripts grid */}
          {loading ? (
            <div className="text-center py-10 text-muted-foreground">Carregando...</div>
          ) : filteredScripts.length === 0 ? (
            <div className="text-center py-10">
              <MessageSquareText className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-muted-foreground font-medium">
                {searchQuery ? "Nenhum script encontrado" : "Nenhum script criado ainda"}
              </p>
              <p className="text-sm text-muted-foreground/70 mt-1">
                {!searchQuery && "Crie seu primeiro script clicando em 'Novo Script'"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {filteredScripts.map(script => {
                const cat = getCategoryById(script.category_id);
                
                return (
                  <Card key={script.id} className="group relative hover:shadow-md transition-shadow border-l-4" style={{ borderLeftColor: cat?.color || 'hsl(var(--border))' }}>
                    <CardContent className="p-4 space-y-2">
                      {/* Header */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-sm truncate">{script.title}</h4>
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
                            {cat && (
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                                {cat.name}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button 
                            onClick={() => handleToggleFavorite(script)}
                            className="p-1 hover:bg-accent rounded transition-colors"
                          >
                            <Star className={`h-4 w-4 ${script.is_favorite ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} />
                          </button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button className="p-1 hover:bg-accent rounded transition-colors">
                                <MoreVertical className="h-4 w-4 text-muted-foreground" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEditScript(script)}>
                                <Edit className="h-4 w-4 mr-2" /> Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDeleteScript(script.id)} className="text-destructive">
                                <Trash2 className="h-4 w-4 mr-2" /> Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>

                      {/* Mídia anexada */}
                      {script.media_url && (
                        script.media_type === 'video' ? (
                          <video
                            src={script.media_url}
                            controls
                            className="w-full h-32 object-cover rounded-md border border-border bg-muted"
                          />
                        ) : (
                          <img
                            src={script.media_url}
                            alt={`Mídia da mensagem ${script.title}`}
                            loading="lazy"
                            className="w-full h-32 object-cover rounded-md border border-border"
                          />
                        )
                      )}

                      {/* Content preview */}
                      <p className="text-xs text-muted-foreground line-clamp-4 whitespace-pre-wrap leading-relaxed">
                        {script.content}
                      </p>

                      {/* Tags */}
                      {script.tags && script.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {script.tags.map((tag, i) => (
                            <Badge key={i} variant="secondary" className="text-[10px] px-1.5 py-0">
                              <Hash className="h-2.5 w-2.5 mr-0.5" />{tag}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {/* Footer */}
                      <div className="flex flex-col gap-1 pt-2 border-t border-border">
                        <div className="flex flex-wrap items-center justify-end gap-1">
                          {script.media_url && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 px-2 text-[10px] gap-1"
                              onClick={() => handleShareScript(script)}
                              aria-label="Enviar mensagem com mídia"
                            >
                              <Share2 className="h-3 w-3" /> Enviar
                            </Button>
                          )}
                          {script.media_url && script.media_type === 'image' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 px-2 text-[10px] gap-1"
                              onClick={() => handleIncrementUse(script, 'media')}
                              aria-label="Copiar imagem"
                            >
                              <ImagePlus className="h-3 w-3" /> Copiar imagem
                            </Button>
                          )}
                          {script.media_url && script.media_type === 'video' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 px-2 text-[10px] gap-1"
                              onClick={() => handleIncrementUse(script, 'media')}
                              aria-label="Copiar link do vídeo"
                            >
                              <Film className="h-3 w-3" /> Copiar vídeo
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 px-2 text-[10px] gap-1"
                            onClick={() => handleIncrementUse(script, 'text')}
                            aria-label="Copiar texto"
                          >
                            <Copy className="h-3 w-3" /> Copiar texto
                          </Button>
                        </div>
                        <span className="text-[10px] text-muted-foreground text-right">
                          Usado {script.use_count}x
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Category Dialog */}
      <Dialog open={showCategoryDialog} onOpenChange={(v) => { if (!v) resetCategoryForm(); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingCategory ? "Editar Categoria" : "Nova Categoria"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Nome da categoria (ex: E-commerce, Saúde...)"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
            />


            <div>
              <label className="text-sm font-medium mb-2 block">Cor</label>
              <div className="flex flex-wrap gap-2">
                {CATEGORY_COLORS.map(c => (
                  <button
                    key={c}
                    onClick={() => setCategoryColor(c)}
                    className="w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 flex items-center justify-center"
                    style={{ backgroundColor: c, borderColor: categoryColor === c ? 'white' : 'transparent' }}
                  >
                    {categoryColor === c && <Check className="h-4 w-4 text-white" />}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={resetCategoryForm}>Cancelar</Button>
            <Button onClick={handleSaveCategory} disabled={!categoryName.trim()}>
              {editingCategory ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Script Dialog */}
      <Dialog open={showScriptDialog} onOpenChange={(v) => { if (!v) resetScriptForm(); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingScript ? "Editar Script" : "Novo Script de Atendimento"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Título do script (ex: Boas-vindas E-commerce)"
              value={scriptTitle}
              onChange={(e) => setScriptTitle(e.target.value)}
            />

            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Categoria</label>
                <Select value={scriptCategoryId} onValueChange={setScriptCategoryId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sem categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sem categoria</SelectItem>
                    {categories.map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>
                        <span className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                          {cat.name}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">Mensagem / Script</label>
              <Textarea
                placeholder={"Digite sua mensagem ou script de atendimento aqui...\n\nExemplo:\nOlá! 👋 Seja bem-vindo(a)!\nMeu nome é [nome], como posso ajudar?"}
                value={scriptContent}
                onChange={(e) => setScriptContent(e.target.value)}
                rows={10}
                className="resize-y font-mono text-sm"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">Imagem ou vídeo (opcional)</label>
              {scriptMediaUrl ? (
                <div className="relative">
                  {scriptMediaType === 'video' ? (
                    <video src={scriptMediaUrl} controls className="w-full h-44 object-cover rounded-lg border border-border bg-muted" />
                  ) : (
                    <img src={scriptMediaUrl} alt="Mídia anexada à mensagem" className="w-full h-44 object-cover rounded-lg border border-border" />
                  )}
                  <Button
                    type="button"
                    size="icon"
                    variant="destructive"
                    className="absolute top-2 right-2 h-7 w-7"
                    aria-label="Remover mídia"
                    onClick={() => { setScriptMediaUrl(null); setScriptMediaType(null); }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-border rounded-lg p-6 cursor-pointer hover:border-primary transition-colors">
                  <div className="flex gap-2 text-muted-foreground">
                    <ImagePlus className="h-6 w-6" />
                    <Film className="h-6 w-6" />
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {uploadingMedia ? 'Enviando...' : 'Clique para anexar imagem ou vídeo (até 25MB)'}
                  </span>
                  <input
                    type="file"
                    accept="image/*,video/*"
                    className="hidden"
                    disabled={uploadingMedia}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleUploadMedia(file);
                      e.target.value = '';
                    }}
                  />
                </label>
              )}
            </div>


            <div>
              <label className="text-sm font-medium mb-1.5 block">Tags (separadas por vírgula)</label>
              <Input
                placeholder="ex: boas-vindas, vendas, suporte"
                value={scriptTags}
                onChange={(e) => setScriptTags(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={resetScriptForm}>Cancelar</Button>
            <Button onClick={handleSaveScript} disabled={!scriptTitle.trim() || !scriptContent.trim()}>
              {editingScript ? "Salvar" : "Criar Script"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
