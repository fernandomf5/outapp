import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Video } from 'lucide-react';

const VideoNode = ({ data, selected }: NodeProps) => {
  return (
    <div className={`bg-card rounded-lg border-2 p-4 shadow-lg min-w-[220px] max-w-[300px] transition-colors ${
      selected ? 'border-red-500 shadow-glow' : 'border-border'
    }`}>
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 !bg-red-500"
      />
      <div className="flex items-center gap-3 mb-2">
        <div className="bg-red-500/20 p-2 rounded-lg">
          <Video className="w-5 h-5 text-red-500" />
        </div>
        <div className="font-bold text-sm text-red-500">VÍDEO</div>
      </div>
      {data.videoUrl ? (
        <video controls className="w-full rounded-md mt-2">
          <source src={data.videoUrl} type="video/mp4" />
        </video>
      ) : (
        <div className="text-sm text-muted-foreground">Nenhum vídeo selecionado</div>
      )}
      <div className="text-sm text-foreground mt-2">{data.label}</div>
      {data.buttons && data.buttons.length > 0 && (
        <div className="space-y-2 mt-3">
          {data.buttons.map((button: string, index: number) => (
            <div key={index} className="relative">
              <div className="text-xs bg-red-500/20 px-3 py-2 rounded-md text-center border border-red-500/30 font-medium">
                {button}
              </div>
              <Handle
                type="source"
                position={Position.Right}
                id={`btn-${index}`}
                className="w-3 h-3 !bg-red-500"
                style={{ top: '50%', transform: 'translateY(-50%)' }}
              />
            </div>
          ))}
        </div>
      )}
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 !bg-red-500"
      />
    </div>
  );
};

export default memo(VideoNode);
