import { useState, useEffect } from 'react';
import { Node } from 'reactflow';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Trash2, Plus, X, Image as ImageIcon, FileAudio, Video, FileText, Check } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { ImageUpload } from './ImageUpload';
import { MediaUpload } from './MediaUpload';
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
  const [buttons, setButtons] = useState<Array<{text: string, url?: string}>>([]);
  const [newButton, setNewButton] = useState('');
  const [newButtonUrl, setNewButtonUrl] = useState('');
  const [actionType, setActionType] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [documentUrl, setDocumentUrl] = useState('');
  const [documentName, setDocumentName] = useState('');
  const [delaySeconds, setDelaySeconds] = useState<number>(0);

  useEffect(() => {
    if (selectedNode) {
      setLabel(selectedNode.data.label || '');
      setVariable(selectedNode.data.variable || '');
      // Converter botões antigos (strings) para novo formato (objetos)
      const buttonData = selectedNode.data.buttons || [];
      const normalizedButtons = buttonData.map((btn: any) => 
        typeof btn === 'string' ? { text: btn, url: '' } : btn
      );
      setButtons(normalizedButtons);
      setActionType(selectedNode.data.actionType || '');
      setImageUrl(selectedNode.data.imageUrl || '');
      setAudioUrl(selectedNode.data.audioUrl || '');
      setVideoUrl(selectedNode.data.videoUrl || '');
      setDocumentUrl(selectedNode.data.documentUrl || '');
      setDocumentName(selectedNode.data.documentName || '');
      setDelaySeconds(selectedNode.data.delaySeconds || 0);
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
      audioUrl,
      videoUrl,
      documentUrl,
      documentName,
      delaySeconds,
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
      const updatedButtons = [...buttons, { text: newButton.trim(), url: newButtonUrl.trim() }];
      setButtons(updatedButtons);
      setNewButton('');
      setNewButtonUrl('');
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

  const updateButtonUrl = (index: number, url: string) => {
    const updatedButtons = [...buttons];
    updatedButtons[index] = { ...updatedButtons[index], url };
    setButtons(updatedButtons);
    onUpdateNode(selectedNode.id, {
      ...selectedNode.data,
      buttons: updatedButtons,
    });
  };

  const updateButtonText = (index: number, text: string) => {
    const updatedButtons = [...buttons];
    updatedButtons[index] = { ...updatedButtons[index], text };
    setButtons(updatedButtons);
    onUpdateNode(selectedNode.id, {
      ...selectedNode.data,
      buttons: updatedButtons,
    });
  };

  const getNodeTypeLabel = () => {
    switch (selectedNode.type) {
      case 'text': return 'Texto';
      case 'button': return 'Botão';
      case 'image': return 'Imagem';
      case 'audio': return 'Áudio';
      case 'video': return 'Vídeo';
      case 'document': return 'Documento';
      case 'humanAgent': return 'Atendente Humano';
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
        {/* Atraso em segundos - para todos os tipos exceto trigger */}
        {selectedNode.type !== 'trigger' && (
          <div>
            <Label htmlFor="delay">Atraso em segundos (opcional)</Label>
            <Input
              id="delay"
              type="number"
              min="0"
              max="60"
              value={delaySeconds}
              onChange={(e) => setDelaySeconds(Number(e.target.value))}
              onBlur={handleUpdate}
              placeholder="0"
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Simula efeito de "digitando" antes de mostrar a mensagem
            </p>
          </div>
        )}

        {/* Texto para todos os tipos exceto image, audio, video, document, humanAgent */}
        {!['image', 'audio', 'video', 'document', 'humanAgent'].includes(selectedNode.type) && (
          <div>
            <Label htmlFor="label">Texto da Mensagem</Label>
            <Textarea
              id="label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              onBlur={handleUpdate}
              placeholder="Digite o texto da mensagem..."
              className="mt-2 min-h-[120px]"
            />
          </div>
        )}

        {/* Mensagem para Atendente Humano */}
        {selectedNode.type === 'humanAgent' && (
          <div className="space-y-4">
            <div className="bg-pink-500/10 border border-pink-500/30 rounded-lg p-4">
              <h4 className="font-semibold text-sm text-pink-600 mb-2">Transferência para Atendente</h4>
              <p className="text-xs text-muted-foreground">
                Quando o usuário chegar neste bloco, a conversa será transferida para um atendente humano. 
                O chat aparecerá no painel de conversas do dashboard.
              </p>
            </div>
            <div>
              <Label htmlFor="label">Mensagem de Transferência (opcional)</Label>
              <Textarea
                id="label"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                onBlur={handleUpdate}
                placeholder="Ex: Aguarde, você está sendo transferido para um atendente..."
                className="mt-2 min-h-[80px]"
              />
            </div>
          </div>
        )}

        {/* Upload de Imagem */}
        {selectedNode.type === 'image' && (
          <>
            <Separator className="my-4" />
            <div>
              <Label className="flex items-center gap-2 mb-3">
                <ImageIcon className="w-4 h-4" />
                {selectedNode.type === 'image' ? 'Imagem' : 'Adicionar Imagem (opcional)'}
              </Label>
              <ImageUpload 
                onImageSelect={handleImageSelect}
                currentImage={imageUrl}
              />
            </div>
          </>
        )}

        {/* Upload de Áudio */}
        {selectedNode.type === 'audio' && (
          <>
            <Separator className="my-4" />
            <div>
              <Label className="flex items-center gap-2 mb-3">
                <FileAudio className="w-4 h-4" />
                Arquivo de Áudio
              </Label>
              <MediaUpload 
                mediaType="audio"
                onMediaSelect={(url) => {
                  setAudioUrl(url);
                  onUpdateNode(selectedNode.id, { ...selectedNode.data, audioUrl: url });
                }}
                currentMedia={audioUrl}
              />
            </div>
          </>
        )}

        {/* Upload de Vídeo */}
        {selectedNode.type === 'video' && (
          <>
            <Separator className="my-4" />
            <div>
              <Label className="flex items-center gap-2 mb-3">
                <Video className="w-4 h-4" />
                Arquivo de Vídeo
              </Label>
              <MediaUpload 
                mediaType="video"
                onMediaSelect={(url) => {
                  setVideoUrl(url);
                  onUpdateNode(selectedNode.id, { ...selectedNode.data, videoUrl: url });
                }}
                currentMedia={videoUrl}
              />
            </div>
          </>
        )}

        {/* Upload de Documento */}
        {selectedNode.type === 'document' && (
          <>
            <Separator className="my-4" />
            <div>
              <Label className="flex items-center gap-2 mb-3">
                <FileText className="w-4 h-4" />
                Arquivo (PDF, DOC, etc)
              </Label>
              <MediaUpload 
                mediaType="document"
                onMediaSelect={(url, fileName) => {
                  setDocumentUrl(url);
                  setDocumentName(fileName || '');
                  onUpdateNode(selectedNode.id, { 
                    ...selectedNode.data, 
                    documentUrl: url,
                    documentName: fileName 
                  });
                }}
                currentMedia={documentUrl}
                currentFileName={documentName}
              />
            </div>
          </>
        )}

        {/* Botões para todos os tipos de blocos */}
        {!['humanAgent', 'trigger'].includes(selectedNode.type) && (
          <>
            <Separator className="my-4" />
            <div>
              <Label>Botões (opcional)</Label>
              <p className="text-xs text-muted-foreground mt-1 mb-3">
                Adicione botões com links para redirecionar usuários
              </p>
              <div className="space-y-3">
                {buttons.map((button, index) => (
                  <Card key={index} className="p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <Input
                        value={button.text}
                        onChange={(e) => updateButtonText(index, e.target.value)}
                        placeholder="Texto do botão"
                        className="text-sm font-medium"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        type="button"
                        onClick={() => removeButton(index)}
                        className="h-8 w-8 ml-2"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Link (opcional)</Label>
                      <Input
                        value={button.url || ''}
                        onChange={(e) => updateButtonUrl(index, e.target.value)}
                        placeholder="https://exemplo.com"
                        className="text-xs mt-1"
                      />
                    </div>
                  </Card>
                ))}
                <div className="space-y-2">
                  <Input
                    value={newButton}
                    onChange={(e) => setNewButton(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        e.stopPropagation();
                        addButton();
                      }
                    }}
                    placeholder="Texto do botão (pressione Enter)"
                  />
                  <Input
                    value={newButtonUrl}
                    onChange={(e) => setNewButtonUrl(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        e.stopPropagation();
                        addButton();
                      }
                    }}
                    placeholder="https://exemplo.com (opcional, pressione Enter)"
                  />
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="space-y-3">
        <Button
          variant="default"
          className="w-full bg-green-600 hover:bg-green-700 text-white"
          onClick={handleUpdate}
          type="button"
        >
          <Check className="w-4 h-4 mr-2" />
          Aplicar
        </Button>

        {selectedNode.id !== 'initial-message' && (
          <Button
            variant="destructive"
            className="w-full"
            onClick={() => onDeleteNode(selectedNode.id)}
            type="button"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Excluir Bloco
          </Button>
        )}
      </div>
    </aside>
  );
};
