import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Volume2 } from 'lucide-react';

const AudioNode = ({ data, selected }: NodeProps) => {
  return (
    <div className={`bg-card rounded-lg border-2 p-4 shadow-lg min-w-[220px] max-w-[300px] transition-colors ${
      selected ? 'border-purple-500 shadow-glow' : 'border-border'
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
      <div className="text-sm text-foreground mt-2">{data.label}</div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 !bg-purple-500"
      />
    </div>
  );
};

export default memo(AudioNode);
