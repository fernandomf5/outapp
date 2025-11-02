import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, ExternalLink, ArrowRight, Star, X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

interface FlowButton {
  text: string;
  action: 'link' | 'message';
  value: string;
}

interface Flow {
  id: string;
  name: string;
  message: string;
  is_start: boolean;
  buttons: FlowButton[];
  order_index: number;
  keywords: string[];
}

export function ChatbotFlowBuilder({ chatbotId }: { chatbotId: string }) {
  const [flows, setFlows] = useState<Flow[]>([]);
  const [editingFlow, setEditingFlow] = useState<Flow | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadFlows();
  }, [chatbotId]);

  const loadFlows = async () => {
    const { data, error } = await supabase
      .from('chatbot_flows')
      .select('*')
      .eq('chatbot_id', chatbotId)
      .order('order_index');

    if (error) {
      console.error('Error loading flows:', error);
      return;
    }

    // Cast Json to FlowButton[]
    const formattedFlows = (data || []).map(flow => ({
      ...flow,
      buttons: (flow.buttons as any) || [],
      keywords: (flow.keywords as any) || []
    }));

    setFlows(formattedFlows);
  };

  const createNewFlow = () => {
    const newFlow: Partial<Flow> = {
      name: 'Nova Mensagem',
      message: 'Olá! Como posso ajudar você?',
      is_start: flows.length === 0,
      buttons: [],
      keywords: [],
      order_index: flows.length,
    };
    setEditingFlow(newFlow as Flow);
    setIsCreating(true);
  };

  const saveFlow = async () => {
    if (!editingFlow) return;

    try {
      if (isCreating) {
        const { error } = await supabase
          .from('chatbot_flows')
          .insert({
            chatbot_id: chatbotId,
            name: editingFlow.name,
            message: editingFlow.message,
            is_start: editingFlow.is_start,
            buttons: editingFlow.buttons as any,
            keywords: editingFlow.keywords,
            order_index: editingFlow.order_index,
          });

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('chatbot_flows')
          .update({
            name: editingFlow.name,
            message: editingFlow.message,
            is_start: editingFlow.is_start,
            buttons: editingFlow.buttons as any,
            keywords: editingFlow.keywords,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingFlow.id);

        if (error) throw error;
      }

      toast({
        title: "Sucesso!",
        description: "Fluxo salvo com sucesso",
      });

      setEditingFlow(null);
      setIsCreating(false);
      loadFlows();
    } catch (error) {
      console.error('Error saving flow:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar o fluxo",
        variant: "destructive",
      });
    }
  };

  const deleteFlow = async (flowId: string) => {
    try {
      const { error } = await supabase
        .from('chatbot_flows')
        .delete()
        .eq('id', flowId);

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: "Fluxo excluído com sucesso",
      });

      loadFlows();
    } catch (error) {
      console.error('Error deleting flow:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o fluxo",
        variant: "destructive",
      });
    }
  };

  const addButton = () => {
    if (!editingFlow) return;
    setEditingFlow({
      ...editingFlow,
      buttons: [...editingFlow.buttons, { text: '', action: 'message', value: '' }],
    });
  };

  const removeButton = (index: number) => {
    if (!editingFlow) return;
    const newButtons = editingFlow.buttons.filter((_, i) => i !== index);
    setEditingFlow({ ...editingFlow, buttons: newButtons });
  };

  const updateButton = (index: number, field: keyof FlowButton, value: string) => {
    if (!editingFlow) return;
    const newButtons = [...editingFlow.buttons];
    newButtons[index] = { ...newButtons[index], [field]: value };
    setEditingFlow({ ...editingFlow, buttons: newButtons });
  };

  const [keywordInput, setKeywordInput] = useState("");

  const addKeyword = () => {
    if (!editingFlow || !keywordInput.trim()) return;
    const newKeyword = keywordInput.trim().toLowerCase();
    if (!editingFlow.keywords.includes(newKeyword)) {
      setEditingFlow({
        ...editingFlow,
        keywords: [...editingFlow.keywords, newKeyword],
      });
    }
    setKeywordInput("");
  };

  const removeKeyword = (keyword: string) => {
    if (!editingFlow) return;
    setEditingFlow({
      ...editingFlow,
      keywords: editingFlow.keywords.filter(k => k !== keyword),
    });
  };

  if (editingFlow) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{isCreating ? 'Criar Nova Mensagem' : 'Editar Mensagem'}</CardTitle>
          <CardDescription>
            Configure o texto e os botões desta mensagem
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Nome da Mensagem</Label>
            <Input
              value={editingFlow.name}
              onChange={(e) => setEditingFlow({ ...editingFlow, name: e.target.value })}
              placeholder="Ex: Boas-vindas, Catálogo de Produtos, etc"
            />
          </div>

          <div>
            <Label>Mensagem</Label>
            <Textarea
              value={editingFlow.message}
              onChange={(e) => setEditingFlow({ ...editingFlow, message: e.target.value })}
              placeholder="Digite a mensagem que será exibida..."
              rows={4}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              checked={editingFlow.is_start}
              onCheckedChange={(checked) => setEditingFlow({ ...editingFlow, is_start: checked })}
            />
            <Label>Mensagem Inicial (primeira mensagem que o cliente verá)</Label>
          </div>

          <div className="space-y-3">
            <div>
              <Label>Palavras-chave (o cliente digita e aciona esta mensagem)</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  value={keywordInput}
                  onChange={(e) => setKeywordInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addKeyword()}
                  placeholder="Ex: ajuda, suporte, preços..."
                />
                <Button onClick={addKeyword} type="button" variant="outline">
                  Adicionar
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                {editingFlow.keywords.map((keyword) => (
                  <div
                    key={keyword}
                    className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm flex items-center gap-2"
                  >
                    {keyword}
                    <button
                      onClick={() => removeKeyword(keyword)}
                      className="hover:text-destructive"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Botões</Label>
              <Button onClick={addButton} size="sm" variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Botão
              </Button>
            </div>

            {editingFlow.buttons.map((button, index) => (
              <Card key={index} className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Botão {index + 1}</Label>
                    <Button
                      onClick={() => removeButton(index)}
                      size="sm"
                      variant="ghost"
                      className="text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  <div>
                    <Label className="text-xs">Texto do Botão</Label>
                    <Input
                      value={button.text}
                      onChange={(e) => updateButton(index, 'text', e.target.value)}
                      placeholder="Ex: Ver Produtos"
                    />
                  </div>

                  <div>
                    <Label className="text-xs">Ação</Label>
                    <Select
                      value={button.action}
                      onValueChange={(value: 'link' | 'message') => updateButton(index, 'action', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="message">
                          <div className="flex items-center gap-2">
                            <ArrowRight className="w-4 h-4" />
                            Acionar Mensagem
                          </div>
                        </SelectItem>
                        <SelectItem value="link">
                          <div className="flex items-center gap-2">
                            <ExternalLink className="w-4 h-4" />
                            Abrir Link
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-xs">
                      {button.action === 'link' ? 'URL' : 'Próxima Mensagem'}
                    </Label>
                    {button.action === 'link' ? (
                      <Input
                        value={button.value}
                        onChange={(e) => updateButton(index, 'value', e.target.value)}
                        placeholder="https://..."
                      />
                    ) : (
                      <Select
                        value={button.value}
                        onValueChange={(value) => updateButton(index, 'value', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma mensagem" />
                        </SelectTrigger>
                        <SelectContent>
                          {flows.filter(f => f.id !== editingFlow.id).map((flow) => (
                            <SelectItem key={flow.id} value={flow.id}>
                              {flow.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <div className="flex gap-2">
            <Button onClick={saveFlow} className="flex-1">
              Salvar Mensagem
            </Button>
            <Button
              onClick={() => {
                setEditingFlow(null);
                setIsCreating(false);
              }}
              variant="outline"
              className="flex-1"
            >
              Cancelar
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Fluxos de Conversação</CardTitle>
            <CardDescription>
              Crie mensagens com botões para guiar seus clientes
            </CardDescription>
          </div>
          <Button onClick={createNewFlow}>
            <Plus className="w-4 h-4 mr-2" />
            Nova Mensagem
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {flows.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>Nenhuma mensagem criada ainda.</p>
            <p className="text-sm mt-2">Clique em "Nova Mensagem" para começar!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {flows.map((flow) => (
              <Card key={flow.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold">{flow.name}</h3>
                      {flow.is_start && (
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{flow.message}</p>
                    {flow.keywords && flow.keywords.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {flow.keywords.map((keyword, idx) => (
                          <span key={idx} className="text-xs px-2 py-0.5 bg-secondary/50 text-secondary-foreground rounded">
                            {keyword}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="flex flex-wrap gap-2">
                      {flow.buttons.map((button, idx) => (
                        <div
                          key={idx}
                          className="text-xs px-3 py-1 rounded-full bg-primary/10 text-primary flex items-center gap-1"
                        >
                          {button.action === 'link' ? (
                            <ExternalLink className="w-3 h-3" />
                          ) : (
                            <ArrowRight className="w-3 h-3" />
                          )}
                          {button.text}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => setEditingFlow(flow)}
                      size="sm"
                      variant="outline"
                    >
                      Editar
                    </Button>
                    <Button
                      onClick={() => deleteFlow(flow.id)}
                      size="sm"
                      variant="ghost"
                      className="text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
