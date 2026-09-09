import { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Upload, X } from "lucide-react";

const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB (limite do storage)

export interface VideoUploadFieldProps {
  /** URL atual do vídeo (link externo ou arquivo enviado) */
  value: string;
  /** Recebe a URL pública após o upload */
  onChange: (url: string) => void;
  className?: string;
}

/** Permite enviar um arquivo de vídeo e devolve a URL pública do storage */
export const VideoUploadField = ({ value, onChange, className }: VideoUploadFieldProps) => {
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (file: File | undefined): Promise<void> => {
    if (!file) return;

    if (!file.type.startsWith("video/")) {
      toast.error("Selecione um arquivo de vídeo");
      return;
    }
    if (file.size > MAX_VIDEO_SIZE) {
      toast.error("Vídeo muito grande. Máximo 50MB — para vídeos maiores, use um link (YouTube, Vimeo, Drive)");
      return;
    }

    try {
      setUploading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Faça login para enviar vídeos");
        return;
      }

      const ext = file.name.split(".").pop() || "mp4";
      const path = `${user.id}/videos/${Date.now()}-${Math.random().toString(16).slice(2)}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("chatbot-media")
        .upload(path, file, { cacheControl: "3600", upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from("chatbot-media").getPublicUrl(path);
      onChange(publicUrl);
      toast.success("Vídeo enviado!");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Tente novamente";
      toast.error(`Erro ao enviar vídeo: ${message}`);
    } finally {
      setUploading(false);
    }
  };

  const isUploaded = value.includes("/storage/v1/object/public/");

  return (
    <div className={className}>
      <div className="flex flex-wrap items-center gap-2">
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-input px-3 py-1.5 text-sm hover:bg-accent focus-within:ring-2 focus-within:ring-ring">
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          {uploading ? "Enviando..." : "Enviar vídeo do dispositivo"}
          <input
            type="file"
            accept="video/*"
            className="hidden"
            disabled={uploading}
            onChange={(e) => {
              void handleUpload(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
        </label>
        {isUploaded && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onChange("")}
            aria-label="Remover vídeo enviado"
          >
            <X className="mr-1 h-4 w-4" /> Remover
          </Button>
        )}
        <span className="text-xs text-muted-foreground">MP4, WebM ou MOV até 200MB</span>
      </div>

      {isUploaded && (
        <video src={value} controls playsInline className="mt-2 max-h-48 w-full rounded-lg border bg-black object-contain" />
      )}
    </div>
  );
};

export default VideoUploadField;
