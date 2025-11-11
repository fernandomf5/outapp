import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Clock, CheckCircle2, StickyNote } from "lucide-react";
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
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    reminder_date: ''
  });

  useEffect(() => {
    loadNotes();
    
    // Check for reminders every minute
    const reminderInterval = setInterval(() => {
      checkReminders();
    }, 60000); // Check every minute

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

      const { error } = await supabase
        .from('quick_notes' as any)
        .insert([{
          user_id: user.id,
          title: formData.title,
          content: formData.content,
          reminder_date: formData.reminder_date || null,
          is_completed: false
        }] as any);

      if (error) throw error;

      toast.success("Nota adicionada!");
      setIsDialogOpen(false);
      setFormData({ title: '', content: '', reminder_date: '' });
      loadNotes();
    } catch (error) {
      toast.error("Erro ao adicionar nota");
    }
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
    notes.forEach(note => {
      if (!note.is_completed && note.reminder_date) {
        try {
          // Parse reminder_date as UTC and convert to local time for comparison
          const reminderDate = new Date(note.reminder_date + 'Z'); // Add 'Z' to treat as UTC
          
          // Validate date
          if (isNaN(reminderDate.getTime())) return;
          
          // Show reminder if time has passed and not shown before
          if (reminderDate <= now) {
            const lastShown = localStorage.getItem(`reminder_${note.id}`);
            const lastShownDate = lastShown ? new Date(lastShown) : null;
            
            // Only show if never shown or if it's been more than 1 hour
            if (!lastShownDate || (now.getTime() - lastShownDate.getTime()) > 3600000) {
              showReminderDialog(note);
              localStorage.setItem(`reminder_${note.id}`, now.toISOString());
            }
          }
        } catch (error) {
          console.error('Invalid reminder date for note:', note.id, error);
        }
      }
    });
  };

  const showReminderDialog = (note: Note) => {
    // Create reminder dialog
    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSiC0fPTgjMGHm7A7+OZRQ0PVKno7q5aGApCm9/zuWEiByB61+/alEELETi25NZQOS');
    audio.play().catch(() => {}); // Play notification sound

    toast.warning(note.title, {
      description: note.content,
      duration: 10000,
      action: {
        label: "Marcar como concluído",
        onClick: () => handleToggleComplete(note.id, note.is_completed)
      }
    });
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
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-1" />
                Nova
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nova Anotação</DialogTitle>
                <DialogDescription>Crie uma nota rápida com lembrete opcional</DialogDescription>
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
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleAddNote} className="gradient-primary">
                  Adicionar
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
                        const date = new Date(note.reminder_date + 'Z');
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
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => handleDeleteNote(note.id)}
                  >
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
