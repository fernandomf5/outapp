import { useState, useRef } from "react";
import { useDroppable } from "@dnd-kit/core";
import { BuilderElement } from "@/pages/PageBuilder";
import { Button } from "@/components/ui/button";
import { 
  Trash2, Copy, Move, GripVertical, 
  ChevronUp, ChevronDown, Settings 
} from "lucide-react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";

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
  const contentRef = useRef<HTMLDivElement>(null);

  const { setNodeRef, isOver } = useDroppable({
    id: element.id,
    data: {
      type: element.type,
      accepts: getAcceptedTypes(element.type)
    }
  });

  const canHaveChildren = ['section', 'row', 'column'].includes(element.type);

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (['heading', 'text', 'button'].includes(element.type) && !isPreview) {
      setIsEditing(true);
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
            className={`outline-none ${isEditing ? 'ring-2 ring-primary' : ''}`}
            style={styles}
            dangerouslySetInnerHTML={{ __html: element.content }}
          />
        );

      case 'image':
        return (
          <img
            src={element.settings?.src || 'https://via.placeholder.com/800x400'}
            alt={element.settings?.alt || 'Imagem'}
            style={styles}
            className="max-w-full h-auto"
          />
        );

      case 'video':
        const videoSrc = element.settings?.src || '';
        if (element.settings?.type === 'youtube' && videoSrc) {
          const videoId = videoSrc.includes('youtu.be') 
            ? videoSrc.split('/').pop()?.split('?')[0]
            : new URLSearchParams(new URL(videoSrc).search).get('v');
          return (
            <iframe
              src={`https://www.youtube.com/embed/${videoId}`}
              style={styles}
              className="w-full aspect-video"
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
            className="w-full"
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
            className={`inline-block ${isEditing ? 'ring-2 ring-primary' : ''}`}
          >
            {element.content}
          </div>
        );

      case 'spacer':
        return (
          <div 
            style={{ height: styles.height || '40px' }} 
            className="bg-muted/30 flex items-center justify-center"
          >
            {!isPreview && (
              <span className="text-xs text-muted-foreground">Espaçador ({styles.height || '40px'})</span>
            )}
          </div>
        );

      case 'divider':
        return <hr style={styles} />;

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
        return null; // Children will be rendered separately

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
          onClick={(e) => {
            e.stopPropagation();
            onSelect();
          }}
          onDoubleClick={handleDoubleClick}
        >
          {/* Element Toolbar */}
          {isSelected && !isPreview && (
            <div className="absolute -top-8 left-0 flex items-center gap-1 bg-primary text-primary-foreground rounded-t-md px-2 py-1 text-xs z-10">
              <GripVertical className="w-3 h-3 cursor-grab" />
              <span className="capitalize font-medium">{element.type}</span>
              <div className="flex items-center gap-0.5 ml-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 w-5 p-0 hover:bg-primary-foreground/20"
                  onClick={(e) => { e.stopPropagation(); onDuplicate(); }}
                  title="Duplicar"
                >
                  <Copy className="w-3 h-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 w-5 p-0 hover:bg-destructive/80"
                  onClick={(e) => { e.stopPropagation(); onDelete(); }}
                  title="Excluir"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          )}

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
