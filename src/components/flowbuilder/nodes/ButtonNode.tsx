import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { MousePointerClick } from 'lucide-react';

const ButtonNode = ({ data, selected }: NodeProps) => {
  const buttons = data.buttons || ['Botão 1'];
  
  return (
    <div className={`bg-card rounded-lg border-2 p-4 min-w-[220px] max-w-[300px] transition-all duration-300 cursor-pointer ${
      selected 
        ? 'border-green-500 shadow-[0_0_20px_rgba(34,197,94,0.5)] scale-105' 
        : 'border-border shadow-lg hover:shadow-[0_8px_30px_rgba(0,0,0,0.2)] hover:scale-102 hover:border-green-400/50'
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
        {buttons.map((button: any, index: number) => {
          const buttonText = typeof button === 'string' ? button : (button?.text || '');
          const buttonUrl = typeof button === 'object' && button?.url ? button.url : '';
          
          return (
            <div key={index} className="relative">
              <div className="text-xs bg-green-500/20 px-3 py-2 rounded-md text-center border border-green-500/30 font-medium">
                {buttonText}
                {buttonUrl && <div className="text-[10px] text-green-600 mt-1 truncate">🔗 Link</div>}
              </div>
              <Handle
                type="source"
                position={Position.Right}
                id={`btn-${index}`}
                className="w-3 h-3 !bg-green-500"
                style={{ top: '50%', transform: 'translateY(-50%)' }}
              />
            </div>
          );
        })}
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
