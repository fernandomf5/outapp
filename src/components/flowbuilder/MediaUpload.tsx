import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, X, Link2, FileAudio, Video as VideoIcon, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface MediaUploadProps {
  onMediaSelect: (url: string, fileName?: string) => void;
  currentMedia?: string;
  currentFileName?: string;
  mediaType: 'audio' | 'video' | 'document';
}

export const MediaUpload = ({ onMediaSelect, currentMedia, currentFileName, mediaType }: MediaUploadProps) => {
  const { toast } = useToast();
  const [mediaUrl, setMediaUrl] = useState(currentMedia || '');
  const [uploading, setUploading] = useState(false);

  const getAcceptTypes = () => {
    switch (mediaType) {
      case 'audio':
        return 'audio/*';
      case 'video':
        return 'video/*';
      case 'document':
        return '.pdf,.doc,.docx,.txt,.xlsx,.xls,.ppt,.pptx';
      default:
        return '*';
    }
  };

  const getMaxSize = () => {
    switch (mediaType) {
      case 'audio':
        return 10; // 10MB
      case 'video':
        return 50; // 50MB
      case 'document':
        return 10; // 10MB
      default:
        return 10;
    }
  };

  const getIcon = () => {
    switch (mediaType) {
      case 'audio':
        return FileAudio;
      case 'video':
        return VideoIcon;
      case 'document':
        return FileText;
    }
  };

  const Icon = getIcon();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxSize = getMaxSize();
    
    // Validar tamanho
    if (file.size > maxSize * 1024 * 1024) {
      toast({
        title: "Arquivo muito grande",
        description: `O arquivo deve ter no máximo ${maxSize}MB.`,
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `chatbot-${mediaType}s/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      setMediaUrl(publicUrl);
      onMediaSelect(publicUrl, file.name);

      toast({
        title: "Arquivo enviado! 📁",
        description: "Seu arquivo foi carregado com sucesso.",
      });
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "Erro ao enviar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleUrlSubmit = () => {
    if (!mediaUrl.trim()) {
      toast({
        title: "URL inválida",
        description: "Por favor, insira uma URL válida.",
        variant: "destructive",
      });
      return;
    }

    onMediaSelect(mediaUrl.trim());
    toast({
      title: "Arquivo adicionado! 📎",
      description: "O arquivo foi adicionado ao bloco.",
    });
  };

  const handleRemove = () => {
    setMediaUrl('');
    onMediaSelect('', '');
    toast({
      title: "Arquivo removido",
      description: "O arquivo foi removido do bloco.",
    });
  };

  return (
    <div className="space-y-4">
      <Tabs defaultValue="url" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="url">
            <Link2 className="w-4 h-4 mr-2" />
            URL
          </TabsTrigger>
          <TabsTrigger value="upload">
            <Upload className="w-4 h-4 mr-2" />
            Upload
          </TabsTrigger>
        </TabsList>

        <TabsContent value="url" className="space-y-3">
          <div>
            <Label htmlFor="media-url">URL do Arquivo</Label>
            <Input
              id="media-url"
              type="url"
              value={mediaUrl}
              onChange={(e) => setMediaUrl(e.target.value)}
              placeholder={`https://exemplo.com/arquivo.${mediaType === 'audio' ? 'mp3' : mediaType === 'video' ? 'mp4' : 'pdf'}`}
              className="mt-2"
            />
          </div>
          <Button onClick={handleUrlSubmit} className="w-full" size="sm">
            <Icon className="w-4 h-4 mr-2" />
            Adicionar Arquivo
          </Button>
        </TabsContent>

        <TabsContent value="upload" className="space-y-3">
          <div>
            <Label htmlFor="media-file">Selecionar Arquivo</Label>
            <Input
              id="media-file"
              type="file"
              accept={getAcceptTypes()}
              onChange={handleFileUpload}
              disabled={uploading}
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-2">
              Máximo {getMaxSize()}MB. {mediaType === 'audio' && 'Formatos: MP3, WAV, OGG'}
              {mediaType === 'video' && 'Formatos: MP4, WebM, MOV'}
              {mediaType === 'document' && 'Formatos: PDF, DOC, XLSX, etc.'}
            </p>
          </div>
          {uploading && (
            <div className="text-center py-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
              <p className="text-sm text-muted-foreground mt-2">Enviando...</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {mediaUrl && (
        <div className="relative rounded-lg border border-border p-4">
          <div className="flex items-center gap-3">
            <Icon className="w-8 h-8 text-primary" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {currentFileName || 'Arquivo carregado'}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {mediaUrl}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRemove}
              className="flex-shrink-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          
          {mediaType === 'audio' && (
            <audio controls className="w-full mt-3">
              <source src={mediaUrl} />
            </audio>
          )}
          
          {mediaType === 'video' && (
            <video controls className="w-full mt-3 rounded-md max-h-64">
              <source src={mediaUrl} />
            </video>
          )}
        </div>
      )}
    </div>
  );
};