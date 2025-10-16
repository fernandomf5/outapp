import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Image as ImageIcon } from 'lucide-react';

const ImageNode = ({ data, selected }: NodeProps) => {
  return (
    <div className={`bg-card rounded-lg border-2 p-4 min-w-[220px] max-w-[300px] transition-all duration-300 cursor-pointer ${
      selected 
        ? 'border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.5)] scale-105' 
        : 'border-border shadow-lg hover:shadow-[0_8px_30px_rgba(0,0,0,0.2)] hover:scale-102 hover:border-blue-400/50'
    }`}>
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 !bg-blue-500"
      />
      <div className="flex items-center gap-3 mb-2">
        <div className="bg-blue-500/20 p-2 rounded-lg">
          <ImageIcon className="w-5 h-5 text-blue-500" />
        </div>
        <div className="font-bold text-sm text-blue-500">IMAGEM</div>
      </div>
      {data.imageUrl ? (
        <div className="mb-3 rounded-md overflow-hidden">
          <img 
            src={data.imageUrl} 
            alt="Preview" 
            className="w-full h-32 object-cover"
          />
        </div>
      ) : (
        <div className="text-sm text-muted-foreground mb-2">Nenhuma imagem selecionada</div>
      )}
      <div className="text-sm text-foreground">{data.label}</div>
      {data.buttons && data.buttons.length > 0 && (
        <div className="space-y-2 mt-3">
          {data.buttons.map((button: string, index: number) => (
            <div key={index} className="relative">
              <div className="text-xs bg-blue-500/20 px-3 py-2 rounded-md text-center border border-blue-500/30 font-medium">
                {button}
              </div>
              <Handle
                type="source"
                position={Position.Right}
                id={`btn-${index}`}
                className="w-3 h-3 !bg-blue-500"
                style={{ top: '50%', transform: 'translateY(-50%)' }}
              />
            </div>
          ))}
        </div>
      )}
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 !bg-blue-500"
      />
    </div>
  );
};

export default memo(ImageNode);
