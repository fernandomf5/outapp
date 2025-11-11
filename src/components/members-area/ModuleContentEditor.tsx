import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload, Video, File } from "lucide-react";
import { RichTextEditor } from "@/components/admin/RichTextEditor";

interface ModuleContent {
  id?: string;
  module_id: string;
  title: string;
  content_type: 'video' | 'document' | 'text';
  video_url?: string;
  document_url?: string;
  content_data?: string;
  order_index: number;
  duration?: string;
  is_active: boolean;
}

interface ModuleContentEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  moduleId: string;
  content?: ModuleContent | null;
  onSave: () => void;
}

export function ModuleContentEditor({ open, onOpenChange, moduleId, content, onSave }: ModuleContentEditorProps) {
  const [formData, setFormData] = useState<Partial<ModuleContent>>({
    module_id: moduleId,
    title: '',
    content_type: 'video',
    is_active: true,
    order_index: 0,
  });
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (content) {
      setFormData(content);
    } else {
      setFormData({
        module_id: moduleId,
        title: '',
        content_type: 'video',
        is_active: true,
        order_index: 0,
      });
    }
  }, [content, moduleId]);

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      toast.error('Por favor, selecione um arquivo de vídeo');
      return;
    }

    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${moduleId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('members-content')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('members-content')
        .getPublicUrl(fileName);

      setFormData(prev => ({ ...prev, video_url: publicUrl }));
      toast.success('Vídeo enviado com sucesso!');
    } catch (error: any) {
      toast.error('Erro ao enviar vídeo: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!validTypes.includes(file.type)) {
      toast.error('Por favor, selecione um PDF ou documento Word');
      return;
    }

    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${moduleId}/docs/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('members-content')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('members-content')
        .getPublicUrl(fileName);

      setFormData(prev => ({ ...prev, document_url: publicUrl }));
      toast.success('Documento enviado com sucesso!');
    } catch (error: any) {
      toast.error('Erro ao enviar documento: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.title) {
      toast.error('Digite o título do conteúdo');
      return;
    }

    try {
      if (content?.id) {
        const { error } = await supabase
          .from('members_area_module_contents')
          .update(formData as any)
          .eq('id', content.id);
        if (error) throw error;
        toast.success('Conteúdo atualizado!');
      } else {
        const { error } = await supabase
          .from('members_area_module_contents')
          .insert([formData as any]);
        if (error) throw error;
        toast.success('Conteúdo criado!');
      }
      onSave();
      onOpenChange(false);
    } catch (error: any) {
      toast.error('Erro ao salvar conteúdo: ' + error.message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{content ? 'Editar Conteúdo' : 'Novo Conteúdo'}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label>Tipo de Conteúdo</Label>
            <Select 
              value={formData.content_type} 
              onValueChange={(value: any) => setFormData({...formData, content_type: value})}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="video">Vídeo</SelectItem>
                <SelectItem value="document">Documento</SelectItem>
                <SelectItem value="text">Texto</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>Título</Label>
            <Input 
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              placeholder="Nome do conteúdo"
            />
          </div>

          {formData.content_type === 'video' && (
            <div className="grid gap-2">
              <Label>Vídeo</Label>
              <div className="border-2 border-dashed rounded-lg p-6 text-center">
                {formData.video_url ? (
                  <div className="space-y-2">
                    <Video className="w-12 h-12 mx-auto text-primary" />
                    <p className="text-sm text-muted-foreground">Vídeo enviado</p>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setFormData({...formData, video_url: undefined})}
                    >
                      Substituir
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="w-12 h-12 mx-auto text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      {uploading ? 'Enviando...' : 'Clique para enviar vídeo'}
                    </p>
                    <Input 
                      type="file" 
                      accept="video/*"
                      onChange={handleVideoUpload}
                      disabled={uploading}
                      className="max-w-xs mx-auto"
                    />
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Ou cole a URL do vídeo (YouTube, Vimeo, etc.)
              </p>
              <Input
                value={formData.video_url || ''}
                onChange={(e) => setFormData({...formData, video_url: e.target.value})}
                placeholder="https://youtube.com/watch?v=..."
              />
            </div>
          )}

          {formData.content_type === 'document' && (
            <div className="grid gap-2">
              <Label>Documento (PDF, Word)</Label>
              <div className="border-2 border-dashed rounded-lg p-6 text-center">
                {formData.document_url ? (
                  <div className="space-y-2">
                    <File className="w-12 h-12 mx-auto text-primary" />
                    <p className="text-sm text-muted-foreground">Documento enviado</p>
                    <div className="flex gap-2 justify-center">
                      <Button variant="outline" size="sm" asChild>
                        <a href={formData.document_url} target="_blank" rel="noopener noreferrer">
                          Ver Documento
                        </a>
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setFormData({...formData, document_url: undefined})}
                      >
                        Substituir
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="w-12 h-12 mx-auto text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      {uploading ? 'Enviando...' : 'Clique para enviar documento'}
                    </p>
                    <Input 
                      type="file" 
                      accept=".pdf,.doc,.docx"
                      onChange={handleDocumentUpload}
                      disabled={uploading}
                      className="max-w-xs mx-auto"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {formData.content_type === 'text' && (
            <div className="grid gap-2">
              <Label>Conteúdo</Label>
              <RichTextEditor 
                value={formData.content_data || ''}
                onChange={(value) => setFormData({...formData, content_data: value})}
              />
            </div>
          )}

          <div className="grid gap-2">
            <Label>Duração (opcional)</Label>
            <Input 
              value={formData.duration || ''}
              onChange={(e) => setFormData({...formData, duration: e.target.value})}
              placeholder="Ex: 10:30"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center justify-between">
              <Label>Publicado</Label>
              <Switch 
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({...formData, is_active: checked})}
              />
            </div>
            <div className="grid gap-2">
              <Label>Ordem de Exibição</Label>
              <Input 
                type="number"
                value={formData.order_index || 0}
                onChange={(e) => setFormData({...formData, order_index: parseInt(e.target.value)})}
                placeholder="0"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} className="gradient-primary">
            {content ? 'Atualizar' : 'Criar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}