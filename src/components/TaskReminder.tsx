import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Task {
  id: string;
  title: string;
  due_date: string;
  priority: "low" | "medium" | "high";
}

export const TaskReminder = () => {
  const [todayTasks, setTodayTasks] = useState<Task[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    checkTodayTasks();
  }, []);

  const checkTodayTasks = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStr = today.toISOString().split('T')[0];

      const { data, error } = await supabase
        .from("tasks")
        .select("id, title, due_date, priority")
        .eq("user_id", user.id)
        .gte("due_date", todayStr)
        .lt("due_date", new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

      if (error) throw error;

      if (data && data.length > 0) {
        setTodayTasks(data as Task[]);
        setIsVisible(true);
      }
    } catch (error: any) {
      console.error("Erro ao verificar tarefas:", error?.message || error);
    }
  };

  const handleAccessTasks = () => {
    navigate("/dashboard?tab=organizer");
    setIsVisible(false);
  };

  const handleDismiss = () => {
    setIsVisible(false);
  };

  if (!isVisible || todayTasks.length === 0) return null;

  return (
    <Card className="mb-6 border-primary/50 bg-primary/5">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Você tem tarefas para hoje!</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="h-6 w-6 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <CardDescription>
          {todayTasks.length} {todayTasks.length === 1 ? "tarefa agendada" : "tarefas agendadas"} para hoje
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 mb-4">
          {todayTasks.slice(0, 3).map((task) => (
            <div key={task.id} className="text-sm flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                task.priority === "high" ? "bg-destructive" :
                task.priority === "medium" ? "bg-warning" :
                "bg-muted-foreground"
              }`} />
              <span className="truncate">{task.title}</span>
            </div>
          ))}
          {todayTasks.length > 3 && (
            <p className="text-sm text-muted-foreground">
              E mais {todayTasks.length - 3} {todayTasks.length - 3 === 1 ? "tarefa" : "tarefas"}...
            </p>
          )}
        </div>
        <Button onClick={handleAccessTasks} className="w-full">
          Acessar Organizador de Tarefas
        </Button>
      </CardContent>
    </Card>
  );
};
