import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useMercadoPago = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const createPayment = async (planId: string) => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Você precisa estar logado');
      }

      const { data, error } = await supabase.functions.invoke('create-payment-preference', {
        body: { planId },
      });

      if (error) throw error;

      if (data.init_point) {
        // Redirecionar para página de pagamento do Mercado Pago
        window.location.href = data.init_point;
      } else {
        throw new Error('Link de pagamento não gerado');
      }
    } catch (error: any) {
      console.error('Error creating payment:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar pagamento",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    createPayment,
    loading,
  };
};
