import { useState, useEffect } from 'react';
import { Node } from 'reactflow';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Trash2, Plus, X, Image as ImageIcon, FileAudio, Video, FileText, Check, Copy, MessageCircle, Key, ListFilter } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { ImageUpload } from './ImageUpload';
import { MediaUpload } from './MediaUpload';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface PropertiesPanelProps {
  selectedNode: Node | null;
  onUpdateNode: (id: string, data: any) => void;
  onDeleteNode: (id: string) => void;
  onDuplicateNode?: (node: Node) => void;
}

export const PropertiesPanel = ({
  selectedNode,
  onUpdateNode,
  onDeleteNode,
  onDuplicateNode,
}: PropertiesPanelProps) => {
  const [label, setLabel] = useState('');
  const [variable, setVariable] = useState('');
  const [buttons, setButtons] = useState<Array<{text: string, url?: string, id?: string}>>([]);
  const [newButton, setNewButton] = useState('');
  const [newButtonUrl, setNewButtonUrl] = useState('');
  const [actionType, setActionType] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [documentUrl, setDocumentUrl] = useState('');
  const [documentName, setDocumentName] = useState('');
  const [delaySeconds, setDelaySeconds] = useState<number>(0);
  const [keyword, setKeyword] = useState('');
  const [triggerType, setTriggerType] = useState<'any' | 'keyword' | 'buttons'>('any');

  useEffect(() => {
    if (selectedNode) {
      setLabel(selectedNode.data.label || '');
      setVariable(selectedNode.data.variable || '');
      // Converter botões antigos (strings) para novo formato (objetos)
      const buttonData = selectedNode.data.buttons || [];
      const normalizedButtons = buttonData.map((btn: any) => {
        if (typeof btn === 'string') return { text: btn, url: '', id: Math.random().toString(36).substring(2, 9) };
        return { ...btn, id: btn.id || Math.random().toString(36).substring(2, 9) };
      });
      setButtons(normalizedButtons);
      setActionType(selectedNode.data.actionType || '');
      setImageUrl(selectedNode.data.imageUrl || '');
      setAudioUrl(selectedNode.data.audioUrl || '');
      setVideoUrl(selectedNode.data.videoUrl || '');
      setDocumentUrl(selectedNode.data.documentUrl || '');
      setDocumentName(selectedNode.data.documentName || '');
      setDelaySeconds(selectedNode.data.delaySeconds || 0);
      setKeyword(selectedNode.data.keyword || '');
      setTriggerType(selectedNode.data.triggerType || 'any');
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
      keyword: keyword.trim(),
      triggerType,
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
      const updatedButtons = [...buttons, { 
        text: newButton.trim(), 
        url: newButtonUrl.trim(), 
        id: Math.random().toString(36).substr(2, 9) 
      }];
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
      case 'trigger': return 'Gatilho';
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
        {/* Configurações de Gatilho */}
        {selectedNode.type === 'trigger' && (
          <div className="space-y-6">
            <div>
              <Label className="text-base font-bold flex items-center gap-2 mb-4">
                <ListFilter className="w-5 h-5 text-primary" />
                Como o fluxo deve iniciar?
              </Label>
              <RadioGroup 
                value={triggerType} 
                onValueChange={(val: any) => {
                  setTriggerType(val);
                  let newLabel = "Iniciar com qualquer conversa";
                  if (val === 'keyword') newLabel = "Iniciar por palavra-chave";
                  if (val === 'buttons') newLabel = "Iniciar com menu de opções";
                  setLabel(newLabel);
                  onUpdateNode(selectedNode.id, { triggerType: val, label: newLabel });
                }}
                className="grid gap-4"
              >
                <div className="flex items-center space-x-3 space-y-0 rounded-lg border p-4 cursor-pointer hover:bg-accent/50 transition-colors">
                  <RadioGroupItem value="any" id="trigger-any" />
                  <Label htmlFor="trigger-any" className="flex-1 cursor-pointer">
                    <div className="font-bold flex items-center gap-2">
                      <MessageCircle className="w-4 h-4" />
                      Qualquer conversa
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">O fluxo inicia assim que o cliente enviar qualquer mensagem.</p>
                  </Label>
                </div>

                <div className="flex items-center space-x-3 space-y-0 rounded-lg border p-4 cursor-pointer hover:bg-accent/50 transition-colors">
                  <RadioGroupItem value="keyword" id="trigger-keyword" />
                  <Label htmlFor="trigger-keyword" className="flex-1 cursor-pointer">
                    <div className="font-bold flex items-center gap-2">
                      <Key className="w-4 h-4" />
                      Palavra-chave
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">O fluxo inicia apenas se o cliente digitar uma palavra específica (ex: "oi").</p>
                  </Label>
                </div>

                <div className="flex items-center space-x-3 space-y-0 rounded-lg border p-4 cursor-pointer hover:bg-accent/50 transition-colors">
                  <RadioGroupItem value="buttons" id="trigger-buttons" />
                  <Label htmlFor="trigger-buttons" className="flex-1 cursor-pointer">
                    <div className="font-bold flex items-center gap-2">
                      <ListFilter className="w-4 h-4" />
                      Menu de Botões
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">O chat já abre com botões para o cliente escolher como deseja iniciar.</p>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {triggerType === 'keyword' && (
              <div className="animate-in slide-in-from-top-2 duration-300">
                <Label htmlFor="trigger-keyword-input">Defina a Palavra-chave</Label>
                <Input
                  id="trigger-keyword-input"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  onBlur={handleUpdate}
                  placeholder="Ex: oi, suporte, ola"
                  className="mt-2"
                />
              </div>
            )}

            {triggerType === 'buttons' && (
              <div className="animate-in slide-in-from-top-2 duration-300">
                <Label htmlFor="trigger-msg-input">Mensagem de Boas-vindas</Label>
                <Textarea
                  id="trigger-msg-input"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  onBlur={handleUpdate}
                  placeholder="Olá! Como podemos ajudar hoje?"
                  className="mt-2"
                />
              </div>
            )}
          </div>
        )}

        {/* Palavra-chave - para todos os tipos exceto trigger */}
        {selectedNode.type !== 'trigger' && (
          <div>
            <Label htmlFor="keyword">Palavra-chave (opcional)</Label>
            <Input
              id="keyword"
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onBlur={handleUpdate}
              placeholder="Ex: suporte, vendas, preço..."
              className="mt-2"
              maxLength={50}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Se o usuário digitar esta palavra, este bloco será ativado automaticamente
            </p>
          </div>
        )}

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

        {/* Texto para todos os tipos exceto humanAgent e trigger */}
        {selectedNode.type === 'humanAgent' || selectedNode.type === 'trigger' ? null : ['image', 'audio', 'video', 'document'].includes(selectedNode.type) ? (
          <div>
            <Label htmlFor="label">Legenda (opcional)</Label>
            <Textarea
              id="label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              onBlur={handleUpdate}
              placeholder="Adicione uma legenda ao conteúdo..."
              className="mt-2 min-h-[80px]"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Texto que aparecerá junto com o {selectedNode.type === 'image' ? 'imagem' : selectedNode.type === 'audio' ? 'áudio' : selectedNode.type === 'video' ? 'vídeo' : 'documento'}
            </p>
          </div>
        ) : (
          <div>
            <Label htmlFor="label">Texto da Mensagem</Label>
            <Textarea
              id="label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              onBlur={handleUpdate}
              placeholder="Digite o texto da mensagem... (suporta {name} e {first_name})"
              className="mt-2 min-h-[120px]"
            />
            <p className="text-xs text-muted-foreground mt-1">Use variáveis: {`{name}`} ou {`{first_name}`}</p>
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
                  <Card key={button.id || index} className="p-3 space-y-2 relative group">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1 space-y-2">
                        <div>
                          <Label className="text-[10px] text-muted-foreground uppercase font-bold">Texto do Botão</Label>
                          <Input
                            value={button.text}
                            onChange={(e) => updateButtonText(index, e.target.value)}
                            placeholder="Texto do botão"
                            className="text-sm font-medium h-8"
                          />
                        </div>
                        <div>
                          <Label className="text-[10px] text-muted-foreground uppercase font-bold">Link (opcional)</Label>
                          <Input
                            value={button.url || ''}
                            onChange={(e) => updateButtonUrl(index, e.target.value)}
                            placeholder="https://exemplo.com"
                            className="text-xs h-8"
                          />
                        </div>
                        <div className="pt-1 flex items-center justify-between">
                          <span className="text-[10px] bg-accent px-1.5 py-0.5 rounded text-muted-foreground font-mono">
                            ID: {button.id?.substring(0, 6)}
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        type="button"
                        onClick={() => removeButton(index)}
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </Card>
                ))}
                <div className="bg-accent/30 p-4 rounded-lg border border-dashed border-border space-y-3">
                  <h4 className="text-xs font-bold flex items-center gap-2">
                    <Plus className="w-3 h-3" />
                    NOVO BOTÃO
                  </h4>
                  <div className="space-y-2">
                    <Input
                      value={newButton}
                      onChange={(e) => setNewButton(e.target.value)}
                      placeholder="Texto do botão..."
                      className="h-9"
                    />
                    <Input
                      value={newButtonUrl}
                      onChange={(e) => setNewButtonUrl(e.target.value)}
                      placeholder="Link (opcional)..."
                      className="h-9"
                    />
                    <Button 
                      size="sm" 
                      type="button" 
                      onClick={addButton}
                      className="w-full bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 h-9"
                    >
                      Confirmar Botão
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
        {/* Action Type */}
        {selectedNode.type === 'action' && (
          <div className="space-y-4">
            <Label htmlFor="actionType">Tipo de Ação</Label>
            <RadioGroup 
              value={actionType} 
              onValueChange={(val: string) => {
                setActionType(val);
                onUpdateNode(selectedNode.id, { actionType: val });
              }}
              className="grid gap-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="save_contact" id="save_contact" />
                <Label htmlFor="save_contact">Salvar Contato</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="update_tag" id="update_tag" />
                <Label htmlFor="update_tag">Adicionar Tag</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="notify_admin" id="notify_admin" />
                <Label htmlFor="notify_admin">Notificar Admin</Label>
              </div>
            </RadioGroup>
          </div>
        )}

        {/* Question Variable */}
        {selectedNode.type === 'question' && (
          <div className="space-y-4">
            <Label htmlFor="variable">Nome da Variável para Salvar</Label>
            <Input
              id="variable"
              value={variable}
              onChange={(e) => setVariable(e.target.value)}
              onBlur={handleUpdate}
              placeholder="Ex: nome_cliente, interesse, email"
            />
          </div>
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

        {selectedNode.id !== 'initial-message' && onDuplicateNode && (
          <Button
            variant="outline"
            className="w-full"
            onClick={() => onDuplicateNode(selectedNode)}
            type="button"
          >
            <Copy className="w-4 h-4 mr-2" />
            Duplicar Bloco
          </Button>
        )}

        {selectedNode.type !== 'trigger' && (
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
