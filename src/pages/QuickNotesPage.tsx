import { QuickNotesPanel } from "@/components/QuickNotesPanel";
import { UserSidebar } from "@/components/layout/UserSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const QuickNotesPage = () => {
  const navigate = useNavigate();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <UserSidebar />
        <main className="flex-1 overflow-auto p-4 md:p-8">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-2xl font-bold">Anotações Rápidas</h1>
            </div>
            <div className="grid gap-6">
               <QuickNotesPanel />
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default QuickNotesPage;
