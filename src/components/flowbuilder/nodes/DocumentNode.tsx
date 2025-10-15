import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { FileText } from 'lucide-react';

const DocumentNode = ({ data, selected }: NodeProps) => {
  return (
    <div className={`bg-card rounded-lg border-2 p-4 shadow-lg min-w-[220px] max-w-[300px] transition-colors ${
      selected ? 'border-amber-500 shadow-glow' : 'border-border'
    }`}>
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 !bg-amber-500"
      />
      <div className="flex items-center gap-3 mb-2">
        <div className="bg-amber-500/20 p-2 rounded-lg">
          <FileText className="w-5 h-5 text-amber-500" />
        </div>
        <div className="font-bold text-sm text-amber-500">DOCUMENTO</div>
      </div>
      {data.documentUrl ? (
        <div className="flex items-center gap-2 p-2 bg-accent/50 rounded-md">
          <FileText className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs text-foreground truncate">{data.documentName || 'Documento'}</span>
        </div>
      ) : (
        <div className="text-sm text-muted-foreground">Nenhum documento selecionado</div>
      )}
      <div className="text-sm text-foreground mt-2">{data.label}</div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 !bg-amber-500"
      />
    </div>
  );
};

export default memo(DocumentNode);
