import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { HelpCircle } from 'lucide-react';
import { NodeResizer } from '@reactflow/node-resizer';
import '@reactflow/node-resizer/dist/style.css';

const QuestionNode = ({ data, selected }: NodeProps) => {
  return (
    <div className={`bg-card rounded-lg border-2 p-4 min-w-[220px] transition-all duration-300 cursor-pointer relative ${
      selected 
        ? 'border-chart-2 shadow-[0_0_20px_rgba(251,191,36,0.5)] scale-105' 
        : 'border-border shadow-lg hover:shadow-[0_8px_30px_rgba(0,0,0,0.2)] hover:scale-102 hover:border-chart-2/50'
    }`}>
      <NodeResizer
        isVisible={selected}
        minWidth={220}
        minHeight={120}
        lineClassName="border-chart-2"
        handleClassName="bg-chart-2"
      />
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
