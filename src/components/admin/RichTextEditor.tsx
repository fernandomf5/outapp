import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Image, Video, Bold, Italic, Heading1, Heading2, List, Upload } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export const RichTextEditor = ({ value, onChange, className }: RichTextEditorProps) => {
  const { toast } = useToast();
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [showVideoDialog, setShowVideoDialog] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [uploading, setUploading] = useState(false);

  const insertAtCursor = (text: string) => {
    const textarea = document.querySelector('textarea[name="content-editor"]') as HTMLTextAreaElement;
    if (!textarea) {
      onChange(value + text);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newValue = value.substring(0, start) + text + value.substring(end);
    onChange(newValue);

    // Restaurar foco e posição do cursor
    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = textarea.selectionEnd = start + text.length;
    }, 0);
  };

  const wrapSelection = (before: string, after: string) => {
    const textarea = document.querySelector('textarea[name="content-editor"]') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    const newValue = value.substring(0, start) + before + selectedText + after + value.substring(end);
    onChange(newValue);

    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = start + before.length;
      textarea.selectionEnd = start + before.length + selectedText.length;
    }, 0);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({ title: "Erro", description: "Apenas imagens são permitidas", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `page-images/${fileName}`;

      const { error: uploadError, data } = await supabase.storage
        .from('chatbot-media')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('chatbot-media')
        .getPublicUrl(filePath);

      insertAtCursor(`\n<img src="${publicUrl}" alt="Imagem" style="max-width: 100%; height: auto; border-radius: 8px; margin: 16px 0;" />\n`);
      toast({ title: "Imagem enviada!" });
    } catch (error: any) {
      toast({ title: "Erro ao enviar imagem", description: error.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleImageUrl = () => {
    if (!imageUrl) return;
    insertAtCursor(`\n<img src="${imageUrl}" alt="Imagem" style="max-width: 100%; height: auto; border-radius: 8px; margin: 16px 0;" />\n`);
    setImageUrl("");
    setShowImageDialog(false);
    toast({ title: "Imagem inserida!" });
  };

  const handleVideoUrl = () => {
    if (!videoUrl) return;

    let embedCode = "";
    
    // YouTube
    if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) {
      let videoId = "";
      if (videoUrl.includes('youtu.be/')) {
        videoId = videoUrl.split('youtu.be/')[1].split('?')[0];
      } else if (videoUrl.includes('youtube.com/watch?v=')) {
        videoId = videoUrl.split('watch?v=')[1].split('&')[0];
      }
      embedCode = `\n<div style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; max-width: 100%; margin: 16px 0;"><iframe style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;" src="https://www.youtube.com/embed/${videoId}" frameborder="0" allowfullscreen></iframe></div>\n`;
    }
    // Vimeo
    else if (videoUrl.includes('vimeo.com')) {
      const videoId = videoUrl.split('vimeo.com/')[1].split('?')[0];
      embedCode = `\n<div style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; max-width: 100%; margin: 16px 0;"><iframe style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;" src="https://player.vimeo.com/video/${videoId}" frameborder="0" allowfullscreen></iframe></div>\n`;
    }
    // Direto (mp4, etc)
    else {
      embedCode = `\n<video controls style="max-width: 100%; height: auto; border-radius: 8px; margin: 16px 0;"><source src="${videoUrl}" type="video/mp4">Seu navegador não suporta vídeos.</video>\n`;
    }

    insertAtCursor(embedCode);
    setVideoUrl("");
    setShowVideoDialog(false);
    toast({ title: "Vídeo inserido!" });
  };

  return (
    <div className={className}>
      <div className="flex flex-wrap gap-1 mb-2 p-2 border rounded-md bg-muted/30">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => wrapSelection('<strong>', '</strong>')}
          title="Negrito"
        >
          <Bold className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => wrapSelection('<em>', '</em>')}
          title="Itálico"
        >
          <Italic className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => insertAtCursor('\n<h1>Título Principal</h1>\n')}
          title="Título H1"
        >
          <Heading1 className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => insertAtCursor('\n<h2>Subtítulo</h2>\n')}
          title="Título H2"
        >
          <Heading2 className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => insertAtCursor('\n<ul>\n  <li>Item 1</li>\n  <li>Item 2</li>\n</ul>\n')}
          title="Lista"
        >
          <List className="w-4 h-4" />
        </Button>
        
        <div className="w-px h-6 bg-border mx-1" />

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setShowImageDialog(true)}
          title="Inserir imagem por URL"
        >
          <Image className="w-4 h-4" />
        </Button>

        <label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={uploading}
            title="Upload de imagem"
            asChild
          >
            <span>
              <Upload className="w-4 h-4" />
            </span>
          </Button>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
        </label>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setShowVideoDialog(true)}
          title="Inserir vídeo"
        >
          <Video className="w-4 h-4" />
        </Button>
      </div>

      <textarea
        name="content-editor"
        className="min-h-[300px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Digite seu conteúdo aqui ou use os botões acima para adicionar formatação, imagens e vídeos..."
      />

      <p className="text-xs text-muted-foreground mt-2">
        Use os botões para formatar texto, inserir imagens e vídeos. Suporta HTML.
      </p>

      {/* Dialog para URL de Imagem */}
      <Dialog open={showImageDialog} onOpenChange={setShowImageDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Inserir Imagem por URL</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>URL da Imagem</Label>
              <Input
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://exemplo.com/imagem.jpg"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowImageDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleImageUrl}>Inserir</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog para URL de Vídeo */}
      <Dialog open={showVideoDialog} onOpenChange={setShowVideoDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Inserir Vídeo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>URL do Vídeo</Label>
              <Input
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://youtube.com/watch?v=... ou https://vimeo.com/..."
              />
              <p className="text-xs text-muted-foreground mt-1">
                Suporta YouTube, Vimeo ou link direto (.mp4)
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowVideoDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleVideoUrl}>Inserir</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
