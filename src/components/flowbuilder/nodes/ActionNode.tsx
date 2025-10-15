import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Zap } from 'lucide-react';

const ActionNode = ({ data, selected }: NodeProps) => {
  return (
    <div className={`bg-card rounded-lg border-2 p-4 shadow-lg min-w-[220px] transition-all ${
      selected ? 'border-chart-4 shadow-glow' : 'border-border'
    }`}>
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 !bg-chart-4"
      />
      <div className="flex items-center gap-3 mb-2">
        <div className="bg-chart-4/20 p-2 rounded-lg">
          <Zap className="w-5 h-5 text-chart-4" />
        </div>
        <div className="font-bold text-sm text-chart-4">AÇÃO</div>
      </div>
      <div className="text-sm text-foreground whitespace-pre-wrap">{data.label}</div>
      {data.actionType && (
        <div className="mt-2 text-xs text-muted-foreground">
          Tipo: {data.actionType}
        </div>
      )}
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 !bg-chart-4"
      />
    </div>
  );
};

export default memo(ActionNode);
