import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface TimelineItem {
  id: string;
  phase: string;
  duration: string;
  deliverables: string;
}

interface TimelineStepProps {
  timeline: TimelineItem[];
  onChange: (timeline: TimelineItem[]) => void;
}

function SortableTimelineItem({ 
  item, 
  index,
  onUpdate, 
  onRemove 
}: { 
  item: TimelineItem; 
  index: number;
  onUpdate: (id: string, data: Partial<TimelineItem>) => void;
  onRemove: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <Card ref={setNodeRef} style={style} className="mb-3">
      <CardContent className="p-4">
        <div className="flex gap-3 items-start">
          <div {...attributes} {...listeners} className="cursor-grab hover:bg-muted rounded p-1 mt-2">
            <GripVertical className="h-5 w-5 text-muted-foreground" />
          </div>
          
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold shrink-0">
            {index + 1}
          </div>
          
          <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
            <Input
              value={item.phase}
              onChange={(e) => onUpdate(item.id, { phase: e.target.value })}
              placeholder="Fase/Etapa"
            />
            <Input
              value={item.duration}
              onChange={(e) => onUpdate(item.id, { duration: e.target.value })}
              placeholder="Duração (ex: 2 semanas)"
            />
            <Input
              value={item.deliverables}
              onChange={(e) => onUpdate(item.id, { deliverables: e.target.value })}
              placeholder="Entregáveis"
            />
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onRemove(item.id)}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function TimelineStep({ timeline, onChange }: TimelineStepProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const addItem = () => {
    const newItem: TimelineItem = {
      id: crypto.randomUUID(),
      phase: '',
      duration: '',
      deliverables: '',
    };
    onChange([...timeline, newItem]);
  };

  const updateItem = (id: string, data: Partial<TimelineItem>) => {
    onChange(timeline.map(t => t.id === id ? { ...t, ...data } : t));
  };

  const removeItem = (id: string) => {
    onChange(timeline.filter(t => t.id !== id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = timeline.findIndex(t => t.id === active.id);
      const newIndex = timeline.findIndex(t => t.id === over.id);
      onChange(arrayMove(timeline, oldIndex, newIndex));
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold">Cronograma</h2>
        <p className="text-muted-foreground">Defina as etapas e prazos do projeto</p>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={timeline.map(t => t.id)} strategy={verticalListSortingStrategy}>
          {timeline.map((item, index) => (
            <SortableTimelineItem
              key={item.id}
              item={item}
              index={index}
              onUpdate={updateItem}
              onRemove={removeItem}
            />
          ))}
        </SortableContext>
      </DndContext>

      <Button onClick={addItem} variant="outline" className="w-full">
        <Plus className="h-4 w-4 mr-2" />
        Adicionar Etapa
      </Button>
    </div>
  );
}
