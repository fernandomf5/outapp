import { QuickNotesPanel } from "@/components/QuickNotesPanel";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const QuickNotesPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen w-full bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar à plataforma
          </Button>
        </div>
        <h1 className="text-2xl font-bold">Anotações Rápidas</h1>
        <QuickNotesPanel />
      </div>
    </div>
  );
};

export default QuickNotesPage;
