import { Card } from "@/components/ui/card";
import { Users, Lock } from "lucide-react";

export function MembersAreaCreator() {
  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <Users className="w-6 h-6 text-primary" />
          <div>
            <h2 className="text-2xl font-bold">Gerador de Área de Membros</h2>
            <p className="text-sm text-muted-foreground">
              Crie e gerencie áreas de membros com múltiplos módulos e conteúdos
            </p>
          </div>
        </div>
        
        <div className="text-center py-12 space-y-4">
          <Lock className="w-16 h-16 mx-auto text-muted-foreground" />
          <h3 className="text-xl font-semibold">Área de Membros</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            Sistema completo para criar áreas de membros com módulos, aulas e conteúdos exclusivos. 
            Configure aprovação de membros, organize seu conteúdo em módulos e ofereça aulas demonstrativas gratuitas.
          </p>
          <p className="text-sm text-muted-foreground">
            Funcionalidade em implementação final...
          </p>
        </div>
      </Card>
    </div>
  );
}
