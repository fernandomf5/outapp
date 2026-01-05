import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { 
  Type, Image, Video, Square, MousePointer, Layers, 
  Settings, Plus, Trash2, ChevronRight, Box, Minus,
  ArrowUpDown, Code, Link, CircleDot, Heading1, Heading2,
  AlignLeft, List, ListOrdered, Quote
} from "lucide-react";
import { EditorElement } from "@/pages/PageEditor";

interface EditorSidebarProps {
  activeTab: 'elements' | 'layers' | 'settings';
  onTabChange: (tab: 'elements' | 'layers' | 'settings') => void;
  elements: EditorElement[];
  selectedElement: EditorElement | null;
  onSelectElement: (element: EditorElement | null) => void;
  onAddElement: (element: EditorElement) => void;
  onDeleteElement: (elementId: string) => void;
}

const ELEMENT_CATEGORIES = [
  {
    name: "Texto",
    icon: Type,
    elements: [
      { type: 'text', label: 'Título H1', icon: Heading1, defaultContent: '<h1>Título Principal</h1>' },
      { type: 'text', label: 'Título H2', icon: Heading2, defaultContent: '<h2>Subtítulo</h2>' },
      { type: 'text', label: 'Parágrafo', icon: AlignLeft, defaultContent: '<p>Seu texto aqui...</p>' },
      { type: 'text', label: 'Lista', icon: List, defaultContent: '<ul><li>Item 1</li><li>Item 2</li></ul>' },
      { type: 'text', label: 'Lista Numerada', icon: ListOrdered, defaultContent: '<ol><li>Item 1</li><li>Item 2</li></ol>' },
      { type: 'text', label: 'Citação', icon: Quote, defaultContent: '<blockquote>Sua citação aqui...</blockquote>' },
    ]
  },
  {
    name: "Mídia",
    icon: Image,
    elements: [
      { type: 'image', label: 'Imagem', icon: Image, defaultContent: '' },
      { type: 'video', label: 'Vídeo', icon: Video, defaultContent: '' },
    ]
  },
  {
    name: "Layout",
    icon: Square,
    elements: [
      { type: 'section', label: 'Seção', icon: Box, defaultContent: '<section class="py-12 px-4"></section>' },
      { type: 'container', label: 'Container', icon: Square, defaultContent: '<div class="container mx-auto"></div>' },
      { type: 'divider', label: 'Divisor', icon: Minus, defaultContent: '<hr class="my-8" />' },
      { type: 'spacer', label: 'Espaçador', icon: ArrowUpDown, defaultContent: '<div style="height: 40px;"></div>' },
    ]
  },
  {
    name: "Interativo",
    icon: MousePointer,
    elements: [
      { type: 'button', label: 'Botão', icon: CircleDot, defaultContent: '<button class="btn">Clique Aqui</button>' },
      { type: 'button', label: 'Link/Botão', icon: Link, defaultContent: '<a href="#" class="btn">Saiba Mais</a>' },
    ]
  },
  {
    name: "Avançado",
    icon: Code,
    elements: [
      { type: 'html', label: 'HTML Customizado', icon: Code, defaultContent: '<div><!-- Seu código HTML --></div>' },
    ]
  }
];

export const EditorSidebar = ({
  activeTab,
  onTabChange,
  elements,
  selectedElement,
  onSelectElement,
  onAddElement,
  onDeleteElement
}: EditorSidebarProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedCategory, setExpandedCategory] = useState<string | null>("Texto");

  const handleAddElement = (elementConfig: any) => {
    const newElement: EditorElement = {
      id: `element-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: elementConfig.type,
      newContent: elementConfig.defaultContent,
      isNew: true,
      styles: {},
      attributes: {}
    };
    onAddElement(newElement);
  };

  const getElementIcon = (type: string) => {
    switch (type) {
      case 'text': return Type;
      case 'image': return Image;
      case 'video': return Video;
      case 'button': return MousePointer;
      case 'section': return Box;
      case 'container': return Square;
      case 'divider': return Minus;
      case 'spacer': return ArrowUpDown;
      case 'html': return Code;
      default: return Box;
    }
  };

  return (
    <div className="w-64 border-r bg-card flex flex-col shrink-0">
      <Tabs value={activeTab} onValueChange={(v) => onTabChange(v as any)} className="flex-1 flex flex-col">
        <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0 h-auto">
          <TabsTrigger 
            value="elements" 
            className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-3"
          >
            <Plus className="w-4 h-4 mr-1" />
            Elementos
          </TabsTrigger>
          <TabsTrigger 
            value="layers" 
            className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-3"
          >
            <Layers className="w-4 h-4 mr-1" />
            Camadas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="elements" className="flex-1 m-0 overflow-hidden">
          <div className="p-3">
            <Input
              placeholder="Buscar elementos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-8 text-sm"
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
                  <div key={category.name} className="border rounded-lg overflow-hidden">
                    <button
                      onClick={() => setExpandedCategory(
                        expandedCategory === category.name ? null : category.name
                      )}
                      className="w-full flex items-center justify-between p-2 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <CategoryIcon className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{category.name}</span>
                      </div>
                      <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${
                        expandedCategory === category.name ? 'rotate-90' : ''
                      }`} />
                    </button>
                    
                    {expandedCategory === category.name && (
                      <div className="p-2 pt-0 grid grid-cols-2 gap-1">
                        {(searchTerm ? filteredElements : category.elements).map((element) => {
                          const ElementIcon = element.icon;
                          return (
                            <button
                              key={element.label}
                              onClick={() => handleAddElement(element)}
                              className="flex flex-col items-center gap-1 p-2 rounded-md hover:bg-muted/50 transition-colors text-center"
                            >
                              <div className="w-8 h-8 rounded bg-muted flex items-center justify-center">
                                <ElementIcon className="w-4 h-4 text-muted-foreground" />
                              </div>
                              <span className="text-xs text-muted-foreground">{element.label}</span>
                            </button>
                          );
                        })}
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
              {elements.length === 0 ? (
                <div className="text-center text-muted-foreground text-sm py-8">
                  <Layers className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>Nenhum elemento adicionado</p>
                  <p className="text-xs mt-1">Adicione elementos na aba "Elementos"</p>
                </div>
              ) : (
                elements.map((element, index) => {
                  const ElementIcon = getElementIcon(element.type);
                  return (
                    <div
                      key={element.id}
                      onClick={() => onSelectElement(element)}
                      className={`flex items-center justify-between p-2 rounded-md cursor-pointer transition-colors ${
                        selectedElement?.id === element.id
                          ? 'bg-primary/10 border border-primary/30'
                          : 'hover:bg-muted/50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <ElementIcon className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm truncate max-w-[140px]">
                          {element.type.charAt(0).toUpperCase() + element.type.slice(1)} {index + 1}
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
  );
};
