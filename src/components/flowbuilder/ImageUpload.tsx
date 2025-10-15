import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, X, Link2, Image as ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ImageUploadProps {
  onImageSelect: (url: string) => void;
  currentImage?: string;
}

export const ImageUpload = ({ onImageSelect, currentImage }: ImageUploadProps) => {
  const { toast } = useToast();
  const [imageUrl, setImageUrl] = useState(currentImage || '');
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Arquivo inválido",
        description: "Por favor, selecione uma imagem.",
        variant: "destructive",
      });
      return;
    }

    // Validar tamanho (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Arquivo muito grande",
        description: "A imagem deve ter no máximo 5MB.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `chatbot-images/${fileName}`;

      const { error: uploadError, data } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      setImageUrl(publicUrl);
      onImageSelect(publicUrl);

      toast({
        title: "Imagem enviada! 📸",
        description: "Sua imagem foi carregada com sucesso.",
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
    if (!imageUrl.trim()) {
      toast({
        title: "URL inválida",
        description: "Por favor, insira uma URL válida.",
        variant: "destructive",
      });
      return;
    }

    onImageSelect(imageUrl.trim());
    toast({
      title: "Imagem adicionada! 🖼️",
      description: "A imagem foi adicionada ao bloco.",
    });
  };

  const handleRemove = () => {
    setImageUrl('');
    onImageSelect('');
    toast({
      title: "Imagem removida",
      description: "A imagem foi removida do bloco.",
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
            <Label htmlFor="image-url">URL da Imagem</Label>
            <Input
              id="image-url"
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://exemplo.com/imagem.jpg"
              className="mt-2"
            />
          </div>
          <Button onClick={handleUrlSubmit} className="w-full" size="sm">
            <ImageIcon className="w-4 h-4 mr-2" />
            Adicionar Imagem
          </Button>
        </TabsContent>

        <TabsContent value="upload" className="space-y-3">
          <div>
            <Label htmlFor="image-file">Selecionar Arquivo</Label>
            <Input
              id="image-file"
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              disabled={uploading}
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-2">
              Máximo 5MB. Formatos: JPG, PNG, GIF, WebP
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

      {imageUrl && (
        <div className="relative rounded-lg border border-border overflow-hidden">
          <img
            src={imageUrl}
            alt="Preview"
            className="w-full h-40 object-cover"
          />
          <Button
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2"
            onClick={handleRemove}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
};
