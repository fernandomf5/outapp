import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Service {
  id: string;
  name: string;
  description: string;
}

interface ServicesStepProps {
  services: Service[];
  onChange: (services: Service[]) => void;
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

export function ServicesStep({ services, onChange }: ServicesStepProps) {
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
    onChange([...services, newService]);
  };

  const updateService = (id: string, data: Partial<Service>) => {
    onChange(services.map(s => s.id === id ? { ...s, ...data } : s));
  };

  const removeService = (id: string) => {
    onChange(services.filter(s => s.id !== id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = services.findIndex(s => s.id === active.id);
      const newIndex = services.findIndex(s => s.id === over.id);
      onChange(arrayMove(services, oldIndex, newIndex));
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold">Serviços</h2>
        <p className="text-muted-foreground">Liste os serviços que serão prestados</p>
      </div>

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
