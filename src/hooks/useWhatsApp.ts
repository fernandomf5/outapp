import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

export interface WhatsAppConnection {
  id: string;
  phone_number: string;
  is_connected: boolean;
  qr_code?: string;
}

export const useWhatsApp = () => {
  const { toast } = useToast();
  const [isConnecting, setIsConnecting] = useState(false);
  const [connection, setConnection] = useState<WhatsAppConnection | null>(null);

  const connect = useCallback(async (userId: string) => {
    setIsConnecting(true);
    try {
      // Conectar usando WhatsApp Business API oficial
      const { data, error } = await supabase.functions.invoke('whatsapp-webhook', {
        body: {
          action: 'connect',
          userId,
        }
      });

      if (error) throw error;

      const newConnection: WhatsAppConnection = {
        id: data.connection.id,
        phone_number: data.connection.phone_number,
        is_connected: true,
      };

      setConnection(newConnection);

      toast({
        title: "WhatsApp Business Conectado! ✅",
        description: data.message || "Sua conta WhatsApp Business foi conectada com sucesso.",
      });

      return newConnection;
    } catch (error) {
      console.error('Erro ao conectar:', error);
      toast({
        title: "Erro na Conexão",
        description: "Não foi possível conectar ao WhatsApp Business. Verifique suas credenciais.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsConnecting(false);
    }
  }, [toast]);

  const disconnect = useCallback(async (userId: string, phoneNumber: string) => {
    try {
      await supabase.functions.invoke('whatsapp-webhook', {
        body: {
          action: 'disconnect',
          userId,
          phoneNumber,
        }
      });

      setConnection(null);

      toast({
        title: "Desconectado",
        description: "WhatsApp desconectado com sucesso.",
      });
    } catch (error) {
      console.error('Erro ao desconectar:', error);
      toast({
        title: "Erro",
        description: "Não foi possível desconectar.",
        variant: "destructive",
      });
    }
  }, [toast]);

  const sendMessage = useCallback(async (chatbotId: string, phoneNumber: string, message: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('whatsapp-webhook', {
        body: {
          action: 'send_message',
          chatbotId,
          phoneNumber,
          message,
        }
      });

      if (error) throw error;

      return data.response;
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      throw error;
    }
  }, []);

  return {
    connection,
    isConnecting,
    connect,
    disconnect,
    sendMessage,
  };
};