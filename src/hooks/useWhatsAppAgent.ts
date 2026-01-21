import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

export interface WhatsAppInstance {
  id: string;
  user_id: string;
  agent_id: string | null;
  instance_name: string;
  instance_key: string | null;
  phone_number: string | null;
  status: 'disconnected' | 'connecting' | 'connected' | 'qr_code';
  qr_code: string | null;
  qr_code_expires_at: string | null;
  webhook_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface KnowledgeBase {
  id: string;
  agent_id: string;
  title: string;
  content: string;
  content_type: 'text' | 'faq' | 'document' | 'url';
  metadata: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const useWhatsAppAgent = (agentId?: string) => {
  const { toast } = useToast();
  const [instances, setInstances] = useState<WhatsAppInstance[]>([]);
  const [knowledgeBase, setKnowledgeBase] = useState<KnowledgeBase[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<string>('disconnected');

  // Load instances
  const loadInstances = useCallback(async () => {
    if (!agentId) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('whatsapp_instances')
        .select('*')
        .eq('agent_id', agentId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInstances((data || []) as WhatsAppInstance[]);
    } catch (error) {
      console.error('Error loading instances:', error);
    } finally {
      setIsLoading(false);
    }
  }, [agentId]);

  // Load knowledge base
  const loadKnowledgeBase = useCallback(async () => {
    if (!agentId) return;
    
    try {
      const { data, error } = await supabase
        .from('agent_knowledge_base')
        .select('*')
        .eq('agent_id', agentId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setKnowledgeBase((data || []) as KnowledgeBase[]);
    } catch (error) {
      console.error('Error loading knowledge base:', error);
    }
  }, [agentId]);

  useEffect(() => {
    loadInstances();
    loadKnowledgeBase();
  }, [loadInstances, loadKnowledgeBase]);

  // Create new WhatsApp instance
  const createInstance = useCallback(async (userId: string, instanceName: string) => {
    if (!agentId) {
      toast({
        title: "Erro",
        description: "Selecione um agente primeiro.",
        variant: "destructive",
      });
      return null;
    }

    setIsCreating(true);
    try {
      const { data, error } = await supabase.functions.invoke('whatsapp-ai-agent', {
        body: {
          action: 'create_instance',
          userId,
          agentId,
          instanceName,
        }
      });

      if (error) throw error;

      if (data.error) {
        toast({
          title: "Erro",
          description: data.error,
          variant: "destructive",
        });
        return null;
      }

      toast({
        title: "Instância Criada! 🎉",
        description: "Escaneie o QR Code para conectar.",
      });

      await loadInstances();
      return data.instance;
    } catch (error) {
      console.error('Error creating instance:', error);
      toast({
        title: "Erro ao Criar",
        description: "Não foi possível criar a instância. Verifique as configurações.",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsCreating(false);
    }
  }, [agentId, toast, loadInstances]);

  // Get QR Code
  const getQrCode = useCallback(async (instanceKey: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('whatsapp-ai-agent', {
        body: {
          action: 'get_qrcode',
          instanceKey,
        }
      });

      if (error) throw error;

      if (data.qrcode?.base64) {
        setQrCode(data.qrcode.base64);
        setConnectionStatus('qr_code');
      }

      return data;
    } catch (error) {
      console.error('Error getting QR code:', error);
      return null;
    }
  }, []);

  // Check connection status
  const checkConnection = useCallback(async (instanceKey: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('whatsapp-ai-agent', {
        body: {
          action: 'check_connection',
          instanceKey,
        }
      });

      if (error) throw error;

      setConnectionStatus(data.status || 'disconnected');
      
      if (data.status === 'connected') {
        setQrCode(null);
        toast({
          title: "Conectado! ✅",
          description: "WhatsApp conectado com sucesso!",
        });
        await loadInstances();
      }

      return data;
    } catch (error) {
      console.error('Error checking connection:', error);
      return null;
    }
  }, [toast, loadInstances]);

  // Disconnect
  const disconnect = useCallback(async (instanceKey: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('whatsapp-ai-agent', {
        body: {
          action: 'disconnect',
          instanceKey,
        }
      });

      if (error) throw error;

      setConnectionStatus('disconnected');
      setQrCode(null);
      
      toast({
        title: "Desconectado",
        description: "WhatsApp desconectado.",
      });

      await loadInstances();
      return true;
    } catch (error) {
      console.error('Error disconnecting:', error);
      return false;
    }
  }, [toast, loadInstances]);

  // Send message
  const sendMessage = useCallback(async (
    instanceKey: string, 
    to: string, 
    text: string,
    mediaUrl?: string,
    mediaType?: 'image' | 'audio' | 'document'
  ) => {
    try {
      const { data, error } = await supabase.functions.invoke('whatsapp-ai-agent', {
        body: {
          action: 'send_message',
          instanceKey,
          to,
          text,
          mediaUrl,
          mediaType,
        }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Erro",
        description: "Não foi possível enviar a mensagem.",
        variant: "destructive",
      });
      return null;
    }
  }, [toast]);

  // Add knowledge base entry
  const addKnowledge = useCallback(async (
    title: string, 
    content: string, 
    contentType: 'text' | 'faq' | 'document' | 'url' = 'text'
  ) => {
    if (!agentId) return null;

    try {
      const { data, error } = await supabase
        .from('agent_knowledge_base')
        .insert({
          agent_id: agentId,
          title,
          content,
          content_type: contentType,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Conhecimento Adicionado! 📚",
        description: "O agente agora sabe sobre isso.",
      });

      await loadKnowledgeBase();
      return data;
    } catch (error) {
      console.error('Error adding knowledge:', error);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar o conhecimento.",
        variant: "destructive",
      });
      return null;
    }
  }, [agentId, toast, loadKnowledgeBase]);

  // Update knowledge base entry
  const updateKnowledge = useCallback(async (id: string, updates: Partial<KnowledgeBase>) => {
    try {
      const { error } = await supabase
        .from('agent_knowledge_base')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      await loadKnowledgeBase();
      return true;
    } catch (error) {
      console.error('Error updating knowledge:', error);
      return false;
    }
  }, [loadKnowledgeBase]);

  // Delete knowledge base entry
  const deleteKnowledge = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('agent_knowledge_base')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Removido",
        description: "Conhecimento removido com sucesso.",
      });

      await loadKnowledgeBase();
      return true;
    } catch (error) {
      console.error('Error deleting knowledge:', error);
      return false;
    }
  }, [toast, loadKnowledgeBase]);

  // Delete instance
  const deleteInstance = useCallback(async (instanceId: string, instanceKey: string) => {
    try {
      // Disconnect first
      await disconnect(instanceKey);

      // Delete from database
      const { error } = await supabase
        .from('whatsapp_instances')
        .delete()
        .eq('id', instanceId);

      if (error) throw error;

      toast({
        title: "Instância Removida",
        description: "Instância WhatsApp removida com sucesso.",
      });

      await loadInstances();
      return true;
    } catch (error) {
      console.error('Error deleting instance:', error);
      return false;
    }
  }, [disconnect, toast, loadInstances]);

  return {
    instances,
    knowledgeBase,
    isLoading,
    isCreating,
    qrCode,
    connectionStatus,
    createInstance,
    getQrCode,
    checkConnection,
    disconnect,
    sendMessage,
    addKnowledge,
    updateKnowledge,
    deleteKnowledge,
    deleteInstance,
    loadInstances,
    loadKnowledgeBase,
    setQrCode,
  };
};
