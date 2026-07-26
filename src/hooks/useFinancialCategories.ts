import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface FinancialCategory {
  id: string;
  user_id: string;
  business_id: string | null;
  name: string;
  color: string | null;
  order_index: number | null;
}

export const useFinancialCategories = (businessId?: string) => {
  const [categories, setCategories] = useState<FinancialCategory[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let query = supabase
        .from("financial_categories")
        .select("*")
        .eq("user_id", user.id)
        .order("order_index", { ascending: true })
        .order("created_at", { ascending: true });

      if (businessId) query = query.eq("business_id", businessId);

      const { data, error } = await query;
      if (error) throw error;
      setCategories((data || []) as FinancialCategory[]);
    } catch (error) {
      toast.error("Erro ao carregar categorias");
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const createCategory = async (name: string, color: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from("financial_categories").insert({
      user_id: user.id,
      business_id: businessId || null,
      name,
      color,
      order_index: categories.length,
    });
    if (error) {
      toast.error("Erro ao criar categoria");
      return;
    }
    toast.success("Categoria criada!");
    fetchCategories();
  };

  const updateCategory = async (id: string, values: { name: string; color: string }) => {
    const { error } = await supabase.from("financial_categories").update(values).eq("id", id);
    if (error) {
      toast.error("Erro ao atualizar categoria");
      return;
    }
    toast.success("Categoria atualizada!");
    fetchCategories();
  };

  const deleteCategory = async (id: string) => {
    const { error } = await supabase.from("financial_categories").delete().eq("id", id);
    if (error) {
      toast.error("Erro ao excluir categoria");
      return;
    }
    toast.success("Categoria excluída");
    fetchCategories();
  };

  const reorderCategories = async (orderedIds: string[]) => {
    setCategories((prev) => {
      const map = new Map(prev.map((c) => [c.id, c]));
      return orderedIds.map((id) => map.get(id)).filter(Boolean) as FinancialCategory[];
    });
    await Promise.all(
      orderedIds.map((id, index) =>
        supabase.from("financial_categories").update({ order_index: index }).eq("id", id)
      )
    );
  };

  return { categories, loading, fetchCategories, createCategory, updateCategory, deleteCategory, reorderCategories };
};
