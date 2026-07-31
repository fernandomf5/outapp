import { useMemo, useState } from "react";
import {
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import * as Icons from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BLOCK_DEFS, SiteBlock, SiteTheme, createBlock, getBlockDef, FONT_OPTIONS } from "./siteTypes";
import { BlockRenderer } from "./BlockRenderer";
import { FieldEditor } from "./BlockInspector";
import { cn } from "@/lib/utils";

const DeviceIcon = { desktop: Icons.Monitor, tablet: Icons.Tablet, mobile: Icons.Smartphone };

interface Props {
  blocks: SiteBlock[];
  theme: SiteTheme;
  onBlocksChange: (blocks: SiteBlock[]) => void;
  onThemeChange: (theme: SiteTheme) => void;
}

function SortableBlock({
  block,
  selected,
  onSelect,
  onDelete,
  onDuplicate,
  theme,
}: any) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id });
  const def = getBlockDef(block.type);
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }}
      className={cn(
        "relative group border-2 rounded-lg overflow-hidden bg-background",
        selected ? "border-primary" : "border-transparent hover:border-primary/40"
      )}
      onClick={() => onSelect(block.id)}
    >
      <div className="absolute right-2 top-2 z-20 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button size="icon" variant="secondary" className="h-7 w-7 cursor-grab" {...attributes} {...listeners}>
          <Icons.GripVertical className="h-3.5 w-3.5" />
        </Button>
        <Button size="icon" variant="secondary" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); onDuplicate(block.id); }}>
          <Icons.Copy className="h-3.5 w-3.5" />
        </Button>
        <Button size="icon" variant="destructive" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); onDelete(block.id); }}>
          <Icons.Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
      <div className="absolute left-2 top-2 z-20 px-2 py-0.5 rounded bg-background/90 text-[10px] font-medium opacity-0 group-hover:opacity-100">
        {def?.label || block.type}
      </div>
      <div className="pointer-events-none">
        <BlockRenderer block={block} theme={theme} preview />
      </div>
    </div>
  );
}

export function SiteEditor({ blocks, theme, onBlocksChange, onThemeChange }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [device, setDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [search, setSearch] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const selected = blocks.find((b) => b.id === selectedId) || null;
  const selectedDef = selected ? getBlockDef(selected.type) : null;

  const grouped = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = q ? BLOCK_DEFS.filter((d) => d.label.toLowerCase().includes(q)) : BLOCK_DEFS;
    return list.reduce<Record<string, typeof BLOCK_DEFS>>((acc, d) => {
      (acc[d.category] ||= []).push(d);
      return acc;
    }, {});
  }, [search]);

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = blocks.findIndex((b) => b.id === active.id);
    const newIndex = blocks.findIndex((b) => b.id === over.id);
    onBlocksChange(arrayMove(blocks, oldIndex, newIndex));
  };

  const addBlock = (type: string) => {
    const block = createBlock(type);
    const footerIdx = blocks.findIndex((b) => b.type === "footer");
    const next = [...blocks];
    if (footerIdx >= 0 && type !== "footer") next.splice(footerIdx, 0, block);
    else next.push(block);
    onBlocksChange(next);
    setSelectedId(block.id);
  };

  const updateProp = (key: string, value: any) => {
    if (!selected) return;
    onBlocksChange(
      blocks.map((b) => (b.id === selected.id ? { ...b, props: { ...b.props, [key]: value } } : b))
    );
  };

  const width = device === "mobile" ? 390 : device === "tablet" ? 768 : undefined;

  const Palette = (
    <ScrollArea className="h-full">
      <div className="p-3 space-y-4">
        <Input placeholder="Buscar bloco..." value={search} onChange={(e) => setSearch(e.target.value)} />
        {Object.entries(grouped).map(([cat, defs]) => (
          <div key={cat} className="space-y-2">
            <div className="text-xs font-semibold uppercase text-muted-foreground">{cat}</div>
            <div className="grid grid-cols-2 gap-2">
              {defs.map((d) => {
                const Icon = (Icons as any)[d.icon] || Icons.Square;
                return (
                  <button
                    key={d.type}
                    onClick={() => addBlock(d.type)}
                    className="flex flex-col items-center gap-1.5 rounded-lg border p-3 text-center hover:border-primary hover:bg-primary/5 transition-colors"
                  >
                    <Icon className="h-5 w-5 text-primary" />
                    <span className="text-[11px] leading-tight">{d.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );

  const Inspector = (
    <ScrollArea className="h-full">
      <div className="p-3">
        <Tabs defaultValue="bloco">
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="bloco">Bloco</TabsTrigger>
            <TabsTrigger value="estilo">Estilo</TabsTrigger>
          </TabsList>

          <TabsContent value="bloco" className="space-y-4 pt-4">
            {selected && selectedDef ? (
              <>
                <div className="text-sm font-semibold">{selectedDef.label}</div>
                {selectedDef.fields.map((f) => (
                  <FieldEditor
                    key={f.key}
                    field={f}
                    value={selected.props?.[f.key]}
                    onChange={(v) => updateProp(f.key, v)}
                  />
                ))}
              </>
            ) : (
              <p className="text-sm text-muted-foreground py-8 text-center">
                Clique em um bloco no site para editar o conteúdo.
              </p>
            )}
          </TabsContent>

          <TabsContent value="estilo" className="space-y-4 pt-4">
            {(
              [
                ["primary", "Cor principal"],
                ["secondary", "Cor secundária"],
                ["background", "Fundo"],
                ["text", "Texto"],
              ] as const
            ).map(([key, label]) => (
              <div key={key} className="space-y-1.5">
                <Label className="text-sm">{label}</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    className="h-9 w-12 rounded border bg-transparent"
                    value={(theme as any)[key] || "#000000"}
                    onChange={(e) => onThemeChange({ ...theme, [key]: e.target.value })}
                  />
                  <Input
                    value={(theme as any)[key] || ""}
                    onChange={(e) => onThemeChange({ ...theme, [key]: e.target.value })}
                  />
                </div>
              </div>
            ))}
            <div className="space-y-1.5">
              <Label className="text-sm">Fonte</Label>
              <Select value={theme.font} onValueChange={(v) => onThemeChange({ ...theme, font: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent className="z-[300]">
                  {FONT_OPTIONS.map((f) => (
                    <SelectItem key={f} value={f}>{f}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm">Arredondamento: {theme.radius}px</Label>
              <Slider
                value={[theme.radius]}
                min={0}
                max={40}
                step={2}
                onValueChange={([v]) => onThemeChange({ ...theme, radius: v })}
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </ScrollArea>
  );

  const Canvas = (
    <div className="h-full overflow-auto bg-muted/40 p-3 sm:p-6">
      <div
        className="mx-auto bg-background shadow-xl rounded-lg overflow-hidden transition-all"
        style={{ maxWidth: width ? `${width}px` : "100%", fontFamily: theme.font }}
      >
        {blocks.length === 0 ? (
          <div className="py-24 text-center text-sm text-muted-foreground px-6">
            Seu site está vazio. Adicione blocos pela aba <strong>Blocos</strong>.
          </div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} modifiers={[restrictToVerticalAxis]} onDragEnd={handleDragEnd}>
            <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
              {blocks.map((b) => (
                <SortableBlock
                  key={b.id}
                  block={b}
                  theme={theme}
                  selected={b.id === selectedId}
                  onSelect={setSelectedId}
                  onDelete={(id: string) => {
                    onBlocksChange(blocks.filter((x) => x.id !== id));
                    if (selectedId === id) setSelectedId(null);
                  }}
                  onDuplicate={(id: string) => {
                    const idx = blocks.findIndex((x) => x.id === id);
                    const copy = { ...blocks[idx], id: `${blocks[idx].type}-${Math.random().toString(36).slice(2, 9)}` };
                    const next = [...blocks];
                    next.splice(idx + 1, 0, copy);
                    onBlocksChange(next);
                  }}
                />
              ))}
            </SortableContext>
          </DndContext>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex items-center justify-center gap-1 border-b py-2">
        {(["desktop", "tablet", "mobile"] as const).map((d) => {
          const Icon = DeviceIcon[d];
          return (
            <Button key={d} size="sm" variant={device === d ? "default" : "ghost"} onClick={() => setDevice(d)}>
              <Icon className="h-4 w-4" />
            </Button>
          );
        })}
      </div>

      {/* Desktop layout */}
      <div className="hidden lg:grid flex-1 min-h-0" style={{ gridTemplateColumns: "260px 1fr 320px" }}>
        <div className="border-r min-h-0">{Palette}</div>
        <div className="min-h-0">{Canvas}</div>
        <div className="border-l min-h-0">{Inspector}</div>
      </div>

      {/* Mobile / tablet layout */}
      <div className="lg:hidden flex-1 min-h-0">
        <Tabs defaultValue="canvas" className="h-full flex flex-col min-h-0">
          <TabsList className="grid grid-cols-3 mx-3 mt-2">
            <TabsTrigger value="blocos">Blocos</TabsTrigger>
            <TabsTrigger value="canvas">Site</TabsTrigger>
            <TabsTrigger value="editar">Editar</TabsTrigger>
          </TabsList>
          <TabsContent value="blocos" className="flex-1 min-h-0 mt-2">{Palette}</TabsContent>
          <TabsContent value="canvas" className="flex-1 min-h-0 mt-2">{Canvas}</TabsContent>
          <TabsContent value="editar" className="flex-1 min-h-0 mt-2">{Inspector}</TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
