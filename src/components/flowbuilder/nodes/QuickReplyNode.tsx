import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Grid3X3 } from 'lucide-react';

const QuickReplyNode = ({ data, selected }: NodeProps) => {
  const buttons = data.buttons || [];
  
  return (
    <div className={`bg-card rounded-lg border-2 p-4 shadow-lg min-w-[220px] max-w-[300px] transition-all ${
      selected ? 'border-chart-5 shadow-glow' : 'border-border'
    }`}>
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
        {buttons.slice(0, 3).map((button: string, index: number) => (
          <div
            key={index}
            className="text-xs bg-accent/50 px-3 py-1.5 rounded-md text-center border border-border"
          >
            {button}
          </div>
        ))}
        {buttons.length > 3 && (
          <div className="text-xs text-muted-foreground text-center">
            +{buttons.length - 3} mais
          </div>
        )}
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
