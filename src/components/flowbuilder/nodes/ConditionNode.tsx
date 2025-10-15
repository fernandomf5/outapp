import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { GitBranch } from 'lucide-react';

const ConditionNode = ({ data, selected }: NodeProps) => {
  return (
    <div className={`bg-card rounded-lg border-2 p-4 shadow-lg min-w-[220px] transition-colors ${
      selected ? 'border-chart-3 shadow-glow' : 'border-border'
    }`}>
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 !bg-chart-3"
      />
      <div className="flex items-center gap-3 mb-2">
        <div className="bg-chart-3/20 p-2 rounded-lg">
          <GitBranch className="w-5 h-5 text-chart-3" />
        </div>
        <div className="font-bold text-sm text-chart-3">CONDIÇÃO</div>
      </div>
      <div className="text-sm text-foreground whitespace-pre-wrap">{data.label}</div>
      <div className="flex justify-between mt-3">
        <div className="text-xs text-muted-foreground">✓ Sim</div>
        <div className="text-xs text-muted-foreground">✗ Não</div>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        id="true"
        className="w-3 h-3 !bg-chart-3"
        style={{ left: '25%' }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="false"
        className="w-3 h-3 !bg-destructive"
        style={{ left: '75%' }}
      />
    </div>
  );
};

export default memo(ConditionNode);
