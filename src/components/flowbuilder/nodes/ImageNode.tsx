import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Image as ImageIcon } from 'lucide-react';

const ImageNode = ({ data, selected }: NodeProps) => {
  return (
    <div className={`bg-card rounded-lg border-2 p-4 shadow-lg min-w-[220px] max-w-[300px] transition-colors ${
      selected ? 'border-blue-500 shadow-glow' : 'border-border'
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
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 !bg-blue-500"
      />
    </div>
  );
};

export default memo(ImageNode);
