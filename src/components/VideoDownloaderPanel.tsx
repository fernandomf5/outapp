import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Download, 
  Loader2, 
  Image as ImageIcon, 
  Video, 
  Copy,
  CheckCircle2,
  Trash2,
  Play,
  ExternalLink,
  Music,
  Youtube,
  Instagram,
  Facebook
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { FeatureGate } from '@/components/FeatureGate';

interface VideoResult {
  id: string;
  url: string;
  type: 'video' | 'audio' | 'photo' | 'gif';
  quality?: string;
  filename?: string;
  thumbnail?: string;
}

export default function VideoDownloaderPanel() {
  const { toast } = useToast();
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [media, setMedia] = useState<VideoResult[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const extractMedia = async () => {
    if (!url.trim()) {
      toast({
        title: "URL necessária",
        description: "Cole o link do vídeo que deseja baixar",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('video-downloader', {
        body: { url }
      });

      if (error) throw error;

      if (data?.media && data.media.length > 0) {
        const mediaWithIds = data.media.map((m: Omit<VideoResult, 'id'>, index: number) => ({
          ...m,
          id: `media_${Date.now()}_${index}`
        }));
        setMedia(prev => [...prev, ...mediaWithIds]);
        toast({
          title: "Mídia encontrada!",
          description: data.message || `${data.media.length} mídia(s) encontrada(s)`,
        });
        setUrl('');
      } else {
        toast({
          title: "Nenhuma mídia encontrada",
          description: data?.error || "Não foi possível extrair a mídia. Verifique se o link está correto.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error extracting video:', error);
      toast({
        title: "Erro ao processar",
        description: "Não foi possível processar o vídeo. Verifique se o link está correto.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const downloadMedia = async (item: VideoResult) => {
    try {
      // Try to download directly using fetch + blob
      const response = await fetch(item.url, { mode: 'cors' });
      if (response.ok) {
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        const extension = item.type === 'video' ? 'mp4' : item.type === 'audio' ? 'mp3' : 'jpg';
        link.download = item.filename || `download.${extension}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);
        toast({
          title: "Download iniciado!",
          description: "O arquivo está sendo baixado"
        });
      } else {
        throw new Error('CORS blocked');
      }
    } catch {
      // Fallback: open in new tab
      window.open(item.url, '_blank');
      toast({
        title: "Abrindo em nova aba",
        description: "Clique com botão direito e 'Salvar como' para baixar"
      });
    }
  };

  const copyUrl = (item: VideoResult) => {
    navigator.clipboard.writeText(item.url);
    setCopiedId(item.id);
    toast({
      title: "URL copiada!",
      description: "Link copiado para a área de transferência"
    });
    setTimeout(() => setCopiedId(null), 2000);
  };

  const removeMedia = (id: string) => {
    setMedia(prev => prev.filter(m => m.id !== id));
  };

  const downloadAll = () => {
    media.forEach((item, index) => {
      setTimeout(() => {
        window.open(item.url, '_blank');
      }, index * 500);
    });
    toast({
      title: "Downloads iniciados",
      description: `${media.length} mídia(s) sendo baixada(s)`
    });
  };

  const clearAll = () => {
    setMedia([]);
    toast({ title: "Lista limpa" });
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video':
      case 'gif':
        return <Video className="w-3 h-3 mr-1" />;
      case 'audio':
        return <Music className="w-3 h-3 mr-1" />;
      default:
        return <ImageIcon className="w-3 h-3 mr-1" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'video': return 'Vídeo';
      case 'audio': return 'Áudio';
      case 'gif': return 'GIF';
      default: return 'Foto';
    }
  };

  return (
    <FeatureGate featureKey="video_downloader">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-gradient-to-br from-red-500 to-pink-500">
                <Download className="w-5 h-5 text-white" />
              </div>
              Video Downloader
            </CardTitle>
            <CardDescription>
              Baixe vídeos do YouTube, Facebook, Instagram, TikTok e mais
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2 text-xs">
              <Badge variant="outline" className="gap-1">
                <Youtube className="w-3 h-3" /> YouTube
              </Badge>
              <Badge variant="outline" className="gap-1">
                <Facebook className="w-3 h-3" /> Facebook
              </Badge>
              <Badge variant="outline" className="gap-1">
                <Instagram className="w-3 h-3" /> Instagram
              </Badge>
              <Badge variant="outline" className="gap-1">
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>
                </svg>
                TikTok
              </Badge>
              <Badge variant="outline" className="gap-1">
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
                Twitter/X
              </Badge>
              <Badge variant="outline">+10 plataformas</Badge>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                placeholder="Cole o link do vídeo aqui..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && extractMedia()}
                className="flex-1"
              />
              <Button onClick={extractMedia} disabled={isLoading} className="gap-2">
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Buscar
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {media.length > 0 && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2">
              <div>
                <CardTitle className="text-lg">Mídias Encontradas</CardTitle>
                <CardDescription>{media.length} item(ns)</CardDescription>
              </div>
              <div className="flex gap-2">
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
                {media.map((item) => (
                  <Card key={item.id} className="overflow-hidden group">
                    <div className="aspect-video bg-muted relative">
                      {item.type === 'photo' ? (
                        <img 
                          src={item.thumbnail || item.url} 
                          alt="Media"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x300?text=Imagem';
                          }}
                        />
                      ) : item.type === 'audio' ? (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-500 to-pink-500">
                          <Music className="w-16 h-16 text-white" />
                        </div>
                      ) : (
                        <div className="w-full h-full relative bg-black">
                          {item.thumbnail ? (
                            <img 
                              src={item.thumbnail} 
                              alt="Thumbnail"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <video 
                              src={item.url}
                              className="w-full h-full object-contain"
                              muted
                              playsInline
                              preload="metadata"
                              onMouseEnter={(e) => (e.target as HTMLVideoElement).play()}
                              onMouseLeave={(e) => {
                                const video = e.target as HTMLVideoElement;
                                video.pause();
                                video.currentTime = 0;
                              }}
                            />
                          )}
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none group-hover:opacity-0 transition-opacity">
                            <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                              <Play className="w-7 h-7 text-white fill-white" />
                            </div>
                          </div>
                        </div>
                      )}
                      <Badge 
                        className="absolute top-2 right-2 z-10"
                        variant={item.type === 'video' ? 'default' : 'secondary'}
                      >
                        {getTypeIcon(item.type)}
                        {getTypeLabel(item.type)}
                      </Badge>
                      {item.quality && (
                        <Badge 
                          className="absolute top-2 left-2 z-10"
                          variant="outline"
                        >
                          {item.quality}
                        </Badge>
                      )}
                      <Button
                        size="icon"
                        variant="destructive"
                        className="absolute bottom-2 left-2 w-7 h-7 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                        onClick={() => removeMedia(item.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                    <CardContent className="p-3 space-y-2">
                      {item.filename && (
                        <p className="text-sm font-medium truncate">{item.filename}</p>
                      )}
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="flex-1 gap-1"
                          onClick={() => copyUrl(item)}
                        >
                          {copiedId === item.id ? (
                            <><CheckCircle2 className="w-3 h-3" /> Copiado</>
                          ) : (
                            <><Copy className="w-3 h-3" /> Copiar</>
                          )}
                        </Button>
                        <Button 
                          size="sm" 
                          className="flex-1 gap-1"
                          onClick={() => downloadMedia(item)}
                        >
                          <Download className="w-3 h-3" />
                          Baixar
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          className="px-2"
                          onClick={() => window.open(item.url, '_blank')}
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

        {media.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="py-12 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-red-500/20 to-pink-500/20 flex items-center justify-center mb-4">
                <Video className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="font-medium mb-1">Nenhum vídeo adicionado</h3>
              <p className="text-sm text-muted-foreground max-w-md">
                Cole o link do YouTube, Instagram, TikTok ou Facebook e clique em "Buscar"
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </FeatureGate>
  );
}
