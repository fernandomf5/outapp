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
  History
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

  const fetchUsers = async (categoryId: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("contacts")
        .select("id, name, email")
        .eq("registration_category_id", categoryId)
        .order("name");

      if (error) throw error;
      setUsers(data || []);
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
            users.map((userReg) => (
              <Card 
                key={userReg.id} 
                className="group cursor-pointer hover:shadow-md transition-all duration-200 hover:border-primary/50"
                onClick={() => handleUserClick(userReg)}
              >
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center shrink-0">
                    <User className="h-6 w-6 text-secondary-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate group-hover:text-primary transition-colors">{userReg.name}</h3>
                    <p className="text-sm text-muted-foreground truncate">{userReg.email || "Sem e-mail"}</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </CardContent>
              </Card>
            ))
          )}
        </div>
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
