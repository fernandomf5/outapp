import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  ChevronRight, 
  ArrowLeft, 
  Loader2, 
  LayoutGrid, 
  FolderOpen,
  User,
  History,
  ArrowUp,
  ArrowDown,
  GripVertical
} from "lucide-react";
import { KanbanBoard } from "./KanbanBoard";
import { TaskHistoryDialog } from "./TaskHistoryDialog";
import { useAuth } from "@/contexts/AuthContext";

interface Category {
  id: string;
  name: string;
  color: string;
}

interface UserRegistration {
  id: string;
  name: string;
  email: string | null;
}

export const TaskManagerContainer = ({ teamContext }: { teamContext?: any }) => {
  const { user } = useAuth();
  const [view, setView] = useState<"categories" | "users" | "kanban">("categories");
  const [categories, setRegistrationCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [users, setUsers] = useState<UserRegistration[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserRegistration | null>(null);
  const [loading, setLoading] = useState(true);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [kanbanRefreshKey, setKanbanRefreshKey] = useState(0);
  const [reorderMode, setReorderMode] = useState(false);

  const effectiveUserId = teamContext?.adminUserId || user?.id;

  useEffect(() => {
    fetchCategories();
  }, [effectiveUserId]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("registration_categories")
        .select("*")
        .eq("user_id", effectiveUserId)
        .order("name");

      if (error) throw error;
      setRegistrationCategories(data || []);
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setLoading(false);
    }
  };

  const getOrderKey = (categoryId: string) => `task-users-order-${categoryId}`;

  const applyCustomOrder = (list: UserRegistration[], categoryId: string): UserRegistration[] => {
    try {
      const stored = localStorage.getItem(getOrderKey(categoryId));
      if (!stored) return list;
      const orderIds: string[] = JSON.parse(stored);
      const indexOf = (id: string) => {
        const i = orderIds.indexOf(id);
        return i === -1 ? Number.MAX_SAFE_INTEGER : i;
      };
      return [...list].sort((a, b) => {
        const ai = indexOf(a.id);
        const bi = indexOf(b.id);
        if (ai !== bi) return ai - bi;
        return a.name.localeCompare(b.name);
      });
    } catch {
      return list;
    }
  };

  const saveOrder = (list: UserRegistration[], categoryId: string) => {
    try {
      localStorage.setItem(getOrderKey(categoryId), JSON.stringify(list.map((i) => i.id)));
    } catch {}
  };

  const moveUser = (index: number, direction: 'up' | 'down') => {
    if (!selectedCategory) return;
    setUsers((prev) => {
      const next = [...prev];
      const newIndex = direction === 'up' ? Math.max(0, index - 1) : Math.min(next.length - 1, index + 1);
      if (newIndex === index) return prev;
      const [item] = next.splice(index, 1);
      next.splice(newIndex, 0, item);
      saveOrder(next, selectedCategory.id);
      return next;
    });
  };

  const fetchUsers = async (categoryId: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("contacts")
        .select("id, name, email")
        .eq("registration_category_id", categoryId)
        .order("name");

      if (error) throw error;
      setUsers(applyCustomOrder(data || [], categoryId));
      setView("users");
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryClick = (category: Category) => {
    setSelectedCategory(category);
    fetchUsers(category.id);
  };

  const handleUserClick = (userReg: UserRegistration) => {
    setSelectedUser(userReg);
    setView("kanban");
  };

  const handleBack = () => {
    if (view === "kanban") {
      setView("users");
    } else if (view === "users") {
      setView("categories");
      setSelectedCategory(null);
    }
  };

  if (loading && view === "categories") {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse">Carregando categorias...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-4">
          {view !== "categories" && (
            <Button variant="ghost" size="icon" onClick={handleBack} className="rounded-full">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <div>
            <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Organizador de Tarefas
            </h2>
            <p className="text-muted-foreground">
              {view === "categories" && "Selecione uma categoria para começar"}
              {view === "users" && `Usuários em ${selectedCategory?.name}`}
              {view === "kanban" && `Gerenciando tarefas de ${selectedUser?.name}`}
            </p>
          </div>
        </div>
        <Button variant="outline" onClick={() => setHistoryOpen(true)} className="gap-2">
          <History className="h-4 w-4" />
          Histórico
        </Button>
      </div>

      <TaskHistoryDialog
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        effectiveUserId={effectiveUserId}
        onChanged={() => setKanbanRefreshKey((k) => k + 1)}
      />

      {view === "categories" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.length === 0 ? (
            <Card className="col-span-full border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <FolderOpen className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
                <h3 className="text-lg font-semibold">Nenhuma categoria encontrada</h3>
                <p className="text-muted-foreground">Crie categorias em "Cadastro" primeiro.</p>
              </CardContent>
            </Card>
          ) : (
            categories.map((cat) => (
              <Card 
                key={cat.id} 
                className="group cursor-pointer hover:shadow-xl transition-all duration-300 border-l-4 hover:-translate-y-1"
                style={{ borderLeftColor: cat.color }}
                onClick={() => handleCategoryClick(cat)}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                  <div className="space-y-1">
                    <CardTitle className="text-xl group-hover:text-primary transition-colors">{cat.name}</CardTitle>
                    <CardDescription>Clique para ver usuários</CardDescription>
                  </div>
                  <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <LayoutGrid className="h-6 w-6 text-primary" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center text-sm font-medium text-primary">
                    Ver usuários
                    <ChevronRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {view === "users" && (
        <>
          {users.length > 1 && (
            <div className="flex items-center justify-end gap-3">
              {reorderMode && (
                <p className="text-sm text-muted-foreground mr-auto">
                  Use as setas para reordenar os usuários.
                </p>
              )}
              <Button
                variant={reorderMode ? "default" : "outline"}
                size="sm"
                onClick={() => setReorderMode((v) => !v)}
              >
                <GripVertical className="w-4 h-4 mr-2" />
                {reorderMode ? "Concluir Ordenação" : "Reordenar"}
              </Button>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {users.length === 0 ? (
              <Card className="col-span-full border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <Users className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
                  <h3 className="text-lg font-semibold">Nenhum usuário cadastrado</h3>
                  <p className="text-muted-foreground">Adicione usuários nesta categoria em "Cadastro".</p>
                </CardContent>
              </Card>
            ) : (
              users.map((userReg, index) => (
                <Card 
                  key={userReg.id} 
                  className={`group transition-all duration-200 ${reorderMode ? "" : "cursor-pointer hover:shadow-md hover:border-primary/50"}`}
                  onClick={() => { if (!reorderMode) handleUserClick(userReg); }}
                >
                  <CardContent className="p-6 flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center shrink-0">
                      <User className="h-6 w-6 text-secondary-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate group-hover:text-primary transition-colors">{userReg.name}</h3>
                      <p className="text-sm text-muted-foreground truncate">{userReg.email || "Sem e-mail"}</p>
                    </div>
                    {reorderMode ? (
                      <div className="flex flex-col gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          disabled={index === 0}
                          onClick={(e) => { e.stopPropagation(); moveUser(index, 'up'); }}
                          title="Mover para cima"
                        >
                          <ArrowUp className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          disabled={index === users.length - 1}
                          onClick={(e) => { e.stopPropagation(); moveUser(index, 'down'); }}
                          title="Mover para baixo"
                        >
                          <ArrowDown className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </>
      )}

      {view === "kanban" && selectedUser && (
        <KanbanBoard 
          userId={selectedUser.id} 
          userName={selectedUser.name} 
          teamContext={teamContext}
          refreshKey={kanbanRefreshKey}
        />
      )}
    </div>
  );
};
