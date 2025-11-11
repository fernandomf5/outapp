import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ImageUpload } from "@/components/ImageUpload";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Module {
  id?: string;
  members_area_id: string;
  title: string;
  description?: string;
  thumbnail_url?: string;
  is_active: boolean;
  is_locked?: boolean;
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
    is_active: false,
    is_locked: false,
    order_index: 0,
  });

  useEffect(() => {
    if (module) {
      setFormData(module);
    } else {
      setFormData({
        members_area_id: areaId,
        title: '',
        description: '',
        is_active: false,
        is_locked: false,
        order_index: 0,
      });
    }
  }, [module, areaId]);

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
              placeholder="Descreva o conteúdo do módulo..."
              rows={3}
            />
          </div>

          <div className="grid gap-2">
            <ImageUpload
              label="Thumbnail do Módulo"
              currentImage={formData.thumbnail_url}
              onImageSelect={(url) => setFormData({...formData, thumbnail_url: url})}
              bucketName="members-content"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center justify-between">
              <Label>Bloqueado</Label>
              <Switch 
                checked={formData.is_locked}
                onCheckedChange={(checked) => setFormData({...formData, is_locked: checked})}
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
