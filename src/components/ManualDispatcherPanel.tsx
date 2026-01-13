import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  Camera, 
  Trash2, 
  Send, 
  User, 
  Phone,
  PhoneCall,
  MessageSquare,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Rocket,
  Users,
  Info,
  Save,
  FolderOpen,
  List,
  FileText,
  RotateCcw,
  RefreshCw,
  Bold,
  Italic,
  Strikethrough,
  Code,
  Eye,
  Edit3,
  Pencil,
  Download,
  Contact
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Lead {
  id: string;
  name: string;
  phone: string;
  selected: boolean;
  sent: boolean;
}

interface SavedList {
  id: string;
  name: string;
  leads: Lead[];
  message: string | null;
  total_leads: number;
  sent_count: number;
  created_at: string;
  updated_at: string;
}

interface SavedMessage {
  id: string;
  name: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export function ManualDispatcherPanel() {
  const { toast } = useToast();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [leads, setLeads] = useState<Lead[]>([]);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [message, setMessage] = useState('');
  const [isProcessingOCR, setIsProcessingOCR] = useState(false);
  const [isDispatching, setIsDispatching] = useState(false);
  const [currentDispatchIndex, setCurrentDispatchIndex] = useState(0);

  // Saved lists state
  const [savedLists, setSavedLists] = useState<SavedList[]>([]);
  const [isLoadingLists, setIsLoadingLists] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showListsDialog, setShowListsDialog] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [currentListId, setCurrentListId] = useState<string | null>(null);
  const [currentListName, setCurrentListName] = useState<string | null>(null);

  // Saved messages state
  const [savedMessages, setSavedMessages] = useState<SavedMessage[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [showSaveMessageDialog, setShowSaveMessageDialog] = useState(false);
  const [showMessagesDialog, setShowMessagesDialog] = useState(false);
  const [newMessageName, setNewMessageName] = useState('');
  const [isSavingMessage, setIsSavingMessage] = useState(false);
  const [currentMessageId, setCurrentMessageId] = useState<string | null>(null);
  const [currentMessageName, setCurrentMessageName] = useState<string | null>(null);

  const [editorTab, setEditorTab] = useState<'edit' | 'preview'>('edit');

  // Edit lead state
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [editLeadName, setEditLeadName] = useState('');
  const [showEditLeadDialog, setShowEditLeadDialog] = useState(false);

  const generateId = () => Math.random().toString(36).substring(2, 9);

  // Load saved lists and messages on mount
  useEffect(() => {
    if (user) {
      loadSavedLists();
      loadSavedMessages();
    }
  }, [user]);

  const loadSavedLists = async () => {
    if (!user) return;
    
    setIsLoadingLists(true);
    try {
      const { data, error } = await supabase
        .from('manual_dispatcher_lists')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      const lists: SavedList[] = (data || []).map(item => ({
        ...item,
        leads: Array.isArray(item.leads) ? (item.leads as unknown as Lead[]) : []
      }));

      setSavedLists(lists);
    } catch (error) {
      console.error('Error loading lists:', error);
    } finally {
      setIsLoadingLists(false);
    }
  };

  const loadSavedMessages = async () => {
    if (!user) return;
    
    setIsLoadingMessages(true);
    try {
      const { data, error } = await supabase
        .from('manual_dispatcher_messages')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      setSavedMessages(data || []);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const handleSaveList = async () => {
    if (!user) return;
    
    if (!newListName.trim() && !currentListId) {
      toast({
        title: "Nome obrigatório",
        description: "Dê um nome para salvar a lista.",
        variant: "destructive"
      });
      return;
    }

    if (leads.length === 0) {
      toast({
        title: "Lista vazia",
        description: "Adicione leads antes de salvar.",
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);
    try {
      const sentCount = leads.filter(l => l.sent).length;
      
      if (currentListId) {
        const { error } = await supabase
          .from('manual_dispatcher_lists')
          .update({
            leads: JSON.parse(JSON.stringify(leads)),
            message: message || null,
            total_leads: leads.length,
            sent_count: sentCount,
            name: newListName.trim() || currentListName || 'Lista sem nome'
          })
          .eq('id', currentListId);

        if (error) throw error;

        setCurrentListName(newListName.trim() || currentListName);

        toast({
          title: "Lista atualizada!",
          description: `"${newListName.trim() || currentListName}" foi salva com sucesso.`
        });
      } else {
        const { data, error } = await supabase
          .from('manual_dispatcher_lists')
          .insert([{
            user_id: user.id,
            name: newListName.trim(),
            leads: JSON.parse(JSON.stringify(leads)),
            message: message || null,
            total_leads: leads.length,
            sent_count: sentCount
          }])
          .select()
          .single();

        if (error) throw error;

        setCurrentListId(data.id);
        setCurrentListName(newListName.trim());

        toast({
          title: "Lista salva!",
          description: `"${newListName.trim()}" foi criada com sucesso.`
        });
      }

      setShowSaveDialog(false);
      setNewListName('');
      loadSavedLists();
    } catch (error) {
      console.error('Error saving list:', error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar a lista.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveMessage = async () => {
    if (!user) return;
    
    if (!newMessageName.trim() && !currentMessageId) {
      toast({
        title: "Nome obrigatório",
        description: "Dê um nome para salvar a mensagem.",
        variant: "destructive"
      });
      return;
    }

    if (!message.trim()) {
      toast({
        title: "Mensagem vazia",
        description: "Escreva uma mensagem antes de salvar.",
        variant: "destructive"
      });
      return;
    }

    setIsSavingMessage(true);
    try {
      if (currentMessageId) {
        const { error } = await supabase
          .from('manual_dispatcher_messages')
          .update({
            content: message,
            name: newMessageName.trim() || currentMessageName || 'Mensagem sem nome'
          })
          .eq('id', currentMessageId);

        if (error) throw error;

        setCurrentMessageName(newMessageName.trim() || currentMessageName);

        toast({
          title: "Mensagem atualizada!",
          description: `"${newMessageName.trim() || currentMessageName}" foi salva.`
        });
      } else {
        const { data, error } = await supabase
          .from('manual_dispatcher_messages')
          .insert([{
            user_id: user.id,
            name: newMessageName.trim(),
            content: message
          }])
          .select()
          .single();

        if (error) throw error;

        setCurrentMessageId(data.id);
        setCurrentMessageName(newMessageName.trim());

        toast({
          title: "Mensagem salva!",
          description: `"${newMessageName.trim()}" foi criada.`
        });
      }

      setShowSaveMessageDialog(false);
      setNewMessageName('');
      loadSavedMessages();
    } catch (error) {
      console.error('Error saving message:', error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar a mensagem.",
        variant: "destructive"
      });
    } finally {
      setIsSavingMessage(false);
    }
  };

  const handleLoadList = (list: SavedList, resetSent: boolean = false) => {
    const loadedLeads = resetSent 
      ? list.leads.map(l => ({ ...l, sent: false, selected: true }))
      : list.leads;
    
    setLeads(loadedLeads);
    if (list.message) {
      setMessage(list.message);
    }
    setCurrentListId(list.id);
    setCurrentListName(list.name);
    setShowListsDialog(false);

    toast({
      title: "Lista carregada!",
      description: resetSent 
        ? `"${list.name}" carregada. Status de envio resetado.`
        : `"${list.name}" foi carregada.`
    });
  };

  const handleLoadMessage = (savedMsg: SavedMessage) => {
    setMessage(savedMsg.content);
    setCurrentMessageId(savedMsg.id);
    setCurrentMessageName(savedMsg.name);
    setShowMessagesDialog(false);

    toast({
      title: "Mensagem carregada!",
      description: `"${savedMsg.name}" foi carregada.`
    });
  };

  const handleDeleteList = async (listId: string, listName: string) => {
    try {
      const { error } = await supabase
        .from('manual_dispatcher_lists')
        .delete()
        .eq('id', listId);

      if (error) throw error;

      if (currentListId === listId) {
        setCurrentListId(null);
        setCurrentListName(null);
      }

      toast({
        title: "Lista excluída!",
        description: `"${listName}" foi removida.`
      });

      loadSavedLists();
    } catch (error) {
      console.error('Error deleting list:', error);
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir a lista.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteMessage = async (msgId: string, msgName: string) => {
    try {
      const { error } = await supabase
        .from('manual_dispatcher_messages')
        .delete()
        .eq('id', msgId);

      if (error) throw error;

      if (currentMessageId === msgId) {
        setCurrentMessageId(null);
        setCurrentMessageName(null);
      }

      toast({
        title: "Mensagem excluída!",
        description: `"${msgName}" foi removida.`
      });

      loadSavedMessages();
    } catch (error) {
      console.error('Error deleting message:', error);
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir a mensagem.",
        variant: "destructive"
      });
    }
  };

  const handleNewList = () => {
    setLeads([]);
    setCurrentListId(null);
    setCurrentListName(null);
    toast({
      title: "Nova lista",
      description: "Lista limpa. Adicione novos leads."
    });
  };

  const handleNewMessage = () => {
    setMessage('');
    setCurrentMessageId(null);
    setCurrentMessageName(null);
  };

  // Format text functions
  const insertFormatting = (prefix: string, suffix: string = prefix) => {
    const textarea = document.querySelector('textarea[data-message-editor]') as HTMLTextAreaElement;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = message.substring(start, end);
    const newText = message.substring(0, start) + prefix + selectedText + suffix + message.substring(end);
    setMessage(newText);
    
    // Set cursor position after formatting
    setTimeout(() => {
      textarea.focus();
      if (selectedText) {
        textarea.setSelectionRange(start + prefix.length, end + prefix.length);
      } else {
        textarea.setSelectionRange(start + prefix.length, start + prefix.length);
      }
    }, 0);
  };

  const addBold = () => insertFormatting('*');
  const addItalic = () => insertFormatting('_');
  const addStrikethrough = () => insertFormatting('~');
  const addMonospace = () => insertFormatting('```');


  // Format message preview with WhatsApp formatting
  const formatWhatsAppPreview = (text: string) => {
    return text
      .replace(/\*([^*]+)\*/g, '<strong>$1</strong>')
      .replace(/_([^_]+)_/g, '<em>$1</em>')
      .replace(/~([^~]+)~/g, '<del>$1</del>')
      .replace(/```([^`]+)```/g, '<code class="bg-muted px-1 rounded">$1</code>');
  };

  const handleResetSentStatus = () => {
    setLeads(prev => prev.map(l => ({ ...l, sent: false, selected: true })));
    toast({
      title: "Status resetado!",
      description: "Todos os leads podem ser enviados novamente."
    });
  };

  const formatPhone = (phone: string) => {
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

  const handleEditLead = (lead: Lead) => {
    setEditingLead(lead);
    setEditLeadName(lead.name);
    setShowEditLeadDialog(true);
  };

  const handleSaveLeadEdit = () => {
    if (!editingLead || !editLeadName.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "O nome do lead não pode estar vazio.",
        variant: "destructive"
      });
      return;
    }

    setLeads(prev => prev.map(lead => 
      lead.id === editingLead.id ? { ...lead, name: editLeadName.trim() } : lead
    ));

    toast({
      title: "Lead atualizado",
      description: `Nome alterado para "${editLeadName.trim()}".`
    });

    setShowEditLeadDialog(false);
    setEditingLead(null);
    setEditLeadName('');
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

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Arquivo inválido",
        description: "Por favor, selecione uma imagem.",
        variant: "destructive"
      });
      return;
    }

    // Verificar sessão antes de iniciar
    const { data: sessionCheck } = await supabase.auth.getSession();
    if (!sessionCheck.session?.access_token) {
      toast({
        title: "Sessão expirada",
        description: "Por favor, faça login novamente.",
        variant: "destructive"
      });
      return;
    }

    setIsProcessingOCR(true);

    try {
      const reader = new FileReader();
      
      reader.onerror = () => {
        console.error('Erro ao ler arquivo');
        toast({
          title: "Erro ao ler imagem",
          description: "Não foi possível ler o arquivo selecionado.",
          variant: "destructive"
        });
        setIsProcessingOCR(false);
      };

      reader.onloadend = async () => {
        try {
          const base64Image = reader.result as string;

          if (!base64Image) {
            throw new Error('Imagem vazia');
          }

          console.log('Iniciando processamento OCR...');

          const { data, error } = await supabase.functions.invoke('parse-leads-from-image', {
            body: { imageDataUrl: base64Image }
          });

          if (error) {
            console.error('Edge function error:', error);
            const ctx: any = (error as any)?.context;
            const serverMsg =
              ctx?.json?.error ||
              ctx?.body?.error ||
              (typeof ctx?.body === "string" ? ctx.body : "") ||
              (data as any)?.error;
            throw new Error(serverMsg || error.message || 'Erro ao processar imagem');
          }

          if ((data as any)?.error) {
            throw new Error(String((data as any).error));
          }


          const extractedLeads = (data as any)?.leads;

          if (Array.isArray(extractedLeads) && extractedLeads.length > 0) {
            const newLeads: Lead[] = extractedLeads.map((lead: { name: string; phone: string }) => ({
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
        } catch (error) {
          console.error('Erro no processamento OCR:', error);
          toast({
            title: "Erro ao processar",
            description: error instanceof Error ? error.message : "Não foi possível extrair os dados da imagem.",
            variant: "destructive"
          });
        } finally {
          setIsProcessingOCR(false);
        }
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

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const replaceVariables = (text: string, lead: Lead) => {
    return text
      .replace(/{nome}/gi, lead.name)
      .replace(/{numero}/gi, lead.phone);
  };

  const openWhatsApp = (lead: Lead, markAsSent: boolean = false) => {
    if (!message.trim()) {
      toast({
        title: "Mensagem vazia",
        description: "Escreva uma mensagem antes de disparar.",
        variant: "destructive"
      });
      return;
    }

    const personalizedMessage = replaceVariables(message, lead);
    const encodedMessage = encodeURIComponent(personalizedMessage);
    const whatsappUrl = `https://web.whatsapp.com/send?phone=${lead.phone}&text=${encodedMessage}`;
    const newWindow = window.open(whatsappUrl, '_blank');

    if (markAsSent && newWindow) {
      setLeads(prev => prev.map(l => 
        l.id === lead.id ? { ...l, sent: true } : l
      ));
      toast({
        title: "WhatsApp aberto!",
        description: `Conversa com ${lead.name} pronta para envio.`
      });
    } else if (!newWindow) {
      toast({
        title: "Popup bloqueado!",
        description: "Permita popups clicando no ícone na barra de endereços.",
        variant: "destructive"
      });
    }
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

    toast({
      title: "Iniciando disparo...",
      description: `Abrindo ${selectedLeads.length} conversa(s). Permita popups se solicitado!`,
    });

    setIsDispatching(true);
    setCurrentDispatchIndex(0);

    let successCount = 0;
    let blockedCount = 0;

    for (let i = 0; i < selectedLeads.length; i++) {
      const lead = selectedLeads[i];
      setCurrentDispatchIndex(i + 1);
      
      const personalizedMessage = replaceVariables(message, lead);
      const encodedMessage = encodeURIComponent(personalizedMessage);
      const whatsappUrl = `https://web.whatsapp.com/send?phone=${lead.phone}&text=${encodedMessage}`;
      
      const newWindow = window.open(whatsappUrl, '_blank');
      
      if (newWindow) {
        successCount++;
        setLeads(prev => prev.map(l => 
          l.id === lead.id ? { ...l, sent: true } : l
        ));
      } else {
        blockedCount++;
        toast({
          title: "Popup bloqueado!",
          description: `Permita popups para o lead "${lead.name}".`,
          variant: "destructive"
        });
      }

      if (i < selectedLeads.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }

    setIsDispatching(false);

    if (blockedCount > 0) {
      toast({
        title: "Disparo parcial",
        description: `${successCount} aberta(s), ${blockedCount} bloqueada(s).`,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Disparo concluído!",
        description: `${successCount} conversa(s) aberta(s) no WhatsApp Web.`
      });
    }
  };

  const selectedCount = leads.filter(l => l.selected && !l.sent).length;
  const sentCount = leads.filter(l => l.sent).length;

  // Export leads as VCF (vCard) file for importing to phone contacts
  const exportAsVCF = () => {
    if (leads.length === 0) {
      toast({
        title: "Nenhum lead",
        description: "Adicione leads antes de exportar.",
        variant: "destructive"
      });
      return;
    }

    // Generate vCard format for each lead
    const vcfContent = leads.map(lead => {
      const nameParts = lead.name.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      
      return `BEGIN:VCARD
VERSION:3.0
FN:${lead.name}
N:${lastName};${firstName};;;
TEL;TYPE=CELL:${lead.phone}
END:VCARD`;
    }).join('\n');

    // Create and download file
    const blob = new Blob([vcfContent], { type: 'text/vcard;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `leads_${new Date().toISOString().split('T')[0]}.vcf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Contatos exportados!",
      description: `${leads.length} contato(s) exportado(s). Importe o arquivo .vcf no seu celular.`
    });
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3">
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
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowListsDialog(true)}
              className="h-8 text-xs gap-1.5"
            >
              <FolderOpen className="w-3.5 h-3.5" />
              Listas
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowMessagesDialog(true)}
              className="h-8 text-xs gap-1.5"
            >
              <FileText className="w-3.5 h-3.5" />
              Mensagens
            </Button>
          </div>
        </div>

        {/* Current selections */}
        <div className="flex items-center gap-2 flex-wrap">
          {currentListName && (
            <Badge variant="outline" className="flex items-center gap-1">
              <List className="w-3 h-3" />
              Lista: {currentListName}
            </Badge>
          )}
          {currentMessageName && (
            <Badge variant="outline" className="flex items-center gap-1">
              <MessageSquare className="w-3 h-3" />
              Msg: {currentMessageName}
            </Badge>
          )}
        </div>
      </div>

      {/* Stats badges */}
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
          {sentCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetSentStatus}
              className="h-6 text-xs gap-1 px-2"
            >
              <RotateCcw className="w-3 h-3" />
              Resetar envios
            </Button>
          )}
        </div>
      )}

      {/* Tip for adding contacts */}
      {leads.length > 0 && (
        <Card className="border-blue-500/50 bg-blue-500/5">
          <CardContent className="pt-4 pb-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <div className="flex items-start gap-3 flex-1">
                <Contact className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-blue-600">Dica: Adicione aos contatos primeiro</p>
                  <p className="text-muted-foreground mt-1">
                    Para evitar restrições do WhatsApp, salve os leads como contatos no celular antes de disparar.
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={exportAsVCF}
                className="h-8 text-xs gap-1.5 border-blue-500/50 text-blue-600 hover:bg-blue-500/10"
              >
                <Download className="w-3.5 h-3.5" />
                Exportar Contatos (.vcf)
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

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
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5" />
                  Mensagem Personalizada
                </CardTitle>
                <CardDescription>
                  Use formatação WhatsApp e anexe mídias
                </CardDescription>
              </div>
              <Tabs value={editorTab} onValueChange={(v) => setEditorTab(v as 'edit' | 'preview')}>
                <TabsList className="h-8">
                  <TabsTrigger value="edit" className="h-7 px-2 text-xs gap-1">
                    <Edit3 className="w-3 h-3" />
                    Editar
                  </TabsTrigger>
                  <TabsTrigger value="preview" className="h-7 px-2 text-xs gap-1">
                    <Eye className="w-3 h-3" />
                    Preview
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Formatting toolbar */}
            <div className="flex items-center gap-1 flex-wrap p-2 rounded-lg bg-muted/50 border border-border">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={addBold}>
                      <Bold className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Negrito (*texto*)</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={addItalic}>
                      <Italic className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Itálico (_texto_)</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={addStrikethrough}>
                      <Strikethrough className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Riscado (~texto~)</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={addMonospace}>
                      <Code className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Monoespaçado (```texto```)</TooltipContent>
                </Tooltip>

              </TooltipProvider>
            </div>

            {/* Editor / Preview tabs content */}
            {editorTab === 'edit' ? (
              <Textarea
                data-message-editor
                placeholder="Olá {nome}, tudo bem?&#10;&#10;Use *negrito*, _itálico_, ~riscado~&#10;&#10;Tenho uma oportunidade especial para você..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={6}
                className="text-sm resize-y min-h-[120px]"
              />
            ) : (
              <div className="p-4 rounded-lg bg-muted/30 border min-h-[120px]">
                {message ? (
                  <div className="space-y-3">
                    {/* Text preview with formatting */}
                    <p 
                      className="text-sm whitespace-pre-wrap"
                      dangerouslySetInnerHTML={{ 
                        __html: formatWhatsAppPreview(
                          leads.length > 0 
                            ? replaceVariables(message, leads[0]) 
                            : message.replace(/{nome}/gi, 'João').replace(/{numero}/gi, '5511999999999')
                        ) 
                      }}
                    />
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Escreva uma mensagem para visualizar...</p>
                )}
              </div>
            )}

            {/* Variables */}
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

            {/* WhatsApp Web note */}
            <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-500/5 border border-blue-500/20">
              <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-muted-foreground">
                <p className="font-medium text-blue-600 mb-1">Dica de formatação:</p>
                <p>A formatação de texto (*negrito*, _itálico_, ~riscado~, ```código```) funciona automaticamente no WhatsApp. Use as variáveis {'{nome}'} e {'{numero}'} para personalizar cada mensagem.</p>
              </div>
            </div>

            {/* Save message buttons */}
            {message.trim() && (
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setNewMessageName(currentMessageId ? currentMessageName || '' : '');
                    setShowSaveMessageDialog(true);
                  }}
                  className="flex-1 h-9 text-sm gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  {currentMessageId ? 'Atualizar Mensagem' : 'Salvar Mensagem'}
                </Button>
                {currentMessageId && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setCurrentMessageId(null);
                      setCurrentMessageName(null);
                      setNewMessageName('');
                      setShowSaveMessageDialog(true);
                    }}
                    className="h-9 text-sm gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    Nova
                  </Button>
                )}
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
              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowListsDialog(true)}
                  className="h-8 text-xs gap-1"
                >
                  <FolderOpen className="w-3.5 h-3.5" />
                  Carregar
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setNewListName(currentListName || '');
                    setShowSaveDialog(true);
                  }}
                  className="h-8 text-xs gap-1"
                >
                  <Save className="w-3.5 h-3.5" />
                  Salvar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAll}
                  className="h-8 text-xs"
                >
                  {leads.every(l => l.selected) ? 'Desmarcar' : 'Selecionar'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNewList}
                  className="h-8 text-xs"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Nova
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
                  className={`flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 p-3 rounded-lg border transition-colors ${
                    lead.sent 
                      ? 'bg-green-500/5 border-green-500/30' 
                      : lead.selected 
                        ? 'bg-primary/5 border-primary/30' 
                        : 'bg-muted/30 border-border'
                  }`}
                >
                  <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                    <Checkbox
                      checked={lead.selected}
                      onCheckedChange={() => handleToggleLead(lead.id)}
                      disabled={lead.sent}
                    />
                    
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm break-words">{lead.name}</p>
                      <p className="text-xs text-muted-foreground">{lead.phone}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 ml-6 sm:ml-0 flex-wrap sm:flex-nowrap">
                    {lead.sent ? (
                      <Badge variant="secondary" className="bg-green-500/10 text-green-600 text-xs">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Enviado
                      </Badge>
                    ) : (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditLead(lead)}
                          className="h-8 w-8"
                          title="Editar nome"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const cleanPhone = lead.phone.replace(/\D/g, '');
                            window.open(`tel:${cleanPhone}`, '_self');
                          }}
                          className="h-8 text-xs gap-1 sm:gap-1.5 px-2 sm:px-3"
                          title="Ligar para este contato"
                        >
                          <PhoneCall className="w-3.5 h-3.5" />
                          <span className="hidden xs:inline">Ligar</span>
                        </Button>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => openWhatsApp(lead, true)}
                          className="h-8 text-xs gap-1 sm:gap-1.5 px-2 sm:px-3"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span className="hidden xs:inline">Disparar</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveLead(lead.id)}
                          className="h-8 w-8 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}


      {/* Save List Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Save className="w-5 h-5" />
              {currentListId ? 'Salvar Lista' : 'Nova Lista'}
            </DialogTitle>
            <DialogDescription>
              {currentListId 
                ? 'Atualize o nome da lista ou mantenha o atual.'
                : 'Dê um nome para sua lista de leads.'
              }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="listName">Nome da Lista</Label>
              <Input
                id="listName"
                placeholder="Ex: Leads de Janeiro"
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
              />
            </div>
            <div className="text-sm text-muted-foreground">
              <p>{leads.length} lead(s) • {sentCount} enviado(s)</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveList} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Salvar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Save Message Dialog */}
      <Dialog open={showSaveMessageDialog} onOpenChange={setShowSaveMessageDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Save className="w-5 h-5" />
              {currentMessageId ? 'Salvar Mensagem' : 'Nova Mensagem'}
            </DialogTitle>
            <DialogDescription>
              Salve esta mensagem para usar novamente depois.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="messageName">Nome da Mensagem</Label>
              <Input
                id="messageName"
                placeholder="Ex: Promoção de Verão"
                value={newMessageName}
                onChange={(e) => setNewMessageName(e.target.value)}
              />
            </div>
            <div className="p-3 rounded-lg bg-muted/50 text-sm">
              <p className="line-clamp-3">{message}</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveMessageDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveMessage} disabled={isSavingMessage}>
              {isSavingMessage ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Salvar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Lists Dialog */}
      <Dialog open={showListsDialog} onOpenChange={setShowListsDialog}>
        <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FolderOpen className="w-5 h-5" />
              Minhas Listas
            </DialogTitle>
            <DialogDescription>
              Carregue uma lista salva. Você pode resetar o status de envio.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto py-4">
            {isLoadingLists ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : savedLists.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <List className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Nenhuma lista salva ainda.</p>
                <p className="text-sm">Adicione leads e clique em "Salvar Lista".</p>
              </div>
            ) : (
              <div className="space-y-2">
                {savedLists.map((list) => (
                  <div
                    key={list.id}
                    className={`p-3 rounded-lg border transition-colors hover:bg-muted/50 ${
                      currentListId === list.id ? 'border-primary bg-primary/5' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{list.name}</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <Badge variant="outline" className="text-xs">
                            {list.total_leads} lead(s)
                          </Badge>
                          {list.sent_count > 0 && (
                            <Badge variant="secondary" className="text-xs bg-green-500/10 text-green-600">
                              {list.sent_count} enviado(s)
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(list.updated_at).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteList(list.id, list.name)}
                          className="h-8 w-8 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3 flex-wrap">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleLoadList(list, false)}
                        className="flex-1 h-8 text-xs min-w-[80px]"
                      >
                        <FolderOpen className="w-3.5 h-3.5 mr-1" />
                        Carregar
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleLoadList(list, false)}
                        className="flex-1 h-8 text-xs min-w-[80px]"
                        title="Carregar para editar (adicionar/remover leads)"
                      >
                        <Users className="w-3.5 h-3.5 mr-1" />
                        Editar
                      </Button>
                      {list.sent_count > 0 && (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleLoadList(list, true)}
                          className="flex-1 h-8 text-xs min-w-[80px]"
                        >
                          <RefreshCw className="w-3.5 h-3.5 mr-1" />
                          Resetar
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowListsDialog(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Messages Dialog */}
      <Dialog open={showMessagesDialog} onOpenChange={setShowMessagesDialog}>
        <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Minhas Mensagens
            </DialogTitle>
            <DialogDescription>
              Carregue uma mensagem salva para usar no disparo.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto py-4">
            {isLoadingMessages ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : savedMessages.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Nenhuma mensagem salva ainda.</p>
                <p className="text-sm">Escreva uma mensagem e clique em "Salvar Mensagem".</p>
              </div>
            ) : (
              <div className="space-y-2">
                {savedMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`p-3 rounded-lg border transition-colors hover:bg-muted/50 cursor-pointer ${
                      currentMessageId === msg.id ? 'border-primary bg-primary/5' : ''
                    }`}
                    onClick={() => handleLoadMessage(msg)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{msg.name}</p>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {msg.content}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(msg.updated_at).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteMessage(msg.id, msg.name);
                        }}
                        className="h-8 w-8 text-destructive hover:text-destructive flex-shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMessagesDialog(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Lead Dialog */}
      <Dialog open={showEditLeadDialog} onOpenChange={setShowEditLeadDialog}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="w-5 h-5" />
              Editar Lead
            </DialogTitle>
            <DialogDescription>
              Altere o nome do lead abaixo.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="editLeadName">Nome do Lead</Label>
              <Input
                id="editLeadName"
                placeholder="Nome do cliente"
                value={editLeadName}
                onChange={(e) => setEditLeadName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSaveLeadEdit();
                  }
                }}
              />
            </div>
            {editingLead && (
              <div className="text-sm text-muted-foreground">
                <p>Telefone: {editingLead.phone}</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditLeadDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveLeadEdit}>
              <Save className="w-4 h-4 mr-2" />
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
