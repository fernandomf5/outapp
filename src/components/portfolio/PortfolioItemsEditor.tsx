import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { GripVertical, Trash2, Plus, Pencil, Star, Loader2, Image as ImageIcon, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { CaptureImageInput } from "@/components/capture/CaptureImageInput";
import { PortfolioField, PortfolioItemRecord } from "./portfolioTypes";

interface Props {
  portfolioId: string;
  items: PortfolioItemRecord[];
  customFields: PortfolioField[];
  onReload: () => void;
}

const emptyItem = (): Partial<PortfolioItemRecord> => ({
  title: "",
  category: "",
  description: "",
  client_name: "",
  image_url: "",
  images: [],
  video_url: "",
  project_url: "",
  project_date: null,
  tags: [],
  links: [],
  files: [],
  custom_data: {},
  is_featured: false,
  is_published: true,
});

const SortableItem = ({
  item,
  onEdit,
  onDelete,
  onToggleFeatured,
}: {
  item: PortfolioItemRecord;
  onEdit: () => void;
  onDelete: () => void;
  onToggleFeatured: () => void;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex items-center gap-3 rounded-lg border bg-card p-2 ${isDragging ? "opacity-60 ring-2 ring-primary" : ""}`}
    >
      <button type="button" className="cursor-grab touch-none text-muted-foreground" {...attributes} {...listeners}>
        <GripVertical className="h-4 w-4" />
      </button>
      {item.image_url ? (
        <img src={item.image_url} alt={item.title} className="h-12 w-16 rounded object-cover" />
      ) : (
        <div className="flex h-12 w-16 items-center justify-center rounded bg-muted">
          <ImageIcon className="h-4 w-4 text-muted-foreground" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-medium">{item.title}</span>
          {item.is_featured ? <Star className="h-3.5 w-3.5 text-amber-500" fill="currentColor" /> : null}
          {item.is_published === false ? <EyeOff className="h-3.5 w-3.5 text-muted-foreground" /> : null}
        </div>
        {item.category ? (
          <Badge variant="secondary" className="mt-0.5 text-[10px]">
            {item.category}
          </Badge>
        ) : null}
      </div>
      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onToggleFeatured} title="Destacar">
        <Star className={`h-4 w-4 ${item.is_featured ? "text-amber-500" : "text-muted-foreground"}`} />
      </Button>
      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onEdit}>
        <Pencil className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive" onClick={onDelete}>
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
};

export const PortfolioItemsEditor = ({ portfolioId, items, customFields, onReload }: Props) => {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
  const [editing, setEditing] = useState<Partial<PortfolioItemRecord> | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const sorted = [...items].sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));

  const persistOrder = async (list: PortfolioItemRecord[]) => {
    await Promise.all(list.map((it, idx) => supabase.from("portfolio_items").update({ display_order: idx }).eq("id", it.id)));
    onReload();
  };

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = sorted.findIndex((i) => i.id === active.id);
    const newIndex = sorted.findIndex((i) => i.id === over.id);
    persistOrder(arrayMove(sorted, oldIndex, newIndex));
  };

  const save = async () => {
    if (!editing?.title?.trim()) {
      toast.error("Informe o nome do projeto");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        portfolio_id: portfolioId,
        title: editing.title.trim(),
        category: editing.category || "",
        description: editing.description || null,
        client_name: editing.client_name || null,
        image_url: editing.image_url || null,
        images: editing.images || [],
        video_url: editing.video_url || null,
        project_url: editing.project_url || null,
        project_date: editing.project_date || null,
        tags: editing.tags || [],
        links: editing.links || [],
        files: editing.files || [],
        custom_data: editing.custom_data || {},
        is_featured: !!editing.is_featured,
        is_published: editing.is_published !== false,
        display_order: editing.display_order ?? items.length,
      };
      const { error } = editing.id
        ? await supabase.from("portfolio_items").update(payload).eq("id", editing.id)
        : await supabase.from("portfolio_items").insert(payload);
      if (error) throw error;
      toast.success(editing.id ? "Projeto atualizado" : "Projeto adicionado");
      setEditing(null);
      onReload();
    } catch (e: any) {
      toast.error(e?.message || "Erro ao salvar projeto");
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from("portfolio_items").delete().eq("id", deleteId);
    if (error) toast.error(error.message);
    else {
      toast.success("Projeto excluído");
      onReload();
    }
    setDeleteId(null);
  };

  const toggleFeatured = async (item: PortfolioItemRecord) => {
    await supabase.from("portfolio_items").update({ is_featured: !item.is_featured }).eq("id", item.id);
    onReload();
  };

  const setEdit = (patch: Partial<PortfolioItemRecord>) => setEditing((prev) => ({ ...(prev || {}), ...patch }));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {items.length} projeto{items.length === 1 ? "" : "s"} — arraste para ordenar.
        </p>
        <Button size="sm" onClick={() => setEditing(emptyItem())}>
          <Plus className="mr-1 h-4 w-4" /> Novo projeto
        </Button>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={sorted.map((i) => i.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {sorted.map((item) => (
              <SortableItem
                key={item.id}
                item={item}
                onEdit={() => setEditing(item)}
                onDelete={() => setDeleteId(item.id)}
                onToggleFeatured={() => toggleFeatured(item)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {items.length === 0 && (
        <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          Nenhum projeto cadastrado. Clique em “Novo projeto”.
        </div>
      )}

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="z-[250] max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing?.id ? "Editar projeto" : "Novo projeto"}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[65vh] pr-3">
            <div className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label className="text-xs">Nome do projeto*</Label>
                  <Input className="h-9" value={editing?.title || ""} onChange={(e) => setEdit({ title: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Categoria</Label>
                  <Input className="h-9" placeholder="Ex.: Casamento, Branding..." value={editing?.category || ""} onChange={(e) => setEdit({ category: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Cliente</Label>
                  <Input className="h-9" value={editing?.client_name || ""} onChange={(e) => setEdit({ client_name: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Data do projeto</Label>
                  <Input type="date" className="h-9" value={editing?.project_date || ""} onChange={(e) => setEdit({ project_date: e.target.value || null })} />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Descrição</Label>
                <Textarea rows={4} value={editing?.description || ""} onChange={(e) => setEdit({ description: e.target.value })} />
              </div>

              <CaptureImageInput label="Imagem de capa" value={editing?.image_url || ""} onChange={(v) => setEdit({ image_url: v })} />

              <div className="space-y-2">
                <Label className="text-xs">Galeria do projeto</Label>
                {(editing?.images || []).map((img, idx) => (
                  <div key={idx} className="flex items-end gap-2">
                    <div className="flex-1">
                      <CaptureImageInput
                        label={`Imagem ${idx + 1}`}
                        value={img}
                        onChange={(v) => {
                          const list = [...(editing?.images || [])];
                          list[idx] = v;
                          setEdit({ images: list });
                        }}
                      />
                    </div>
                    <Button variant="ghost" size="sm" className="h-9 w-9 p-0 text-destructive" onClick={() => setEdit({ images: (editing?.images || []).filter((_, i) => i !== idx) })}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={() => setEdit({ images: [...(editing?.images || []), ""] })}>
                  <Plus className="mr-1 h-4 w-4" /> Adicionar imagem
                </Button>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label className="text-xs">Vídeo (YouTube/Vimeo)</Label>
                  <Input className="h-9" value={editing?.video_url || ""} onChange={(e) => setEdit({ video_url: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Link principal do projeto</Label>
                  <Input className="h-9" value={editing?.project_url || ""} onChange={(e) => setEdit({ project_url: e.target.value })} />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Etiquetas (separe por vírgula)</Label>
                <Input
                  className="h-9"
                  value={(editing?.tags || []).join(", ")}
                  onChange={(e) => setEdit({ tags: e.target.value.split(",").map((t) => t.trim()).filter(Boolean) })}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Links extras</Label>
                {(editing?.links || []).map((l, idx) => (
                  <div key={idx} className="flex gap-2">
                    <Input
                      className="h-9"
                      placeholder="Rótulo"
                      value={l.label}
                      onChange={(e) => {
                        const list = [...(editing?.links || [])];
                        list[idx] = { ...list[idx], label: e.target.value };
                        setEdit({ links: list });
                      }}
                    />
                    <Input
                      className="h-9"
                      placeholder="https://"
                      value={l.url}
                      onChange={(e) => {
                        const list = [...(editing?.links || [])];
                        list[idx] = { ...list[idx], url: e.target.value };
                        setEdit({ links: list });
                      }}
                    />
                    <Button variant="ghost" size="sm" className="h-9 w-9 p-0 text-destructive" onClick={() => setEdit({ links: (editing?.links || []).filter((_, i) => i !== idx) })}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={() => setEdit({ links: [...(editing?.links || []), { label: "", url: "" }] })}>
                  <Plus className="mr-1 h-4 w-4" /> Adicionar link
                </Button>
              </div>

              {customFields.length > 0 && (
                <div className="space-y-3 rounded-lg border p-3">
                  <Label className="text-xs font-semibold">Campos personalizados</Label>
                  {customFields.map((f) => {
                    const value = (editing?.custom_data || {})[f.label] ?? "";
                    const update = (v: any) => setEdit({ custom_data: { ...(editing?.custom_data || {}), [f.label]: v } });
                    return (
                      <div key={f.id} className="space-y-1">
                        <Label className="text-xs">{f.label}{f.required ? "*" : ""}</Label>
                        {f.type === "textarea" ? (
                          <Textarea rows={3} value={value} onChange={(e) => update(e.target.value)} placeholder={f.placeholder} />
                        ) : f.type === "select" ? (
                          <select
                            className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                            value={value}
                            onChange={(e) => update(e.target.value)}
                          >
                            <option value="">Selecione</option>
                            {(f.options || []).map((o) => (
                              <option key={o} value={o}>
                                {o}
                              </option>
                            ))}
                          </select>
                        ) : f.type === "checkbox" ? (
                          <Switch checked={!!value} onCheckedChange={update} />
                        ) : (
                          <Input
                            className="h-9"
                            type={f.type === "number" ? "number" : f.type === "birthdate" ? "date" : "text"}
                            value={value}
                            placeholder={f.placeholder}
                            onChange={(e) => update(e.target.value)}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="flex items-center justify-between rounded-md border p-2">
                <Label className="text-xs">Destacar projeto</Label>
                <Switch checked={!!editing?.is_featured} onCheckedChange={(v) => setEdit({ is_featured: v })} />
              </div>
              <div className="flex items-center justify-between rounded-md border p-2">
                <Label className="text-xs">Exibir no portfólio</Label>
                <Switch checked={editing?.is_published !== false} onCheckedChange={(v) => setEdit({ is_published: v })} />
              </div>
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>
              Cancelar
            </Button>
            <Button onClick={save} disabled={saving}>
              {saving ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null} Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent className="z-[300]">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir projeto?</AlertDialogTitle>
            <AlertDialogDescription>Essa ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={remove} className="bg-destructive text-destructive-foreground">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PortfolioItemsEditor;
