import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  Trash2,
  GripVertical,
  Loader2,
  Image as ImageIcon,
  Link as LinkIcon,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface CatalogBanner {
  id: string;
  catalog_id: string;
  image_url: string;
  title: string | null;
  subtitle: string | null;
  link_url: string | null;
  order_index: number;
  is_active: boolean;
}

interface CatalogBannersManagerProps {
  catalogId: string;
  userId: string;
}

export default function CatalogBannersManager({
  catalogId,
  userId,
}: CatalogBannersManagerProps) {
  const { toast } = useToast();
  const [banners, setBanners] = useState<CatalogBanner[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    image_url: "",
    title: "",
    subtitle: "",
    link_url: "",
    is_active: true,
  });

  useEffect(() => {
    loadBanners();
  }, [catalogId]);

  const loadBanners = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("catalog_banners" as any)
      .select("*")
      .eq("catalog_id", catalogId)
      .order("order_index", { ascending: true });

    if (error) {
      console.error("Error loading banners:", error);
    } else {
      setBanners((data as any) || []);
    }
    setLoading(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `catalogs/${userId}/banners/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("chatbot-media")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("chatbot-media").getPublicUrl(fileName);

      setFormData((prev) => ({ ...prev, image_url: publicUrl }));
      toast({ title: "Imagem enviada!" });
    } catch (error: any) {
      toast({
        title: "Erro ao enviar imagem",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.image_url) {
      toast({
        title: "Erro",
        description: "Adicione uma imagem para o banner",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.from("catalog_banners" as any).insert({
        catalog_id: catalogId,
        image_url: formData.image_url,
        title: formData.title || null,
        subtitle: formData.subtitle || null,
        link_url: formData.link_url || null,
        order_index: banners.length,
        is_active: formData.is_active,
      });

      if (error) throw error;

      toast({ title: "Banner adicionado!" });
      setDialogOpen(false);
      setFormData({
        image_url: "",
        title: "",
        subtitle: "",
        link_url: "",
        is_active: true,
      });
      loadBanners();
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

  const handleDelete = async (bannerId: string) => {
    const { error } = await supabase
      .from("catalog_banners" as any)
      .delete()
      .eq("id", bannerId);

    if (error) {
      toast({
        title: "Erro ao excluir",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({ title: "Banner excluído!" });
      loadBanners();
    }
  };

  const handleToggleActive = async (banner: CatalogBanner) => {
    const { error } = await supabase
      .from("catalog_banners" as any)
      .update({ is_active: !banner.is_active })
      .eq("id", banner.id);

    if (error) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } else {
      loadBanners();
    }
  };

  const handleReorder = async (bannerId: string, direction: "up" | "down") => {
    const index = banners.findIndex((b) => b.id === bannerId);
    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === banners.length - 1)
    ) {
      return;
    }

    const swapIndex = direction === "up" ? index - 1 : index + 1;
    const currentBanner = banners[index];
    const swapBanner = banners[swapIndex];

    await Promise.all([
      supabase
        .from("catalog_banners" as any)
        .update({ order_index: swapBanner.order_index })
        .eq("id", currentBanner.id),
      supabase
        .from("catalog_banners" as any)
        .update({ order_index: currentBanner.order_index })
        .eq("id", swapBanner.id),
    ]);

    loadBanners();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium">Banners Rotativos</h4>
        <Button size="sm" onClick={() => setDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-1" />
          Adicionar
        </Button>
      </div>

      {banners.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <ImageIcon className="w-12 h-12 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Nenhum banner adicionado
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {banners.map((banner, index) => (
            <Card key={banner.id} className="overflow-hidden">
              <CardContent className="p-3 flex items-center gap-3">
                <div className="flex flex-col gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    disabled={index === 0}
                    onClick={() => handleReorder(banner.id, "up")}
                  >
                    <ArrowUp className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    disabled={index === banners.length - 1}
                    onClick={() => handleReorder(banner.id, "down")}
                  >
                    <ArrowDown className="w-3 h-3" />
                  </Button>
                </div>
                <img
                  src={banner.image_url}
                  alt={banner.title || "Banner"}
                  className="w-24 h-14 object-cover rounded"
                />
                <div className="flex-1 min-w-0">
                  {banner.title && (
                    <p className="font-medium text-sm truncate">{banner.title}</p>
                  )}
                  {banner.subtitle && (
                    <p className="text-xs text-muted-foreground truncate">
                      {banner.subtitle}
                    </p>
                  )}
                  {banner.link_url && (
                    <p className="text-xs text-blue-500 flex items-center gap-1 truncate">
                      <LinkIcon className="w-3 h-3" />
                      {banner.link_url}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={banner.is_active}
                    onCheckedChange={() => handleToggleActive(banner)}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleDelete(banner.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Banner</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Imagem do Banner *</Label>
              {formData.image_url && (
                <div className="mb-2 relative">
                  <img
                    src={formData.image_url}
                    alt="Preview"
                    className="w-full h-32 object-cover rounded-lg"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 w-6 h-6"
                    onClick={() =>
                      setFormData((prev) => ({ ...prev, image_url: "" }))
                    }
                  >
                    ×
                  </Button>
                </div>
              )}
              <Input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={uploading}
              />
              {uploading && <Loader2 className="w-4 h-4 animate-spin mt-1" />}
              <p className="text-xs text-muted-foreground mt-1">
                Recomendado: 1200x400 pixels
              </p>
            </div>

            <div>
              <Label htmlFor="title">Título (opcional)</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, title: e.target.value }))
                }
                placeholder="Título do banner"
              />
            </div>

            <div>
              <Label htmlFor="subtitle">Subtítulo (opcional)</Label>
              <Input
                id="subtitle"
                value={formData.subtitle}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, subtitle: e.target.value }))
                }
                placeholder="Descrição breve"
              />
            </div>

            <div>
              <Label htmlFor="link">Link (opcional)</Label>
              <Input
                id="link"
                value={formData.link_url}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, link_url: e.target.value }))
                }
                placeholder="https://..."
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="active">Ativo</Label>
              <Switch
                id="active"
                checked={formData.is_active}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({ ...prev, is_active: checked }))
                }
              />
            </div>

            <Button onClick={handleSave} className="w-full" disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Adicionar Banner
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
