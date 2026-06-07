import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, AlertCircle, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UnifiedRegistrationForm } from "./UnifiedRegistrationForm";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Phone, Mail, Trash2 } from "lucide-react";

interface RegistrationManagerPanelProps {
  categoryId: string | null;
}

interface Category {
  id: string;
  name: string;
  system_type: string | null;
  color: string;
}

interface RegisteredItem {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  created_at: string;
}

export function RegistrationManagerPanel({ categoryId }: RegistrationManagerPanelProps) {
  const { user } = useAuth();
  const [category, setCategory] = useState<Category | null>(null);
  const [items, setItems] = useState<RegisteredItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (categoryId && user) {
      fetchCategory();
      fetchItems();
    }
  }, [categoryId, user]);

  const fetchCategory = async () => {
    try {
      const { data, error } = await supabase
        .from('registration_categories')
        .select('*')
        .eq('id', categoryId)
        .single();

      if (error) throw error;
      setCategory(data);
    } catch (error) {
      console.error('Error fetching category:', error);
    }
  };

  const fetchItems = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('registration_category_id', categoryId)
        .order('name');

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error('Error fetching items:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este cadastro?')) return;
    
    try {
      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Cadastro excluído com sucesso!');
      fetchItems();
    } catch (error: any) {
      toast.error('Erro ao excluir: ' + error.message);
    }
  };

  if (loading && !category) {
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

  if (showForm) {
    return (
      <div className="space-y-6">
        <UnifiedRegistrationForm 
          categoryId={category.id} 
          categoryName={category.name}
          systemType={category.system_type || 'other'}
          onSuccess={() => {
            setShowForm(false);
            fetchItems();
          }}
          onCancel={() => setShowForm(false)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{category.name}</h2>
          <p className="text-muted-foreground">
            Gerencie todos os cadastros na categoria {category.name.toLowerCase()}.
          </p>
        </div>
        <Button onClick={() => setShowForm(true)} className="gap-2">
          <PlusCircle className="h-4 w-4" />
          Cadastrar
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead>Data de Cadastro</TableHead>
                <TableHead className="w-[100px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                    Nenhum cadastro encontrado nesta categoria.
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {item.email && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            {item.email}
                          </div>
                        )}
                        {item.phone && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            {item.phone}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(item.created_at).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleDelete(item.id)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

