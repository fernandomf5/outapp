import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Lock, Play, FileText, Image, Video, Link as LinkIcon, MousePointer, Download, Eye, LogIn, Music, Code, HelpCircle, GitBranch, History, CheckSquare, Award, Radio, Brain, StickyNote, MessageSquare, Presentation } from "lucide-react";
import { SimpleMembersAreaInternalPreview } from "./SimpleMembersAreaInternalPreview";

interface ContentBlock {
  id: string;
  type: 'image' | 'video' | 'document' | 'link' | 'button' | 'text' | 'download' | 'audio' | 'embed' | 'quiz' | 'timeline' | 'customer_history' | 'checklist' | 'certificate' | 'webinar' | 'notes' | 'faq' | 'mindmap' | 'slides';
  content: string;
  title?: string;
  order_index: number;
  block_position: number;
}

interface Section {
  id: string;
  title: string;
  description?: string;
  order_index: number;
  blocks_layout: ('full' | 'half' | 'third')[];
  blocks: ContentBlock[];
}

interface SimpleMembersAreaPreviewProps {
  name: string;
  description: string;
  primaryColor: string;
  secondaryColor: string;
  logoUrl?: string;
  sections?: Section[];
}

export function SimpleMembersAreaPreview({
  name,
  description,
  primaryColor,
  secondaryColor,
  logoUrl,
  sections = []
}: SimpleMembersAreaPreviewProps) {
  const [previewMode, setPreviewMode] = useState<'login' | 'internal'>('login');

  const mockSections = [
    { 
      id: '1',
      title: "Módulo 1: Introdução", 
      description: "Comece sua jornada",
      order_index: 0,
      blocks_layout: ['full'] as ('full' | 'half' | 'third')[],
      blocks: [
        { id: 'b1', type: 'video' as const, title: 'Aula 1 - Boas vindas', content: '', order_index: 0, block_position: 0 },
        { id: 'b2', type: 'document' as const, title: 'Material de apoio', content: '', order_index: 1, block_position: 0 }
      ]
    },
    { 
      id: '2',
      title: "Módulo 2: Fundamentos", 
      description: "Aprenda os conceitos",
      order_index: 1,
      blocks_layout: ['half', 'half'] as ('full' | 'half' | 'third')[],
      blocks: [
        { id: 'b3', type: 'video' as const, title: 'Aula 2 - Conceitos básicos', content: '', order_index: 0, block_position: 0 },
        { id: 'b4', type: 'image' as const, title: 'Infográfico explicativo', content: '', order_index: 1, block_position: 1 }
      ]
    },
  ];

  const displaySections = sections.length > 0 ? sections : mockSections;

  const getBlockIcon = (type: string) => {
    const icons: Record<string, React.ReactNode> = {
      video: <Video className="w-3 h-3" />,
      image: <Image className="w-3 h-3" />,
      document: <FileText className="w-3 h-3" />,
      link: <LinkIcon className="w-3 h-3" />,
      button: <MousePointer className="w-3 h-3" />,
      download: <Download className="w-3 h-3" />,
      audio: <Music className="w-3 h-3" />,
      embed: <Code className="w-3 h-3" />,
      quiz: <HelpCircle className="w-3 h-3" />,
      timeline: <GitBranch className="w-3 h-3" />,
      customer_history: <History className="w-3 h-3" />,
      checklist: <CheckSquare className="w-3 h-3" />,
      certificate: <Award className="w-3 h-3" />,
      webinar: <Radio className="w-3 h-3" />,
      notes: <StickyNote className="w-3 h-3" />,
      faq: <MessageSquare className="w-3 h-3" />,
      mindmap: <Brain className="w-3 h-3" />,
      slides: <Presentation className="w-3 h-3" />,
      text: <FileText className="w-3 h-3" />,
    };
    return icons[type] || <FileText className="w-3 h-3" />;
  };

  if (previewMode === 'internal') {
    return (
      <div className="space-y-3">
        <Tabs value={previewMode} onValueChange={(v) => setPreviewMode(v as 'login' | 'internal')}>
          <TabsList className="grid w-full grid-cols-2 h-9">
            <TabsTrigger value="login" className="text-xs gap-1.5">
              <LogIn className="w-3 h-3" />
              Tela de Login
            </TabsTrigger>
            <TabsTrigger value="internal" className="text-xs gap-1.5">
              <Eye className="w-3 h-3" />
              Área Interna
            </TabsTrigger>
          </TabsList>
        </Tabs>
        
        <SimpleMembersAreaInternalPreview
          name={name}
          description={description}
          primaryColor={primaryColor}
          secondaryColor={secondaryColor}
          logoUrl={logoUrl}
          sections={displaySections}
        />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <Tabs value={previewMode} onValueChange={(v) => setPreviewMode(v as 'login' | 'internal')}>
        <TabsList className="grid w-full grid-cols-2 h-9">
          <TabsTrigger value="login" className="text-xs gap-1.5">
            <LogIn className="w-3 h-3" />
            Tela de Login
          </TabsTrigger>
          <TabsTrigger value="internal" className="text-xs gap-1.5">
            <Eye className="w-3 h-3" />
            Área Interna
          </TabsTrigger>
        </TabsList>
      </Tabs>

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
        <div className="max-h-[380px] overflow-y-auto">
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
                className="w-12 h-12 mx-auto mb-2 rounded-lg object-cover bg-white/20 shadow-lg"
              />
            ) : (
              <div 
                className="w-12 h-12 mx-auto mb-2 rounded-lg flex items-center justify-center bg-white/20 shadow-lg"
              >
                <Play className="w-6 h-6 text-white" />
              </div>
            )}
            
            <h1 className="text-base font-bold text-white mb-1 line-clamp-2">
              {name || "Nome da Sua Área"}
            </h1>
            <p className="text-[11px] text-white/80 line-clamp-2 max-w-xs mx-auto">
              {description || "Descrição da sua área de membros aparecerá aqui..."}
            </p>
            
            {/* Access Badge */}
            <div className="flex items-center justify-center gap-1.5 mt-3">
              <div 
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-medium bg-white/20 text-white backdrop-blur-sm"
              >
                <Lock className="w-2.5 h-2.5" />
                Acesso Protegido
              </div>
            </div>
          </div>

          {/* Sections Preview */}
          <div className="p-3 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-foreground">Conteúdo Disponível</h3>
              <span 
                className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}
              >
                {displaySections.length} módulos
              </span>
            </div>
            
            {displaySections.slice(0, 3).map((section, index) => (
              <Card key={section.id || index} className="p-3 bg-muted/30 hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-2 mb-2">
                  <div 
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-[10px] font-bold shrink-0 shadow-sm"
                    style={{ backgroundColor: primaryColor }}
                  >
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{section.title}</p>
                    {section.description && (
                      <p className="text-[10px] text-muted-foreground truncate">{section.description}</p>
                    )}
                  </div>
                </div>
                
                <div className="space-y-1 ml-9">
                  {section.blocks.slice(0, 2).map((block, blockIndex) => (
                    <div 
                      key={block.id || blockIndex}
                      className="flex items-center gap-2 p-1.5 rounded bg-background/60 text-[10px]"
                    >
                      <div 
                        className="w-5 h-5 rounded flex items-center justify-center"
                        style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}
                      >
                        {getBlockIcon(block.type)}
                      </div>
                      <span className="truncate">{block.title || block.type}</span>
                    </div>
                  ))}
                  {section.blocks.length > 2 && (
                    <p className="text-[9px] text-muted-foreground pl-7">
                      +{section.blocks.length - 2} mais conteúdos
                    </p>
                  )}
                </div>
              </Card>
            ))}

            {displaySections.length > 3 && (
              <p 
                className="text-[10px] text-center font-medium py-1"
                style={{ color: primaryColor }}
              >
                +{displaySections.length - 3} módulos adicionais
              </p>
            )}
          </div>

          {/* Login Form Preview */}
          <div className="p-3 pt-0">
            <Card className="p-3 bg-muted/20 border-dashed">
              <p className="text-[10px] text-muted-foreground text-center mb-2">
                Digite a senha para acessar
              </p>
              <div className="flex gap-2">
                <div className="flex-1 h-9 rounded-lg bg-background border flex items-center px-3">
                  <span className="text-[11px] text-muted-foreground">••••••••</span>
                </div>
                <button
                  className="px-4 h-9 rounded-lg text-[11px] font-semibold text-white shadow-md hover:shadow-lg transition-shadow"
                  style={{ 
                    background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)` 
                  }}
                >
                  Acessar
                </button>
              </div>
            </Card>
          </div>
        </div>

        {/* Preview Label */}
        <div className="absolute top-10 right-2">
          <div 
            className="text-[9px] px-1.5 py-0.5 rounded font-medium text-white"
            style={{ backgroundColor: primaryColor }}
          >
            LOGIN
          </div>
        </div>
      </div>
    </div>
  );
}
