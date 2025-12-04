import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Plus, Trash2, GripVertical, Image, X, Play } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ImageUpload } from '@/components/ImageUpload';

interface Service {
  id: string;
  name: string;
  description: string;
  image_url?: string;
}

interface ServicesStepProps {
  services: Service[];
  autoCarousel?: boolean;
  onChange: (services: Service[], autoCarousel?: boolean) => void;
}

function SortableServiceItem({ 
  service, 
  onUpdate, 
  onRemove 
}: { 
  service: Service; 
  onUpdate: (id: string, data: Partial<Service>) => void;
  onRemove: (id: string) => void;
}) {
  const [showImageUpload, setShowImageUpload] = useState(false);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: service.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <Card ref={setNodeRef} style={style} className="mb-3">
      <CardContent className="p-4">
        <div className="flex gap-3">
          <div {...attributes} {...listeners} className="cursor-grab hover:bg-muted rounded p-1 self-start mt-2">
            <GripVertical className="h-5 w-5 text-muted-foreground" />
          </div>
          
          <div className="flex-1 space-y-3">
            <Input
              value={service.name}
              onChange={(e) => onUpdate(service.id, { name: e.target.value })}
              placeholder="Nome do serviço"
              className="font-medium"
            />
            <Textarea
              value={service.description}
              onChange={(e) => onUpdate(service.id, { description: e.target.value })}
              placeholder="Descreva o serviço em detalhes..."
              rows={3}
            />
            
            {/* Image Section */}
            {service.image_url ? (
              <div className="relative group">
                <img 
                  src={service.image_url} 
                  alt={service.name} 
                  className="w-full h-32 object-cover rounded-lg border"
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => onUpdate(service.id, { image_url: undefined })}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : showImageUpload ? (
              <div className="border border-dashed rounded-lg p-3">
                <ImageUpload
                  currentImage={null}
                  onImageSelect={(url) => {
                    onUpdate(service.id, { image_url: url });
                    setShowImageUpload(false);
                  }}
                  bucketName="portfolio-images"
                />
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="mt-2 w-full"
                  onClick={() => setShowImageUpload(false)}
                >
                  Cancelar
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => setShowImageUpload(true)}
              >
                <Image className="h-4 w-4" />
                Adicionar Imagem
              </Button>
            )}
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onRemove(service.id)}
            className="text-destructive hover:text-destructive self-start"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function ServicesStep({ services, autoCarousel = false, onChange }: ServicesStepProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const addService = () => {
    const newService: Service = {
      id: crypto.randomUUID(),
      name: '',
      description: '',
    };
    onChange([...services, newService], autoCarousel);
  };

  const updateService = (id: string, data: Partial<Service>) => {
    onChange(services.map(s => s.id === id ? { ...s, ...data } : s), autoCarousel);
  };

  const removeService = (id: string) => {
    onChange(services.filter(s => s.id !== id), autoCarousel);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = services.findIndex(s => s.id === active.id);
      const newIndex = services.findIndex(s => s.id === over.id);
      onChange(arrayMove(services, oldIndex, newIndex), autoCarousel);
    }
  };

  const servicesWithImages = services.filter(s => s.image_url);

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold">Serviços</h2>
        <p className="text-muted-foreground">Liste os serviços que serão prestados (você pode adicionar imagens)</p>
      </div>

      {servicesWithImages.length > 1 && (
        <Card className="border-dashed">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Play className="h-5 w-5 text-primary" />
                <div>
                  <Label htmlFor="auto-carousel" className="font-medium">Carrossel Automático</Label>
                  <p className="text-sm text-muted-foreground">Passar imagens automaticamente na apresentação</p>
                </div>
              </div>
              <Switch
                id="auto-carousel"
                checked={autoCarousel}
                onCheckedChange={(checked) => onChange(services, checked)}
              />
            </div>
          </CardContent>
        </Card>
      )}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={services.map(s => s.id)} strategy={verticalListSortingStrategy}>
          {services.map(service => (
            <SortableServiceItem
              key={service.id}
              service={service}
              onUpdate={updateService}
              onRemove={removeService}
            />
          ))}
        </SortableContext>
      </DndContext>

      <Button onClick={addService} variant="outline" className="w-full">
        <Plus className="h-4 w-4 mr-2" />
        Adicionar Serviço
      </Button>
    </div>
  );
}
