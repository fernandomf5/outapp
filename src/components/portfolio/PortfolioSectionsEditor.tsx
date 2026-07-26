import { useState } from "react";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { GripVertical, Trash2, Plus, ChevronDown, Eye, EyeOff, Copy } from "lucide-react";
import { CaptureImageInput } from "@/components/capture/CaptureImageInput";
import { uid } from "@/components/capture/captureTypes";
import { PortfolioSection, PortfolioSectionType, SECTION_TYPES, getSectionDef, makeSection } from "./portfolioTypes";

interface Props {
  sections: PortfolioSection[];
  onChange: (sections: PortfolioSection[]) => void;
}

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="space-y-1">
    <Label className="text-xs">{label}</Label>
    {children}
  </div>
);

const SectionEditor = ({ section, onUpdate }: { section: PortfolioSection; onUpdate: (props: Record<string, any>) => void }) => {
  const p = section.props || {};
  const set = (patch: Record<string, any>) => onUpdate({ ...p, ...patch });
  const setListItem = (key: string, idx: number, patch: Record<string, any>) => {
    const list = [...(p[key] || [])];
    list[idx] = { ...list[idx], ...patch };
    set({ [key]: list });
  };
  const addListItem = (key: string, item: Record<string, any>) => set({ [key]: [...(p[key] || []), item] });
  const removeListItem = (key: string, idx: number) => set({ [key]: (p[key] || []).filter((_: any, i: number) => i !== idx) });

  switch (section.type) {
    case "hero":
      return (
        <div className="space-y-3">
          <Field label="Etiqueta (opcional)">
            <Input className="h-9" value={p.eyebrow || ""} onChange={(e) => set({ eyebrow: e.target.value })} />
          </Field>
          <Field label="Título">
            <Input className="h-9" value={p.title || ""} onChange={(e) => set({ title: e.target.value })} />
          </Field>
          <Field label="Subtítulo">
            <Textarea rows={2} value={p.subtitle || ""} onChange={(e) => set({ subtitle: e.target.value })} />
          </Field>
          <CaptureImageInput label="Foto de perfil" value={p.avatar || ""} onChange={(v) => set({ avatar: v })} />
          <CaptureImageInput label="Imagem de fundo" value={p.backgroundImage || ""} onChange={(v) => set({ backgroundImage: v })} />
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Botão principal">
              <Input className="h-9" value={p.primaryLabel || ""} onChange={(e) => set({ primaryLabel: e.target.value })} />
            </Field>
            <Field label="Link do botão principal">
              <Input className="h-9" value={p.primaryUrl || ""} onChange={(e) => set({ primaryUrl: e.target.value })} />
            </Field>
            <Field label="Botão secundário">
              <Input className="h-9" value={p.secondaryLabel || ""} onChange={(e) => set({ secondaryLabel: e.target.value })} />
            </Field>
            <Field label="Link do botão secundário">
              <Input className="h-9" value={p.secondaryUrl || ""} onChange={(e) => set({ secondaryUrl: e.target.value })} />
            </Field>
          </div>
          <Field label="Alinhamento">
            <Select value={p.align || "center"} onValueChange={(v) => set({ align: v })}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent className="z-[300]">
                <SelectItem value="center">Centralizado</SelectItem>
                <SelectItem value="left">À esquerda</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>
      );

    case "about":
      return (
        <div className="space-y-3">
          <Field label="Título">
            <Input className="h-9" value={p.title || ""} onChange={(e) => set({ title: e.target.value })} />
          </Field>
          <Field label="Texto">
            <Textarea rows={5} value={p.text || ""} onChange={(e) => set({ text: e.target.value })} />
          </Field>
          <CaptureImageInput label="Imagem" value={p.image || ""} onChange={(v) => set({ image: v })} />
          <div className="space-y-2">
            <Label className="text-xs">Números em destaque</Label>
            {(p.highlights || []).map((h: any, idx: number) => (
              <div key={idx} className="flex gap-2">
                <Input className="h-9" placeholder="Valor" value={h.value || ""} onChange={(e) => setListItem("highlights", idx, { value: e.target.value })} />
                <Input className="h-9" placeholder="Descrição" value={h.label || ""} onChange={(e) => setListItem("highlights", idx, { label: e.target.value })} />
                <Button variant="ghost" size="sm" className="h-9 w-9 p-0 text-destructive" onClick={() => removeListItem("highlights", idx)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={() => addListItem("highlights", { value: "", label: "" })}>
              <Plus className="mr-1 h-4 w-4" /> Adicionar destaque
            </Button>
          </div>
        </div>
      );

    case "projects":
      return (
        <div className="space-y-3">
          <Field label="Título">
            <Input className="h-9" value={p.title || ""} onChange={(e) => set({ title: e.target.value })} />
          </Field>
          <Field label="Subtítulo">
            <Input className="h-9" value={p.subtitle || ""} onChange={(e) => set({ subtitle: e.target.value })} />
          </Field>
          <div className="flex items-center justify-between rounded-md border p-2">
            <Label className="text-xs">Mostrar filtros por categoria</Label>
            <Switch checked={p.showFilters !== false} onCheckedChange={(v) => set({ showFilters: v })} />
          </div>
          <div className="flex items-center justify-between rounded-md border p-2">
            <Label className="text-xs">Destaques primeiro</Label>
            <Switch checked={p.showFeaturedFirst !== false} onCheckedChange={(v) => set({ showFeaturedFirst: v })} />
          </div>
        </div>
      );

    case "services":
      return (
        <div className="space-y-3">
          <Field label="Título">
            <Input className="h-9" value={p.title || ""} onChange={(e) => set({ title: e.target.value })} />
          </Field>
          {(p.items || []).map((s: any, idx: number) => (
            <div key={idx} className="space-y-2 rounded-md border p-2">
              <div className="flex gap-2">
                <Input className="h-9" placeholder="Nome do serviço" value={s.title || ""} onChange={(e) => setListItem("items", idx, { title: e.target.value })} />
                <Button variant="ghost" size="sm" className="h-9 w-9 p-0 text-destructive" onClick={() => removeListItem("items", idx)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <Textarea rows={2} placeholder="Descrição" value={s.description || ""} onChange={(e) => setListItem("items", idx, { description: e.target.value })} />
              <Input className="h-9" placeholder="Preço (opcional)" value={s.price || ""} onChange={(e) => setListItem("items", idx, { price: e.target.value })} />
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={() => addListItem("items", { title: "Novo serviço", description: "", price: "" })}>
            <Plus className="mr-1 h-4 w-4" /> Adicionar serviço
          </Button>
        </div>
      );

    case "testimonials":
      return (
        <div className="space-y-3">
          <Field label="Título">
            <Input className="h-9" value={p.title || ""} onChange={(e) => set({ title: e.target.value })} />
          </Field>
          {(p.items || []).map((t: any, idx: number) => (
            <div key={idx} className="space-y-2 rounded-md border p-2">
              <div className="flex gap-2">
                <Input className="h-9" placeholder="Nome" value={t.name || ""} onChange={(e) => setListItem("items", idx, { name: e.target.value })} />
                <Input className="h-9" placeholder="Cargo/Empresa" value={t.role || ""} onChange={(e) => setListItem("items", idx, { role: e.target.value })} />
                <Button variant="ghost" size="sm" className="h-9 w-9 p-0 text-destructive" onClick={() => removeListItem("items", idx)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <Textarea rows={2} placeholder="Depoimento" value={t.text || ""} onChange={(e) => setListItem("items", idx, { text: e.target.value })} />
              <CaptureImageInput label="Foto" value={t.avatar || ""} onChange={(v) => setListItem("items", idx, { avatar: v })} />
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={() => addListItem("items", { name: "", role: "", text: "", avatar: "" })}>
            <Plus className="mr-1 h-4 w-4" /> Adicionar depoimento
          </Button>
        </div>
      );

    case "gallery":
      return (
        <div className="space-y-3">
          <Field label="Título">
            <Input className="h-9" value={p.title || ""} onChange={(e) => set({ title: e.target.value })} />
          </Field>
          <Field label="Colunas">
            <Select value={String(p.columns || 3)} onValueChange={(v) => set({ columns: Number(v) })}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent className="z-[300]">
                <SelectItem value="2">2 colunas</SelectItem>
                <SelectItem value="3">3 colunas</SelectItem>
                <SelectItem value="4">4 colunas</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          {(p.images || []).map((img: string, idx: number) => (
            <div key={idx} className="flex items-end gap-2">
              <div className="flex-1">
                <CaptureImageInput label={`Imagem ${idx + 1}`} value={img} onChange={(v) => {
                  const list = [...(p.images || [])];
                  list[idx] = v;
                  set({ images: list });
                }} />
              </div>
              <Button variant="ghost" size="sm" className="h-9 w-9 p-0 text-destructive" onClick={() => set({ images: (p.images || []).filter((_: string, i: number) => i !== idx) })}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={() => set({ images: [...(p.images || []), ""] })}>
            <Plus className="mr-1 h-4 w-4" /> Adicionar imagem
          </Button>
        </div>
      );

    case "video":
      return (
        <div className="space-y-3">
          <Field label="Título">
            <Input className="h-9" value={p.title || ""} onChange={(e) => set({ title: e.target.value })} />
          </Field>
          <Field label="Link do vídeo (YouTube/Vimeo)">
            <Input className="h-9" value={p.url || ""} onChange={(e) => set({ url: e.target.value })} />
          </Field>
          <Field label="Descrição">
            <Textarea rows={2} value={p.description || ""} onChange={(e) => set({ description: e.target.value })} />
          </Field>
        </div>
      );

    case "contact":
      return (
        <div className="space-y-3">
          <Field label="Título">
            <Input className="h-9" value={p.title || ""} onChange={(e) => set({ title: e.target.value })} />
          </Field>
          <Field label="Subtítulo">
            <Input className="h-9" value={p.subtitle || ""} onChange={(e) => set({ subtitle: e.target.value })} />
          </Field>
          <div className="flex items-center justify-between rounded-md border p-2">
            <Label className="text-xs">Exibir formulário de contato</Label>
            <Switch checked={p.showForm !== false} onCheckedChange={(v) => set({ showForm: v })} />
          </div>
          <Field label="Texto do botão">
            <Input className="h-9" value={p.buttonText || ""} onChange={(e) => set({ buttonText: e.target.value })} />
          </Field>
          <Field label="Mensagem de sucesso">
            <Input className="h-9" value={p.successMessage || ""} onChange={(e) => set({ successMessage: e.target.value })} />
          </Field>
        </div>
      );

    case "footer":
      return (
        <div className="space-y-3">
          <Field label="Texto do rodapé">
            <Input className="h-9" value={p.text || ""} onChange={(e) => set({ text: e.target.value })} />
          </Field>
          <div className="flex items-center justify-between rounded-md border p-2">
            <Label className="text-xs">Mostrar redes sociais</Label>
            <Switch checked={p.showSocial !== false} onCheckedChange={(v) => set({ showSocial: v })} />
          </div>
        </div>
      );

    default:
      return null;
  }
};

const SortableSection = ({
  section,
  onUpdate,
  onDelete,
  onDuplicate,
}: {
  section: PortfolioSection;
  onUpdate: (patch: Partial<PortfolioSection>) => void;
  onDelete: () => void;
  onDuplicate: () => void;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: section.id });
  const [open, setOpen] = useState(false);
  const def = getSectionDef(section.type);

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
        <button type="button" onClick={() => setOpen((o) => !o)} className="min-w-0 flex-1 text-left">
          <span className="block truncate text-sm font-medium">{def.label}</span>
          <span className="block truncate text-xs text-muted-foreground">{def.description}</span>
        </button>
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => onUpdate({ visible: !section.visible })} title={section.visible ? "Ocultar" : "Mostrar"}>
          {section.visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
        </Button>
        {!def.unique && (
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={onDuplicate} title="Duplicar">
            <Copy className="h-4 w-4" />
          </Button>
        )}
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setOpen((o) => !o)}>
          <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
        </Button>
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive" onClick={onDelete}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      {open && (
        <div className="border-t p-3">
          <SectionEditor section={section} onUpdate={(props) => onUpdate({ props })} />
        </div>
      )}
    </div>
  );
};

export const PortfolioSectionsEditor = ({ sections, onChange }: Props) => {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = sections.findIndex((s) => s.id === active.id);
    const newIndex = sections.findIndex((s) => s.id === over.id);
    onChange(arrayMove(sections, oldIndex, newIndex));
  };

  const available = SECTION_TYPES.filter((def) => !def.unique || !sections.some((s) => s.type === def.type));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Arraste para reordenar as seções da página.</p>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" disabled={available.length === 0}>
              <Plus className="mr-1 h-4 w-4" /> Seção
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="z-[300] w-64">
            {available.map((def) => (
              <DropdownMenuItem key={def.type} onClick={() => onChange([...sections, makeSection(def.type as PortfolioSectionType)])}>
                <div>
                  <div className="text-sm font-medium">{def.label}</div>
                  <div className="text-xs text-muted-foreground">{def.description}</div>
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {sections.map((section) => (
              <SortableSection
                key={section.id}
                section={section}
                onUpdate={(patch) => onChange(sections.map((s) => (s.id === section.id ? { ...s, ...patch } : s)))}
                onDelete={() => onChange(sections.filter((s) => s.id !== section.id))}
                onDuplicate={() => onChange([...sections, { ...section, id: uid() }])}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {sections.length === 0 && (
        <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          Nenhuma seção. Clique em “Seção” para começar.
        </div>
      )}
    </div>
  );
};

export default PortfolioSectionsEditor;
