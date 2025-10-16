import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Play } from 'lucide-react';

const TriggerNode = ({ data, selected }: NodeProps) => {
  return (
    <div className={`bg-card rounded-lg border-2 p-4 min-w-[220px] transition-all duration-300 cursor-pointer ${
      selected 
        ? 'border-primary shadow-[0_0_20px_rgba(139,92,246,0.5)] scale-105' 
        : 'border-border shadow-lg hover:shadow-[0_8px_30px_rgba(0,0,0,0.2)] hover:scale-102 hover:border-primary/50'
    }`}>
      <div className="flex items-center gap-3 mb-2">
        <div className="bg-primary/20 p-2 rounded-lg">
          <Play className="w-5 h-5 text-primary" />
        </div>
        <div className="font-bold text-sm text-primary">GATILHO</div>
      </div>
      <div className="text-sm text-foreground">{data.label}</div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 !bg-primary"
      />
    </div>
  );
};

export default memo(TriggerNode);
