import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Globe, Copy, Trash2, Edit, Link2, Code, Smartphone, Settings, BarChart3 } from "lucide-react";

interface ClonedPage {
  id: string;
  original_url: string;
  cloned_url: string;
  page_content: string | null;
  custom_settings: any;
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
  const [cloneData, setCloneData] = useState({
    original_url: "",
  });
  const [editSettings, setEditSettings] = useState({
    custom_links: [] as { selector: string; newUrl: string }[],
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

  useEffect(() => {
    if (user) {
      fetchClonedPages();
    }
  }, [user]);

  const fetchClonedPages = async () => {
    const { data, error } = await supabase
      .from('cloned_pages')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setClonedPages(data);
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

    const clonedSlug = `clone-${Math.random().toString(36).substring(2, 10)}`;
    const clonedUrl = `${window.location.origin}/page/${clonedSlug}`;

    try {
      // Aqui você pode implementar a lógica de scraping da página
      const { data, error } = await supabase
        .from('cloned_pages')
        .insert({
          user_id: user!.id,
          original_url: cloneData.original_url,
          cloned_url: clonedUrl,
          page_content: null,
          custom_settings: {},
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;

      toast({ title: "Página clonada com sucesso!" });
      setClonedPages([data, ...clonedPages]);
      setCloneData({ original_url: "" });
      setIsCloneDialogOpen(false);
    } catch (error: any) {
      toast({
        title: "Erro ao clonar página",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleUpdateSettings = async () => {
    if (!selectedPage) return;

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
      toast({ title: "Configurações atualizadas!" });
      fetchClonedPages();
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

  const openEditDialog = (page: ClonedPage) => {
    setSelectedPage(page);
    setEditSettings(page.custom_settings || {
      custom_links: [],
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
              <DialogTitle>Clonar Página</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>URL da Página Original *</Label>
                <Input
                  value={cloneData.original_url}
                  onChange={(e) => setCloneData({ ...cloneData, original_url: e.target.value })}
                  placeholder="https://exemplo.com/landing-page"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Cole a URL completa da página que deseja clonar
                </p>
              </div>
              <Button onClick={handleClonePage} className="w-full gradient-primary">
                Clonar Página
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
              <Link2 className="w-6 h-6 text-warning" />
            </div>
            <div>
              <h3 className="text-2xl font-bold">0</h3>
              <p className="text-sm text-muted-foreground">Clicks Este Mês</p>
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
              <Card key={page.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Globe className="w-4 h-4 text-primary" />
                      <h4 className="font-semibold">Página Clonada</h4>
                      <Badge variant={page.is_active ? 'default' : 'secondary'}>
                        {page.is_active ? 'Ativa' : 'Inativa'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">
                      <strong>Original:</strong> {page.original_url}
                    </p>
                    <p className="text-sm text-primary">
                      <strong>Clone:</strong> {page.cloned_url}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Criado em: {new Date(page.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <div className="flex gap-2">
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
          <Tabs defaultValue="links" className="w-full mt-4">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="links">Links</TabsTrigger>
              <TabsTrigger value="utm">UTM</TabsTrigger>
              <TabsTrigger value="pixels">Pixels</TabsTrigger>
              <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
              <TabsTrigger value="code">Código</TabsTrigger>
            </TabsList>

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
                    checked={editSettings.whatsapp_button.enabled}
                    onChange={(e) => setEditSettings({
                      ...editSettings,
                      whatsapp_button: { ...editSettings.whatsapp_button, enabled: e.target.checked }
                    })}
                    className="w-4 h-4"
                  />
                  <Label>Ativar Botão de WhatsApp</Label>
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