import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { MousePointerClick } from 'lucide-react';

const ButtonNode = ({ data, selected }: NodeProps) => {
  const buttons = data.buttons || ['Botão 1'];
  
  return (
    <div className={`bg-card rounded-lg border-2 p-4 shadow-lg min-w-[220px] max-w-[300px] transition-colors ${
      selected ? 'border-green-500 shadow-glow' : 'border-border'
    }`}>
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 !bg-green-500"
      />
      <div className="flex items-center gap-3 mb-2">
        <div className="bg-green-500/20 p-2 rounded-lg">
          <MousePointerClick className="w-5 h-5 text-green-500" />
        </div>
        <div className="font-bold text-sm text-green-500">BOTÃO</div>
      </div>
      <div className="text-sm text-foreground mb-3">{data.label}</div>
      <div className="space-y-2">
        {buttons.map((button: string, index: number) => (
          <div key={index} className="relative">
            <div className="text-xs bg-green-500/20 px-3 py-2 rounded-md text-center border border-green-500/30 font-medium">
              {button}
            </div>
            <Handle
              type="source"
              position={Position.Right}
              id={`btn-${index}`}
              className="w-3 h-3 !bg-green-500"
              style={{ top: '50%', transform: 'translateY(-50%)' }}
            />
          </div>
        ))}
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 !bg-green-500"
      />
    </div>
  );
};

export default memo(ButtonNode);
