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
  Check, Hash, Filter
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
    if (!error && data) setCategories(data as any);
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

  const handleCopyScript = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success("Copiado para a área de transferência!");
  };

  const handleIncrementUse = async (script: SavedScript) => {
    handleCopyScript(script.content);
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

          {/* Category filter chips */}
          <div className="flex flex-wrap gap-2">
            <Badge 
              variant={!selectedCategory ? "default" : "outline"} 
              className="cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => setSelectedCategory(null)}
            >
              Todos
            </Badge>
            {categories.map(cat => {
              const count = scripts.filter(s => s.category_id === cat.id).length;
              return (
                <Badge
                  key={cat.id}
                  variant={selectedCategory === cat.id ? "default" : "outline"}
                  className="cursor-pointer hover:opacity-80 transition-opacity gap-1.5"
                  style={selectedCategory === cat.id ? { backgroundColor: cat.color } : { borderColor: cat.color, color: cat.color }}
                  onClick={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
                >
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: selectedCategory === cat.id ? 'white' : cat.color }} />
                  {cat.name} ({count})
                </Badge>
              );
            })}
          </div>

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
                const biz = getBusinessById(script.business_id);
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
                      <div className="flex items-center justify-between pt-1 border-t border-border">
                        <span className="text-[10px] text-muted-foreground">
                          Usado {script.use_count}x
                        </span>
                        <Button size="sm" variant="ghost" className="h-7 text-xs gap-1" onClick={() => handleIncrementUse(script)}>
                          <Copy className="h-3 w-3" /> Copiar
                        </Button>
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
