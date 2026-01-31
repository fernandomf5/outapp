import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Download, 
  Search, 
  Loader2, 
  Image as ImageIcon, 
  Video, 
  Copy,
  CheckCircle2,
  Info,
  Plus,
  Trash2,
  Link2,
  Play,
  ExternalLink,
  Filter
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { isVideoUrl } from '@/lib/media';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ExtractedMedia {
  id: string;
  type: 'image' | 'video';
  url: string;
  thumbnailUrl?: string;
  adId?: string;
  pageName?: string;
}

type FilterType = 'all' | 'videos' | 'images';

export default function CreativeExtractorPanel() {
  const { toast } = useToast();
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [extractedMedia, setExtractedMedia] = useState<ExtractedMedia[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [manualUrls, setManualUrls] = useState('');
  const [extractType, setExtractType] = useState<FilterType>('all');
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);
  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({});

  const extractCreatives = async () => {
    if (!url.trim()) {
      toast({
        title: "URL necessária",
        description: "Por favor, insira o link da biblioteca de anúncios do Meta",
        variant: "destructive"
      });
      return;
    }

    if (!url.includes('facebook.com/ads/library') && !url.includes('fb.com/ads/library')) {
      toast({
        title: "URL inválida",
        description: "Por favor, insira um link válido da biblioteca de anúncios do Meta",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('extract-creatives', {
        body: { url }
      });

      if (error) throw error;

      if (data?.media && data.media.length > 0) {
        // Filter based on extractType selection
        const filteredData = data.media.filter((m: ExtractedMedia) => {
          if (extractType === 'all') return true;
          if (extractType === 'videos') return m.type === 'video';
          if (extractType === 'images') return m.type === 'image';
          return true;
        });
        
        if (filteredData.length > 0) {
          setExtractedMedia(prev => [...prev, ...filteredData]);
          toast({
            title: "Criativos extraídos!",
            description: `${filteredData.length} ${extractType === 'videos' ? 'vídeo(s)' : extractType === 'images' ? 'imagem(ns)' : 'mídia(s)'} encontrada(s)`,
          });
        } else {
          toast({
            title: `Nenhum ${extractType === 'videos' ? 'vídeo' : 'imagem'} encontrado`,
            description: "Tente outro tipo de mídia ou adicione manualmente.",
            variant: "destructive"
          });
        }
      } else {
        toast({
          title: "Nenhum criativo encontrado",
          description: data?.message || "Não foi possível extrair mídias. Tente adicionar manualmente.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error extracting creatives:', error);
      toast({
        title: "Erro ao extrair",
        description: "Não foi possível extrair. Use a aba 'Adicionar Manual' para colar URLs diretamente.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addManualUrls = () => {
    const urls = manualUrls.split('\n').filter(u => u.trim());
    if (urls.length === 0) {
      toast({
        title: "URLs necessárias",
        description: "Cole uma ou mais URLs de imagens/vídeos",
        variant: "destructive"
      });
      return;
    }

    const allMedia: ExtractedMedia[] = urls.map((mediaUrl, index) => {
      const cleanUrl = mediaUrl.trim();
      return {
        id: `manual_${Date.now()}_${index}`,
        type: isVideoUrl(cleanUrl) ? 'video' : 'image',
        url: cleanUrl,
        thumbnailUrl: cleanUrl
      };
    });

    // Filter based on extractType selection
    const newMedia = allMedia.filter(m => {
      if (extractType === 'all') return true;
      if (extractType === 'videos') return m.type === 'video';
      if (extractType === 'images') return m.type === 'image';
      return true;
    });

    if (newMedia.length === 0) {
      toast({
        title: `Nenhum ${extractType === 'videos' ? 'vídeo' : 'imagem'} encontrado`,
        description: "As URLs coladas não correspondem ao tipo selecionado.",
        variant: "destructive"
      });
      return;
    }

    setExtractedMedia(prev => [...prev, ...newMedia]);
    setManualUrls('');
    toast({
      title: "Mídias adicionadas!",
      description: `${newMedia.length} ${extractType === 'videos' ? 'vídeo(s)' : extractType === 'images' ? 'imagem(ns)' : 'mídia(s)'} adicionada(s)`,
    });
  };

  const downloadMedia = async (media: ExtractedMedia) => {
    const extension = media.type === 'video' ? 'mp4' : 'jpg';
    const filename = `creative_${media.id}.${extension}`;
    
    try {
      // Try direct fetch first
      const response = await fetch(media.url, { mode: 'cors' });
      if (response.ok) {
        const blob = await response.blob();
        // Force correct MIME type for videos
        const finalBlob = media.type === 'video' 
          ? new Blob([blob], { type: 'video/mp4' })
          : blob;
        const blobUrl = URL.createObjectURL(finalBlob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);
        toast({
          title: "Download concluído!",
          description: `${media.type === 'image' ? 'Imagem' : 'Vídeo MP4'} baixado com sucesso`
        });
        return;
      }
    } catch {
      // CORS blocked, try alternative
    }
    
    // Fallback: open in new tab with instructions
    window.open(media.url, '_blank');
    toast({
      title: "Abrindo em nova aba",
      description: media.type === 'video' 
        ? "Clique com botão direito no vídeo → 'Salvar vídeo como' → salve como .mp4"
        : "Clique com botão direito → 'Salvar imagem como'"
    });
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

  const removeMedia = (id: string) => {
    setExtractedMedia(prev => prev.filter(m => m.id !== id));
  };

  // Display all extracted media (filtering happens at extraction time now)
  const filteredMedia = extractedMedia;

  const videoCount = extractedMedia.filter(m => m.type === 'video').length;
  const imageCount = extractedMedia.filter(m => m.type === 'image').length;

  const downloadAll = () => {
    extractedMedia.forEach((media, index) => {
      setTimeout(() => {
        downloadMedia(media);
      }, index * 800);
    });
    toast({
      title: "Downloads iniciados",
      description: `${extractedMedia.length} mídia(s) sendo baixada(s)`
    });
  };

  const clearAll = () => {
    setExtractedMedia([]);
    toast({ title: "Lista limpa" });
  };

  const handleVideoClick = (media: ExtractedMedia) => {
    const videoEl = videoRefs.current[media.id];
    if (!videoEl) return;
    
    if (playingVideoId === media.id) {
      videoEl.pause();
      videoEl.currentTime = 0;
      setPlayingVideoId(null);
    } else {
      // Pause any currently playing video
      if (playingVideoId && videoRefs.current[playingVideoId]) {
        videoRefs.current[playingVideoId]?.pause();
      }
      videoEl.play();
      setPlayingVideoId(media.id);
    }
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
            Extraia imagens e vídeos da Biblioteca de Anúncios do Meta ou adicione URLs manualmente
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="extract" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="extract" className="gap-2">
                <Search className="w-4 h-4" />
                Extrair Automático
              </TabsTrigger>
              <TabsTrigger value="manual" className="gap-2">
                <Plus className="w-4 h-4" />
                Adicionar Manual
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="extract" className="space-y-4">
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Tipo de mídia:</span>
                  <Select value={extractType} onValueChange={(v) => setExtractType(v as FilterType)}>
                    <SelectTrigger className="w-[160px] h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">
                        <span className="flex items-center gap-2">Todos</span>
                      </SelectItem>
                      <SelectItem value="videos">
                        <span className="flex items-center gap-2">
                          <Video className="w-3 h-3" /> Só Vídeos
                        </span>
                      </SelectItem>
                      <SelectItem value="images">
                        <span className="flex items-center gap-2">
                          <ImageIcon className="w-3 h-3" /> Só Imagens
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
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
              </div>

              <div className="bg-muted/50 rounded-lg p-3 flex items-start gap-2">
                <Info className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>
                    <strong>Importante:</strong> Use o link de um anúncio específico (com ?id=...) para melhores resultados.
                  </p>
                  <p>
                    Se a extração automática não funcionar, use a aba "Adicionar Manual" para colar as URLs diretamente.
                  </p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="manual" className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Tipo de mídia:</span>
                  <Select value={extractType} onValueChange={(v) => setExtractType(v as FilterType)}>
                    <SelectTrigger className="w-[160px] h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">
                        <span className="flex items-center gap-2">Todos</span>
                      </SelectItem>
                      <SelectItem value="videos">
                        <span className="flex items-center gap-2">
                          <Video className="w-3 h-3" /> Só Vídeos
                        </span>
                      </SelectItem>
                      <SelectItem value="images">
                        <span className="flex items-center gap-2">
                          <ImageIcon className="w-3 h-3" /> Só Imagens
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Textarea
                  placeholder={extractType === 'videos' 
                    ? "Cole aqui as URLs dos vídeos (uma por linha):\nhttps://video...mp4" 
                    : extractType === 'images'
                    ? "Cole aqui as URLs das imagens (uma por linha):\nhttps://scontent...jpg"
                    : "Cole aqui as URLs das imagens/vídeos (uma por linha):\nhttps://scontent...jpg\nhttps://video...mp4"}
                  value={manualUrls}
                  onChange={(e) => setManualUrls(e.target.value)}
                  rows={5}
                />
                <Button onClick={addManualUrls} className="w-full gap-2">
                  <Plus className="w-4 h-4" />
                  Adicionar {extractType === 'videos' ? 'Vídeos' : extractType === 'images' ? 'Imagens' : 'Mídias'}
                </Button>
              </div>

              <div className="bg-muted/50 rounded-lg p-3 flex items-start gap-2">
                <Link2 className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
                <div className="text-xs text-muted-foreground space-y-1">
                  <p><strong>Como obter as URLs:</strong></p>
                  <ol className="list-decimal list-inside space-y-0.5">
                    <li>Abra o anúncio na Biblioteca de Anúncios</li>
                    <li>Clique em "Ver detalhes do anúncio"</li>
                    <li>Clique com botão direito na imagem/vídeo</li>
                    <li>Selecione "Copiar endereço da imagem" ou "Copiar endereço do vídeo"</li>
                    <li>Cole a URL acima</li>
                  </ol>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {extractedMedia.length > 0 && (
        <Card>
          <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg">Mídias Encontradas</CardTitle>
              <CardDescription>
                {extractedMedia.length} criativo(s) • {videoCount} vídeo(s) • {imageCount} imagem(ns)
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button onClick={clearAll} variant="outline" size="sm" className="gap-2">
                <Trash2 className="w-4 h-4" />
                Limpar
              </Button>
              <Button onClick={downloadAll} variant="outline" size="sm" className="gap-2">
                <Download className="w-4 h-4" />
                Baixar Todos
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredMedia.map((media) => (
                <Card key={media.id} className="overflow-hidden group">
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
                      <div 
                        className="w-full h-full relative bg-black cursor-pointer"
                        onClick={() => handleVideoClick(media)}
                      >
                        <video 
                          ref={(el) => { videoRefs.current[media.id] = el; }}
                          src={media.url}
                          className="w-full h-full object-contain"
                          muted
                          playsInline
                          preload="metadata"
                          crossOrigin="anonymous"
                          onEnded={() => setPlayingVideoId(null)}
                          onError={() => {
                            // Video can't be previewed due to CORS - show fallback
                            const videoEl = videoRefs.current[media.id];
                            if (videoEl) {
                              videoEl.style.display = 'none';
                            }
                          }}
                        />
                        {playingVideoId !== media.id && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                              <Play className="w-7 h-7 text-white fill-white" />
                            </div>
                          </div>
                        )}
                        {/* Fallback for CORS-blocked videos */}
                        <div className="absolute inset-0 flex items-center justify-center bg-muted/80 opacity-0 hover:opacity-100 transition-opacity">
                          <div className="text-center p-2">
                            <Video className="w-8 h-8 mx-auto mb-1 text-muted-foreground" />
                            <p className="text-xs text-muted-foreground">Clique para baixar MP4</p>
                          </div>
                        </div>
                      </div>
                    )}
                    <Badge 
                      className="absolute top-2 right-2 z-10"
                      variant={media.type === 'image' ? 'default' : 'secondary'}
                    >
                      {media.type === 'image' ? (
                        <><ImageIcon className="w-3 h-3 mr-1" /> Imagem</>
                      ) : (
                        <><Video className="w-3 h-3 mr-1" /> Vídeo</>
                      )}
                    </Badge>
                    <Button
                      size="icon"
                      variant="destructive"
                      className="absolute top-2 left-2 w-7 h-7 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                      onClick={(e) => { e.stopPropagation(); removeMedia(media.id); }}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
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
                      <Button 
                        size="sm" 
                        variant="ghost"
                        className="px-2"
                        onClick={() => window.open(media.url, '_blank')}
                        title="Abrir em nova aba"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {extractedMedia.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="py-12 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <ImageIcon className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-medium mb-1">Nenhum criativo extraído</h3>
            <p className="text-sm text-muted-foreground max-w-md">
              Use a extração automática ou adicione URLs manualmente para começar.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
