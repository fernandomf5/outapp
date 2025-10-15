import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Node, Edge } from 'reactflow';

interface ChatbotData {
  id?: string;
  name: string;
  description?: string;
  config: {
    nodes: Node[];
    edges: Edge[];
  };
  is_active: boolean;
  user_id: string;
}

export const useChatbot = () => {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const saveChatbot = async (chatbotData: ChatbotData) => {
    setIsSaving(true);
    try {
      const { id, ...dataToSave } = chatbotData;
      
      if (id) {
        // Atualizar chatbot existente
        const { data, error } = await supabase
          .from('chatbots')
          .update({
            ...dataToSave,
            config: dataToSave.config as any,
          })
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;

        toast({
          title: "Chatbot atualizado! ✅",
          description: "Suas alterações foram salvas com sucesso.",
        });

        return data;
      } else {
        // Criar novo chatbot
        const { data, error } = await supabase
          .from('chatbots')
          .insert([{
            ...dataToSave,
            config: dataToSave.config as any,
          }])
          .select()
          .single();

        if (error) throw error;

        toast({
          title: "Chatbot criado! 🎉",
          description: "Seu chatbot foi criado com sucesso.",
        });

        return data;
      }
    } catch (error: any) {
      toast({
        title: "Erro ao salvar",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  const loadChatbot = async (chatbotId: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('chatbots')
        .select('*')
        .eq('id', chatbotId)
        .single();

      if (error) throw error;

      return data;
    } catch (error: any) {
      toast({
        title: "Erro ao carregar",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const toggleActive = async (chatbotId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('chatbots')
        .update({ is_active: isActive })
        .eq('id', chatbotId);

      if (error) throw error;

      toast({
        title: isActive ? "Chatbot ativado! ✅" : "Chatbot desativado",
        description: isActive 
          ? "Seu chatbot está ativo e pronto para uso." 
          : "Seu chatbot foi desativado.",
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  return {
    saveChatbot,
    loadChatbot,
    toggleActive,
    isSaving,
    isLoading,
  };
};
