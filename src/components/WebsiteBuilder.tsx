import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Globe, 
  Plus,
  Eye,
  Trash2,
  Edit,
  Copy,
  ExternalLink,
  Settings,
  Palette,
  Layout,
  Code
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Website {
  id: string;
  user_id: string;
  title: string;
  slug: string;
  description?: string;
  template: string;
  custom_domain?: string;
  settings: {
    primaryColor?: string;
    secondaryColor?: string;
    fontFamily?: string;
    logo?: string;
  };
  sections: any[];
  is_published: boolean;
  created_at: string;
}

const templates = [
  { id: 'landing', name: 'Landing Page', description: 'Página única para captura de leads' },
  { id: 'business', name: 'Site Empresarial', description: 'Site completo para empresas' },
  { id: 'portfolio', name: 'Portfólio', description: 'Mostre seus trabalhos' },
  { id: 'ecommerce', name: 'Loja Online', description: 'Venda seus produtos' },
];

export function WebsiteBuilder() {
  const [websites, setWebsites] = useState<Website[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [customDomains, setCustomDomains] = useState<Array<{id: string; domain: string; is_verified: boolean}>>([]);
  
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    description: '',
    template: 'landing',
    custom_domain: ''
  });

  useEffect(() => {
    loadWebsites();
    fetchCustomDomains();
  }, []);

  const fetchCustomDomains = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    const { data } = await supabase
      .from('user_domains')
      .select('id, domain, is_verified')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (data) {
      setCustomDomains(data);
    }
  };

  const loadWebsites = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('websites')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWebsites(data || []);
    } catch (error: any) {
      toast.error("Erro ao carregar sites");
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleCreateWebsite = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (!formData.title) {
        toast.error("Preencha o título do site");
        return;
      }

      const slug = formData.slug || generateSlug(formData.title);

      const { error } = await supabase
        .from('websites')
        .insert([{
          user_id: user.id,
          title: formData.title,
          slug: slug,
          description: formData.description,
          template: formData.template,
          custom_domain: formData.custom_domain,
          settings: {
            primaryColor: '#8B5CF6',
            secondaryColor: '#EC4899',
            fontFamily: 'Inter'
          },
          sections: [],
          is_published: false
        }]);

      if (error) throw error;

      toast.success("Site criado com sucesso!");
      setIsCreateDialogOpen(false);
      setFormData({ title: '', slug: '', description: '', template: 'landing', custom_domain: '' });
      loadWebsites();
    } catch (error: any) {
      if (error.code === '23505') {
        toast.error("Já existe um site com esse slug");
      } else {
        toast.error("Erro ao criar site");
      }
    }
  };

  const handleDeleteWebsite = async (id: string) => {
    try {
      const { error } = await supabase
        .from('websites')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success("Site excluído!");
      loadWebsites();
    } catch (error: any) {
      toast.error("Erro ao excluir site");
    }
  };

  const handleCopyLink = (slug: string, customDomain?: string) => {
    const link = customDomain 
      ? `https://${customDomain}`
      : `${window.location.origin}/site/${slug}`;
    navigator.clipboard.writeText(link);
    toast.success("Link copiado!");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Criador de Sites</h2>
          <p className="text-muted-foreground">Crie sites profissionais de forma fácil e rápida</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-primary shadow-glow">
              <Plus className="mr-2 h-4 w-4" />
              Criar Site
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Criar Novo Site</DialogTitle>
              <DialogDescription>Configure as informações básicas do seu site</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Título do Site *</Label>
                <Input 
                  value={formData.title}
                  onChange={(e) => {
                    setFormData({...formData, title: e.target.value});
                    if (!formData.slug) {
                      setFormData({...formData, title: e.target.value, slug: generateSlug(e.target.value)});
                    }
                  }}
                  placeholder="Ex: Minha Empresa"
                />
              </div>

              <div className="grid gap-2">
                <Label>Slug/URL *</Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">/site/</span>
                  <Input 
                    value={formData.slug}
                    onChange={(e) => setFormData({...formData, slug: generateSlug(e.target.value)})}
                    placeholder="minha-empresa"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  URL: {window.location.origin}/site/{formData.slug || 'minha-empresa'}
                </p>
              </div>

              <div className="grid gap-2">
                <Label>Descrição</Label>
                <Textarea 
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Descrição do site..."
                  rows={3}
                />
              </div>

              <div className="grid gap-2">
                <Label>Template *</Label>
                <Select
                  value={formData.template}
                  onValueChange={(value) => setFormData({...formData, template: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        <div>
                          <div className="font-medium">{template.name}</div>
                          <div className="text-xs text-muted-foreground">{template.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>Domínio Customizado (Opcional)</Label>
                <Select
                  value={formData.custom_domain}
                  onValueChange={(value) => setFormData({...formData, custom_domain: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Usar domínio padrão" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Domínio padrão</SelectItem>
                    {customDomains.filter(d => d.is_verified).map((domain) => (
                      <SelectItem key={domain.id} value={domain.domain}>
                        ✓ {domain.domain}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {customDomains.filter(d => d.is_verified).length === 0 
                    ? "Adicione e verifique um domínio em 'Gerenciador de Domínios'" 
                    : "Selecione um domínio verificado para usar"}
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateWebsite} className="gradient-primary">
                Criar Site
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Estatísticas */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="glass hover:shadow-glow transition-smooth">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Sites</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{websites.length}</div>
            <p className="text-xs text-muted-foreground">
              {websites.filter(w => w.is_published).length} publicados
            </p>
          </CardContent>
        </Card>

        <Card className="glass hover:shadow-glow transition-smooth">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Templates</CardTitle>
            <Layout className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{templates.length}</div>
            <p className="text-xs text-muted-foreground">disponíveis</p>
          </CardContent>
        </Card>

        <Card className="glass hover:shadow-glow transition-smooth">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Domínios</CardTitle>
            <ExternalLink className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {websites.filter(w => w.custom_domain).length}
            </div>
            <p className="text-xs text-muted-foreground">customizados</p>
          </CardContent>
        </Card>

        <Card className="glass hover:shadow-glow transition-smooth">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rascunhos</CardTitle>
            <Edit className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {websites.filter(w => !w.is_published).length}
            </div>
            <p className="text-xs text-muted-foreground">não publicados</p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Sites */}
      <Card className="glass">
        <CardHeader>
          <CardTitle>Meus Sites</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Carregando...</div>
          ) : websites.length === 0 ? (
            <div className="text-center py-12">
              <Globe className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">
                Nenhum site criado ainda
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)} className="gradient-primary">
                <Plus className="mr-2 h-4 w-4" />
                Criar Primeiro Site
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {websites.map((website) => (
                <Card key={website.id} className="hover:shadow-lg transition-smooth">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-base mb-1">{website.title}</CardTitle>
                        <Badge variant={website.is_published ? 'default' : 'secondary'}>
                          {website.is_published ? 'Publicado' : 'Rascunho'}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {website.description || 'Sem descrição'}
                    </p>

                    <div className="text-sm space-y-1">
                      <div className="flex items-center gap-2">
                        <Layout className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          {templates.find(t => t.id === website.template)?.name || website.template}
                        </span>
                      </div>
                      {website.custom_domain && (
                        <div className="flex items-center gap-2">
                          <ExternalLink className="h-4 w-4 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground truncate">
                            {website.custom_domain}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => toast.info("Editor em breve!")}
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Editar
                      </Button>
                      <Button 
                        variant="outline" 
                        size="icon"
                        onClick={() => handleCopyLink(website.slug, website.custom_domain)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="icon"
                        onClick={() => {
                          const link = website.custom_domain 
                            ? `https://${website.custom_domain}`
                            : `${window.location.origin}/site/${website.slug}`;
                          window.open(link, '_blank');
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="icon"
                        onClick={() => handleDeleteWebsite(website.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
