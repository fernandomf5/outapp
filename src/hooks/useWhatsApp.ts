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
      // Simular geração de QR Code
      // Em produção, isso chamaria a API do WhatsApp (Evolution API, Baileys, etc.)
      const mockQRCode = `data:image/svg+xml,${encodeURIComponent(`
        <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
          <rect width="200" height="200" fill="white"/>
          <text x="100" y="100" text-anchor="middle" font-size="12" fill="black">
            QR Code Mock
          </text>
          <text x="100" y="120" text-anchor="middle" font-size="10" fill="gray">
            ${Date.now()}
          </text>
        </svg>
      `)}`;

      // Simular tempo de conexão
      await new Promise(resolve => setTimeout(resolve, 2000));

      const mockPhoneNumber = `55${Math.floor(Math.random() * 10000000000)}`;

      // Salvar conexão no banco
      const { data, error } = await supabase.functions.invoke('whatsapp-webhook', {
        body: {
          action: 'connect',
          userId,
          phoneNumber: mockPhoneNumber,
        }
      });

      if (error) throw error;

      const newConnection: WhatsAppConnection = {
        id: data.connection.id,
        phone_number: mockPhoneNumber,
        is_connected: true,
        qr_code: mockQRCode,
      };

      setConnection(newConnection);

      toast({
        title: "WhatsApp Conectado! ✅",
        description: "Sua conta foi conectada com sucesso.",
      });

      return newConnection;
    } catch (error) {
      console.error('Erro ao conectar:', error);
      toast({
        title: "Erro na Conexão",
        description: "Não foi possível conectar ao WhatsApp. Tente novamente.",
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