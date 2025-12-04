import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, addDays, isSameDay, isWithinInterval, parseISO, startOfDay, addMinutes, isBefore, isAfter } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Plus, Calendar as CalendarIcon, Clock, Trash2, Edit2, Bell, ChevronLeft, ChevronRight, X, AlertCircle, Check } from 'lucide-react';

interface AgendaEvent {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  start_date: string;
  end_date: string | null;
  all_day: boolean;
  color: string;
  reminder_minutes: number;
  reminder_shown: boolean;
  created_at: string;
  updated_at: string;
}

const COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444', '#f97316', 
  '#eab308', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6'
];

export function AgendaPanel() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [events, setEvents] = useState<AgendaEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [view, setView] = useState<'day' | 'week' | 'month'>('month');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<AgendaEvent | null>(null);
  const [loading, setLoading] = useState(true);
  

  // Form state
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formStartDate, setFormStartDate] = useState('');
  const [formStartTime, setFormStartTime] = useState('09:00');
  const [formEndDate, setFormEndDate] = useState('');
  const [formEndTime, setFormEndTime] = useState('10:00');
  const [formAllDay, setFormAllDay] = useState(false);
  const [formColor, setFormColor] = useState('#6366f1');
  const [formReminderMinutes, setFormReminderMinutes] = useState(15);

  const fetchEvents = useCallback(async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('agenda_events')
      .select('*')
      .eq('user_id', user.id)
      .order('start_date', { ascending: true });

    if (error) {
      toast({
        title: 'Erro ao carregar eventos',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      setEvents((data as AgendaEvent[]) || []);
    }
    setLoading(false);
  }, [user, toast]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const openCreateDialog = (date?: Date) => {
    setEditingEvent(null);
    const targetDate = date || selectedDate;
    setFormTitle('');
    setFormDescription('');
    setFormStartDate(format(targetDate, 'yyyy-MM-dd'));
    setFormStartTime('09:00');
    setFormEndDate(format(targetDate, 'yyyy-MM-dd'));
    setFormEndTime('10:00');
    setFormAllDay(false);
    setFormColor('#6366f1');
    setFormReminderMinutes(15);
    setIsDialogOpen(true);
  };

  const openEditDialog = (event: AgendaEvent) => {
    setEditingEvent(event);
    const startDate = parseISO(event.start_date);
    const endDate = event.end_date ? parseISO(event.end_date) : startDate;
    
    setFormTitle(event.title);
    setFormDescription(event.description || '');
    setFormStartDate(format(startDate, 'yyyy-MM-dd'));
    setFormStartTime(format(startDate, 'HH:mm'));
    setFormEndDate(format(endDate, 'yyyy-MM-dd'));
    setFormEndTime(format(endDate, 'HH:mm'));
    setFormAllDay(event.all_day);
    setFormColor(event.color);
    setFormReminderMinutes(event.reminder_minutes);
    setIsDialogOpen(true);
  };

  const handleSaveEvent = async () => {
    if (!user || !formTitle.trim()) {
      toast({
        title: 'Título obrigatório',
        description: 'Por favor, insira um título para o evento.',
        variant: 'destructive',
      });
      return;
    }

    // Create proper ISO date strings with timezone
    // Use the local timezone offset to create correct timestamps
    const createLocalISOString = (dateStr: string, timeStr: string) => {
      const [year, month, day] = dateStr.split('-').map(Number);
      const [hours, minutes] = timeStr.split(':').map(Number);
      const date = new Date(year, month - 1, day, hours, minutes, 0);
      return date.toISOString();
    };

    const startDateTime = formAllDay 
      ? createLocalISOString(formStartDate, '00:00')
      : createLocalISOString(formStartDate, formStartTime);
    
    const endDateTime = formAllDay
      ? createLocalISOString(formEndDate, '23:59')
      : createLocalISOString(formEndDate, formEndTime);

    const eventData = {
      user_id: user.id,
      title: formTitle.trim(),
      description: formDescription.trim() || null,
      start_date: startDateTime,
      end_date: endDateTime,
      all_day: formAllDay,
      color: formColor,
      reminder_minutes: formReminderMinutes,
      reminder_shown: false,
    };

    if (editingEvent) {
      const { error } = await supabase
        .from('agenda_events')
        .update(eventData)
        .eq('id', editingEvent.id);

      if (error) {
        toast({
          title: 'Erro ao atualizar evento',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Evento atualizado',
          description: 'O evento foi atualizado com sucesso.',
        });
        fetchEvents();
      }
    } else {
      const { error } = await supabase
        .from('agenda_events')
        .insert(eventData);

      if (error) {
        toast({
          title: 'Erro ao criar evento',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Evento criado',
          description: 'O evento foi adicionado à sua agenda.',
        });
        fetchEvents();
      }
    }

    setIsDialogOpen(false);
  };

  const handleDeleteEvent = async (eventId: string) => {
    const { error } = await supabase
      .from('agenda_events')
      .delete()
      .eq('id', eventId);

    if (error) {
      toast({
        title: 'Erro ao excluir evento',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Evento excluído',
        description: 'O evento foi removido da sua agenda.',
      });
      fetchEvents();
    }
  };

  const getEventsForDate = (date: Date) => {
    return events.filter(event => {
      const eventStart = parseISO(event.start_date);
      const eventEnd = event.end_date ? parseISO(event.end_date) : eventStart;
      return isSameDay(eventStart, date) || 
             (isWithinInterval(date, { start: startOfDay(eventStart), end: startOfDay(eventEnd) }));
    });
  };

  const getEventsForWeek = () => {
    const start = startOfWeek(selectedDate, { locale: ptBR });
    const end = endOfWeek(selectedDate, { locale: ptBR });
    return events.filter(event => {
      const eventDate = parseISO(event.start_date);
      return isWithinInterval(eventDate, { start, end });
    });
  };

  const getEventsForMonth = () => {
    const start = startOfMonth(selectedDate);
    const end = endOfMonth(selectedDate);
    return events.filter(event => {
      const eventDate = parseISO(event.start_date);
      return isWithinInterval(eventDate, { start, end });
    });
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const days = view === 'day' ? 1 : view === 'week' ? 7 : 30;
    const multiplier = direction === 'prev' ? -1 : 1;
    setSelectedDate(prev => addDays(prev, days * multiplier));
  };

  const renderDayView = () => {
    const dayEvents = getEventsForDate(selectedDate);
    
    return (
      <div className="space-y-4">
        <div className="text-center">
          <h3 className="text-lg font-semibold">
            {format(selectedDate, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </h3>
        </div>
        
        <ScrollArea className="h-[400px]">
          {dayEvents.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <CalendarIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Nenhum evento para este dia</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-3"
                onClick={() => openCreateDialog()}
              >
                <Plus className="w-4 h-4 mr-2" />
                Adicionar evento
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {dayEvents.map(event => (
                <EventCard 
                  key={event.id} 
                  event={event} 
                  onEdit={openEditDialog}
                  onDelete={handleDeleteEvent}
                />
              ))}
            </div>
          )}
        </ScrollArea>
      </div>
    );
  };

  const renderWeekView = () => {
    const start = startOfWeek(selectedDate, { locale: ptBR });
    const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
    
    return (
      <div className="space-y-4">
        <div className="text-center">
          <h3 className="text-lg font-semibold">
            Semana de {format(start, "d 'de' MMMM", { locale: ptBR })}
          </h3>
        </div>
        
        <div className="grid grid-cols-7 gap-2">
          {days.map(day => (
            <div 
              key={day.toISOString()} 
              className={`p-2 rounded-lg border min-h-[120px] cursor-pointer hover:bg-accent/50 transition-colors ${
                isSameDay(day, new Date()) ? 'border-primary bg-primary/5' : 'border-border'
              }`}
              onClick={() => {
                setSelectedDate(day);
                setView('day');
              }}
            >
              <div className="text-center mb-2">
                <div className="text-xs text-muted-foreground">
                  {format(day, 'EEE', { locale: ptBR })}
                </div>
                <div className={`text-sm font-medium ${isSameDay(day, new Date()) ? 'text-primary' : ''}`}>
                  {format(day, 'd')}
                </div>
              </div>
              <div className="space-y-1">
                {getEventsForDate(day).slice(0, 3).map(event => (
                  <div 
                    key={event.id}
                    className="text-xs p-1 rounded truncate"
                    style={{ backgroundColor: `${event.color}20`, color: event.color }}
                    title={event.title}
                  >
                    {event.title}
                  </div>
                ))}
                {getEventsForDate(day).length > 3 && (
                  <div className="text-xs text-muted-foreground text-center">
                    +{getEventsForDate(day).length - 3} mais
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderMonthView = () => {
    return (
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-shrink-0">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => date && setSelectedDate(date)}
            locale={ptBR}
            className="rounded-md border"
            modifiers={{
              hasEvent: (date) => getEventsForDate(date).length > 0,
            }}
            modifiersStyles={{
              hasEvent: { 
                fontWeight: 'bold',
                textDecoration: 'underline',
                textDecorationColor: 'hsl(var(--primary))',
              }
            }}
          />
        </div>
        
        <div className="flex-1">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">
              Eventos em {format(selectedDate, "MMMM 'de' yyyy", { locale: ptBR })}
            </h3>
            <Badge variant="secondary">{getEventsForMonth().length} eventos</Badge>
          </div>
          
          <ScrollArea className="h-[350px]">
            {getEventsForMonth().length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <CalendarIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Nenhum evento este mês</p>
              </div>
            ) : (
              <div className="space-y-2">
                {getEventsForMonth().map(event => (
                  <EventCard 
                    key={event.id} 
                    event={event} 
                    onEdit={openEditDialog}
                    onDelete={handleDeleteEvent}
                    showDate
                  />
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center text-muted-foreground">Carregando agenda...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5" />
                Agenda Pessoal
              </CardTitle>
              <CardDescription>
                Organize seus compromissos, reuniões e lembretes
              </CardDescription>
            </div>
            <Button onClick={() => openCreateDialog()}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Evento
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={() => navigateDate('prev')}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="outline" onClick={() => setSelectedDate(new Date())}>
                Hoje
              </Button>
              <Button variant="outline" size="icon" onClick={() => navigateDate('next')}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
            
            <Tabs value={view} onValueChange={(v) => setView(v as 'day' | 'week' | 'month')}>
              <TabsList>
                <TabsTrigger value="day">Dia</TabsTrigger>
                <TabsTrigger value="week">Semana</TabsTrigger>
                <TabsTrigger value="month">Mês</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {view === 'day' && renderDayView()}
          {view === 'week' && renderWeekView()}
          {view === 'month' && renderMonthView()}
        </CardContent>

        {/* Event Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingEvent ? 'Editar Evento' : 'Novo Evento'}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Título *</Label>
                <Input
                  id="title"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Ex: Reunião com cliente"
                />
              </div>
              
              <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Detalhes do evento..."
                  rows={3}
                />
              </div>
              
              <div className="flex items-center gap-2">
                <Switch
                  id="all-day"
                  checked={formAllDay}
                  onCheckedChange={setFormAllDay}
                />
                <Label htmlFor="all-day">Dia inteiro</Label>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start-date">Data início</Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={formStartDate}
                    onChange={(e) => setFormStartDate(e.target.value)}
                  />
                </div>
                {!formAllDay && (
                  <div>
                    <Label htmlFor="start-time">Hora início</Label>
                    <Input
                      id="start-time"
                      type="time"
                      value={formStartTime}
                      onChange={(e) => setFormStartTime(e.target.value)}
                    />
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="end-date">Data fim</Label>
                  <Input
                    id="end-date"
                    type="date"
                    value={formEndDate}
                    onChange={(e) => setFormEndDate(e.target.value)}
                  />
                </div>
                {!formAllDay && (
                  <div>
                    <Label htmlFor="end-time">Hora fim</Label>
                    <Input
                      id="end-time"
                      type="time"
                      value={formEndTime}
                      onChange={(e) => setFormEndTime(e.target.value)}
                    />
                  </div>
                )}
              </div>
              
              <div>
                <Label>Lembrete</Label>
                <Select 
                  value={formReminderMinutes.toString()} 
                  onValueChange={(v) => setFormReminderMinutes(parseInt(v))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Sem lembrete</SelectItem>
                    <SelectItem value="5">5 minutos antes</SelectItem>
                    <SelectItem value="15">15 minutos antes</SelectItem>
                    <SelectItem value="30">30 minutos antes</SelectItem>
                    <SelectItem value="60">1 hora antes</SelectItem>
                    <SelectItem value="1440">1 dia antes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Cor</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {COLORS.map(color => (
                    <button
                      key={color}
                      type="button"
                      className={`w-8 h-8 rounded-full transition-transform ${
                        formColor === color ? 'ring-2 ring-offset-2 ring-primary scale-110' : ''
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => setFormColor(color)}
                    />
                  ))}
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSaveEvent}>
                {editingEvent ? 'Salvar' : 'Criar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Card>
    </>
  );
}

function EventCard({ 
  event, 
  onEdit, 
  onDelete,
  showDate = false 
}: { 
  event: AgendaEvent; 
  onEdit: (event: AgendaEvent) => void;
  onDelete: (id: string) => void;
  showDate?: boolean;
}) {
  const startDate = parseISO(event.start_date);
  
  return (
    <div 
      className="p-3 rounded-lg border hover:shadow-sm transition-shadow"
      style={{ borderLeftWidth: '4px', borderLeftColor: event.color }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h4 className="font-medium truncate">{event.title}</h4>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
            {showDate && (
              <span>{format(startDate, "d 'de' MMM", { locale: ptBR })}</span>
            )}
            {!event.all_day && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {format(startDate, 'HH:mm', { locale: ptBR })}
              </span>
            )}
            {event.all_day && (
              <Badge variant="outline" className="text-xs">Dia inteiro</Badge>
            )}
            {event.reminder_minutes > 0 && !event.reminder_shown && (
              <Bell className="w-3 h-3 text-primary" />
            )}
          </div>
          {event.description && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {event.description}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8"
            onClick={() => onEdit(event)}
          >
            <Edit2 className="w-4 h-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 text-destructive hover:text-destructive"
            onClick={() => onDelete(event.id)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
