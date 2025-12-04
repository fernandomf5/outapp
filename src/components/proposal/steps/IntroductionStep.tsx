import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ImageUpload } from '@/components/ImageUpload';
import { Card, CardContent } from '@/components/ui/card';
import { Image } from 'lucide-react';

interface IntroductionStepProps {
  title: string;
  introduction: string;
  introductionImageUrl?: string;
  onChange: (data: { title?: string; introduction?: string; introduction_image_url?: string }) => void;
}

export function IntroductionStep({ title, introduction, introductionImageUrl, onChange }: IntroductionStepProps) {
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
              <Label>Imagem de Apresentação (opcional)</Label>
            </div>
            <ImageUpload
              currentImage={introductionImageUrl || null}
              onImageSelect={(url) => onChange({ introduction_image_url: url })}
              bucketName="portfolio-images"
            />
            <p className="text-xs text-muted-foreground mt-2">
              Adicione uma imagem que represente sua empresa ou o projeto proposto.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
