import { QuickNotesPanel } from "@/components/QuickNotesPanel";

const QuickNotesPage = () => {
  return (
    <div className="min-h-screen w-full bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold">Anotações Rápidas</h1>
        <QuickNotesPanel />
      </div>
    </div>
  );
};

export default QuickNotesPage;
