import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { DeleteConfirmDialog } from "@/components/ui/delete-confirm-dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import {
  BookOpen,
  Plus,
  Pencil,
  Trash2,
  Copy,
  ExternalLink,
  Share2,
  Eye,
  MessageCircle,
  Loader2,
  Palette,
  Store,
  Settings,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import CatalogDashboard from "./catalog/CatalogDashboard";
import CatalogProductSelector from "./catalog/CatalogProductSelector";

interface Catalog {
  id: string;
  user_id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  cover_url: string | null;
  primary_color: string;
  background_color: string | null;
  text_color: string | null;
  whatsapp_number: string | null;
  show_prices: boolean;
  show_stock: boolean;
  show_description: boolean;
  layout_style: string;
  is_active: boolean;
  store_open: boolean;
  store_closed_message: string | null;
  show_all_items: boolean;
  selected_product_ids: string[] | null;
  selected_service_ids: string[] | null;
  views_count: number;
  created_at: string;
  updated_at: string;
}

const defaultCatalogForm = {
  name: "",
  slug: "",
  description: "",
  logo_url: "",
  cover_url: "",
  primary_color: "#3b82f6",
  background_color: "#ffffff",
  text_color: "#1f2937",
  whatsapp_number: "",
  show_prices: true,
  show_stock: false,
  show_description: true,
  layout_style: "grid",
  is_active: true,
  store_open: true,
  store_closed_message: "Estamos fechados no momento. Volte em breve!",
  show_all_items: true,
  selected_product_ids: [] as string[],
  selected_service_ids: [] as string[],
  group_by_category: false,
};

export default function CatalogCreatorPanel() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [catalogs, setCatalogs] = useState<Catalog[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCatalog, setEditingCatalog] = useState<Catalog | null>(null);
  const [formData, setFormData] = useState(defaultCatalogForm);
  const [deleteCatalogId, setDeleteCatalogId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [productCount, setProductCount] = useState(0);
  const [serviceCount, setServiceCount] = useState(0);
  const [selectedCatalog, setSelectedCatalog] = useState<Catalog | null>(null);

  useEffect(() => {
    if (user) {
      loadCatalogs();
      loadCounts();
    }
  }, [user]);

  useEffect(() => {
    if (editingCatalog) {
      setFormData({
        name: editingCatalog.name,
        slug: editingCatalog.slug,
        description: editingCatalog.description || "",
        logo_url: editingCatalog.logo_url || "",
        cover_url: editingCatalog.cover_url || "",
        primary_color: editingCatalog.primary_color || "#3b82f6",
        background_color: editingCatalog.background_color || "#ffffff",
        text_color: editingCatalog.text_color || "#1f2937",
        whatsapp_number: editingCatalog.whatsapp_number || "",
        show_prices: editingCatalog.show_prices,
        show_stock: editingCatalog.show_stock,
        show_description: editingCatalog.show_description,
        layout_style: editingCatalog.layout_style || "grid",
        is_active: editingCatalog.is_active,
        store_open: editingCatalog.store_open ?? true,
        store_closed_message: editingCatalog.store_closed_message || "Estamos fechados no momento. Volte em breve!",
        show_all_items: editingCatalog.show_all_items ?? true,
        selected_product_ids: editingCatalog.selected_product_ids || [],
        selected_service_ids: editingCatalog.selected_service_ids || [],
        group_by_category: (editingCatalog as any).group_by_category ?? false,
      });
    } else {
      setFormData(defaultCatalogForm);
    }
  }, [editingCatalog]);

  const loadCatalogs = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("catalogs" as any)
      .select("*")
      .eq("user_id", user?.id)
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Erro ao carregar catálogos",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setCatalogs((data as any) || []);
    }
    setLoading(false);
  };

  const loadCounts = async () => {
    const [productsRes, servicesRes] = await Promise.all([
      supabase
        .from("products" as any)
        .select("id", { count: "exact", head: true })
        .eq("user_id", user?.id)
        .eq("is_active", true),
      supabase
        .from("user_services" as any)
        .select("id", { count: "exact", head: true })
        .eq("user_id", user?.id)
        .eq("is_active", true),
    ]);

    setProductCount(productsRes.count || 0);
    setServiceCount(servicesRes.count || 0);
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .substring(0, 50);
  };

  const handleNameChange = (name: string) => {
    setFormData((prev) => ({
      ...prev,
      name,
      slug: !editingCatalog ? generateSlug(name) : prev.slug,
    }));
  };

  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "logo" | "cover"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Erro",
        description: "Selecione uma imagem válida",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Erro",
        description: "A imagem deve ter no máximo 5MB",
        variant: "destructive",
      });
      return;
    }

    if (type === "logo") setUploadingLogo(true);
    else setUploadingCover(true);

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `catalogs/${user?.id}/${Date.now()}-${type}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("chatbot-media")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("chatbot-media").getPublicUrl(fileName);

      setFormData((prev) => ({
        ...prev,
        [type === "logo" ? "logo_url" : "cover_url"]: publicUrl,
      }));

      toast({ title: "Imagem enviada!" });
    } catch (error: any) {
      toast({
        title: "Erro ao enviar imagem",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      if (type === "logo") setUploadingLogo(false);
      else setUploadingCover(false);
    }
  };

  const handleSave = async () => {
    if (!formData.name || !formData.slug) {
      toast({
        title: "Erro",
        description: "Preencha o nome e slug do catálogo",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const catalogData = {
        user_id: user?.id,
        name: formData.name,
        slug: formData.slug,
        description: formData.description || null,
        logo_url: formData.logo_url || null,
        cover_url: formData.cover_url || null,
        primary_color: formData.primary_color,
        background_color: formData.background_color,
        text_color: formData.text_color,
        whatsapp_number: formData.whatsapp_number || null,
        show_prices: formData.show_prices,
        show_stock: formData.show_stock,
        show_description: formData.show_description,
        layout_style: formData.layout_style,
        is_active: formData.is_active,
        store_open: formData.store_open,
        store_closed_message: formData.store_closed_message || null,
        show_all_items: formData.show_all_items,
        selected_product_ids: formData.show_all_items ? [] : formData.selected_product_ids,
        selected_service_ids: formData.show_all_items ? [] : formData.selected_service_ids,
        group_by_category: formData.group_by_category,
      };

      if (editingCatalog) {
        const { error } = await supabase
          .from("catalogs" as any)
          .update(catalogData)
          .eq("id", editingCatalog.id);

        if (error) throw error;
        toast({ title: "Catálogo atualizado!" });
      } else {
        const { error } = await supabase.from("catalogs" as any).insert(catalogData);
        if (error) throw error;
        toast({ title: "Catálogo criado!" });
      }

      setDialogOpen(false);
      setEditingCatalog(null);
      setFormData(defaultCatalogForm);
      loadCatalogs();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteCatalogId) return;

    const { error } = await supabase
      .from("catalogs" as any)
      .delete()
      .eq("id", deleteCatalogId);

    if (error) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({ title: "Catálogo excluído!" });
      loadCatalogs();
    }
    setDeleteCatalogId(null);
  };

  const getCatalogUrl = (slug: string) => {
    return `${window.location.origin}/catalogo/${slug}`;
  };

  const handleCopyLink = (slug: string) => {
    navigator.clipboard.writeText(getCatalogUrl(slug));
    toast({ title: "Link copiado!" });
  };

  const handleShareWhatsApp = (catalog: Catalog) => {
    const url = getCatalogUrl(catalog.slug);
    const text = encodeURIComponent(
      `Confira meu catálogo: ${catalog.name}\n${url}`
    );
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Show dashboard if a catalog is selected
  if (selectedCatalog) {
    return (
      <CatalogDashboard
        catalog={selectedCatalog}
        userId={user?.id || ""}
        onBack={() => {
          setSelectedCatalog(null);
          loadCatalogs();
        }}
        onEdit={() => {
          setEditingCatalog(selectedCatalog);
          setDialogOpen(true);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Criador de Catálogo</h2>
          <p className="text-muted-foreground">
            Crie catálogos públicos dos seus produtos e serviços para compartilhar
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingCatalog(null);
            setDialogOpen(true);
          }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Catálogo
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <BookOpen className="w-8 h-8 mx-auto mb-2 text-primary" />
            <p className="text-2xl font-bold">{catalogs.length}</p>
            <p className="text-xs text-muted-foreground">Catálogos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Eye className="w-8 h-8 mx-auto mb-2 text-primary" />
            <p className="text-2xl font-bold">
              {catalogs.reduce((acc, c) => acc + (c.views_count || 0), 0)}
            </p>
            <p className="text-xs text-muted-foreground">Visualizações</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="w-8 h-8 mx-auto mb-2 bg-primary/10 rounded-full flex items-center justify-center">
              <span className="text-primary font-bold">{productCount}</span>
            </div>
            <p className="text-sm font-medium">Produtos Ativos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="w-8 h-8 mx-auto mb-2 bg-primary/10 rounded-full flex items-center justify-center">
              <span className="text-primary font-bold">{serviceCount}</span>
            </div>
            <p className="text-sm font-medium">Serviços Ativos</p>
          </CardContent>
        </Card>
      </div>

      {/* Catalogs List */}
      {catalogs.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <BookOpen className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Nenhum catálogo criado</h3>
            <p className="text-muted-foreground mb-4">
              Crie seu primeiro catálogo para compartilhar seus produtos e serviços
            </p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Criar Catálogo
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {catalogs.map((catalog) => (
            <Card key={catalog.id} className="overflow-hidden">
              {catalog.cover_url && (
                <div className="h-32 overflow-hidden">
                  <img
                    src={catalog.cover_url}
                    alt={catalog.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    {catalog.logo_url ? (
                      <img
                        src={catalog.logo_url}
                        alt={catalog.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                        style={{ backgroundColor: catalog.primary_color }}
                      >
                        {catalog.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <CardTitle className="text-base">{catalog.name}</CardTitle>
                      <p className="text-xs text-muted-foreground">
                        /{catalog.slug}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <Badge variant={catalog.is_active ? "default" : "secondary"}>
                      {catalog.is_active ? "Ativo" : "Inativo"}
                    </Badge>
                    {catalog.store_open === false && (
                      <Badge variant="outline" className="text-xs">
                        Fechado
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {catalog.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {catalog.description}
                  </p>
                )}
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    {catalog.views_count || 0}
                  </span>
                  {catalog.whatsapp_number && (
                    <span className="flex items-center gap-1">
                      <MessageCircle className="w-4 h-4" />
                      WhatsApp
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopyLink(catalog.slug)}
                  >
                    <Copy className="w-3.5 h-3.5 mr-1" />
                    Copiar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleShareWhatsApp(catalog)}
                  >
                    <Share2 className="w-3.5 h-3.5 mr-1" />
                    WhatsApp
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(getCatalogUrl(catalog.slug), "_blank")}
                  >
                    <ExternalLink className="w-3.5 h-3.5 mr-1" />
                    Ver
                  </Button>
                </div>
                <div className="flex gap-2 pt-2 border-t">
                  <Button
                    variant="default"
                    size="sm"
                    className="flex-1"
                    onClick={() => setSelectedCatalog(catalog)}
                  >
                    <Settings className="w-4 h-4 mr-1" />
                    Dashboard
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditingCatalog(catalog);
                      setDialogOpen(true);
                    }}
                  >
                    <Pencil className="w-4 h-4 mr-1" />
                    Editar
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => setDeleteCatalogId(catalog.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingCatalog ? "Editar Catálogo" : "Novo Catálogo"}
            </DialogTitle>
            <DialogDescription>
              Configure seu catálogo de produtos e serviços
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="name">Nome do Catálogo *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="Ex: Meu Catálogo"
                />
              </div>
              <div>
                <Label htmlFor="slug">Slug (URL) *</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, slug: e.target.value }))
                  }
                  placeholder="meu-catalogo"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  /catalogo/{formData.slug || "slug"}
                </p>
              </div>
            </div>

            <div>
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, description: e.target.value }))
                }
                placeholder="Descrição do seu catálogo..."
                rows={2}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="whatsapp">WhatsApp para Contato</Label>
                <Input
                  id="whatsapp"
                  value={formData.whatsapp_number}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      whatsapp_number: e.target.value,
                    }))
                  }
                  placeholder="5511999999999"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Código do país + DDD + número
                </p>
              </div>
              <div>
                <Label htmlFor="layout">Layout</Label>
                <Select
                  value={formData.layout_style}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, layout_style: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o layout" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="grid">Grade (Grid)</SelectItem>
                    <SelectItem value="list">Lista</SelectItem>
                    <SelectItem value="cards">Cards Grandes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Colors Section */}
            <div className="space-y-3 pt-2 border-t">
              <h4 className="font-medium flex items-center gap-2">
                <Palette className="w-4 h-4" />
                Cores do Catálogo
              </h4>
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <Label htmlFor="primary_color">Cor Principal</Label>
                  <div className="flex gap-2">
                    <Input
                      id="primary_color"
                      type="color"
                      value={formData.primary_color}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          primary_color: e.target.value,
                        }))
                      }
                      className="w-14 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      value={formData.primary_color}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          primary_color: e.target.value,
                        }))
                      }
                      placeholder="#3b82f6"
                      className="flex-1"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="background_color">Cor do Fundo</Label>
                  <div className="flex gap-2">
                    <Input
                      id="background_color"
                      type="color"
                      value={formData.background_color}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          background_color: e.target.value,
                        }))
                      }
                      className="w-14 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      value={formData.background_color}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          background_color: e.target.value,
                        }))
                      }
                      placeholder="#ffffff"
                      className="flex-1"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="text_color">Cor do Texto</Label>
                  <div className="flex gap-2">
                    <Input
                      id="text_color"
                      type="color"
                      value={formData.text_color}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          text_color: e.target.value,
                        }))
                      }
                      className="w-14 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      value={formData.text_color}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          text_color: e.target.value,
                        }))
                      }
                      placeholder="#1f2937"
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Logo</Label>
                {formData.logo_url && (
                  <div className="mb-2 relative inline-block">
                    <img
                      src={formData.logo_url}
                      alt="Logo"
                      className="w-20 h-20 rounded-full object-cover"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute -top-2 -right-2 w-6 h-6"
                      onClick={() =>
                        setFormData((prev) => ({ ...prev, logo_url: "" }))
                      }
                    >
                      ×
                    </Button>
                  </div>
                )}
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, "logo")}
                  disabled={uploadingLogo}
                />
                {uploadingLogo && (
                  <Loader2 className="w-4 h-4 animate-spin mt-1" />
                )}
              </div>
              <div>
                <Label>Capa</Label>
                {formData.cover_url && (
                  <div className="mb-2 relative">
                    <img
                      src={formData.cover_url}
                      alt="Capa"
                      className="w-full h-20 rounded-lg object-cover"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-1 right-1 w-6 h-6"
                      onClick={() =>
                        setFormData((prev) => ({ ...prev, cover_url: "" }))
                      }
                    >
                      ×
                    </Button>
                  </div>
                )}
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, "cover")}
                  disabled={uploadingCover}
                />
                {uploadingCover && (
                  <Loader2 className="w-4 h-4 animate-spin mt-1" />
                )}
              </div>
            </div>

            {/* Product/Service Selection */}
            <div className="space-y-3 pt-2 border-t">
              <h4 className="font-medium">Itens do Catálogo</h4>
              <CatalogProductSelector
                userId={user?.id || ""}
                selectedProductIds={formData.selected_product_ids}
                selectedServiceIds={formData.selected_service_ids}
                showAll={formData.show_all_items}
                onChangeShowAll={(show) =>
                  setFormData((prev) => ({ ...prev, show_all_items: show }))
                }
                onChangeProducts={(ids) =>
                  setFormData((prev) => ({ ...prev, selected_product_ids: ids }))
                }
                onChangeServices={(ids) =>
                  setFormData((prev) => ({ ...prev, selected_service_ids: ids }))
                }
              />
            </div>

            {/* Store Status */}
            <div className="space-y-3 pt-2 border-t">
              <h4 className="font-medium flex items-center gap-2">
                <Store className="w-4 h-4" />
                Status da Loja
              </h4>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="store_open" className="cursor-pointer">
                    Loja Aberta
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Quando fechada, exibe mensagem personalizada
                  </p>
                </div>
                <Switch
                  id="store_open"
                  checked={formData.store_open}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, store_open: checked }))
                  }
                />
              </div>
              {!formData.store_open && (
                <div>
                  <Label htmlFor="store_closed_message">Mensagem de Fechado</Label>
                  <Textarea
                    id="store_closed_message"
                    value={formData.store_closed_message}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        store_closed_message: e.target.value,
                      }))
                    }
                    placeholder="Estamos fechados no momento..."
                    rows={2}
                  />
                </div>
              )}
            </div>

            <div className="space-y-3 pt-2 border-t">
              <h4 className="font-medium">Exibição</h4>
              <div className="flex items-center justify-between">
                <Label htmlFor="show_prices" className="cursor-pointer">
                  Mostrar preços
                </Label>
                <Switch
                  id="show_prices"
                  checked={formData.show_prices}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, show_prices: checked }))
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="show_description" className="cursor-pointer">
                  Mostrar descrições
                </Label>
                <Switch
                  id="show_description"
                  checked={formData.show_description}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({
                      ...prev,
                      show_description: checked,
                    }))
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="show_stock" className="cursor-pointer">
                  Mostrar estoque (produtos físicos)
                </Label>
                <Switch
                  id="show_stock"
                  checked={formData.show_stock}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, show_stock: checked }))
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="group_by_category" className="cursor-pointer">
                    Agrupar por categoria
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Organiza os itens por categoria no catálogo público
                  </p>
                </div>
                <Switch
                  id="group_by_category"
                  checked={formData.group_by_category}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, group_by_category: checked }))
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="is_active" className="cursor-pointer">
                  Catálogo ativo
                </Label>
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, is_active: checked }))
                  }
                />
              </div>
            </div>

            <Button onClick={handleSave} className="w-full" disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingCatalog ? "Atualizar" : "Criar"} Catálogo
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog
        open={!!deleteCatalogId}
        onOpenChange={() => setDeleteCatalogId(null)}
        onConfirm={handleDelete}
        description="Você tem certeza que deseja excluir este catálogo? Esta ação não pode ser desfeita."
      />
    </div>
  );
}
