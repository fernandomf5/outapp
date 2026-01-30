import { Card, CardContent } from "@/components/ui/card";
import { GraduationCap, Lock, Play, Users, BookOpen, Star, Clock } from "lucide-react";

interface MembersAreaPreviewProps {
  title: string;
  description: string;
  primaryColor: string;
  secondaryColor: string;
  accessMode: 'open' | 'restricted';
  logoUrl?: string;
}

export function MembersAreaPreview({
  title,
  description,
  primaryColor,
  secondaryColor,
  accessMode,
  logoUrl
}: MembersAreaPreviewProps) {
  const mockModules = [
    { title: "Módulo 1: Introdução", lessons: 5, duration: "45min" },
    { title: "Módulo 2: Conceitos Básicos", lessons: 8, duration: "1h 20min" },
    { title: "Módulo 3: Prática Avançada", lessons: 6, duration: "2h 10min" },
  ];

  return (
    <div className="relative w-full rounded-lg border bg-background overflow-hidden shadow-lg">
      {/* Device Frame Header */}
      <div className="flex items-center gap-1.5 px-3 py-2 bg-muted/50 border-b">
        <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
        <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
        <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
        <div className="flex-1 mx-4">
          <div className="bg-muted rounded-full px-3 py-1 text-[10px] text-muted-foreground text-center">
            seusite.com/members/{title ? title.toLowerCase().replace(/\s+/g, '-').slice(0, 15) : 'meu-curso'}
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="max-h-[400px] overflow-y-auto">
        {/* Hero Banner */}
        <div 
          className="relative py-8 px-4 text-center"
          style={{ 
            background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)` 
          }}
        >
          {/* Logo */}
          {logoUrl ? (
            <img 
              src={logoUrl} 
              alt="Logo" 
              className="w-12 h-12 mx-auto mb-3 rounded-lg object-cover bg-white/20"
            />
          ) : (
            <div 
              className="w-12 h-12 mx-auto mb-3 rounded-lg flex items-center justify-center bg-white/20"
            >
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
          )}
          
          <h1 className="text-lg font-bold text-white mb-1 line-clamp-2">
            {title || "Nome do Seu Curso"}
          </h1>
          <p className="text-xs text-white/80 line-clamp-2 max-w-xs mx-auto">
            {description || "Descrição do seu curso aparecerá aqui..."}
          </p>
          
          {/* Access Badge */}
          <div className="flex items-center justify-center gap-1.5 mt-3">
            <div 
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium"
              style={{ 
                backgroundColor: 'rgba(255,255,255,0.2)',
                color: 'white'
              }}
            >
              {accessMode === 'restricted' ? (
                <>
                  <Lock className="w-2.5 h-2.5" />
                  Acesso Restrito
                </>
              ) : (
                <>
                  <Users className="w-2.5 h-2.5" />
                  Acesso Livre
                </>
              )}
            </div>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="flex items-center justify-center gap-4 py-3 px-4 bg-muted/30 border-b text-[10px] text-muted-foreground">
          <div className="flex items-center gap-1">
            <BookOpen className="w-3 h-3" />
            <span>3 módulos</span>
          </div>
          <div className="flex items-center gap-1">
            <Play className="w-3 h-3" />
            <span>19 aulas</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>4h 15min</span>
          </div>
          <div className="flex items-center gap-1">
            <Star className="w-3 h-3 text-yellow-500" />
            <span>4.9</span>
          </div>
        </div>

        {/* Modules List */}
        <div className="p-3 space-y-2">
          <h3 className="text-xs font-semibold text-foreground mb-2">Conteúdo do Curso</h3>
          
          {mockModules.map((module, index) => (
            <div 
              key={index}
              className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
            >
              <div 
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0"
                style={{ backgroundColor: primaryColor }}
              >
                {index + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{module.title}</p>
                <p className="text-[10px] text-muted-foreground">
                  {module.lessons} aulas · {module.duration}
                </p>
              </div>
              {index > 0 && accessMode === 'restricted' && (
                <Lock className="w-3 h-3 text-muted-foreground shrink-0" />
              )}
            </div>
          ))}
        </div>

        {/* CTA Button Preview */}
        <div className="p-3 pt-0">
          <button
            className="w-full py-2 rounded-lg text-xs font-semibold text-white transition-transform hover:scale-[1.02]"
            style={{ 
              background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)` 
            }}
          >
            {accessMode === 'restricted' ? 'Solicitar Acesso' : 'Começar Agora'}
          </button>
        </div>
      </div>

      {/* Preview Label */}
      <div className="absolute top-10 right-2">
        <div className="bg-primary/90 text-primary-foreground text-[9px] px-1.5 py-0.5 rounded font-medium">
          PREVIEW
        </div>
      </div>
    </div>
  );
}
