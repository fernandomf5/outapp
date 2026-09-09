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
import {
  BLOCK_DEFS,
  BLOCK_STYLE_COLOR_FIELDS,
  BlockStyle,
  SiteBlock,
  SiteTheme,
  createBlock,
  getBlockDef,
  FONT_OPTIONS,
} from "./siteTypes";
import { ELEMENT_DEFS, SiteColumn, SiteElement, createColumn, createElement } from "./elementTypes";
import { BlockRenderer } from "./BlockRenderer";
import { SectionCanvas, DND_MIME } from "./SectionCanvas";
import { readSectionProps } from "./SectionRenderer";
import { FieldEditor } from "./BlockInspector";
import { ElementInspector } from "./ElementInspector";
import { cn } from "@/lib/utils";

const DeviceIcon = { desktop: Icons.Monitor, tablet: Icons.Tablet, mobile: Icons.Smartphone };

const COLUMN_PRESETS: { label: string; widths: number[] }[] = [
  { label: "1 coluna", widths: [100] },
  { label: "2 colunas", widths: [50, 50] },
  { label: "3 colunas", widths: [33.33, 33.33, 33.33] },
  { label: "4 colunas", widths: [25, 25, 25, 25] },
  { label: "1/3 + 2/3", widths: [33.33, 66.66] },
  { label: "2/3 + 1/3", widths: [66.66, 33.33] },
];

interface Props {
  blocks: SiteBlock[];
  theme: SiteTheme;
  onBlocksChange: (blocks: SiteBlock[]) => void;
  onThemeChange: (theme: SiteTheme) => void;
}

interface SortableBlockProps {
  block: SiteBlock;
  theme: SiteTheme;
  selected: boolean;
  selectedElementId: string | null;
  onSelect: (id: string) => void;
  onSelectElement: (id: string | null) => void;
  onColumnsChange: (blockId: string, columns: SiteColumn[]) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
}

function SortableBlock({
  block,
  theme,
  selected,
  selectedElementId,
  onSelect,
  onSelectElement,
  onColumnsChange,
  onDelete,
  onDuplicate,
}: SortableBlockProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id });
  const def = getBlockDef(block.type);
  const isSection = block.type === "section";

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
      <div className="absolute right-2 top-2 z-40 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button size="icon" variant="secondary" className="h-7 w-7 cursor-grab" aria-label="Mover seção" {...attributes} {...listeners}>
          <Icons.GripVertical className="h-3.5 w-3.5" />
        </Button>
        <Button size="icon" variant="secondary" className="h-7 w-7" aria-label="Duplicar seção" onClick={(e) => { e.stopPropagation(); onDuplicate(block.id); }}>
          <Icons.Copy className="h-3.5 w-3.5" />
        </Button>
        <Button size="icon" variant="destructive" className="h-7 w-7" aria-label="Excluir seção" onClick={(e) => { e.stopPropagation(); onDelete(block.id); }}>
          <Icons.Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
      <div className="absolute left-2 top-2 z-40 px-2 py-0.5 rounded bg-background/90 text-[10px] font-medium opacity-0 group-hover:opacity-100">
        {def?.label || block.type}
      </div>

      {isSection ? (
        <SectionCanvas
          block={block}
          theme={theme}
          selectedElementId={selected ? selectedElementId : null}
          onSelectElement={(id) => {
            onSelect(block.id);
            onSelectElement(id);
          }}
          onColumnsChange={(cols) => onColumnsChange(block.id, cols)}
        />
      ) : (
        <div className="pointer-events-none">
          <BlockRenderer block={block} theme={theme} preview />
        </div>
      )}
    </div>
  );
}

export function SiteEditor({ blocks, theme, onBlocksChange, onThemeChange }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [device, setDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [search, setSearch] = useState("");
  const [elementSearch, setElementSearch] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const selected = blocks.find((b) => b.id === selectedId) || null;
  const selectedDef = selected ? getBlockDef(selected.type) : null;
  const isSection = selected?.type === "section";
  const sectionProps = selected && isSection ? readSectionProps(selected) : null;
  const blockStyle: BlockStyle = (selected?.props?.style ?? {}) as BlockStyle;
  const blockStyleIsCustom = Object.values(blockStyle).some((v) => v !== undefined && v !== "");

  const selectedElement: SiteElement | null = useMemo(() => {
    if (!sectionProps || !selectedElementId) return null;
    for (const col of sectionProps.columns) {
      const found = col.elements.find((e) => e.id === selectedElementId);
      if (found) return found;
    }
    return null;
  }, [sectionProps, selectedElementId]);

  const grouped = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = q ? BLOCK_DEFS.filter((d) => d.label.toLowerCase().includes(q)) : BLOCK_DEFS;
    return list.reduce<Record<string, typeof BLOCK_DEFS>>((acc, d) => {
      (acc[d.category] ||= []).push(d);
      return acc;
    }, {});
  }, [search]);

  const groupedElements = useMemo(() => {
    const q = elementSearch.trim().toLowerCase();
    const list = q ? ELEMENT_DEFS.filter((d) => d.label.toLowerCase().includes(q)) : ELEMENT_DEFS;
    return list.reduce<Record<string, typeof ELEMENT_DEFS>>((acc, d) => {
      (acc[d.category] ||= []).push(d);
      return acc;
    }, {});
  }, [elementSearch]);

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
    setSelectedElementId(null);
  };

  const updateProp = (key: string, value: unknown) => {
    if (!selected) return;
    onBlocksChange(blocks.map((b) => (b.id === selected.id ? { ...b, props: { ...b.props, [key]: value } } : b)));
  };

  const setColumns = (blockId: string, columns: SiteColumn[]) =>
    onBlocksChange(blocks.map((b) => (b.id === blockId ? { ...b, props: { ...b.props, columns } } : b)));

  const applyColumnPreset = (widths: number[]) => {
    if (!selected || !sectionProps) return;
    const current = sectionProps.columns;
    const next: SiteColumn[] = widths.map((w, i) => {
      const existing = current[i];
      return existing ? { ...existing, width: w } : createColumn(w);
    });
    // Elementos das colunas removidas vão para a última coluna, sem perder conteúdo.
    if (current.length > widths.length) {
      const leftovers = current.slice(widths.length).flatMap((c) => c.elements);
      next[next.length - 1] = {
        ...next[next.length - 1],
        elements: [...next[next.length - 1].elements, ...leftovers],
      };
    }
    setColumns(selected.id, next);
  };

  const addElementToSection = (type: string) => {
    if (!selected || !sectionProps) return;
    const el = createElement(type);
    const columns = sectionProps.columns.map((c, i) =>
      i === 0 ? { ...c, elements: [...c.elements, el] } : c
    );
    setColumns(selected.id, columns);
    setSelectedElementId(el.id);
  };

  const updateElement = (updated: SiteElement) => {
    if (!selected || !sectionProps) return;
    setColumns(
      selected.id,
      sectionProps.columns.map((c) => ({
        ...c,
        elements: c.elements.map((e) => (e.id === updated.id ? updated : e)),
      }))
    );
  };

  const deleteElement = (id: string) => {
    if (!selected || !sectionProps) return;
    setColumns(
      selected.id,
      sectionProps.columns.map((c) => ({ ...c, elements: c.elements.filter((e) => e.id !== id) }))
    );
    setSelectedElementId(null);
  };

  const width = device === "mobile" ? 390 : device === "tablet" ? 768 : undefined;

  const BlocksPalette = (
    <div className="p-3 space-y-4">
      <Input placeholder="Buscar seção..." value={search} onChange={(e) => setSearch(e.target.value)} />
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
  );

  const ElementsPalette = (
    <div className="p-3 space-y-4">
      <div className="rounded-lg border border-dashed p-3 text-xs text-muted-foreground">
        {isSection
          ? "Arraste um elemento para dentro da seção selecionada — ou clique para adicioná-lo ao final."
          : "Crie uma “Seção livre” e selecione-a para poder soltar elementos dentro."}
      </div>
      <Input placeholder="Buscar elemento..." value={elementSearch} onChange={(e) => setElementSearch(e.target.value)} />
      {Object.entries(groupedElements).map(([cat, defs]) => (
        <div key={cat} className="space-y-2">
          <div className="text-xs font-semibold uppercase text-muted-foreground">{cat}</div>
          <div className="grid grid-cols-2 gap-2">
            {defs.map((d) => {
              const Icon = (Icons as any)[d.icon] || Icons.Square;
              return (
                <button
                  key={d.type}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData(DND_MIME, `new:${d.type}`);
                    e.dataTransfer.setData("text/plain", `new:${d.type}`);
                    e.dataTransfer.effectAllowed = "copy";
                  }}
                  onClick={() => addElementToSection(d.type)}
                  className="flex cursor-grab flex-col items-center gap-1.5 rounded-lg border p-3 text-center hover:border-primary hover:bg-primary/5 transition-colors active:cursor-grabbing"
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
  );

  const Palette = (
    <ScrollArea className="h-full">
      <Tabs defaultValue="elementos" className="w-full">
        <TabsList className="grid grid-cols-2 mx-3 mt-3">
          <TabsTrigger value="elementos">Elementos</TabsTrigger>
          <TabsTrigger value="secoes">Seções</TabsTrigger>
        </TabsList>
        <TabsContent value="elementos" className="mt-0">{ElementsPalette}</TabsContent>
        <TabsContent value="secoes" className="mt-0">{BlocksPalette}</TabsContent>
      </Tabs>
    </ScrollArea>
  );

  const Inspector = (
    <ScrollArea className="h-full">
      <div className="p-3">
        {selectedElement ? (
          <div className="space-y-3">
            <Button size="sm" variant="ghost" className="px-2" onClick={() => setSelectedElementId(null)}>
              <Icons.ChevronLeft className="h-4 w-4 mr-1" /> Voltar para a seção
            </Button>
            <ElementInspector
              element={selectedElement}
              theme={theme}
              onChange={updateElement}
              onDelete={() => deleteElement(selectedElement.id)}
            />
          </div>
        ) : (
          <Tabs defaultValue="bloco">
            <TabsList className="w-full grid grid-cols-2">
              <TabsTrigger value="bloco">Seção</TabsTrigger>
              <TabsTrigger value="estilo">Estilo</TabsTrigger>
            </TabsList>

            <TabsContent value="bloco" className="space-y-4 pt-4">
              {selected && selectedDef ? (
                <>
                  <div className="text-sm font-semibold">{selectedDef.label}</div>

                  {isSection && sectionProps && (
                    <div className="space-y-2 rounded-lg border p-3">
                      <Label className="text-sm">Colunas</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {COLUMN_PRESETS.map((preset) => {
                          const active =
                            preset.widths.length === sectionProps.columns.length &&
                            Math.round(preset.widths[0]) === Math.round(sectionProps.columns[0].width);
                          return (
                            <Button
                              key={preset.label}
                              size="sm"
                              variant={active ? "default" : "outline"}
                              onClick={() => applyColumnPreset(preset.widths)}
                            >
                              {preset.label}
                            </Button>
                          );
                        })}
                      </div>
                    </div>
                  )}

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
                  Clique em uma seção do site para editar.
                </p>
              )}
            </TabsContent>

            <TabsContent value="estilo" className="space-y-4 pt-4">
              {selected && (
                <div className="space-y-3 rounded-lg border p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-sm font-semibold">
                      Estilo só desta seção{selectedDef ? ` (${selectedDef.label})` : ""}
                    </div>
                    {blockStyleIsCustom && (
                      <Button size="sm" variant="ghost" onClick={() => updateProp("style", {})}>
                        Limpar
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    O que você mudar aqui vale apenas neste bloco. Deixe em branco para seguir o estilo geral.
                  </p>
                  {BLOCK_STYLE_COLOR_FIELDS.map(({ key, label }) => {
                    const current = (blockStyle as any)[key] as string | undefined;
                    return (
                      <div key={key} className="space-y-1.5">
                        <Label className="text-sm">{label}</Label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            aria-label={label}
                            className="h-9 w-12 rounded border bg-transparent"
                            value={current || (theme as any)[key] || "#000000"}
                            onChange={(e) => updateProp("style", { ...blockStyle, [key]: e.target.value })}
                          />
                          <Input
                            value={current ?? ""}
                            placeholder="Usando o estilo geral"
                            onChange={(e) => updateProp("style", { ...blockStyle, [key]: e.target.value })}
                          />
                          {current && (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-9 w-9 shrink-0"
                              aria-label={`Remover ${label}`}
                              onClick={() => {
                                const next = { ...blockStyle };
                                delete (next as any)[key];
                                updateProp("style", next);
                              }}
                            >
                              <Icons.X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  <div className="space-y-2">
                    <Label className="text-sm">
                      Arredondamento desta seção: {blockStyle.radius ?? theme.radius}px
                      {blockStyle.radius === undefined && " (geral)"}
                    </Label>
                    <Slider
                      value={[blockStyle.radius ?? theme.radius]}
                      min={0}
                      max={40}
                      step={2}
                      onValueChange={([v]) => updateProp("style", { ...blockStyle, radius: v })}
                    />
                  </div>
                </div>
              )}

              <div className="text-sm font-semibold pt-2">Estilo geral do site</div>

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
        )}
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
            Seu site está vazio. Comece adicionando uma <strong>Seção livre</strong> e solte elementos dentro dela.
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
                  selectedElementId={selectedElementId}
                  onSelect={(id) => {
                    if (id !== selectedId) setSelectedElementId(null);
                    setSelectedId(id);
                  }}
                  onSelectElement={setSelectedElementId}
                  onColumnsChange={setColumns}
                  onDelete={(id: string) => {
                    onBlocksChange(blocks.filter((x) => x.id !== id));
                    if (selectedId === id) {
                      setSelectedId(null);
                      setSelectedElementId(null);
                    }
                  }}
                  onDuplicate={(id: string) => {
                    const idx = blocks.findIndex((x) => x.id === id);
                    const copy = JSON.parse(JSON.stringify(blocks[idx])) as SiteBlock;
                    copy.id = `${blocks[idx].type}-${Math.random().toString(36).slice(2, 9)}`;
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
            <Button key={d} size="sm" variant={device === d ? "default" : "ghost"} aria-label={d} onClick={() => setDevice(d)}>
              <Icon className="h-4 w-4" />
            </Button>
          );
        })}
      </div>

      {/* Desktop layout */}
      <div className="hidden lg:grid flex-1 min-h-0" style={{ gridTemplateColumns: "280px 1fr 330px" }}>
        <div className="border-r min-h-0">{Palette}</div>
        <div className="min-h-0">{Canvas}</div>
        <div className="border-l min-h-0">{Inspector}</div>
      </div>

      {/* Mobile / tablet layout */}
      <div className="lg:hidden flex-1 min-h-0">
        <Tabs defaultValue="canvas" className="h-full flex flex-col min-h-0">
          <TabsList className="grid grid-cols-3 mx-3 mt-2">
            <TabsTrigger value="blocos">Adicionar</TabsTrigger>
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
