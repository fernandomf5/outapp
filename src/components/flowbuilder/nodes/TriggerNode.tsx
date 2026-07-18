import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Play, MessageCircle, Key, ListFilter } from 'lucide-react';

const TriggerNode = ({ data, selected }: NodeProps) => {
  const getIcon = () => {
    switch (data.triggerType) {
      case 'keyword': return <Key className="w-5 h-5 text-primary" />;
      case 'buttons': return <ListFilter className="w-5 h-5 text-primary" />;
      default: return <MessageCircle className="w-5 h-5 text-primary" />;
    }
  };

  const getLabel = () => {
    switch (data.triggerType) {
      case 'keyword': return `Palavra-chave: ${data.keyword || '...'}`;
      case 'buttons': return `Menu de Início`;
      default: return `Qualquer Mensagem`;
    }
  };

  return (
    <div className={`bg-card rounded-lg border-2 p-4 min-w-[220px] transition-all duration-300 cursor-pointer ${
      selected 
        ? 'border-primary shadow-[0_0_20px_rgba(139,92,246,0.5)] scale-105' 
        : 'border-border shadow-lg hover:shadow-[0_8px_30px_rgba(0,0,0,0.2)] hover:scale-102 hover:border-primary/50'
    }`}>
      <div className="flex items-center gap-3 mb-2">
        <div className="bg-primary/20 p-2 rounded-lg">
          {getIcon()}
        </div>
        <div className="font-bold text-sm text-primary uppercase tracking-wider">Gatilho</div>
      </div>
      <div className="text-sm text-foreground font-medium">{getLabel()}</div>
      {data.triggerType === 'buttons' && data.buttons?.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {data.buttons.map((btn: any, i: number) => (
            <div key={i} className="text-[10px] bg-muted px-1.5 py-0.5 rounded border border-border">
              {typeof btn === 'string' ? btn : btn.text}
            </div>
          ))}
        </div>
      )}
      {data.triggerType === 'buttons' && data.buttons?.length > 0 ? (
        <div className="space-y-1.5 mt-3">
          {data.buttons.map((button: any, index: number) => {
            const buttonText = typeof button === 'string' ? button : (button?.text || '');
            const buttonId = typeof button === 'object' ? button.id : `btn-${index}`;
            return (
              <div key={buttonId} className="relative">
                <div className="text-xs bg-primary/10 px-2 py-1.5 rounded-md text-center border border-primary/20 font-medium truncate">
                  {buttonText}
                </div>
                <Handle
                  type="source"
                  position={Position.Right}
                  id={buttonId}
                  className="w-3 h-3 !bg-primary"
                  style={{ top: '50%', transform: 'translateY(-50%)' }}
                />
              </div>
            );
          })}
        </div>
      ) : (
        <Handle
          type="source"
          position={Position.Bottom}
          className="w-3 h-3 !bg-primary"
        />
      )}
    </div>
  );
};

export default memo(TriggerNode);
