import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

export interface AIAgent {
  id: string;
  name: string;
  niche: string;
  config: any;
  training_data: any;
  is_active: boolean;
  description?: string;
}

export const useAIAgent = () => {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const processMessage = useCallback(async (agentId: string, message: string, userId: string) => {
    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('process-ai-message', {
        body: {
          agentId,
          message,
          userId,
        }
      });

      if (error) throw error;

      return data.response;
    } catch (error) {
      console.error('Erro ao processar mensagem:', error);
      toast({
        title: "Erro ao processar",
        description: "Não foi possível processar a mensagem com IA.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsProcessing(false);
    }
  }, [toast]);

  const saveAgent = useCallback(async (agent: Partial<AIAgent>, userId: string) => {
    try {
      const agentData = {
        name: agent.name || 'Novo Agente',
        niche: agent.niche || '',
        config: agent.config || {},
        training_data: agent.training_data || {},
        is_active: agent.is_active ?? true,
        description: agent.description,
        user_id: userId,
        access_type: (agent as any).access_type || 'public',
        updated_at: new Date().toISOString(),
      };

      let result;
      if (agent.id) {
        // Update existing
        const { data, error } = await supabase
          .from('ai_agents')
          .update(agentData)
          .eq('id', agent.id)
          .select()
          .single();
        
        if (error) throw error;
        result = data;
      } else {
        // Insert new
        const { data, error } = await supabase
          .from('ai_agents')
          .insert(agentData)
          .select()
          .single();
        
        if (error) throw error;
        result = data;
      }

      toast({
        title: "Agente Salvo! 🚀",
        description: "Seu agente IA foi salvo com sucesso.",
      });

      return result;
    } catch (error) {
      console.error('Erro ao salvar agente:', error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar o agente IA.",
        variant: "destructive",
      });
      throw error;
    }
  }, [toast]);

  const loadAgent = useCallback(async (agentId: string) => {
    try {
      const { data, error } = await supabase
        .from('ai_agents')
        .select('*')
        .eq('id', agentId)
        .single();

      if (error) throw error;

      return data as AIAgent;
    } catch (error) {
      console.error('Erro ao carregar agente:', error);
      throw error;
    }
  }, []);

  return {
    isProcessing,
    processMessage,
    saveAgent,
    loadAgent,
  };
};