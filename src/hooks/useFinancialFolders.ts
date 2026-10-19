import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type FinancialFolder = {
  id: string;
  name: string;
  color: string;
  sort_order: number;
  business_id: string;
  user_id: string;
};

const DEFAULT_COLOR = "#39c5ff";

/** One set of finance tabs per Gestão Livre business; transactions stay in their original table. */
export function useFinancialFolders(businessId: string, disabled = false) {
  const [folders, setFolders] = useState<FinancialFolder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!businessId || disabled) {
      setFolders([]);
      setError(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error: loadError } = await supabase.from("financial_folders")
      .select("id,name,color,sort_order,business_id,user_id")
      .eq("business_id", businessId)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });
    if (loadError) {
      setError(loadError.message);
      setFolders([]);
    } else {
      setError(null);
      setFolders((data || []) as FinancialFolder[]);
    }
    setLoading(false);
  }, [businessId, disabled]);

  useEffect(() => { void refresh(); }, [refresh]);

  const createFolder = async (name: string, color: string = DEFAULT_COLOR) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !businessId) throw Error("Selecione um negócio para criar a aba.");
    const { data, error: createError } = await supabase.from("financial_folders")
      .insert({ name: name.trim(), color, user_id: user.id, business_id: businessId,
        sort_order: folders.length })
      .select("id,name,color,sort_order,business_id,user_id").single();
    if (createError) throw createError;
    await refresh();
    return data as FinancialFolder;
  };

  const renameFolder = async (id: string, name: string, color: string) => {
    const { error: updateError } = await supabase.from("financial_folders")
      .update({ name: name.trim(), color })
      .eq("id", id).eq("business_id", businessId);
    if (updateError) throw updateError;
    await refresh();
  };

  const removeFolder = async (id: string) => {
    const { error: deleteError } = await supabase.from("financial_folders")
      .delete().eq("id", id).eq("business_id", businessId);
    if (deleteError) throw deleteError;
    // ON DELETE SET NULL: transactions remain and move to Sem aba.
    await refresh();
  };

  return { folders, loading, error, refresh, createFolder, renameFolder, removeFolder };
}
