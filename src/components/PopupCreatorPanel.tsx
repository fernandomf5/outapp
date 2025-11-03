import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Maximize2, 
  Plus,
  Eye,
  Trash2,
  Edit,
  Copy,
  Timer,
  MousePointerClick,
  X
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Popup {
  id: string;
  name: string;
  title: string;
  content: string;
  button_text: string;
  button_link?: string;
  trigger_type: 'time_delay' | 'scroll' | 'exit_intent' | 'manual';
  delay_seconds?: number;
  scroll_percentage?: number;
  position: 'center' | 'bottom_right' | 'bottom_left' | 'top_right' | 'top_left';
  is_active: boolean;
  views: number;
  clicks: number;
  created_at: string;
  image_url?: string;
  video_url?: string;
}

export const PopupCreatorPanel = () => {
  const [popups, setPopups] = useState<Popup[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [previewPopup, setPreviewPopup] = useState<Popup | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    title: '',
    content: '',
    button_text: 'Clique Aqui',
    button_link: '',
    trigger_type: 'time_delay' as 'time_delay' | 'scroll' | 'exit_intent' | 'manual',
    delay_seconds: 5,
    scroll_percentage: 50,
    position: 'center' as 'center' | 'bottom_right' | 'bottom_left' | 'top_right' | 'top_left',
    image_url: '',
    video_url: '',
  });
  
  const [uploadingMedia, setUploadingMedia] = useState(false);

  useEffect(() => {
    loadPopups();
  }, []);

  const loadPopups = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('popups')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPopups(data as any || []);
    } catch (error: any) {
      toast.error("Erro ao carregar pop-ups");
    } finally {
      setLoading(false);
    }
  };

  const handleAddPopup = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('popups')
        .insert([{
          user_id: user.id,
          ...formData,
          is_active: true,
          views: 0,
          clicks: 0
        }]);

      if (error) throw error;

      toast.success("Pop-up criado com sucesso!");
      setIsAddDialogOpen(false);
      loadPopups();
      
      setFormData({
        name: '',
        title: '',
        content: '',
        button_text: 'Clique Aqui',
        button_link: '',
        trigger_type: 'time_delay',
        delay_seconds: 5,
        scroll_percentage: 50,
        position: 'center',
        image_url: '',
        video_url: '',
      });
    } catch (error: any) {
      toast.error("Erro ao criar pop-up");
    }
  };

  const uploadMedia = async (file: File, type: 'image' | 'video') => {
    setUploadingMedia(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/popup-${type}-${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('chatbot-media')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('chatbot-media')
        .getPublicUrl(fileName);

      if (type === 'image') {
        setFormData({...formData, image_url: publicUrl});
      } else {
        setFormData({...formData, video_url: publicUrl});
      }
      
      toast.success(`${type === 'image' ? 'Imagem' : 'Vídeo'} enviado com sucesso!`);
    } catch (error: any) {
      toast.error(`Erro ao enviar ${type === 'image' ? 'imagem' : 'vídeo'}`);
    } finally {
      setUploadingMedia(false);
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('popups')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;

      toast.success(`Pop-up ${!currentStatus ? 'ativado' : 'desativado'}!`);
      loadPopups();
    } catch (error: any) {
      toast.error("Erro ao atualizar status");
    }
  };

  const handleDeletePopup = async (id: string) => {
    try {
      const { error } = await supabase
        .from('popups')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success("Pop-up excluído!");
      loadPopups();
    } catch (error: any) {
      toast.error("Erro ao excluir pop-up");
    }
  };

  const handleCopyCode = (popup: Popup) => {
    const code = `<script>
  // Copiar este código para o seu site
  window.addEventListener('load', function() {
    ${popup.trigger_type === 'time_delay' ? `
    setTimeout(function() {
      showPopup('${popup.id}');
    }, ${popup.delay_seconds! * 1000});
    ` : ''}
    ${popup.trigger_type === 'scroll' ? `
    window.addEventListener('scroll', function() {
      var scrollPercent = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
      if (scrollPercent >= ${popup.scroll_percentage}) {
        showPopup('${popup.id}');
      }
    });
    ` : ''}
  });
</script>`;
    navigator.clipboard.writeText(code);
    toast.success("Código copiado!");
  };

  const totalViews = popups.reduce((sum, p) => sum + p.views, 0);
  const totalClicks = popups.reduce((sum, p) => sum + p.clicks, 0);
  const avgConversion = totalViews > 0 ? (totalClicks / totalViews) * 100 : 0;

  const getTriggerLabel = (type: string) => {
    switch(type) {
      case 'time_delay': return 'Tempo (segundos)';
      case 'scroll': return 'Rolagem (%)';
      case 'exit_intent': return 'Saída';
      case 'manual': return 'Manual';
      default: return type;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Criador de Pop-ups</h2>
          <p className="text-muted-foreground">Crie pop-ups inteligentes para aumentar conversões</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-primary shadow-glow">
              <Plus className="mr-2 h-4 w-4" />
              Criar Pop-up
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Criar Novo Pop-up</DialogTitle>
              <DialogDescription>Configure seu pop-up personalizado</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Nome Interno</Label>
                <Input 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Ex: Desconto Black Friday"
                />
              </div>
              <div className="grid gap-2">
                <Label>Título do Pop-up</Label>
                <Input 
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  placeholder="Ex: Oferta Especial!"
                />
              </div>
              <div className="grid gap-2">
                <Label>Conteúdo</Label>
                <Textarea 
                  value={formData.content}
                  onChange={(e) => setFormData({...formData, content: e.target.value})}
                  placeholder="Sua mensagem aqui..."
                  rows={4}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Texto do Botão</Label>
                  <Input 
                    value={formData.button_text}
                    onChange={(e) => setFormData({...formData, button_text: e.target.value})}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Link do Botão</Label>
                  <Input 
                    value={formData.button_link}
                    onChange={(e) => setFormData({...formData, button_link: e.target.value})}
                    placeholder="https://..."
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Tipo de Gatilho</Label>
                <Select value={formData.trigger_type} onValueChange={(value: any) => setFormData({...formData, trigger_type: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="time_delay">Tempo (após X segundos)</SelectItem>
                    <SelectItem value="scroll">Rolagem (após X%)</SelectItem>
                    <SelectItem value="exit_intent">Intenção de Saída</SelectItem>
                    <SelectItem value="manual">Manual (via código)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {formData.trigger_type === 'time_delay' && (
                <div className="grid gap-2">
                  <Label>Tempo de Espera (segundos)</Label>
                  <Input 
                    type="number"
                    value={formData.delay_seconds}
                    onChange={(e) => setFormData({...formData, delay_seconds: parseInt(e.target.value)})}
                  />
                </div>
              )}
              {formData.trigger_type === 'scroll' && (
                <div className="grid gap-2">
                  <Label>Porcentagem de Rolagem (%)</Label>
                  <Input 
                    type="number"
                    value={formData.scroll_percentage}
                    onChange={(e) => setFormData({...formData, scroll_percentage: parseInt(e.target.value)})}
                  />
                </div>
              )}
              <div className="grid gap-2">
                <Label>Posição na Tela</Label>
                <Select value={formData.position} onValueChange={(value: any) => setFormData({...formData, position: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="center">Centro</SelectItem>
                    <SelectItem value="bottom_right">Inferior Direito</SelectItem>
                    <SelectItem value="bottom_left">Inferior Esquerdo</SelectItem>
                    <SelectItem value="top_right">Superior Direito</SelectItem>
                    <SelectItem value="top_left">Superior Esquerdo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>Imagem do Pop-up (opcional)</Label>
                <div className="space-y-2">
                  <Input 
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) uploadMedia(file, 'image');
                    }}
                    disabled={uploadingMedia}
                  />
                  {formData.image_url && (
                    <div className="relative w-full h-32 border rounded overflow-hidden">
                      <img 
                        src={formData.image_url} 
                        alt="Preview" 
                        className="w-full h-full object-cover"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => setFormData({...formData, image_url: ''})}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {uploadingMedia ? "Enviando..." : "A imagem aparecerá no pop-up"}
                  </p>
                </div>
              </div>

              <div className="grid gap-2">
                <Label>Vídeo do Pop-up (opcional)</Label>
                <div className="space-y-2">
                  <Input 
                    type="file"
                    accept="video/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) uploadMedia(file, 'video');
                    }}
                    disabled={uploadingMedia}
                  />
                  {formData.video_url && (
                    <div className="relative w-full h-32 border rounded overflow-hidden">
                      <video 
                        src={formData.video_url} 
                        className="w-full h-full object-cover"
                        controls
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => setFormData({...formData, video_url: ''})}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {uploadingMedia ? "Enviando..." : "O vídeo aparecerá no pop-up"}
                  </p>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleAddPopup} className="gradient-primary">
                Criar Pop-up
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Estatísticas */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="glass hover:shadow-glow transition-smooth">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Pop-ups</CardTitle>
            <Maximize2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{popups.length}</div>
            <p className="text-xs text-muted-foreground">
              {popups.filter(p => p.is_active).length} ativos
            </p>
          </CardContent>
        </Card>

        <Card className="glass hover:shadow-glow transition-smooth">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Visualizações</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalViews.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">impressões totais</p>
          </CardContent>
        </Card>

        <Card className="glass hover:shadow-glow transition-smooth">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cliques</CardTitle>
            <MousePointerClick className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalClicks.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">conversões</p>
          </CardContent>
        </Card>

        <Card className="glass hover:shadow-glow transition-smooth">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
            <Timer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{avgConversion.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">média</p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Pop-ups */}
      <Card className="glass">
        <CardHeader>
          <CardTitle>Meus Pop-ups</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Carregando...</div>
          ) : popups.length === 0 ? (
            <div className="text-center py-12">
              <Maximize2 className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">
                Nenhum pop-up criado ainda
              </p>
              <Button onClick={() => setIsAddDialogOpen(true)} className="gradient-primary">
                <Plus className="mr-2 h-4 w-4" />
                Criar Primeiro Pop-up
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {popups.map((popup) => (
                <Card key={popup.id} className="p-4 hover:shadow-lg transition-smooth">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-lg">{popup.name}</h3>
                        <Badge variant={popup.is_active ? 'default' : 'secondary'}>
                          {popup.is_active ? 'Ativo' : 'Inativo'}
                        </Badge>
                        <Badge variant="outline">
                          {getTriggerLabel(popup.trigger_type)}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{popup.title}</p>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Visualizações</p>
                          <p className="font-semibold">{popup.views.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Cliques</p>
                          <p className="font-semibold">{popup.clicks.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Conversão</p>
                          <p className="font-semibold text-success">
                            {popup.views > 0 ? ((popup.clicks / popup.views) * 100).toFixed(1) : 0}%
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <Button 
                        variant="outline" 
                        size="icon"
                        onClick={() => setPreviewPopup(popup)}
                        title="Visualizar"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="icon"
                        onClick={() => handleCopyCode(popup)}
                        title="Copiar Código"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Switch 
                        checked={popup.is_active}
                        onCheckedChange={() => handleToggleActive(popup.id, popup.is_active)}
                      />
                      <Button 
                        variant="outline" 
                        size="icon"
                        onClick={() => handleDeletePopup(popup.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      {previewPopup && (
        <Dialog open={!!previewPopup} onOpenChange={() => setPreviewPopup(null)}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{previewPopup.title}</DialogTitle>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 top-4"
                onClick={() => setPreviewPopup(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogHeader>
            <div className="py-4">
              <p className="text-muted-foreground mb-4">{previewPopup.content}</p>
              <Button className="w-full gradient-primary">
                {previewPopup.button_text}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
