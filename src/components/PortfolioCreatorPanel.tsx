import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { 
  Plus, 
  Trash2, 
  Edit, 
  Eye, 
  Copy, 
  Palette, 
  Image as ImageIcon, 
  GripVertical,
  ExternalLink,
  Star,
  FolderOpen,
  Video,
  Link as LinkIcon
} from "lucide-react";
import { ImageUpload } from "@/components/ImageUpload";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface Portfolio {
  id: string;
  name: string;
  description: string | null;
  niche: string;
  primary_color: string;
  secondary_color: string;
  logo_url: string | null;
  cover_url: string | null;
  is_active: boolean;
  is_public: boolean;
  slug: string | null;
  created_at: string;
}

interface PortfolioItem {
  id: string;
  portfolio_id: string;
  title: string;
  description: string | null;
  category: string;
  image_url: string | null;
  video_url: string | null;
  project_url: string | null;
  client_name: string | null;
  display_order: number;
  is_featured: boolean;
  images: string[] | null;
}

const nicheOptions = [
  { value: "general", label: "Geral" },
  { value: "design", label: "Design Gráfico" },
  { value: "web", label: "Desenvolvimento Web" },
  { value: "photography", label: "Fotografia" },
  { value: "video", label: "Produção de Vídeo" },
  { value: "marketing", label: "Marketing Digital" },
  { value: "social_media", label: "Social Media" },
  { value: "architecture", label: "Arquitetura" },
  { value: "interior", label: "Design de Interiores" },
  { value: "fashion", label: "Moda" },
  { value: "art", label: "Arte" },
  { value: "music", label: "Música" },
  { value: "consulting", label: "Consultoria" },
  { value: "education", label: "Educação" },
  { value: "other", label: "Outro" },
];

interface SortableItemProps {
  item: PortfolioItem;
  onEdit: () => void;
  onDelete: () => void;
  onToggleFeatured: () => void;
}

function SortableItem({ item, onEdit, onDelete, onToggleFeatured }: SortableItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <Card className="mb-3">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div {...listeners} className="cursor-grab hover:text-primary">
              <GripVertical className="w-5 h-5 text-muted-foreground" />
            </div>
            
            {item.image_url ? (
              <img 
                src={item.image_url} 
                alt={item.title} 
                className="w-16 h-16 object-cover rounded-lg"
              />
            ) : (
              <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                <ImageIcon className="w-6 h-6 text-muted-foreground" />
              </div>
            )}
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="font-semibold truncate">{item.title}</h4>
                {item.is_featured && (
                  <Badge variant="secondary" className="shrink-0">
                    <Star className="w-3 h-3 mr-1" /> Destaque
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground truncate">{item.category}</p>
              {item.client_name && (
                <p className="text-xs text-muted-foreground">Cliente: {item.client_name}</p>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={onToggleFeatured} title={item.is_featured ? "Remover destaque" : "Destacar"}>
                <Star className={`w-4 h-4 ${item.is_featured ? "fill-yellow-500 text-yellow-500" : ""}`} />
              </Button>
              <Button variant="ghost" size="icon" onClick={onEdit}>
                <Edit className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={onDelete} className="text-destructive">
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function PortfolioCreatorPanel() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [selectedPortfolio, setSelectedPortfolio] = useState<Portfolio | null>(null);
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [isPortfolioDialogOpen, setIsPortfolioDialogOpen] = useState(false);
  const [isItemDialogOpen, setIsItemDialogOpen] = useState(false);
  const [editingPortfolio, setEditingPortfolio] = useState<Portfolio | null>(null);
  const [editingItem, setEditingItem] = useState<PortfolioItem | null>(null);
  const [loading, setLoading] = useState(true);

  const [portfolioForm, setPortfolioForm] = useState({
    name: "",
    description: "",
    niche: "general",
    primary_color: "#8B5CF6",
    secondary_color: "#0EA5E9",
    logo_url: "",
    cover_url: "",
    is_public: true,
  });

  const [itemForm, setItemForm] = useState({
    title: "",
    description: "",
    category: "",
    image_url: "",
    video_url: "",
    project_url: "",
    client_name: "",
    is_featured: false,
    images: [] as string[],
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (user) {
      fetchPortfolios();
    }
  }, [user]);

  useEffect(() => {
    if (selectedPortfolio) {
      fetchItems(selectedPortfolio.id);
    }
  }, [selectedPortfolio]);

  const fetchPortfolios = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("portfolios")
      .select("*")
      .eq("user_id", user?.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setPortfolios(data);
      if (data.length > 0 && !selectedPortfolio) {
        setSelectedPortfolio(data[0]);
      }
    }
    setLoading(false);
  };

  const fetchItems = async (portfolioId: string) => {
    const { data, error } = await supabase
      .from("portfolio_items")
      .select("*")
      .eq("portfolio_id", portfolioId)
      .order("display_order", { ascending: true });

    if (!error && data) {
      setItems(data);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  };

  const handleSavePortfolio = async () => {
    if (!portfolioForm.name) {
      toast({
        title: "Erro",
        description: "Nome do portfólio é obrigatório",
        variant: "destructive",
      });
      return;
    }

    const slug = generateSlug(portfolioForm.name);
    const data = {
      ...portfolioForm,
      slug,
      user_id: user?.id,
    };

    if (editingPortfolio) {
      const { error } = await supabase
        .from("portfolios")
        .update(data)
        .eq("id", editingPortfolio.id);

      if (error) {
        toast({ title: "Erro ao atualizar", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Portfólio atualizado!" });
        fetchPortfolios();
        handleClosePortfolioDialog();
      }
    } else {
      const { error } = await supabase.from("portfolios").insert(data);

      if (error) {
        toast({ title: "Erro ao criar", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Portfólio criado!" });
        fetchPortfolios();
        handleClosePortfolioDialog();
      }
    }
  };

  const handleDeletePortfolio = async (id: string) => {
    const { error } = await supabase.from("portfolios").delete().eq("id", id);

    if (error) {
      toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Portfólio excluído" });
      if (selectedPortfolio?.id === id) {
        setSelectedPortfolio(null);
        setItems([]);
      }
      fetchPortfolios();
    }
  };

  const handleEditPortfolio = (portfolio: Portfolio) => {
    setEditingPortfolio(portfolio);
    setPortfolioForm({
      name: portfolio.name,
      description: portfolio.description || "",
      niche: portfolio.niche,
      primary_color: portfolio.primary_color || "#8B5CF6",
      secondary_color: portfolio.secondary_color || "#0EA5E9",
      logo_url: portfolio.logo_url || "",
      cover_url: portfolio.cover_url || "",
      is_public: portfolio.is_public,
    });
    setIsPortfolioDialogOpen(true);
  };

  const handleClosePortfolioDialog = () => {
    setIsPortfolioDialogOpen(false);
    setEditingPortfolio(null);
    setPortfolioForm({
      name: "",
      description: "",
      niche: "general",
      primary_color: "#8B5CF6",
      secondary_color: "#0EA5E9",
      logo_url: "",
      cover_url: "",
      is_public: true,
    });
  };

  const handleSaveItem = async () => {
    if (!itemForm.title || !selectedPortfolio) {
      toast({
        title: "Erro",
        description: "Título do trabalho é obrigatório",
        variant: "destructive",
      });
      return;
    }

    const data = {
      title: itemForm.title,
      description: itemForm.description,
      category: itemForm.category,
      image_url: itemForm.image_url,
      video_url: itemForm.video_url,
      project_url: itemForm.project_url,
      client_name: itemForm.client_name,
      is_featured: itemForm.is_featured,
      images: itemForm.images,
      portfolio_id: selectedPortfolio.id,
      display_order: editingItem ? editingItem.display_order : items.length,
    };

    if (editingItem) {
      const { error } = await supabase
        .from("portfolio_items")
        .update(data)
        .eq("id", editingItem.id);

      if (error) {
        toast({ title: "Erro ao atualizar", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Trabalho atualizado!" });
        fetchItems(selectedPortfolio.id);
        handleCloseItemDialog();
      }
    } else {
      const { error } = await supabase.from("portfolio_items").insert(data);

      if (error) {
        toast({ title: "Erro ao criar", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Trabalho adicionado!" });
        fetchItems(selectedPortfolio.id);
        handleCloseItemDialog();
      }
    }
  };

  const handleDeleteItem = async (id: string) => {
    const { error } = await supabase.from("portfolio_items").delete().eq("id", id);

    if (error) {
      toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Trabalho excluído" });
      if (selectedPortfolio) {
        fetchItems(selectedPortfolio.id);
      }
    }
  };

  const handleEditItem = (item: PortfolioItem) => {
    setEditingItem(item);
    setItemForm({
      title: item.title,
      description: item.description || "",
      category: item.category || "",
      image_url: item.image_url || "",
      video_url: item.video_url || "",
      project_url: item.project_url || "",
      client_name: item.client_name || "",
      is_featured: item.is_featured,
      images: item.images || [],
    });
    setIsItemDialogOpen(true);
  };

  const handleCloseItemDialog = () => {
    setIsItemDialogOpen(false);
    setEditingItem(null);
    setItemForm({
      title: "",
      description: "",
      category: "",
      image_url: "",
      video_url: "",
      project_url: "",
      client_name: "",
      is_featured: false,
      images: [],
    });
  };

  const handleAddGalleryImage = (url: string) => {
    if (itemForm.images.length < 10 && url) {
      setItemForm({ ...itemForm, images: [...itemForm.images, url] });
    }
  };

  const handleRemoveGalleryImage = (index: number) => {
    setItemForm({ 
      ...itemForm, 
      images: itemForm.images.filter((_, i) => i !== index) 
    });
  };

  const [uploadingGallery, setUploadingGallery] = useState(false);

  const handleMultipleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const remainingSlots = 10 - itemForm.images.length;
    const filesToUpload = Array.from(files).slice(0, remainingSlots);

    if (filesToUpload.length === 0) {
      toast({ title: "Limite atingido", description: "Você já tem 10 imagens na galeria", variant: "destructive" });
      return;
    }

    setUploadingGallery(true);
    const newImages: string[] = [];

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({ title: "Erro", description: "Você precisa estar autenticado", variant: "destructive" });
        return;
      }

      for (const file of filesToUpload) {
        if (!file.type.startsWith('image/')) continue;
        if (file.size > 5 * 1024 * 1024) continue;

        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('portfolio-images')
          .upload(fileName, file, { cacheControl: '3600', upsert: true });

        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage
            .from('portfolio-images')
            .getPublicUrl(fileName);
          newImages.push(publicUrl);
        }
      }

      if (newImages.length > 0) {
        setItemForm(prev => ({ ...prev, images: [...prev.images, ...newImages] }));
        toast({ title: `${newImages.length} imagem(ns) adicionada(s)!` });
      }
    } catch (error) {
      console.error('Error uploading images:', error);
      toast({ title: "Erro ao enviar imagens", variant: "destructive" });
    } finally {
      setUploadingGallery(false);
      // Reset input
      event.target.value = '';
    }
  };

  const handleToggleFeatured = async (item: PortfolioItem) => {
    const { error } = await supabase
      .from("portfolio_items")
      .update({ is_featured: !item.is_featured })
      .eq("id", item.id);

    if (!error && selectedPortfolio) {
      fetchItems(selectedPortfolio.id);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);

      const newItems = arrayMove(items, oldIndex, newIndex);
      setItems(newItems);

      // Update order in database
      for (let i = 0; i < newItems.length; i++) {
        await supabase
          .from("portfolio_items")
          .update({ display_order: i })
          .eq("id", newItems[i].id);
      }
    }
  };

  const handleCopyLink = (portfolio: Portfolio) => {
    const link = `${window.location.origin}/portfolio/${portfolio.id}/${portfolio.slug || "view"}`;
    navigator.clipboard.writeText(link);
    toast({ title: "Link copiado!" });
  };

  const handlePreview = (portfolio: Portfolio) => {
    const link = `${window.location.origin}/portfolio/${portfolio.id}/${portfolio.slug || "view"}`;
    window.open(link, "_blank");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FolderOpen className="w-6 h-6 text-primary" />
          Criador de Portfólio
        </CardTitle>
        <CardDescription>
          Crie portfólios profissionais para mostrar seus trabalhos
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Lista de Portfólios */}
          <div className="lg:w-1/3 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Meus Portfólios</h3>
              <Dialog open={isPortfolioDialogOpen} onOpenChange={setIsPortfolioDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" onClick={() => setEditingPortfolio(null)}>
                    <Plus className="w-4 h-4 mr-2" /> Novo
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>
                      {editingPortfolio ? "Editar Portfólio" : "Criar Novo Portfólio"}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <div>
                      <Label>Nome *</Label>
                      <Input
                        value={portfolioForm.name}
                        onChange={(e) => setPortfolioForm({ ...portfolioForm, name: e.target.value })}
                        placeholder="Ex: Portfólio de Design"
                      />
                    </div>

                    <div>
                      <Label>Descrição</Label>
                      <Textarea
                        value={portfolioForm.description}
                        onChange={(e) => setPortfolioForm({ ...portfolioForm, description: e.target.value })}
                        placeholder="Descreva seu portfólio"
                      />
                    </div>

                    <div>
                      <Label>Nicho</Label>
                      <Select
                        value={portfolioForm.niche}
                        onValueChange={(value) => setPortfolioForm({ ...portfolioForm, niche: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {nicheOptions.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="flex items-center gap-2">
                          <Palette className="w-4 h-4" /> Cor Primária
                        </Label>
                        <div className="flex gap-2">
                          <input
                            type="color"
                            value={portfolioForm.primary_color}
                            onChange={(e) => setPortfolioForm({ ...portfolioForm, primary_color: e.target.value })}
                            className="w-12 h-10 rounded cursor-pointer"
                          />
                          <Input
                            value={portfolioForm.primary_color}
                            onChange={(e) => setPortfolioForm({ ...portfolioForm, primary_color: e.target.value })}
                          />
                        </div>
                      </div>
                      <div>
                        <Label className="flex items-center gap-2">
                          <Palette className="w-4 h-4" /> Cor Secundária
                        </Label>
                        <div className="flex gap-2">
                          <input
                            type="color"
                            value={portfolioForm.secondary_color}
                            onChange={(e) => setPortfolioForm({ ...portfolioForm, secondary_color: e.target.value })}
                            className="w-12 h-10 rounded cursor-pointer"
                          />
                          <Input
                            value={portfolioForm.secondary_color}
                            onChange={(e) => setPortfolioForm({ ...portfolioForm, secondary_color: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <Label>Logo</Label>
                      <ImageUpload
                        currentImage={portfolioForm.logo_url}
                        onImageSelect={(url) => setPortfolioForm({ ...portfolioForm, logo_url: url || "" })}
                        bucketName="portfolio-images"
                      />
                    </div>

                    <div>
                      <Label>Imagem de Capa</Label>
                      <ImageUpload
                        currentImage={portfolioForm.cover_url}
                        onImageSelect={(url) => setPortfolioForm({ ...portfolioForm, cover_url: url || "" })}
                        bucketName="portfolio-images"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <Switch
                        checked={portfolioForm.is_public}
                        onCheckedChange={(checked) => setPortfolioForm({ ...portfolioForm, is_public: checked })}
                      />
                      <Label>Portfólio Público</Label>
                    </div>

                    <Button onClick={handleSavePortfolio} className="w-full">
                      {editingPortfolio ? "Atualizar" : "Criar"} Portfólio
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {portfolios.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FolderOpen className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Nenhum portfólio criado</p>
                </div>
              ) : (
                portfolios.map((portfolio) => (
                  <Card
                    key={portfolio.id}
                    className={`cursor-pointer transition-all ${
                      selectedPortfolio?.id === portfolio.id
                        ? "ring-2 ring-primary"
                        : "hover:shadow-md"
                    }`}
                    onClick={() => setSelectedPortfolio(portfolio)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold truncate">{portfolio.name}</h4>
                          <p className="text-xs text-muted-foreground">
                            {nicheOptions.find((n) => n.value === portfolio.niche)?.label}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Badge variant={portfolio.is_public ? "default" : "secondary"}>
                            {portfolio.is_public ? "Público" : "Privado"}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex gap-1 mt-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePreview(portfolio);
                          }}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyLink(portfolio);
                          }}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditPortfolio(portfolio);
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeletePortfolio(portfolio.id);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>

          {/* Itens do Portfólio */}
          <div className="lg:w-2/3">
            {selectedPortfolio ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">{selectedPortfolio.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {items.length} trabalho(s)
                    </p>
                  </div>
                  <Dialog open={isItemDialogOpen} onOpenChange={setIsItemDialogOpen}>
                    <DialogTrigger asChild>
                      <Button onClick={() => setEditingItem(null)}>
                        <Plus className="w-4 h-4 mr-2" /> Adicionar Trabalho
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>
                          {editingItem ? "Editar Trabalho" : "Adicionar Trabalho"}
                        </DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 mt-4">
                        <div>
                          <Label>Título *</Label>
                          <Input
                            value={itemForm.title}
                            onChange={(e) => setItemForm({ ...itemForm, title: e.target.value })}
                            placeholder="Ex: Redesign de Logo"
                          />
                        </div>

                        <div>
                          <Label>Descrição</Label>
                          <Textarea
                            value={itemForm.description}
                            onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
                            placeholder="Descreva o trabalho realizado"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Categoria</Label>
                            <Input
                              value={itemForm.category}
                              onChange={(e) => setItemForm({ ...itemForm, category: e.target.value })}
                              placeholder="Ex: Design, Web, Vídeo"
                            />
                          </div>
                          <div>
                            <Label>Cliente</Label>
                            <Input
                              value={itemForm.client_name}
                              onChange={(e) => setItemForm({ ...itemForm, client_name: e.target.value })}
                              placeholder="Nome do cliente"
                            />
                          </div>
                        </div>

                        <div>
                          <Label className="flex items-center gap-2">
                            <ImageIcon className="w-4 h-4" /> Imagem Principal
                          </Label>
                          <ImageUpload
                            currentImage={itemForm.image_url}
                            onImageSelect={(url) => setItemForm({ ...itemForm, image_url: url || "" })}
                            bucketName="portfolio-images"
                          />
                        </div>

                        <div>
                          <Label className="flex items-center gap-2">
                            <ImageIcon className="w-4 h-4" /> Galeria de Imagens ({itemForm.images.length}/10)
                          </Label>
                          <p className="text-xs text-muted-foreground mb-2">
                            Adicione até 10 imagens para exibir em carrossel
                          </p>
                          
                          {itemForm.images.length > 0 && (
                            <div className="grid grid-cols-5 gap-2 mb-3">
                              {itemForm.images.map((img, idx) => (
                                <div key={idx} className="relative group">
                                  <img 
                                    src={img} 
                                    alt={`Galeria ${idx + 1}`} 
                                    className="w-full h-16 object-cover rounded"
                                  />
                                  <Button
                                    type="button"
                                    variant="destructive"
                                    size="icon"
                                    className="absolute -top-2 -right-2 h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => handleRemoveGalleryImage(idx)}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}
                          
                          {itemForm.images.length < 10 && (
                            <div 
                              className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary transition-colors cursor-pointer"
                              onClick={() => document.getElementById('gallery-upload')?.click()}
                            >
                              <input
                                id="gallery-upload"
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={handleMultipleFileUpload}
                                disabled={uploadingGallery}
                                className="hidden"
                              />
                              <ImageIcon className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                              <p className="text-sm text-muted-foreground">
                                {uploadingGallery ? 'Enviando...' : 'Clique para selecionar imagens'}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                Selecione até {10 - itemForm.images.length} imagens de uma vez
                              </p>
                            </div>
                          )}
                        </div>

                        <div>
                          <Label className="flex items-center gap-2">
                            <Video className="w-4 h-4" /> URL do Vídeo
                          </Label>
                          <Input
                            value={itemForm.video_url}
                            onChange={(e) => setItemForm({ ...itemForm, video_url: e.target.value })}
                            placeholder="https://youtube.com/watch?v=..."
                          />
                        </div>

                        <div>
                          <Label className="flex items-center gap-2">
                            <LinkIcon className="w-4 h-4" /> Link do Projeto
                          </Label>
                          <Input
                            value={itemForm.project_url}
                            onChange={(e) => setItemForm({ ...itemForm, project_url: e.target.value })}
                            placeholder="https://..."
                          />
                        </div>

                        <div className="flex items-center gap-2">
                          <Switch
                            checked={itemForm.is_featured}
                            onCheckedChange={(checked) => setItemForm({ ...itemForm, is_featured: checked })}
                          />
                          <Label className="flex items-center gap-2">
                            <Star className="w-4 h-4" /> Destacar este trabalho
                          </Label>
                        </div>

                        <Button onClick={handleSaveItem} className="w-full">
                          {editingItem ? "Atualizar" : "Adicionar"} Trabalho
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                {items.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
                    <ImageIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg mb-2">Nenhum trabalho adicionado</p>
                    <p className="text-sm">Clique em "Adicionar Trabalho" para começar</p>
                  </div>
                ) : (
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
                      {items.map((item) => (
                        <SortableItem
                          key={item.id}
                          item={item}
                          onEdit={() => handleEditItem(item)}
                          onDelete={() => handleDeleteItem(item.id)}
                          onToggleFeatured={() => handleToggleFeatured(item)}
                        />
                      ))}
                    </SortableContext>
                  </DndContext>
                )}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <FolderOpen className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg mb-2">Selecione um portfólio</p>
                <p className="text-sm">Ou crie um novo para começar</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
