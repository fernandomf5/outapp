import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { Lock, Image as ImageIcon, Video, FileText, Link as LinkIcon, MousePointer, Download, LogOut, Music, Code, HelpCircle, GitBranch, History, CheckSquare, Award, Radio, Brain, StickyNote, MessageSquare, Presentation } from "lucide-react";
import { toast } from "sonner";
import { CustomerHistoryTimeline } from "@/components/members-area/CustomerHistoryTimeline";

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
  blocks_layout: ('full' | 'half' | 'third')[]; // Define quantos blocos e suas larguras
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
}

export default function MembersAreaPublic() {
  const { slug } = useParams();
  const [area, setArea] = useState<MembersArea | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [loading, setLoading] = useState(true);

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

  const renderBlock = (block: ContentBlock) => {
    switch (block.type) {
      case 'text':
        return <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: block.content }} />;
      
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
            className="flex items-center gap-2 p-4 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
          >
            <FileText className="w-5 h-5" />
            <span>{block.title || 'Documento'}</span>
          </a>
        );
      
      case 'link':
        return (
          <a 
            href={block.content} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 p-4 bg-muted rounded-lg hover:bg-muted/80 transition-colors text-primary"
          >
            <LinkIcon className="w-5 h-5" />
            <span>{block.title || block.content}</span>
          </a>
        );
      
      case 'button':
        return (
          <a href={block.content} target="_blank" rel="noopener noreferrer">
            <Button className="w-full" size="lg">
              {block.title || 'Clique aqui'}
            </Button>
          </a>
        );
      
      case 'download':
        return (
          <a href={block.content} download>
            <Button className="w-full gap-2" size="lg" variant="outline">
              <Download className="w-5 h-5" />
              {block.title || 'Baixar Arquivo'}
            </Button>
          </a>
        );

      case 'audio':
        return (
          <div className="p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Music className="w-5 h-5" />
              <span className="font-medium">{block.title || 'Áudio'}</span>
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
            <div className="text-center py-8 text-muted-foreground">
              <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Cliente não selecionado</p>
            </div>
          );
        }
        return (
          <div className="space-y-4">
            {block.title && (
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <History className="w-5 h-5" />
                {block.title}
              </h3>
            )}
            <CustomerHistoryTimeline 
              customerId={block.customer_id} 
              primaryColor={area?.primary_color || '#8B5CF6'}
            />
          </div>
        );

      case 'notes':
        return (
          <div className="p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <StickyNote className="w-5 h-5" />
              <span className="font-medium">{block.title || 'Anotações'}</span>
            </div>
            <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: block.content }} />
          </div>
        );

      case 'faq':
        return (
          <div className="p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="w-5 h-5" />
              <span className="font-medium">{block.title || 'Perguntas Frequentes'}</span>
            </div>
            <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: block.content }} />
          </div>
        );

      case 'checklist':
        return (
          <div className="p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <CheckSquare className="w-5 h-5" />
              <span className="font-medium">{block.title || 'Checklist'}</span>
            </div>
            <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: block.content }} />
          </div>
        );
      
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  if (!area) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">Área de membros não encontrada</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isAuthenticated) {
    const primaryColor = area.primary_color || '#8B5CF6';
    const secondaryColor = area.secondary_color || '#EC4899';
    
    return (
      <div 
        className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4"
        style={{
          '--custom-primary': primaryColor,
          '--custom-secondary': secondaryColor,
        } as React.CSSProperties}
      >
        <style>{`
          [style*="--custom-primary"] .bg-primary {
            background-color: ${primaryColor} !important;
          }
          [style*="--custom-primary"] .text-primary {
            color: ${primaryColor} !important;
          }
          [style*="--custom-primary"] .bg-primary\\/10 {
            background-color: ${primaryColor}1a !important;
          }
        `}</style>
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            {area.logo_url && (
              <img 
                src={area.logo_url} 
                alt={area.name} 
                className="mx-auto mb-4 w-20 h-20 object-contain rounded-lg"
              />
            )}
            <div className="mx-auto mb-4 w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <Lock className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">{area.name}</CardTitle>
            <p className="text-muted-foreground">{area.description}</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="password">Digite a senha para acessar</Label>
                <Input
                  id="password"
                  type="password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handlePasswordSubmit()}
                  placeholder="Senha"
                  className="mt-1"
                />
              </div>
              <Button onClick={handlePasswordSubmit} className="w-full">
                Acessar Conteúdo
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Apply custom colors via CSS variables
  const primaryColor = area.primary_color || '#8B5CF6';
  const secondaryColor = area.secondary_color || '#EC4899';

  return (
    <div 
      className="min-h-screen bg-background"
      style={{
        '--custom-primary': primaryColor,
        '--custom-secondary': secondaryColor,
      } as React.CSSProperties}
    >
      <style>{`
        [style*="--custom-primary"] .gradient-primary {
          background: linear-gradient(135deg, ${primaryColor}, ${secondaryColor});
        }
        [style*="--custom-primary"] .bg-primary {
          background-color: ${primaryColor} !important;
        }
        [style*="--custom-primary"] .text-primary {
          color: ${primaryColor} !important;
        }
        [style*="--custom-primary"] .border-primary {
          border-color: ${primaryColor} !important;
        }
        [style*="--custom-primary"] .hover\\:bg-primary:hover {
          background-color: ${primaryColor} !important;
        }
        [style*="--custom-primary"] .from-primary\\/10 {
          --tw-gradient-from: ${primaryColor}1a !important;
        }
        [style*="--custom-primary"] .to-primary\\/5 {
          --tw-gradient-to: ${primaryColor}0d !important;
        }
      `}</style>
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 border-b">
        <div className="container mx-auto px-4 py-12">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            {area.logo_url && (
              <img 
                src={area.logo_url} 
                alt={area.name} 
                className="w-24 h-24 object-contain rounded-lg"
              />
            )}
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-4xl font-bold mb-2">{area.name}</h1>
              <p className="text-muted-foreground text-lg">{area.description}</p>
            </div>
            <Button onClick={handleLogout} variant="outline" className="gap-2">
              <LogOut className="w-4 h-4" />
              Sair
            </Button>
          </div>
        </div>
      </div>

      {/* Anchor Menu */}
      {area.sections.length > 0 && (
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b">
          <div className="container mx-auto px-4 py-3">
            <nav className="flex gap-4 overflow-x-auto">
              {area.sections.map((section) => (
                <a
                  key={section.id}
                  href={`#section-${section.id}`}
                  className="text-sm font-medium whitespace-nowrap hover:text-primary transition-colors"
                >
                  {section.title}
                </a>
              ))}
            </nav>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {area.sections.map((section) => (
            <Card key={section.id} id={`section-${section.id}`} className="scroll-mt-20">
              <CardHeader>
                <CardTitle className="text-2xl">{section.title}</CardTitle>
                {section.description && (
                  <p className="text-muted-foreground">{section.description}</p>
                )}
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                  {(section.blocks_layout || ['full']).map((layoutWidth, layoutIndex) => {
                    // Get blocks for this position
                    const blocksInPosition = section.blocks.filter(b => (b.block_position || 0) === layoutIndex);
                    
                    // Calculate column span based on layout
                    const colSpan = layoutWidth === 'full' ? 'md:col-span-12' :
                                  layoutWidth === 'half' ? 'md:col-span-6' :
                                  layoutWidth === 'third' ? 'md:col-span-4' : 'md:col-span-12';
                    
                    return (
                      <div key={layoutIndex} className={`col-span-1 ${colSpan} space-y-4`}>
                        {blocksInPosition.map((block) => (
                          <div key={block.id}>
                            {block.title && block.type !== 'button' && (
                              <h3 className="font-semibold mb-2">{block.title}</h3>
                            )}
                            {renderBlock(block)}
                          </div>
                        ))}
                        {blocksInPosition.length === 0 && (
                          <div className="text-center text-muted-foreground py-4 text-sm">
                            Bloco vazio
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {section.blocks.length === 0 && (
                    <div className="col-span-1 md:col-span-12">
                      <p className="text-center text-muted-foreground py-8">
                        Nenhum conteúdo disponível nesta seção
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}

          {area.sections.length === 0 && (
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-muted-foreground">Nenhuma seção disponível ainda</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}