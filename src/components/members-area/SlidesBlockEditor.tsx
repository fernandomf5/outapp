import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Upload, X, ChevronLeft, ChevronRight, Plus, Presentation } from "lucide-react";
import { parseSlidesContent, stringifySlidesContent, Slide, SlidesData } from "./MembersSlides";

interface Props {
  content: string;
  onChange: (content: string) => void;
  bucketName?: string;
}

const LAYOUT_OPTIONS: { value: Slide["layout"]; label: string }[] = [
  { value: "center", label: "Centralizado" },
  { value: "left", label: "Alinhado à esquerda" },
  { value: "right", label: "Alinhado à direita" },
  { value: "image-bg", label: "Imagem de fundo" },
];

export function SlidesBlockEditor({ content, onChange, bucketName = "members-content" }: Props) {
  const data = parseSlidesContent(content);
  const [uploadingFor, setUploadingFor] = useState<string | null>(null);

  const update = (newData: SlidesData) => {
    onChange(stringifySlidesContent(newData));
  };

  const addSlide = () => {
    const newSlide: Slide = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      title: "Novo Slide",
      body: "Conteúdo do slide...",
      layout: "center",
    };
    update({ ...data, slides: [...data.slides, newSlide] });
  };

  const removeSlide = (idx: number) => {
    const next = data.slides.filter((_, i) => i !== idx);
    update({ ...data, slides: next });
  };

  const moveSlide = (idx: number, dir: number) => {
    const j = idx + dir;
    if (j < 0 || j >= data.slides.length) return;
    const next = [...data.slides];
    [next[idx], next[j]] = [next[j], next[idx]];
    update({ ...data, slides: next });
  };

  const updateSlide = (idx: number, patch: Partial<Slide>) => {
    const next = [...data.slides];
    next[idx] = { ...next[idx], ...patch };
    update({ ...data, slides: next });
  };

  const handleImageUpload = async (idx: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Envie uma imagem");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Máximo 5MB");
      return;
    }

    setUploadingFor(data.slides[idx].id);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Você precisa estar autenticado");
        return;
      }
      const ext = file.name.split(".").pop();
      const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage.from(bucketName).upload(path, file, { cacheControl: "3600", upsert: true });
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from(bucketName).getPublicUrl(path);
      updateSlide(idx, { image_url: publicUrl });
      toast.success("Imagem enviada");
    } catch (err: any) {
      toast.error(err.message || "Erro ao enviar imagem");
    } finally {
      setUploadingFor(null);
      e.target.value = "";
    }
  };

  return (
    <div className="space-y-4">
      {/* Global settings */}
      <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/20">
        <div className="flex items-center gap-3">
          <Switch
            id="slides-autoplay"
            checked={!!data.autoPlay}
            onCheckedChange={(v) => update({ ...data, autoPlay: v })}
          />
          <Label htmlFor="slides-autoplay" className="text-xs cursor-pointer">
            Reprodução automática
          </Label>
        </div>
        {data.autoPlay && (
          <div className="flex items-center gap-2">
            <Label className="text-xs">Intervalo (ms)</Label>
            <Input
              type="number"
              min={2000}
              max={30000}
              step={500}
              value={data.interval || 5000}
              onChange={(e) => update({ ...data, interval: Number(e.target.value) || 5000 })}
              className="w-24 h-8 text-xs"
            />
          </div>
        )}
      </div>

      {/* Slides list */}
      <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
        {data.slides.length === 0 && (
          <div className="text-center p-6 border border-dashed rounded-lg text-muted-foreground">
            <Presentation className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nenhum slide ainda. Adicione o primeiro abaixo.</p>
          </div>
        )}

        {data.slides.map((slide, idx) => (
          <div key={slide.id} className="border rounded-lg p-3 space-y-3 bg-muted/20">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold">Slide {idx + 1}</span>
              <div className="flex items-center gap-1">
                <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => moveSlide(idx, -1)} disabled={idx === 0}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => moveSlide(idx, 1)} disabled={idx === data.slides.length - 1}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
                <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeSlide(idx)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs">Título</Label>
                <Input
                  value={slide.title || ""}
                  onChange={(e) => updateSlide(idx, { title: e.target.value })}
                  placeholder="Título do slide"
                  className="h-9"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Subtítulo</Label>
                <Input
                  value={slide.subtitle || ""}
                  onChange={(e) => updateSlide(idx, { subtitle: e.target.value })}
                  placeholder="Subtítulo curto"
                  className="h-9"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Conteúdo</Label>
              <Textarea
                value={slide.body || ""}
                onChange={(e) => updateSlide(idx, { body: e.target.value })}
                placeholder="Texto do slide..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs">Layout</Label>
                <Select value={slide.layout || "center"} onValueChange={(v) => updateSlide(idx, { layout: v as Slide["layout"] })}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="z-[300]">
                    {LAYOUT_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Cor de fundo (opcional)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="color"
                    value={slide.bg_color || "#0f172a"}
                    onChange={(e) => updateSlide(idx, { bg_color: e.target.value })}
                    className="w-12 h-9 p-1"
                  />
                  <Input
                    value={slide.bg_color || ""}
                    onChange={(e) => updateSlide(idx, { bg_color: e.target.value })}
                    placeholder="#0f172a"
                    className="h-9 flex-1"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Imagem</Label>
              <div className="flex items-center gap-2">
                {slide.image_url ? (
                  <div className="relative w-16 h-16 rounded-md overflow-hidden border shrink-0">
                    <img src={slide.image_url} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => updateSlide(idx, { image_url: undefined })}
                      className="absolute top-0.5 right-0.5 bg-destructive text-destructive-foreground rounded-full p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : null}
                <div className="flex-1">
                  <Input
                    value={slide.image_url || ""}
                    onChange={(e) => updateSlide(idx, { image_url: e.target.value })}
                    placeholder="URL da imagem (ou envie do computador)"
                    className="h-9 mb-2"
                  />
                  <label className={`flex items-center justify-center gap-2 h-9 rounded-md border-2 border-dashed cursor-pointer text-xs text-muted-foreground hover:border-primary transition-colors ${uploadingFor === slide.id ? "opacity-60" : ""}`}>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleImageUpload(idx, e)}
                      disabled={uploadingFor === slide.id}
                    />
                    {uploadingFor === slide.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    {uploadingFor === slide.id ? "Enviando..." : "Enviar imagem"}
                  </label>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Button type="button" variant="outline" className="w-full" onClick={addSlide}>
        <Plus className="w-4 h-4 mr-2" /> Adicionar Slide
      </Button>
    </div>
  );
}
