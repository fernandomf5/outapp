import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, ChevronUp, ChevronDown } from "lucide-react";
import {
  VIDEO_LAYOUT_OPTIONS,
  VideoLayout,
  GalleryVideo,
  parseVideoGalleryContent,
  stringifyVideoGalleryContent,
} from "./MembersVideoGallery";

interface Props {
  content: string;
  onChange: (content: string) => void;
}

export function VideoGalleryBlockEditor({ content, onChange }: Props) {
  const data = parseVideoGalleryContent(content);

  const update = (layout: VideoLayout, videos: GalleryVideo[]) =>
    onChange(stringifyVideoGalleryContent({ layout, videos }));

  const setVideo = (idx: number, patch: Partial<GalleryVideo>) => {
    const next = [...data.videos];
    next[idx] = { ...next[idx], ...patch };
    update(data.layout, next);
  };

  const move = (idx: number, dir: number) => {
    const j = idx + dir;
    if (j < 0 || j >= data.videos.length) return;
    const next = [...data.videos];
    [next[idx], next[j]] = [next[j], next[idx]];
    update(data.layout, next);
  };

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label className="text-xs">Formato de exibição na área de membros</Label>
        <Select value={data.layout} onValueChange={(v) => update(v as VideoLayout, data.videos)}>
          <SelectTrigger className="h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="z-[300]">
            {VIDEO_LAYOUT_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <p className="text-xs text-muted-foreground">
        Adicione várias URLs de vídeo (YouTube, Vimeo ou link direto) com título e descrição.
      </p>

      {data.videos.map((video, idx) => (
        <div key={idx} className="p-3 border rounded-lg space-y-2 bg-muted/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Vídeo {idx + 1}</span>
            <div className="flex items-center gap-1">
              <Button type="button" variant="ghost" size="sm" onClick={() => move(idx, -1)} aria-label="Mover para cima">
                <ChevronUp className="w-3 h-3" />
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => move(idx, 1)} aria-label="Mover para baixo">
                <ChevronDown className="w-3 h-3" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => update(data.layout, data.videos.filter((_, k) => k !== idx))}
                aria-label="Remover vídeo"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          </div>
          <Input
            value={video.title || ""}
            onChange={(e) => setVideo(idx, { title: e.target.value })}
            placeholder="Título do vídeo"
          />
          <Input
            value={video.url || ""}
            onChange={(e) => setVideo(idx, { url: e.target.value })}
            placeholder="URL do vídeo (YouTube, Vimeo, etc)"
          />
          <Input
            value={video.thumbnail || ""}
            onChange={(e) => setVideo(idx, { thumbnail: e.target.value })}
            placeholder="URL da miniatura (opcional — usada em playlist/carrossel)"
          />
          <Textarea
            value={video.description || ""}
            onChange={(e) => setVideo(idx, { description: e.target.value })}
            placeholder="Descrição do vídeo (opcional)"
            className="min-h-[60px]"
          />
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => update(data.layout, [...data.videos, { url: "", title: "", description: "" }])}
      >
        <Plus className="w-4 h-4 mr-1" /> Adicionar vídeo
      </Button>
    </div>
  );
}
