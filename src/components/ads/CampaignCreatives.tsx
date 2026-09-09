import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Copy, Film, ImageIcon, Loader2, Plus, Trash2, Upload } from "lucide-react";

/** Um criativo de anúncio: mídia (imagem ou vídeo) + a copy usada */
export interface CampaignCreative {
  id: string;
  type: "image" | "video";
  url: string;
  title: string;
  copy: string;
}

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

/** Converte um valor desconhecido (jsonb) em uma lista segura de criativos */
export const parseCreatives = (value: unknown): CampaignCreative[] => {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is Record<string, unknown> => !!item && typeof item === "object")
    .map((item, index) => ({
      id: typeof item.id === "string" ? item.id : `creative-${index}`,
      type: item.type === "video" ? "video" : "image",
      url: typeof item.url === "string" ? item.url : "",
      title: typeof item.title === "string" ? item.title : "",
      copy: typeof item.copy === "string" ? item.copy : "",
    }))
    .filter((item) => item.url || item.copy);
};

const createId = (): string =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `creative-${Date.now()}-${Math.random().toString(16).slice(2)}`;

interface EditorProps {
  creatives: CampaignCreative[];
  onChange: (creatives: CampaignCreative[]) => void;
}

/** Editor de criativos usado nos formulários de campanha */
export const CampaignCreativesEditor = ({ creatives, onChange }: EditorProps) => {
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  const addCreative = () => {
    onChange([...creatives, { id: createId(), type: "image", url: "", title: "", copy: "" }]);
  };

  const updateCreative = (id: string, patch: Partial<CampaignCreative>) => {
    onChange(creatives.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  };

  const removeCreative = (id: string) => {
    onChange(creatives.filter((c) => c.id !== id));
  };

  const handleUpload = async (id: string, file: File | undefined) => {
    if (!file) return;

    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");
    if (!isImage && !isVideo) {
      toast.error("Selecione uma imagem ou um vídeo");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.error("Arquivo muito grande. Máximo 50MB");
      return;
    }

    try {
      setUploadingId(id);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Você precisa estar autenticado para enviar arquivos");
        return;
      }

      const ext = file.name.split(".").pop() || (isVideo ? "mp4" : "jpg");
      const path = `${user.id}/criativos/${Date.now()}-${Math.random().toString(16).slice(2)}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("chatbot-media")
        .upload(path, file, { cacheControl: "3600", upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from("chatbot-media").getPublicUrl(path);
      updateCreative(id, { url: publicUrl, type: isVideo ? "video" : "image" });
      toast.success("Criativo enviado!");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Tente novamente";
      toast.error(`Erro ao enviar criativo: ${message}`);
    } finally {
      setUploadingId(null);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>Criativos do anúncio</Label>
        <Button type="button" variant="outline" size="sm" onClick={addCreative}>
          <Plus className="mr-1 h-4 w-4" /> Adicionar criativo
        </Button>
      </div>

      {creatives.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Nenhum criativo adicionado. Inclua a imagem ou o vídeo e a copy usada no anúncio.
        </p>
      )}

      <div className="space-y-3">
        {creatives.map((creative, index) => (
          <Card key={creative.id} className="border-border/60">
            <CardContent className="space-y-3 p-4">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium">Criativo {index + 1}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={`Remover criativo ${index + 1}`}
                  onClick={() => removeCreative(creative.id)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label className="text-xs">Nome do criativo</Label>
                  <Input
                    value={creative.title}
                    placeholder="Ex.: Criativo 1 - Oferta"
                    onChange={(e) => updateCreative(creative.id, { title: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Link da mídia (opcional)</Label>
                  <Input
                    value={creative.url}
                    placeholder="https://..."
                    onChange={(e) => updateCreative(creative.id, { url: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant={creative.type === "image" ? "default" : "outline"}
                  size="sm"
                  onClick={() => updateCreative(creative.id, { type: "image" })}
                >
                  <ImageIcon className="mr-1 h-4 w-4" /> Imagem
                </Button>
                <Button
                  type="button"
                  variant={creative.type === "video" ? "default" : "outline"}
                  size="sm"
                  onClick={() => updateCreative(creative.id, { type: "video" })}
                >
                  <Film className="mr-1 h-4 w-4" /> Vídeo
                </Button>

                <label className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-input px-3 py-1.5 text-sm hover:bg-accent focus-within:ring-2 focus-within:ring-ring">
                  {uploadingId === creative.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  {uploadingId === creative.id ? "Enviando..." : "Enviar arquivo"}
                  <input
                    type="file"
                    accept="image/*,video/*"
                    className="hidden"
                    disabled={uploadingId === creative.id}
                    onChange={(e) => {
                      void handleUpload(creative.id, e.target.files?.[0]);
                      e.target.value = "";
                    }}
                  />
                </label>
              </div>

              {creative.url && (
                <div className="overflow-hidden rounded-lg border bg-muted/30">
                  {creative.type === "video" ? (
                    <video src={creative.url} controls className="max-h-56 w-full object-contain" />
                  ) : (
                    <img
                      src={creative.url}
                      alt={creative.title || `Criativo ${index + 1}`}
                      loading="lazy"
                      className="max-h-56 w-full object-contain"
                    />
                  )}
                </div>
              )}

              <div className="space-y-1">
                <Label className="text-xs">Copy do anúncio</Label>
                <Textarea
                  value={creative.copy}
                  rows={4}
                  placeholder="Texto usado no anúncio..."
                  onChange={(e) => updateCreative(creative.id, { copy: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

interface GalleryProps {
  creatives: CampaignCreative[];
  className?: string;
}

/** Exibição dos criativos para o cliente */
export const CampaignCreativesGallery = ({ creatives, className }: GalleryProps) => {
  if (creatives.length === 0) return null;

  const copyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copy copiada!");
    } catch {
      toast.error("Não foi possível copiar");
    }
  };

  return (
    <div className={className}>
      <div className="grid gap-4 md:grid-cols-2">
        {creatives.map((creative, index) => (
          <Card key={creative.id} className="overflow-hidden">
            <CardContent className="space-y-3 p-4">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold">
                  {creative.title || `Criativo ${index + 1}`}
                </span>
                <Badge variant="secondary" className="gap-1">
                  {creative.type === "video" ? <Film className="h-3 w-3" /> : <ImageIcon className="h-3 w-3" />}
                  {creative.type === "video" ? "Vídeo" : "Imagem"}
                </Badge>
              </div>

              {creative.url && (
                <div className="overflow-hidden rounded-lg border bg-muted/30">
                  {creative.type === "video" ? (
                    <video src={creative.url} controls className="max-h-72 w-full object-contain" />
                  ) : (
                    <img
                      src={creative.url}
                      alt={creative.title || `Criativo ${index + 1}`}
                      loading="lazy"
                      className="max-h-72 w-full object-contain"
                    />
                  )}
                </div>
              )}

              {creative.copy && (
                <div className="space-y-2">
                  <p className="whitespace-pre-wrap break-words text-sm text-muted-foreground">
                    {creative.copy}
                  </p>
                  <Button type="button" variant="outline" size="sm" onClick={() => void copyText(creative.copy)}>
                    <Copy className="mr-1 h-3.5 w-3.5" /> Copiar copy
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default CampaignCreativesGallery;
