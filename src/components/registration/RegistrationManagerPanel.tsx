import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { ClientsManagementPanel } from "@/components/ClientsManagementPanel";
import { BusinessManagementPanel } from "@/components/BusinessManagementPanel";
import { TeamManagementPanel } from "@/components/TeamManagementPanel";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, AlertCircle } from "lucide-react";
import { SuppliersManagementPanel } from "@/components/SuppliersManagementPanel";

interface RegistrationManagerPanelProps {
  categoryId: string | null;
}

interface Category {
  id: string;
  name: string;
  system_type: string | null;
}

export function RegistrationManagerPanel({ categoryId }: RegistrationManagerPanelProps) {
  const { user } = useAuth();
  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (categoryId && user) {
      fetchCategory();
    }
  }, [categoryId, user]);

  const fetchCategory = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('registration_categories')
        .select('*')
        .eq('id', categoryId)
        .single();

      if (error) throw error;
      setCategory(data);
    } catch (error) {
      console.error('Error fetching category:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!category) {
    return (
      <Card className="border-destructive/50 bg-destructive/5">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <CardTitle>Categoria não encontrada</CardTitle>
          </div>
          <CardDescription>
            A categoria selecionada não existe ou foi excluída.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Dispatch based on system_type
  switch (category.system_type) {
    case 'client':
      return <ClientsManagementPanel categoryId={categoryId} />;
    case 'business':
      return <BusinessManagementPanel />;
    case 'team':
      return <TeamManagementPanel />;
    case 'supplier':
      return <SuppliersManagementPanel />;
    default:
      // For custom categories, we use ClientsManagementPanel pre-filtered
      return <ClientsManagementPanel categoryId={categoryId} />;
  }
}
