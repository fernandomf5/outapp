import { Card } from '@/components/ui/card';
import {
  MessageSquare,
  HelpCircle,
  GitBranch,
  Zap,
  Play,
  Grid3X3,
  Clock,
  Tag,
  BarChart3,
} from 'lucide-react';

interface SidebarProps {
  onAddNode: (type: string) => void;
}

export const Sidebar = ({ onAddNode }: SidebarProps) => {
  const basicBlocks = [
    {
      type: 'message',
      icon: MessageSquare,
      title: 'Enviar Mensagem',
      description: 'Texto automático',
      color: 'chart-1',
    },
    {
      type: 'question',
      icon: HelpCircle,
      title: 'Fazer Pergunta',
      description: 'Coletar resposta',
      color: 'chart-2',
    },
  ];

  const advancedBlocks = [
    {
      type: 'quickReply',
      icon: Grid3X3,
      title: 'Botões Rápidos',
      description: 'Menu de opções',
      color: 'chart-5',
    },
    {
      type: 'condition',
      icon: GitBranch,
      title: 'Condição',
      description: 'Fluxo condicional',
      color: 'chart-3',
    },
    {
      type: 'action',
      icon: Zap,
      title: 'Ação',
      description: 'Lógica customizada',
      color: 'chart-4',
    },
  ];

  return (
    <aside className="w-72 bg-card/80 backdrop-blur-sm border-r border-border p-5 space-y-4 overflow-y-auto shadow-lg">
      <div className="mb-6">
        <h3 className="font-bold text-base text-foreground mb-2 flex items-center gap-2">
          <Zap className="w-5 h-5 text-primary" />
          BLOCOS BÁSICOS
        </h3>
        <p className="text-xs text-muted-foreground">Arraste para o canvas</p>
      </div>

      {basicBlocks.map((block) => (
        <Card
          key={block.type}
          className="p-4 cursor-pointer hover:bg-primary/10 hover:border-primary hover:shadow-lg hover:scale-105 transition-all duration-200 border-2"
          onClick={() => onAddNode(block.type)}
          draggable
          onDragStart={(e) => {
            e.dataTransfer.setData('application/reactflow', block.type);
            e.dataTransfer.effectAllowed = 'move';
          }}
        >
          <div className="flex items-center gap-3">
            <div className={`bg-${block.color}/20 p-3 rounded-xl`}>
              <block.icon className={`w-5 h-5 text-${block.color}`} />
            </div>
            <div>
              <h4 className="font-semibold text-sm">{block.title}</h4>
              <p className="text-xs text-muted-foreground">{block.description}</p>
            </div>
          </div>
        </Card>
      ))}

      <div className="mb-6 mt-8">
        <h3 className="font-bold text-base text-foreground mb-2 flex items-center gap-2">
          <Zap className="w-5 h-5 text-primary" />
          BLOCOS AVANÇADOS
        </h3>
        <p className="text-xs text-muted-foreground">Recursos profissionais</p>
      </div>

      {advancedBlocks.map((block) => (
        <Card
          key={block.type}
          className="p-4 cursor-pointer hover:bg-primary/10 hover:border-primary hover:shadow-lg hover:scale-105 transition-all duration-200 border-2"
          onClick={() => onAddNode(block.type)}
          draggable
          onDragStart={(e) => {
            e.dataTransfer.setData('application/reactflow', block.type);
            e.dataTransfer.effectAllowed = 'move';
          }}
        >
          <div className="flex items-center gap-3">
            <div className={`bg-${block.color}/20 p-3 rounded-xl`}>
              <block.icon className={`w-5 h-5 text-${block.color}`} />
            </div>
            <div>
              <h4 className="font-semibold text-sm">{block.title}</h4>
              <p className="text-xs text-muted-foreground">{block.description}</p>
            </div>
          </div>
        </Card>
      ))}

      <div className="mb-6 mt-8">
        <h3 className="font-bold text-base text-foreground mb-2 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary" />
          CONFIGURAÇÕES
        </h3>
      </div>

      <Card className="p-4 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20 hover:scale-105 transition-all cursor-pointer">
        <div className="flex items-center gap-3 mb-2">
          <Clock className="w-5 h-5 text-primary" />
          <h4 className="font-semibold text-sm">Horário</h4>
        </div>
        <p className="text-xs text-muted-foreground">Seg-Sex: 8h-18h</p>
      </Card>

      <Card className="p-4 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20 hover:scale-105 transition-all cursor-pointer">
        <div className="flex items-center gap-3 mb-2">
          <Tag className="w-5 h-5 text-primary" />
          <h4 className="font-semibold text-sm">Palavras-Chave</h4>
        </div>
        <p className="text-xs text-muted-foreground">5 triggers</p>
      </Card>

      <Card className="p-4 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20 hover:scale-105 transition-all cursor-pointer">
        <div className="flex items-center gap-3 mb-2">
          <BarChart3 className="w-5 h-5 text-primary" />
          <h4 className="font-semibold text-sm">Analytics</h4>
        </div>
        <p className="text-xs text-muted-foreground">Ver métricas</p>
      </Card>
    </aside>
  );
};
