import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { useDraggable } from "@dnd-kit/core";
import { 
  Type, Image, Video, Square, Layers, 
  Plus, Trash2, ChevronRight, Box, Minus,
  ArrowUpDown, Code, CircleDot, Heading1, Heading2,
  AlignLeft, Star, Clock, MessageSquare, DollarSign,
  HelpCircle, Grid, MapPin, Share2, FileText, 
  LayoutGrid, Columns, MousePointer
} from "lucide-react";
import { BuilderElement } from "@/pages/PageBuilder";
import { LayoutStructureSelector, LayoutStructure } from "./LayoutStructureSelector";

interface BuilderSidebarProps {
  activeTab: 'elements' | 'layers' | 'pages';
  onTabChange: (tab: 'elements' | 'layers' | 'pages') => void;
  elements: BuilderElement[];
  selectedElement: BuilderElement | null;
  onSelectElement: (element: BuilderElement | null) => void;
  onDeleteElement: (elementId: string) => void;
  onAddStructuredElement?: (type: 'section' | 'row', structure: LayoutStructure) => void;
}

const ELEMENT_CATEGORIES = [
  {
    name: "Layout",
    icon: LayoutGrid,
    elements: [
      { type: 'section', label: 'Seção', icon: Box, hasStructure: true },
      { type: 'row', label: 'Linha', icon: Columns, hasStructure: true },
      { type: 'column', label: 'Coluna', icon: Square },
    ]
  },
  {
    name: "Básico",
    icon: Type,
    elements: [
      { type: 'heading', label: 'Título', icon: Heading1 },
      { type: 'text', label: 'Texto', icon: AlignLeft },
      { type: 'image', label: 'Imagem', icon: Image },
      { type: 'video', label: 'Vídeo', icon: Video },
      { type: 'button', label: 'Botão', icon: MousePointer },
    ]
  },
  {
    name: "Estrutura",
    icon: Square,
    elements: [
      { type: 'divider', label: 'Divisor', icon: Minus },
      { type: 'spacer', label: 'Espaçador', icon: ArrowUpDown },
      { type: 'icon', label: 'Ícone', icon: Star },
    ]
  },
  {
    name: "Widgets",
    icon: Grid,
    elements: [
      { type: 'countdown', label: 'Countdown', icon: Clock },
      { type: 'testimonial', label: 'Depoimento', icon: MessageSquare },
      { type: 'pricing', label: 'Preço', icon: DollarSign },
      { type: 'faq', label: 'FAQ', icon: HelpCircle },
      { type: 'gallery', label: 'Galeria', icon: Grid },
      { type: 'social', label: 'Redes Sociais', icon: Share2 },
    ]
  },
  {
    name: "Avançado",
    icon: Code,
    elements: [
      { type: 'html', label: 'HTML Custom', icon: Code },
      { type: 'form', label: 'Formulário', icon: FileText },
      { type: 'map', label: 'Mapa', icon: MapPin },
    ]
  }
];

interface DraggableElementProps {
  type: string;
  label: string;
  icon: any;
  hasStructure?: boolean;
  onStructureClick?: () => void;
}

const DraggableElement = ({ type, label, icon: Icon, hasStructure, onStructureClick }: DraggableElementProps) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `new-${type}`,
    data: {
      type,
      isNew: true
    }
  });

  // If this element has structure options, clicking opens the selector instead of drag
  if (hasStructure && onStructureClick) {
    return (
      <button
        onClick={onStructureClick}
        className="flex flex-col items-center gap-1 p-3 rounded-lg hover:bg-muted/70 transition-colors text-center border border-transparent hover:border-border cursor-pointer relative group"
      >
        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center relative">
          <Icon className="w-5 h-5 text-muted-foreground" />
          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
            <Plus className="w-2.5 h-2.5 text-primary-foreground" />
          </div>
        </div>
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="text-[10px] text-primary font-medium">+ Estrutura</span>
      </button>
    );
  }

  return (
    <button
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`flex flex-col items-center gap-1 p-3 rounded-lg hover:bg-muted/70 transition-colors text-center border border-transparent hover:border-border cursor-grab active:cursor-grabbing ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
        <Icon className="w-5 h-5 text-muted-foreground" />
      </div>
      <span className="text-xs text-muted-foreground">{label}</span>
    </button>
  );
};

export const BuilderSidebar = ({
  activeTab,
  onTabChange,
  elements,
  selectedElement,
  onSelectElement,
  onDeleteElement,
  onAddStructuredElement
}: BuilderSidebarProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedCategory, setExpandedCategory] = useState<string | null>("Layout");
  const [showStructureSelector, setShowStructureSelector] = useState(false);
  const [structureSelectorType, setStructureSelectorType] = useState<'section' | 'row'>('section');

  const getElementIcon = (type: string) => {
    const allElements = ELEMENT_CATEGORIES.flatMap(cat => cat.elements);
    const found = allElements.find(el => el.type === type);
    return found?.icon || Box;
  };

  const flattenElementsWithDepth = (elements: BuilderElement[], depth = 0): Array<{ element: BuilderElement; depth: number }> => {
    return elements.reduce((acc: Array<{ element: BuilderElement; depth: number }>, element) => {
      acc.push({ element, depth });
      if (element.children) {
        acc.push(...flattenElementsWithDepth(element.children, depth + 1));
      }
      return acc;
    }, []);
  };

  const flatElements = flattenElementsWithDepth(elements);

  const handleStructureClick = (type: 'section' | 'row') => {
    setStructureSelectorType(type);
    setShowStructureSelector(true);
  };

  const handleStructureSelect = (structure: LayoutStructure) => {
    if (onAddStructuredElement) {
      onAddStructuredElement(structureSelectorType, structure);
    }
    setShowStructureSelector(false);
  };

  return (
    <>
      <div className="w-72 border-r bg-card flex flex-col shrink-0">
        <Tabs value={activeTab} onValueChange={(v) => onTabChange(v as any)} className="flex-1 flex flex-col">
          <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0 h-auto">
            <TabsTrigger 
              value="elements" 
              className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-3 text-sm"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Elementos
            </TabsTrigger>
            <TabsTrigger 
              value="layers" 
              className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-3 text-sm"
            >
              <Layers className="w-4 h-4 mr-1.5" />
              Camadas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="elements" className="flex-1 m-0 overflow-hidden">
            <div className="p-3">
              <Input
                placeholder="Buscar elementos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-9"
              />
            </div>
            <ScrollArea className="flex-1 h-[calc(100vh-180px)]">
              <div className="p-3 pt-0 space-y-2">
                {ELEMENT_CATEGORIES.map((category) => {
                  const CategoryIcon = category.icon;
                  const filteredElements = category.elements.filter(el =>
                    el.label.toLowerCase().includes(searchTerm.toLowerCase())
                  );
                  
                  if (searchTerm && filteredElements.length === 0) return null;

                  return (
                    <div key={category.name} className="border rounded-lg overflow-hidden bg-background">
                      <button
                        onClick={() => setExpandedCategory(
                          expandedCategory === category.name ? null : category.name
                        )}
                        className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <CategoryIcon className="w-4 h-4 text-primary" />
                          <span className="text-sm font-medium">{category.name}</span>
                        </div>
                        <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${
                          expandedCategory === category.name ? 'rotate-90' : ''
                        }`} />
                      </button>
                      
                      {expandedCategory === category.name && (
                        <div className="p-2 pt-0 grid grid-cols-3 gap-1 border-t">
                          {(searchTerm ? filteredElements : category.elements).map((element) => (
                            <DraggableElement
                              key={element.type}
                              type={element.type}
                              label={element.label}
                              icon={element.icon}
                              hasStructure={(element as any).hasStructure}
                              onStructureClick={
                                (element as any).hasStructure 
                                  ? () => handleStructureClick(element.type as 'section' | 'row')
                                  : undefined
                              }
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="layers" className="flex-1 m-0 overflow-hidden">
            <ScrollArea className="h-[calc(100vh-120px)]">
              <div className="p-3 space-y-1">
                {flatElements.length === 0 ? (
                  <div className="text-center text-muted-foreground text-sm py-8">
                    <Layers className="w-10 h-10 mx-auto mb-3 opacity-50" />
                    <p className="font-medium">Nenhum elemento</p>
                    <p className="text-xs mt-1">Arraste elementos para o canvas</p>
                  </div>
                ) : (
                  flatElements.map(({ element, depth }) => {
                    const ElementIcon = getElementIcon(element.type);
                    return (
                      <div
                        key={element.id}
                        onClick={() => onSelectElement(element)}
                        className={`flex items-center justify-between p-2 rounded-md cursor-pointer transition-colors group ${
                          selectedElement?.id === element.id
                            ? 'bg-primary/10 border border-primary/30'
                            : 'hover:bg-muted/50'
                        }`}
                        style={{ paddingLeft: `${8 + depth * 16}px` }}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <ElementIcon className="w-4 h-4 text-muted-foreground shrink-0" />
                          <span className="text-sm truncate">
                            {element.type.charAt(0).toUpperCase() + element.type.slice(1)}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteElement(element.id);
                          }}
                        >
                          <Trash2 className="w-3 h-3 text-destructive" />
                        </Button>
                      </div>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>

      {/* Layout Structure Selector Dialog */}
      <LayoutStructureSelector
        open={showStructureSelector}
        onClose={() => setShowStructureSelector(false)}
        onSelect={handleStructureSelect}
        type={structureSelectorType}
      />
    </>
  );
};
