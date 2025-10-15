import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Play } from 'lucide-react';

const TriggerNode = ({ data, selected }: NodeProps) => {
  return (
    <div className={`bg-card rounded-lg border-2 p-4 shadow-lg min-w-[220px] transition-all ${
      selected ? 'border-primary shadow-glow' : 'border-border'
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
