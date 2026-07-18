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
      type: 'trigger',
      icon: Play,
      title: 'Gatilho de Início',
      description: 'Como o fluxo inicia',
      color: 'green-500',
    },
    {
      type: 'text',
      icon: Type,
      title: 'Adicionar Texto',
      description: 'Mensagem de texto',
      color: 'cyan-500',
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
      type: 'button',
      icon: MousePointerClick,
      title: 'Botões Interativos',
      description: 'Escolha de opções',
      color: 'orange-500',
    },
    {
      type: 'humanAgent',
      icon: Headset,
      title: 'Transferência',
      description: 'Atendente humano',
      color: 'pink-500',
    },
    {
      type: 'condition',
      icon: GitBranch,
      title: 'Condição (IF)',
      description: 'Lógica se/então',
      color: 'emerald-500',
    },
    {
      type: 'question',
      icon: HelpCircle,
      title: 'Pergunta',
      description: 'Capturar resposta',
      color: 'yellow-500',
    },
    {
      type: 'action',
      icon: Zap,
      title: 'Ação',
      description: 'Executar tarefa',
      color: 'orange-500',
    },
  ];

  return (
    <aside className="w-72 bg-gradient-to-b from-card/95 via-card/90 to-card/95 backdrop-blur-md border-r border-border/50 p-5 space-y-4 overflow-y-auto shadow-2xl">
      <div className="mb-6">
        <h3 className="font-bold text-base text-foreground mb-2 flex items-center gap-2">
          <Zap className="w-5 h-5 text-primary animate-pulse" />
          BLOCOS DISPONÍVEIS
        </h3>
        <p className="text-xs text-muted-foreground">Clique ou arraste para adicionar</p>
      </div>

      {basicBlocks.map((block) => (
        <Card
          key={block.type}
          className="p-4 cursor-pointer bg-gradient-to-br from-card to-card/50 hover:from-primary/10 hover:to-primary/5 hover:border-primary border-2 shadow-md hover:shadow-[0_8px_30px_rgba(139,92,246,0.3)] hover:scale-105 transition-all duration-300 group"
          onClick={() => onAddNode(block.type)}
          draggable
          onDragStart={(e) => {
            e.dataTransfer.setData('application/reactflow', block.type);
            e.dataTransfer.effectAllowed = 'move';
          }}
        >
          <div className="flex items-center gap-3">
            <div className={`bg-${block.color}/20 p-3 rounded-xl group-hover:scale-110 transition-transform duration-300 shadow-sm`}>
              <block.icon className={`w-5 h-5 text-${block.color}`} />
            </div>
            <div>
              <h4 className="font-semibold text-sm group-hover:text-primary transition-colors">{block.title}</h4>
              <p className="text-xs text-muted-foreground">{block.description}</p>
            </div>
          </div>
        </Card>
      ))}
    </aside>
  );
};
