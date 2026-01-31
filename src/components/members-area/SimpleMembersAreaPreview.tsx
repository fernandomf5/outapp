import { Card } from "@/components/ui/card";
import { Lock, Play, FileText, Image, Video, Link as LinkIcon, MousePointer, Download } from "lucide-react";

interface SimpleMembersAreaPreviewProps {
  name: string;
  description: string;
  primaryColor: string;
  secondaryColor: string;
  logoUrl?: string;
}

export function SimpleMembersAreaPreview({
  name,
  description,
  primaryColor,
  secondaryColor,
  logoUrl
}: SimpleMembersAreaPreviewProps) {
  const mockSections = [
    { 
      title: "Módulo 1: Introdução", 
      blocks: [
        { type: 'video', title: 'Aula 1 - Boas vindas' },
        { type: 'document', title: 'Material de apoio' }
      ]
    },
    { 
      title: "Módulo 2: Fundamentos", 
      blocks: [
        { type: 'video', title: 'Aula 2 - Conceitos básicos' },
        { type: 'image', title: 'Infográfico explicativo' }
      ]
    },
  ];

  const getBlockIcon = (type: string) => {
    switch (type) {
      case 'video': return <Video className="w-3 h-3" />;
      case 'image': return <Image className="w-3 h-3" />;
      case 'document': return <FileText className="w-3 h-3" />;
      case 'link': return <LinkIcon className="w-3 h-3" />;
      case 'button': return <MousePointer className="w-3 h-3" />;
      case 'download': return <Download className="w-3 h-3" />;
      default: return <FileText className="w-3 h-3" />;
    }
  };

  return (
    <div className="relative w-full rounded-lg border bg-background overflow-hidden shadow-lg">
      {/* Device Frame Header */}
      <div className="flex items-center gap-1.5 px-3 py-2 bg-muted/50 border-b">
        <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
        <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
        <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
        <div className="flex-1 mx-4">
          <div className="bg-muted rounded-full px-3 py-1 text-[10px] text-muted-foreground text-center">
            seusite.com/members/{name ? name.toLowerCase().replace(/\s+/g, '-').slice(0, 15) : 'minha-area'}
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="max-h-[400px] overflow-y-auto">
        {/* Hero Banner */}
        <div 
          className="relative py-6 px-4 text-center"
          style={{ 
            background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)` 
          }}
        >
          {/* Logo */}
          {logoUrl ? (
            <img 
              src={logoUrl} 
              alt="Logo" 
              className="w-10 h-10 mx-auto mb-2 rounded-lg object-cover bg-white/20"
            />
          ) : (
            <div 
              className="w-10 h-10 mx-auto mb-2 rounded-lg flex items-center justify-center bg-white/20"
            >
              <Play className="w-5 h-5 text-white" />
            </div>
          )}
          
          <h1 className="text-base font-bold text-white mb-1 line-clamp-2">
            {name || "Nome da Sua Área"}
          </h1>
          <p className="text-[11px] text-white/80 line-clamp-2 max-w-xs mx-auto">
            {description || "Descrição da sua área de membros aparecerá aqui..."}
          </p>
          
          {/* Access Badge */}
          <div className="flex items-center justify-center gap-1.5 mt-2">
            <div 
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium"
              style={{ 
                backgroundColor: 'rgba(255,255,255,0.2)',
                color: 'white'
              }}
            >
              <Lock className="w-2.5 h-2.5" />
              Protegido por Senha
            </div>
          </div>
        </div>

        {/* Sections List */}
        <div className="p-3 space-y-3">
          <h3 className="text-xs font-semibold text-foreground">Conteúdo</h3>
          
          {mockSections.map((section, index) => (
            <Card key={index} className="p-3 bg-muted/30">
              <div className="flex items-center gap-2 mb-2">
                <div 
                  className="w-6 h-6 rounded flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                  style={{ backgroundColor: primaryColor }}
                >
                  {index + 1}
                </div>
                <p className="text-xs font-medium">{section.title}</p>
              </div>
              
              <div className="space-y-1.5 ml-8">
                {section.blocks.map((block, blockIndex) => (
                  <div 
                    key={blockIndex}
                    className="flex items-center gap-2 p-1.5 rounded bg-background/50 text-[10px]"
                  >
                    <div 
                      className="w-5 h-5 rounded flex items-center justify-center"
                      style={{ backgroundColor: `${primaryColor}20`, color: primaryColor }}
                    >
                      {getBlockIcon(block.type)}
                    </div>
                    <span className="truncate">{block.title}</span>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>

        {/* Password Input Preview */}
        <div className="p-3 pt-0">
          <div className="flex gap-2">
            <div className="flex-1 h-8 rounded-lg bg-muted/50 border flex items-center px-2">
              <span className="text-[10px] text-muted-foreground">••••••••</span>
            </div>
            <button
              className="px-3 h-8 rounded-lg text-[10px] font-semibold text-white"
              style={{ 
                background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)` 
              }}
            >
              Acessar
            </button>
          </div>
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
