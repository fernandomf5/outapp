import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Download, 
  Search, 
  Loader2, 
  Image as ImageIcon, 
  Video, 
  ExternalLink,
  Copy,
  CheckCircle2,
  AlertCircle,
  Info
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ExtractedMedia {
  id: string;
  type: 'image' | 'video';
  url: string;
  thumbnailUrl?: string;
  adId?: string;
  pageName?: string;
}

export default function CreativeExtractorPanel() {
  const { toast } = useToast();
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [extractedMedia, setExtractedMedia] = useState<ExtractedMedia[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const extractCreatives = async () => {
    if (!url.trim()) {
      toast({
        title: "URL necessária",
        description: "Por favor, insira o link da biblioteca de anúncios do Meta",
        variant: "destructive"
      });
      return;
    }

    // Validate URL
    if (!url.includes('facebook.com/ads/library') && !url.includes('fb.com/ads/library')) {
      toast({
        title: "URL inválida",
        description: "Por favor, insira um link válido da biblioteca de anúncios do Meta (facebook.com/ads/library)",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    setExtractedMedia([]);

    try {
      const { data, error } = await supabase.functions.invoke('extract-creatives', {
        body: { url }
      });

      if (error) {
        throw error;
      }

      if (data?.media && data.media.length > 0) {
        setExtractedMedia(data.media);
        toast({
          title: "Criativos extraídos!",
          description: `${data.media.length} mídia(s) encontrada(s)`,
        });
      } else {
        toast({
          title: "Nenhum criativo encontrado",
          description: data?.message || "Não foi possível extrair mídias deste anúncio. Tente outro link.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error extracting creatives:', error);
      toast({
        title: "Erro ao extrair",
        description: "Não foi possível extrair os criativos. Verifique o link e tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const downloadMedia = async (media: ExtractedMedia) => {
    try {
      // Open in new tab for download
      window.open(media.url, '_blank');
      toast({
        title: "Download iniciado",
        description: `${media.type === 'image' ? 'Imagem' : 'Vídeo'} aberto em nova aba`
      });
    } catch (error) {
      toast({
        title: "Erro no download",
        description: "Não foi possível baixar a mídia",
        variant: "destructive"
      });
    }
  };

  const copyUrl = (media: ExtractedMedia) => {
    navigator.clipboard.writeText(media.url);
    setCopiedId(media.id);
    toast({
      title: "URL copiada!",
      description: "Link copiado para a área de transferência"
    });
    setTimeout(() => setCopiedId(null), 2000);
  };

  const downloadAll = () => {
    extractedMedia.forEach((media, index) => {
      setTimeout(() => {
        window.open(media.url, '_blank');
      }, index * 500);
    });
    toast({
      title: "Downloads iniciados",
      description: `${extractedMedia.length} mídia(s) sendo baixada(s)`
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            Extrator de Criativos
          </CardTitle>
          <CardDescription>
            Cole o link de um anúncio da Biblioteca de Anúncios do Meta para extrair imagens e vídeos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              placeholder="https://www.facebook.com/ads/library/?id=..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="flex-1"
            />
            <Button onClick={extractCreatives} disabled={isLoading} className="gap-2">
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Extraindo...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  Extrair
                </>
              )}
            </Button>
          </div>

          <div className="bg-muted/50 rounded-lg p-3 flex items-start gap-2">
            <Info className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
            <p className="text-xs text-muted-foreground">
              Acesse a <a href="https://www.facebook.com/ads/library" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Biblioteca de Anúncios do Meta</a>, 
              encontre o anúncio desejado e copie o link da página. Cole o link acima para extrair as mídias.
            </p>
          </div>
        </CardContent>
      </Card>

      {extractedMedia.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Mídias Encontradas</CardTitle>
              <CardDescription>{extractedMedia.length} criativo(s) extraído(s)</CardDescription>
            </div>
            <Button onClick={downloadAll} variant="outline" className="gap-2">
              <Download className="w-4 h-4" />
              Baixar Todos
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {extractedMedia.map((media) => (
                <Card key={media.id} className="overflow-hidden">
                  <div className="aspect-video bg-muted relative">
                    {media.type === 'image' ? (
                      <img 
                        src={media.thumbnailUrl || media.url} 
                        alt="Creative"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x300?text=Imagem';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-black/80">
                        <Video className="w-12 h-12 text-white/60" />
                      </div>
                    )}
                    <Badge 
                      className="absolute top-2 right-2"
                      variant={media.type === 'image' ? 'default' : 'secondary'}
                    >
                      {media.type === 'image' ? (
                        <><ImageIcon className="w-3 h-3 mr-1" /> Imagem</>
                      ) : (
                        <><Video className="w-3 h-3 mr-1" /> Vídeo</>
                      )}
                    </Badge>
                  </div>
                  <CardContent className="p-3 space-y-2">
                    {media.pageName && (
                      <p className="text-sm font-medium truncate">{media.pageName}</p>
                    )}
                    {media.adId && (
                      <p className="text-xs text-muted-foreground">ID: {media.adId}</p>
                    )}
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="flex-1 gap-1"
                        onClick={() => copyUrl(media)}
                      >
                        {copiedId === media.id ? (
                          <><CheckCircle2 className="w-3 h-3" /> Copiado</>
                        ) : (
                          <><Copy className="w-3 h-3" /> Copiar</>
                        )}
                      </Button>
                      <Button 
                        size="sm" 
                        className="flex-1 gap-1"
                        onClick={() => downloadMedia(media)}
                      >
                        <Download className="w-3 h-3" />
                        Baixar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {!isLoading && extractedMedia.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="py-12 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <ImageIcon className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-medium mb-1">Nenhum criativo extraído</h3>
            <p className="text-sm text-muted-foreground max-w-md">
              Cole o link de um anúncio da Biblioteca de Anúncios do Meta acima para começar a extrair imagens e vídeos.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
