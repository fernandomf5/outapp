import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface LayoutStructure {
  id: string;
  name: string;
  columns: number[];
  icon: React.ReactNode;
}

interface LayoutStructureSelectorProps {
  open: boolean;
  onClose: () => void;
  onSelect: (structure: LayoutStructure) => void;
  type: 'section' | 'row';
}

// Pre-defined layout structures like Elementor
const SECTION_STRUCTURES: LayoutStructure[] = [
  {
    id: 'full',
    name: 'Largura Total',
    columns: [100],
    icon: (
      <div className="w-full h-8 bg-primary/20 rounded border-2 border-primary/40" />
    )
  },
  {
    id: '50-50',
    name: '50% / 50%',
    columns: [50, 50],
    icon: (
      <div className="flex gap-1 w-full">
        <div className="flex-1 h-8 bg-primary/20 rounded border-2 border-primary/40" />
        <div className="flex-1 h-8 bg-primary/20 rounded border-2 border-primary/40" />
      </div>
    )
  },
  {
    id: '33-33-33',
    name: '33% / 33% / 33%',
    columns: [33.33, 33.33, 33.33],
    icon: (
      <div className="flex gap-1 w-full">
        <div className="flex-1 h-8 bg-primary/20 rounded border-2 border-primary/40" />
        <div className="flex-1 h-8 bg-primary/20 rounded border-2 border-primary/40" />
        <div className="flex-1 h-8 bg-primary/20 rounded border-2 border-primary/40" />
      </div>
    )
  },
  {
    id: '25-25-25-25',
    name: '25% x 4',
    columns: [25, 25, 25, 25],
    icon: (
      <div className="flex gap-1 w-full">
        <div className="flex-1 h-8 bg-primary/20 rounded border-2 border-primary/40" />
        <div className="flex-1 h-8 bg-primary/20 rounded border-2 border-primary/40" />
        <div className="flex-1 h-8 bg-primary/20 rounded border-2 border-primary/40" />
        <div className="flex-1 h-8 bg-primary/20 rounded border-2 border-primary/40" />
      </div>
    )
  },
  {
    id: '66-33',
    name: '66% / 33%',
    columns: [66.66, 33.33],
    icon: (
      <div className="flex gap-1 w-full">
        <div className="w-2/3 h-8 bg-primary/20 rounded border-2 border-primary/40" />
        <div className="w-1/3 h-8 bg-primary/20 rounded border-2 border-primary/40" />
      </div>
    )
  },
  {
    id: '33-66',
    name: '33% / 66%',
    columns: [33.33, 66.66],
    icon: (
      <div className="flex gap-1 w-full">
        <div className="w-1/3 h-8 bg-primary/20 rounded border-2 border-primary/40" />
        <div className="w-2/3 h-8 bg-primary/20 rounded border-2 border-primary/40" />
      </div>
    )
  },
  {
    id: '25-50-25',
    name: '25% / 50% / 25%',
    columns: [25, 50, 25],
    icon: (
      <div className="flex gap-1 w-full">
        <div className="w-1/4 h-8 bg-primary/20 rounded border-2 border-primary/40" />
        <div className="w-2/4 h-8 bg-primary/20 rounded border-2 border-primary/40" />
        <div className="w-1/4 h-8 bg-primary/20 rounded border-2 border-primary/40" />
      </div>
    )
  },
  {
    id: '20-60-20',
    name: '20% / 60% / 20%',
    columns: [20, 60, 20],
    icon: (
      <div className="flex gap-1 w-full">
        <div className="w-[20%] h-8 bg-primary/20 rounded border-2 border-primary/40" />
        <div className="w-[60%] h-8 bg-primary/20 rounded border-2 border-primary/40" />
        <div className="w-[20%] h-8 bg-primary/20 rounded border-2 border-primary/40" />
      </div>
    )
  },
  {
    id: '16-16-16-16-16-16',
    name: '6 Colunas',
    columns: [16.66, 16.66, 16.66, 16.66, 16.66, 16.66],
    icon: (
      <div className="flex gap-0.5 w-full">
        {[1,2,3,4,5,6].map(i => (
          <div key={i} className="flex-1 h-8 bg-primary/20 rounded border-2 border-primary/40" />
        ))}
      </div>
    )
  }
];

const ROW_STRUCTURES: LayoutStructure[] = [
  {
    id: 'horizontal',
    name: 'Horizontal (Lado a Lado)',
    columns: [50, 50],
    icon: (
      <div className="flex gap-1 w-full">
        <div className="flex-1 h-8 bg-primary/20 rounded border-2 border-primary/40 flex items-center justify-center">
          <span className="text-[10px] text-primary">←→</span>
        </div>
        <div className="flex-1 h-8 bg-primary/20 rounded border-2 border-primary/40 flex items-center justify-center">
          <span className="text-[10px] text-primary">←→</span>
        </div>
      </div>
    )
  },
  {
    id: 'vertical',
    name: 'Vertical (Empilhado)',
    columns: [100],
    icon: (
      <div className="flex flex-col gap-1 w-full">
        <div className="w-full h-4 bg-primary/20 rounded border-2 border-primary/40 flex items-center justify-center">
          <span className="text-[8px] text-primary">↑</span>
        </div>
        <div className="w-full h-4 bg-primary/20 rounded border-2 border-primary/40 flex items-center justify-center">
          <span className="text-[8px] text-primary">↓</span>
        </div>
      </div>
    )
  },
  ...SECTION_STRUCTURES.slice(1) // Reuse section structures for rows too
];

export const LayoutStructureSelector = ({
  open,
  onClose,
  onSelect,
  type
}: LayoutStructureSelectorProps) => {
  const [selectedTab, setSelectedTab] = useState<'horizontal' | 'vertical'>('horizontal');
  
  const structures = type === 'section' ? SECTION_STRUCTURES : ROW_STRUCTURES;
  
  const handleSelect = (structure: LayoutStructure) => {
    onSelect(structure);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            Escolha a Estrutura {type === 'section' ? 'da Seção' : 'da Linha'}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={selectedTab} onValueChange={(v) => setSelectedTab(v as any)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="horizontal">Horizontal</TabsTrigger>
            <TabsTrigger value="vertical">Vertical</TabsTrigger>
          </TabsList>
          
          <TabsContent value="horizontal" className="mt-4">
            <ScrollArea className="h-[300px]">
              <div className="grid grid-cols-2 gap-3 p-1">
                {structures.filter(s => s.columns.length > 1 || s.id === 'full').map((structure) => (
                  <button
                    key={structure.id}
                    onClick={() => handleSelect({ ...structure, id: `${structure.id}-horizontal` })}
                    className="flex flex-col gap-2 p-4 rounded-lg border-2 border-border hover:border-primary hover:bg-primary/5 transition-all group"
                  >
                    <div className="w-full">
                      {structure.icon}
                    </div>
                    <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">
                      {structure.name}
                    </span>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="vertical" className="mt-4">
            <ScrollArea className="h-[300px]">
              <div className="grid grid-cols-2 gap-3 p-1">
                {/* Vertical layouts - stacked columns */}
                <button
                  onClick={() => handleSelect({
                    id: 'single-vertical',
                    name: '1 Coluna Vertical',
                    columns: [100],
                    icon: null
                  })}
                  className="flex flex-col gap-2 p-4 rounded-lg border-2 border-border hover:border-primary hover:bg-primary/5 transition-all group"
                >
                  <div className="flex flex-col gap-1 w-full">
                    <div className="w-full h-8 bg-primary/20 rounded border-2 border-primary/40" />
                  </div>
                  <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">
                    1 Bloco Vertical
                  </span>
                </button>

                <button
                  onClick={() => handleSelect({
                    id: '2-vertical',
                    name: '2 Blocos Verticais',
                    columns: [100, 100],
                    icon: null
                  })}
                  className="flex flex-col gap-2 p-4 rounded-lg border-2 border-border hover:border-primary hover:bg-primary/5 transition-all group"
                >
                  <div className="flex flex-col gap-1 w-full">
                    <div className="w-full h-4 bg-primary/20 rounded border-2 border-primary/40" />
                    <div className="w-full h-4 bg-primary/20 rounded border-2 border-primary/40" />
                  </div>
                  <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">
                    2 Blocos Verticais
                  </span>
                </button>

                <button
                  onClick={() => handleSelect({
                    id: '3-vertical',
                    name: '3 Blocos Verticais',
                    columns: [100, 100, 100],
                    icon: null
                  })}
                  className="flex flex-col gap-2 p-4 rounded-lg border-2 border-border hover:border-primary hover:bg-primary/5 transition-all group"
                >
                  <div className="flex flex-col gap-1 w-full">
                    <div className="w-full h-3 bg-primary/20 rounded border-2 border-primary/40" />
                    <div className="w-full h-3 bg-primary/20 rounded border-2 border-primary/40" />
                    <div className="w-full h-3 bg-primary/20 rounded border-2 border-primary/40" />
                  </div>
                  <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">
                    3 Blocos Verticais
                  </span>
                </button>

                <button
                  onClick={() => handleSelect({
                    id: '4-vertical',
                    name: '4 Blocos Verticais',
                    columns: [100, 100, 100, 100],
                    icon: null
                  })}
                  className="flex flex-col gap-2 p-4 rounded-lg border-2 border-border hover:border-primary hover:bg-primary/5 transition-all group"
                >
                  <div className="flex flex-col gap-1 w-full">
                    <div className="w-full h-2 bg-primary/20 rounded border-2 border-primary/40" />
                    <div className="w-full h-2 bg-primary/20 rounded border-2 border-primary/40" />
                    <div className="w-full h-2 bg-primary/20 rounded border-2 border-primary/40" />
                    <div className="w-full h-2 bg-primary/20 rounded border-2 border-primary/40" />
                  </div>
                  <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">
                    4 Blocos Verticais
                  </span>
                </button>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export type { LayoutStructure };
