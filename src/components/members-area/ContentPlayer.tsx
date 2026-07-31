import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Play, FileText } from "lucide-react";
import { BlockRichText } from "@/components/members-area/BlockRichText";
import { getVideoEmbedUrl } from "@/lib/videoEmbed";

interface ModuleData {
  id: string;
  title: string;
  description?: string;
  video_url?: string;
  content_type: string;
  content_data?: string;
  is_locked?: boolean;
}

interface ContentPlayerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  module: ModuleData | null;
}

export function ContentPlayer({ open, onOpenChange, module }: ContentPlayerProps) {
  if (!module) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>{module.title}</DialogTitle>
            {module.is_locked && (
              <Badge variant="secondary">Bloqueado</Badge>
            )}
          </div>
          {module.description && (
            <p className="text-sm text-muted-foreground">{module.description}</p>
          )}
        </DialogHeader>

        <div className="space-y-4">
          {module.content_type === 'video' && module.video_url && (
            <div className="aspect-video bg-black rounded-lg overflow-hidden">
              {getVideoEmbedUrl(module.video_url) ? (
                <iframe
                  src={getVideoEmbedUrl(module.video_url) as string}
                  title={module.title}
                  className="w-full h-full"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
                  allowFullScreen
                />
              ) : (
                <video controls playsInline className="w-full h-full">
                  <source src={module.video_url} />
                </video>
              )}
            </div>
          )}

          {module.content_type === 'text' && module.content_data && (
            <div className="prose dark:prose-invert max-w-none p-6 bg-muted/30 rounded-lg">
              <BlockRichText content={module.content_data} />
            </div>
          )}

          {module.content_type === 'document' && (
            <div className="text-center py-12 border-2 border-dashed rounded-lg">
              <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Visualização de documentos em breve</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
