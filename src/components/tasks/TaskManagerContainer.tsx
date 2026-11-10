import { useState } from "react";
import { History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { KanbanBoard } from "./KanbanBoard";
import { TaskHistoryDialog } from "./TaskHistoryDialog";
import { useAuth } from "@/contexts/AuthContext";

export const TaskManagerContainer = ({ teamContext, entityId }: { teamContext?: any; entityId?: string }) => {
  const scopedEntityId = entityId || (typeof sessionStorage !== "undefined" ? sessionStorage.getItem("outapp_hub_entity") : null) || "";
  const { user } = useAuth();
  const [historyOpen, setHistoryOpen] = useState(false);
  const effectiveUserId = teamContext?.adminUserId || user?.id || "";

  if (!scopedEntityId || !effectiveUserId) {
    return <div className="py-12 text-center text-muted-foreground">Selecione uma gestão para carregar suas tarefas.</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <Button variant="outline" onClick={() => setHistoryOpen(true)} className="gap-2">
          <History className="h-4 w-4" />
          Histórico
        </Button>
      </div>
      <TaskHistoryDialog
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        effectiveUserId={effectiveUserId}
        entityId={scopedEntityId}
        onChanged={() => window.dispatchEvent(new CustomEvent("outapp:refresh-tasks"))}
      />
      <KanbanBoard
        entityId={scopedEntityId}
        userId=""
        userName="Gestão"
        teamContext={teamContext}
      />
    </div>
  );
};
