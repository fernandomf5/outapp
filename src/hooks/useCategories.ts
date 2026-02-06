import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Category {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  color: string;
  icon: string | null;
  order_index: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useCategories() {
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const loadCategories = useCallback(async () => {
    if (!user?.id) {
      setCategories([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from("product_categories" as any)
      .select("*")
      .eq("user_id", user.id)
      .order("order_index", { ascending: true });

    if (!error && data) {
      setCategories(data as any);
    }
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const getCategoryById = useCallback(
    (id: string | null) => {
      if (!id) return null;
      return categories.find((c) => c.id === id) || null;
    },
    [categories]
  );

  const getCategoryName = useCallback(
    (id: string | null) => {
      const category = getCategoryById(id);
      return category?.name || null;
    },
    [getCategoryById]
  );

  return {
    categories,
    loading,
    loadCategories,
    getCategoryById,
    getCategoryName,
  };
}
