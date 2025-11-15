import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Clock, CheckCircle2, StickyNote, Pencil } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Note {
  id: string;
  title: string;
  content: string;
  reminder_date?: string;
  is_completed: boolean;
  created_at: string;
}

export const QuickNotesPanel = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [reminderNote, setReminderNote] = useState<Note | null>(null);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    reminder_date: ''
  });

  useEffect(() => {
    loadNotes();
  }, []);

  useEffect(() => {
    // Check for reminders every 10 seconds for better responsiveness
    const reminderInterval = setInterval(() => {
      checkReminders();
    }, 10000);

    // Initial check
    checkReminders();

    return () => clearInterval(reminderInterval);
  }, [notes]);

  const loadNotes = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('quick_notes' as any)
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotes((data as any) || []);
    } catch (error) {
      console.error("Erro ao carregar notas:", error);
    }
  };

  const handleAddNote = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Convert local datetime to UTC for storage
      let reminderDateUTC = null;
      if (formData.reminder_date) {
        const localDate = new Date(formData.reminder_date);
        reminderDateUTC = localDate.toISOString();
        console.log('Saving reminder:', {
          local: formData.reminder_date,
          utc: reminderDateUTC,
          localDate: localDate.toString()
        });
      }

      if (editingNote) {
        // Atualizar nota existente
        const { error } = await supabase
          .from('quick_notes' as any)
          .update({
            title: formData.title,
            content: formData.content,
            reminder_date: reminderDateUTC,
          } as any)
          .eq('id', editingNote.id);

        if (error) throw error;
        toast.success("Nota atualizada!");
      } else {
        // Criar nova nota
        const { error } = await supabase
          .from('quick_notes' as any)
          .insert([{
            user_id: user.id,
            title: formData.title,
            content: formData.content,
            reminder_date: reminderDateUTC,
            is_completed: false
          }] as any);

        if (error) throw error;
        toast.success("Nota adicionada!");
      }

      setIsDialogOpen(false);
      setEditingNote(null);
      setFormData({ title: '', content: '', reminder_date: '' });
      loadNotes();
    } catch (error) {
      console.error('Error saving note:', error);
      toast.error(editingNote ? "Erro ao atualizar nota" : "Erro ao adicionar nota");
    }
  };

  const handleEditNote = (note: Note) => {
    setEditingNote(note);
    
    // Converter data UTC para formato datetime-local
    let localDateTime = '';
    if (note.reminder_date) {
      const date = new Date(note.reminder_date);
      // Format: YYYY-MM-DDTHH:mm
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      localDateTime = `${year}-${month}-${day}T${hours}:${minutes}`;
    }
    
    setFormData({
      title: note.title,
      content: note.content,
      reminder_date: localDateTime
    });
    setIsDialogOpen(true);
  };

  const handleToggleComplete = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('quick_notes' as any)
        .update({ is_completed: !currentStatus } as any)
        .eq('id', id);

      if (error) throw error;
      loadNotes();
    } catch (error) {
      toast.error("Erro ao atualizar nota");
    }
  };

  const handleDeleteNote = async (id: string) => {
    try {
      const { error } = await supabase
        .from('quick_notes' as any)
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success("Nota excluída!");
      loadNotes();
    } catch (error) {
      toast.error("Erro ao excluir nota");
    }
  };

  const checkReminders = () => {
    const now = new Date();
    console.log('Checking reminders at:', now.toLocaleString(), 'Notes count:', notes.length);
    
    notes.forEach(note => {
      if (!note.is_completed && note.reminder_date) {
        try {
          // Parse the reminder date from database (it's stored as ISO string in UTC)
          const reminderDate = new Date(note.reminder_date);
          
          // Validate date
          if (isNaN(reminderDate.getTime())) {
            console.error('Invalid date for note:', note.id, note.reminder_date);
            return;
          }
          
          console.log('Checking note:', {
            id: note.id,
            title: note.title,
            reminderDate: reminderDate.toLocaleString(),
            now: now.toLocaleString(),
            isPast: reminderDate <= now
          });
          
          // Show reminder if time has passed and not shown before
          if (reminderDate <= now) {
            const lastShown = localStorage.getItem(`reminder_${note.id}`);
            const lastShownDate = lastShown ? new Date(lastShown) : null;
            
            // Only show if never shown or if it's been more than 1 hour
            if (!lastShownDate || (now.getTime() - lastShownDate.getTime()) > 3600000) {
              console.log('Showing reminder for note:', note.id);
              showReminderDialog(note);
              localStorage.setItem(`reminder_${note.id}`, now.toISOString());
            } else {
              console.log('Reminder already shown recently for note:', note.id);
            }
          }
        } catch (error) {
          console.error('Error checking reminder for note:', note.id, error);
        }
      }
    });
  };

  const showReminderDialog = (note: Note) => {
    // Play notification sound
    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSiC0fPTgjMGHm7A7+OZRQ0PVKno7q5aGApCm9/zuWEiByB61+/alEELETi25NZQOS');
    audio.play().catch(() => {});

    // Show visual popup
    setReminderNote(note);
  };

  const getPendingReminders = () => {
    return notes.filter(note => {
      if (!note.is_completed && note.reminder_date) {
        try {
          const reminderDate = new Date(note.reminder_date);
          return !isNaN(reminderDate.getTime()) && reminderDate <= new Date();
        } catch {
          return false;
        }
      }
      return false;
    }).length;
  };

  return (
    <>
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
                if (reminderNote) {
                  handleToggleComplete(reminderNote.id, reminderNote.is_completed);
                }
                setReminderNote(null);
              }}
              className="gradient-primary"
            >
              Marcar como concluído
            </AlertDialogAction>
            <AlertDialogAction onClick={() => setReminderNote(null)}>
              Fechar
            </AlertDialogAction>
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
            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) {
                setEditingNote(null);
                setFormData({ title: '', content: '', reminder_date: '' });
              }
            }}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                  <Plus className="h-4 w-4 mr-1" />
                  Nova
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingNote ? 'Editar Anotação' : 'Nova Anotação'}</DialogTitle>
                  <DialogDescription>
                    {editingNote ? 'Edite sua nota rápida' : 'Crie uma nota rápida com lembrete opcional'}
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
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
                    <Label>Lembrete (Opcional)</Label>
                    <Input
                      type="datetime-local"
                      value={formData.reminder_date}
                      onChange={(e) => setFormData({ ...formData, reminder_date: e.target.value })}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => {
                    setIsDialogOpen(false);
                    setEditingNote(null);
                    setFormData({ title: '', content: '', reminder_date: '' });
                  }}>
                    Cancelar
                  </Button>
                  <Button onClick={handleAddNote} className="gradient-primary">
                    {editingNote ? 'Salvar' : 'Adicionar'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
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
              {notes.map((note) => (
                <div
                  key={note.id}
                  className={`p-3 rounded-lg border transition-smooth ${
                    note.is_completed ? 'bg-muted/50 opacity-60' : 'bg-card hover:shadow-md'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 mt-0.5"
                      onClick={() => handleToggleComplete(note.id, note.is_completed)}
                    >
                      <CheckCircle2 
                        className={`h-4 w-4 ${note.is_completed ? 'text-success' : 'text-muted-foreground'}`}
                      />
                    </Button>
                    <div className="flex-1 min-w-0">
                      <h4 className={`font-medium text-sm ${note.is_completed ? 'line-through' : ''}`}>
                        {note.title}
                      </h4>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                        {note.content}
                      </p>
                    {note.reminder_date && (() => {
                      try {
                        const date = new Date(note.reminder_date);
                        if (isNaN(date.getTime())) return null;
                        return (
                          <div className="flex items-center gap-1 mt-2">
                            <Clock className="h-3 w-3" />
                            <span className="text-xs">
                              {format(date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                            </span>
                          </div>
                        );
                      } catch {
                        return null;
                      }
                    })()}
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => handleEditNote(note)}
                      >
                        <Pencil className="h-3.5 w-3.5 text-primary" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => handleDeleteNote(note.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
};
