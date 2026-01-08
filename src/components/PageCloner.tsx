import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Globe, Copy, Trash2, Link2, Settings, BarChart3, Loader2, ExternalLink, MousePointerClick, Plus, Users, FileText, Code, Pencil, ShoppingCart, Clock, Mail, FileCode } from "lucide-react";
import { AnalyticsPanel } from "./cloner/AnalyticsPanel";
import { LeadsManager } from "./cloner/LeadsManager";

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

// Páginas disponíveis para clonagem
const AVAILABLE_PAGE_PATHS = [
  "page1",
  "page2",
  "page3",
  "page4",
  "page5"
];

interface TeamContext {
  adminUserId: string;
  allowedIds: string[];
}

interface PageClonerProps {
  teamContext?: TeamContext;
}

export const PageCloner = ({ teamContext }: PageClonerProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [clonedPages, setClonedPages] = useState<ClonedPage[]>([]);
  const [isCloneDialogOpen, setIsCloneDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAnalyticsDialogOpen, setIsAnalyticsDialogOpen] = useState(false);
  const [isLeadsDialogOpen, setIsLeadsDialogOpen] = useState(false);
  const [isEmbedDialogOpen, setIsEmbedDialogOpen] = useState(false);
  const [selectedPage, setSelectedPage] = useState<ClonedPage | null>(null);
  const [embedSettings, setEmbedSettings] = useState({
    width: "100%",
    height: "800",
    scrolling: "yes",
    border: false
  });
  const [isCloning, setIsCloning] = useState(false);
  const [cloneData, setCloneData] = useState({
    original_url: "",
    custom_slug: "",
    selected_page_path: ""
  });
  const [editSettings, setEditSettings] = useState({
    detected_checkout_links: [] as { originalUrl: string; text: string; replaced?: boolean; newUrl?: string }[],
    tracking_pixels: "",
    traffic_tracking_link: "",
    whatsapp_button: {
      enabled: false,
      phone: "",
      message: "",
      position: "bottom-right"
    },
    countdown_timer: {
      enabled: false,
      end_date: "",
      message: "Oferta Termina Em:",
      expired_message: "Oferta Encerrada!",
      position: "top"
    },
    exit_intent: {
      enabled: false,
      title: "Não Vá Embora!",
      message: "Aproveite esta oferta antes de sair",
      button_text: "Ver Oferta",
      button_link: ""
    },
    social_proof: {
      enabled: false,
      notifications: [] as Array<{ message: string; delay: number }>
    },
    lead_capture: {
      enabled: false,
      trigger: "exit_intent", // 'exit_intent', 'time_delay', 'scroll'
      trigger_value: 5, // segundos ou %
      title: "Receba Acesso Exclusivo",
      description: "Preencha os dados abaixo",
      fields: ["name", "email"],
      button_text: "Enviar",
      success_message: "Obrigado! Redirecionando..."
    },
    content_editor: {
      enabled: false,
      text_replacements: [] as Array<{ selector: string; newText: string }>
    },
    header_code: "",
    footer_code: ""
  });
  const [totalClicks, setTotalClicks] = useState(0);

  // Helper to get the correct user ID (admin's ID when team member)
  const getTargetUserId = (): string | null => {
    if (teamContext?.adminUserId) {
      return teamContext.adminUserId;
    }
    return user?.id || null;
  };

  useEffect(() => {
    const targetUserId = getTargetUserId();
    if (targetUserId) {
      fetchClonedPages();
    }
  }, [user, teamContext]);

  const fetchClonedPages = async () => {
    const targetUserId = getTargetUserId();
    if (!targetUserId) return;

    let query = supabase
      .from('cloned_pages')
      .select('*')
      .eq('user_id', targetUserId)
      .order('created_at', { ascending: false });

    // If team member with restrictions, filter by allowed page IDs
    if (teamContext?.allowedIds && teamContext.allowedIds.length > 0) {
      query = query.in('id', teamContext.allowedIds);
    }

    const { data, error } = await query;

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
      // Normalizar URL (adiciona https:// se o usuário não incluir)
      const originalUrl = /^https?:\/\//i.test(cloneData.original_url)
        ? cloneData.original_url
        : `https://${cloneData.original_url}`;

      // Call edge function to fetch and clone the page
      const { data: cloneResult, error: cloneError } = await supabase.functions.invoke('clone-page', {
        body: { url: originalUrl }
      });

      if (cloneError) throw cloneError;
      if (!cloneResult?.success) throw new Error(cloneResult?.error || 'Erro ao clonar página');

      // Generate slug - permite letras, números e hífens
      const slug = cloneData.custom_slug 
        ? cloneData.custom_slug.toLowerCase().replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-').replace(/^-|-$/g, '')
        : `clone-${Math.random().toString(36).substring(2, 10)}`;

      // Validar se um domínio foi selecionado
      if (!cloneData.selected_page_path) {
        throw new Error('Selecione um domínio ou página para clonar');
      }

      const selectedDomain = cloneData.selected_page_path;
      
      // Se for domínio personalizado (contém ponto), adiciona https://
      // Se for page path (page1, page2, etc), usa o domínio atual
      const isCustomDomain = selectedDomain.includes('.');
      const clonedUrl = isCustomDomain 
        ? `https://${selectedDomain}/${slug}`
        : `${window.location.origin}/${selectedDomain}/${slug}`;

      // Detect checkout links
      const detectedLinks = detectCheckoutLinks(cloneResult.content);

      const targetUserId = getTargetUserId();
      if (!targetUserId) throw new Error('Usuário não autenticado');

      // Save to database
      const { data, error } = await supabase
        .from('cloned_pages')
        .insert({
          user_id: targetUserId,
          original_url: cloneData.original_url,
          cloned_url: clonedUrl,
          slug: slug,
          custom_domain: selectedDomain,
          page_content: cloneResult.content,
          custom_settings: { detected_checkout_links: detectedLinks },
          is_active: true,
          clicks: 0
        })
        .select()
        .maybeSingle();

      if (error) throw error;

      toast({ 
        title: "Página clonada com sucesso!",
        description: "Você pode configurar pixels, links e mais nas configurações." 
      });
      
      await fetchClonedPages();
      setCloneData({ original_url: "", custom_slug: "", selected_page_path: "" });
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

    const replacedCount = editSettings.detected_checkout_links.filter(l => l.replaced).length;

    const { error } = await supabase
      .from('cloned_pages')
      .update({
        custom_settings: editSettings
      })
      .eq('id', selectedPage.id);

    if (error) {
      toast({
        title: "Erro ao atualizar",
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({ 
        title: "✅ Configurações salvas!",
        description: `${replacedCount} link(s) de checkout configurados. Abra sua página para ver as mudanças.`
      });
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

  const handleDuplicatePage = async (page: ClonedPage) => {
    try {
      const slug = `${page.slug}-copia-${Math.random().toString(36).substring(2, 6)}`;
      
      // Se for domínio personalizado, adiciona https://
      const isCustomDomain = page.custom_domain?.includes('.');
      const clonedUrl = isCustomDomain 
        ? `https://${page.custom_domain}/${slug}`
        : `${window.location.origin}/${page.custom_domain}/${slug}`;

      const targetUserId = getTargetUserId();
      if (!targetUserId) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('cloned_pages')
        .insert({
          user_id: targetUserId,
          original_url: page.original_url,
          cloned_url: clonedUrl,
          slug: slug,
          custom_domain: page.custom_domain,
          page_content: page.page_content,
          custom_settings: page.custom_settings,
          is_active: true,
          clicks: 0
        })
        .select()
        .maybeSingle();

      if (error) throw error;

      toast({ 
        title: "Página duplicada!",
        description: "Configurações copiadas com sucesso" 
      });
      
      await fetchClonedPages();
    } catch (error: any) {
      toast({
        title: "Erro ao duplicar",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const copyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    toast({ title: "Link copiado!" });
  };

  const detectCheckoutLinks = (html: string) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const links: { originalUrl: string; text: string; replaced?: boolean; newUrl?: string }[] = [];
    
    const checkoutKeywords = [
      'checkout', 'comprar', 'buy', 'cart', 'carrinho', 'pagamento', 'payment', 'finalizar', 'pedido', 'order',
      'hotmart', 'euvicash', 'wikipédia', 'projetos afiliado', 'monetizze', 'empreender lucrativo',
      'eduzz', 'braip', 'grana inteligente', 'kiwify', 'amazon afiliados', 'programa de afiliados da amazon',
      'lomadee', 'afilio', 'actionpay', 'parceiro magalu', 'magalu divulgador', 'legião visionária',
      'shopee afiliados', 'perfect pay', 'perfectpay'
    ];
    
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
      detected_checkout_links: settings.detected_checkout_links || [],
      tracking_pixels: settings.tracking_pixels || "",
      traffic_tracking_link: settings.traffic_tracking_link || "",
      whatsapp_button: settings.whatsapp_button || {
        enabled: false,
        phone: "",
        message: "",
        position: "bottom-right"
      },
      countdown_timer: settings.countdown_timer || {
        enabled: false,
        end_date: "",
        message: "Oferta Termina Em:",
        expired_message: "Oferta Encerrada!",
        position: "top"
      },
      exit_intent: settings.exit_intent || {
        enabled: false,
        title: "Não Vá Embora!",
        message: "Aproveite esta oferta antes de sair",
        button_text: "Ver Oferta",
        button_link: ""
      },
      social_proof: settings.social_proof || {
        enabled: false,
        notifications: []
      },
      lead_capture: settings.lead_capture || {
        enabled: false,
        trigger: "exit_intent",
        trigger_value: 5,
        title: "Receba Acesso Exclusivo",
        description: "Preencha os dados abaixo",
        fields: ["name", "email"],
        button_text: "Enviar",
        success_message: "Obrigado! Redirecionando..."
      },
      content_editor: settings.content_editor || {
        enabled: false,
        text_replacements: []
      },
      header_code: settings.header_code || "",
      footer_code: settings.footer_code || ""
    });
    setIsEditDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold">Clonador de Páginas Profissional</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Clone landing pages e personalize links, pixels e códigos
          </p>
        </div>
        <div className="flex gap-2">
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
                  <Label>Selecione a Página *</Label>
                  <Select
                    value={cloneData.selected_page_path}
                    onValueChange={(value) => setCloneData({ ...cloneData, selected_page_path: value })}
                    disabled={isCloning}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Escolha uma página" />
                    </SelectTrigger>
                    <SelectContent>
                      {AVAILABLE_PAGE_PATHS.map((pagePath) => (
                        <SelectItem key={pagePath} value={pagePath}>
                          {window.location.host}/{pagePath}/sua-slug
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    Selecione qual página usar para clonar
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
                    URL final: {`${window.location.host}/${cloneData.selected_page_path || 'page1'}/${cloneData.custom_slug || 'sua-slug'}`}
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
                        <strong>Link:</strong> {page.cloned_url}
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
                  <div className="flex gap-2 flex-shrink-0 flex-wrap">
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
                      onClick={() => {
                        setSelectedPage(page);
                        setIsAnalyticsDialogOpen(true);
                      }}
                      title="Ver Analytics"
                    >
                      <BarChart3 className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedPage(page);
                        setIsLeadsDialogOpen(true);
                      }}
                      title="Ver Leads"
                    >
                      <Users className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDuplicatePage(page)}
                      title="Duplicar Página"
                    >
                      <FileText className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedPage(page);
                        setIsEmbedDialogOpen(true);
                      }}
                      title="Código de Incorporação"
                    >
                      <Code className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => navigate(`/page-editor/${page.id}`)}
                      title="Editar Página"
                      className="gradient-primary"
                    >
                      <Pencil className="w-4 h-4 mr-1" />
                      Editar
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
          <Tabs defaultValue="checkout" className="w-full mt-4">
            <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8 gap-2 h-auto p-2">
              <TabsTrigger value="checkout" className="flex flex-col items-center gap-1 py-2 px-1 h-auto">
                <ShoppingCart className="w-4 h-4" />
                <span className="text-[10px]">Checkout</span>
              </TabsTrigger>
              <TabsTrigger value="links" className="flex flex-col items-center gap-1 py-2 px-1 h-auto">
                <Link2 className="w-4 h-4" />
                <span className="text-[10px]">Links</span>
              </TabsTrigger>
              <TabsTrigger value="timer" className="flex flex-col items-center gap-1 py-2 px-1 h-auto">
                <Clock className="w-4 h-4" />
                <span className="text-[10px]">Timer</span>
              </TabsTrigger>
              <TabsTrigger value="exit" className="flex flex-col items-center gap-1 py-2 px-1 h-auto">
                <MousePointerClick className="w-4 h-4" />
                <span className="text-[10px]">Exit Intent</span>
              </TabsTrigger>
              <TabsTrigger value="social" className="flex flex-col items-center gap-1 py-2 px-1 h-auto">
                <Users className="w-4 h-4" />
                <span className="text-[10px]">Prova Social</span>
              </TabsTrigger>
              <TabsTrigger value="leads" className="flex flex-col items-center gap-1 py-2 px-1 h-auto">
                <Mail className="w-4 h-4" />
                <span className="text-[10px]">Leads</span>
              </TabsTrigger>
              <TabsTrigger value="pixels" className="flex flex-col items-center gap-1 py-2 px-1 h-auto">
                <Code className="w-4 h-4" />
                <span className="text-[10px]">Pixels</span>
              </TabsTrigger>
              <TabsTrigger value="code" className="flex flex-col items-center gap-1 py-2 px-1 h-auto">
                <FileCode className="w-4 h-4" />
                <span className="text-[10px]">Head/Footer</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="checkout" className="space-y-4">
              <div className="space-y-4">
                <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
                  <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">💡 Como modificar links</h4>
                  <ol className="text-xs text-blue-800 dark:text-blue-200 space-y-1 list-decimal list-inside">
                    <li>Cole seu link de afiliado no campo abaixo de cada link original</li>
                    <li>Clique em "Salvar Configurações" no final da página</li>
                    <li>Abra sua página clonada para ver as mudanças</li>
                  </ol>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold">Links de Checkout Detectados</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      {editSettings.detected_checkout_links.length} link(s) detectado(s) • {editSettings.detected_checkout_links.filter(l => l.replaced).length} configurado(s)
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      if (selectedPage?.page_content) {
                        const newLinks = detectCheckoutLinks(selectedPage.page_content);
                        setEditSettings({
                          ...editSettings,
                          detected_checkout_links: newLinks
                        });
                        toast({ title: "Links re-escaneados com sucesso!" });
                      }
                    }}
                  >
                    <Link2 className="w-4 h-4 mr-2" />
                    Re-escanear
                  </Button>
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
                             <Label className="text-xs font-semibold">
                               Seu Link de Afiliado {link.replaced && '✓'}
                             </Label>
                             <div className="flex gap-2">
                               <Input
                                 placeholder="https://seu-link-de-afiliado.com"
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
                                 className={`text-xs ${link.newUrl ? 'border-success' : ''}`}
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
                {/* Link Marca Tráfego */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border-2 border-green-500 dark:border-green-600 rounded-lg p-4 shadow-sm">
                  <h4 className="font-bold text-green-900 dark:text-green-100 mb-2 flex items-center gap-2">
                    💰 Link Marca Tráfego (Página de Vendas Backup)
                  </h4>
                  <p className="text-sm text-green-800 dark:text-green-200 mb-3 font-medium">
                    <strong>IMPORTANTE:</strong> Configure o link da sua página de vendas/checkout aqui. 
                    Se o visitante tentar sair da página clonada, ele será redirecionado para este link automaticamente.
                  </p>
                  <div className="bg-white/70 dark:bg-black/30 rounded p-3 mb-3">
                    <p className="text-xs text-green-900 dark:text-green-100">
                      🎯 <strong>Para que serve?</strong><br/>
                      Evita que você perca vendas! Quando alguém clica para sair da página clonada, 
                      ao invés de ir para o site original, vai direto para o seu link de afiliado/vendas.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="traffic-link" className="text-sm font-semibold text-green-900 dark:text-green-100">
                      Link da Página de Vendas / Link de Afiliado
                    </Label>
                    <Input
                      id="traffic-link"
                      placeholder="https://go.hotmart.com/seu-link-afiliado ou https://seu-checkout.com"
                      value={editSettings.traffic_tracking_link || ''}
                      onChange={(e) => setEditSettings({
                        ...editSettings,
                        traffic_tracking_link: e.target.value
                      })}
                      className="font-mono text-xs border-green-300 dark:border-green-700"
                    />
                    <p className="text-xs text-green-700 dark:text-green-300">
                      ✅ Cole aqui o link de afiliado do Hotmart, Eduzz, Monetizze, Kiwify ou seu checkout próprio
                    </p>
                  </div>
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


            {/* Timer/Countdown Tab */}
            <TabsContent value="timer" className="space-y-4">
              <div className="flex items-center gap-2">
                <Switch
                  checked={editSettings.countdown_timer.enabled}
                  onCheckedChange={(checked) => setEditSettings({
                    ...editSettings,
                    countdown_timer: { ...editSettings.countdown_timer, enabled: checked }
                  })}
                />
                <Label>Ativar Timer/Countdown</Label>
              </div>
              
              {editSettings.countdown_timer.enabled && (
                <>
                  <div>
                    <Label>Data Final da Oferta</Label>
                    <Input
                      type="datetime-local"
                      value={editSettings.countdown_timer.end_date}
                      onChange={(e) => setEditSettings({
                        ...editSettings,
                        countdown_timer: { ...editSettings.countdown_timer, end_date: e.target.value }
                      })}
                    />
                  </div>
                  <div>
                    <Label>Mensagem do Timer</Label>
                    <Input
                      value={editSettings.countdown_timer.message}
                      onChange={(e) => setEditSettings({
                        ...editSettings,
                        countdown_timer: { ...editSettings.countdown_timer, message: e.target.value }
                      })}
                      placeholder="Oferta Termina Em:"
                    />
                  </div>
                  <div>
                    <Label>Mensagem Após Expirar</Label>
                    <Input
                      value={editSettings.countdown_timer.expired_message}
                      onChange={(e) => setEditSettings({
                        ...editSettings,
                        countdown_timer: { ...editSettings.countdown_timer, expired_message: e.target.value }
                      })}
                      placeholder="Oferta Encerrada!"
                    />
                  </div>
                  <div>
                    <Label>Posição</Label>
                    <Select
                      value={editSettings.countdown_timer.position}
                      onValueChange={(value) => setEditSettings({
                        ...editSettings,
                        countdown_timer: { ...editSettings.countdown_timer, position: value }
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="top">Topo</SelectItem>
                        <SelectItem value="bottom">Rodapé</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
            </TabsContent>

            {/* Exit Intent Tab */}
            <TabsContent value="exit" className="space-y-4">
              <div className="flex items-center gap-2">
                <Switch
                  checked={editSettings.exit_intent.enabled}
                  onCheckedChange={(checked) => setEditSettings({
                    ...editSettings,
                    exit_intent: { ...editSettings.exit_intent, enabled: checked }
                  })}
                />
                <Label>Ativar Exit Intent Popup</Label>
              </div>
              
              {editSettings.exit_intent.enabled && (
                <>
                  <div>
                    <Label>Título</Label>
                    <Input
                      value={editSettings.exit_intent.title}
                      onChange={(e) => setEditSettings({
                        ...editSettings,
                        exit_intent: { ...editSettings.exit_intent, title: e.target.value }
                      })}
                      placeholder="Não Vá Embora!"
                    />
                  </div>
                  <div>
                    <Label>Mensagem</Label>
                    <Textarea
                      value={editSettings.exit_intent.message}
                      onChange={(e) => setEditSettings({
                        ...editSettings,
                        exit_intent: { ...editSettings.exit_intent, message: e.target.value }
                      })}
                      placeholder="Aproveite esta oferta antes de sair"
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label>Texto do Botão</Label>
                    <Input
                      value={editSettings.exit_intent.button_text}
                      onChange={(e) => setEditSettings({
                        ...editSettings,
                        exit_intent: { ...editSettings.exit_intent, button_text: e.target.value }
                      })}
                      placeholder="Ver Oferta"
                    />
                  </div>
                  <div>
                    <Label>Link do Botão</Label>
                    <Input
                      value={editSettings.exit_intent.button_link}
                      onChange={(e) => setEditSettings({
                        ...editSettings,
                        exit_intent: { ...editSettings.exit_intent, button_link: e.target.value }
                      })}
                      placeholder="https://seu-checkout.com"
                    />
                  </div>
                </>
              )}
            </TabsContent>

            {/* Social Proof Tab */}
            <TabsContent value="social" className="space-y-4">
              <div className="flex items-center gap-2">
                <Switch
                  checked={editSettings.social_proof.enabled}
                  onCheckedChange={(checked) => setEditSettings({
                    ...editSettings,
                    social_proof: { ...editSettings.social_proof, enabled: checked }
                  })}
                />
                <Label>Ativar Notificações de Prova Social</Label>
              </div>
              
              {editSettings.social_proof.enabled && (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Adicione notificações que aparecem na página simulando compras/ações recentes
                  </p>
                  
                  {editSettings.social_proof.notifications.map((notif, index) => (
                    <Card key={index} className="p-3">
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <Input
                            placeholder="Maria acabou de comprar..."
                            value={notif.message}
                            onChange={(e) => {
                              const newNotifs = [...editSettings.social_proof.notifications];
                              newNotifs[index].message = e.target.value;
                              setEditSettings({
                                ...editSettings,
                                social_proof: { ...editSettings.social_proof, notifications: newNotifs }
                              });
                            }}
                            className="flex-1"
                          />
                          <Input
                            type="number"
                            placeholder="Delay (s)"
                            value={notif.delay}
                            onChange={(e) => {
                              const newNotifs = [...editSettings.social_proof.notifications];
                              newNotifs[index].delay = parseInt(e.target.value) || 5;
                              setEditSettings({
                                ...editSettings,
                                social_proof: { ...editSettings.social_proof, notifications: newNotifs }
                              });
                            }}
                            className="w-24"
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              const newNotifs = editSettings.social_proof.notifications.filter((_, i) => i !== index);
                              setEditSettings({
                                ...editSettings,
                                social_proof: { ...editSettings.social_proof, notifications: newNotifs }
                              });
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditSettings({
                        ...editSettings,
                        social_proof: {
                          ...editSettings.social_proof,
                          notifications: [...editSettings.social_proof.notifications, { message: "", delay: 5 }]
                        }
                      });
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar Notificação
                  </Button>
                </div>
              )}
            </TabsContent>

            {/* Lead Capture Tab */}
            <TabsContent value="leads" className="space-y-4">
              <div className="flex items-center gap-2">
                <Switch
                  checked={editSettings.lead_capture.enabled}
                  onCheckedChange={(checked) => setEditSettings({
                    ...editSettings,
                    lead_capture: { ...editSettings.lead_capture, enabled: checked }
                  })}
                />
                <Label>Ativar Captura de Leads</Label>
              </div>
              
              {editSettings.lead_capture.enabled && (
                <>
                  <div>
                    <Label>Gatilho de Exibição</Label>
                    <Select
                      value={editSettings.lead_capture.trigger}
                      onValueChange={(value) => setEditSettings({
                        ...editSettings,
                        lead_capture: { ...editSettings.lead_capture, trigger: value }
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="exit_intent">Exit Intent (tentar sair)</SelectItem>
                        <SelectItem value="time_delay">Tempo (segundos na página)</SelectItem>
                        <SelectItem value="scroll">Rolagem (% da página)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>
                      Valor do Gatilho {editSettings.lead_capture.trigger === 'scroll' ? '(%)' : '(segundos)'}
                    </Label>
                    <Input
                      type="number"
                      value={editSettings.lead_capture.trigger_value}
                      onChange={(e) => setEditSettings({
                        ...editSettings,
                        lead_capture: { ...editSettings.lead_capture, trigger_value: parseInt(e.target.value) || 5 }
                      })}
                    />
                  </div>
                  <div>
                    <Label>Título do Formulário</Label>
                    <Input
                      value={editSettings.lead_capture.title}
                      onChange={(e) => setEditSettings({
                        ...editSettings,
                        lead_capture: { ...editSettings.lead_capture, title: e.target.value }
                      })}
                      placeholder="Receba Acesso Exclusivo"
                    />
                  </div>
                  <div>
                    <Label>Descrição</Label>
                    <Textarea
                      value={editSettings.lead_capture.description}
                      onChange={(e) => setEditSettings({
                        ...editSettings,
                        lead_capture: { ...editSettings.lead_capture, description: e.target.value }
                      })}
                      placeholder="Preencha os dados abaixo"
                      rows={2}
                    />
                  </div>
                  <div>
                    <Label>Campos do Formulário</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {['name', 'email', 'phone'].map((field) => (
                        <label key={field} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={editSettings.lead_capture.fields.includes(field)}
                            onChange={(e) => {
                              const newFields = e.target.checked
                                ? [...editSettings.lead_capture.fields, field]
                                : editSettings.lead_capture.fields.filter(f => f !== field);
                              setEditSettings({
                                ...editSettings,
                                lead_capture: { ...editSettings.lead_capture, fields: newFields }
                              });
                            }}
                            className="rounded border-gray-300"
                          />
                          <span className="text-sm capitalize">{field === 'name' ? 'Nome' : field === 'email' ? 'Email' : 'Telefone'}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label>Texto do Botão</Label>
                    <Input
                      value={editSettings.lead_capture.button_text}
                      onChange={(e) => setEditSettings({
                        ...editSettings,
                        lead_capture: { ...editSettings.lead_capture, button_text: e.target.value }
                      })}
                      placeholder="Enviar"
                    />
                  </div>
                  <div>
                    <Label>Mensagem de Sucesso</Label>
                    <Input
                      value={editSettings.lead_capture.success_message}
                      onChange={(e) => setEditSettings({
                        ...editSettings,
                        lead_capture: { ...editSettings.lead_capture, success_message: e.target.value }
                      })}
                      placeholder="Obrigado! Redirecionando..."
                    />
                  </div>
                </>
              )}
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

          <div className="flex gap-2 mt-6 pt-4 border-t">
            <Button 
              onClick={handleUpdateSettings} 
              className="flex-1 gradient-primary text-lg py-6"
            >
              💾 Salvar Todas as Configurações
            </Button>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} className="py-6">
              Cancelar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de Analytics */}
      <Dialog open={isAnalyticsDialogOpen} onOpenChange={setIsAnalyticsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Analytics - {selectedPage?.slug}</DialogTitle>
          </DialogHeader>
          {selectedPage && <AnalyticsPanel pageId={selectedPage.id} />}
        </DialogContent>
      </Dialog>

      {/* Dialog de Leads */}
      <Dialog open={isLeadsDialogOpen} onOpenChange={setIsLeadsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Leads Capturados - {selectedPage?.slug}</DialogTitle>
          </DialogHeader>
          {selectedPage && <LeadsManager pageId={selectedPage.id} />}
        </DialogContent>
      </Dialog>

      {/* Dialog de Embed/Incorporação */}
      <Dialog open={isEmbedDialogOpen} onOpenChange={setIsEmbedDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Code className="w-5 h-5" />
              Código de Incorporação
            </DialogTitle>
            <DialogDescription>
              Use este código para incorporar a página clonada em seu site WordPress, Elementor ou qualquer outra plataforma.
            </DialogDescription>
          </DialogHeader>
          
          {selectedPage && (
            <div className="space-y-6 mt-4">
              {/* Configurações do Embed */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Largura</Label>
                  <Select
                    value={embedSettings.width}
                    onValueChange={(value) => setEmbedSettings({ ...embedSettings, width: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="100%">100% (Responsivo)</SelectItem>
                      <SelectItem value="800px">800px</SelectItem>
                      <SelectItem value="1024px">1024px</SelectItem>
                      <SelectItem value="1200px">1200px</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Altura (px)</Label>
                  <Input
                    type="number"
                    value={embedSettings.height}
                    onChange={(e) => setEmbedSettings({ ...embedSettings, height: e.target.value })}
                    placeholder="800"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Permitir rolagem</Label>
                  <p className="text-xs text-muted-foreground">Permite scroll dentro do iframe</p>
                </div>
                <Switch
                  checked={embedSettings.scrolling === "yes"}
                  onCheckedChange={(checked) => setEmbedSettings({ ...embedSettings, scrolling: checked ? "yes" : "no" })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Mostrar borda</Label>
                  <p className="text-xs text-muted-foreground">Adiciona borda ao redor do iframe</p>
                </div>
                <Switch
                  checked={embedSettings.border}
                  onCheckedChange={(checked) => setEmbedSettings({ ...embedSettings, border: checked })}
                />
              </div>

              {/* Código Iframe */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Code className="w-4 h-4" />
                  Código HTML (iframe)
                </Label>
                <div className="relative">
                  <Textarea
                    readOnly
                    value={`<iframe src="${selectedPage.cloned_url}" width="${embedSettings.width}" height="${embedSettings.height}" scrolling="${embedSettings.scrolling}" frameborder="${embedSettings.border ? '1' : '0'}" style="border: ${embedSettings.border ? '1px solid #ccc' : 'none'}; max-width: 100%;"></iframe>`}
                    className="font-mono text-xs h-24 pr-12"
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    className="absolute top-2 right-2"
                    onClick={() => {
                      navigator.clipboard.writeText(`<iframe src="${selectedPage.cloned_url}" width="${embedSettings.width}" height="${embedSettings.height}" scrolling="${embedSettings.scrolling}" frameborder="${embedSettings.border ? '1' : '0'}" style="border: ${embedSettings.border ? '1px solid #ccc' : 'none'}; max-width: 100%;"></iframe>`);
                      toast({ title: "Código HTML copiado!" });
                    }}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Código Shortcode WordPress */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Shortcode WordPress
                </Label>
                <div className="relative">
                  <Textarea
                    readOnly
                    value={`[embed width="${embedSettings.width.replace('px', '')}" height="${embedSettings.height}"]${selectedPage.cloned_url}[/embed]`}
                    className="font-mono text-xs h-16 pr-12"
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    className="absolute top-2 right-2"
                    onClick={() => {
                      navigator.clipboard.writeText(`[embed width="${embedSettings.width.replace('px', '')}" height="${embedSettings.height}"]${selectedPage.cloned_url}[/embed]`);
                      toast({ title: "Shortcode copiado!" });
                    }}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Para usar no editor clássico do WordPress
                </p>
              </div>

              {/* URL Direta */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Link2 className="w-4 h-4" />
                  URL Direta
                </Label>
                <div className="relative">
                  <Input
                    readOnly
                    value={selectedPage.cloned_url}
                    className="font-mono text-xs pr-12"
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    className="absolute top-2 right-2"
                    onClick={() => {
                      navigator.clipboard.writeText(selectedPage.cloned_url);
                      toast({ title: "URL copiada!" });
                    }}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Dicas */}
              <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">💡 Dicas de uso</h4>
                <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
                  <li><strong>Elementor:</strong> Use o widget "HTML" e cole o código iframe</li>
                  <li><strong>Gutenberg:</strong> Use o bloco "HTML Personalizado"</li>
                  <li><strong>Divi:</strong> Use o módulo "Código" e cole o iframe</li>
                  <li><strong>Outras plataformas:</strong> Procure por "Embed" ou "HTML personalizado"</li>
                </ul>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
