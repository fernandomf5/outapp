import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Lock, Play, FileText, Image, Video, Link as LinkIcon, MousePointer, Download, Eye, EyeOff, LogIn, Music, Code, HelpCircle, GitBranch, History, CheckSquare, Award, Radio, Brain, StickyNote, MessageSquare, Presentation, Monitor, Tablet, Smartphone, Home, BookOpen, User, ChevronRight, Images, Film } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface ContentBlock {
  id: string;
  type: 'image' | 'video' | 'document' | 'link' | 'button' | 'text' | 'download' | 'audio' | 'embed' | 'quiz' | 'timeline' | 'customer_history' | 'checklist' | 'certificate' | 'webinar' | 'notes' | 'faq' | 'mindmap' | 'slides' | 'gallery' | 'video_gallery' | 'ads_dashboard' | 'secret';
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

interface SimpleMembersAreaPreviewProps {
  name: string;
  description: string;
  primaryColor: string;
  secondaryColor: string;
  logoUrl?: string;
  sections?: Section[];
  // Design da tela de login
  loginBackgroundColor?: string;
  loginTextColor?: string;
  // Design da área interna
  backgroundColor?: string;
  textColor?: string;
  cardBackgroundColor?: string;
  cardTextColor?: string;
  headerBackgroundColor?: string;
  accentColor?: string;
  areaType?: string;
  customerName?: string;
}

type DeviceType = 'desktop' | 'tablet' | 'mobile';
type ViewMode = 'login' | 'internal';

export function SimpleMembersAreaPreview({
  name,
  description,
  primaryColor,
  secondaryColor,
  logoUrl,
  sections = [],
  loginBackgroundColor = '#1a1a2e',
  loginTextColor = '#ffffff',
  backgroundColor = '#ffffff',
  textColor = '#1f2937',
  cardBackgroundColor = '#f9fafb',
  cardTextColor = '#374151',
  headerBackgroundColor = '#f3f4f6',
  accentColor = '#8B5CF6',
  areaType = 'course',
  customerName,
}: SimpleMembersAreaPreviewProps) {
  const [previewMode, setPreviewMode] = useState<ViewMode>('login');
  const [deviceType, setDeviceType] = useState<DeviceType>('desktop');

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
      gallery: <Images className="w-3 h-3" />,
      video_gallery: <Film className="w-3 h-3" />,
      secret: <EyeOff className="w-3 h-3" />,
    };
    return icons[type] || <FileText className="w-3 h-3" />;
  };

  const getDeviceWidth = () => {
    switch (deviceType) {
      case 'mobile': return 'max-w-[320px]';
      case 'tablet': return 'max-w-[500px]';
      default: return 'w-full';
    }
  };

  const getDeviceHeight = () => {
    switch (deviceType) {
      case 'mobile': return 'h-[500px]';
      case 'tablet': return 'h-[450px]';
      default: return 'h-[420px]';
    }
  };

  const renderLoginPreview = () => (
    <div 
      className="max-h-[380px] overflow-y-auto"
      style={{ backgroundColor: loginBackgroundColor, color: loginTextColor }}
    >
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
          <h3 className="text-xs font-semibold" style={{ color: loginTextColor }}>Conteúdo Disponível</h3>
          <span 
            className="text-[10px] font-medium px-2 py-0.5 rounded-full"
            style={{ backgroundColor: `${primaryColor}30`, color: primaryColor }}
          >
            {displaySections.length} módulos
          </span>
        </div>
        
        {displaySections.slice(0, 3).map((section, index) => (
          <Card 
            key={section.id || index} 
            className="p-3 transition-colors border-0"
            style={{ backgroundColor: `${loginTextColor}10` }}
          >
            <div className="flex items-center gap-2 mb-2">
              <div 
                className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-[10px] font-bold shrink-0 shadow-sm"
                style={{ backgroundColor: primaryColor }}
              >
                {index + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate" style={{ color: loginTextColor }}>{section.title}</p>
                {section.description && (
                  <p className="text-[10px] truncate" style={{ color: `${loginTextColor}99` }}>{section.description}</p>
                )}
              </div>
            </div>
            
            <div className="space-y-1 ml-9">
              {section.blocks.slice(0, 2).map((block, blockIndex) => (
                <div 
                  key={block.id || blockIndex}
                  className="flex items-center gap-2 p-1.5 rounded text-[10px]"
                  style={{ backgroundColor: `${loginTextColor}08` }}
                >
                  <div 
                    className="w-5 h-5 rounded flex items-center justify-center"
                    style={{ backgroundColor: `${primaryColor}20`, color: primaryColor }}
                  >
                    {getBlockIcon(block.type)}
                  </div>
                  <span className="truncate" style={{ color: loginTextColor }}>{block.title || block.type}</span>
                </div>
              ))}
              {section.blocks.length > 2 && (
                <p className="text-[9px] pl-7" style={{ color: `${loginTextColor}70` }}>
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
        <Card 
          className="p-3 border-dashed border-0"
          style={{ backgroundColor: `${loginTextColor}10` }}
        >
          <p className="text-[10px] text-center mb-2" style={{ color: `${loginTextColor}80` }}>
            Digite a senha para acessar
          </p>
          <div className="flex gap-2">
            <div 
              className="flex-1 h-9 rounded-lg border flex items-center px-3"
              style={{ backgroundColor: `${loginTextColor}08`, borderColor: `${loginTextColor}20` }}
            >
              <span className="text-[11px]" style={{ color: `${loginTextColor}60` }}>••••••••</span>
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
  );

  const renderInternalPreview = () => {
    const showSidebar = deviceType !== 'mobile';
    
    return (
      <div 
        className={`flex ${getDeviceHeight()}`}
        style={{ backgroundColor: backgroundColor, color: textColor }}
      >
        {/* Sidebar - hide on mobile */}
        {showSidebar && (
          <div 
            className="w-14 flex-shrink-0 flex flex-col items-center py-3 gap-3 border-r"
            style={{ backgroundColor: headerBackgroundColor }}
          >
            {/* Logo */}
            {logoUrl ? (
              <img 
                src={logoUrl} 
                alt="Logo" 
                className="w-8 h-8 rounded-lg object-cover border"
                style={{ borderColor: accentColor }}
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
                className="w-9 h-9 rounded-lg flex items-center justify-center transition-colors text-white"
                style={{ backgroundColor: accentColor }}
              >
                <Home className="w-4 h-4" />
              </button>
              <button 
                className="w-9 h-9 rounded-lg flex items-center justify-center transition-colors hover:opacity-70"
                style={{ color: textColor }}
              >
                <BookOpen className="w-4 h-4" />
              </button>
              <button 
                className="w-9 h-9 rounded-lg flex items-center justify-center transition-colors hover:opacity-70"
                style={{ color: textColor }}
              >
                <User className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <div 
            className="px-4 py-3 border-b"
            style={{ backgroundColor: headerBackgroundColor }}
          >
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex items-center gap-2">
                {/* Mobile menu icon */}
                {deviceType === 'mobile' && logoUrl ? (
                  <img 
                    src={logoUrl} 
                    alt="Logo" 
                    className="w-6 h-6 rounded object-cover"
                  />
                ) : deviceType === 'mobile' && (
                  <div 
                    className="w-6 h-6 rounded flex items-center justify-center text-white text-xs font-bold"
                    style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
                  >
                    {name ? name.charAt(0).toUpperCase() : 'A'}
                  </div>
                )}
                <div>
                  <h2 className="text-sm font-bold truncate" style={{ color: textColor }}>
                    {customerName ? `Olá, ${customerName}! 👋` : (name || "Sua Área")}
                  </h2>
                  {deviceType !== 'mobile' && (
                    <p className="text-[10px] truncate" style={{ color: cardTextColor }}>
                      {customerName 
                        ? (description || "Bem-vindo à sua área exclusiva")
                        : (description || "Bem-vindo à sua área de membros")}
                    </p>
                  )}
                </div>
              </div>
              <Badge 
                className="text-[9px] px-2 py-0.5 shrink-0 ml-2 border"
                style={{ 
                  backgroundColor: `${accentColor}20`, 
                  color: accentColor,
                  borderColor: `${accentColor}40`
                }}
              >
                Premium
              </Badge>
            </div>
          </div>

          {/* Content */}
          <ScrollArea className="flex-1">
            <div className="p-3 space-y-3">
              {/* Progress Card - only for courses */}
              {areaType !== 'exclusive' && (
              <div 
                className="p-3 rounded-lg"
                style={{ backgroundColor: cardBackgroundColor }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-medium" style={{ color: cardTextColor }}>
                    Seu Progresso
                  </span>
                  <span 
                    className="text-[10px] font-bold"
                    style={{ color: accentColor }}
                  >
                    35%
                  </span>
                </div>
                <div 
                  className="w-full h-1.5 rounded-full overflow-hidden"
                  style={{ backgroundColor: `${accentColor}20` }}
                >
                  <div 
                    className="h-full rounded-full transition-all"
                    style={{ 
                      width: '35%',
                      background: `linear-gradient(90deg, ${primaryColor}, ${secondaryColor})` 
                    }}
                  />
                </div>
              </div>
              )}

              {/* Sections List */}
              <div className="space-y-2">
                <h3 
                  className="text-[11px] font-semibold uppercase tracking-wide"
                  style={{ color: cardTextColor }}
                >
                  Conteúdo
                </h3>
                
                {displaySections.map((section, sectionIndex) => (
                  <div 
                    key={section.id} 
                    className="overflow-hidden rounded-lg hover:shadow-md transition-shadow cursor-pointer border"
                    style={{ 
                      backgroundColor: cardBackgroundColor,
                      borderColor: `${accentColor}20`
                    }}
                  >
                    {/* Section Header */}
                    <div 
                      className="px-3 py-2 flex items-center gap-2"
                      style={{ backgroundColor: `${accentColor}08` }}
                    >
                      <div 
                        className="w-6 h-6 rounded flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                        style={{ backgroundColor: accentColor }}
                      >
                        {sectionIndex + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-medium truncate" style={{ color: cardTextColor }}>
                          {section.title}
                        </p>
                        {section.description && deviceType !== 'mobile' && (
                          <p className="text-[9px] truncate" style={{ color: `${cardTextColor}99` }}>
                            {section.description}
                          </p>
                        )}
                      </div>
                      <ChevronRight className="w-3 h-3 shrink-0" style={{ color: cardTextColor }} />
                    </div>
                    
                    {/* Section Blocks */}
                    <div className="px-3 py-2 space-y-1.5" style={{ backgroundColor: cardBackgroundColor }}>
                      {section.blocks.slice(0, deviceType === 'mobile' ? 2 : 3).map((block) => (
                        <div 
                          key={block.id}
                          className="flex items-center gap-2 p-1.5 rounded-md transition-colors"
                          style={{ backgroundColor: `${accentColor}08` }}
                        >
                          <div 
                            className="w-5 h-5 rounded flex items-center justify-center shrink-0"
                            style={{ backgroundColor: `${accentColor}15`, color: accentColor }}
                          >
                            {getBlockIcon(block.type)}
                          </div>
                          <span className="text-[10px] truncate flex-1" style={{ color: cardTextColor }}>
                            {block.title || block.type}
                          </span>
                          {block.type === 'video' && (
                            <Play className="w-3 h-3 shrink-0" style={{ color: cardTextColor }} />
                          )}
                        </div>
                      ))}
                      {section.blocks.length > (deviceType === 'mobile' ? 2 : 3) && (
                        <p 
                          className="text-[9px] text-center py-1"
                          style={{ color: accentColor }}
                        >
                          +{section.blocks.length - (deviceType === 'mobile' ? 2 : 3)} mais itens
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </ScrollArea>

          {/* Mobile Bottom Navigation */}
          {deviceType === 'mobile' && (
            <div 
              className="flex items-center justify-around py-2 border-t"
              style={{ backgroundColor: headerBackgroundColor }}
            >
              <button 
                className="flex flex-col items-center gap-0.5 px-3 py-1 rounded text-white"
                style={{ backgroundColor: accentColor }}
              >
                <Home className="w-4 h-4" />
                <span className="text-[8px]">Home</span>
              </button>
              <button 
                className="flex flex-col items-center gap-0.5 px-3 py-1 rounded hover:opacity-70"
                style={{ color: textColor }}
              >
                <BookOpen className="w-4 h-4" />
                <span className="text-[8px]">Conteúdo</span>
              </button>
              <button 
                className="flex flex-col items-center gap-0.5 px-3 py-1 rounded hover:opacity-70"
                style={{ color: textColor }}
              >
                <User className="w-4 h-4" />
                <span className="text-[8px]">Perfil</span>
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-3">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-2">
        <Tabs value={previewMode} onValueChange={(v) => setPreviewMode(v as ViewMode)} className="flex-1">
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

        {/* Device Selector */}
        <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
          <button
            onClick={() => setDeviceType('desktop')}
            className={`p-1.5 rounded transition-colors ${
              deviceType === 'desktop' 
                ? 'bg-background shadow-sm text-foreground' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
            title="Desktop"
          >
            <Monitor className="w-4 h-4" />
          </button>
          <button
            onClick={() => setDeviceType('tablet')}
            className={`p-1.5 rounded transition-colors ${
              deviceType === 'tablet' 
                ? 'bg-background shadow-sm text-foreground' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
            title="Tablet"
          >
            <Tablet className="w-4 h-4" />
          </button>
          <button
            onClick={() => setDeviceType('mobile')}
            className={`p-1.5 rounded transition-colors ${
              deviceType === 'mobile' 
                ? 'bg-background shadow-sm text-foreground' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
            title="Mobile"
          >
            <Smartphone className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Preview Container */}
      <div className="flex justify-center">
        <div className={`relative rounded-lg border bg-background overflow-hidden shadow-lg transition-all duration-300 ${getDeviceWidth()}`}>
          {/* Device Frame Header */}
          <div className="flex items-center gap-1.5 px-3 py-2 bg-muted/50 border-b">
            <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
            <div className="flex-1 mx-4">
              <div className="bg-muted rounded-full px-3 py-1 text-[10px] text-muted-foreground text-center truncate">
                seusite.com/members/{name ? name.toLowerCase().replace(/\s+/g, '-').slice(0, 15) : 'minha-area'}
              </div>
            </div>
          </div>

          {/* Content Area */}
          {previewMode === 'login' ? renderLoginPreview() : renderInternalPreview()}

          {/* Preview Label */}
          <div className="absolute top-10 right-2">
            <div 
              className="text-[9px] px-1.5 py-0.5 rounded font-medium text-white"
              style={{ backgroundColor: previewMode === 'login' ? primaryColor : accentColor }}
            >
              {previewMode === 'login' ? 'LOGIN' : 'ÁREA INTERNA'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
