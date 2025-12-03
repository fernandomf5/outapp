import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ImageUpload } from "@/components/ImageUpload";
import { Trash2, Plus } from "lucide-react";

interface BlogSettings {
  id: string;
  site_name: string;
  site_description: string;
  logo_url: string | null;
  banner_top_url: string | null;
  banner_top_link: string | null;
  header_menu: { label: string; url: string }[];
  footer_content: string | null;
  footer_menu: { label: string; url: string }[];
  social_links: { platform: string; url: string }[];
}

export const BlogSettingsManager = () => {
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<BlogSettings | null>(null);
  const [formData, setFormData] = useState({
    site_name: '',
    site_description: '',
    logo_url: '',
    banner_top_url: '',
    banner_top_link: '',
    footer_content: ''
  });
  const [headerMenu, setHeaderMenu] = useState<{ label: string; url: string }[]>([]);
  const [footerMenu, setFooterMenu] = useState<{ label: string; url: string }[]>([]);
  const [socialLinks, setSocialLinks] = useState<{ platform: string; url: string }[]>([]);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('blog_settings' as any)
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setSettings(data as any);
        setFormData({
          site_name: (data as any).site_name || '',
          site_description: (data as any).site_description || '',
          logo_url: (data as any).logo_url || '',
          banner_top_url: (data as any).banner_top_url || '',
          banner_top_link: (data as any).banner_top_link || '',
          footer_content: (data as any).footer_content || ''
        });
        
        // Garantir que sempre temos arrays válidos
        const headerMenuData = (data as any).header_menu;
        setHeaderMenu(Array.isArray(headerMenuData) ? headerMenuData : []);
        
        const footerMenuData = (data as any).footer_menu;
        setFooterMenu(Array.isArray(footerMenuData) ? footerMenuData : []);
        
        const socialLinksData = (data as any).social_links;
        setSocialLinks(Array.isArray(socialLinksData) ? socialLinksData : []);
      }
    } catch (error) {
      console.error("Erro ao carregar configurações:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const dataToSave = {
        site_name: formData.site_name,
        site_description: formData.site_description,
        logo_url: formData.logo_url || null,
        banner_top_url: formData.banner_top_url || null,
        banner_top_link: formData.banner_top_link || null,
        header_menu: headerMenu,
        footer_content: formData.footer_content || null,
        footer_menu: footerMenu,
        social_links: socialLinks
      };

      if (settings) {
        const { error } = await supabase
          .from('blog_settings' as any)
          .update(dataToSave as any)
          .eq('id', settings.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('blog_settings' as any)
          .insert([dataToSave as any]);

        if (error) throw error;
      }

      toast.success("Configurações salvas com sucesso!");
      loadSettings();
    } catch (error) {
      toast.error("Erro ao salvar configurações");
      console.error(error);
    }
  };

  if (loading) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Configurações do Blog</CardTitle>
          <CardDescription>Personalize a aparência e conteúdo do blog</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label>Nome do Site</Label>
              <Input
                value={formData.site_name}
                onChange={(e) => setFormData({ ...formData, site_name: e.target.value })}
                placeholder="Ex: Blog Out App"
              />
            </div>
            <div className="grid gap-2">
              <Label>Descrição do Site</Label>
              <Input
                value={formData.site_description}
                onChange={(e) => setFormData({ ...formData, site_description: e.target.value })}
                placeholder="Ex: Notícias, atualizações e novidades"
              />
            </div>
          </div>

          {/* Logo */}
          <div className="space-y-2">
            <Label>Logo do Blog</Label>
            <ImageUpload
              currentImage={formData.logo_url}
              onImageSelect={(url) => setFormData({ ...formData, logo_url: url })}
              bucketName="chatbot-media"
            />
          </div>

          {/* Top Banner */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Banner do Topo</h3>
            <div className="grid gap-2">
              <Label>URL da Imagem do Banner</Label>
              <ImageUpload
                currentImage={formData.banner_top_url}
                onImageSelect={(url) => setFormData({ ...formData, banner_top_url: url })}
                bucketName="chatbot-media"
              />
            </div>
            <div className="grid gap-2">
              <Label>Link do Banner (opcional)</Label>
              <Input
                value={formData.banner_top_link}
                onChange={(e) => setFormData({ ...formData, banner_top_link: e.target.value })}
                placeholder="https://exemplo.com"
              />
            </div>
          </div>

          {/* Header Menu */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Menu do Cabeçalho</h3>
              <Button
                size="sm"
                onClick={() => setHeaderMenu([...headerMenu, { label: '', url: '' }])}
              >
                <Plus className="h-4 w-4 mr-1" />
                Adicionar Item
              </Button>
            </div>
            {headerMenu.map((item, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  placeholder="Label"
                  value={item.label}
                  onChange={(e) => {
                    const newMenu = [...headerMenu];
                    newMenu[index].label = e.target.value;
                    setHeaderMenu(newMenu);
                  }}
                />
                <Input
                  placeholder="URL"
                  value={item.url}
                  onChange={(e) => {
                    const newMenu = [...headerMenu];
                    newMenu[index].url = e.target.value;
                    setHeaderMenu(newMenu);
                  }}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setHeaderMenu(headerMenu.filter((_, i) => i !== index))}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Rodapé</h3>
            <div className="grid gap-2">
              <Label>Conteúdo do Rodapé</Label>
              <Textarea
                value={formData.footer_content}
                onChange={(e) => setFormData({ ...formData, footer_content: e.target.value })}
                placeholder="Ex: © 2024 Out App. Todos os direitos reservados."
                rows={3}
              />
            </div>
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Menu do Rodapé</h4>
              <Button
                size="sm"
                onClick={() => setFooterMenu([...footerMenu, { label: '', url: '' }])}
              >
                <Plus className="h-4 w-4 mr-1" />
                Adicionar Item
              </Button>
            </div>
            {footerMenu.map((item, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  placeholder="Label"
                  value={item.label}
                  onChange={(e) => {
                    const newMenu = [...footerMenu];
                    newMenu[index].label = e.target.value;
                    setFooterMenu(newMenu);
                  }}
                />
                <Input
                  placeholder="URL"
                  value={item.url}
                  onChange={(e) => {
                    const newMenu = [...footerMenu];
                    newMenu[index].url = e.target.value;
                    setFooterMenu(newMenu);
                  }}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setFooterMenu(footerMenu.filter((_, i) => i !== index))}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          {/* Social Links */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Redes Sociais</h3>
              <Button
                size="sm"
                onClick={() => setSocialLinks([...socialLinks, { platform: '', url: '' }])}
              >
                <Plus className="h-4 w-4 mr-1" />
                Adicionar Rede
              </Button>
            </div>
            {socialLinks.map((link, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  placeholder="Plataforma (ex: facebook)"
                  value={link.platform}
                  onChange={(e) => {
                    const newLinks = [...socialLinks];
                    newLinks[index].platform = e.target.value;
                    setSocialLinks(newLinks);
                  }}
                />
                <Input
                  placeholder="URL"
                  value={link.url}
                  onChange={(e) => {
                    const newLinks = [...socialLinks];
                    newLinks[index].url = e.target.value;
                    setSocialLinks(newLinks);
                  }}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSocialLinks(socialLinks.filter((_, i) => i !== index))}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          <Button onClick={handleSave} className="w-full gradient-primary">
            Salvar Configurações
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};