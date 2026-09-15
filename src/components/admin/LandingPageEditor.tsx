import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { FileText, Save, Eye, RefreshCw, Image as ImageIcon, X } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

export const LandingPageEditor = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [uploadingSecondSectionImage, setUploadingSecondSectionImage] = useState(false);
  const [settings, setSettings] = useState({
    landing_title: "",
    hero_title: "",
    hero_subtitle: "",
    hero_cta_text: "",
    video_section_title: "",
    video_section_subtitle: "",
    landing_second_section_image_url: "",
    features_title: "",
    features_subtitle: "",
    pricing_title: "",
    pricing_subtitle: "",
    cta_title: "",
    cta_subtitle: "",
    cta_button_text: "",
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    const keys = Object.keys(settings);
    const { data, error } = await supabase
      .from('site_settings')
      .select('key, value')
      .in('key', keys);

    if (!error && data) {
      const newSettings = { ...settings };
      data.forEach(item => {
        if (item.key in newSettings) {
          newSettings[item.key as keyof typeof settings] = item.value || "";
        }
      });
      setSettings(newSettings);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    
    const updates = Object.entries(settings).map(([key, value]) => ({
      key,
      value,
    }));

    for (const update of updates) {
      const { data: existing } = await supabase
        .from('site_settings')
        .select('key')
        .eq('key', update.key)
        .maybeSingle();

      if (existing) {
        await supabase
          .from('site_settings')
          .update({ value: update.value })
          .eq('key', update.key);
      } else {
        await supabase
          .from('site_settings')
          .insert({ key: update.key, value: update.value });
      }
    }

    toast({ title: "Landing page atualizada com sucesso!" });
    setLoading(false);
  };

  const handleChange = (key: keyof typeof settings, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSecondSectionImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({ title: "Arquivo inválido", description: "Selecione uma imagem.", variant: "destructive" });
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Imagem muito grande", description: "O tamanho máximo é 5 MB.", variant: "destructive" });
      event.target.value = "";
      return;
    }

    setUploadingSecondSectionImage(true);
    const extension = file.name.split(".").pop()?.toLowerCase() || "webp";
    const fileName = `landing/second-section-${Date.now()}.${extension}`;
    const { error } = await supabase.storage.from("avatars").upload(fileName, file, {
      cacheControl: "3600",
      upsert: false,
    });

    if (error) {
      toast({ title: "Erro ao enviar imagem", description: error.message, variant: "destructive" });
      setUploadingSecondSectionImage(false);
      event.target.value = "";
      return;
    }

    const { data } = supabase.storage.from("avatars").getPublicUrl(fileName);
    handleChange("landing_second_section_image_url", data.publicUrl);
    setUploadingSecondSectionImage(false);
    event.target.value = "";
    toast({ title: "Imagem enviada", description: "Clique em salvar para publicar a alteração." });
  };

  const handlePreview = () => {
    window.open('/', '_blank');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              <CardTitle>Editor da Landing Page</CardTitle>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handlePreview}>
                <Eye className="w-4 h-4 mr-2" />
                Visualizar
              </Button>
              <Button variant="outline" onClick={fetchSettings}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Recarregar
              </Button>
              <Button onClick={handleSave} disabled={loading}>
                <Save className="w-4 h-4 mr-2" />
                {loading ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="hero" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="hero">Hero</TabsTrigger>
              <TabsTrigger value="video">Segunda seção</TabsTrigger>
              <TabsTrigger value="features">Recursos</TabsTrigger>
              <TabsTrigger value="pricing">Preços & CTA</TabsTrigger>
            </TabsList>

            <TabsContent value="hero" className="space-y-4">
              <div className="space-y-3">
                <Label htmlFor="landing_title">Título da Página (Grande)</Label>
                <Textarea
                  id="landing_title"
                  value={settings.landing_title}
                  onChange={(e) => handleChange('landing_title', e.target.value)}
                  placeholder="A Solução Tudo em Um<br />para Empreendedores Digitais."
                  rows={2}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  Use &lt;br /&gt; para quebrar linha. Este é o título grande que aparece no topo.
                </p>
              </div>

              <Separator />

              <div className="space-y-3">
                <Label htmlFor="hero_title">Título Alternativo (Opcional)</Label>
                <Textarea
                  id="hero_title"
                  value={settings.hero_title}
                  onChange={(e) => handleChange('hero_title', e.target.value)}
                  placeholder="Plataforma Completa de Automação..."
                  rows={3}
                  className="resize-none"
                />
              </div>

              <Separator />

              <div className="space-y-3">
                <Label htmlFor="hero_subtitle">Subtítulo</Label>
                <Textarea
                  id="hero_subtitle"
                  value={settings.hero_subtitle}
                  onChange={(e) => handleChange('hero_subtitle', e.target.value)}
                  placeholder="Construtor visual de automações, CRM..."
                  rows={4}
                  className="resize-none"
                />
              </div>

              <Separator />

              <div className="space-y-3">
                <Label htmlFor="hero_cta_text">Texto do Botão Principal</Label>
                <Input
                  id="hero_cta_text"
                  value={settings.hero_cta_text}
                  onChange={(e) => handleChange('hero_cta_text', e.target.value)}
                  placeholder="Começar Teste Grátis 🚀"
                />
              </div>
            </TabsContent>

            <TabsContent value="video" className="space-y-4">
              <div className="space-y-3">
                <Label htmlFor="video_section_title">Título da segunda seção</Label>
                <Input
                  id="video_section_title"
                  value={settings.video_section_title}
                  onChange={(e) => handleChange('video_section_title', e.target.value)}
                  placeholder="Veja a Plataforma em Ação"
                />
              </div>

              <Separator />

              <div className="space-y-3">
                <Label htmlFor="video_section_subtitle">Texto da segunda seção</Label>
                <Textarea
                  id="video_section_subtitle"
                  value={settings.video_section_subtitle}
                  onChange={(e) => handleChange('video_section_subtitle', e.target.value)}
                  placeholder="Descubra como é fácil automatizar..."
                  rows={2}
                  className="resize-none"
                />
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <ImageIcon className="h-4 w-4 text-primary" />
                  <Label htmlFor="landing-second-section-image">Imagem da segunda seção</Label>
                </div>
                {settings.landing_second_section_image_url && (
                  <div className="relative overflow-hidden rounded-md border bg-muted/30">
                    <img
                      src={settings.landing_second_section_image_url}
                      alt="Prévia da imagem da segunda seção"
                      className="aspect-video w-full object-contain"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute right-2 top-2"
                      onClick={() => handleChange("landing_second_section_image_url", "")}
                      aria-label="Remover imagem da segunda seção"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                <Input
                  id="landing-second-section-image"
                  type="file"
                  accept="image/*"
                  onChange={handleSecondSectionImageUpload}
                  disabled={uploadingSecondSectionImage}
                />
                <Input
                  value={settings.landing_second_section_image_url}
                  onChange={(event) => handleChange("landing_second_section_image_url", event.target.value)}
                  placeholder="Ou cole a URL da imagem"
                  aria-label="URL da imagem da segunda seção"
                />
                <p className="text-xs text-muted-foreground">
                  {uploadingSecondSectionImage
                    ? "Enviando imagem..."
                    : "A imagem aparece abaixo do título e do texto. Recomendado: formato horizontal."}
                </p>
              </div>
            </TabsContent>

            <TabsContent value="features" className="space-y-4">
              <div className="space-y-3">
                <Label htmlFor="features_title">Título da Seção de Recursos</Label>
                <Input
                  id="features_title"
                  value={settings.features_title}
                  onChange={(e) => handleChange('features_title', e.target.value)}
                  placeholder="Tudo que Você Precisa em Uma Plataforma"
                />
              </div>

              <Separator />

              <div className="space-y-3">
                <Label htmlFor="features_subtitle">Subtítulo da Seção de Recursos</Label>
                <Textarea
                  id="features_subtitle"
                  value={settings.features_subtitle}
                  onChange={(e) => handleChange('features_subtitle', e.target.value)}
                  placeholder="Automação, IA, CRM, Afiliados..."
                  rows={2}
                  className="resize-none"
                />
              </div>
            </TabsContent>

            <TabsContent value="pricing" className="space-y-4">
              <div className="space-y-3">
                <Label htmlFor="pricing_title">Título da Seção de Preços</Label>
                <Input
                  id="pricing_title"
                  value={settings.pricing_title}
                  onChange={(e) => handleChange('pricing_title', e.target.value)}
                  placeholder="Planos para Todos os Tamanhos"
                />
              </div>

              <Separator />

              <div className="space-y-3">
                <Label htmlFor="pricing_subtitle">Subtítulo da Seção de Preços</Label>
                <Textarea
                  id="pricing_subtitle"
                  value={settings.pricing_subtitle}
                  onChange={(e) => handleChange('pricing_subtitle', e.target.value)}
                  placeholder="Comece com 3 dias grátis..."
                  rows={2}
                  className="resize-none"
                />
              </div>

              <Separator />

              <div className="space-y-3">
                <Label htmlFor="cta_title">Título do CTA Final</Label>
                <Input
                  id="cta_title"
                  value={settings.cta_title}
                  onChange={(e) => handleChange('cta_title', e.target.value)}
                  placeholder="Pronto para Transformar..."
                />
              </div>

              <Separator />

              <div className="space-y-3">
                <Label htmlFor="cta_subtitle">Subtítulo do CTA Final</Label>
                <Textarea
                  id="cta_subtitle"
                  value={settings.cta_subtitle}
                  onChange={(e) => handleChange('cta_subtitle', e.target.value)}
                  placeholder="Junte-se a centenas de empresas..."
                  rows={2}
                  className="resize-none"
                />
              </div>

              <Separator />

              <div className="space-y-3">
                <Label htmlFor="cta_button_text">Texto do Botão CTA</Label>
                <Input
                  id="cta_button_text"
                  value={settings.cta_button_text}
                  onChange={(e) => handleChange('cta_button_text', e.target.value)}
                  placeholder="Começar Agora - 3 Dias Grátis"
                />
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
