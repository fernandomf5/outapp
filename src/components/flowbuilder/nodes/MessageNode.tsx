import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { MessageSquare } from 'lucide-react';

const MessageNode = ({ data, selected }: NodeProps) => {
  return (
    <div className={`bg-card rounded-lg border-2 p-4 shadow-lg min-w-[220px] transition-all ${
      selected ? 'border-chart-1 shadow-glow' : 'border-border'
    }`}>
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 !bg-chart-1"
      />
      <div className="flex items-center gap-3 mb-2">
        <div className="bg-chart-1/20 p-2 rounded-lg">
          <MessageSquare className="w-5 h-5 text-chart-1" />
        </div>
        <div className="font-bold text-sm text-chart-1">MENSAGEM</div>
      </div>
      <div className="text-sm text-foreground whitespace-pre-wrap">{data.label}</div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 !bg-chart-1"
      />
    </div>
  );
};

export default memo(MessageNode);
