import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Type } from 'lucide-react';

const TextNode = ({ data, selected }: NodeProps) => {
  return (
    <div className={`bg-card rounded-lg border-2 p-4 shadow-lg min-w-[220px] max-w-[300px] transition-colors ${
      selected ? 'border-cyan-500 shadow-glow' : 'border-border'
    }`}>
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 !bg-cyan-500"
      />
      <div className="flex items-center gap-3 mb-2">
        <div className="bg-cyan-500/20 p-2 rounded-lg">
          <Type className="w-5 h-5 text-cyan-500" />
        </div>
        <div className="font-bold text-sm text-cyan-500">TEXTO</div>
      </div>
      <div className="text-sm text-foreground whitespace-pre-wrap">{data.label || 'Digite sua mensagem...'}</div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 !bg-cyan-500"
      />
    </div>
  );
};

export default memo(TextNode);
