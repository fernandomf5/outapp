import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Play, FileText } from "lucide-react";

interface ModuleData {
  id: string;
  title: string;
  description?: string;
  video_url?: string;
  content_type: string;
  content_data?: string;
  is_free: boolean;
  price?: number;
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
            <div className="flex gap-2">
              {module.is_free && <Badge variant="secondary">Grátis</Badge>}
              {module.price && <Badge>R$ {module.price.toFixed(2)}</Badge>}
            </div>
          </div>
          {module.description && (
            <p className="text-sm text-muted-foreground">{module.description}</p>
          )}
        </DialogHeader>

        <div className="space-y-4">
          {module.content_type === 'video' && module.video_url && (
            <div className="aspect-video bg-black rounded-lg overflow-hidden">
              <iframe
                src={module.video_url}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          )}

          {module.content_type === 'text' && module.content_data && (
            <div className="prose dark:prose-invert max-w-none p-6 bg-muted/30 rounded-lg">
              <div dangerouslySetInnerHTML={{ __html: module.content_data }} />
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
