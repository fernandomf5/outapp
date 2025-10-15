import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { HelpCircle } from 'lucide-react';

const QuestionNode = ({ data, selected }: NodeProps) => {
  return (
    <div className={`bg-card rounded-lg border-2 p-4 shadow-lg min-w-[220px] transition-all ${
      selected ? 'border-chart-2 shadow-glow' : 'border-border'
    }`}>
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 !bg-chart-2"
      />
      <div className="flex items-center gap-3 mb-2">
        <div className="bg-chart-2/20 p-2 rounded-lg">
          <HelpCircle className="w-5 h-5 text-chart-2" />
        </div>
        <div className="font-bold text-sm text-chart-2">PERGUNTA</div>
      </div>
      <div className="text-sm text-foreground whitespace-pre-wrap">{data.label}</div>
      {data.variable && (
        <div className="mt-2 text-xs text-muted-foreground">
          Salvar em: {data.variable}
        </div>
      )}
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 !bg-chart-2"
      />
    </div>
  );
};

export default memo(QuestionNode);
