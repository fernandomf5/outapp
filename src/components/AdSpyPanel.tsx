import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Eye,
  TrendingUp,
  Filter,
  ExternalLink,
  Download,
  Heart,
  Share2
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface Ad {
  id: string;
  platform: 'meta' | 'google' | 'tiktok';
  advertiser: string;
  title: string;
  description: string;
  image_url?: string;
  video_url?: string;
  cta_text: string;
  landing_page_url: string;
  first_seen: string;
  last_seen: string;
  impressions_estimate: number;
  engagement_estimate: number;
}

export const AdSpyPanel = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [platform, setPlatform] = useState<'all' | 'meta' | 'google' | 'tiktok'>('all');
  const [industry, setIndustry] = useState('all');
  const [loading, setLoading] = useState(false);
  const [savedAds, setSavedAds] = useState<string[]>([]);
  const [results, setResults] = useState<Ad[]>([]);

  // Dados de exemplo (em produção, viria de uma API)
  const exampleAds: Ad[] = [
    {
      id: '1',
      platform: 'meta',
      advertiser: 'Nike',
      title: 'Just Do It - Nova Coleção',
      description: 'Descubra os tênis mais confortáveis da temporada. Estilo e performance em um só lugar.',
      image_url: 'https://picsum.photos/seed/nike/400/300',
      cta_text: 'Comprar Agora',
      landing_page_url: 'https://nike.com',
      first_seen: '2024-01-15',
      last_seen: '2024-02-20',
      impressions_estimate: 2500000,
      engagement_estimate: 45000
    },
    {
      id: '2',
      platform: 'google',
      advertiser: 'Apple',
      title: 'iPhone 15 Pro - Titanium',
      description: 'Mais leve. Mais forte. Mais Pro do que nunca.',
      image_url: 'https://picsum.photos/seed/apple/400/300',
      cta_text: 'Saiba Mais',
      landing_page_url: 'https://apple.com',
      first_seen: '2024-02-01',
      last_seen: '2024-02-25',
      impressions_estimate: 5000000,
      engagement_estimate: 125000
    },
    {
      id: '3',
      platform: 'tiktok',
      advertiser: 'Gymshark',
      title: 'Treino & Estilo',
      description: 'A roupa fitness que você merece. Conforto e performance.',
      video_url: 'https://example.com/video.mp4',
      cta_text: 'Ver Coleção',
      landing_page_url: 'https://gymshark.com',
      first_seen: '2024-02-10',
      last_seen: '2024-02-28',
      impressions_estimate: 1800000,
      engagement_estimate: 92000
    }
  ];

  const handleSearch = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('ad-spy-search', {
        body: { query: searchQuery, platform, industry },
      });
      if (error) throw error;
      if (data?.ads) {
        setResults(data.ads as Ad[]);
      } else {
        setResults([]);
      }
      toast.success("Busca concluída!");
    } catch (e: any) {
      toast.error(e.message || 'Erro ao buscar anúncios');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAd = (adId: string) => {
    if (savedAds.includes(adId)) {
      setSavedAds(savedAds.filter(id => id !== adId));
      toast.success("Anúncio removido dos favoritos");
    } else {
      setSavedAds([...savedAds, adId]);
      toast.success("Anúncio salvo nos favoritos!");
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch(platform) {
      case 'meta': return '📘';
      case 'google': return '🔍';
      case 'tiktok': return '🎵';
      default: return '📱';
    }
  };

  const getPlatformColor = (platform: string) => {
    switch(platform) {
      case 'meta': return 'bg-blue-500/20 text-blue-500';
      case 'google': return 'bg-green-500/20 text-green-500';
      case 'tiktok': return 'bg-pink-500/20 text-pink-500';
      default: return '';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Espionar Anúncios</h2>
        <p className="text-muted-foreground">Descubra os anúncios dos seus concorrentes em Meta, Google e TikTok</p>
      </div>

      {/* Barra de Busca */}
      <Card className="glass">
        <CardContent className="pt-6">
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>Buscar por</Label>
              <div className="flex gap-2">
                <Input 
                  placeholder="Nome da marca, palavra-chave, URL..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="flex-1"
                />
                <Button onClick={handleSearch} className="gradient-primary shadow-glow" disabled={loading}>
                  <Search className="mr-2 h-4 w-4" />
                  {loading ? 'Buscando...' : 'Buscar'}
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label>Plataforma</Label>
                <Select value={platform} onValueChange={(value: any) => setPlatform(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="meta">Meta (Facebook/Instagram)</SelectItem>
                    <SelectItem value="google">Google Ads</SelectItem>
                    <SelectItem value="tiktok">TikTok Ads</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>Indústria</Label>
                <Select value={industry} onValueChange={setIndustry}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="ecommerce">E-commerce</SelectItem>
                    <SelectItem value="saas">SaaS</SelectItem>
                    <SelectItem value="finance">Finanças</SelectItem>
                    <SelectItem value="health">Saúde</SelectItem>
                    <SelectItem value="education">Educação</SelectItem>
                    <SelectItem value="fashion">Moda</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>Ordenar por</Label>
                <Select defaultValue="recent">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recent">Mais Recentes</SelectItem>
                    <SelectItem value="impressions">Mais Visualizados</SelectItem>
                    <SelectItem value="engagement">Maior Engajamento</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="glass hover:shadow-glow transition-smooth">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Anúncios Encontrados</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(results.length || exampleAds.length)}</div>
            <p className="text-xs text-muted-foreground">nesta busca</p>
          </CardContent>
        </Card>

        <Card className="glass hover:shadow-glow transition-smooth">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Favoritos</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{savedAds.length}</div>
            <p className="text-xs text-muted-foreground">anúncios salvos</p>
          </CardContent>
        </Card>

        <Card className="glass hover:shadow-glow transition-smooth">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Plataformas</CardTitle>
            <Filter className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">Meta, Google, TikTok</p>
          </CardContent>
        </Card>

        <Card className="glass hover:shadow-glow transition-smooth">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Engajamento Médio</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">87K</div>
            <p className="text-xs text-muted-foreground">interações</p>
          </CardContent>
        </Card>
      </div>

      {/* Resultados */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">Todos</TabsTrigger>
          <TabsTrigger value="meta">Meta</TabsTrigger>
          <TabsTrigger value="google">Google</TabsTrigger>
          <TabsTrigger value="tiktok">TikTok</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4 mt-4">
          {loading ? (
            <Card className="p-12 text-center">
              <p className="text-muted-foreground">Buscando anúncios...</p>
            </Card>
          ) : exampleAds.length === 0 ? (
            <Card className="p-12 text-center">
              <Search className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-2">Nenhum anúncio encontrado</p>
              <p className="text-sm text-muted-foreground">
                Tente ajustar seus filtros de busca
              </p>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {(results.length ? results : exampleAds).map((ad) => (
                <Card key={ad.id} className="glass hover:shadow-lg transition-smooth overflow-hidden">
                  {ad.image_url && (
                    <div className="relative aspect-video bg-muted">
                      <img 
                        src={ad.image_url} 
                        alt={ad.title}
                        className="w-full h-full object-cover"
                      />
                      <Badge className={`absolute top-2 left-2 ${getPlatformColor(ad.platform)}`}>
                        {getPlatformIcon(ad.platform)} {ad.platform.toUpperCase()}
                      </Badge>
                      <Button
                        variant="secondary"
                        size="icon"
                        className="absolute top-2 right-2"
                        onClick={() => handleSaveAd(ad.id)}
                      >
                        <Heart 
                          className={`h-4 w-4 ${savedAds.includes(ad.id) ? 'fill-current text-destructive' : ''}`}
                        />
                      </Button>
                    </div>
                  )}
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base mb-1">{ad.title}</CardTitle>
                        <p className="text-sm text-muted-foreground">{ad.advertiser}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {ad.description}
                    </p>
                    
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <p className="text-muted-foreground">Impressões</p>
                        <p className="font-semibold">{(ad.impressions_estimate / 1000).toFixed(0)}K</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Engajamento</p>
                        <p className="font-semibold">{(ad.engagement_estimate / 1000).toFixed(0)}K</p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Ver Landing Page
                      </Button>
                      <Button variant="outline" size="icon">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>

                    <Badge variant="outline" className="w-full justify-center">
                      {ad.cta_text}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Conteúdo similar para outras tabs */}
        <TabsContent value="meta">
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">Filtrado apenas Meta Ads (Facebook/Instagram)</p>
          </Card>
        </TabsContent>
        
        <TabsContent value="google">
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">Filtrado apenas Google Ads</p>
          </Card>
        </TabsContent>
        
        <TabsContent value="tiktok">
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">Filtrado apenas TikTok Ads</p>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
