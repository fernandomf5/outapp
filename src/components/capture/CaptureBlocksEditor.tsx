import { useState } from "react";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GripVertical, Trash2, Plus, ChevronDown, Copy, Eye, EyeOff } from "lucide-react";
import { BLOCK_TYPES, CaptureBlock, CaptureBlockType, getBlockDef, makeBlock, uid } from "./captureTypes";
import { CaptureImageInput } from "./CaptureImageInput";

interface Props {
  blocks: CaptureBlock[];
  onChange: (blocks: CaptureBlock[]) => void;
}

const TextField = ({ label, value, onChange, multiline }: { label: string; value: string; onChange: (v: string) => void; multiline?: boolean }) => (
  <div>
    <Label className="text-xs">{label}</Label>
    {multiline ? (
      <textarea className="mt-1 w-full rounded-md border bg-background p-2 text-sm" rows={3} value={value || ""} onChange={(e) => onChange(e.target.value)} />
    ) : (
      <Input className="h-8 text-sm" value={value || ""} onChange={(e) => onChange(e.target.value)} />
    )}
  </div>
);

const ListEditor = ({
  items,
  onChange,
  fields,
  addLabel,
}: {
  items: any[];
  onChange: (items: any[]) => void;
  fields: { key: string; label: string; type?: "text" | "textarea" | "image" }[];
  addLabel: string;
}) => (
  <div className="space-y-2">
    {(items || []).map((item, i) => (
      <Card key={i} className="space-y-2 p-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">Item {i + 1}</span>
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" disabled={i === 0} onClick={() => onChange(arrayMove(items, i, i - 1))}>↑</Button>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" disabled={i === items.length - 1} onClick={() => onChange(arrayMove(items, i, i + 1))}>↓</Button>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-destructive" onClick={() => onChange(items.filter((_, x) => x !== i))}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
        {fields.map((f) =>
          f.type === "image" ? (
            <div key={f.key}>
              <Label className="text-xs">{f.label}</Label>
              <CaptureImageInput value={item[f.key] || ""} onChange={(v) => onChange(items.map((it, x) => (x === i ? { ...it, [f.key]: v } : it)))} />
            </div>
          ) : (
            <TextField
              key={f.key}
              label={f.label}
              multiline={f.type === "textarea"}
              value={item[f.key] || ""}
              onChange={(v) => onChange(items.map((it, x) => (x === i ? { ...it, [f.key]: v } : it)))}
            />
          ),
        )}
      </Card>
    ))}
    <Button
      variant="outline"
      size="sm"
      className="h-8 w-full text-xs"
      onClick={() => onChange([...(items || []), Object.fromEntries(fields.map((f) => [f.key, ""]))])}
    >
      <Plus className="mr-1 h-3.5 w-3.5" /> {addLabel}
    </Button>
  </div>
);

const BlockFields = ({ block, update }: { block: CaptureBlock; update: (props: Record<string, any>) => void }) => {
  const p = block.props || {};
  const set = (key: string, value: any) => update({ ...p, [key]: value });

  const alignSelect = (
    <div>
      <Label className="text-xs">Alinhamento</Label>
      <Select value={p.align || "left"} onValueChange={(v) => set("align", v)}>
        <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
        <SelectContent className="z-[200]">
          <SelectItem value="left">Esquerda</SelectItem>
          <SelectItem value="center">Centro</SelectItem>
          <SelectItem value="right">Direita</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );

  switch (block.type) {
    case "hero":
      return (
        <>
          <TextField label="Etiqueta" value={p.eyebrow} onChange={(v) => set("eyebrow", v)} />
          <TextField label="Título" value={p.title} onChange={(v) => set("title", v)} />
          <TextField label="Subtítulo" value={p.subtitle} onChange={(v) => set("subtitle", v)} multiline />
          <div>
            <Label className="text-xs">Imagem</Label>
            <CaptureImageInput value={p.imageUrl || ""} onChange={(v) => set("imageUrl", v)} />
          </div>
          {alignSelect}
        </>
      );
    case "text":
      return (
        <>
          <TextField label="Título (opcional)" value={p.title} onChange={(v) => set("title", v)} />
          <TextField label="Texto" value={p.text} onChange={(v) => set("text", v)} multiline />
          {alignSelect}
        </>
      );
    case "image":
      return (
        <>
          <CaptureImageInput value={p.imageUrl || ""} onChange={(v) => set("imageUrl", v)} />
          <TextField label="Texto alternativo" value={p.alt} onChange={(v) => set("alt", v)} />
          <label className="flex items-center gap-2 text-xs">
            <Switch checked={p.rounded !== false} onCheckedChange={(v) => set("rounded", v)} /> Bordas arredondadas
          </label>
        </>
      );
    case "video":
      return (
        <>
          <TextField label="Título (opcional)" value={p.title} onChange={(v) => set("title", v)} />
          <TextField label="Link do vídeo (YouTube/Vimeo)" value={p.url} onChange={(v) => set("url", v)} />
        </>
      );
    case "button":
      return (
        <>
          <TextField label="Texto do botão" value={p.text} onChange={(v) => set("text", v)} />
          <TextField label="Link (use #formulario para rolar até o formulário)" value={p.url} onChange={(v) => set("url", v)} />
          {alignSelect}
        </>
      );
    case "form":
      return (
        <>
          <TextField label="Título" value={p.title} onChange={(v) => set("title", v)} />
          <TextField label="Subtítulo" value={p.subtitle} onChange={(v) => set("subtitle", v)} />
          <TextField label="Texto do botão" value={p.buttonText} onChange={(v) => set("buttonText", v)} />
        </>
      );
    case "benefits":
      return (
        <>
          <TextField label="Título da seção" value={p.title} onChange={(v) => set("title", v)} />
          <ListEditor
            items={p.items || []}
            onChange={(items) => set("items", items)}
            fields={[{ key: "title", label: "Título" }, { key: "text", label: "Descrição", type: "textarea" }]}
            addLabel="Adicionar benefício"
          />
        </>
      );
    case "testimonials":
      return (
        <>
          <TextField label="Título da seção" value={p.title} onChange={(v) => set("title", v)} />
          <ListEditor
            items={p.items || []}
            onChange={(items) => set("items", items)}
            fields={[
              { key: "name", label: "Nome" },
              { key: "role", label: "Cargo/Descrição" },
              { key: "text", label: "Depoimento", type: "textarea" },
              { key: "avatarUrl", label: "Foto", type: "image" },
            ]}
            addLabel="Adicionar depoimento"
          />
        </>
      );
    case "faq":
      return (
        <>
          <TextField label="Título da seção" value={p.title} onChange={(v) => set("title", v)} />
          <ListEditor
            items={p.items || []}
            onChange={(items) => set("items", items)}
            fields={[{ key: "question", label: "Pergunta" }, { key: "answer", label: "Resposta", type: "textarea" }]}
            addLabel="Adicionar pergunta"
          />
        </>
      );
    case "counter":
      return (
        <>
          <TextField label="Título da seção" value={p.title} onChange={(v) => set("title", v)} />
          <ListEditor
            items={p.items || []}
            onChange={(items) => set("items", items)}
            fields={[{ key: "value", label: "Número" }, { key: "label", label: "Legenda" }]}
            addLabel="Adicionar contador"
          />
        </>
      );
    case "cards":
      return (
        <>
          <TextField label="Título da seção" value={p.title} onChange={(v) => set("title", v)} />
          <ListEditor
            items={p.items || []}
            onChange={(items) => set("items", items)}
            fields={[
              { key: "title", label: "Título" },
              { key: "text", label: "Descrição", type: "textarea" },
              { key: "imageUrl", label: "Imagem", type: "image" },
            ]}
            addLabel="Adicionar card"
          />
        </>
      );
    case "gallery":
      return (
        <>
          <TextField label="Título da seção" value={p.title} onChange={(v) => set("title", v)} />
          <div className="space-y-2">
            {(p.images || []).map((src: string, i: number) => (
              <div key={i} className="flex items-end gap-2">
                <div className="flex-1">
                  <CaptureImageInput value={src} onChange={(v) => set("images", (p.images || []).map((s: string, x: number) => (x === i ? v : s)))} />
                </div>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive" onClick={() => set("images", (p.images || []).filter((_: string, x: number) => x !== i))}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button variant="outline" size="sm" className="h-8 w-full text-xs" onClick={() => set("images", [...(p.images || []), ""])}>
              <Plus className="mr-1 h-3.5 w-3.5" /> Adicionar imagem
            </Button>
          </div>
        </>
      );
    case "social":
      return (
        <>
          <TextField label="Título" value={p.title} onChange={(v) => set("title", v)} />
          <TextField label="Instagram" value={p.instagram} onChange={(v) => set("instagram", v)} />
          <TextField label="Facebook" value={p.facebook} onChange={(v) => set("facebook", v)} />
          <TextField label="YouTube" value={p.youtube} onChange={(v) => set("youtube", v)} />
          <TextField label="LinkedIn" value={p.linkedin} onChange={(v) => set("linkedin", v)} />
          <TextField label="WhatsApp (link)" value={p.whatsapp} onChange={(v) => set("whatsapp", v)} />
        </>
      );
    case "divider":
      return (
        <label className="flex items-center gap-2 text-xs">
          <Switch checked={p.line !== false} onCheckedChange={(v) => set("line", v)} /> Mostrar linha
        </label>
      );
    case "footer":
      return (
        <>
          <TextField label="Texto do rodapé" value={p.text} onChange={(v) => set("text", v)} multiline />
          <ListEditor
            items={p.links || []}
            onChange={(items) => set("links", items)}
            fields={[{ key: "label", label: "Texto" }, { key: "url", label: "Link" }]}
            addLabel="Adicionar link"
          />
        </>
      );
    default:
      return null;
  }
};

const SortableBlock = ({
  block,
  onUpdate,
  onDelete,
  onDuplicate,
}: {
  block: CaptureBlock;
  onUpdate: (patch: Partial<CaptureBlock>) => void;
  onDelete: () => void;
  onDuplicate: () => void;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id });
  const [open, setOpen] = useState(false);
  const def = getBlockDef(block.type);

  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} className={`rounded-lg border bg-card ${isDragging ? "opacity-60 ring-2 ring-primary" : ""}`}>
      <div className="flex items-center gap-2 p-2">
        <button type="button" className="cursor-grab touch-none text-muted-foreground" {...attributes} {...listeners}>
          <GripVertical className="h-4 w-4" />
        </button>
        <button type="button" onClick={() => setOpen((o) => !o)} className="min-w-0 flex-1 text-left">
          <span className="block truncate text-sm font-medium">{def.label}</span>
          <span className="block truncate text-[11px] text-muted-foreground">{def.description}</span>
        </button>
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" title={block.visible === false ? "Mostrar" : "Ocultar"} onClick={() => onUpdate({ visible: block.visible === false })}>
          {block.visible === false ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4" />}
        </Button>
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={onDuplicate}>
          <Copy className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setOpen((o) => !o)}>
          <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
        </Button>
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive" onClick={onDelete}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      {open && (
        <div className="space-y-3 border-t p-3">
          <BlockFields block={block} update={(props) => onUpdate({ props })} />
        </div>
      )}
    </div>
  );
};

export const CaptureBlocksEditor = ({ blocks, onChange }: Props) => {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    onChange(arrayMove(blocks, blocks.findIndex((b) => b.id === active.id), blocks.findIndex((b) => b.id === over.id)));
  };

  return (
    <div className="space-y-4">
      <Card className="p-3">
        <Label className="text-xs text-muted-foreground">Adicionar seção</Label>
        <div className="mt-2 flex flex-wrap gap-2">
          {BLOCK_TYPES.map((b) => (
            <Button key={b.type} variant="outline" size="sm" className="h-8 text-xs" onClick={() => onChange([...blocks, makeBlock(b.type as CaptureBlockType)])}>
              {b.label}
              <Plus className="ml-1 h-3 w-3" />
            </Button>
          ))}
        </div>
      </Card>

      {blocks.length === 0 ? (
        <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">Adicione seções para montar sua página.</p>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {blocks.map((b) => (
                <SortableBlock
                  key={b.id}
                  block={b}
                  onUpdate={(patch) => onChange(blocks.map((x) => (x.id === b.id ? { ...x, ...patch } : x)))}
                  onDelete={() => onChange(blocks.filter((x) => x.id !== b.id))}
                  onDuplicate={() => {
                    const idx = blocks.findIndex((x) => x.id === b.id);
                    const copy = { ...JSON.parse(JSON.stringify(b)), id: uid() };
                    const next = [...blocks];
                    next.splice(idx + 1, 0, copy);
                    onChange(next);
                  }}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
};

export default CaptureBlocksEditor;
