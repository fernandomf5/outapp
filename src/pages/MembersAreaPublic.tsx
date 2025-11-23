import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { Lock, Image as ImageIcon, Video, FileText, Link as LinkIcon, MousePointer } from "lucide-react";
import { toast } from "sonner";

interface ContentBlock {
  id: string;
  type: 'image' | 'video' | 'document' | 'link' | 'button' | 'text';
  content: string;
  title?: string;
  order_index: number;
}

interface Section {
  id: string;
  title: string;
  description?: string;
  order_index: number;
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
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
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

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 border-b">
        <div className="container mx-auto px-4 py-12">
          <h1 className="text-4xl font-bold mb-2">{area.name}</h1>
          <p className="text-muted-foreground text-lg">{area.description}</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {area.sections.map((section) => (
            <Card key={section.id}>
              <CardHeader>
                <CardTitle className="text-2xl">{section.title}</CardTitle>
                {section.description && (
                  <p className="text-muted-foreground">{section.description}</p>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {section.blocks.map((block) => (
                    <div key={block.id}>
                      {block.title && block.type !== 'button' && (
                        <h3 className="font-semibold mb-2">{block.title}</h3>
                      )}
                      {renderBlock(block)}
                    </div>
                  ))}
                  {section.blocks.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">
                      Nenhum conteúdo disponível nesta seção
                    </p>
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