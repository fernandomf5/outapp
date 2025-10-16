import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { GitBranch } from 'lucide-react';

const ConditionNode = ({ data, selected }: NodeProps) => {
  return (
    <div className={`bg-card rounded-lg border-2 p-4 min-w-[220px] transition-all duration-300 cursor-pointer ${
      selected 
        ? 'border-chart-3 shadow-[0_0_20px_rgba(34,197,94,0.5)] scale-105' 
        : 'border-border shadow-lg hover:shadow-[0_8px_30px_rgba(0,0,0,0.2)] hover:scale-102 hover:border-chart-3/50'
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
