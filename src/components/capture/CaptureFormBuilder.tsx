import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { GripVertical, Trash2, Plus, ChevronDown } from "lucide-react";
import { useState } from "react";
import { CaptureField, FIELD_TYPES, makeField, getFieldDef, CaptureFieldType } from "./captureTypes";

interface Props {
  fields: CaptureField[];
  onChange: (fields: CaptureField[]) => void;
}

const SortableField = ({
  field,
  onUpdate,
  onDelete,
}: {
  field: CaptureField;
  onUpdate: (patch: Partial<CaptureField>) => void;
  onDelete: () => void;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: field.id });
  const [open, setOpen] = useState(false);
  const def = getFieldDef(field.type);
  const Icon = def.icon;

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`rounded-lg border bg-card ${isDragging ? "opacity-60 ring-2 ring-primary" : ""}`}
    >
      <div className="flex items-center gap-2 p-2">
        <button type="button" className="cursor-grab touch-none text-muted-foreground" {...attributes} {...listeners}>
          <GripVertical className="h-4 w-4" />
        </button>
        <Icon className="h-4 w-4 text-primary shrink-0" />
        <button type="button" onClick={() => setOpen((o) => !o)} className="flex-1 text-left min-w-0">
          <span className="text-sm font-medium truncate block">{field.label}</span>
        </button>
        {field.required && <Badge variant="secondary" className="text-[10px]">obrigatório</Badge>}
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setOpen((o) => !o)}>
          <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
        </Button>
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive" onClick={onDelete}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {open && (
        <div className="space-y-3 border-t p-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label className="text-xs">Rótulo</Label>
              <Input className="h-8 text-sm" value={field.label} onChange={(e) => onUpdate({ label: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs">Placeholder</Label>
              <Input className="h-8 text-sm" value={field.placeholder || ""} onChange={(e) => onUpdate({ placeholder: e.target.value })} />
            </div>
          </div>
          <div>
            <Label className="text-xs">Texto de ajuda</Label>
            <Input className="h-8 text-sm" value={field.helpText || ""} onChange={(e) => onUpdate({ helpText: e.target.value })} />
          </div>
          {def.hasOptions && (
            <div>
              <Label className="text-xs">Opções (uma por linha)</Label>
              <textarea
                className="mt-1 w-full rounded-md border bg-background p-2 text-sm"
                rows={3}
                value={(field.options || []).join("\n")}
                onChange={(e) => onUpdate({ options: e.target.value.split("\n").filter(Boolean) })}
              />
            </div>
          )}
          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 text-xs">
              <Switch checked={field.required} onCheckedChange={(v) => onUpdate({ required: v })} />
              Obrigatório
            </label>
            <label className="flex items-center gap-2 text-xs">
              <Switch checked={field.width === "half"} onCheckedChange={(v) => onUpdate({ width: v ? "half" : "full" })} />
              Meia largura
            </label>
          </div>
        </div>
      )}
    </div>
  );
};

export const CaptureFormBuilder = ({ fields, onChange }: Props) => {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = fields.findIndex((f) => f.id === active.id);
    const newIndex = fields.findIndex((f) => f.id === over.id);
    onChange(arrayMove(fields, oldIndex, newIndex));
  };

  return (
    <div className="space-y-4">
      <Card className="p-3">
        <Label className="text-xs text-muted-foreground">Adicionar campo</Label>
        <div className="mt-2 flex flex-wrap gap-2">
          {FIELD_TYPES.map((f) => {
            const Icon = f.icon;
            return (
              <Button
                key={f.type}
                variant="outline"
                size="sm"
                className="h-8 text-xs"
                onClick={() => onChange([...fields, makeField(f.type as CaptureFieldType)])}
              >
                <Icon className="mr-1 h-3.5 w-3.5" />
                {f.label}
                <Plus className="ml-1 h-3 w-3" />
              </Button>
            );
          })}
        </div>
      </Card>

      {fields.length === 0 ? (
        <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
          Nenhum campo ainda. Adicione os campos que deseja capturar.
        </p>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={fields.map((f) => f.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {fields.map((f) => (
                <SortableField
                  key={f.id}
                  field={f}
                  onUpdate={(patch) => onChange(fields.map((x) => (x.id === f.id ? { ...x, ...patch } : x)))}
                  onDelete={() => onChange(fields.filter((x) => x.id !== f.id))}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
};

export default CaptureFormBuilder;
