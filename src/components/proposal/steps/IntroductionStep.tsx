import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ImageUpload } from '@/components/ImageUpload';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Image, X, Plus } from 'lucide-react';

interface IntroductionStepProps {
  title: string;
  introduction: string;
  introductionImageUrl?: string;
  introductionImages?: string[];
  onChange: (data: { title?: string; introduction?: string; introduction_image_url?: string; introduction_images?: string[] }) => void;
}

export function IntroductionStep({ title, introduction, introductionImageUrl, introductionImages = [], onChange }: IntroductionStepProps) {
  const [showImageUpload, setShowImageUpload] = useState(false);
  
  // Merge legacy single image with new array format
  const allImages = introductionImages.length > 0 
    ? introductionImages 
    : (introductionImageUrl ? [introductionImageUrl] : []);

  const handleAddImage = (url: string) => {
    const newImages = [...allImages, url];
    onChange({ introduction_images: newImages, introduction_image_url: newImages[0] });
    setShowImageUpload(false);
  };

  const handleRemoveImage = (index: number) => {
    const newImages = allImages.filter((_, i) => i !== index);
    onChange({ 
      introduction_images: newImages, 
      introduction_image_url: newImages[0] || undefined 
    });
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold">Introdução</h2>
        <p className="text-muted-foreground">Apresente sua proposta de forma atrativa</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">Título da Proposta *</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => onChange({ title: e.target.value })}
            placeholder="Ex: Proposta de Desenvolvimento de Website"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="introduction">Texto de Introdução</Label>
          <Textarea
            id="introduction"
            value={introduction}
            onChange={(e) => onChange({ introduction: e.target.value })}
            placeholder="Apresente sua empresa, contextualize a proposta e mostre o valor que você pode entregar..."
            rows={8}
            className="resize-none"
          />
          <p className="text-xs text-muted-foreground">
            Dica: Comece agradecendo a oportunidade e apresente brevemente sua empresa e expertise.
          </p>
        </div>

        <Card className="border-dashed">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-3">
              <Image className="h-4 w-4 text-primary" />
              <Label>Imagens de Apresentação (opcional)</Label>
            </div>
            
            {/* Display existing images */}
            {allImages.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {allImages.map((img, idx) => (
                  <div key={idx} className="relative group">
                    <img 
                      src={img} 
                      alt={`Apresentação ${idx + 1}`} 
                      className="w-24 h-24 object-cover rounded-lg border"
                    />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute -top-1 -right-1 h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleRemoveImage(idx)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Add image section */}
            {showImageUpload ? (
              <div className="border border-dashed rounded-lg p-3">
                <ImageUpload
                  currentImage={null}
                  onImageSelect={handleAddImage}
                  bucketName="portfolio-images"
                />
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="mt-2 w-full"
                  onClick={() => setShowImageUpload(false)}
                >
                  Cancelar
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => setShowImageUpload(true)}
              >
                <Plus className="h-4 w-4" />
                {allImages.length > 0 ? 'Adicionar Mais Imagens' : 'Adicionar Imagem'}
              </Button>
            )}
            
            <p className="text-xs text-muted-foreground mt-2">
              Adicione imagens que representem sua empresa ou o projeto proposto. Múltiplas imagens serão exibidas em carrossel.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
