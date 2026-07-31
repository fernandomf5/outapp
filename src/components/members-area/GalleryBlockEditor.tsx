import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Upload, X, ChevronLeft, ChevronRight } from "lucide-react";
import {
  GALLERY_LAYOUT_OPTIONS,
  parseGalleryContent,
  stringifyGalleryContent,
  GalleryLayout,
} from "./MembersGallery";

interface Props {
  content: string;
  onChange: (content: string) => void;
  bucketName?: string;
}

export function GalleryBlockEditor({ content, onChange, bucketName = "members-content" }: Props) {
  const data = parseGalleryContent(content);
  const [uploading, setUploading] = useState(false);

  const update = (layout: GalleryLayout, images: typeof data.images) =>
    onChange(stringifyGalleryContent({ layout, images }));

  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { toast.error("Você precisa estar autenticado"); return; }

      const uploaded: { url: string }[] = [];
      for (const file of files) {
        if (!file.type.startsWith("image/")) continue;
        if (file.size > 5 * 1024 * 1024) { toast.error(`${file.name}: máximo 5MB`); continue; }
        const ext = file.name.split(".").pop();
        const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const { error } = await supabase.storage.from(bucketName).upload(path, file, { cacheControl: "3600", upsert: true });
        if (error) { toast.error(`Erro em ${file.name}`); continue; }
        const { data: { publicUrl } } = supabase.storage.from(bucketName).getPublicUrl(path);
        uploaded.push({ url: publicUrl });
      }
      if (uploaded.length) {
        update(data.layout, [...data.images, ...uploaded]);
        toast.success(`${uploaded.length} imagem(ns) adicionada(s)`);
      }
    } catch (err: any) {
      toast.error(err.message || "Erro ao enviar imagens");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const move = (i: number, dir: number) => {
    const j = i + dir;
    if (j < 0 || j >= data.images.length) return;
    const next = [...data.images];
    [next[i], next[j]] = [next[j], next[i]];
    update(data.layout, next);
  };

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label className="text-xs">Formato de exibição na área de membros</Label>
        <Select value={data.layout} onValueChange={(v) => update(v as GalleryLayout, data.images)}>
          <SelectTrigger className="h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="z-[300]">
            {GALLERY_LAYOUT_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <label
        className={`flex items-center justify-center gap-2 h-16 rounded-lg border-2 border-dashed cursor-pointer text-xs text-muted-foreground hover:border-primary transition-colors ${uploading ? "opacity-60" : ""}`}
      >
        <input type="file" accept="image/*" multiple className="hidden" onChange={handleFiles} disabled={uploading} />
        {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
        {uploading ? "Enviando..." : "Selecionar várias imagens (PNG, JPG, WEBP até 5MB)"}
      </label>

      {data.images.length > 0 && (
        <>
          <p className="text-[11px] text-muted-foreground">{data.images.length} imagem(ns) na galeria</p>
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-56 overflow-y-auto pr-1">
            {data.images.map((img, i) => (
              <div key={i} className="relative group aspect-square">
                <img src={img.url} alt={img.title || `Imagem ${i + 1}`} className="w-full h-full object-cover rounded-md border" />
                <button
                  type="button"
                  onClick={() => update(data.layout, data.images.filter((_, k) => k !== i))}
                  className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground rounded-full p-0.5"
                  aria-label="Remover imagem"
                >
                  <X className="w-3 h-3" />
                </button>
                <div className="absolute inset-x-0 bottom-0 flex justify-between opacity-0 group-hover:opacity-100 transition">
                  <button type="button" onClick={() => move(i, -1)} className="bg-background/80 rounded p-0.5" aria-label="Mover para trás">
                    <ChevronLeft className="w-3 h-3" />
                  </button>
                  <button type="button" onClick={() => move(i, 1)} className="bg-background/80 rounded p-0.5" aria-label="Mover para frente">
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Legendas (opcional)</Label>
            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
              {data.images.map((img, i) => (
                <div key={i} className="flex items-center gap-2">
                  <img src={img.url} alt="" className="w-8 h-8 object-cover rounded" />
                  <Input
                    className="h-8 text-xs"
                    value={img.title || ""}
                    placeholder={`Legenda da imagem ${i + 1}`}
                    onChange={(e) => {
                      const next = [...data.images];
                      next[i] = { ...next[i], title: e.target.value };
                      update(data.layout, next);
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
