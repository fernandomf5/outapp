import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Headset } from 'lucide-react';

const HumanAgentNode = ({ data, selected }: NodeProps) => {
  return (
    <div className={`bg-card rounded-lg border-2 p-4 shadow-lg min-w-[220px] max-w-[300px] transition-colors ${
      selected ? 'border-pink-500 shadow-glow' : 'border-border'
    }`}>
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
