import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Zap } from 'lucide-react';
import { NodeResizer } from '@reactflow/node-resizer';
import '@reactflow/node-resizer/dist/style.css';

const ActionNode = ({ data, selected }: NodeProps) => {
  return (
    <div className={`bg-card rounded-lg border-2 p-4 min-w-[220px] transition-all duration-300 cursor-pointer relative ${
      selected 
        ? 'border-chart-4 shadow-[0_0_20px_rgba(249,115,22,0.5)] scale-105' 
        : 'border-border shadow-lg hover:shadow-[0_8px_30px_rgba(0,0,0,0.2)] hover:scale-102 hover:border-chart-4/50'
    }`}>
      <NodeResizer
        isVisible={selected}
        minWidth={220}
        minHeight={120}
        lineClassName="border-chart-4"
        handleClassName="bg-chart-4"
      />
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
      {data.buttons && data.buttons.length > 0 && (
        <div className="space-y-2 mt-3">
          {data.buttons.map((button: any, index: number) => {
            const buttonText = typeof button === 'string' ? button : (button?.text || '');
            const hasUrl = typeof button === 'object' && !!button?.url;
            return (
              <div key={index} className="relative">
                <div className="text-xs bg-chart-4/20 px-3 py-2 rounded-md text-center border border-chart-4/30 font-medium">
                  {buttonText}
                  {hasUrl && <div className="text-[10px] text-chart-4 mt-1 truncate">🔗 Link</div>}
                </div>
                <Handle
                  type="source"
                  position={Position.Right}
                  id={`btn-${index}`}
                  className="w-3 h-3 !bg-chart-4"
                  style={{ top: '50%', transform: 'translateY(-50%)' }}
                />
              </div>
            );
          })}
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
