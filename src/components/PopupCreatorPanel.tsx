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
import { Slider } from "@/components/ui/slider";
import { CountdownTimer } from "@/components/CountdownTimer";


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
  background_color?: string;
  background_image?: string;
  background_video?: string;
  button_color?: string;
  button_text_color?: string;
  button_animation?: string;
  text_color?: string;
  image_fit?: string;
  text_align?: string;
  countdown_enabled?: boolean;
  countdown_ends_at?: string | null;
  countdown_bg_color?: string;
  countdown_text_color?: string;
  countdown_label?: string;
}

export const PopupCreatorPanel = () => {
  const [popups, setPopups] = useState<Popup[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingPopup, setEditingPopup] = useState<Popup | null>(null);
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
    background_color: '#ffffff',
    background_image: '',
    background_video: '',
    button_color: '#000000',
    button_text_color: '#ffffff',
    button_animation: 'none',
    text_color: '#000000',
    image_fit: 'cover',
    text_align: 'left',
    countdown_enabled: false,
    countdown_ends_at: '' as string,
    countdown_bg_color: '#111827',
    countdown_text_color: '#ffffff',
    countdown_label: 'Oferta termina em:',
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
      resetForm();
    } catch (error: any) {
      toast.error("Erro ao criar pop-up");
    }
  };

  const handleEditPopup = async () => {
    try {
      if (!editingPopup) return;

      const { error } = await supabase
        .from('popups')
        .update(formData)
        .eq('id', editingPopup.id);

      if (error) throw error;

      toast.success("Pop-up atualizado com sucesso!");
      setIsEditDialogOpen(false);
      setEditingPopup(null);
      loadPopups();
      resetForm();
    } catch (error: any) {
      toast.error("Erro ao atualizar pop-up");
    }
  };

  const resetForm = () => {
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
      background_color: '#ffffff',
      background_image: '',
      background_video: '',
      button_color: '#000000',
      button_text_color: '#ffffff',
      button_animation: 'none',
      text_color: '#000000',
      image_fit: 'cover',
      text_align: 'left',
      countdown_enabled: false,
      countdown_ends_at: '',
      countdown_bg_color: '#111827',
      countdown_text_color: '#ffffff',
      countdown_label: 'Oferta termina em:',
    });
  };

  const openEditDialog = (popup: Popup) => {
    setEditingPopup(popup);
    setFormData({
      name: popup.name,
      title: popup.title,
      content: popup.content,
      button_text: popup.button_text,
      button_link: popup.button_link || '',
      trigger_type: popup.trigger_type,
      delay_seconds: popup.delay_seconds || 5,
      scroll_percentage: popup.scroll_percentage || 50,
      position: popup.position,
      image_url: popup.image_url || '',
      video_url: popup.video_url || '',
      background_color: popup.background_color || '#ffffff',
      background_image: popup.background_image || '',
      background_video: popup.background_video || '',
      button_color: popup.button_color || '#000000',
      button_text_color: popup.button_text_color || '#ffffff',
      button_animation: popup.button_animation || 'none',
      text_color: popup.text_color || '#000000',
      image_fit: popup.image_fit || 'cover',
      text_align: popup.text_align || 'left',
      countdown_enabled: !!popup.countdown_enabled,
      countdown_ends_at: popup.countdown_ends_at || '',
      countdown_bg_color: popup.countdown_bg_color || '#111827',
      countdown_text_color: popup.countdown_text_color || '#ffffff',
      countdown_label: popup.countdown_label || 'Oferta termina em:',
    });
    setIsEditDialogOpen(true);
  };

  const uploadMedia = async (file: File, type: 'image' | 'video' | 'bg_image' | 'bg_video') => {
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
      } else if (type === 'video') {
        setFormData({...formData, video_url: publicUrl});
      } else if (type === 'bg_image') {
        setFormData({...formData, background_image: publicUrl});
      } else if (type === 'bg_video') {
        setFormData({...formData, background_video: publicUrl});
      }
      
      toast.success("Upload realizado com sucesso!");
    } catch (error: any) {
      toast.error("Erro ao enviar arquivo");
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
    const bgStyle = popup.background_image 
      ? `background-image: url('${popup.background_image}'); background-size: cover; background-position: center;`
      : `background-color: ${popup.background_color || '#ffffff'};`;
    
    const positionStyles: Record<string, string> = {
      'center': 'top: 50%; left: 50%; transform: translate(-50%, -50%);',
      'bottom_right': 'bottom: 20px; right: 20px;',
      'bottom_left': 'bottom: 20px; left: 20px;',
      'top_right': 'top: 20px; right: 20px;',
      'top_left': 'top: 20px; left: 20px;',
    };
    
    const code = `<!-- Pop-up: ${popup.name} -->
<script>
(function() {
  var popupShown = false;
  var popupId = '${popup.id}';
  
  function createPopup() {
    if (popupShown) return;
    popupShown = true;

    // Inject animation keyframes
    if (!document.getElementById('popup-anim-styles')) {
      var st = document.createElement('style');
      st.id = 'popup-anim-styles';
      st.innerHTML = '@keyframes popup-anim-pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.06)}}@keyframes popup-anim-bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}@keyframes popup-anim-shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-6px)}75%{transform:translateX(6px)}}@keyframes popup-anim-ring{0%,100%{transform:rotate(0)}10%,30%{transform:rotate(-12deg)}20%,40%{transform:rotate(12deg)}50%{transform:rotate(0)}}@keyframes popup-anim-glow{0%,100%{box-shadow:0 0 0 0 rgba(255,255,255,.6)}50%{box-shadow:0 0 0 12px rgba(255,255,255,0)}}.popup-anim-pulse{animation:popup-anim-pulse 1.4s ease-in-out infinite}.popup-anim-bounce{animation:popup-anim-bounce 1.2s ease-in-out infinite}.popup-anim-shake{animation:popup-anim-shake .9s ease-in-out infinite}.popup-anim-ring{animation:popup-anim-ring 1.6s ease-in-out infinite}.popup-anim-glow{animation:popup-anim-glow 1.5s ease-out infinite}';
      document.head.appendChild(st);
    }

    
    // Overlay
    var overlay = document.createElement('div');
    overlay.id = 'popup-overlay-' + popupId;
    overlay.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 99998; opacity: 0; transition: opacity 0.3s;';
    
    // Popup container
    var popup = document.createElement('div');
    popup.id = 'popup-' + popupId;
    popup.style.cssText = 'position: fixed; ${positionStyles[popup.position] || positionStyles['center']} max-width: 400px; width: 90%; padding: 24px; border-radius: 12px; box-shadow: 0 20px 50px rgba(0,0,0,0.3); z-index: 99999; opacity: 0; transition: opacity 0.3s, transform 0.3s; transform: ${popup.position === 'center' ? 'translate(-50%, -50%) scale(0.9)' : 'scale(0.9)'}; ${bgStyle}';
    
    var content = '';
    
    // Close button
    content += '<button onclick="closePopup_' + popupId.replace(/-/g, '_') + '()" style="position: absolute; top: 10px; right: 10px; background: none; border: none; font-size: 24px; cursor: pointer; color: ${popup.text_color || '#000000'}; line-height: 1;">&times;</button>';
    
    ${popup.image_url ? `
    content += '<img src="${popup.image_url}" alt="" style="display:block; width: 100%; border-radius: 8px; margin-bottom: 16px; max-height: 240px; object-fit: ${popup.image_fit || 'cover'}; ${popup.image_fit === 'contain' ? 'background:#f3f4f6;' : ''}" />';
    ` : ''}
    
    ${popup.video_url ? `
    content += '<video src="${popup.video_url}" controls style="width: 100%; border-radius: 8px; margin-bottom: 16px; max-height: 200px;"></video>';
    ` : ''}
    
    content += '<h3 style="margin: 0 0 12px 0; font-size: 20px; font-weight: bold; text-align: ${popup.text_align || 'left'}; color: ${popup.text_color || '#000000'};">${popup.title}</h3>';
    content += '<p style="margin: 0 0 16px 0; text-align: ${popup.text_align || 'left'}; color: ${popup.text_color || '#000000'}; opacity: 0.9;">${popup.content}</p>';
    
    ${popup.button_text ? `
    content += '<a href="${popup.button_link || '#'}" target="_blank" class="popup-anim-${popup.button_animation || 'none'}" style="display: block; width: 100%; padding: 12px 24px; background: ${popup.button_color || '#000000'}; color: ${popup.button_text_color || '#ffffff'}; text-align: center; text-decoration: none; border-radius: 8px; font-weight: 600; box-sizing: border-box;">${popup.button_text}</a>';
    ` : ''}
    
    popup.innerHTML = content;
    
    document.body.appendChild(overlay);
    document.body.appendChild(popup);
    
    // Animate in
    setTimeout(function() {
      overlay.style.opacity = '1';
      popup.style.opacity = '1';
      popup.style.transform = '${popup.position === 'center' ? 'translate(-50%, -50%) scale(1)' : 'scale(1)'}';
    }, 10);
    
    // Close on overlay click
    overlay.onclick = function() { closePopup_${popup.id.replace(/-/g, '_')}(); };
    
    // Track view
    try {
      fetch('https://iavhzfawrqewzokuvnob.supabase.co/rest/v1/popups?id=eq.${popup.id}', {
        method: 'PATCH',
        headers: {
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlhdmh6ZmF3cnFld3pva3V2bm9iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc5NzU3NTksImV4cCI6MjA2MzU1MTc1OX0.HJPS71Oo0r01VLUNKQVoXcQ2bNqTNY8FBYHXMWpWHAI',
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({ views: ${popup.views + 1} })
      });
    } catch(e) {}
  }
  
  window.closePopup_${popup.id.replace(/-/g, '_')} = function() {
    var overlay = document.getElementById('popup-overlay-' + popupId);
    var popup = document.getElementById('popup-' + popupId);
    if (overlay) { overlay.style.opacity = '0'; setTimeout(function() { overlay.remove(); }, 300); }
    if (popup) { popup.style.opacity = '0'; popup.style.transform = '${popup.position === 'center' ? 'translate(-50%, -50%) scale(0.9)' : 'scale(0.9)'}'; setTimeout(function() { popup.remove(); }, 300); }
  };
  
  ${popup.trigger_type === 'time_delay' ? `
  // Trigger: Time delay
  setTimeout(createPopup, ${(popup.delay_seconds || 5) * 1000});
  ` : ''}
  
  ${popup.trigger_type === 'scroll' ? `
  // Trigger: Scroll percentage
  var scrollTriggered = false;
  window.addEventListener('scroll', function() {
    if (scrollTriggered) return;
    var scrollPercent = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
    if (scrollPercent >= ${popup.scroll_percentage || 50}) {
      scrollTriggered = true;
      createPopup();
    }
  });
  ` : ''}
  
  ${popup.trigger_type === 'exit_intent' ? `
  // Trigger: Exit intent
  document.addEventListener('mouseout', function(e) {
    if (!e.toElement && !e.relatedTarget && e.clientY < 10) {
      createPopup();
    }
  });
  ` : ''}
  
  ${popup.trigger_type === 'manual' ? `
  // Trigger: Manual - call window.showPopup_${popup.id.replace(/-/g, '_')}() to show
  window.showPopup_${popup.id.replace(/-/g, '_')} = createPopup;
  ` : ''}
})();
</script>`;
    
    navigator.clipboard.writeText(code);
    toast.success("Código copiado! Cole no head, body ou footer do seu site.");
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

  const renderPopupPreview = (data: typeof formData) => {
    const bgStyle: React.CSSProperties = {
      backgroundColor: data.background_color,
    };

    if (data.background_image) {
      bgStyle.backgroundImage = `url(${data.background_image})`;
      bgStyle.backgroundSize = 'cover';
      bgStyle.backgroundPosition = 'center';
    }

    return (
      <div className="relative p-6 rounded-lg" style={bgStyle}>
        {data.background_video && (
          <video 
            autoPlay 
            loop 
            muted 
            className="absolute inset-0 w-full h-full object-cover rounded-lg"
            src={data.background_video}
          />
        )}
        <div className="relative z-10">
          {data.image_url && (
            <div
              className="w-full rounded-lg mb-4 overflow-hidden bg-muted flex items-center justify-center"
              style={{ maxHeight: '12rem' }}
            >
              <img
                src={data.image_url}
                alt="Conteúdo"
                className="w-full"
                style={{
                  objectFit: (data.image_fit as any) || 'cover',
                  maxHeight: '12rem',
                  width: data.image_fit === 'contain' ? 'auto' : '100%',
                }}
              />
            </div>
          )}
          {data.video_url && (
            <video 
              src={data.video_url} 
              controls 
              className="w-full rounded-lg max-h-48 mb-4"
            />
          )}
          {data.countdown_enabled && data.countdown_ends_at && (
            <CountdownTimer
              endsAt={data.countdown_ends_at}
              label={data.countdown_label}
              bgColor={data.countdown_bg_color}
              textColor={data.countdown_text_color}
              className="mb-3"
            />
          )}
          <h3 className="text-xl font-bold mb-2" style={{ color: data.text_color, textAlign: (data.text_align as any) || 'left' }}>{data.title || "Título do Pop-up"}</h3>
          <p className="mb-4" style={{ color: data.text_color, textAlign: (data.text_align as any) || 'left' }}>{data.content || "Conteúdo do pop-up aparecerá aqui..."}</p>
          {data.button_text && (
            <Button 
              style={{ 
                backgroundColor: data.button_color,
                color: data.button_text_color || '#ffffff'
              }}
              className={`w-full ${data.button_animation && data.button_animation !== 'none' ? `popup-anim-${data.button_animation}` : ''}`}
            >
              {data.button_text}
            </Button>
          )}
        </div>
      </div>
    );
  };

  const renderFormFields = () => (
    <div className="grid gap-4 py-4">
      <Tabs defaultValue="content" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="content">Conteúdo</TabsTrigger>
          <TabsTrigger value="design">Design</TabsTrigger>
          <TabsTrigger value="settings">Configurações</TabsTrigger>
        </TabsList>
        
        <TabsContent value="content" className="space-y-4 mt-4">
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
              rows={6}
              className="resize-none"
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
            <Label>Imagem do Conteúdo (opcional)</Label>
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
          </div>

          <div className="grid gap-2">
            <Label>Vídeo do Conteúdo (opcional)</Label>
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
          </div>
        </TabsContent>

        <TabsContent value="design" className="space-y-4 mt-4">
          <div className="grid gap-2">
            <Label>Cor de Fundo</Label>
            <div className="flex gap-2">
              <Input 
                type="color"
                value={formData.background_color}
                onChange={(e) => setFormData({...formData, background_color: e.target.value})}
                className="w-20 h-10"
              />
              <Input 
                value={formData.background_color}
                onChange={(e) => setFormData({...formData, background_color: e.target.value})}
                placeholder="#ffffff"
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Imagem de Fundo (opcional)</Label>
            <Input 
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) uploadMedia(file, 'bg_image');
              }}
              disabled={uploadingMedia}
            />
            {formData.background_image && (
              <div className="relative w-full h-32 border rounded overflow-hidden">
                <img 
                  src={formData.background_image} 
                  alt="Background" 
                  className="w-full h-full object-cover"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={() => setFormData({...formData, background_image: ''})}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>

          <div className="grid gap-2">
            <Label>Vídeo de Fundo (opcional)</Label>
            <Input 
              type="file"
              accept="video/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) uploadMedia(file, 'bg_video');
              }}
              disabled={uploadingMedia}
            />
            {formData.background_video && (
              <div className="relative w-full h-32 border rounded overflow-hidden">
                <video 
                  src={formData.background_video} 
                  className="w-full h-full object-cover"
                  controls
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={() => setFormData({...formData, background_video: ''})}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>

          <div className="grid gap-2">
            <Label>Cor do Texto</Label>
            <div className="flex gap-2">
              <Input 
                type="color"
                value={formData.text_color}
                onChange={(e) => setFormData({...formData, text_color: e.target.value})}
                className="w-20 h-10"
              />
              <Input 
                value={formData.text_color}
                onChange={(e) => setFormData({...formData, text_color: e.target.value})}
                placeholder="#000000"
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Cor do Botão</Label>
            <div className="flex gap-2">
              <Input 
                type="color"
                value={formData.button_color}
                onChange={(e) => setFormData({...formData, button_color: e.target.value})}
                className="w-20 h-10"
              />
              <Input 
                value={formData.button_color}
                onChange={(e) => setFormData({...formData, button_color: e.target.value})}
                placeholder="#000000"
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Cor do Texto do Botão</Label>
            <div className="flex gap-2">
              <Input
                type="color"
                value={formData.button_text_color}
                onChange={(e) => setFormData({...formData, button_text_color: e.target.value})}
                className="w-20 h-10"
              />
              <Input
                value={formData.button_text_color}
                onChange={(e) => setFormData({...formData, button_text_color: e.target.value})}
                placeholder="#ffffff"
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Animação do Botão (destaque)</Label>
            <Select
              value={formData.button_animation}
              onValueChange={(value) => setFormData({...formData, button_animation: value})}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhuma</SelectItem>
                <SelectItem value="pulse">Pulsar</SelectItem>
                <SelectItem value="bounce">Pra cima e pra baixo</SelectItem>
                <SelectItem value="shake">Ir e voltar (lado a lado)</SelectItem>
                <SelectItem value="ring">Tocando como telefone</SelectItem>
                <SelectItem value="glow">Brilho destacado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>Exibição da Imagem</Label>
            <Select
              value={formData.image_fit}
              onValueChange={(value) => setFormData({...formData, image_fit: value})}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cover">Encaixada (cortada)</SelectItem>
                <SelectItem value="contain">Completa (imagem inteira)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>Alinhamento do Texto (título e conteúdo)</Label>
            <Select
              value={formData.text_align}
              onValueChange={(value) => setFormData({...formData, text_align: value})}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="left">Esquerda</SelectItem>
                <SelectItem value="center">Centralizado</SelectItem>
                <SelectItem value="right">Direita</SelectItem>
              </SelectContent>
            </Select>
          </div>


          <div className="border-t pt-4 mt-4">
            <Label className="mb-3 block">Preview em Tempo Real</Label>
            {renderPopupPreview(formData)}
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4 mt-4">
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
              <Label>Tempo de Espera: {formData.delay_seconds}s</Label>
              <Slider
                value={[formData.delay_seconds]}
                onValueChange={(value) => setFormData({...formData, delay_seconds: value[0]})}
                min={1}
                max={60}
                step={1}
              />
            </div>
          )}
          {formData.trigger_type === 'scroll' && (
            <div className="grid gap-2">
              <Label>Porcentagem de Rolagem: {formData.scroll_percentage}%</Label>
              <Slider
                value={[formData.scroll_percentage]}
                onValueChange={(value) => setFormData({...formData, scroll_percentage: value[0]})}
                min={0}
                max={100}
                step={5}
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
        </TabsContent>
      </Tabs>
    </div>
  );

  return (
    <div className="space-y-6">
      <style>{`
        @keyframes popup-anim-pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.06)} }
        @keyframes popup-anim-bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes popup-anim-shake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-6px)} 75%{transform:translateX(6px)} }
        @keyframes popup-anim-ring { 0%,100%{transform:rotate(0)} 10%,30%{transform:rotate(-12deg)} 20%,40%{transform:rotate(12deg)} 50%{transform:rotate(0)} }
        @keyframes popup-anim-glow { 0%,100%{box-shadow:0 0 0 0 rgba(255,255,255,0.6)} 50%{box-shadow:0 0 0 12px rgba(255,255,255,0)} }
        .popup-anim-pulse{animation:popup-anim-pulse 1.4s ease-in-out infinite;transform-origin:center}
        .popup-anim-bounce{animation:popup-anim-bounce 1.2s ease-in-out infinite}
        .popup-anim-shake{animation:popup-anim-shake 0.9s ease-in-out infinite}
        .popup-anim-ring{animation:popup-anim-ring 1.6s ease-in-out infinite;transform-origin:center}
        .popup-anim-glow{animation:popup-anim-glow 1.5s ease-out infinite}
      `}</style>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Criador de Pop-ups</h2>
          <p className="text-muted-foreground">Crie pop-ups inteligentes para aumentar conversões</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-primary shadow-glow" onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" />
              Criar Pop-up
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Criar Novo Pop-up</DialogTitle>
              <DialogDescription>Configure seu pop-up personalizado</DialogDescription>
            </DialogHeader>
            {renderFormFields()}
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
                        onClick={() => openEditDialog(popup)}
                        title="Editar"
                      >
                        <Edit className="h-4 w-4" />
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

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Pop-up</DialogTitle>
            <DialogDescription>Atualize as configurações do seu pop-up</DialogDescription>
          </DialogHeader>
          {renderFormFields()}
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsEditDialogOpen(false);
              setEditingPopup(null);
              resetForm();
            }}>
              Cancelar
            </Button>
            <Button onClick={handleEditPopup} className="gradient-primary">
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      {previewPopup && (
        <Dialog open={!!previewPopup} onOpenChange={() => setPreviewPopup(null)}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Preview: {previewPopup.name}</DialogTitle>
            </DialogHeader>
            {renderPopupPreview({
              ...previewPopup,
              name: previewPopup.name,
              title: previewPopup.title,
              content: previewPopup.content,
              button_text: previewPopup.button_text,
              button_link: previewPopup.button_link || '',
              trigger_type: previewPopup.trigger_type,
              delay_seconds: previewPopup.delay_seconds || 5,
              scroll_percentage: previewPopup.scroll_percentage || 50,
              position: previewPopup.position,
              image_url: previewPopup.image_url || '',
              video_url: previewPopup.video_url || '',
              background_color: previewPopup.background_color || '#ffffff',
              background_image: previewPopup.background_image || '',
              background_video: previewPopup.background_video || '',
              button_color: previewPopup.button_color || '#000000',
              button_text_color: previewPopup.button_text_color || '#ffffff',
              button_animation: previewPopup.button_animation || 'none',
              text_color: previewPopup.text_color || '#000000',
              image_fit: previewPopup.image_fit || 'cover',
              text_align: previewPopup.text_align || 'left',
              countdown_enabled: !!previewPopup.countdown_enabled,
              countdown_ends_at: previewPopup.countdown_ends_at || '',
              countdown_bg_color: previewPopup.countdown_bg_color || '#111827',
              countdown_text_color: previewPopup.countdown_text_color || '#ffffff',
              countdown_label: previewPopup.countdown_label || 'Oferta termina em:',
            })}
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
