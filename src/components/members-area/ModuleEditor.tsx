import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ImageUpload } from "@/components/ImageUpload";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload, Video, FileText } from "lucide-react";

interface Module {
  id?: string;
  members_area_id: string;
  title: string;
  description?: string;
  thumbnail_url?: string;
  video_url?: string;
  content_type: 'video' | 'document' | 'text';
  content_data?: string;
  category?: string;
  is_free: boolean;
  price?: number;
  is_active: boolean;
  order_index: number;
}

interface ModuleEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  areaId: string;
  module?: Module | null;
  onSave: () => void;
}

export function ModuleEditor({ open, onOpenChange, areaId, module, onSave }: ModuleEditorProps) {
  const [formData, setFormData] = useState<Partial<Module>>({
    members_area_id: areaId,
    title: '',
    description: '',
    content_type: 'video',
    is_free: true,
    is_active: false,
    order_index: 0,
  });
  const [uploading, setUploading] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    if (module) {
      setFormData(module);
    } else {
      setFormData({
        members_area_id: areaId,
        title: '',
        description: '',
        content_type: 'video',
        is_free: true,
        is_active: false,
        order_index: 0,
      });
    }
  }, [module, areaId]);

  useEffect(() => {
    loadCategories();
  }, [areaId]);

  const loadCategories = async () => {
    const { data } = await supabase
      .from('members_area_modules' as any)
      .select('category')
      .eq('members_area_id', areaId)
      .not('category', 'is', null);
    
    if (data) {
      const uniqueCategories = [...new Set((data as any[]).map(d => d.category).filter(Boolean))];
      setCategories(uniqueCategories);
    }
  };

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
      const fileName = `${user.id}/${areaId}/${Date.now()}.${fileExt}`;

      const { error: uploadError, data } = await supabase.storage
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

  const handleSave = async () => {
    if (!formData.title) {
      toast.error('Digite o título do módulo');
      return;
    }

    try {
      if (module?.id) {
        const { error } = await supabase
          .from('members_area_modules')
          .update(formData as any)
          .eq('id', module.id);
        if (error) throw error;
        toast.success('Módulo atualizado!');
      } else {
        const { error } = await supabase
          .from('members_area_modules')
          .insert([formData as any]);
        if (error) throw error;
        toast.success('Módulo criado!');
      }
      onSave();
      onOpenChange(false);
    } catch (error: any) {
      toast.error('Erro ao salvar módulo: ' + error.message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{module ? 'Editar Módulo' : 'Novo Módulo'}</DialogTitle>
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
              placeholder="Nome do módulo"
            />
          </div>

          <div className="grid gap-2">
            <Label>Descrição</Label>
            <Textarea 
              value={formData.description || ''}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Descreva o conteúdo..."
              rows={3}
            />
          </div>

          <div className="grid gap-2">
            <Label>Categoria (opcional)</Label>
            <div className="flex gap-2">
              <Select 
                value={formData.category || ''} 
                onValueChange={(value) => setFormData({...formData, category: value})}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Selecione ou crie nova" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input 
                placeholder="Nova categoria"
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                className="flex-1"
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Thumbnail</Label>
            <ImageUpload
              currentImage={formData.thumbnail_url || ''}
              onImageSelect={(url) => setFormData({...formData, thumbnail_url: url})}
              bucketName="members-content"
              label="Thumbnail"
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
            </div>
          )}

          {formData.content_type === 'text' && (
            <div className="grid gap-2">
              <Label>Conteúdo (Markdown)</Label>
              <Textarea 
                value={formData.content_data || ''}
                onChange={(e) => setFormData({...formData, content_data: e.target.value})}
                placeholder="Digite o conteúdo em markdown..."
                rows={8}
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center justify-between">
              <Label>Conteúdo Gratuito</Label>
              <Switch 
                checked={formData.is_free}
                onCheckedChange={(checked) => setFormData({...formData, is_free: checked})}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Publicado</Label>
              <Switch 
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({...formData, is_active: checked})}
              />
            </div>
          </div>

          {!formData.is_free && (
            <div className="grid gap-2">
              <Label>Preço (R$)</Label>
              <Input 
                type="number"
                value={formData.price || ''}
                onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value)})}
                placeholder="0.00"
                step="0.01"
              />
            </div>
          )}

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

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} className="gradient-primary">
            {module ? 'Atualizar' : 'Criar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
