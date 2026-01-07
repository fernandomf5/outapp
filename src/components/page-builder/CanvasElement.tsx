import { useState, useRef, useEffect } from "react";
import { useDroppable } from "@dnd-kit/core";
import { BuilderElement } from "@/pages/PageBuilder";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Trash2, Copy, GripVertical, 
  Image as ImageIcon, Video, Link2, Settings, X,
  Type, AlignLeft, AlignCenter, AlignRight, Palette,
  Upload
} from "lucide-react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CanvasElementProps {
  element: BuilderElement;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (element: BuilderElement) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  isPreview: boolean;
  viewMode: 'desktop' | 'tablet' | 'mobile';
  depth: number;
}

export const CanvasElement = ({
  element,
  isSelected,
  onSelect,
  onUpdate,
  onDelete,
  onDuplicate,
  isPreview,
  viewMode,
  depth
}: CanvasElementProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showQuickEdit, setShowQuickEdit] = useState(false);
  const [editValue, setEditValue] = useState("");
  const [uploading, setUploading] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const { setNodeRef, isOver } = useDroppable({
    id: element.id,
    data: {
      type: element.type,
      accepts: getAcceptedTypes(element.type)
    }
  });

  const canHaveChildren = ['section', 'row', 'column'].includes(element.type);
  const isTextEditable = ['heading', 'text', 'button'].includes(element.type);
  const isImageElement = element.type === 'image';
  const isVideoElement = element.type === 'video';
  const isLinkableElement = ['button', 'image'].includes(element.type);

  // Sync edit value when element changes
  useEffect(() => {
    if (isImageElement) {
      setEditValue(element.settings?.src || '');
    } else if (isVideoElement) {
      setEditValue(element.settings?.src || '');
    } else if (isTextEditable) {
      setEditValue(element.content);
    }
  }, [element, isImageElement, isVideoElement, isTextEditable]);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect();
    
    // Show quick edit for images and videos on click
    if ((isImageElement || isVideoElement) && !isPreview) {
      setShowQuickEdit(true);
    }
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isTextEditable && !isPreview) {
      setIsEditing(true);
      setEditValue(element.content);
    }
  };

  const handleBlur = () => {
    if (isEditing && contentRef.current) {
      onUpdate({
        ...element,
        content: contentRef.current.innerHTML
      });
      setIsEditing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsEditing(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `builder-images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('media')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('media')
        .getPublicUrl(filePath);

      onUpdate({
        ...element,
        settings: { ...element.settings, src: urlData.publicUrl }
      });

      toast({ title: "Imagem atualizada!" });
      setShowQuickEdit(false);
    } catch (error: any) {
      toast({ 
        title: "Erro no upload", 
        description: error.message,
        variant: "destructive" 
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSrcUpdate = () => {
    if (isImageElement) {
      onUpdate({
        ...element,
        settings: { ...element.settings, src: editValue }
      });
    } else if (isVideoElement) {
      onUpdate({
        ...element,
        settings: { ...element.settings, src: editValue }
      });
    }
    setShowQuickEdit(false);
    toast({ title: "Atualizado!" });
  };

  const handleStyleChange = (key: string, value: string) => {
    onUpdate({
      ...element,
      styles: { ...element.styles, [key]: value }
    });
  };

  const renderQuickEditToolbar = () => {
    if (isPreview || !isSelected) return null;

    return (
      <div className="absolute -top-12 left-0 right-0 flex items-center justify-center z-20">
        <div className="flex items-center gap-1 bg-background border shadow-lg rounded-lg px-2 py-1">
          <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
          <span className="text-xs font-medium capitalize px-2 border-r">{element.type}</span>
          
          {/* Text alignment for text elements */}
          {isTextEditable && (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => handleStyleChange('textAlign', 'left')}
                title="Alinhar à esquerda"
              >
                <AlignLeft className="w-3.5 h-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => handleStyleChange('textAlign', 'center')}
                title="Centralizar"
              >
                <AlignCenter className="w-3.5 h-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => handleStyleChange('textAlign', 'right')}
                title="Alinhar à direita"
              >
                <AlignRight className="w-3.5 h-3.5" />
              </Button>
              <div className="w-px h-5 bg-border" />
            </>
          )}

          {/* Image controls */}
          {isImageElement && (
            <>
              <Popover open={showQuickEdit} onOpenChange={setShowQuickEdit}>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    title="Alterar imagem"
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80" align="center">
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm">Alterar Imagem</h4>
                    
                    <div className="flex gap-2">
                      <Input
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        placeholder="URL da imagem"
                        className="flex-1"
                      />
                      <Button size="sm" onClick={handleSrcUpdate}>
                        OK
                      </Button>
                    </div>

                    <div className="text-center text-xs text-muted-foreground">ou</div>

                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {uploading ? "Enviando..." : "Fazer Upload"}
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                    />
                  </div>
                </PopoverContent>
              </Popover>
              <div className="w-px h-5 bg-border" />
            </>
          )}

          {/* Video controls */}
          {isVideoElement && (
            <>
              <Popover open={showQuickEdit} onOpenChange={setShowQuickEdit}>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    title="Alterar vídeo"
                  >
                    <Video className="w-3.5 h-3.5" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80" align="center">
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm">Alterar Vídeo</h4>
                    <div className="flex gap-2">
                      <Input
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        placeholder="URL do YouTube ou vídeo"
                        className="flex-1"
                      />
                      <Button size="sm" onClick={handleSrcUpdate}>
                        OK
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
              <div className="w-px h-5 bg-border" />
            </>
          )}

          {/* Link editor for buttons */}
          {isLinkableElement && (
            <>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    title="Editar link"
                  >
                    <Link2 className="w-3.5 h-3.5" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-72" align="center">
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm">Link</h4>
                    <Input
                      value={element.settings?.link || ''}
                      onChange={(e) => onUpdate({
                        ...element,
                        settings: { ...element.settings, link: e.target.value }
                      })}
                      placeholder="https://exemplo.com"
                    />
                  </div>
                </PopoverContent>
              </Popover>
              <div className="w-px h-5 bg-border" />
            </>
          )}

          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={(e) => { e.stopPropagation(); onDuplicate(); }}
            title="Duplicar"
          >
            <Copy className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-destructive hover:text-destructive"
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            title="Excluir"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    const styles = element.styles || {};

    switch (element.type) {
      case 'heading':
      case 'text':
        return (
          <div
            ref={contentRef}
            contentEditable={isEditing}
            suppressContentEditableWarning
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className={`outline-none min-h-[24px] ${isEditing ? 'ring-2 ring-primary bg-primary/5 p-2 rounded' : ''}`}
            style={styles}
            dangerouslySetInnerHTML={{ __html: element.content }}
          />
        );

      case 'image':
        const imgSrc = element.settings?.src || 'https://via.placeholder.com/800x400?text=Clique+para+alterar';
        return (
          <div className="relative group/image">
            <img
              src={imgSrc}
              alt={element.settings?.alt || 'Imagem'}
              style={styles}
              className="max-w-full h-auto cursor-pointer"
            />
            {!isPreview && (
              <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover/image:opacity-100">
                <div className="bg-background/90 rounded-lg px-3 py-2 text-sm font-medium">
                  Clique para editar
                </div>
              </div>
            )}
          </div>
        );

      case 'video':
        const videoSrc = element.settings?.src || '';
        if (!videoSrc && !isPreview) {
          return (
            <div 
              className="w-full aspect-video bg-muted flex items-center justify-center cursor-pointer rounded-lg border-2 border-dashed border-muted-foreground/30"
              onClick={() => setShowQuickEdit(true)}
            >
              <div className="text-center">
                <Video className="w-12 h-12 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Clique para adicionar vídeo</p>
              </div>
            </div>
          );
        }
        
        if (element.settings?.type === 'youtube' && videoSrc) {
          const videoId = videoSrc.includes('youtu.be') 
            ? videoSrc.split('/').pop()?.split('?')[0]
            : videoSrc.includes('youtube.com') 
              ? new URLSearchParams(new URL(videoSrc).search).get('v')
              : videoSrc;
          return (
            <iframe
              src={`https://www.youtube.com/embed/${videoId}`}
              style={styles}
              className="w-full aspect-video rounded-lg"
              frameBorder="0"
              allowFullScreen
            />
          );
        }
        return (
          <video
            src={videoSrc}
            style={styles}
            controls
            className="w-full rounded-lg"
          />
        );

      case 'button':
        return (
          <div
            ref={contentRef}
            contentEditable={isEditing}
            suppressContentEditableWarning
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            style={styles}
            className={`inline-block cursor-pointer ${isEditing ? 'ring-2 ring-primary' : ''}`}
          >
            {element.content}
          </div>
        );

      case 'spacer':
        return (
          <div 
            style={{ height: styles.height || '40px' }} 
            className="bg-muted/30 flex items-center justify-center border-2 border-dashed border-muted-foreground/20 rounded"
          >
            {!isPreview && (
              <span className="text-xs text-muted-foreground">Espaçador ({styles.height || '40px'})</span>
            )}
          </div>
        );

      case 'divider':
        return <hr style={styles} className="border-t-2" />;

      case 'icon':
        return (
          <div style={styles} className="flex items-center justify-center">
            <span style={{ fontSize: styles.fontSize || '48px' }}>{element.content || '⭐'}</span>
          </div>
        );

      case 'html':
        return (
          <div 
            dangerouslySetInnerHTML={{ __html: element.content }} 
            style={styles}
            className="html-content"
          />
        );

      case 'countdown':
        return (
          <div style={styles} className="text-center">
            <p className="text-sm mb-2">{element.settings?.message || 'Oferta termina em:'}</p>
            <div className="flex gap-4 justify-center">
              {['Dias', 'Horas', 'Min', 'Seg'].map((label) => (
                <div key={label} className="text-center">
                  <div className="text-3xl font-bold bg-muted px-4 py-2 rounded-lg">00</div>
                  <span className="text-xs text-muted-foreground">{label}</span>
                </div>
              ))}
            </div>
          </div>
        );

      case 'testimonial':
        return (
          <div style={styles}>
            <div className="flex gap-1 mb-3">
              {Array.from({ length: element.settings?.rating || 5 }).map((_, i) => (
                <span key={i} className="text-yellow-500">★</span>
              ))}
            </div>
            <p className="italic mb-4">"{element.content}"</p>
            <p className="font-semibold">{element.settings?.author || 'Cliente'}</p>
          </div>
        );

      case 'pricing':
        return (
          <div style={styles} className="text-center">
            <div className="text-4xl font-bold mb-2">
              {element.settings?.currency || 'R$'}{element.settings?.price || '97'}
              <span className="text-lg font-normal text-muted-foreground">{element.settings?.period || '/mês'}</span>
            </div>
            <ul className="text-left space-y-2 mb-6">
              {(element.settings?.features || ['Recurso 1', 'Recurso 2']).map((feature: string, i: number) => (
                <li key={i} className="flex items-center gap-2">
                  <span className="text-green-500">✓</span> {feature}
                </li>
              ))}
            </ul>
            <button className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-semibold">
              {element.settings?.buttonText || 'Assinar Agora'}
            </button>
          </div>
        );

      case 'faq':
        return (
          <div style={styles} className="space-y-3">
            {(element.settings?.items || [{ question: 'Pergunta?', answer: 'Resposta.' }]).map((item: any, i: number) => (
              <div key={i} className="border rounded-lg p-4">
                <p className="font-semibold mb-2">{item.question}</p>
                <p className="text-muted-foreground">{item.answer}</p>
              </div>
            ))}
          </div>
        );

      case 'section':
      case 'row':
      case 'column':
        return null;

      default:
        return <div style={styles}>{element.content}</div>;
    }
  };

  const wrapperClasses = `
    relative group transition-all
    ${!isPreview && !isSelected ? 'hover:outline hover:outline-2 hover:outline-dashed hover:outline-primary/50' : ''}
    ${isSelected && !isPreview ? 'outline outline-2 outline-primary' : ''}
    ${isOver && canHaveChildren ? 'ring-2 ring-primary ring-inset bg-primary/5' : ''}
  `;

  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <div
          ref={canHaveChildren ? setNodeRef : undefined}
          className={wrapperClasses}
          style={element.styles}
          onClick={handleClick}
          onDoubleClick={handleDoubleClick}
        >
          {/* Quick Edit Toolbar */}
          {renderQuickEditToolbar()}

          {/* Element Content */}
          {renderContent()}

          {/* Children (for container elements) */}
          {canHaveChildren && element.children && element.children.length > 0 && (
            <div className={element.type === 'row' ? 'flex flex-wrap gap-4' : ''}>
              {element.children.map((child) => (
                <CanvasElement
                  key={child.id}
                  element={child}
                  isSelected={false}
                  onSelect={onSelect}
                  onUpdate={onUpdate}
                  onDelete={onDelete}
                  onDuplicate={onDuplicate}
                  isPreview={isPreview}
                  viewMode={viewMode}
                  depth={depth + 1}
                />
              ))}
            </div>
          )}

          {/* Empty container placeholder */}
          {canHaveChildren && (!element.children || element.children.length === 0) && !isPreview && (
            <div className="min-h-[80px] flex items-center justify-center border-2 border-dashed border-muted-foreground/30 rounded-lg m-2">
              <p className="text-sm text-muted-foreground">
                Arraste elementos aqui
              </p>
            </div>
          )}
        </div>
      </ContextMenuTrigger>
      
      <ContextMenuContent>
        <ContextMenuItem onClick={onDuplicate}>
          <Copy className="w-4 h-4 mr-2" />
          Duplicar
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onClick={onDelete} className="text-destructive">
          <Trash2 className="w-4 h-4 mr-2" />
          Excluir
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
};

function getAcceptedTypes(type: string): string[] {
  switch (type) {
    case 'section':
      return ['row', 'heading', 'text', 'image', 'video', 'button', 'spacer', 'divider', 'html', 'icon', 'countdown', 'testimonial', 'pricing', 'faq', 'gallery', 'map', 'social', 'form'];
    case 'row':
      return ['column'];
    case 'column':
      return ['heading', 'text', 'image', 'video', 'button', 'spacer', 'divider', 'html', 'icon', 'countdown', 'testimonial', 'pricing', 'faq', 'gallery', 'map', 'social', 'form'];
    default:
      return [];
  }
}
