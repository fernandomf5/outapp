import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Headset } from 'lucide-react';
import { NodeResizer } from '@reactflow/node-resizer';
import '@reactflow/node-resizer/dist/style.css';

const HumanAgentNode = ({ data, selected }: NodeProps) => {
  return (
    <div className={`bg-card rounded-lg border-2 p-4 min-w-[220px] max-w-[400px] transition-all duration-300 cursor-pointer relative ${
      selected 
        ? 'border-pink-500 shadow-[0_0_20px_rgba(236,72,153,0.5)] scale-105' 
        : 'border-border shadow-lg hover:shadow-[0_8px_30px_rgba(0,0,0,0.2)] hover:scale-102 hover:border-pink-400/50'
    }`}>
      <NodeResizer
        isVisible={selected}
        minWidth={220}
        minHeight={120}
        lineClassName="border-pink-500"
        handleClassName="bg-pink-500"
      />
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 !bg-pink-500"
      />
      <div className="flex items-center gap-3 mb-2">
        <div className="bg-pink-500/20 p-2 rounded-lg">
          <Headset className="w-5 h-5 text-pink-500" />
        </div>
        <div className="font-bold text-sm text-pink-500">ATENDENTE HUMANO</div>
      </div>
      <div className="text-sm text-foreground">
        {data.label || 'Transferir para atendimento humano'}
      </div>
      <div className="mt-2 text-xs text-muted-foreground">
        Inicia uma conversa ao vivo com atendente
      </div>
    </div>
  );
};

export default memo(HumanAgentNode);
