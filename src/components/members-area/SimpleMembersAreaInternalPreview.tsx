import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Play, 
  FileText, 
  Image, 
  Video, 
  Link as LinkIcon, 
  MousePointer, 
  Download,
  ChevronRight,
  Home,
  BookOpen,
  User,
  Music,
  Code,
  HelpCircle,
  GitBranch,
  History,
  CheckSquare,
  Award,
  Radio,
  Brain,
  StickyNote,
  MessageSquare,
  Presentation,
  Images,
  Film,
  EyeOff,
  DollarSign
} from "lucide-react";

interface ContentBlock {
  id: string;
  type: 'image' | 'video' | 'document' | 'link' | 'button' | 'text' | 'download' | 'audio' | 'embed' | 'quiz' | 'timeline' | 'customer_history' | 'checklist' | 'certificate' | 'webinar' | 'notes' | 'faq' | 'mindmap' | 'slides' | 'gallery' | 'video_gallery' | 'ads_dashboard' | 'secret' | 'payment_history';
  content: string;
  title?: string;
  order_index: number;
  block_position: number;
  customer_id?: string;
  customer_name?: string;
}

interface Section {
  id: string;
  title: string;
  description?: string;
  order_index: number;
  blocks_layout: ('full' | 'half' | 'third')[];
  blocks: ContentBlock[];
}

interface SimpleMembersAreaInternalPreviewProps {
  name: string;
  description: string;
  primaryColor: string;
  secondaryColor: string;
  logoUrl?: string;
  sections?: Section[];
  activeTab?: 'home' | 'content' | 'profile';
}

export function SimpleMembersAreaInternalPreview({
  name,
  description,
  primaryColor,
  secondaryColor,
  logoUrl,
  sections = [],
  activeTab = 'home'
}: SimpleMembersAreaInternalPreviewProps) {
  
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
      gallery: <Images className="w-3 h-3" />,
      video_gallery: <Film className="w-3 h-3" />,
      payment_history: <DollarSign className="w-3 h-3" />,
      secret: <EyeOff className="w-3 h-3" />,
    };
    return icons[type] || <FileText className="w-3 h-3" />;
  };

  const getBlockTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      video: 'Vídeo',
      image: 'Imagem',
      document: 'Documento',
      link: 'Link',
      button: 'Botão',
      text: 'Texto',
      download: 'Download',
      audio: 'Áudio',
      embed: 'Embed',
      quiz: 'Quiz',
      timeline: 'Timeline',
      customer_history: 'Histórico',
      checklist: 'Checklist',
      certificate: 'Certificado',
      webinar: 'Webinar',
      notes: 'Anotações',
      faq: 'FAQ',
      mindmap: 'Mapa Mental',
      slides: 'Slides',
      gallery: 'Galeria',
      video_gallery: 'Vídeos',
      secret: 'Oculto',
      payment_history: 'Pagamentos',
    };
    return labels[type] || type;
  };

  // Mock sections if empty for preview
  const displaySections = sections.length > 0 ? sections : [
    { 
      id: '1', 
      title: 'Módulo 1: Introdução', 
      description: 'Comece sua jornada aqui',
      order_index: 0,
      blocks_layout: ['full'] as const,
      blocks: [
        { id: 'b1', type: 'video' as const, title: 'Aula 1 - Boas vindas', content: '', order_index: 0, block_position: 0 },
        { id: 'b2', type: 'document' as const, title: 'Material de apoio', content: '', order_index: 1, block_position: 0 }
      ]
    },
    { 
      id: '2', 
      title: 'Módulo 2: Fundamentos', 
      description: 'Aprenda os conceitos básicos',
      order_index: 1,
      blocks_layout: ['half', 'half'] as const,
      blocks: [
        { id: 'b3', type: 'video' as const, title: 'Aula 2 - Conceitos', content: '', order_index: 0, block_position: 0 },
        { id: 'b4', type: 'image' as const, title: 'Infográfico', content: '', order_index: 1, block_position: 1 }
      ]
    },
  ];

  return (
    <div className="relative w-full rounded-lg border bg-background overflow-hidden shadow-lg">
      {/* Browser Frame Header */}
      <div className="flex items-center gap-1.5 px-3 py-2 bg-muted/50 border-b">
        <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
        <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
        <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
        <div className="flex-1 mx-4">
          <div className="bg-muted rounded-full px-3 py-1 text-[10px] text-muted-foreground text-center">
            seusite.com/members/{name ? name.toLowerCase().replace(/\s+/g, '-').slice(0, 12) : 'area'}/conteudo
          </div>
        </div>
      </div>

      {/* App Container */}
      <div className="flex h-[420px]">
        {/* Sidebar */}
        <div 
          className="w-14 flex-shrink-0 flex flex-col items-center py-3 gap-3 border-r"
          style={{ backgroundColor: `${primaryColor}10` }}
        >
          {/* Logo */}
          {logoUrl ? (
            <img 
              src={logoUrl} 
              alt="Logo" 
              className="w-8 h-8 rounded-lg object-cover border"
              style={{ borderColor: primaryColor }}
            />
          ) : (
            <div 
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold"
              style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
            >
              {name ? name.charAt(0).toUpperCase() : 'A'}
            </div>
          )}

          <div className="flex-1 flex flex-col items-center gap-1 mt-2">
            <button 
              className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
                activeTab === 'home' ? 'text-white' : 'text-muted-foreground hover:bg-muted'
              }`}
              style={activeTab === 'home' ? { backgroundColor: primaryColor } : {}}
            >
              <Home className="w-4 h-4" />
            </button>
            <button 
              className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
                activeTab === 'content' ? 'text-white' : 'text-muted-foreground hover:bg-muted'
              }`}
              style={activeTab === 'content' ? { backgroundColor: primaryColor } : {}}
            >
              <BookOpen className="w-4 h-4" />
            </button>
            <button 
              className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
                activeTab === 'profile' ? 'text-white' : 'text-muted-foreground hover:bg-muted'
              }`}
              style={activeTab === 'profile' ? { backgroundColor: primaryColor } : {}}
            >
              <User className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <div 
            className="px-4 py-3 border-b"
            style={{ 
              background: `linear-gradient(135deg, ${primaryColor}15, ${secondaryColor}10)` 
            }}
          >
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <h2 className="text-sm font-bold truncate">{name || "Sua Área"}</h2>
                <p className="text-[10px] text-muted-foreground truncate">
                  {description || "Bem-vindo à sua área de membros"}
                </p>
              </div>
              <Badge 
                className="text-[9px] px-2 py-0.5 shrink-0 ml-2"
                style={{ 
                  backgroundColor: `${primaryColor}20`, 
                  color: primaryColor,
                  border: `1px solid ${primaryColor}40`
                }}
              >
                Premium
              </Badge>
            </div>
          </div>

          {/* Content */}
          <ScrollArea className="flex-1">
            <div className="p-3 space-y-3">
              {/* Progress Card */}
              <Card className="p-3 bg-muted/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-medium">Seu Progresso</span>
                  <span 
                    className="text-[10px] font-bold"
                    style={{ color: primaryColor }}
                  >
                    35%
                  </span>
                </div>
                <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all"
                    style={{ 
                      width: '35%',
                      background: `linear-gradient(90deg, ${primaryColor}, ${secondaryColor})` 
                    }}
                  />
                </div>
              </Card>

              {/* Sections List */}
              <div className="space-y-2">
                <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                  Conteúdo
                </h3>
                
                {displaySections.map((section, sectionIndex) => (
                  <Card 
                    key={section.id} 
                    className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                  >
                    {/* Section Header */}
                    <div 
                      className="px-3 py-2 flex items-center gap-2"
                      style={{ backgroundColor: `${primaryColor}08` }}
                    >
                      <div 
                        className="w-6 h-6 rounded flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                        style={{ backgroundColor: primaryColor }}
                      >
                        {sectionIndex + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-medium truncate">{section.title}</p>
                        {section.description && (
                          <p className="text-[9px] text-muted-foreground truncate">
                            {section.description}
                          </p>
                        )}
                      </div>
                      <ChevronRight className="w-3 h-3 text-muted-foreground shrink-0" />
                    </div>
                    
                    {/* Section Blocks */}
                    <div className="px-3 py-2 space-y-1.5 bg-background">
                      {section.blocks.slice(0, 3).map((block) => (
                        <div 
                          key={block.id}
                          className="flex items-center gap-2 p-1.5 rounded-md bg-muted/40 hover:bg-muted/60 transition-colors"
                        >
                          <div 
                            className="w-5 h-5 rounded flex items-center justify-center shrink-0"
                            style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}
                          >
                            {getBlockIcon(block.type)}
                          </div>
                          <span className="text-[10px] truncate flex-1">
                            {block.type === 'customer_history' && block.customer_name 
                              ? `Histórico: ${block.customer_name}`
                              : block.type === 'payment_history' && block.customer_name
                              ? `Pagamentos: ${block.customer_name}`
                              : block.title || getBlockTypeLabel(block.type)}
                          </span>
                          {block.type === 'video' && (
                            <Play className="w-3 h-3 text-muted-foreground shrink-0" />
                          )}
                        </div>
                      ))}
                      {section.blocks.length > 3 && (
                        <p 
                          className="text-[9px] text-center py-1"
                          style={{ color: primaryColor }}
                        >
                          +{section.blocks.length - 3} mais itens
                        </p>
                      )}
                      {section.blocks.length === 0 && (
                        <p className="text-[9px] text-muted-foreground text-center py-2">
                          Nenhum conteúdo ainda
                        </p>
                      )}
                    </div>
                  </Card>
                ))}

                {displaySections.length === 0 && (
                  <Card className="p-4">
                    <p className="text-[10px] text-muted-foreground text-center">
                      Adicione seções para ver o preview
                    </p>
                  </Card>
                )}
              </div>
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Preview Label */}
      <div className="absolute top-10 right-2 z-10">
        <div 
          className="text-[9px] px-1.5 py-0.5 rounded font-medium text-white"
          style={{ backgroundColor: primaryColor }}
        >
          ÁREA INTERNA
        </div>
      </div>
    </div>
  );
}
