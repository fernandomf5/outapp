import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
import { Plus, Pencil, Trash2, Check, X, Tags, GripVertical } from "lucide-react";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useFinancialCategories, FinancialCategory } from "@/hooks/useFinancialCategories";

const COLORS = ["#6366f1", "#22c55e", "#ef4444", "#f59e0b", "#0ea5e9", "#a855f7", "#ec4899", "#14b8a6"];

interface CategoryManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  businessId: string;
  transactions: any[];
  onSelectCategory: (name: string) => void;
}

const SortableCategoryRow = ({
  category,
  stats,
  onEdit,
  onDelete,
  onSelect,
}: {
  category: FinancialCategory;
  stats: { count: number; income: number; expense: number };
  onEdit: () => void;
  onDelete: () => void;
  onSelect: () => void;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: category.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 rounded-lg border bg-card p-3"
    >
      <button type="button" className="cursor-grab text-muted-foreground" {...attributes} {...listeners}>
        <GripVertical className="h-4 w-4" />
      </button>
      <span className="h-4 w-4 shrink-0 rounded-full" style={{ backgroundColor: category.color || "#6366f1" }} />
      <button type="button" onClick={onSelect} className="flex-1 text-left">
        <p className="font-medium">{category.name}</p>
        <p className="text-xs text-muted-foreground">
          {stats.count} conta(s) • Receitas R$ {stats.income.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} • Despesas R$ {stats.expense.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
        </p>
      </button>
      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onEdit}>
        <Pencil className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={onDelete}>
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
};

export const CategoryManager = ({ open, onOpenChange, businessId, transactions, onSelectCategory }: CategoryManagerProps) => {
  const { categories, createCategory, updateCategory, deleteCategory, reorderCategories } = useFinancialCategories(businessId);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(COLORS[0]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState(COLORS[0]);
  const [deleteTarget, setDeleteTarget] = useState<FinancialCategory | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const statsByCategory = useMemo(() => {
    const map = new Map<string, { count: number; income: number; expense: number }>();
    transactions.forEach((t) => {
      const key = (t.category || "").trim().toLowerCase();
      const current = map.get(key) || { count: 0, income: 0, expense: 0 };
      current.count += 1;
      if (t.type === "income") current.income += Number(t.amount || 0);
      else current.expense += Number(t.amount || 0);
      map.set(key, current);
    });
    return map;
  }, [transactions]);

  const uncategorized = useMemo(
    () =>
      transactions.filter(
        (t) => !categories.some((c) => c.name.trim().toLowerCase() === (t.category || "").trim().toLowerCase())
      ),
    [transactions, categories]
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = categories.findIndex((c) => c.id === active.id);
    const newIndex = categories.findIndex((c) => c.id === over.id);
    reorderCategories(arrayMove(categories, oldIndex, newIndex).map((c) => c.id));
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    await createCategory(newName.trim(), newColor);
    setNewName("");
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[720px] w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Tags className="h-5 w-5" /> Categorias financeiras
            </DialogTitle>
          </DialogHeader>

          <Card>
            <CardContent className="space-y-3 p-4">
              <Label>Nova categoria</Label>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Ex.: Aluguel, Fornecedores, Vendas..."
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleCreate();
                    }
                  }}
                />
                <div className="flex items-center gap-1">
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setNewColor(c)}
                      className={`h-6 w-6 rounded-full border-2 ${newColor === c ? "border-foreground" : "border-transparent"}`}
                      style={{ backgroundColor: c }}
                      aria-label={`Cor ${c}`}
                    />
                  ))}
                </div>
                <Button onClick={handleCreate} disabled={!newName.trim()}>
                  <Plus className="mr-2 h-4 w-4" /> Adicionar
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-2">
            {categories.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">Nenhuma categoria cadastrada ainda.</p>
            ) : (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={categories.map((c) => c.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-2">
                    {categories.map((category) =>
                      editingId === category.id ? (
                        <div key={category.id} className="flex flex-col gap-2 rounded-lg border bg-card p-3 sm:flex-row sm:items-center">
                          <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="flex-1" />
                          <div className="flex items-center gap-1">
                            {COLORS.map((c) => (
                              <button
                                key={c}
                                type="button"
                                onClick={() => setEditColor(c)}
                                className={`h-6 w-6 rounded-full border-2 ${editColor === c ? "border-foreground" : "border-transparent"}`}
                                style={{ backgroundColor: c }}
                                aria-label={`Cor ${c}`}
                              />
                            ))}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="icon"
                              className="h-8 w-8"
                              onClick={async () => {
                                if (!editName.trim()) return;
                                await updateCategory(category.id, { name: editName.trim(), color: editColor });
                                setEditingId(null);
                              }}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditingId(null)}>
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <SortableCategoryRow
                          key={category.id}
                          category={category}
                          stats={statsByCategory.get(category.name.trim().toLowerCase()) || { count: 0, income: 0, expense: 0 }}
                          onEdit={() => {
                            setEditingId(category.id);
                            setEditName(category.name);
                            setEditColor(category.color || COLORS[0]);
                          }}
                          onDelete={() => setDeleteTarget(category)}
                          onSelect={() => {
                            onSelectCategory(category.name);
                            onOpenChange(false);
                          }}
                        />
                      )
                    )}
                  </div>
                </SortableContext>
              </DndContext>
            )}

            {uncategorized.length > 0 && (
              <div className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
                <Badge variant="secondary" className="mr-2">
                  {uncategorized.length}
                </Badge>
                transação(ões) com categoria fora da lista cadastrada.
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent className="z-[300]">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir categoria</AlertDialogTitle>
            <AlertDialogDescription>
              A categoria "{deleteTarget?.name}" será removida. As transações existentes continuarão com o texto da categoria.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (deleteTarget) await deleteCategory(deleteTarget.id);
                setDeleteTarget(null);
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>

      </AlertDialog>
    </>
  );
};
