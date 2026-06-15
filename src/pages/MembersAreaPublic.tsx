import { useState, useEffect } from "react";
import { linkifyText } from "@/utils/linkify";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { Lock, Image as ImageIcon, Video, FileText, Link as LinkIcon, MousePointer, Download, LogOut, Music, Code, HelpCircle, GitBranch, History, CheckSquare, Award, Radio, Brain, StickyNote, MessageSquare, Presentation, Eye, EyeOff, Home, BookOpen, User, ChevronRight, Play, Menu, X, ChevronDown, Megaphone, DollarSign } from "lucide-react";
import { toast } from "sonner";
import { CustomerHistoryTimeline } from "@/components/members-area/CustomerHistoryTimeline";
import { AdsDashboardBlock } from "@/components/members-area/AdsDashboardBlock";
import { PaymentHistoryBlock } from "@/components/members-area/PaymentHistoryBlock";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { VideoQuestions } from "@/components/members-area/VideoQuestions";

const SecretContentBlock = ({ content, title, accentColor, textColor }: { content: string; title?: string; accentColor: string; textColor: string }) => {
  const [visible, setVisible] = useState(false);
  return (
    <div className="p-4 rounded-lg" style={{ backgroundColor: `${accentColor}10` }}>
      <div className="flex items-center justify-between mb-2">
        <span className="font-medium text-sm" style={{ color: textColor }}>{title || 'Conteúdo Oculto'}</span>
        <button
          onClick={() => setVisible(!visible)}
          className="p-1.5 rounded-md hover:bg-black/10 transition-colors"
          style={{ color: accentColor }}
        >
          {visible ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
        </button>
      </div>
      <pre className="text-sm font-mono break-all whitespace-pre-wrap" style={{ color: textColor, margin: 0 }}>
        {visible ? content : '•'.repeat(Math.min(content.length || 10, 40))}
      </pre>
    </div>
  );
};

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

function VideoGalleryItem({ video, accentColor, cardTextColor }: { video: { url: string; title?: string; description?: string }; accentColor: string; cardTextColor: string }) {
  const [showDesc, setShowDesc] = useState(false);
  return (
    <div className="space-y-1.5">
      {video.title && <h4 className="text-sm font-medium truncate" style={{ color: cardTextColor }}>{video.title}</h4>}
      <div className="relative w-full aspect-video">
        {video.url.includes('youtube.com') || video.url.includes('youtu.be') ? (
          <iframe
            className="w-full h-full rounded-lg"
            src={video.url.replace('watch?v=', 'embed/')}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : video.url.includes('vimeo.com') ? (
          <iframe
            className="w-full h-full rounded-lg"
            src={video.url.replace('vimeo.com/', 'player.vimeo.com/video/')}
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <video controls className="w-full h-full rounded-lg">
            <source src={video.url} />
          </video>
        )}
      </div>
      {video.description && (
        <>
          <button
            onClick={() => setShowDesc(!showDesc)}
            className="flex items-center gap-1 text-xs font-medium hover:opacity-80 transition-opacity"
            style={{ color: accentColor }}
          >
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showDesc ? 'rotate-180' : ''}`} />
            {showDesc ? 'Ocultar descrição' : 'Ver descrição'}
          </button>
          {showDesc && (
            <p className="text-xs leading-relaxed pl-1" style={{ color: `${cardTextColor}99` }}>{linkifyText(video.description)}</p>
          )}
        </>
      )}
    </div>
  );
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
  area_type?: string;
  customer_name?: string;
  enable_questions?: boolean;
  user_id?: string;
}

export default function MembersAreaPublic() {
  const { slug } = useParams();
  const [area, setArea] = useState<MembersArea | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [accessCodeId, setAccessCodeId] = useState<string | null>(null);
  const [studentName, setStudentName] = useState<string>('Aluno');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginMode, setLoginMode] = useState<'password' | 'code'>('password');
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeView, setActiveView] = useState<'home' | 'content' | 'account'>('content');

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

  const handlePasswordSubmit = async () => {
    if (!area) return;
    
    if (loginMode === 'code') {
      // Verify access code
      try {
        const { data: codeData, error } = await supabase
          .from('members_area_access_codes' as any)
          .select('*')
          .eq('members_area_id', area.id)
          .eq('access_code', passwordInput.toUpperCase().trim())
          .eq('is_active', true)
          .maybeSingle();
        
        if (error || !codeData) {
          toast.error('Código de acesso inválido ou expirado');
          return;
        }
        setAccessCodeId((codeData as any).id);
        setStudentName((codeData as any).customer_name || 'Aluno');
        setIsAuthenticated(true);
        toast.success('Acesso liberado!');
      } catch {
        toast.error('Erro ao verificar código');
      }
    } else {
      if (passwordInput === area.password) {
        setIsAuthenticated(true);
        toast.success('Acesso liberado!');
      } else {
        toast.error('Senha incorreta');
      }
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
      secret: <EyeOff className="w-4 h-4" />,
    };
    return icons[type] || <FileText className="w-4 h-4" />;
  };

  const renderBlock = (block: ContentBlock, accentColor: string, cardTextColor: string, cardBackgroundColor?: string) => {
    switch (block.type) {
      case 'text':
        return <div className="prose prose-sm max-w-none" style={{ color: cardTextColor }} dangerouslySetInnerHTML={{ __html: block.content }} />;
      
      case 'image':
        return (
          <div className="relative w-full">
            <img src={block.content} alt={block.title || 'Imagem'} className="w-full rounded-lg" />
          </div>
        );
      
      case 'video': {
        let videoUrl = block.content;
        let videoDesc = '';
        try {
          const parsed = JSON.parse(block.content);
          if (parsed?.url) { videoUrl = parsed.url; videoDesc = parsed.description || ''; }
        } catch { /* legacy plain URL */ }
        return (
          <div className="space-y-2">
            <div className="relative w-full aspect-video">
              {videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be') ? (
                <iframe
                  className="w-full h-full rounded-lg"
                  src={videoUrl.replace('watch?v=', 'embed/')}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : videoUrl.includes('vimeo.com') ? (
                <iframe
                  className="w-full h-full rounded-lg"
                  src={videoUrl.replace('vimeo.com/', 'player.vimeo.com/video/')}
                  allow="autoplay; fullscreen; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <video controls className="w-full h-full rounded-lg">
                  <source src={videoUrl} />
                </video>
              )}
            </div>
            {videoDesc && (
              <p className="text-sm leading-relaxed" style={{ color: `${cardTextColor}99` }}>{linkifyText(videoDesc)}</p>
            )}
          </div>
        );
      }
      
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
      
      case 'link': {
        let linkData: { items: { label: string; url: string }[]; layout: string } = { items: [], layout: 'vertical' };
        try {
          const parsed = JSON.parse(block.content);
          if (parsed?.items) linkData = parsed;
          else linkData = { items: [{ label: block.title || block.content, url: block.content }], layout: 'vertical' };
        } catch {
          linkData = { items: [{ label: block.title || block.content, url: block.content }], layout: 'vertical' };
        }
        return (
          <div className={`flex gap-3 ${linkData.layout === 'horizontal' ? 'flex-row flex-wrap' : 'flex-col'}`}>
            {linkData.items.map((item, idx) => (
              <a 
                key={idx}
                href={item.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-4 rounded-lg transition-all hover:shadow-md flex-1"
                style={{ backgroundColor: `${accentColor}10`, color: accentColor }}
              >
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${accentColor}20` }}
                >
                  <LinkIcon className="w-5 h-5" />
                </div>
                <span>{item.label || item.url}</span>
              </a>
            ))}
          </div>
        );
      }
      
      case 'button': {
        let btnData: { items: { label: string; url: string }[]; layout: string } = { items: [], layout: 'vertical' };
        try {
          const parsed = JSON.parse(block.content);
          if (parsed?.items) btnData = parsed;
          else btnData = { items: [{ label: block.title || 'Clique aqui', url: block.content }], layout: 'vertical' };
        } catch {
          btnData = { items: [{ label: block.title || 'Clique aqui', url: block.content }], layout: 'vertical' };
        }
        return (
          <div className={`flex gap-3 ${btnData.layout === 'horizontal' ? 'flex-row flex-wrap' : 'flex-col'}`}>
            {btnData.items.map((item, idx) => (
              <a key={idx} href={item.url} target="_blank" rel="noopener noreferrer" className="flex-1">
                <Button 
                  className="w-full text-white"
                  size="lg"
                  style={{ backgroundColor: accentColor }}
                >
                  {item.label || 'Clique aqui'}
                </Button>
              </a>
            ))}
          </div>
        );
      }
      
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

      case 'secret':
        return (
          <SecretContentBlock
            content={block.content}
            title={block.title}
            accentColor={accentColor}
            textColor={cardTextColor}
          />
        );

      case 'ads_dashboard': {
        let adsData = { client_id: '', client_name: '' };
        try { adsData = JSON.parse(block.content); } catch { /* legacy */ }
        if (!adsData.client_id) {
          return (
            <div className="text-center py-8" style={{ color: cardTextColor }}>
              <Megaphone className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Cliente de anúncios não selecionado</p>
            </div>
          );
        }
        return (
          <div className="space-y-4">
            {block.title && (
              <h3 className="text-lg font-semibold flex items-center gap-2" style={{ color: cardTextColor }}>
                <Megaphone className="w-5 h-5" style={{ color: accentColor }} />
                {block.title}
              </h3>
            )}
            <AdsDashboardBlock
              clientId={adsData.client_id}
              accentColor={accentColor}
              cardTextColor={cardTextColor}
              cardBackgroundColor={cardBackgroundColor}
            />
          </div>
        );
      }

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

      case 'payment_history':
        if (!block.customer_id) {
          return (
            <div className="text-center py-8" style={{ color: cardTextColor }}>
              <DollarSign className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Cliente não selecionado</p>
            </div>
          );
        }
        return (
          <div className="space-y-4">
            {block.title && (
              <h3 className="text-lg font-semibold flex items-center gap-2" style={{ color: cardTextColor }}>
                <DollarSign className="w-5 h-5" style={{ color: accentColor }} />
                {block.title}
              </h3>
            )}
            <PaymentHistoryBlock
              customerId={block.customer_id}
              accentColor={accentColor}
              cardTextColor={cardTextColor}
              cardBackgroundColor={cardBackgroundColor}
            />
          </div>
        );

      case 'notes':
      case 'faq':
      case 'checklist':
      case 'quiz':
      case 'timeline':
      case 'certificate':
      case 'webinar':
      case 'mindmap':
      case 'slides': {
        const iconMap2: Record<string, any> = { notes: StickyNote, faq: MessageSquare, checklist: CheckSquare, quiz: HelpCircle, timeline: GitBranch, certificate: Award, webinar: Radio, mindmap: Brain, slides: Presentation };
        const Icon2 = iconMap2[block.type] || FileText;
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
                <Icon2 className="w-4 h-4" />
              </div>
              <span className="font-medium" style={{ color: cardTextColor }}>{block.title || block.type}</span>
            </div>
            <div className="prose prose-sm max-w-none" style={{ color: cardTextColor }} dangerouslySetInnerHTML={{ __html: block.content }} />
          </div>
        );
      }
      
      case 'gallery': {
        let images: { url: string; title?: string; description?: string }[] = [];
        try {
          images = JSON.parse(block.content);
        } catch {
          if (block.content) {
            images = block.content.split('|||').filter(Boolean).map(u => ({ url: u }));
          }
        }
        return (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {images.map((img, idx) => (
              <div key={idx} className="space-y-1">
                <img src={img.url} alt={img.title || `Imagem ${idx + 1}`} className="w-full rounded-lg object-cover aspect-square" />
                {img.title && <p className="text-sm font-medium" style={{ color: cardTextColor }}>{img.title}</p>}
              </div>
            ))}
          </div>
        );
      }

      case 'video_gallery': {
        let videos: { url: string; title?: string; description?: string }[] = [];
        try {
          videos = JSON.parse(block.content);
        } catch {
          if (block.content) {
            videos = block.content.split('|||').filter(Boolean).map(u => ({ url: u }));
          }
        }
        const qaEnabled = !!area?.enable_questions && !!accessCodeId && !!area?.user_id;
        return (
          <div className="flex flex-col gap-6">
            {videos.map((video, idx) => (
              <div key={idx} className="flex flex-col">
                <VideoGalleryItem video={video} accentColor={accentColor} cardTextColor={cardTextColor} />
                {qaEnabled && (
                  <VideoQuestions
                    areaId={area!.id}
                    ownerUserId={area!.user_id!}
                    blockId={block.id}
                    videoIndex={idx}
                    accessCodeId={accessCodeId!}
                    studentName={studentName}
                    accentColor={accentColor}
                    cardTextColor={cardTextColor}
                  />
                )}
              </div>
            ))}
          </div>
        );
      }

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
                className="max-w-[120px] max-h-[120px] mx-auto mb-4 rounded-xl object-contain bg-white/20 shadow-lg p-2"
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

            {/* Login Form */}
            <div className="space-y-4">
              {/* Toggle between password and access code */}
              <div className="flex gap-2 p-1 rounded-lg" style={{ backgroundColor: `${loginTextColor}10` }}>
                <button
                  onClick={() => { setLoginMode('password'); setPasswordInput(''); }}
                  className="flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all"
                  style={{
                    backgroundColor: loginMode === 'password' ? primaryColor : 'transparent',
                    color: loginMode === 'password' ? '#fff' : `${loginTextColor}80`,
                  }}
                >
                  🔒 Senha
                </button>
                <button
                  onClick={() => { setLoginMode('code'); setPasswordInput(''); }}
                  className="flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all"
                  style={{
                    backgroundColor: loginMode === 'code' ? primaryColor : 'transparent',
                    color: loginMode === 'code' ? '#fff' : `${loginTextColor}80`,
                  }}
                >
                  🔑 Código de Acesso
                </button>
              </div>

              <div>
                <Label htmlFor="password" style={{ color: loginTextColor }}>
                  {loginMode === 'code' ? 'Digite seu código de acesso' : 'Digite a senha para acessar'}
                </Label>
                <div className="relative mt-2">
                  <Input
                    id="password"
                    type={loginMode === 'code' ? 'text' : (showPassword ? "text" : "password")}
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(loginMode === 'code' ? e.target.value.toUpperCase() : e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handlePasswordSubmit()}
                    placeholder={loginMode === 'code' ? 'EX: A1B2C3D4' : '••••••••'}
                    className="pr-10 border"
                    style={{ 
                      backgroundColor: `${loginTextColor}08`, 
                      borderColor: `${loginTextColor}20`,
                      color: loginTextColor,
                      ...(loginMode === 'code' ? { letterSpacing: '0.2em', fontFamily: 'monospace', textAlign: 'center' as const } : {}),
                    }}
                  />
                  {loginMode === 'password' && (
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
                  )}
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
            onClick={() => setActiveView('home')}
            className="w-12 h-12 rounded-xl flex items-center justify-center transition-all"
            style={{ 
              backgroundColor: activeView === 'home' ? accentColor : `${accentColor}10`,
              color: activeView === 'home' ? '#ffffff' : textColor
            }}
            title="Início"
          >
            <Home className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setActiveView('content')}
            className="w-12 h-12 rounded-xl flex items-center justify-center transition-all"
            style={{ 
              backgroundColor: activeView === 'content' ? accentColor : `${accentColor}10`,
              color: activeView === 'content' ? '#ffffff' : textColor
            }}
            title="Conteúdo"
          >
            <BookOpen className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setActiveView('account')}
            className="w-12 h-12 rounded-xl flex items-center justify-center transition-all"
            style={{ 
              backgroundColor: activeView === 'account' ? accentColor : `${accentColor}10`,
              color: activeView === 'account' ? '#ffffff' : textColor
            }}
            title="Minha Conta"
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
        {/* Sections Sidebar (Desktop) - Only show for content view */}
        {activeView === 'content' && (
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

            {/* Progress - only show for courses */}
            {area.area_type !== 'exclusive' && (
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
            )}

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
        )}

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto pt-16 md:pt-0">
          {/* Home View */}
          {activeView === 'home' && (
            <>
              <div 
                className="px-6 py-5 border-b hidden md:block"
                style={{ backgroundColor: headerBackgroundColor, borderColor: `${accentColor}15` }}
              >
                <h2 className="text-xl font-bold" style={{ color: textColor }}>Início</h2>
                <p className="text-sm mt-1 opacity-70" style={{ color: textColor }}>
                  {area.customer_name 
                    ? `Olá, ${area.customer_name}! Bem-vindo(a) à sua área exclusiva` 
                    : 'Bem-vindo à sua área de membros'}
                </p>
              </div>
              <div className="p-4 md:p-6 space-y-4">
                {/* Welcome Card */}
                <Card style={{ backgroundColor: cardBackgroundColor, borderColor: `${accentColor}20` }}>
                  <div 
                    className="p-6 text-center"
                    style={{ background: `linear-gradient(135deg, ${primaryColor}20, ${secondaryColor}20)` }}
                  >
                    {area.logo_url ? (
                      <img 
                        src={area.logo_url} 
                        alt={area.name} 
                        className="w-20 h-20 mx-auto mb-4 rounded-xl object-cover"
                      />
                    ) : (
                      <div 
                        className="w-20 h-20 mx-auto mb-4 rounded-xl flex items-center justify-center text-white text-2xl font-bold"
                        style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
                      >
                        {area.name ? area.name.charAt(0).toUpperCase() : 'A'}
                      </div>
                    )}
                    <h3 className="text-2xl font-bold mb-2" style={{ color: textColor }}>
                      {area.customer_name 
                        ? `Olá, ${area.customer_name}! 👋` 
                        : area.name}
                    </h3>
                    <p className="opacity-70" style={{ color: textColor }}>{area.description}</p>
                  </div>
                </Card>

                {/* Stats */}
                <div className={`grid gap-4 ${area.area_type === 'exclusive' ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-3'}`}>
                  <Card className="p-4" style={{ backgroundColor: cardBackgroundColor, borderColor: `${accentColor}20` }}>
                    <div className="text-2xl font-bold" style={{ color: accentColor }}>{area.sections.length}</div>
                    <div className="text-sm opacity-70" style={{ color: cardTextColor }}>Módulos</div>
                  </Card>
                  <Card className="p-4" style={{ backgroundColor: cardBackgroundColor, borderColor: `${accentColor}20` }}>
                    <div className="text-2xl font-bold" style={{ color: accentColor }}>
                      {area.sections.reduce((acc, s) => acc + (s.blocks?.length || 0), 0)}
                    </div>
                    <div className="text-sm opacity-70" style={{ color: cardTextColor }}>Conteúdos</div>
                  </Card>
                  {area.area_type !== 'exclusive' && (
                    <Card className="p-4" style={{ backgroundColor: cardBackgroundColor, borderColor: `${accentColor}20` }}>
                      <div className="text-2xl font-bold" style={{ color: accentColor }}>35%</div>
                      <div className="text-sm opacity-70" style={{ color: cardTextColor }}>Progresso</div>
                    </Card>
                  )}
                </div>

                {/* Quick Access */}
                <Card style={{ backgroundColor: cardBackgroundColor, borderColor: `${accentColor}20` }}>
                  <CardContent className="p-4">
                    <h4 className="font-semibold mb-3" style={{ color: cardTextColor }}>Acesso Rápido</h4>
                    <div className="space-y-2">
                      {area.sections.slice(0, 3).map((section, index) => (
                        <button
                          key={section.id}
                          onClick={() => {
                            setActiveSection(section.id);
                            setActiveView('content');
                          }}
                          className="w-full p-3 rounded-lg flex items-center gap-3 transition-all text-left hover:opacity-80"
                          style={{ backgroundColor: `${accentColor}10` }}
                        >
                          <div 
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold"
                            style={{ backgroundColor: accentColor }}
                          >
                            {index + 1}
                          </div>
                          <span className="font-medium" style={{ color: cardTextColor }}>{section.title}</span>
                          <ChevronRight className="w-4 h-4 ml-auto" style={{ color: cardTextColor }} />
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}

          {/* Account View */}
          {activeView === 'account' && (
            <>
              <div 
                className="px-6 py-5 border-b hidden md:block"
                style={{ backgroundColor: headerBackgroundColor, borderColor: `${accentColor}15` }}
              >
                <h2 className="text-xl font-bold" style={{ color: textColor }}>Minha Conta</h2>
                <p className="text-sm mt-1 opacity-70" style={{ color: textColor }}>Gerencie suas informações</p>
              </div>
              <div className="p-4 md:p-6 space-y-4">
                <Card style={{ backgroundColor: cardBackgroundColor, borderColor: `${accentColor}20` }}>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4 mb-6">
                      <div 
                        className="w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-bold"
                        style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
                      >
                        <User className="w-8 h-8" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold" style={{ color: textColor }}>
                          {area.customer_name || 'Membro'}
                        </h3>
                        <p className="text-sm opacity-70" style={{ color: textColor }}>Acesso Premium</p>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      {area.area_type !== 'exclusive' && (
                      <div 
                        className="p-4 rounded-lg"
                        style={{ backgroundColor: `${accentColor}08` }}
                      >
                        <div className="flex items-center justify-between">
                          <span style={{ color: cardTextColor }}>Progresso Geral</span>
                          <span className="font-bold" style={{ color: accentColor }}>35%</span>
                        </div>
                        <div 
                          className="w-full h-2 rounded-full overflow-hidden mt-2"
                          style={{ backgroundColor: `${accentColor}20` }}
                        >
                          <div 
                            className="h-full rounded-full"
                            style={{ 
                              width: '35%',
                              background: `linear-gradient(90deg, ${primaryColor}, ${secondaryColor})` 
                            }}
                          />
                        </div>
                      </div>
                      )}

                      <div 
                        className="p-4 rounded-lg"
                        style={{ backgroundColor: `${accentColor}08` }}
                      >
                        <div className="flex items-center justify-between">
                          <span style={{ color: cardTextColor }}>Módulos Disponíveis</span>
                          <span className="font-bold" style={{ color: accentColor }}>{area.sections.length}</span>
                        </div>
                      </div>

                      <div 
                        className="p-4 rounded-lg"
                        style={{ backgroundColor: `${accentColor}08` }}
                      >
                        <div className="flex items-center justify-between">
                          <span style={{ color: cardTextColor }}>Conteúdos Totais</span>
                          <span className="font-bold" style={{ color: accentColor }}>
                            {area.sections.reduce((acc, s) => acc + (s.blocks?.length || 0), 0)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <Button 
                      onClick={handleLogout}
                      variant="outline"
                      className="w-full mt-6 gap-2"
                      style={{ borderColor: '#ef4444', color: '#ef4444' }}
                    >
                      <LogOut className="w-4 h-4" />
                      Sair da Área de Membros
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </>
          )}

          {/* Content View */}
          {activeView === 'content' && (
            <>
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
                    // Group contents by block_position
                    const layout = currentSection.blocks_layout || ['full'];
                    const contentsByBlock: Record<number, ContentBlock[]> = {};
                    
                    // Group all contents by their block_position
                    currentSection.blocks.forEach(block => {
                      const pos = block.block_position || 0;
                      if (!contentsByBlock[pos]) contentsByBlock[pos] = [];
                      contentsByBlock[pos].push(block);
                    });
                    
                    // Sort contents within each block by order_index
                    Object.keys(contentsByBlock).forEach(pos => {
                      contentsByBlock[parseInt(pos)].sort((a, b) => a.order_index - b.order_index);
                    });
                    
                    // Calculate how many blocks per row based on layout
                    const getBlocksPerRow = (layoutType: string) => {
                      if (layoutType === 'third') return 3;
                      if (layoutType === 'half') return 2;
                      return 1;
                    };
                    
                    // Build rows with blocks
                    const rows: { layoutType: string; blockPositions: number[] }[] = [];
                    let blockPositionIndex = 0;
                    
                    for (let rowIndex = 0; rowIndex < layout.length; rowIndex++) {
                      const layoutType = layout[rowIndex] || 'full';
                      const blocksInRow = getBlocksPerRow(layoutType);
                      const positions: number[] = [];
                      
                      for (let i = 0; i < blocksInRow; i++) {
                        positions.push(blockPositionIndex);
                        blockPositionIndex++;
                      }
                      
                      rows.push({ layoutType, blockPositions: positions });
                    }
                    
                    return (
                      <div className="space-y-4">
                        {rows.map((row, rowIndex) => {
                          // Determine grid columns based on layout
                          const gridCols = row.layoutType === 'third'
                            ? 'md:grid-cols-3' 
                            : row.layoutType === 'half'
                              ? 'md:grid-cols-2' 
                              : 'grid-cols-1';
                          
                          return (
                            <div key={rowIndex} className={`grid grid-cols-1 ${gridCols} gap-4`}>
                              {row.blockPositions.map((blockPos) => {
                                const blockContents = contentsByBlock[blockPos] || [];
                                
                                if (blockContents.length === 0) return null;
                                
                                return (
                                  <Card 
                                    key={blockPos}
                                    className="overflow-hidden transition-all hover:shadow-lg"
                                    style={{ 
                                      backgroundColor: cardBackgroundColor,
                                      borderColor: `${accentColor}20`
                                    }}
                                  >
                                    {/* Render all contents stacked vertically inside the block */}
                                    <div className="divide-y" style={{ borderColor: `${accentColor}10` }}>
                                      {blockContents.map((block, contentIndex) => (
                                        <div key={block.id}>
                                          <CardContent className="p-4 space-y-2">
                                            {block.title && (
                                              <h4 className="font-semibold text-sm" style={{ color: cardTextColor }}>
                                                {block.title}
                                              </h4>
                                            )}
                                            {renderBlock(block, accentColor, cardTextColor, cardBackgroundColor)}
                                          </CardContent>
                                        </div>
                                      ))}
                                    </div>
                                  </Card>
                                );
                              })}
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
            </>
          )}
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div 
        className="md:hidden fixed bottom-0 left-0 right-0 border-t px-4 py-2 flex items-center justify-around"
        style={{ backgroundColor: headerBackgroundColor, borderColor: `${accentColor}20` }}
      >
        <button 
          onClick={() => setActiveView('home')}
          className="flex flex-col items-center gap-1 p-2"
          style={{ color: activeView === 'home' ? accentColor : textColor }}
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px] font-medium">Início</span>
        </button>
        <button 
          onClick={() => {
            setActiveView('content');
            setMobileMenuOpen(true);
          }}
          className="flex flex-col items-center gap-1 p-2"
          style={{ color: activeView === 'content' ? accentColor : textColor }}
        >
          <BookOpen className="w-5 h-5" />
          <span className="text-[10px] font-medium">Módulos</span>
        </button>
        <button 
          onClick={() => setActiveView('account')}
          className="flex flex-col items-center gap-1 p-2"
          style={{ color: activeView === 'account' ? accentColor : textColor }}
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
