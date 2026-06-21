import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Bell, X, Check, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface RoutineItem {
  id: string;
  title: string;
  description: string | null;
  day_of_week: number;
  start_time: string | null;
  color: string | null;
  reminder_minutes: number | null;
}

const STORAGE_KEY = 'routine-reminders-shown';

function getShownToday(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as { date: string; ids: string[] };
    const today = new Date().toDateString();
    if (parsed.date !== today) return new Set();
    return new Set(parsed.ids);
  } catch {
    return new Set();
  }
}

function markShown(id: string) {
  const today = new Date().toDateString();
  const current = getShownToday();
  current.add(id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ date: today, ids: [...current] }));
}

export function RoutineReminders() {
  const { user } = useAuth();
  const [items, setItems] = useState<RoutineItem[]>([]);
  const [activeReminders, setActiveReminders] = useState<RoutineItem[]>([]);
  const shownRef = useRef<Set<string>>(getShownToday());

  const fetchItems = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('routine_items')
      .select('id, title, description, day_of_week, start_time, color, reminder_minutes')
      .eq('user_id', user.id)
      .not('reminder_minutes', 'is', null)
      .not('start_time', 'is', null);
    if (data) setItems(data as RoutineItem[]);
  }, [user]);

  useEffect(() => {
    fetchItems();
    if (!user) return;
    const channel = supabase
      .channel('routine-reminders')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'routine_items', filter: `user_id=eq.${user.id}` },
        () => fetchItems()
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchItems, user]);

  useEffect(() => {
    const check = () => {
      if (items.length === 0) return;
      const now = new Date();
      const today = now.getDay();
      const nowMinutes = now.getHours() * 60 + now.getMinutes();
      const toShow: RoutineItem[] = [];

      for (const item of items) {
        if (item.day_of_week !== today) continue;
        if (!item.start_time || item.reminder_minutes == null) continue;
        if (shownRef.current.has(item.id)) continue;

        const [h, m] = item.start_time.split(':').map(Number);
        if (Number.isNaN(h) || Number.isNaN(m)) continue;
        const startMinutes = h * 60 + m;
        const reminderMinutes = startMinutes - item.reminder_minutes;

        // Trigger if now is within [reminderTime, startTime]
        if (nowMinutes >= reminderMinutes && nowMinutes <= startMinutes) {
          toShow.push(item);
          shownRef.current.add(item.id);
          markShown(item.id);
        }
      }

      if (toShow.length > 0) {
        setActiveReminders(prev => {
          const existing = new Set(prev.map(e => e.id));
          return [...prev, ...toShow.filter(e => !existing.has(e.id))];
        });
      }
    };

    check();
    const interval = setInterval(check, 30000);
    return () => clearInterval(interval);
  }, [items]);

  const dismiss = (id: string) => {
    setActiveReminders(prev => prev.filter(e => e.id !== id));
  };

  if (activeReminders.length === 0) return null;

  return (
    <>
      {activeReminders.map((item, index) => {
        const color = item.color || '#3b82f6';
        return (
          <div
            key={item.id}
            className="fixed z-[100] animate-in slide-in-from-top-5 fade-in duration-300"
            style={{
              top: `${80 + index * 140}px`,
              right: '20px',
              maxWidth: '380px',
              width: 'calc(100vw - 40px)',
            }}
          >
            <div className="bg-card border-2 rounded-lg shadow-2xl p-4" style={{ borderColor: color }}>
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-full flex-shrink-0" style={{ backgroundColor: `${color}20` }}>
                  <Bell className="w-5 h-5" style={{ color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="font-semibold text-sm truncate">Lembrete de Rotina</h4>
                    <Button variant="ghost" size="icon" className="h-6 w-6 flex-shrink-0" onClick={() => dismiss(item.id)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="font-medium mt-1" style={{ color }}>{item.title}</p>
                  {item.description && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.description}</p>
                  )}
                  {item.start_time && (
                    <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      <span>Início às {item.start_time.slice(0, 5)}</span>
                    </div>
                  )}
                  <Button size="sm" className="w-full mt-3" style={{ backgroundColor: color }} onClick={() => dismiss(item.id)}>
                    <Check className="w-4 h-4 mr-2" />
                    Ok, entendi
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
