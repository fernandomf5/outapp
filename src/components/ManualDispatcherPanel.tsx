import { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus, 
  Camera, 
  Trash2, 
  Send, 
  User, 
  Phone, 
  MessageSquare,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Upload,
  Rocket,
  Users,
  Info
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Lead {
  id: string;
  name: string;
  phone: string;
  selected: boolean;
  sent: boolean;
}

export function ManualDispatcherPanel() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [leads, setLeads] = useState<Lead[]>([]);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [message, setMessage] = useState('');
  const [isProcessingOCR, setIsProcessingOCR] = useState(false);
  const [isDispatching, setIsDispatching] = useState(false);
  const [currentDispatchIndex, setCurrentDispatchIndex] = useState(0);

  const generateId = () => Math.random().toString(36).substring(2, 9);

  const formatPhone = (phone: string) => {
    // Remove tudo que não é número
    return phone.replace(/\D/g, '');
  };

  const handleAddLead = () => {
    if (!newName.trim() || !newPhone.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha o nome e o número do lead.",
        variant: "destructive"
      });
      return;
    }

    const formattedPhone = formatPhone(newPhone);
    
    if (formattedPhone.length < 10) {
      toast({
        title: "Número inválido",
        description: "O número deve ter pelo menos 10 dígitos (com DDD).",
        variant: "destructive"
      });
      return;
    }

    const newLead: Lead = {
      id: generateId(),
      name: newName.trim(),
      phone: formattedPhone,
      selected: true,
      sent: false
    };

    setLeads(prev => [...prev, newLead]);
    setNewName('');
    setNewPhone('');

    toast({
      title: "Lead adicionado",
      description: `${newLead.name} foi adicionado à lista.`
    });
  };

  const handleRemoveLead = (id: string) => {
    setLeads(prev => prev.filter(lead => lead.id !== id));
  };

  const handleToggleLead = (id: string) => {
    setLeads(prev => prev.map(lead => 
      lead.id === id ? { ...lead, selected: !lead.selected } : lead
    ));
  };

  const handleSelectAll = () => {
    const allSelected = leads.every(lead => lead.selected);
    setLeads(prev => prev.map(lead => ({ ...lead, selected: !allSelected })));
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Verificar se é uma imagem
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Arquivo inválido",
        description: "Por favor, selecione uma imagem.",
        variant: "destructive"
      });
      return;
    }

    setIsProcessingOCR(true);

    try {
      // Converter imagem para base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Image = reader.result as string;

        // Usar a API de IA para OCR
        const { data: sessionData } = await supabase.auth.getSession();
        
        const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${sessionData.session?.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              {
                role: 'user',
                content: [
                  {
                    type: 'text',
                    text: `Analise esta imagem e extraia todos os nomes e números de telefone que encontrar. 
                    
Retorne APENAS no formato JSON, sem markdown, sem explicações:
{
  "leads": [
    {"name": "Nome da Pessoa", "phone": "5585999999999"},
    {"name": "Outro Nome", "phone": "5588888888888"}
  ]
}

Se não encontrar nomes ou números, retorne: {"leads": []}

Importante:
- Números devem conter apenas dígitos
- Adicione o código do país 55 se não estiver presente
- Se houver apenas número sem nome, use "Lead" + número sequencial como nome`
                  },
                  {
                    type: 'image_url',
                    image_url: { url: base64Image }
                  }
                ]
              }
            ],
            max_tokens: 1000
          })
        });

        if (!response.ok) {
          throw new Error('Erro ao processar imagem');
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || '';

        try {
          // Tentar fazer parse do JSON
          const cleanContent = content.replace(/```json\n?|\n?```/g, '').trim();
          const parsed = JSON.parse(cleanContent);

          if (parsed.leads && Array.isArray(parsed.leads) && parsed.leads.length > 0) {
            const newLeads: Lead[] = parsed.leads.map((lead: { name: string; phone: string }) => ({
              id: generateId(),
              name: lead.name || 'Lead',
              phone: formatPhone(lead.phone),
              selected: true,
              sent: false
            }));

            setLeads(prev => [...prev, ...newLeads]);

            toast({
              title: "OCR concluído!",
              description: `${newLeads.length} lead(s) extraído(s) da imagem.`
            });
          } else {
            toast({
              title: "Nenhum lead encontrado",
              description: "Não foi possível identificar nomes e números na imagem.",
              variant: "destructive"
            });
          }
        } catch (parseError) {
          console.error('Erro ao fazer parse:', parseError, content);
          toast({
            title: "Erro ao processar",
            description: "Não foi possível extrair os dados da imagem.",
            variant: "destructive"
          });
        }

        setIsProcessingOCR(false);
      };

      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Erro no OCR:', error);
      toast({
        title: "Erro no OCR",
        description: "Não foi possível processar a imagem.",
        variant: "destructive"
      });
      setIsProcessingOCR(false);
    }

    // Limpar input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const replaceVariables = (text: string, lead: Lead) => {
    return text
      .replace(/{nome}/gi, lead.name)
      .replace(/{numero}/gi, lead.phone);
  };

  const openWhatsApp = (lead: Lead) => {
    const personalizedMessage = replaceVariables(message, lead);
    const encodedMessage = encodeURIComponent(personalizedMessage);
    const whatsappUrl = `https://web.whatsapp.com/send?phone=${lead.phone}&text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleDispatch = async () => {
    const selectedLeads = leads.filter(lead => lead.selected && !lead.sent);
    
    if (selectedLeads.length === 0) {
      toast({
        title: "Nenhum lead selecionado",
        description: "Selecione pelo menos um lead para disparar.",
        variant: "destructive"
      });
      return;
    }

    if (!message.trim()) {
      toast({
        title: "Mensagem vazia",
        description: "Escreva uma mensagem para enviar.",
        variant: "destructive"
      });
      return;
    }

    setIsDispatching(true);
    setCurrentDispatchIndex(0);

    // Abrir uma aba por vez com intervalo
    for (let i = 0; i < selectedLeads.length; i++) {
      const lead = selectedLeads[i];
      setCurrentDispatchIndex(i + 1);
      
      openWhatsApp(lead);
      
      // Marcar como enviado
      setLeads(prev => prev.map(l => 
        l.id === lead.id ? { ...l, sent: true } : l
      ));

      // Aguardar 2 segundos entre cada abertura
      if (i < selectedLeads.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    setIsDispatching(false);

    toast({
      title: "Disparo concluído!",
      description: `${selectedLeads.length} conversa(s) aberta(s) no WhatsApp Web.`
    });
  };

  const selectedCount = leads.filter(l => l.selected && !l.sent).length;
  const sentCount = leads.filter(l => l.sent).length;

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <Rocket className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
            Disparador Manual
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Envie mensagens personalizadas via WhatsApp Web
          </p>
        </div>
        {leads.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              {leads.length} lead(s)
            </Badge>
            {selectedCount > 0 && (
              <Badge variant="default" className="flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                {selectedCount} selecionado(s)
              </Badge>
            )}
            {sentCount > 0 && (
              <Badge variant="secondary" className="flex items-center gap-1 bg-green-500/10 text-green-600">
                <Send className="w-3 h-3" />
                {sentCount} enviado(s)
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Aviso importante */}
      <Card className="border-amber-500/50 bg-amber-500/5">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-amber-600">Importante</p>
              <p className="text-muted-foreground mt-1">
                Este recurso abre conversas individualmente no WhatsApp Web. 
                Não é disparo automático em massa, garantindo segurança para sua conta.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:gap-6 lg:grid-cols-2">
        {/* Bloco 1 - Cadastro de Leads */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
              Cadastro de Leads
            </CardTitle>
            <CardDescription>
              Adicione leads manualmente ou importe via foto
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Campos manuais */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="leadName" className="text-xs sm:text-sm flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" />
                  Nome
                </Label>
                <Input
                  id="leadName"
                  placeholder="Nome do lead"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddLead()}
                  className="h-9 sm:h-10 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="leadPhone" className="text-xs sm:text-sm flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5" />
                  Número (com DDI)
                </Label>
                <Input
                  id="leadPhone"
                  placeholder="5585999999999"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddLead()}
                  className="h-9 sm:h-10 text-sm"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <Button 
                onClick={handleAddLead} 
                className="flex-1 h-9 sm:h-10 text-sm"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                Adicionar Lead
              </Button>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessingOCR}
                className="flex-1 h-9 sm:h-10 text-sm"
              >
                {isProcessingOCR ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    <Camera className="w-4 h-4 mr-1.5" />
                    Importar por Foto
                  </>
                )}
              </Button>
            </div>

            {/* Dica OCR */}
            <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50">
              <Info className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <p className="text-xs text-muted-foreground">
                Tire uma foto de uma lista com nomes e números. O sistema irá extrair automaticamente os dados.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Bloco 3 - Mensagem */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5" />
              Mensagem Personalizada
            </CardTitle>
            <CardDescription>
              Escreva sua mensagem usando variáveis
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="Olá {nome}, tudo bem?&#10;Tenho uma oportunidade especial para você..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              className="text-sm resize-none"
            />

            {/* Variáveis disponíveis */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Variáveis disponíveis:</p>
              <div className="flex flex-wrap gap-2">
                <Badge 
                  variant="secondary" 
                  className="cursor-pointer hover:bg-secondary/80 text-xs"
                  onClick={() => setMessage(prev => prev + '{nome}')}
                >
                  {'{nome}'}
                </Badge>
                <Badge 
                  variant="secondary" 
                  className="cursor-pointer hover:bg-secondary/80 text-xs"
                  onClick={() => setMessage(prev => prev + '{numero}')}
                >
                  {'{numero}'}
                </Badge>
              </div>
            </div>

            {/* Preview */}
            {message && leads.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Preview (primeiro lead):</p>
                <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                  <p className="text-sm whitespace-pre-wrap">
                    {replaceVariables(message, leads[0])}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bloco 2 - Lista de Leads */}
      {leads.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                  <Users className="w-4 h-4 sm:w-5 sm:h-5" />
                  Lista de Leads
                </CardTitle>
                <CardDescription>
                  {leads.length} lead(s) cadastrado(s)
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAll}
                  className="h-8 text-xs"
                >
                  {leads.every(l => l.selected) ? 'Desmarcar Todos' : 'Selecionar Todos'}
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setLeads([])}
                  className="h-8 text-xs"
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1" />
                  Limpar
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
              {leads.map((lead) => (
                <div
                  key={lead.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                    lead.sent 
                      ? 'bg-green-500/5 border-green-500/30' 
                      : lead.selected 
                        ? 'bg-primary/5 border-primary/30' 
                        : 'bg-muted/30 border-border'
                  }`}
                >
                  <Checkbox
                    checked={lead.selected}
                    onCheckedChange={() => handleToggleLead(lead.id)}
                    disabled={lead.sent}
                  />
                  
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{lead.name}</p>
                    <p className="text-xs text-muted-foreground">{lead.phone}</p>
                  </div>

                  {lead.sent ? (
                    <Badge variant="secondary" className="bg-green-500/10 text-green-600 text-xs">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Enviado
                    </Badge>
                  ) : (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveLead(lead.id)}
                      className="h-8 w-8 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bloco 4 - Ação */}
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="flex-1 text-center sm:text-left">
              <p className="font-medium text-sm sm:text-base">
                {isDispatching 
                  ? `Disparando... ${currentDispatchIndex}/${selectedCount}`
                  : selectedCount > 0 
                    ? `${selectedCount} lead(s) pronto(s) para disparo`
                    : 'Adicione e selecione leads para disparar'
                }
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Cada conversa será aberta em uma nova aba do WhatsApp Web
              </p>
            </div>
            
            <Button
              size="lg"
              onClick={handleDispatch}
              disabled={isDispatching || selectedCount === 0 || !message.trim()}
              className="w-full sm:w-auto h-11 sm:h-12 text-sm sm:text-base px-6 sm:px-8"
            >
              {isDispatching ? (
                <>
                  <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 mr-2 animate-spin" />
                  Disparando...
                </>
              ) : (
                <>
                  <Rocket className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  Disparar Manualmente
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
