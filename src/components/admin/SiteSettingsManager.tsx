import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Settings, Video, Image as ImageIcon, Globe, Upload, X } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

interface FooterMenu {
  title: string;
  links: { text: string; url: string }[];
}

export const SiteSettingsManager = () => {
  const { toast } = useToast();
  const [videoUrl, setVideoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [siteTitle, setSiteTitle] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [faviconUrl, setFaviconUrl] = useState("");
  const [footerText, setFooterText] = useState("");
  const [footerMenus, setFooterMenus] = useState<FooterMenu[]>([
    { title: "Produto", links: [{ text: "Recursos", url: "#features" }, { text: "Preços", url: "#pricing" }] },
    { title: "Empresa", links: [{ text: "Sobre", url: "#" }, { text: "Contato", url: "#" }] }
  ]);
  const [footerImages, setFooterImages] = useState<string[]>([]);
  const [cookieNoticeText, setCookieNoticeText] = useState("");
  const [cookieNoticeEnabled, setCookieNoticeEnabled] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    const keys = [
      'landing_video_url',
      'site_title',
      'site_logo_url',
      'site_favicon_url',
      'footer_text',
      'footer_menus',
      'footer_images',
      'cookie_notice_text',
      'cookie_notice_enabled'
    ];
    
    const { data, error } = await supabase
      .from('site_settings')
      .select('key, value')
      .in('key', keys);

    if (!error && data) {
      data.forEach(item => {
        switch(item.key) {
          case 'landing_video_url':
            setVideoUrl(item.value || "");
            break;
          case 'site_title':
            setSiteTitle(item.value || "");
            break;
          case 'site_logo_url':
            setLogoUrl(item.value || "");
            break;
          case 'site_favicon_url':
            setFaviconUrl(item.value || "");
            break;
          case 'footer_text':
            setFooterText(item.value || "");
            break;
          case 'footer_menus':
            try {
              setFooterMenus(JSON.parse(item.value || '[]'));
            } catch (e) {
              console.error('Error parsing footer menus:', e);
            }
            break;
          case 'footer_images':
            try {
              setFooterImages(JSON.parse(item.value || '[]'));
            } catch (e) {
              console.error('Error parsing footer images:', e);
            }
            break;
          case 'cookie_notice_text':
            setCookieNoticeText(item.value || "");
            break;
          case 'cookie_notice_enabled':
            setCookieNoticeEnabled(item.value === 'true');
            break;
        }
      });
    }
  };

  const saveSetting = async (key: string, value: string) => {
    const { data: existing } = await supabase
      .from('site_settings')
      .select('key')
      .eq('key', key)
      .maybeSingle();

    if (existing) {
      await supabase
        .from('site_settings')
        .update({ value })
        .eq('key', key);
    } else {
      await supabase
        .from('site_settings')
        .insert({ key, value });
    }
  };

  const handleSaveAll = async () => {
    setLoading(true);
    
    await Promise.all([
      saveSetting('landing_video_url', videoUrl),
      saveSetting('site_title', siteTitle),
      saveSetting('site_logo_url', logoUrl),
      saveSetting('site_favicon_url', faviconUrl),
      saveSetting('footer_text', footerText),
      saveSetting('footer_menus', JSON.stringify(footerMenus)),
      saveSetting('footer_images', JSON.stringify(footerImages)),
      saveSetting('cookie_notice_text', cookieNoticeText),
      saveSetting('cookie_notice_enabled', cookieNoticeEnabled.toString())
    ]);

    toast({ title: "Todas as configurações salvas com sucesso!" });
    setLoading(false);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileExt = file.name.split('.').pop();
    const fileName = `logo-${Date.now()}.${fileExt}`;
    
    const { data, error } = await supabase.storage
      .from('avatars')
      .upload(fileName, file);

    if (error) {
      toast({ title: "Erro ao fazer upload", variant: "destructive" });
      return;
    }

    const { data: urlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName);

    setLogoUrl(urlData.publicUrl);
  };

  const handleFaviconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileExt = file.name.split('.').pop();
    const fileName = `favicon-${Date.now()}.${fileExt}`;
    
    const { data, error } = await supabase.storage
      .from('avatars')
      .upload(fileName, file);

    if (error) {
      toast({ title: "Erro ao fazer upload", variant: "destructive" });
      return;
    }

    const { data: urlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName);

    setFaviconUrl(urlData.publicUrl);
  };

  const handleFooterImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileExt = file.name.split('.').pop();
    const fileName = `footer-${Date.now()}.${fileExt}`;
    
    const { data, error } = await supabase.storage
      .from('avatars')
      .upload(fileName, file);

    if (error) {
      toast({ title: "Erro ao fazer upload", variant: "destructive" });
      return;
    }

    const { data: urlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName);

    setFooterImages([...footerImages, urlData.publicUrl]);
  };

  const removeFooterImage = (index: number) => {
    setFooterImages(footerImages.filter((_, i) => i !== index));
  };

  const addFooterMenu = () => {
    setFooterMenus([...footerMenus, { title: "Novo Menu", links: [{ text: "Link", url: "#" }] }]);
  };

  const removeFooterMenu = (index: number) => {
    setFooterMenus(footerMenus.filter((_, i) => i !== index));
  };

  const updateFooterMenuTitle = (index: number, title: string) => {
    const updated = [...footerMenus];
    updated[index].title = title;
    setFooterMenus(updated);
  };

  const addFooterMenuLink = (menuIndex: number) => {
    const updated = [...footerMenus];
    updated[menuIndex].links.push({ text: "Novo Link", url: "#" });
    setFooterMenus(updated);
  };

  const removeFooterMenuLink = (menuIndex: number, linkIndex: number) => {
    const updated = [...footerMenus];
    updated[menuIndex].links = updated[menuIndex].links.filter((_, i) => i !== linkIndex);
    setFooterMenus(updated);
  };

  const updateFooterMenuLink = (menuIndex: number, linkIndex: number, field: 'text' | 'url', value: string) => {
    const updated = [...footerMenus];
    updated[menuIndex].links[linkIndex][field] = value;
    setFooterMenus(updated);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            <CardTitle>Configurações do Site</CardTitle>
          </div>
          <Button onClick={handleSaveAll} disabled={loading}>
            {loading ? "Salvando..." : "Salvar Todas Configurações"}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="branding" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="branding">Marca</TabsTrigger>
            <TabsTrigger value="footer">Rodapé</TabsTrigger>
            <TabsTrigger value="cookie">Cookie Notice</TabsTrigger>
            <TabsTrigger value="video">Vídeo</TabsTrigger>
          </TabsList>

          {/* Branding Tab */}
          <TabsContent value="branding" className="space-y-6">
            <div className="space-y-3">
              <Label htmlFor="site-title">Título do Site</Label>
              <Input
                id="site-title"
                value={siteTitle}
                onChange={(e) => setSiteTitle(e.target.value)}
                placeholder="Minha Plataforma"
              />
              <p className="text-xs text-muted-foreground">
                Aparece na aba do navegador e nos mecanismos de busca
              </p>
            </div>

            <Separator />

            <div className="space-y-3">
              <Label>Logomarca do Site</Label>
              <div className="flex items-center gap-4">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="flex-1"
                />
                {logoUrl && (
                  <img src={logoUrl} alt="Logo" className="h-12 w-auto object-contain" />
                )}
              </div>
              <Input
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="Ou cole a URL da imagem"
              />
              <p className="text-xs text-muted-foreground">
                Aparece no topo da página. Tamanho recomendado: 200x50px
              </p>
            </div>

            <Separator />

            <div className="space-y-3">
              <Label>Favicon</Label>
              <div className="flex items-center gap-4">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleFaviconUpload}
                  className="flex-1"
                />
                {faviconUrl && (
                  <img src={faviconUrl} alt="Favicon" className="h-8 w-8 object-contain" />
                )}
              </div>
              <Input
                value={faviconUrl}
                onChange={(e) => setFaviconUrl(e.target.value)}
                placeholder="Ou cole a URL do favicon"
              />
              <p className="text-xs text-muted-foreground">
                Ícone que aparece na aba do navegador. Tamanho: 32x32px ou 64x64px
              </p>
            </div>
          </TabsContent>

          {/* Footer Tab */}
          <TabsContent value="footer" className="space-y-6">
            <div className="space-y-3">
              <Label htmlFor="footer-text">Texto do Rodapé</Label>
              <Textarea
                id="footer-text"
                value={footerText}
                onChange={(e) => setFooterText(e.target.value)}
                placeholder="© 2024 Minha Empresa. Todos os direitos reservados."
                rows={3}
              />
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Menus do Rodapé</Label>
                <Button onClick={addFooterMenu} variant="outline" size="sm">
                  + Adicionar Menu
                </Button>
              </div>
              {footerMenus.map((menu, menuIndex) => (
                <Card key={menuIndex} className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Input
                        value={menu.title}
                        onChange={(e) => updateFooterMenuTitle(menuIndex, e.target.value)}
                        placeholder="Título do Menu"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeFooterMenu(menuIndex)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="ml-4 space-y-2">
                      {menu.links.map((link, linkIndex) => (
                        <div key={linkIndex} className="flex items-center gap-2">
                          <Input
                            value={link.text}
                            onChange={(e) => updateFooterMenuLink(menuIndex, linkIndex, 'text', e.target.value)}
                            placeholder="Texto do link"
                            className="flex-1"
                          />
                          <Input
                            value={link.url}
                            onChange={(e) => updateFooterMenuLink(menuIndex, linkIndex, 'url', e.target.value)}
                            placeholder="URL"
                            className="flex-1"
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeFooterMenuLink(menuIndex, linkIndex)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        onClick={() => addFooterMenuLink(menuIndex)}
                        variant="outline"
                        size="sm"
                      >
                        + Adicionar Link
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            <Separator />

            <div className="space-y-3">
              <Label>Imagens do Rodapé</Label>
              <Input
                type="file"
                accept="image/*"
                onChange={handleFooterImageUpload}
              />
              <div className="grid grid-cols-4 gap-4">
                {footerImages.map((img, index) => (
                  <div key={index} className="relative">
                    <img src={img} alt={`Footer ${index}`} className="w-full h-20 object-contain" />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-0 right-0 h-6 w-6"
                      onClick={() => removeFooterImage(index)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Adicione logos de parceiros, selos de segurança, etc.
              </p>
            </div>
          </TabsContent>

          {/* Cookie Notice Tab */}
          <TabsContent value="cookie" className="space-y-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="cookie-enabled"
                  checked={cookieNoticeEnabled}
                  onChange={(e) => setCookieNoticeEnabled(e.target.checked)}
                  className="w-4 h-4"
                />
                <Label htmlFor="cookie-enabled">Ativar Cookie Notice</Label>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <Label htmlFor="cookie-text">Texto do Cookie Notice</Label>
              <Textarea
                id="cookie-text"
                value={cookieNoticeText}
                onChange={(e) => setCookieNoticeText(e.target.value)}
                placeholder="Usamos cookies para melhorar sua experiência em nosso site. Ao continuar navegando, você concorda com nossa Política de Privacidade."
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                Aparece na parte inferior da página para usuários que ainda não aceitaram
              </p>
            </div>
          </TabsContent>

          {/* Video Tab */}
          <TabsContent value="video" className="space-y-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Video className="w-4 h-4" />
                <Label htmlFor="video-url">URL do Vídeo da Landing Page</Label>
              </div>
              <Input
                id="video-url"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://www.youtube.com/embed/..."
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Cole a URL de embed do YouTube, Vimeo ou outro serviço.
                <br />
                Exemplo YouTube: https://www.youtube.com/embed/VIDEO_ID
                <br />
                Deixe em branco para não exibir o vídeo na landing page.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};