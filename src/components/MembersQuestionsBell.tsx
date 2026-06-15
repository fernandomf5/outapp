import { useState, useEffect, useCallback } from "react";
import { Bell, HelpCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface QuestionNotification {
  id: string;
  area_id: string;
  student_name: string;
  question: string;
  answer: string | null;
  created_at: string;
  area_name?: string;
}

const STORAGE_KEY = "members_questions_seen_ids";

const getSeen = (): Set<string> => {
  try {
    return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"));
  } catch {
    return new Set();
  }
};

const saveSeen = (set: Set<string>) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(set)));
};

export const MembersQuestionsBell = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<QuestionNotification[]>([]);
  const [seen, setSeen] = useState<Set<string>>(getSeen());
  const [isOpen, setIsOpen] = useState(false);
  const [hasEnabledArea, setHasEnabledArea] = useState(false);

  const fetchAll = useCallback(async () => {
    if (!user) return;
    const { data: areas } = await supabase
      .from("simple_members_areas" as any)
      .select("id, name, enable_questions")
      .eq("user_id", user.id);
    const allAreas = (areas as any) || [];
    const enabledAreas = allAreas.filter((a: any) => a.enable_questions);
    setHasEnabledArea(enabledAreas.length > 0);
    if (enabledAreas.length === 0) {
      setNotifications([]);
      return;
    }
    const areaMap = new Map<string, string>(
      enabledAreas.map((a: any) => [a.id, a.name])
    );
    const { data: qs } = await supabase
      .from("members_area_video_questions" as any)
      .select("id, area_id, student_name, question, answer, created_at")
      .in("area_id", Array.from(areaMap.keys()))
      .order("created_at", { ascending: false })
      .limit(30);
    const enriched = ((qs as any) || []).map((q: any) => ({
      ...q,
      area_name: areaMap.get(q.area_id) || "Área",
    }));
    setNotifications(enriched);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    fetchAll();
    const channel = supabase
      .channel(`members_questions_bell:${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "members_area_video_questions" },
        () => fetchAll()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "simple_members_areas", filter: `user_id=eq.${user.id}` },
        () => fetchAll()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchAll]);

  if (!hasEnabledArea) return null;

  const unreadCount = notifications.filter((n) => !seen.has(n.id)).length;

  const markAllRead = () => {
    const next = new Set(seen);
    notifications.forEach((n) => next.add(n.id));
    setSeen(next);
    saveSeen(next);
  };

  const handleClick = (n: QuestionNotification) => {
    const next = new Set(seen);
    next.add(n.id);
    setSeen(next);
    saveSeen(next);
    setIsOpen(false);
    navigate(`/dashboard?tab=area-membros&manageQuestions=${n.area_id}`);
  };

  const handleDismiss = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotifications((curr) => curr.filter((n) => n.id !== id));
    const next = new Set(seen);
    next.add(id);
    setSeen(next);
    saveSeen(next);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <HelpCircle className="w-5 h-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-destructive">
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="flex items-center justify-between border-b p-4">
          <h3 className="font-semibold flex items-center gap-2">
            <HelpCircle className="w-4 h-4" />
            Dúvidas dos Alunos
          </h3>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllRead}>
              Marcar todas como lidas
            </Button>
          )}
        </div>
        <ScrollArea className="h-96">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Bell className="w-12 h-12 mx-auto mb-2 opacity-20" />
              <p>Nenhuma dúvida</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((n) => {
                const isUnread = !seen.has(n.id);
                return (
                  <div
                    key={n.id}
                    className={`p-4 hover:bg-accent transition-colors cursor-pointer relative group ${
                      isUnread ? "bg-primary/5" : ""
                    }`}
                    onClick={() => handleClick(n)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {isUnread && (
                            <div className="w-2 h-2 rounded-full bg-primary" />
                          )}
                          <p className="font-medium text-sm truncate">
                            {n.student_name} • {n.area_name}
                          </p>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {n.question}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(n.created_at).toLocaleString("pt-BR")}
                          {n.answer && " • Respondida"}
                        </p>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7"
                        onClick={(e) => handleDismiss(n.id, e)}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};
