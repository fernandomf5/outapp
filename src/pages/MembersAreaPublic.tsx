import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { Lock, Image as ImageIcon, Video, FileText, Link as LinkIcon, MousePointer, Download, LogOut, Music, Code, HelpCircle, GitBranch, History, CheckSquare, Award, Radio, Brain, StickyNote, MessageSquare, Presentation, Eye, EyeOff, Home, BookOpen, User, ChevronRight, Play, Menu, X } from "lucide-react";
import { toast } from "sonner";
import { CustomerHistoryTimeline } from "@/components/members-area/CustomerHistoryTimeline";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface ContentBlock {
  id: string;
  type: 'image' | 'video' | 'document' | 'link' | 'button' | 'text' | 'download' | 'audio' | 'embed' | 'quiz' | 'timeline' | 'customer_history' | 'checklist' | 'certificate' | 'webinar' | 'notes' | 'faq' | 'mindmap' | 'slides';
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

interface MembersArea {
  id: string;
  name: string;
  description: string;
  password: string;
  slug: string;
  sections: Section[];
  is_active: boolean;
  primary_color?: string;
  secondary_color?: string;
  logo_url?: string;
  login_background_color?: string;
  login_text_color?: string;
  background_color?: string;
  text_color?: string;
  card_background_color?: string;
  card_text_color?: string;
  header_background_color?: string;
  accent_color?: string;
}

export default function MembersAreaPublic() {
  const { slug } = useParams();
  const [area, setArea] = useState<MembersArea | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    loadArea();
  }, [slug]);

  const loadArea = async () => {
    try {
      const { data, error } = await supabase
        .from('simple_members_areas' as any)
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .single();

      if (error) throw error;
      setArea(data as any);
      if ((data as any).sections?.length > 0) {
        setActiveSection((data as any).sections[0].id);
      }
    } catch (error: any) {
      toast.error('Área de membros não encontrada');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = () => {
    if (!area) return;
    
    if (passwordInput === area.password) {
      setIsAuthenticated(true);
      toast.success('Acesso liberado!');
    } else {
      toast.error('Senha incorreta');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setPasswordInput('');
    toast.success('Você saiu da área de membros');
  };

  const getBlockIcon = (type: string) => {
    const icons: Record<string, React.ReactNode> = {
      video: <Video className="w-4 h-4" />,
      image: <ImageIcon className="w-4 h-4" />,
      document: <FileText className="w-4 h-4" />,
      link: <LinkIcon className="w-4 h-4" />,
      button: <MousePointer className="w-4 h-4" />,
      download: <Download className="w-4 h-4" />,
      audio: <Music className="w-4 h-4" />,
      embed: <Code className="w-4 h-4" />,
      quiz: <HelpCircle className="w-4 h-4" />,
      timeline: <GitBranch className="w-4 h-4" />,
      customer_history: <History className="w-4 h-4" />,
      checklist: <CheckSquare className="w-4 h-4" />,
      certificate: <Award className="w-4 h-4" />,
      webinar: <Radio className="w-4 h-4" />,
      notes: <StickyNote className="w-4 h-4" />,
      faq: <MessageSquare className="w-4 h-4" />,
      mindmap: <Brain className="w-4 h-4" />,
      slides: <Presentation className="w-4 h-4" />,
      text: <FileText className="w-4 h-4" />,
    };
    return icons[type] || <FileText className="w-4 h-4" />;
  };

  const renderBlock = (block: ContentBlock, accentColor: string, cardTextColor: string) => {
    switch (block.type) {
      case 'text':
        return <div className="prose prose-sm max-w-none" style={{ color: cardTextColor }} dangerouslySetInnerHTML={{ __html: block.content }} />;
      
      case 'image':
        return (
          <div className="relative w-full">
            <img src={block.content} alt={block.title || 'Imagem'} className="w-full rounded-lg" />
          </div>
        );
      
      case 'video':
        return (
          <div className="relative w-full aspect-video">
            {block.content.includes('youtube.com') || block.content.includes('youtu.be') ? (
              <iframe
                className="w-full h-full rounded-lg"
                src={block.content.replace('watch?v=', 'embed/')}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : block.content.includes('vimeo.com') ? (
              <iframe
                className="w-full h-full rounded-lg"
                src={block.content.replace('vimeo.com/', 'player.vimeo.com/video/')}
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <video controls className="w-full h-full rounded-lg">
                <source src={block.content} />
              </video>
            )}
          </div>
        );
      
      case 'document':
        return (
          <a 
            href={block.content} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-4 rounded-lg transition-all hover:shadow-md"
            style={{ backgroundColor: `${accentColor}10` }}
          >
            <div 
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${accentColor}20`, color: accentColor }}
            >
              <FileText className="w-5 h-5" />
            </div>
            <span style={{ color: cardTextColor }}>{block.title || 'Documento'}</span>
          </a>
        );
      
      case 'link':
        return (
          <a 
            href={block.content} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-4 rounded-lg transition-all hover:shadow-md"
            style={{ backgroundColor: `${accentColor}10`, color: accentColor }}
          >
            <div 
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${accentColor}20` }}
            >
              <LinkIcon className="w-5 h-5" />
            </div>
            <span>{block.title || block.content}</span>
          </a>
        );
      
      case 'button':
        return (
          <a href={block.content} target="_blank" rel="noopener noreferrer">
            <Button 
              className="w-full text-white"
              size="lg"
              style={{ backgroundColor: accentColor }}
            >
              {block.title || 'Clique aqui'}
            </Button>
          </a>
        );
      
      case 'download':
        return (
          <a href={block.content} download>
            <Button 
              className="w-full gap-2" 
              size="lg" 
              variant="outline"
              style={{ borderColor: accentColor, color: accentColor }}
            >
              <Download className="w-5 h-5" />
              {block.title || 'Baixar Arquivo'}
            </Button>
          </a>
        );

      case 'audio':
        return (
          <div 
            className="p-4 rounded-lg"
            style={{ backgroundColor: `${accentColor}10` }}
          >
            <div className="flex items-center gap-2 mb-3">
              <div 
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${accentColor}20`, color: accentColor }}
              >
                <Music className="w-4 h-4" />
              </div>
              <span className="font-medium" style={{ color: cardTextColor }}>{block.title || 'Áudio'}</span>
            </div>
            <audio controls className="w-full">
              <source src={block.content} />
            </audio>
          </div>
        );

      case 'embed':
        return (
          <div 
            className="w-full rounded-lg overflow-hidden"
            dangerouslySetInnerHTML={{ __html: block.content }} 
          />
        );

      case 'customer_history':
        if (!block.customer_id) {
          return (
            <div className="text-center py-8" style={{ color: cardTextColor }}>
              <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Cliente não selecionado</p>
            </div>
          );
        }
        return (
          <div className="space-y-4">
            {block.title && (
              <h3 className="text-lg font-semibold flex items-center gap-2" style={{ color: cardTextColor }}>
                <History className="w-5 h-5" />
                {block.title}
              </h3>
            )}
            <CustomerHistoryTimeline 
              customerId={block.customer_id} 
              primaryColor={accentColor}
            />
          </div>
        );

      case 'notes':
      case 'faq':
      case 'checklist':
        const iconMap = { notes: StickyNote, faq: MessageSquare, checklist: CheckSquare };
        const Icon = iconMap[block.type];
        return (
          <div 
            className="p-4 rounded-lg"
            style={{ backgroundColor: `${accentColor}10` }}
          >
            <div className="flex items-center gap-2 mb-3">
              <div 
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${accentColor}20`, color: accentColor }}
              >
                <Icon className="w-4 h-4" />
              </div>
              <span className="font-medium" style={{ color: cardTextColor }}>{block.title || block.type}</span>
            </div>
            <div className="prose prose-sm max-w-none" style={{ color: cardTextColor }} dangerouslySetInnerHTML={{ __html: block.content }} />
          </div>
        );
      
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!area) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">Área de membros não encontrada</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const primaryColor = area.primary_color || '#8B5CF6';
  const secondaryColor = area.secondary_color || '#EC4899';
  const loginBackgroundColor = area.login_background_color || '#1a1a2e';
  const loginTextColor = area.login_text_color || '#ffffff';
  const backgroundColor = area.background_color || '#ffffff';
  const textColor = area.text_color || '#1f2937';
  const cardBackgroundColor = area.card_background_color || '#f9fafb';
  const cardTextColor = area.card_text_color || '#374151';
  const headerBackgroundColor = area.header_background_color || '#f3f4f6';
  const accentColor = area.accent_color || primaryColor;

  // Login Screen
  if (!isAuthenticated) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center p-4"
        style={{ backgroundColor: loginBackgroundColor }}
      >
        <Card 
          className="w-full max-w-md overflow-hidden shadow-2xl border-0"
          style={{ backgroundColor: loginBackgroundColor }}
        >
          {/* Hero Banner */}
          <div 
            className="relative py-12 px-6 text-center"
            style={{ 
              background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)` 
            }}
          >
            {area.logo_url ? (
              <img 
                src={area.logo_url} 
                alt={area.name} 
                className="w-20 h-20 mx-auto mb-4 rounded-xl object-cover bg-white/20 shadow-lg"
              />
            ) : (
              <div className="w-20 h-20 mx-auto mb-4 rounded-xl flex items-center justify-center bg-white/20 shadow-lg">
                <Play className="w-10 h-10 text-white" />
              </div>
            )}
            
            <h1 className="text-2xl font-bold text-white mb-2">{area.name}</h1>
            <p className="text-white/80 text-sm max-w-xs mx-auto">{area.description}</p>
            
            <div className="flex items-center justify-center gap-2 mt-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-white/20 text-white backdrop-blur-sm">
                <Lock className="w-4 h-4" />
                Acesso Protegido
              </div>
            </div>
          </div>

          <CardContent className="p-6 space-y-6">
            {/* Sections Preview */}
            {area.sections.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold" style={{ color: loginTextColor }}>Conteúdo Disponível</h3>
                  <span 
                    className="text-xs font-medium px-2 py-1 rounded-full"
                    style={{ backgroundColor: `${primaryColor}30`, color: primaryColor }}
                  >
                    {area.sections.length} módulos
                  </span>
                </div>
                
                {area.sections.slice(0, 3).map((section, index) => (
                  <div 
                    key={section.id} 
                    className="p-3 rounded-lg transition-colors"
                    style={{ backgroundColor: `${loginTextColor}10` }}
                  >
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-sm"
                        style={{ backgroundColor: primaryColor }}
                      >
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: loginTextColor }}>{section.title}</p>
                        {section.description && (
                          <p className="text-xs truncate" style={{ color: `${loginTextColor}99` }}>{section.description}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {area.sections.length > 3 && (
                  <p 
                    className="text-xs text-center font-medium py-1"
                    style={{ color: primaryColor }}
                  >
                    +{area.sections.length - 3} módulos adicionais
                  </p>
                )}
              </div>
            )}

            {/* Login Form */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="password" style={{ color: loginTextColor }}>Digite a senha para acessar</Label>
                <div className="relative mt-2">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handlePasswordSubmit()}
                    placeholder="••••••••"
                    className="pr-10 border"
                    style={{ 
                      backgroundColor: `${loginTextColor}08`, 
                      borderColor: `${loginTextColor}20`,
                      color: loginTextColor
                    }}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" style={{ color: `${loginTextColor}60` }} />
                    ) : (
                      <Eye className="h-4 w-4" style={{ color: `${loginTextColor}60` }} />
                    )}
                  </Button>
                </div>
              </div>
              <Button 
                onClick={handlePasswordSubmit} 
                className="w-full text-white"
                size="lg"
                style={{ 
                  background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)` 
                }}
              >
                Acessar Conteúdo
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Internal Members Area with Sidebar
  const currentSection = area.sections.find(s => s.id === activeSection) || area.sections[0];

  return (
    <div 
      className="min-h-screen flex"
      style={{ backgroundColor: backgroundColor, color: textColor }}
    >
      {/* Desktop Sidebar */}
      <div 
        className="hidden md:flex w-20 flex-shrink-0 flex-col items-center py-6 gap-4 border-r"
        style={{ backgroundColor: headerBackgroundColor, borderColor: `${accentColor}20` }}
      >
        {/* Logo */}
        {area.logo_url ? (
          <img 
            src={area.logo_url} 
            alt={area.name} 
            className="w-12 h-12 rounded-xl object-cover border-2"
            style={{ borderColor: accentColor }}
          />
        ) : (
          <div 
            className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-lg font-bold"
            style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
          >
            {area.name ? area.name.charAt(0).toUpperCase() : 'A'}
          </div>
        )}

        <div className="flex-1 flex flex-col items-center gap-2 mt-4">
          <button 
            className="w-12 h-12 rounded-xl flex items-center justify-center transition-all text-white"
            style={{ backgroundColor: accentColor }}
          >
            <Home className="w-5 h-5" />
          </button>
          <button 
            className="w-12 h-12 rounded-xl flex items-center justify-center transition-all hover:opacity-70"
            style={{ color: textColor, backgroundColor: `${accentColor}10` }}
          >
            <BookOpen className="w-5 h-5" />
          </button>
          <button 
            className="w-12 h-12 rounded-xl flex items-center justify-center transition-all hover:opacity-70"
            style={{ color: textColor, backgroundColor: `${accentColor}10` }}
          >
            <User className="w-5 h-5" />
          </button>
        </div>

        <button 
          onClick={handleLogout}
          className="w-12 h-12 rounded-xl flex items-center justify-center transition-all hover:bg-red-100"
          style={{ color: '#ef4444' }}
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>

      {/* Mobile Header */}
      <div 
        className="md:hidden fixed top-0 left-0 right-0 z-50 px-4 py-3 border-b flex items-center justify-between"
        style={{ backgroundColor: headerBackgroundColor, borderColor: `${accentColor}20` }}
      >
        <div className="flex items-center gap-3">
          {area.logo_url ? (
            <img 
              src={area.logo_url} 
              alt={area.name} 
              className="w-8 h-8 rounded-lg object-cover"
            />
          ) : (
            <div 
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold"
              style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
            >
              {area.name ? area.name.charAt(0).toUpperCase() : 'A'}
            </div>
          )}
          <span className="font-semibold text-sm" style={{ color: textColor }}>{area.name}</span>
        </div>
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${accentColor}10`, color: accentColor }}
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 z-40 pt-16"
          style={{ backgroundColor: backgroundColor }}
        >
          <ScrollArea className="h-full p-4">
            <div className="space-y-2">
              {area.sections.map((section, index) => (
                <button
                  key={section.id}
                  onClick={() => {
                    setActiveSection(section.id);
                    setMobileMenuOpen(false);
                  }}
                  className="w-full p-4 rounded-xl flex items-center gap-3 transition-all text-left"
                  style={{ 
                    backgroundColor: activeSection === section.id ? `${accentColor}15` : cardBackgroundColor,
                    borderColor: activeSection === section.id ? accentColor : 'transparent',
                    borderWidth: '2px'
                  }}
                >
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold shrink-0"
                    style={{ backgroundColor: activeSection === section.id ? accentColor : `${accentColor}60` }}
                  >
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate" style={{ color: cardTextColor }}>{section.title}</p>
                    {section.description && (
                      <p className="text-sm truncate opacity-70" style={{ color: cardTextColor }}>{section.description}</p>
                    )}
                  </div>
                </button>
              ))}
            </div>
            
            <Button 
              onClick={handleLogout}
              variant="outline"
              className="w-full mt-6 gap-2"
              style={{ borderColor: '#ef4444', color: '#ef4444' }}
            >
              <LogOut className="w-4 h-4" />
              Sair
            </Button>
          </ScrollArea>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 md:flex-row">
        {/* Sections Sidebar (Desktop) */}
        <div 
          className="hidden md:block w-80 flex-shrink-0 border-r overflow-y-auto"
          style={{ backgroundColor: cardBackgroundColor, borderColor: `${accentColor}15` }}
        >
          {/* Header */}
          <div 
            className="px-6 py-5 border-b"
            style={{ backgroundColor: headerBackgroundColor, borderColor: `${accentColor}15` }}
          >
            <h2 className="text-lg font-bold" style={{ color: textColor }}>{area.name}</h2>
            <p className="text-sm mt-1 opacity-70" style={{ color: textColor }}>{area.description}</p>
          </div>

          {/* Progress */}
          <div className="p-4 border-b" style={{ borderColor: `${accentColor}15` }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium" style={{ color: cardTextColor }}>Seu Progresso</span>
              <span className="text-sm font-bold" style={{ color: accentColor }}>35%</span>
            </div>
            <div 
              className="w-full h-2 rounded-full overflow-hidden"
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

          {/* Sections List */}
          <div className="p-4 space-y-2">
            <h3 
              className="text-xs font-semibold uppercase tracking-wide mb-3"
              style={{ color: cardTextColor }}
            >
              Módulos
            </h3>
            
            {area.sections.map((section, index) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className="w-full p-3 rounded-xl flex items-center gap-3 transition-all text-left"
                style={{ 
                  backgroundColor: activeSection === section.id ? `${accentColor}15` : 'transparent',
                  borderColor: activeSection === section.id ? accentColor : 'transparent',
                  borderWidth: '2px'
                }}
              >
                <div 
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-sm font-bold shrink-0"
                  style={{ backgroundColor: activeSection === section.id ? accentColor : `${accentColor}60` }}
                >
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: cardTextColor }}>{section.title}</p>
                  {section.description && (
                    <p className="text-xs truncate opacity-70" style={{ color: cardTextColor }}>{section.description}</p>
                  )}
                </div>
                <ChevronRight 
                  className="w-4 h-4 shrink-0 transition-transform"
                  style={{ 
                    color: cardTextColor,
                    transform: activeSection === section.id ? 'rotate(90deg)' : 'none'
                  }}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto pt-16 md:pt-0">
          {/* Content Header */}
          <div 
            className="px-6 py-5 border-b hidden md:block"
            style={{ backgroundColor: headerBackgroundColor, borderColor: `${accentColor}15` }}
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold" style={{ color: textColor }}>
                  {currentSection?.title || 'Selecione um módulo'}
                </h2>
                {currentSection?.description && (
                  <p className="text-sm mt-1 opacity-70" style={{ color: textColor }}>
                    {currentSection.description}
                  </p>
                )}
              </div>
              <Badge 
                className="text-sm px-3 py-1 border"
                style={{ 
                  backgroundColor: `${accentColor}15`, 
                  color: accentColor,
                  borderColor: `${accentColor}30`
                }}
              >
                Premium
              </Badge>
            </div>
          </div>

          {/* Content Blocks */}
          <div className="p-4 md:p-6 space-y-4">
            {currentSection?.blocks && currentSection.blocks.length > 0 ? (
              (() => {
                // Group blocks by their block_position to arrange them in rows
                const layout = currentSection.blocks_layout || ['full'];
                const blocksByPosition: Record<number, ContentBlock[]> = {};
                
                currentSection.blocks.forEach(block => {
                  const pos = block.block_position || 0;
                  if (!blocksByPosition[pos]) blocksByPosition[pos] = [];
                  blocksByPosition[pos].push(block);
                });
                
                // Get the max position to render rows
                const maxPosition = Math.max(...Object.keys(blocksByPosition).map(Number), 0);
                
                return (
                  <div className="space-y-4">
                    {Array.from({ length: maxPosition + 1 }, (_, rowIndex) => {
                      const layoutType = layout[rowIndex] || 'full';
                      const blocksInRow = blocksByPosition[rowIndex] || [];
                      
                      if (blocksInRow.length === 0) return null;
                      
                      // Determine grid columns based on layout
                      const gridCols = layoutType === 'third' 
                        ? 'md:grid-cols-3' 
                        : layoutType === 'half' 
                          ? 'md:grid-cols-2' 
                          : 'grid-cols-1';
                      
                      return (
                        <div key={rowIndex} className={`grid grid-cols-1 ${gridCols} gap-4`}>
                          {blocksInRow.map((block) => (
                            <Card 
                              key={block.id}
                              className="overflow-hidden transition-all hover:shadow-lg"
                              style={{ 
                                backgroundColor: cardBackgroundColor,
                                borderColor: `${accentColor}20`
                              }}
                            >
                              <div 
                                className="px-4 py-3 flex items-center gap-3 border-b"
                                style={{ backgroundColor: `${accentColor}08`, borderColor: `${accentColor}15` }}
                              >
                                <div 
                                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                                  style={{ backgroundColor: `${accentColor}20`, color: accentColor }}
                                >
                                  {getBlockIcon(block.type)}
                                </div>
                                {block.title && (
                                  <span className="font-medium" style={{ color: cardTextColor }}>{block.title}</span>
                                )}
                              </div>
                              <CardContent className="p-4">
                                {renderBlock(block, accentColor, cardTextColor)}
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                );
              })()
            ) : (
              <div 
                className="text-center py-16 rounded-xl"
                style={{ backgroundColor: cardBackgroundColor }}
              >
                <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-30" style={{ color: cardTextColor }} />
                <p className="text-lg font-medium" style={{ color: cardTextColor }}>Nenhum conteúdo disponível</p>
                <p className="text-sm opacity-70 mt-1" style={{ color: cardTextColor }}>
                  Selecione um módulo para ver o conteúdo
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div 
        className="md:hidden fixed bottom-0 left-0 right-0 border-t px-4 py-2 flex items-center justify-around"
        style={{ backgroundColor: headerBackgroundColor, borderColor: `${accentColor}20` }}
      >
        <button 
          className="flex flex-col items-center gap-1 p-2"
          style={{ color: accentColor }}
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px] font-medium">Início</span>
        </button>
        <button 
          onClick={() => setMobileMenuOpen(true)}
          className="flex flex-col items-center gap-1 p-2"
          style={{ color: textColor }}
        >
          <BookOpen className="w-5 h-5" />
          <span className="text-[10px] font-medium">Módulos</span>
        </button>
        <button 
          className="flex flex-col items-center gap-1 p-2"
          style={{ color: textColor }}
        >
          <User className="w-5 h-5" />
          <span className="text-[10px] font-medium">Perfil</span>
        </button>
        <button 
          onClick={handleLogout}
          className="flex flex-col items-center gap-1 p-2"
          style={{ color: '#ef4444' }}
        >
          <LogOut className="w-5 h-5" />
          <span className="text-[10px] font-medium">Sair</span>
        </button>
      </div>
    </div>
  );
}
