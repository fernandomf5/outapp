import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, X, GripVertical, Image } from "lucide-react";

interface GalleryImageUploadProps {
  userId: string;
  mainImage: string;
  galleryUrls: string[];
  onMainImageChange: (url: string) => void;
  onGalleryChange: (urls: string[]) => void;
}

export default function GalleryImageUpload({
  userId,
  mainImage,
  galleryUrls,
  onMainImageChange,
  onGalleryChange,
}: GalleryImageUploadProps) {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);

  const handleMainImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({ title: "Erro", description: "Selecione uma imagem válida", variant: "destructive" });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Erro", description: "A imagem deve ter no máximo 5MB", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${userId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("chatbot-media")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("chatbot-media")
        .getPublicUrl(fileName);

      onMainImageChange(publicUrl);
      toast({ title: "Imagem principal enviada!" });
    } catch (error: any) {
      toast({ title: "Erro ao enviar imagem", description: error.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingGallery(true);
    const newUrls: string[] = [];

    try {
      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/")) continue;
        if (file.size > 5 * 1024 * 1024) continue;

        const fileExt = file.name.split(".").pop();
        const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("chatbot-media")
          .upload(fileName, file);

        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage
            .from("chatbot-media")
            .getPublicUrl(fileName);
          newUrls.push(publicUrl);
        }
      }

      if (newUrls.length > 0) {
        onGalleryChange([...galleryUrls, ...newUrls]);
        toast({ title: `${newUrls.length} imagem(ns) adicionada(s) à galeria!` });
      }
    } catch (error: any) {
      toast({ title: "Erro ao enviar imagens", description: error.message, variant: "destructive" });
    } finally {
      setUploadingGallery(false);
    }
  };

  const removeGalleryImage = (index: number) => {
    const updated = [...galleryUrls];
    updated.splice(index, 1);
    onGalleryChange(updated);
  };

  const setAsMainImage = (url: string, index: number) => {
    // Swap: current main goes to gallery, selected becomes main
    const updated = [...galleryUrls];
    updated.splice(index, 1);
    if (mainImage) {
      updated.unshift(mainImage);
    }
    onMainImageChange(url);
    onGalleryChange(updated);
  };

  const allImages = [...(mainImage ? [mainImage] : []), ...galleryUrls];

  return (
    <div className="space-y-4">
      <Label className="flex items-center gap-2">
        <Image className="h-4 w-4" />
        Imagens do Produto
      </Label>

      {/* Main Image Preview */}
      {mainImage && (
        <div className="relative">
          <img
            src={mainImage}
            alt="Imagem principal"
            className="w-full h-48 object-cover rounded-lg"
          />
          <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
            Imagem Principal
          </div>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="absolute top-2 right-2"
            onClick={() => {
              // Move first gallery image to main if exists
              if (galleryUrls.length > 0) {
                onMainImageChange(galleryUrls[0]);
                onGalleryChange(galleryUrls.slice(1));
              } else {
                onMainImageChange("");
              }
            }}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Main Image Upload */}
      {!mainImage && (
        <div className="border-2 border-dashed rounded-lg p-8 text-center">
          <Image className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-sm text-muted-foreground mb-4">
            Adicione a imagem principal do produto
          </p>
          <div className="flex items-center justify-center gap-2">
            <Input
              type="file"
              accept="image/*"
              onChange={handleMainImageUpload}
              disabled={uploading}
              className="max-w-[200px]"
            />
            {uploading && <Loader2 className="h-4 w-4 animate-spin" />}
          </div>
        </div>
      )}

      {/* Gallery Grid */}
      {galleryUrls.length > 0 && (
        <div>
          <Label className="text-sm text-muted-foreground mb-2 block">
            Galeria de Imagens ({galleryUrls.length} imagens)
          </Label>
          <div className="grid grid-cols-4 gap-2">
            {galleryUrls.map((url, index) => (
              <div key={index} className="relative group aspect-square">
                <img
                  src={url}
                  alt={`Galeria ${index + 1}`}
                  className="w-full h-full object-cover rounded-lg"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-1">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => setAsMainImage(url, index)}
                  >
                    Principal
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => removeGalleryImage(index)}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add More Gallery Images */}
      {mainImage && (
        <div className="flex items-center gap-2">
          <Input
            type="file"
            accept="image/*"
            multiple
            onChange={handleGalleryUpload}
            disabled={uploadingGallery}
            className="flex-1"
          />
          {uploadingGallery && <Loader2 className="h-4 w-4 animate-spin" />}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        PNG, JPG ou WEBP. Máximo 5MB por imagem. Adicione várias imagens para criar um carrossel.
      </p>
    </div>
  );
}
