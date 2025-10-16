import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, Code, Copy, Trash2, Eye, EyeOff, TrendingUp } from "lucide-react";
import { Switch } from "@/components/ui/switch";

interface Pixel {
  id: string;
  name: string;
  type: string;
  pixel_id: string;
  code: string | null;
  is_active: boolean;
  created_at: string;
}

interface ConversionEvent {
  id: string;
  event_name: string;
  event_data: any;
  created_at: string;
}

export const PixelsManager = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [pixels, setPixels] = useState<Pixel[]>([]);
  const [selectedPixel, setSelectedPixel] = useState<Pixel | null>(null);
  const [events, setEvents] = useState<ConversionEvent[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newPixel, setNewPixel] = useState({
    name: "",
    type: "facebook",
    pixel_id: "",
    code: ""
  });

  useEffect(() => {
    if (user) {
      fetchPixels();
    }
  }, [user]);

  useEffect(() => {
    if (selectedPixel) {
      fetchEvents(selectedPixel.id);
    }
  }, [selectedPixel]);

  const fetchPixels = async () => {
    const { data, error } = await supabase
      .from('tracking_pixels')
      .select('*')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setPixels(data);
    }
  };

  const fetchEvents = async (pixelId: string) => {
    const { data, error } = await supabase
      .from('conversion_events')
      .select('*')
      .eq('pixel_id', pixelId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (!error && data) {
      setEvents(data);
    }
  };

  const handleCreatePixel = async () => {
    if (!newPixel.name || !newPixel.pixel_id) {
      toast({
        title: "Erro",
        description: "Nome e ID do pixel são obrigatórios",
        variant: "destructive"
      });
      return;
    }

    const { data, error } = await supabase
      .from('tracking_pixels')
      .insert({
        ...newPixel,
        user_id: user!.id
      })
      .select()
      .single();

    if (error) {
      toast({
        title: "Erro ao criar pixel",
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({ title: "Pixel criado com sucesso!" });
      setPixels([data, ...pixels]);
      setNewPixel({ name: "", type: "facebook", pixel_id: "", code: "" });
      setIsCreateDialogOpen(false);
    }
  };

  const handleToggleActive = async (pixel: Pixel) => {
    const { error } = await supabase
      .from('tracking_pixels')
      .update({ is_active: !pixel.is_active })
      .eq('id', pixel.id);

    if (error) {
      toast({
        title: "Erro ao atualizar",
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({ title: pixel.is_active ? "Pixel desativado" : "Pixel ativado" });
      fetchPixels();
    }
  };

  const handleDeletePixel = async (id: string) => {
    const { error } = await supabase
      .from('tracking_pixels')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: "Erro ao deletar",
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({ title: "Pixel removido" });
      setPixels(pixels.filter(p => p.id !== id));
      if (selectedPixel?.id === id) {
        setSelectedPixel(null);
      }
    }
  };

  const copyInstallCode = (pixel: Pixel) => {
    const installCode = pixel.code || generateDefaultCode(pixel);
    navigator.clipboard.writeText(installCode);
    toast({ title: "Código copiado!" });
  };

  const generateDefaultCode = (pixel: Pixel) => {
    switch (pixel.type) {
      case 'facebook':
        return `<!-- Meta Pixel Code -->
<script>
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${pixel.pixel_id}');
fbq('track', 'PageView');
</script>
<noscript><img height="1" width="1" style="display:none"
src="https://www.facebook.com/tr?id=${pixel.pixel_id}&ev=PageView&noscript=1"
/></noscript>
<!-- End Meta Pixel Code -->`;
      case 'google_analytics':
        return `<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=${pixel.pixel_id}"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', '${pixel.pixel_id}');
</script>
<!-- End Google Analytics -->`;
      case 'google_ads':
        return `<!-- Google Ads Conversion -->
<script async src="https://www.googletagmanager.com/gtag/js?id=${pixel.pixel_id}"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', '${pixel.pixel_id}');
</script>
<!-- End Google Ads Conversion -->`;
      case 'tiktok':
        return `<!-- TikTok Pixel Code -->
<script>
!function (w, d, t) {
  w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var o=document.createElement("script");o.type="text/javascript",o.async=!0,o.src=i+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};
  ttq.load('${pixel.pixel_id}');
  ttq.page();
}(window, document, 'ttq');
</script>
<!-- End TikTok Pixel Code -->`;
      default:
        return pixel.code || '<!-- Custom tracking code here -->';
    }
  };

  const getPixelTypeIcon = (type: string) => {
    switch (type) {
      case 'facebook': return '📘';
      case 'google_analytics': return '📊';
      case 'google_ads': return '🎯';
      case 'tiktok': return '🎵';
      default: return '🏷️';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Pixels & Tags de Rastreamento</h2>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-primary">
              <Plus className="w-4 h-4 mr-2" />
              Novo Pixel
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Adicionar Pixel de Rastreamento</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>Nome do Pixel *</Label>
                <Input
                  value={newPixel.name}
                  onChange={(e) => setNewPixel({ ...newPixel, name: e.target.value })}
                  placeholder="Ex: Facebook Pixel Principal"
                />
              </div>
              <div>
                <Label>Tipo *</Label>
                <Select value={newPixel.type} onValueChange={(v) => setNewPixel({ ...newPixel, type: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="facebook">Facebook Pixel</SelectItem>
                    <SelectItem value="google_analytics">Google Analytics</SelectItem>
                    <SelectItem value="google_ads">Google Ads</SelectItem>
                    <SelectItem value="tiktok">TikTok Pixel</SelectItem>
                    <SelectItem value="custom">Código Customizado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>ID do Pixel *</Label>
                <Input
                  value={newPixel.pixel_id}
                  onChange={(e) => setNewPixel({ ...newPixel, pixel_id: e.target.value })}
                  placeholder="Ex: 123456789012345"
                />
              </div>
              <div>
                <Label>Código Customizado (opcional)</Label>
                <Textarea
                  value={newPixel.code}
                  onChange={(e) => setNewPixel({ ...newPixel, code: e.target.value })}
                  placeholder="Cole seu código de rastreamento aqui"
                  rows={6}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Deixe em branco para usar o código padrão do tipo selecionado
                </p>
              </div>
              <Button onClick={handleCreatePixel} className="w-full gradient-primary">
                Criar Pixel
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Lista de Pixels */}
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Seus Pixels ({pixels.length})</h3>
          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {pixels.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhum pixel configurado ainda
              </p>
            ) : (
              pixels.map((pixel) => (
                <Card
                  key={pixel.id}
                  className={`p-4 transition-smooth hover:shadow-lg ${
                    selectedPixel?.id === pixel.id ? 'border-primary bg-primary/5' : ''
                  }`}
                  onClick={() => setSelectedPixel(pixel)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-start gap-2 flex-1">
                      <span className="text-2xl">{getPixelTypeIcon(pixel.type)}</span>
                      <div className="flex-1">
                        <h4 className="font-semibold">{pixel.name}</h4>
                        <p className="text-xs text-muted-foreground">
                          ID: {pixel.pixel_id}
                        </p>
                      </div>
                    </div>
                    <Badge variant={pixel.is_active ? "default" : "secondary"}>
                      {pixel.is_active ? "Ativo" : "Inativo"}
                    </Badge>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        copyInstallCode(pixel);
                      }}
                    >
                      <Copy className="w-3 h-3 mr-1" />
                      Copiar Código
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleActive(pixel);
                      }}
                    >
                      {pixel.is_active ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeletePixel(pixel.id);
                      }}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </div>
        </Card>

        {/* Detalhes e Eventos */}
        <Card className="p-6">
          {selectedPixel ? (
            <div className="space-y-4">
              <div className="border-b pb-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-3xl">{getPixelTypeIcon(selectedPixel.type)}</span>
                  <div>
                    <h3 className="font-semibold text-lg">{selectedPixel.name}</h3>
                    <p className="text-sm text-muted-foreground">{selectedPixel.type}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <Label>Status:</Label>
                  <Switch
                    checked={selectedPixel.is_active}
                    onCheckedChange={() => handleToggleActive(selectedPixel)}
                  />
                  <span className="text-sm">
                    {selectedPixel.is_active ? "Ativo" : "Inativo"}
                  </span>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Código de Instalação</h4>
                <div className="bg-muted p-3 rounded-md">
                  <pre className="text-xs overflow-x-auto whitespace-pre-wrap break-words">
                    {selectedPixel.code || generateDefaultCode(selectedPixel)}
                  </pre>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-2 w-full"
                  onClick={() => copyInstallCode(selectedPixel)}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copiar Código
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  Cole este código no head do seu site para começar o rastreamento
                </p>
              </div>

              <div className="border-t pt-4">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  <h4 className="font-semibold">Eventos Recentes</h4>
                </div>
                <div className="space-y-2 max-h-[250px] overflow-y-auto">
                  {events.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Nenhum evento registrado ainda
                    </p>
                  ) : (
                    events.map((event) => (
                      <Card key={event.id} className="p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-sm">{event.event_name}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(event.created_at).toLocaleString('pt-BR')}
                            </p>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {Object.keys(event.event_data).length} dados
                          </Badge>
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground h-full">
              Selecione um pixel para ver os detalhes
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
