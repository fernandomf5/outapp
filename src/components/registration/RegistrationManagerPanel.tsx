import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, AlertCircle, PlusCircle, List, Mail, Phone, Trash2, Eye, Pencil, ArrowUp, ArrowDown, MoreHorizontal, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UnifiedRegistrationForm } from "./UnifiedRegistrationForm";
import { ContactHistoryPanel } from "./ContactHistoryPanel";
import { toast } from "sonner";
import { SecureDeleteDialog } from "@/components/ui/secure-delete-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{id: string, name: string} | null>(null);

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

  const getOrderKey = () => `registration-order-${categoryId}`;

  const applyCustomOrder = (list: RegisteredItem[]): RegisteredItem[] => {
    try {
      const stored = localStorage.getItem(getOrderKey());
      if (!stored) return list;
      const orderIds: string[] = JSON.parse(stored);
      const indexOf = (id: string) => {
        const i = orderIds.indexOf(id);
        return i === -1 ? Number.MAX_SAFE_INTEGER : i;
      };
      return [...list].sort((a, b) => {
        const ai = indexOf(a.id);
        const bi = indexOf(b.id);
        if (ai !== bi) return ai - bi;
        return a.name.localeCompare(b.name);
      });
    } catch {
      return list;
    }
  };

  const saveOrder = (list: RegisteredItem[]) => {
    try {
      localStorage.setItem(getOrderKey(), JSON.stringify(list.map((i) => i.id)));
    } catch {}
  };

  const moveItem = (index: number, direction: 'up' | 'down' | 'top' | 'bottom') => {
    setItems((prev) => {
      const next = [...prev];
      const [item] = next.splice(index, 1);
      let newIndex = index;
      if (direction === 'up') newIndex = Math.max(0, index - 1);
      else if (direction === 'down') newIndex = Math.min(next.length, index + 1);
      else if (direction === 'top') newIndex = 0;
      else if (direction === 'bottom') newIndex = next.length;
      next.splice(newIndex, 0, item);
      saveOrder(next);
      return next;
    });
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
      const ordered = applyCustomOrder(data || []);
      setItems(ordered);

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

  const confirmDelete = (id: string, name: string) => {
    setItemToDelete({ id, name });
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    
    try {
      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', itemToDelete.id);

      if (error) throw error;
      toast.success('Cadastro excluído com sucesso!');
      fetchItems();
    } catch (error: any) {
      toast.error('Erro ao excluir: ' + error.message);
    } finally {
      setDeleteDialogOpen(false);
      setItemToDelete(null);
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
                    <TableHead className="w-[100px] text-right">Ações</TableHead>
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
                    items.map((item, index) => (
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
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" title="Ações">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-44">
                              <DropdownMenuItem
                                onClick={() => moveItem(index, 'up')}
                                disabled={index === 0}
                              >
                                <ArrowUp className="h-4 w-4 mr-2" />
                                Subir
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => moveItem(index, 'down')}
                                disabled={index === items.length - 1}
                              >
                                <ArrowDown className="h-4 w-4 mr-2" />
                                Descer
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleViewDetails(item)}>
                                <Eye className="h-4 w-4 mr-2" />
                                Ver Detalhes
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEdit(item)}>
                                <Pencil className="h-4 w-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => confirmDelete(item.id, item.name)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
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
      <SecureDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDelete}
        title="Excluir Cadastro"
        description="Esta ação excluirá permanentemente este cadastro. Para confirmar, digite 'excluir' abaixo."
        itemName={itemToDelete?.name}
      />
    </div>
  );
}
