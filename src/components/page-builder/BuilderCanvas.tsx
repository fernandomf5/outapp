import { useDroppable } from "@dnd-kit/core";
import { BuilderElement, BuilderPage } from "@/pages/PageBuilder";
import { CanvasElement } from "./CanvasElement";

// Wrapper component to properly handle element selection with nested elements
interface CanvasElementWrapperProps {
  element: BuilderElement;
  selectedElement: BuilderElement | null;
  onSelectElement: (element: BuilderElement | null) => void;
  onElementUpdate: (element: BuilderElement) => void;
  onDeleteElement: (elementId: string) => void;
  onDuplicateElement: (element: BuilderElement) => void;
  isPreview: boolean;
  viewMode: 'desktop' | 'tablet' | 'mobile';
  depth: number;
}

const CanvasElementWrapper = ({
  element,
  selectedElement,
  onSelectElement,
  onElementUpdate,
  onDeleteElement,
  onDuplicateElement,
  isPreview,
  viewMode,
  depth
}: CanvasElementWrapperProps) => {
  // Function to find and update a nested element
  const updateNestedElement = (tree: BuilderElement[], updatedElement: BuilderElement): BuilderElement[] => {
    return tree.map(el => {
      if (el.id === updatedElement.id) {
        return updatedElement;
      }
      if (el.children && el.children.length > 0) {
        return {
          ...el,
          children: updateNestedElement(el.children, updatedElement)
        };
      }
      return el;
    });
  };

  // Handle update for nested elements
  const handleNestedUpdate = (updatedElement: BuilderElement) => {
    if (element.id === updatedElement.id) {
      onElementUpdate(updatedElement);
    } else if (element.children && element.children.length > 0) {
      // The updated element is a child
      const updatedParent = {
        ...element,
        children: updateNestedElement(element.children, updatedElement)
      };
      onElementUpdate(updatedParent);
    } else {
      onElementUpdate(updatedElement);
    }
  };

  return (
    <CanvasElement
      element={element}
      isSelected={selectedElement?.id === element.id}
      onSelect={() => onSelectElement(element)}
      onUpdate={handleNestedUpdate}
      onDelete={() => onDeleteElement(element.id)}
      onDuplicate={() => onDuplicateElement(element)}
      isPreview={isPreview}
      viewMode={viewMode}
      depth={depth}
    />
  );
};


interface BuilderCanvasProps {
  elements: BuilderElement[];
  selectedElement: BuilderElement | null;
  onSelectElement: (element: BuilderElement | null) => void;
  onElementUpdate: (element: BuilderElement) => void;
  onDeleteElement: (elementId: string) => void;
  onDuplicateElement: (element: BuilderElement) => void;
  isPreview: boolean;
  viewMode: 'desktop' | 'tablet' | 'mobile';
  pageSettings?: BuilderPage['settings'];
}

export const BuilderCanvas = ({
  elements,
  selectedElement,
  onSelectElement,
  onElementUpdate,
  onDeleteElement,
  onDuplicateElement,
  isPreview,
  viewMode,
  pageSettings
}: BuilderCanvasProps) => {
  const { setNodeRef, isOver } = useDroppable({
    id: 'canvas',
    data: {
      type: 'canvas',
      accepts: ['section', 'row', 'heading', 'text', 'image', 'video', 'button', 'spacer', 'divider', 'html', 'icon', 'countdown', 'testimonial', 'pricing', 'faq', 'gallery', 'map', 'social', 'form']
    }
  });

  const canvasStyle = {
    backgroundColor: pageSettings?.backgroundColor || '#ffffff',
    fontFamily: pageSettings?.fontFamily || 'Inter, sans-serif',
    minHeight: '100%'
  };

  return (
    <div
      ref={setNodeRef}
      className={`min-h-full transition-all ${isOver ? 'ring-2 ring-primary ring-inset' : ''}`}
      style={canvasStyle}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onSelectElement(null);
        }
      }}
    >
      {elements.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[400px] text-muted-foreground">
          <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <p className="text-lg font-medium mb-2">Canvas Vazio</p>
          <p className="text-sm text-center max-w-xs">
            Arraste elementos da barra lateral para começar a criar sua página
          </p>
        </div>
      ) : (
        <div className="min-h-full">
          {elements.map((element) => (
            <CanvasElementWrapper
              key={element.id}
              element={element}
              selectedElement={selectedElement}
              onSelectElement={onSelectElement}
              onElementUpdate={onElementUpdate}
              onDeleteElement={onDeleteElement}
              onDuplicateElement={onDuplicateElement}
              isPreview={isPreview}
              viewMode={viewMode}
              depth={0}
            />
          ))}
        </div>
      )}

      {/* Custom CSS */}
      {pageSettings?.customCss && (
        <style dangerouslySetInnerHTML={{ __html: pageSettings.customCss }} />
      )}
    </div>
  );
};
