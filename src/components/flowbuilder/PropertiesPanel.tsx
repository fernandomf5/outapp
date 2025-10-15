import { useState, useEffect } from 'react';
import { Node } from 'reactflow';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Trash2, Plus, X, Image as ImageIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { ImageUpload } from './ImageUpload';
import { Separator } from '@/components/ui/separator';

interface PropertiesPanelProps {
  selectedNode: Node | null;
  onUpdateNode: (id: string, data: any) => void;
  onDeleteNode: (id: string) => void;
}

export const PropertiesPanel = ({
  selectedNode,
  onUpdateNode,
  onDeleteNode,
}: PropertiesPanelProps) => {
  const [label, setLabel] = useState('');
  const [variable, setVariable] = useState('');
  const [buttons, setButtons] = useState<string[]>([]);
  const [newButton, setNewButton] = useState('');
  const [actionType, setActionType] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  useEffect(() => {
    if (selectedNode) {
      setLabel(selectedNode.data.label || '');
      setVariable(selectedNode.data.variable || '');
      setButtons(selectedNode.data.buttons || []);
      setActionType(selectedNode.data.actionType || '');
      setImageUrl(selectedNode.data.imageUrl || '');
    }
  }, [selectedNode]);

  if (!selectedNode) {
    return (
      <aside className="w-96 bg-card/95 backdrop-blur-sm border-l border-border p-6 flex items-center justify-center">
        <p className="text-muted-foreground text-center">
          Selecione um bloco no canvas para editar suas propriedades
        </p>
      </aside>
    );
  }

  const handleUpdate = () => {
    onUpdateNode(selectedNode.id, {
      label,
      variable,
      buttons,
      actionType,
      imageUrl,
    });
  };

  const handleImageSelect = (url: string) => {
    setImageUrl(url);
    onUpdateNode(selectedNode.id, {
      ...selectedNode.data,
      imageUrl: url,
    });
  };

  const addButton = () => {
    if (newButton.trim()) {
      const updatedButtons = [...buttons, newButton.trim()];
      setButtons(updatedButtons);
      setNewButton('');
      onUpdateNode(selectedNode.id, {
        ...selectedNode.data,
        buttons: updatedButtons,
      });
    }
  };

  const removeButton = (index: number) => {
    const updatedButtons = buttons.filter((_, i) => i !== index);
    setButtons(updatedButtons);
    onUpdateNode(selectedNode.id, {
      ...selectedNode.data,
      buttons: updatedButtons,
    });
  };

  const getNodeTypeLabel = () => {
    switch (selectedNode.type) {
      case 'trigger': return 'Gatilho';
      case 'message': return 'Mensagem';
      case 'question': return 'Pergunta';
      case 'condition': return 'Condição';
      case 'action': return 'Ação';
      case 'quickReply': return 'Botões Rápidos';
      default: return 'Bloco';
    }
  };

  return (
    <aside className="w-96 bg-card/95 backdrop-blur-sm border-l border-border p-6 space-y-6 overflow-y-auto">
      <div>
        <h3 className="font-bold text-xl mb-2">Editar {getNodeTypeLabel()}</h3>
        <p className="text-sm text-muted-foreground">ID: {selectedNode.id}</p>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="label">
            {selectedNode.type === 'message' ? 'Mensagem' : 
             selectedNode.type === 'question' ? 'Pergunta' :
             selectedNode.type === 'condition' ? 'Condição' :
             'Conteúdo'}
          </Label>
          <Textarea
            id="label"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            onBlur={handleUpdate}
            placeholder="Digite o conteúdo..."
            className="mt-2 min-h-[120px]"
          />
          <p className="text-xs text-muted-foreground mt-2">
            {selectedNode.type === 'message' && '💡 Use variáveis como {{nome}}'}
            {selectedNode.type === 'question' && '💡 A resposta será salva automaticamente'}
            {selectedNode.type === 'condition' && '💡 Use operadores: ==, !=, >, <'}
          </p>
        </div>

        {selectedNode.type === 'question' && (
          <div>
            <Label htmlFor="variable">Salvar resposta em</Label>
            <Input
              id="variable"
              value={variable}
              onChange={(e) => setVariable(e.target.value)}
              onBlur={handleUpdate}
              placeholder="nome_variavel"
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-2">
              💡 Ex: nome, email, telefone
            </p>
          </div>
        )}

        {selectedNode.type === 'action' && (
          <div>
            <Label htmlFor="actionType">Tipo de Ação</Label>
            <Input
              id="actionType"
              value={actionType}
              onChange={(e) => setActionType(e.target.value)}
              onBlur={handleUpdate}
              placeholder="Ex: enviar_email, salvar_contato"
              className="mt-2"
            />
          </div>
        )}

        {selectedNode.type === 'quickReply' && (
          <div>
            <Label>Botões</Label>
            <div className="space-y-2 mt-2">
              {buttons.map((button, index) => (
                <Card key={index} className="p-3 flex items-center justify-between">
                  <span className="text-sm">{button}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeButton(index)}
                    className="h-8 w-8"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </Card>
              ))}
              <div className="flex gap-2">
                <Input
                  value={newButton}
                  onChange={(e) => setNewButton(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addButton()}
                  placeholder="Novo botão..."
                />
                <Button onClick={addButton} size="icon">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              💡 Máximo de 10 botões
            </p>
          </div>
        )}

        {/* Upload de Imagem - disponível para mensagem e quickReply */}
        {(selectedNode.type === 'message' || selectedNode.type === 'quickReply') && (
          <>
            <Separator className="my-4" />
            <div>
              <Label className="flex items-center gap-2 mb-3">
                <ImageIcon className="w-4 h-4" />
                Adicionar Imagem (opcional)
              </Label>
              <ImageUpload 
                onImageSelect={handleImageSelect}
                currentImage={imageUrl}
              />
            </div>
          </>
        )}
      </div>

      {selectedNode.type !== 'trigger' && (
        <Button
          variant="destructive"
          className="w-full"
          onClick={() => onDeleteNode(selectedNode.id)}
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Excluir Bloco
        </Button>
      )}

      <Card className="p-4 bg-muted/50">
        <h4 className="font-semibold text-sm mb-2">Dicas</h4>
        <ul className="text-xs text-muted-foreground space-y-1">
          <li>• Conecte os blocos arrastando as bolinhas</li>
          <li>• Use Ctrl + Scroll para zoom</li>
          <li>• Arraste o canvas para navegar</li>
          <li>• Clique no fundo para desselecionar</li>
        </ul>
      </Card>
    </aside>
  );
};
