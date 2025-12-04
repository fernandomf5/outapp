import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { parseISO, addMinutes, isAfter, isBefore, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Bell, X, Check, Clock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
}

export function AgendaReminders() {
  const { user } = useAuth();
  const [events, setEvents] = useState<AgendaEvent[]>([]);
  const [activeReminders, setActiveReminders] = useState<AgendaEvent[]>([]);

  const fetchEvents = useCallback(async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('agenda_events')
      .select('*')
      .eq('user_id', user.id)
      .eq('reminder_shown', false)
      .gt('reminder_minutes', 0);

    if (data) {
      setEvents(data as AgendaEvent[]);
    }
  }, [user]);

  useEffect(() => {
    fetchEvents();
    
    // Subscribe to changes
    const channel = supabase
      .channel('agenda-reminders')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'agenda_events',
          filter: `user_id=eq.${user?.id}`
        },
        () => {
          fetchEvents();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchEvents, user]);

  // Check for reminders every 10 seconds
  useEffect(() => {
    const checkReminders = () => {
      if (events.length === 0) return;

      const now = new Date();
      const newActiveReminders: AgendaEvent[] = [];
      
      for (const event of events) {
        if (event.reminder_shown) continue;
        if (event.reminder_minutes === 0) continue;

        const eventDate = parseISO(event.start_date);
        const reminderTime = addMinutes(eventDate, -event.reminder_minutes);

        if (isAfter(now, reminderTime)) {
          newActiveReminders.push(event);
        }
      }
      
      if (newActiveReminders.length > 0) {
        setActiveReminders(prev => {
          const existingIds = new Set(prev.map(e => e.id));
          const toAdd = newActiveReminders.filter(e => !existingIds.has(e.id));
          return [...prev, ...toAdd];
        });
      }
    };

    const interval = setInterval(checkReminders, 10000);
    checkReminders();

    return () => clearInterval(interval);
  }, [events]);

  const markReminderAsSeen = async (eventId: string) => {
    setActiveReminders(prev => prev.filter(e => e.id !== eventId));
    
    await supabase
      .from('agenda_events')
      .update({ reminder_shown: true })
      .eq('id', eventId);
    
    setEvents(prev => prev.filter(e => e.id !== eventId));
  };

  if (activeReminders.length === 0) return null;

  return (
    <>
      {activeReminders.map((event, index) => {
        const eventDate = parseISO(event.start_date);
        const isPast = isBefore(eventDate, new Date());
        
        return (
          <div
            key={event.id}
            className="fixed z-[100] animate-in slide-in-from-top-5 fade-in duration-300"
            style={{ 
              top: `${80 + index * 140}px`, 
              right: '20px',
              maxWidth: '380px',
              width: 'calc(100vw - 40px)'
            }}
          >
            <div 
              className="bg-card border-2 rounded-lg shadow-2xl p-4"
              style={{ borderColor: event.color }}
            >
              <div className="flex items-start gap-3">
                <div 
                  className="p-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: `${event.color}20` }}
                >
                  {isPast ? (
                    <AlertCircle className="w-5 h-5" style={{ color: event.color }} />
                  ) : (
                    <Bell className="w-5 h-5" style={{ color: event.color }} />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="font-semibold text-sm truncate">
                      {isPast ? 'Evento passou!' : 'Lembrete de Evento'}
                    </h4>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 flex-shrink-0"
                      onClick={() => markReminderAsSeen(event.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <p className="font-medium mt-1" style={{ color: event.color }}>
                    {event.title}
                  </p>
                  
                  {event.description && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {event.description}
                    </p>
                  )}
                  
                  <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    <span>
                      {format(eventDate, "d 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                    </span>
                  </div>
                  
                  <Button
                    size="sm"
                    className="w-full mt-3"
                    style={{ backgroundColor: event.color }}
                    onClick={() => markReminderAsSeen(event.id)}
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Marcar como visto
                  </Button>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </>
  );
}
