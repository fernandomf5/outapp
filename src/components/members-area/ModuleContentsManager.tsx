import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Video, FileText, File, Trash2, Edit, Eye, EyeOff, Music, Image, Link2, Code, Download, HelpCircle, GitBranch, History } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ModuleContentEditor } from "./ModuleContentEditor";

interface ModuleContent {
  id: string;
  module_id: string;
  title: string;
  content_type: 'video' | 'document' | 'text' | 'audio' | 'image' | 'link' | 'embed' | 'download' | 'quiz' | 'timeline' | 'customer_history';
  video_url?: string;
  document_url?: string;
  content_data?: string;
  order_index: number;
  duration?: string;
  is_active: boolean;
}

interface ModuleContentsManagerProps {
  moduleId: string;
  moduleName: string;
}

export function ModuleContentsManager({ moduleId, moduleName }: ModuleContentsManagerProps) {
  const [contents, setContents] = useState<ModuleContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [editorOpen, setEditorOpen] = useState(false);
  const [selectedContent, setSelectedContent] = useState<ModuleContent | null>(null);

  useEffect(() => {
    loadContents();
  }, [moduleId]);

  const loadContents = async () => {
    try {
      const { data, error } = await supabase
        .from('members_area_module_contents')
        .select('*')
        .eq('module_id', moduleId)
        .order('order_index', { ascending: true });

      if (error) throw error;
      setContents((data as any) || []);
    } catch (error: any) {
      toast.error('Erro ao carregar conteúdos: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (content: ModuleContent) => {
    setSelectedContent(content);
    setEditorOpen(true);
  };

  const handleNew = () => {
    setSelectedContent(null);
    setEditorOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este conteúdo?')) return;

    try {
      const { error } = await supabase
        .from('members_area_module_contents')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Conteúdo excluído!');
      loadContents();
    } catch (error: any) {
      toast.error('Erro ao excluir: ' + error.message);
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('members_area_module_contents')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      toast.success(currentStatus ? 'Conteúdo ocultado' : 'Conteúdo ativado');
      loadContents();
    } catch (error: any) {
      toast.error('Erro ao atualizar: ' + error.message);
    }
  };

  const getContentIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <Video className="w-5 h-5" />;
      case 'document':
        return <File className="w-5 h-5" />;
      case 'text':
        return <FileText className="w-5 h-5" />;
      case 'audio':
        return <Music className="w-5 h-5" />;
      case 'image':
        return <Image className="w-5 h-5" />;
      case 'link':
        return <Link2 className="w-5 h-5" />;
      case 'embed':
        return <Code className="w-5 h-5" />;
      case 'download':
        return <Download className="w-5 h-5" />;
      case 'quiz':
        return <HelpCircle className="w-5 h-5" />;
      case 'timeline':
        return <GitBranch className="w-5 h-5" />;
      case 'customer_history':
        return <History className="w-5 h-5" />;
      default:
        return <FileText className="w-5 h-5" />;
    }
  };

  const getContentTypeName = (type: string) => {
    const types: Record<string, string> = {
      video: 'Vídeo',
      document: 'Documento',
      text: 'Texto',
      audio: 'Áudio',
      image: 'Imagem',
      link: 'Link Externo',
      embed: 'Embed',
      download: 'Download',
      quiz: 'Quiz',
      timeline: 'Linha do Tempo',
      customer_history: 'Histórico do Cliente'
    };
    return types[type] || type;
  };

  if (loading) {
    return <div className="text-center p-4">Carregando...</div>;
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Conteúdos do Módulo: {moduleName}</CardTitle>
              <CardDescription>
                Gerencie os conteúdos deste módulo (vídeos, textos, documentos)
              </CardDescription>
            </div>
            <Button onClick={handleNew} className="gradient-primary">
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Conteúdo
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {contents.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum conteúdo adicionado ainda</p>
              <Button onClick={handleNew} variant="outline" className="mt-4">
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Primeiro Conteúdo
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {contents.map((content) => (
                <Card key={content.id} className={!content.is_active ? 'opacity-60' : ''}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="text-primary">
                          {getContentIcon(content.content_type)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium">{content.title}</h4>
                            <Badge variant="secondary" className="text-xs">
                              {getContentTypeName(content.content_type)}
                            </Badge>
                            {!content.is_active && (
                              <Badge variant="outline" className="text-xs">
                                Oculto
                              </Badge>
                            )}
                          </div>
                          {content.duration && (
                            <p className="text-sm text-muted-foreground">
                              Duração: {content.duration}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            Ordem: {content.order_index}
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleToggleActive(content.id, content.is_active)}
                          variant="ghost"
                          size="sm"
                        >
                          {content.is_active ? (
                            <Eye className="w-4 h-4" />
                          ) : (
                            <EyeOff className="w-4 h-4" />
                          )}
                        </Button>
                        <Button
                          onClick={() => handleEdit(content)}
                          variant="ghost"
                          size="sm"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          onClick={() => handleDelete(content.id)}
                          variant="ghost"
                          size="sm"
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <ModuleContentEditor
        open={editorOpen}
        onOpenChange={setEditorOpen}
        moduleId={moduleId}
        content={selectedContent}
        onSave={loadContents}
      />
    </div>
  );
}