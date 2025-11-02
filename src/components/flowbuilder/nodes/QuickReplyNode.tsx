import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Grid3X3 } from 'lucide-react';
import { NodeResizer } from '@reactflow/node-resizer';
import '@reactflow/node-resizer/dist/style.css';

const QuickReplyNode = ({ data, selected }: NodeProps) => {
  const buttons = data.buttons || [];
  
  return (
    <div className={`bg-card rounded-lg border-2 p-4 min-w-[220px] max-w-[420px] transition-all duration-300 cursor-pointer relative ${
      selected 
        ? 'border-chart-5 shadow-[0_0_20px_rgba(236,72,153,0.5)] scale-105' 
        : 'border-border shadow-lg hover:shadow-[0_8px_30px_rgba(0,0,0,0.2)] hover:scale-102 hover:border-chart-5/50'
    }`}>
      <NodeResizer
        isVisible={selected}
        minWidth={220}
        minHeight={140}
        lineClassName="border-chart-5"
        handleClassName="bg-chart-5"
      />
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 !bg-chart-5"
      />
      <div className="flex items-center gap-3 mb-2">
        <div className="bg-chart-5/20 p-2 rounded-lg">
          <Grid3X3 className="w-5 h-5 text-chart-5" />
        </div>
        <div className="font-bold text-sm text-chart-5">BOTÕES</div>
      </div>
      <div className="text-sm text-foreground mb-3">{data.label}</div>
      {data.imageUrl && (
        <div className="mb-3 rounded-md overflow-hidden">
          <img 
            src={data.imageUrl} 
            alt="Botões" 
            className="w-full h-32 object-cover"
          />
        </div>
      )}
      <div className="space-y-2">
        {buttons.map((button: any, index: number) => {
          const buttonText = typeof button === 'string' ? button : (button?.text || '');
          const buttonUrl = typeof button === 'object' && button?.url ? button.url : '';
          
          return (
            <div key={index} className="relative">
              <div
                className="text-xs bg-accent/50 px-3 py-1.5 rounded-md text-center border border-border"
              >
                {buttonText}
                {buttonUrl && <div className="text-[10px] text-chart-5 mt-0.5 truncate">🔗 Link</div>}
              </div>
              <Handle
                type="source"
                position={Position.Right}
                id={`btn-${index}`}
                className="w-3 h-3 !bg-chart-5"
                style={{ top: '50%', transform: 'translateY(-50%)' }}
              />
            </div>
          );
        })}
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 !bg-chart-5"
      />
    </div>
  );
};

export default memo(QuickReplyNode);
