import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Globe, Copy, Trash2, Link2, Settings, BarChart3, Loader2, ExternalLink, MousePointerClick } from "lucide-react";

interface ClonedPage {
  id: string;
  original_url: string;
  cloned_url: string;
  page_content: string | null;
  custom_settings: any;
  custom_domain: string | null;
  slug: string | null;
  clicks: number;
  is_active: boolean;
  created_at: string;
}

export const PageCloner = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [clonedPages, setClonedPages] = useState<ClonedPage[]>([]);
  const [isCloneDialogOpen, setIsCloneDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedPage, setSelectedPage] = useState<ClonedPage | null>(null);
  const [isCloning, setIsCloning] = useState(false);
  const [cloneData, setCloneData] = useState({
    original_url: "",
    custom_slug: "",
    custom_domain: ""
  });
  const [editSettings, setEditSettings] = useState({
    custom_links: [] as { selector: string; newUrl: string }[],
    detected_checkout_links: [] as { originalUrl: string; text: string; replaced?: boolean; newUrl?: string }[],
    custom_domain: "",
    tracking_pixels: "",
    whatsapp_button: {
      enabled: false,
      phone: "",
      message: "",
      position: "bottom-right"
    },
    header_code: "",
    footer_code: "",
    utm_params: {
      utm_source: "",
      utm_medium: "",
      utm_campaign: "",
      utm_term: "",
      utm_content: ""
    }
  });
  const [totalClicks, setTotalClicks] = useState(0);

  useEffect(() => {
    if (user) {
      fetchClonedPages();
    }
  }, [user]);

  const fetchClonedPages = async () => {
    const { data, error } = await supabase
      .from('cloned_pages')
      .select('*')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setClonedPages(data);
      setTotalClicks(data.reduce((sum, page) => sum + (page.clicks || 0), 0));
    }
  };

  const handleClonePage = async () => {
    if (!cloneData.original_url) {
      toast({
        title: "Erro",
        description: "URL é obrigatória",
        variant: "destructive"
      });
      return;
    }

    setIsCloning(true);

    try {
      // Call edge function to fetch and clone the page
      const { data: cloneResult, error: cloneError } = await supabase.functions.invoke('clone-page', {
        body: { url: cloneData.original_url }
      });

      if (cloneError) throw cloneError;
      if (!cloneResult.success) throw new Error(cloneResult.error);

      // Generate slug
      const slug = cloneData.custom_slug 
        ? cloneData.custom_slug.toLowerCase().replace(/[^a-z0-9-]/g, '-')
        : `clone-${Math.random().toString(36).substring(2, 10)}`;

      const baseUrl = window.location.origin;
      const clonedUrl = cloneData.custom_domain 
        ? `https://${cloneData.custom_domain}/page/${slug}`
        : `${baseUrl}/page/${slug}`;

      // Detect checkout links
      const detectedLinks = detectCheckoutLinks(cloneResult.content);

      // Save to database
      const { data, error } = await supabase
        .from('cloned_pages')
        .insert({
          user_id: user!.id,
          original_url: cloneData.original_url,
          cloned_url: clonedUrl,
          slug: slug,
          custom_domain: cloneData.custom_domain || null,
          page_content: cloneResult.content,
          custom_settings: { detected_checkout_links: detectedLinks },
          is_active: true,
          clicks: 0
        })
        .select()
        .single();

      if (error) throw error;

      toast({ 
        title: "Página clonada com sucesso!",
        description: "Você pode configurar pixels, links e mais nas configurações." 
      });
      
      await fetchClonedPages();
      setCloneData({ original_url: "", custom_slug: "", custom_domain: "" });
      setIsCloneDialogOpen(false);
    } catch (error: any) {
      console.error('Clone error:', error);
      toast({
        title: "Erro ao clonar página",
        description: error.message || "Verifique a URL e tente novamente",
        variant: "destructive"
      });
    } finally {
      setIsCloning(false);
    }
  };

  const handleUpdateSettings = async () => {
    if (!selectedPage) return;

    const { error } = await supabase
      .from('cloned_pages')
      .update({
        custom_settings: editSettings,
        custom_domain: editSettings.custom_domain || null,
      })
      .eq('id', selectedPage.id);

    if (error) {
      toast({
        title: "Erro ao atualizar",
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({ title: "Configurações atualizadas com sucesso!" });
      await fetchClonedPages();
      setIsEditDialogOpen(false);
    }
  };

  const handleDelete = async (pageId: string) => {
    const { error } = await supabase
      .from('cloned_pages')
      .delete()
      .eq('id', pageId);

    if (error) {
      toast({
        title: "Erro ao excluir",
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({ title: "Página excluída com sucesso!" });
      setClonedPages(clonedPages.filter(p => p.id !== pageId));
    }
  };

  const copyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    toast({ title: "Link copiado!" });
  };

  const addCustomLink = () => {
    setEditSettings({
      ...editSettings,
      custom_links: [...editSettings.custom_links, { selector: "", newUrl: "" }]
    });
  };

  const removeCustomLink = (index: number) => {
    setEditSettings({
      ...editSettings,
      custom_links: editSettings.custom_links.filter((_, i) => i !== index)
    });
  };

  const detectCheckoutLinks = (html: string) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const links: { originalUrl: string; text: string; replaced?: boolean; newUrl?: string }[] = [];
    
    const checkoutKeywords = ['checkout', 'comprar', 'buy', 'cart', 'carrinho', 'pagamento', 'payment', 'finalizar', 'pedido', 'order'];
    
    doc.querySelectorAll('a[href]').forEach((link) => {
      const href = link.getAttribute('href') || '';
      const text = link.textContent?.trim() || '';
      const fullUrl = href.startsWith('http') ? href : '';
      
      if (fullUrl) {
        const matchesKeyword = checkoutKeywords.some(keyword => 
          href.toLowerCase().includes(keyword) || text.toLowerCase().includes(keyword)
        );
        
        if (matchesKeyword) {
          links.push({ originalUrl: fullUrl, text, replaced: false });
        }
      }
    });
    
    return links;
  };

  const openEditDialog = (page: ClonedPage) => {
    setSelectedPage(page);
    const settings = page.custom_settings || {};
    setEditSettings({
      custom_links: settings.custom_links || [],
      detected_checkout_links: settings.detected_checkout_links || [],
      custom_domain: page.custom_domain || "",
      tracking_pixels: settings.tracking_pixels || "",
      whatsapp_button: settings.whatsapp_button || {
        enabled: false,
        phone: "",
        message: "",
        position: "bottom-right"
      },
      header_code: settings.header_code || "",
      footer_code: settings.footer_code || "",
      utm_params: settings.utm_params || {
        utm_source: "",
        utm_medium: "",
        utm_campaign: "",
        utm_term: "",
        utm_content: ""
      }
    });
    setIsEditDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Clonador de Páginas Profissional</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Clone landing pages e personalize links, pixels e códigos
          </p>
        </div>
        <Dialog open={isCloneDialogOpen} onOpenChange={setIsCloneDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-primary">
              <Globe className="w-4 h-4 mr-2" />
              Clonar Nova Página
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Clonar Nova Página</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>URL da Página Original *</Label>
                <Input
                  value={cloneData.original_url}
                  onChange={(e) => setCloneData({ ...cloneData, original_url: e.target.value })}
                  placeholder="https://exemplo.com/landing-page"
                  disabled={isCloning}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Cole a URL completa da página que deseja clonar
                </p>
              </div>
              <div>
                <Label>Slug Personalizada (Opcional)</Label>
                <Input
                  value={cloneData.custom_slug}
                  onChange={(e) => setCloneData({ ...cloneData, custom_slug: e.target.value })}
                  placeholder="minha-pagina"
                  disabled={isCloning}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Deixe vazio para gerar automaticamente
                </p>
              </div>
              <div>
                <Label>Domínio Personalizado (Opcional)</Label>
                <Input
                  value={cloneData.custom_domain}
                  onChange={(e) => setCloneData({ ...cloneData, custom_domain: e.target.value })}
                  placeholder="meudominio.com"
                  disabled={isCloning}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Configure seu domínio nas configurações de DNS
                </p>
              </div>
              <Button 
                onClick={handleClonePage} 
                className="w-full gradient-primary"
                disabled={isCloning}
              >
                {isCloning ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Clonando...
                  </>
                ) : (
                  "Clonar Página"
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-3 rounded-xl">
              <Globe className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="text-2xl font-bold">{clonedPages.length}</h3>
              <p className="text-sm text-muted-foreground">Páginas Clonadas</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="bg-success/10 p-3 rounded-xl">
              <BarChart3 className="w-6 h-6 text-success" />
            </div>
            <div>
              <h3 className="text-2xl font-bold">
                {clonedPages.filter(p => p.is_active).length}
              </h3>
              <p className="text-sm text-muted-foreground">Páginas Ativas</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="bg-warning/10 p-3 rounded-xl">
              <MousePointerClick className="w-6 h-6 text-warning" />
            </div>
            <div>
              <h3 className="text-2xl font-bold">{totalClicks}</h3>
              <p className="text-sm text-muted-foreground">Total de Clicks</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Cloned Pages List */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Minhas Páginas Clonadas</h3>
        <div className="space-y-3">
          {clonedPages.length === 0 ? (
            <div className="text-center py-12">
              <div className="bg-primary/10 p-6 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <Globe className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Nenhuma página clonada ainda</h3>
              <p className="text-muted-foreground mb-6">
                Comece clonando sua primeira landing page
              </p>
            </div>
          ) : (
            clonedPages.map((page) => (
              <Card key={page.id} className="p-4 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <Globe className="w-4 h-4 text-primary flex-shrink-0" />
                      <h4 className="font-semibold">Página Clonada</h4>
                      <Badge variant={page.is_active ? 'default' : 'secondary'}>
                        {page.is_active ? 'Ativa' : 'Inativa'}
                      </Badge>
                      {page.custom_domain && (
                        <Badge variant="outline" className="gap-1">
                          <Globe className="w-3 h-3" />
                          {page.custom_domain}
                        </Badge>
                      )}
                      <Badge variant="secondary" className="gap-1">
                        <MousePointerClick className="w-3 h-3" />
                        {page.clicks || 0} clicks
                      </Badge>
                      {page.custom_settings?.detected_checkout_links?.length > 0 && (
                        <Badge variant="outline" className="gap-1 bg-success/10 text-success border-success/20">
                          <Link2 className="w-3 h-3" />
                          {page.custom_settings.detected_checkout_links.length} checkout{page.custom_settings.detected_checkout_links.length > 1 ? 's' : ''}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-1 break-all">
                      <strong>Original:</strong> {page.original_url}
                    </p>
                    <div className="flex items-center gap-2 mb-2">
                      <p className="text-sm text-primary break-all flex-1">
                        <strong>Clone:</strong> {page.cloned_url}
                      </p>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => window.open(page.cloned_url, '_blank')}
                        title="Abrir página"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Criado em: {new Date(page.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyLink(page.cloned_url)}
                      title="Copiar link"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openEditDialog(page)}
                      title="Configurar"
                    >
                      <Settings className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(page.id)}
                      className="text-destructive hover:text-destructive"
                      title="Excluir"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </Card>

      {/* Edit Settings Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Configurar Página Clonada</DialogTitle>
          </DialogHeader>
          <Tabs defaultValue="domain" className="w-full mt-4">
            <TabsList className="grid w-full grid-cols-7">
              <TabsTrigger value="domain">Domínio</TabsTrigger>
              <TabsTrigger value="checkout">Checkout</TabsTrigger>
              <TabsTrigger value="links">Links</TabsTrigger>
              <TabsTrigger value="utm">UTM</TabsTrigger>
              <TabsTrigger value="pixels">Pixels</TabsTrigger>
              <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
              <TabsTrigger value="code">Código</TabsTrigger>
            </TabsList>

            <TabsContent value="domain" className="space-y-4">
              <div>
                <Label>Domínio Personalizado</Label>
                <Input
                  value={editSettings.custom_domain}
                  onChange={(e) => setEditSettings({ ...editSettings, custom_domain: e.target.value })}
                  placeholder="meudominio.com"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Configure os registros DNS do seu domínio para apontar para este site
                </p>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-semibold mb-2">Como configurar:</h4>
                <ol className="text-sm space-y-2 list-decimal list-inside text-muted-foreground">
                  <li>Acesse o painel do seu provedor de domínio</li>
                  <li>Adicione um registro A apontando para o IP do servidor</li>
                  <li>Ou adicione um CNAME apontando para {window.location.host}</li>
                  <li>Aguarde a propagação DNS (pode levar até 48h)</li>
                </ol>
              </div>
            </TabsContent>

            <TabsContent value="checkout" className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold">Links de Checkout Detectados</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      Links identificados automaticamente que parecem ser de checkout/pagamento
                    </p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  {editSettings.detected_checkout_links.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      Nenhum link de checkout detectado nesta página
                    </p>
                  ) : (
                    editSettings.detected_checkout_links.map((link, index) => (
                      <Card key={index} className="p-4">
                        <div className="space-y-3">
                          <div>
                            <Label className="text-xs font-semibold">Link Original</Label>
                            <div className="flex items-center gap-2 mt-1">
                              <Input
                                value={link.originalUrl}
                                readOnly
                                className="flex-1 text-xs bg-muted"
                              />
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => window.open(link.originalUrl, '_blank')}
                              >
                                <ExternalLink className="w-4 h-4" />
                              </Button>
                            </div>
                            {link.text && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Texto do botão: "{link.text}"
                              </p>
                            )}
                          </div>
                          
                          <div>
                            <Label className="text-xs">Seu Link de Afiliado</Label>
                            <div className="flex gap-2">
                              <Input
                                placeholder="Cole seu link de afiliado aqui"
                                value={link.newUrl || ''}
                                onChange={(e) => {
                                  const newLinks = [...editSettings.detected_checkout_links];
                                  newLinks[index] = { 
                                    ...newLinks[index], 
                                    newUrl: e.target.value,
                                    replaced: !!e.target.value 
                                  };
                                  setEditSettings({ ...editSettings, detected_checkout_links: newLinks });
                                }}
                                className="text-xs"
                              />
                              {link.newUrl && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    const newLinks = [...editSettings.detected_checkout_links];
                                    newLinks[index] = { 
                                      ...newLinks[index], 
                                      newUrl: '',
                                      replaced: false 
                                    };
                                    setEditSettings({ ...editSettings, detected_checkout_links: newLinks });
                                  }}
                                  className="text-destructive"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                            {link.replaced && link.newUrl && (
                              <p className="text-xs text-success mt-1 flex items-center gap-1">
                                ✓ Link de afiliado configurado
                              </p>
                            )}
                          </div>
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="links" className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Links Personalizados</Label>
                  <Button size="sm" variant="outline" onClick={addCustomLink}>
                    + Adicionar Link
                  </Button>
                </div>
                {editSettings.custom_links.map((link, index) => (
                  <div key={index} className="flex gap-2 items-end">
                    <div className="flex-1">
                      <Label className="text-xs">Seletor CSS</Label>
                      <Input
                        placeholder="a.btn-primary"
                        value={link.selector}
                        onChange={(e) => {
                          const newLinks = [...editSettings.custom_links];
                          newLinks[index].selector = e.target.value;
                          setEditSettings({ ...editSettings, custom_links: newLinks });
                        }}
                      />
                    </div>
                    <div className="flex-1">
                      <Label className="text-xs">Nova URL</Label>
                      <Input
                        placeholder="https://seulink.com"
                        value={link.newUrl}
                        onChange={(e) => {
                          const newLinks = [...editSettings.custom_links];
                          newLinks[index].newUrl = e.target.value;
                          setEditSettings({ ...editSettings, custom_links: newLinks });
                        }}
                      />
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeCustomLink(index)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                {editSettings.custom_links.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhum link personalizado configurado
                  </p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="utm" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label>UTM Source</Label>
                  <Input
                    value={editSettings.utm_params.utm_source}
                    onChange={(e) => setEditSettings({
                      ...editSettings,
                      utm_params: { ...editSettings.utm_params, utm_source: e.target.value }
                    })}
                    placeholder="facebook, google, instagram..."
                  />
                </div>
                <div>
                  <Label>UTM Medium</Label>
                  <Input
                    value={editSettings.utm_params.utm_medium}
                    onChange={(e) => setEditSettings({
                      ...editSettings,
                      utm_params: { ...editSettings.utm_params, utm_medium: e.target.value }
                    })}
                    placeholder="cpc, banner, email..."
                  />
                </div>
                <div>
                  <Label>UTM Campaign</Label>
                  <Input
                    value={editSettings.utm_params.utm_campaign}
                    onChange={(e) => setEditSettings({
                      ...editSettings,
                      utm_params: { ...editSettings.utm_params, utm_campaign: e.target.value }
                    })}
                    placeholder="black-friday, lancamento..."
                  />
                </div>
                <div>
                  <Label>UTM Term</Label>
                  <Input
                    value={editSettings.utm_params.utm_term}
                    onChange={(e) => setEditSettings({
                      ...editSettings,
                      utm_params: { ...editSettings.utm_params, utm_term: e.target.value }
                    })}
                    placeholder="palavra-chave..."
                  />
                </div>
                <div>
                  <Label>UTM Content</Label>
                  <Input
                    value={editSettings.utm_params.utm_content}
                    onChange={(e) => setEditSettings({
                      ...editSettings,
                      utm_params: { ...editSettings.utm_params, utm_content: e.target.value }
                    })}
                    placeholder="variacao-a, banner-top..."
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="pixels" className="space-y-4">
              <div>
                <Label>Pixels e Tags de Conversão</Label>
                <Textarea
                  value={editSettings.tracking_pixels}
                  onChange={(e) => setEditSettings({ ...editSettings, tracking_pixels: e.target.value })}
                  placeholder="Cole aqui os códigos de pixel do Facebook, Google Ads, TikTok, etc."
                  rows={8}
                  className="font-mono text-xs"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Adicione pixels do Facebook, Google Ads, TikTok e outras plataformas
                </p>
              </div>
            </TabsContent>

            <TabsContent value="whatsapp" className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="whatsapp-enabled"
                    checked={editSettings.whatsapp_button.enabled}
                    onChange={(e) => setEditSettings({
                      ...editSettings,
                      whatsapp_button: { ...editSettings.whatsapp_button, enabled: e.target.checked }
                    })}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="whatsapp-enabled">Ativar Botão de WhatsApp</Label>
                </div>
                <div>
                  <Label>Número do WhatsApp</Label>
                  <Input
                    value={editSettings.whatsapp_button.phone}
                    onChange={(e) => setEditSettings({
                      ...editSettings,
                      whatsapp_button: { ...editSettings.whatsapp_button, phone: e.target.value }
                    })}
                    placeholder="5511999999999"
                  />
                </div>
                <div>
                  <Label>Mensagem Padrão</Label>
                  <Textarea
                    value={editSettings.whatsapp_button.message}
                    onChange={(e) => setEditSettings({
                      ...editSettings,
                      whatsapp_button: { ...editSettings.whatsapp_button, message: e.target.value }
                    })}
                    placeholder="Olá, vim através do site..."
                    rows={3}
                  />
                </div>
                <div>
                  <Label>Posição do Botão</Label>
                  <select
                    value={editSettings.whatsapp_button.position}
                    onChange={(e) => setEditSettings({
                      ...editSettings,
                      whatsapp_button: { ...editSettings.whatsapp_button, position: e.target.value }
                    })}
                    className="w-full border rounded-md p-2"
                  >
                    <option value="bottom-right">Inferior Direito</option>
                    <option value="bottom-left">Inferior Esquerdo</option>
                    <option value="top-right">Superior Direito</option>
                    <option value="top-left">Superior Esquerdo</option>
                  </select>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="code" className="space-y-4">
              <div>
                <Label>Código no Header</Label>
                <Textarea
                  value={editSettings.header_code}
                  onChange={(e) => setEditSettings({ ...editSettings, header_code: e.target.value })}
                  placeholder="<script>...</script> ou qualquer outro código HTML"
                  rows={8}
                  className="font-mono text-xs"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Será inserido no &lt;head&gt; da página
                </p>
              </div>
              <div>
                <Label>Código no Footer</Label>
                <Textarea
                  value={editSettings.footer_code}
                  onChange={(e) => setEditSettings({ ...editSettings, footer_code: e.target.value })}
                  placeholder="<script>...</script> ou qualquer outro código HTML"
                  rows={8}
                  className="font-mono text-xs"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Será inserido antes do &lt;/body&gt;
                </p>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex gap-2 mt-4">
            <Button onClick={handleUpdateSettings} className="flex-1 gradient-primary">
              Salvar Configurações
            </Button>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};