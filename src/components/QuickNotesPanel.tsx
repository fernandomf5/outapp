import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Clock, CheckCircle2, StickyNote, Pencil, ListChecks, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Progress } from "@/components/ui/progress";

interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
}

interface Note {
  id: string;
  title: string;
  content: string;
  reminder_date?: string;
  is_completed: boolean;
  created_at: string;
  checklist?: ChecklistItem[];
}

const emptyForm = { title: "", content: "", reminder_date: "", checklist: [] as ChecklistItem[] };

export const QuickNotesPanel = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [reminderNote, setReminderNote] = useState<Note | null>(null);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [detailNote, setDetailNote] = useState<Note | null>(null);
  const [formData, setFormData] = useState(emptyForm);
  const [newChecklistText, setNewChecklistText] = useState("");

  useEffect(() => { loadNotes(); }, []);

  useEffect(() => {
    const reminderInterval = setInterval(() => checkReminders(), 10000);
    checkReminders();
    return () => clearInterval(reminderInterval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notes]);

  const loadNotes = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await supabase
        .from("quick_notes" as any)
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      const mapped: Note[] = ((data as any) || []).map((n: any) => ({
        ...n,
        checklist: Array.isArray(n.checklist) ? n.checklist : [],
      }));
      setNotes(mapped);
      // refresh detail view if open
      setDetailNote((prev) => (prev ? mapped.find((m) => m.id === prev.id) ?? null : null));
    } catch (error) {
      console.error("Erro ao carregar notas:", error);
    }
  };

  const openNewDialog = () => {
    setEditingNote(null);
    setFormData(emptyForm);
    setNewChecklistText("");
    setIsDialogOpen(true);
  };

  const handleEditNote = (note: Note) => {
    setEditingNote(note);
    let localDateTime = "";
    if (note.reminder_date) {
      const date = new Date(note.reminder_date);
      const pad = (n: number) => String(n).padStart(2, "0");
      localDateTime = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
    }
    setFormData({
      title: note.title,
      content: note.content,
      reminder_date: localDateTime,
      checklist: note.checklist ?? [],
    });
    setNewChecklistText("");
    setDetailNote(null);
    setIsDialogOpen(true);
  };

  const handleSaveNote = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      let reminderDateUTC: string | null = null;
      if (formData.reminder_date) reminderDateUTC = new Date(formData.reminder_date).toISOString();

      const payload: any = {
        title: formData.title,
        content: formData.content,
        reminder_date: reminderDateUTC,
        checklist: formData.checklist,
      };

      if (editingNote) {
        const { error } = await supabase.from("quick_notes" as any).update(payload).eq("id", editingNote.id);
        if (error) throw error;
        toast.success("Nota atualizada!");
      } else {
        const { error } = await supabase.from("quick_notes" as any).insert([{ ...payload, user_id: user.id, is_completed: false }]);
        if (error) throw error;
        toast.success("Nota adicionada!");
      }

      setIsDialogOpen(false);
      setEditingNote(null);
      setFormData(emptyForm);
      loadNotes();
    } catch (error) {
      console.error("Error saving note:", error);
      toast.error(editingNote ? "Erro ao atualizar nota" : "Erro ao adicionar nota");
    }
  };

  const handleToggleComplete = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase.from("quick_notes" as any).update({ is_completed: !currentStatus } as any).eq("id", id);
      if (error) throw error;
      loadNotes();
    } catch {
      toast.error("Erro ao atualizar nota");
    }
  };

  const handleDeleteNote = async (id: string) => {
    try {
      const { error } = await supabase.from("quick_notes" as any).delete().eq("id", id);
      if (error) throw error;
      toast.success("Nota excluída!");
      setDetailNote(null);
      loadNotes();
    } catch {
      toast.error("Erro ao excluir nota");
    }
  };

  // ===== Checklist editing (form) =====
  const addChecklistItem = () => {
    if (!newChecklistText.trim()) return;
    setFormData((f) => ({
      ...f,
      checklist: [...f.checklist, { id: crypto.randomUUID(), text: newChecklistText.trim(), done: false }],
    }));
    setNewChecklistText("");
  };

  const removeChecklistItem = (id: string) => {
    setFormData((f) => ({ ...f, checklist: f.checklist.filter((c) => c.id !== id) }));
  };

  const toggleFormChecklist = (id: string) => {
    setFormData((f) => ({
      ...f,
      checklist: f.checklist.map((c) => (c.id === id ? { ...c, done: !c.done } : c)),
    }));
  };

  // ===== Checklist toggle from detail view (persisted) =====
  const toggleNoteChecklistItem = async (note: Note, itemId: string) => {
    const updated = (note.checklist ?? []).map((c) => (c.id === itemId ? { ...c, done: !c.done } : c));
    try {
      const { error } = await supabase.from("quick_notes" as any).update({ checklist: updated } as any).eq("id", note.id);
      if (error) throw error;
      setNotes((prev) => prev.map((n) => (n.id === note.id ? { ...n, checklist: updated } : n)));
      setDetailNote((prev) => (prev ? { ...prev, checklist: updated } : prev));
    } catch {
      toast.error("Erro ao atualizar checklist");
    }
  };

  const checkReminders = () => {
    const now = new Date();
    notes.forEach((note) => {
      if (!note.is_completed && note.reminder_date) {
        try {
          const reminderDate = new Date(note.reminder_date);
          if (isNaN(reminderDate.getTime())) return;
          if (reminderDate <= now) {
            const lastShown = localStorage.getItem(`reminder_${note.id}`);
            const lastShownDate = lastShown ? new Date(lastShown) : null;
            if (!lastShownDate || now.getTime() - lastShownDate.getTime() > 3600000) {
              setReminderNote(note);
              localStorage.setItem(`reminder_${note.id}`, now.toISOString());
            }
          }
        } catch (error) {
          console.error("Error checking reminder:", error);
        }
      }
    });
  };

  const getPendingReminders = () =>
    notes.filter((n) => {
      if (!n.is_completed && n.reminder_date) {
        const d = new Date(n.reminder_date);
        return !isNaN(d.getTime()) && d <= new Date();
      }
      return false;
    }).length;

  const checklistProgress = (note: Note) => {
    const list = note.checklist ?? [];
    if (list.length === 0) return null;
    const done = list.filter((c) => c.done).length;
    return { done, total: list.length, pct: Math.round((done / list.length) * 100) };
  };

  return (
    <>
      {/* Reminder popup */}
      <AlertDialog open={!!reminderNote} onOpenChange={(open) => !open && setReminderNote(null)}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              {reminderNote?.title}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base pt-2">
              {reminderNote?.content}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction
              onClick={() => {
                if (reminderNote) handleToggleComplete(reminderNote.id, reminderNote.is_completed);
                setReminderNote(null);
              }}
              className="gradient-primary"
            >
              Marcar como concluído
            </AlertDialogAction>
            <AlertDialogAction onClick={() => setReminderNote(null)}>Fechar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Card className="glass">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <StickyNote className="h-5 w-5" />
              <CardTitle className="text-lg">Anotações Rápidas</CardTitle>
              {getPendingReminders() > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {getPendingReminders()} lembrete(s)
                </Badge>
              )}
            </div>
            <Button size="sm" variant="outline" onClick={openNewDialog}>
              <Plus className="h-4 w-4 mr-1" />
              Nova
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {notes.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <StickyNote className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Nenhuma anotação ainda</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {notes.map((note) => {
                const prog = checklistProgress(note);
                return (
                  <div
                    key={note.id}
                    onClick={() => setDetailNote(note)}
                    className={`p-3 rounded-lg border transition-smooth cursor-pointer ${
                      note.is_completed ? "bg-muted/50 opacity-60" : "bg-card hover:shadow-md hover:border-primary/40"
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 mt-0.5"
                        onClick={(e) => { e.stopPropagation(); handleToggleComplete(note.id, note.is_completed); }}
                      >
                        <CheckCircle2 className={`h-4 w-4 ${note.is_completed ? "text-success" : "text-muted-foreground"}`} />
                      </Button>
                      <div className="flex-1 min-w-0">
                        <h4 className={`font-medium text-sm ${note.is_completed ? "line-through" : ""}`}>
                          {note.title}
                        </h4>
                        {note.content && (
                          <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{note.content}</p>
                        )}
                        {prog && (
                          <div className="mt-2 flex items-center gap-2">
                            <ListChecks className="h-3.5 w-3.5 text-primary" />
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              {prog.done}/{prog.total}
                            </span>
                            <Progress value={prog.pct} className="h-1.5 flex-1" />
                          </div>
                        )}
                        {note.reminder_date && (() => {
                          const d = new Date(note.reminder_date);
                          if (isNaN(d.getTime())) return null;
                          return (
                            <div className="flex items-center gap-1 mt-2">
                              <Clock className="h-3 w-3" />
                              <span className="text-xs">
                                {format(d, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                              </span>
                            </div>
                          );
                        })()}
                      </div>
                      <div className="flex gap-1 items-center" onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleEditNote(note)}>
                          <Pencil className="h-3.5 w-3.5 text-primary" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleDeleteNote(note.id)}>
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create / Edit dialog */}
      <Dialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) { setEditingNote(null); setFormData(emptyForm); setNewChecklistText(""); }
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingNote ? "Editar Anotação" : "Nova Anotação"}</DialogTitle>
            <DialogDescription>
              {editingNote ? "Edite sua nota rápida" : "Crie uma nota com checklist e lembrete opcionais"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2 max-h-[60vh] overflow-y-auto pr-1">
            <div className="grid gap-2">
              <Label>Título</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Ex: Ligar para cliente"
              />
            </div>
            <div className="grid gap-2">
              <Label>Conteúdo</Label>
              <Textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Detalhes da anotação..."
                rows={4}
              />
            </div>

            <div className="grid gap-2">
              <Label className="flex items-center gap-2">
                <ListChecks className="h-4 w-4" />
                Checklist
              </Label>
              <div className="space-y-1.5">
                {formData.checklist.map((item) => (
                  <div key={item.id} className="flex items-center gap-2 p-2 rounded-md border bg-card">
                    <Checkbox checked={item.done} onCheckedChange={() => toggleFormChecklist(item.id)} />
                    <Input
                      value={item.text}
                      onChange={(e) =>
                        setFormData((f) => ({
                          ...f,
                          checklist: f.checklist.map((c) => (c.id === item.id ? { ...c, text: e.target.value } : c)),
                        }))
                      }
                      className={`h-8 border-0 px-1 focus-visible:ring-0 ${item.done ? "line-through text-muted-foreground" : ""}`}
                    />
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeChecklistItem(item.id)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <Input
                    value={newChecklistText}
                    onChange={(e) => setNewChecklistText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") { e.preventDefault(); addChecklistItem(); }
                    }}
                    placeholder="Adicionar item da checklist..."
                  />
                  <Button type="button" variant="secondary" onClick={addChecklistItem}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Lembrete (Opcional)</Label>
              <Input
                type="datetime-local"
                value={formData.reminder_date}
                onChange={(e) => setFormData({ ...formData, reminder_date: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => { setIsDialogOpen(false); setEditingNote(null); setFormData(emptyForm); }}
            >
              Cancelar
            </Button>
            <Button onClick={handleSaveNote} className="gradient-primary">
              {editingNote ? "Salvar" : "Adicionar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail dialog */}
      <Dialog open={!!detailNote} onOpenChange={(open) => !open && setDetailNote(null)}>
        <DialogContent className="max-w-lg">
          {detailNote && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <StickyNote className="h-5 w-5 text-primary" />
                  {detailNote.title}
                </DialogTitle>
                {detailNote.reminder_date && (() => {
                  const d = new Date(detailNote.reminder_date);
                  if (isNaN(d.getTime())) return null;
                  return (
                    <DialogDescription className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {format(d, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </DialogDescription>
                  );
                })()}
              </DialogHeader>
              <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                {detailNote.content && (
                  <p className="text-sm whitespace-pre-wrap text-foreground/90">{detailNote.content}</p>
                )}
                {(detailNote.checklist ?? []).length > 0 && (() => {
                  const prog = checklistProgress(detailNote)!;
                  return (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <ListChecks className="h-4 w-4 text-primary" />
                        Checklist
                        <span className="text-xs text-muted-foreground ml-auto">
                          {prog.done}/{prog.total}
                        </span>
                      </div>
                      <Progress value={prog.pct} className="h-1.5" />
                      <div className="space-y-1.5">
                        {(detailNote.checklist ?? []).map((item) => (
                          <label
                            key={item.id}
                            className="flex items-center gap-2 p-2 rounded-md border bg-card hover:bg-accent/40 cursor-pointer"
                          >
                            <Checkbox
                              checked={item.done}
                              onCheckedChange={() => toggleNoteChecklistItem(detailNote, item.id)}
                            />
                            <span className={`text-sm flex-1 ${item.done ? "line-through text-muted-foreground" : ""}`}>
                              {item.text}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>
              <DialogFooter className="gap-2 sm:gap-2">
                <Button variant="outline" onClick={() => handleToggleComplete(detailNote.id, detailNote.is_completed)}>
                  <CheckCircle2 className="h-4 w-4 mr-1" />
                  {detailNote.is_completed ? "Reabrir" : "Concluir"}
                </Button>
                <Button variant="outline" onClick={() => handleEditNote(detailNote)}>
                  <Pencil className="h-4 w-4 mr-1" />
                  Editar
                </Button>
                <Button variant="destructive" onClick={() => handleDeleteNote(detailNote.id)}>
                  <Trash2 className="h-4 w-4 mr-1" />
                  Excluir
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
