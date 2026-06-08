import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface BankAccount {
  id: string;
  bank_name: string;
  account_type: 'PF' | 'PJ';
  current_balance: number;
  agency?: string;
  account_number?: string;
  is_active: boolean;
}

export const useBankAccounts = (businessId?: string) => {
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchBankAccounts = async () => {
    try {
      setLoading(true);
      let query = supabase.from('financial_bank_accounts').select('*');
      
      if (businessId) {
        query = query.eq('business_id', businessId);
      }

      const { data, error } = await query.eq('is_active', true);
      if (error) throw error;
      setBankAccounts(data as BankAccount[]);
    } catch (error) {
      toast.error('Erro ao carregar contas bancárias');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBankAccounts();
  }, [businessId]);

  return { bankAccounts, loading, refetch: fetchBankAccounts };
};
