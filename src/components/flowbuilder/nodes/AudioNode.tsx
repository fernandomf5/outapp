import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Volume2 } from 'lucide-react';

const AudioNode = ({ data, selected }: NodeProps) => {
  return (
    <div className={`bg-card rounded-lg border-2 p-4 min-w-[220px] max-w-[300px] transition-all duration-300 cursor-pointer ${
      selected 
        ? 'border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.5)] scale-105' 
        : 'border-border shadow-lg hover:shadow-[0_8px_30px_rgba(0,0,0,0.2)] hover:scale-102 hover:border-purple-400/50'
    }`}>
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 !bg-purple-500"
      />
      <div className="flex items-center gap-3 mb-2">
        <div className="bg-purple-500/20 p-2 rounded-lg">
          <Volume2 className="w-5 h-5 text-purple-500" />
        </div>
        <div className="font-bold text-sm text-purple-500">ÁUDIO</div>
      </div>
      {data.audioUrl ? (
        <audio controls className="w-full mt-2">
          <source src={data.audioUrl} type="audio/mpeg" />
        </audio>
      ) : (
        <div className="text-sm text-muted-foreground">Nenhum áudio selecionado</div>
      )}
      {data.label && <div className="text-sm text-foreground mt-2">{data.label}</div>}
      {data.buttons && data.buttons.length > 0 && (
        <div className="space-y-2 mt-3">
          {data.buttons.map((button: any, index: number) => {
            const buttonText = typeof button === 'string' ? button : (button?.text || '');
            const hasUrl = typeof button === 'object' && !!button?.url;
            return (
              <div key={index} className="relative">
                <div className="text-xs bg-purple-500/20 px-3 py-2 rounded-md text-center border border-purple-500/30 font-medium">
                  {buttonText}
                  {hasUrl && <div className="text-[10px] text-purple-600 mt-1 truncate">🔗 Link</div>}
                </div>
                <Handle
                  type="source"
                  position={Position.Right}
                  id={`btn-${index}`}
                  className="w-3 h-3 !bg-purple-500"
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
        className="w-3 h-3 !bg-purple-500"
      />
    </div>
  );
};

export default memo(AudioNode);
