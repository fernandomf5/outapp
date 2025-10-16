import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { MessageSquare } from 'lucide-react';

const MessageNode = ({ data, selected }: NodeProps) => {
  return (
    <div className={`bg-card rounded-lg border-2 p-4 shadow-lg min-w-[220px] max-w-[300px] transition-colors ${
      selected ? 'border-chart-1 shadow-glow' : 'border-border'
    }`}>
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 !bg-chart-1"
      />
      <div className="flex items-center gap-3 mb-2">
        <div className="bg-chart-1/20 p-2 rounded-lg">
          <MessageSquare className="w-5 h-5 text-chart-1" />
        </div>
        <div className="font-bold text-sm text-chart-1">MENSAGEM</div>
      </div>
      {data.imageUrl && (
        <div className="mb-3 rounded-md overflow-hidden">
          <img 
            src={data.imageUrl} 
            alt="Mensagem" 
            className="w-full h-32 object-cover"
          />
        </div>
      )}
      <div className="text-sm text-foreground whitespace-pre-wrap">{data.label}</div>
      {data.buttons && data.buttons.length > 0 && (
        <div className="space-y-2 mt-3">
          {data.buttons.map((button: string, index: number) => (
            <div key={index} className="relative">
              <div className="text-xs bg-chart-1/20 px-3 py-2 rounded-md text-center border border-chart-1/30 font-medium">
                {button}
              </div>
              <Handle
                type="source"
                position={Position.Right}
                id={`btn-${index}`}
                className="w-3 h-3 !bg-chart-1"
                style={{ top: '50%', transform: 'translateY(-50%)' }}
              />
            </div>
          ))}
        </div>
      )}
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 !bg-chart-1"
      />
    </div>
  );
};

export default memo(MessageNode);
