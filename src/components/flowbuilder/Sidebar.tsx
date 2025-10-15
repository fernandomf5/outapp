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
  Type,
  MousePointerClick,
  Volume2,
  Image as ImageIcon,
  Video,
  FileText,
  Headset,
} from 'lucide-react';

interface SidebarProps {
  onAddNode: (type: string) => void;
}

export const Sidebar = ({ onAddNode }: SidebarProps) => {
  const basicBlocks = [
    {
      type: 'text',
      icon: Type,
      title: 'Adicionar Texto',
      description: 'Mensagem de texto',
      color: 'cyan-500',
    },
    {
      type: 'button',
      icon: MousePointerClick,
      title: 'Adicionar Botão',
      description: 'Botões interativos',
      color: 'green-500',
    },
    {
      type: 'image',
      icon: ImageIcon,
      title: 'Adicionar Imagem',
      description: 'Enviar imagem',
      color: 'blue-500',
    },
    {
      type: 'video',
      icon: Video,
      title: 'Adicionar Vídeo',
      description: 'Enviar vídeo',
      color: 'red-500',
    },
    {
      type: 'audio',
      icon: Volume2,
      title: 'Adicionar Áudio',
      description: 'Enviar áudio',
      color: 'purple-500',
    },
    {
      type: 'document',
      icon: FileText,
      title: 'Adicionar Documento',
      description: 'Enviar arquivo',
      color: 'amber-500',
    },
    {
      type: 'humanAgent',
      icon: Headset,
      title: 'Atendente Humano',
      description: 'Transferir para atendente',
      color: 'pink-500',
    },
  ];

  return (
    <aside className="w-72 bg-card/80 backdrop-blur-sm border-r border-border p-5 space-y-4 overflow-y-auto shadow-lg">
      <div className="mb-6">
        <h3 className="font-bold text-base text-foreground mb-2 flex items-center gap-2">
          <Zap className="w-5 h-5 text-primary" />
          BLOCOS DISPONÍVEIS
        </h3>
        <p className="text-xs text-muted-foreground">Clique ou arraste para adicionar</p>
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
    </aside>
  );
};
