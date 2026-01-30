import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload, Video, File, Music, Image, Link2, Code, Download, HelpCircle, Plus, Trash2, GitBranch, GripVertical } from "lucide-react";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { Card } from "@/components/ui/card";

interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
}

interface TimelineItem {
  id: string;
  title: string;
  description: string;
  date: string;
  icon?: string;
}

interface ModuleContent {
  id?: string;
  module_id: string;
  title: string;
  content_type: 'video' | 'document' | 'text' | 'audio' | 'image' | 'link' | 'embed' | 'download' | 'quiz' | 'timeline';
  video_url?: string;
  document_url?: string;
  content_data?: string;
  order_index: number;
  duration?: string;
  is_active: boolean;
}

interface ModuleContentEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  moduleId: string;
  content?: ModuleContent | null;
  onSave: () => void;
}

export function ModuleContentEditor({ open, onOpenChange, moduleId, content, onSave }: ModuleContentEditorProps) {
  const [formData, setFormData] = useState<Partial<ModuleContent>>({
    module_id: moduleId,
    title: '',
    content_type: 'video',
    is_active: true,
    order_index: 0,
  });
  const [uploading, setUploading] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [timelineItems, setTimelineItems] = useState<TimelineItem[]>([]);

  useEffect(() => {
    if (content) {
      setFormData(content);
      // Parse quiz questions if exists
      if (content.content_type === 'quiz' && content.content_data) {
        try {
          setQuizQuestions(JSON.parse(content.content_data));
        } catch {
          setQuizQuestions([]);
        }
      }
      // Parse timeline items if exists
      if (content.content_type === 'timeline' && content.content_data) {
        try {
          setTimelineItems(JSON.parse(content.content_data));
        } catch {
          setTimelineItems([]);
        }
      }
    } else {
      setFormData({
        module_id: moduleId,
        title: '',
        content_type: 'video',
        is_active: true,
        order_index: 0,
      });
      setQuizQuestions([]);
      setTimelineItems([]);
    }
  }, [content, moduleId]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'video' | 'audio' | 'image' | 'document' | 'download') => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file types
    const validTypes: Record<string, string[]> = {
      video: ['video/'],
      audio: ['audio/'],
      image: ['image/'],
      document: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
      download: [] // Accept all for downloads
    };

    const typeCheck = validTypes[type];
    if (typeCheck.length > 0) {
      const isValid = typeCheck.some(t => file.type.startsWith(t) || file.type === t);
      if (!isValid) {
        toast.error(`Tipo de arquivo inválido para ${type}`);
        return;
      }
    }

    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const fileExt = file.name.split('.').pop();
      const folder = type === 'video' ? '' : type === 'document' ? 'docs/' : type === 'audio' ? 'audio/' : type === 'image' ? 'images/' : 'downloads/';
      const fileName = `${user.id}/${moduleId}/${folder}${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('members-content')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('members-content')
        .getPublicUrl(fileName);

      if (type === 'video') {
        setFormData(prev => ({ ...prev, video_url: publicUrl }));
      } else if (type === 'document' || type === 'download') {
        setFormData(prev => ({ ...prev, document_url: publicUrl }));
      } else {
        setFormData(prev => ({ ...prev, content_data: publicUrl }));
      }
      
      toast.success('Arquivo enviado com sucesso!');
    } catch (error: any) {
      toast.error('Erro ao enviar arquivo: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const addQuizQuestion = () => {
    setQuizQuestions([...quizQuestions, { question: '', options: ['', '', '', ''], correctIndex: 0 }]);
  };

  const updateQuizQuestion = (index: number, field: keyof QuizQuestion, value: any) => {
    const updated = [...quizQuestions];
    updated[index] = { ...updated[index], [field]: value };
    setQuizQuestions(updated);
  };

  const updateQuizOption = (qIndex: number, oIndex: number, value: string) => {
    const updated = [...quizQuestions];
    updated[qIndex].options[oIndex] = value;
    setQuizQuestions(updated);
  };

  const removeQuizQuestion = (index: number) => {
    setQuizQuestions(quizQuestions.filter((_, i) => i !== index));
  };

  // Timeline functions
  const addTimelineItem = () => {
    setTimelineItems([...timelineItems, { 
      id: crypto.randomUUID(), 
      title: '', 
      description: '', 
      date: '',
      icon: 'check'
    }]);
  };

  const updateTimelineItem = (id: string, field: keyof TimelineItem, value: string) => {
    setTimelineItems(timelineItems.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const removeTimelineItem = (id: string) => {
    setTimelineItems(timelineItems.filter(item => item.id !== id));
  };

  const moveTimelineItem = (index: number, direction: 'up' | 'down') => {
    const newItems = [...timelineItems];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= newItems.length) return;
    [newItems[index], newItems[newIndex]] = [newItems[newIndex], newItems[index]];
    setTimelineItems(newItems);
  };

  const handleSave = async () => {
    if (!formData.title) {
      toast.error('Digite o título do conteúdo');
      return;
    }

    // Prepare data
    const dataToSave = { ...formData };
    if (formData.content_type === 'quiz') {
      dataToSave.content_data = JSON.stringify(quizQuestions);
    }
    if (formData.content_type === 'timeline') {
      dataToSave.content_data = JSON.stringify(timelineItems);
    }

    try {
      if (content?.id) {
        const { error } = await supabase
          .from('members_area_module_contents')
          .update(dataToSave as any)
          .eq('id', content.id);
        if (error) throw error;
        toast.success('Conteúdo atualizado!');
      } else {
        const { error } = await supabase
          .from('members_area_module_contents')
          .insert([dataToSave as any]);
        if (error) throw error;
        toast.success('Conteúdo criado!');
      }
      onSave();
      onOpenChange(false);
    } catch (error: any) {
      toast.error('Erro ao salvar conteúdo: ' + error.message);
    }
  };

  const contentTypes = [
    { value: 'video', label: 'Vídeo', icon: Video },
    { value: 'audio', label: 'Áudio/Podcast', icon: Music },
    { value: 'document', label: 'Documento (PDF/Word)', icon: File },
    { value: 'text', label: 'Texto/Artigo', icon: File },
    { value: 'image', label: 'Imagem/Galeria', icon: Image },
    { value: 'link', label: 'Link Externo', icon: Link2 },
    { value: 'embed', label: 'Embed (HTML/Iframe)', icon: Code },
    { value: 'download', label: 'Arquivo para Download', icon: Download },
    { value: 'quiz', label: 'Quiz/Questionário', icon: HelpCircle },
    { value: 'timeline', label: 'Linha do Tempo', icon: GitBranch },
  ];

  const timelineIcons = [
    { value: 'check', label: '✓ Concluído' },
    { value: 'star', label: '⭐ Destaque' },
    { value: 'rocket', label: '🚀 Lançamento' },
    { value: 'trophy', label: '🏆 Conquista' },
    { value: 'lightbulb', label: '💡 Ideia' },
    { value: 'calendar', label: '📅 Evento' },
    { value: 'milestone', label: '🎯 Marco' },
    { value: 'update', label: '🔄 Atualização' },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{content ? 'Editar Conteúdo' : 'Novo Conteúdo'}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label>Tipo de Conteúdo</Label>
            <Select 
              value={formData.content_type} 
              onValueChange={(value: any) => setFormData({...formData, content_type: value})}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {contentTypes.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="flex items-center gap-2">
                      <type.icon className="w-4 h-4" />
                      {type.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>Título</Label>
            <Input 
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              placeholder="Nome do conteúdo"
            />
          </div>

          {/* VIDEO */}
          {formData.content_type === 'video' && (
            <div className="grid gap-2">
              <Label>Vídeo</Label>
              <div className="border-2 border-dashed rounded-lg p-6 text-center">
                {formData.video_url ? (
                  <div className="space-y-2">
                    <Video className="w-12 h-12 mx-auto text-primary" />
                    <p className="text-sm text-muted-foreground">Vídeo configurado</p>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setFormData({...formData, video_url: undefined})}
                    >
                      Substituir
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="w-12 h-12 mx-auto text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      {uploading ? 'Enviando...' : 'Clique para enviar vídeo'}
                    </p>
                    <Input 
                      type="file" 
                      accept="video/*"
                      onChange={(e) => handleFileUpload(e, 'video')}
                      disabled={uploading}
                      className="max-w-xs mx-auto"
                    />
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Ou cole a URL do vídeo (YouTube, Vimeo, etc.)
              </p>
              <Input
                value={formData.video_url || ''}
                onChange={(e) => setFormData({...formData, video_url: e.target.value})}
                placeholder="https://youtube.com/watch?v=..."
              />
            </div>
          )}

          {/* AUDIO */}
          {formData.content_type === 'audio' && (
            <div className="grid gap-2">
              <Label>Áudio/Podcast</Label>
              <div className="border-2 border-dashed rounded-lg p-6 text-center">
                {formData.content_data ? (
                  <div className="space-y-2">
                    <Music className="w-12 h-12 mx-auto text-primary" />
                    <p className="text-sm text-muted-foreground">Áudio configurado</p>
                    <audio controls src={formData.content_data} className="mx-auto mt-2" />
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setFormData({...formData, content_data: undefined})}
                    >
                      Substituir
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="w-12 h-12 mx-auto text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      {uploading ? 'Enviando...' : 'Clique para enviar áudio (MP3, WAV, etc.)'}
                    </p>
                    <Input 
                      type="file" 
                      accept="audio/*"
                      onChange={(e) => handleFileUpload(e, 'audio')}
                      disabled={uploading}
                      className="max-w-xs mx-auto"
                    />
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Ou cole a URL do áudio (Spotify, SoundCloud, etc.)
              </p>
              <Input
                value={formData.content_data || ''}
                onChange={(e) => setFormData({...formData, content_data: e.target.value})}
                placeholder="https://open.spotify.com/episode/..."
              />
            </div>
          )}

          {/* DOCUMENT */}
          {formData.content_type === 'document' && (
            <div className="grid gap-2">
              <Label>Documento (PDF, Word)</Label>
              <div className="border-2 border-dashed rounded-lg p-6 text-center">
                {formData.document_url ? (
                  <div className="space-y-2">
                    <File className="w-12 h-12 mx-auto text-primary" />
                    <p className="text-sm text-muted-foreground">Documento enviado</p>
                    <div className="flex gap-2 justify-center">
                      <Button variant="outline" size="sm" asChild>
                        <a href={formData.document_url} target="_blank" rel="noopener noreferrer">
                          Ver Documento
                        </a>
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setFormData({...formData, document_url: undefined})}
                      >
                        Substituir
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="w-12 h-12 mx-auto text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      {uploading ? 'Enviando...' : 'Clique para enviar documento'}
                    </p>
                    <Input 
                      type="file" 
                      accept=".pdf,.doc,.docx"
                      onChange={(e) => handleFileUpload(e, 'document')}
                      disabled={uploading}
                      className="max-w-xs mx-auto"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TEXT */}
          {formData.content_type === 'text' && (
            <div className="grid gap-2">
              <Label>Conteúdo</Label>
              <RichTextEditor 
                value={formData.content_data || ''}
                onChange={(value) => setFormData({...formData, content_data: value})}
              />
            </div>
          )}

          {/* IMAGE */}
          {formData.content_type === 'image' && (
            <div className="grid gap-2">
              <Label>Imagem</Label>
              <div className="border-2 border-dashed rounded-lg p-6 text-center">
                {formData.content_data ? (
                  <div className="space-y-2">
                    <img src={formData.content_data} alt="Preview" className="max-h-48 mx-auto rounded-lg" />
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setFormData({...formData, content_data: undefined})}
                    >
                      Substituir
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Image className="w-12 h-12 mx-auto text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      {uploading ? 'Enviando...' : 'Clique para enviar imagem'}
                    </p>
                    <Input 
                      type="file" 
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, 'image')}
                      disabled={uploading}
                      className="max-w-xs mx-auto"
                    />
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Ou cole a URL da imagem
              </p>
              <Input
                value={formData.content_data || ''}
                onChange={(e) => setFormData({...formData, content_data: e.target.value})}
                placeholder="https://exemplo.com/imagem.jpg"
              />
              <div className="mt-2">
                <Label>Descrição da Imagem</Label>
                <Textarea
                  value={formData.document_url || ''}
                  onChange={(e) => setFormData({...formData, document_url: e.target.value})}
                  placeholder="Descreva a imagem ou adicione legenda..."
                  rows={2}
                />
              </div>
            </div>
          )}

          {/* LINK */}
          {formData.content_type === 'link' && (
            <div className="grid gap-2">
              <Label>URL do Link</Label>
              <Input
                value={formData.video_url || ''}
                onChange={(e) => setFormData({...formData, video_url: e.target.value})}
                placeholder="https://exemplo.com/recurso"
              />
              <div className="mt-2">
                <Label>Descrição do Link</Label>
                <Textarea
                  value={formData.content_data || ''}
                  onChange={(e) => setFormData({...formData, content_data: e.target.value})}
                  placeholder="Descreva para onde o link leva..."
                  rows={2}
                />
              </div>
              <div className="flex items-center gap-2 mt-2">
                <Switch 
                  checked={formData.document_url === 'new_tab'}
                  onCheckedChange={(checked) => setFormData({...formData, document_url: checked ? 'new_tab' : 'same_tab'})}
                />
                <Label className="text-sm">Abrir em nova aba</Label>
              </div>
            </div>
          )}

          {/* EMBED */}
          {formData.content_type === 'embed' && (
            <div className="grid gap-2">
              <Label>Código Embed (HTML/Iframe)</Label>
              <Textarea
                value={formData.content_data || ''}
                onChange={(e) => setFormData({...formData, content_data: e.target.value})}
                placeholder='<iframe src="..." width="100%" height="400"></iframe>'
                rows={6}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Cole o código embed de serviços como Google Maps, Calendly, Typeform, etc.
              </p>
            </div>
          )}

          {/* DOWNLOAD */}
          {formData.content_type === 'download' && (
            <div className="grid gap-2">
              <Label>Arquivo para Download</Label>
              <div className="border-2 border-dashed rounded-lg p-6 text-center">
                {formData.document_url ? (
                  <div className="space-y-2">
                    <Download className="w-12 h-12 mx-auto text-primary" />
                    <p className="text-sm text-muted-foreground">Arquivo configurado</p>
                    <div className="flex gap-2 justify-center">
                      <Button variant="outline" size="sm" asChild>
                        <a href={formData.document_url} target="_blank" rel="noopener noreferrer">
                          Baixar
                        </a>
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setFormData({...formData, document_url: undefined})}
                      >
                        Substituir
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="w-12 h-12 mx-auto text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      {uploading ? 'Enviando...' : 'Clique para enviar arquivo (qualquer tipo)'}
                    </p>
                    <Input 
                      type="file" 
                      onChange={(e) => handleFileUpload(e, 'download')}
                      disabled={uploading}
                      className="max-w-xs mx-auto"
                    />
                  </div>
                )}
              </div>
              <div className="mt-2">
                <Label>Descrição do Arquivo</Label>
                <Textarea
                  value={formData.content_data || ''}
                  onChange={(e) => setFormData({...formData, content_data: e.target.value})}
                  placeholder="Descreva o conteúdo do arquivo..."
                  rows={2}
                />
              </div>
            </div>
          )}

          {/* QUIZ */}
          {formData.content_type === 'quiz' && (
            <div className="grid gap-4">
              <div className="flex items-center justify-between">
                <Label>Perguntas do Quiz</Label>
                <Button onClick={addQuizQuestion} size="sm" variant="outline">
                  <Plus className="w-4 h-4 mr-1" />
                  Adicionar Pergunta
                </Button>
              </div>
              
              {quizQuestions.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed rounded-lg">
                  <HelpCircle className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">Nenhuma pergunta adicionada</p>
                  <Button onClick={addQuizQuestion} size="sm" variant="outline" className="mt-2">
                    <Plus className="w-4 h-4 mr-1" />
                    Adicionar Primeira Pergunta
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {quizQuestions.map((q, qIndex) => (
                    <Card key={qIndex} className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <Label className="text-sm font-medium">Pergunta {qIndex + 1}</Label>
                        <Button 
                          onClick={() => removeQuizQuestion(qIndex)} 
                          size="sm" 
                          variant="ghost"
                          className="h-8 w-8 p-0"
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                      <Input
                        value={q.question}
                        onChange={(e) => updateQuizQuestion(qIndex, 'question', e.target.value)}
                        placeholder="Digite a pergunta..."
                        className="mb-3"
                      />
                      <div className="space-y-2">
                        {q.options.map((opt, oIndex) => (
                          <div key={oIndex} className="flex items-center gap-2">
                            <input
                              type="radio"
                              name={`correct-${qIndex}`}
                              checked={q.correctIndex === oIndex}
                              onChange={() => updateQuizQuestion(qIndex, 'correctIndex', oIndex)}
                              className="w-4 h-4"
                            />
                            <Input
                              value={opt}
                              onChange={(e) => updateQuizOption(qIndex, oIndex, e.target.value)}
                              placeholder={`Opção ${oIndex + 1}`}
                              className="flex-1"
                            />
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        Selecione o círculo ao lado da resposta correta
                      </p>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TIMELINE */}
          {formData.content_type === 'timeline' && (
            <div className="grid gap-4">
              <div className="flex items-center justify-between">
                <Label>Itens da Linha do Tempo</Label>
                <Button onClick={addTimelineItem} size="sm" variant="outline">
                  <Plus className="w-4 h-4 mr-1" />
                  Adicionar Item
                </Button>
              </div>
              
              {timelineItems.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed rounded-lg">
                  <GitBranch className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">Nenhum item na linha do tempo</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Adicione marcos, eventos ou etapas concluídas
                  </p>
                  <Button onClick={addTimelineItem} size="sm" variant="outline" className="mt-3">
                    <Plus className="w-4 h-4 mr-1" />
                    Adicionar Primeiro Item
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {timelineItems.map((item, index) => (
                    <Card key={item.id} className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex flex-col gap-1 mt-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-6 w-6 p-0"
                            onClick={() => moveTimelineItem(index, 'up')}
                            disabled={index === 0}
                          >
                            ▲
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-6 w-6 p-0"
                            onClick={() => moveTimelineItem(index, 'down')}
                            disabled={index === timelineItems.length - 1}
                          >
                            ▼
                          </Button>
                        </div>
                        
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold shrink-0">
                          {index + 1}
                        </div>
                        
                        <div className="flex-1 space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <Input
                              value={item.title}
                              onChange={(e) => updateTimelineItem(item.id, 'title', e.target.value)}
                              placeholder="Título do marco/etapa"
                            />
                            <Input
                              value={item.date}
                              onChange={(e) => updateTimelineItem(item.id, 'date', e.target.value)}
                              placeholder="Data (ex: Jan 2024, Semana 1)"
                            />
                          </div>
                          
                          <Textarea
                            value={item.description}
                            onChange={(e) => updateTimelineItem(item.id, 'description', e.target.value)}
                            placeholder="Descrição do que foi realizado ou entregue..."
                            rows={2}
                          />
                          
                          <Select 
                            value={item.icon || 'check'} 
                            onValueChange={(value) => updateTimelineItem(item.id, 'icon', value)}
                          >
                            <SelectTrigger className="w-[200px]">
                              <SelectValue placeholder="Ícone" />
                            </SelectTrigger>
                            <SelectContent>
                              {timelineIcons.map(icon => (
                                <SelectItem key={icon.value} value={icon.value}>
                                  {icon.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <Button 
                          onClick={() => removeTimelineItem(item.id)} 
                          size="sm" 
                          variant="ghost"
                          className="h-8 w-8 p-0"
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
              
              <p className="text-xs text-muted-foreground">
                💡 Use para mostrar progresso do curso, histórico de atualizações, marcos alcançados ou etapas de um projeto.
              </p>
            </div>
          )}

          <div className="grid gap-2">
            <Label>Duração (opcional)</Label>
            <Input 
              value={formData.duration || ''}
              onChange={(e) => setFormData({...formData, duration: e.target.value})}
              placeholder="Ex: 10:30"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center justify-between">
              <Label>Publicado</Label>
              <Switch 
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({...formData, is_active: checked})}
              />
            </div>
            <div className="grid gap-2">
              <Label>Ordem de Exibição</Label>
              <Input 
                type="number"
                value={formData.order_index || 0}
                onChange={(e) => setFormData({...formData, order_index: parseInt(e.target.value)})}
                placeholder="0"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} className="gradient-primary">
            {content ? 'Atualizar' : 'Criar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
