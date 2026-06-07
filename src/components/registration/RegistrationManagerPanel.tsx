import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, AlertCircle, PlusCircle, List, Mail, Phone, Trash2, Eye, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UnifiedRegistrationForm } from "./UnifiedRegistrationForm";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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
  const [activeTab, setActiveTab] = useState<string>("form");
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isViewOnly, setIsViewOnly] = useState(false);

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
      
      // If there are items, default to the list tab
      if (data && data.length > 0) {
        setActiveTab("list");
      } else {
        setActiveTab("form");
      }
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

  const handleEdit = (item: any) => {
    setSelectedItem(item);
    setIsViewOnly(false);
    setActiveTab("form");
  };

  const handleViewDetails = (item: any) => {
    setSelectedItem(item);
    setIsViewOnly(true);
    setActiveTab("form");
  };

  const handleAddNew = () => {
    setSelectedItem(null);
    setIsViewOnly(false);
    setActiveTab("form");
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{category.name}</h2>
          <p className="text-muted-foreground">
            {activeTab === "form" ? `Preencha os dados para cadastrar em ${category.name.toLowerCase()}.` : `Gerencie os cadastros na categoria ${category.name.toLowerCase()}.`}
          </p>
        </div>
        
        <Tabs value={activeTab} onValueChange={(val) => {
          if (val === "form" && activeTab !== "form") {
            handleAddNew();
          } else {
            setActiveTab(val);
          }
        }} className="w-full md:w-auto">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="form" className="gap-2">
              <PlusCircle className="h-4 w-4" />
              Cadastrar
            </TabsTrigger>
            <TabsTrigger value="list" className="gap-2">
              <List className="h-4 w-4" />
              Ver Lista
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="mt-6">
        {activeTab === "form" ? (
          <UnifiedRegistrationForm 
            categoryId={category.id} 
            categoryName={category.name}
            systemType={category.system_type || 'other'}
            initialData={selectedItem}
            isViewOnly={isViewOnly}
            onSuccess={() => {
              setActiveTab("list");
              fetchItems();
              setSelectedItem(null);
            }}
            onCancel={() => {
              setActiveTab("list");
              setSelectedItem(null);
            }}
          />
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12"></TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Contato</TableHead>
                    <TableHead>Data de Cadastro</TableHead>
                    <TableHead className="w-[150px]">Ações</TableHead>
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
                         <TableCell>
                           <Avatar className="h-8 w-8">
                             <AvatarImage src={(item as any).avatar_url} />
                             <AvatarFallback>{item.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                           </Avatar>
                         </TableCell>
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
                          <div className="flex items-center gap-1">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleViewDetails(item)}
                              title="Ver Detalhes"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleEdit(item)}
                              title="Editar"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleDelete(item.id)}
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              title="Excluir"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
