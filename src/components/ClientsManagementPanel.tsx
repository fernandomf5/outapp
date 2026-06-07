import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { UserPlus, Edit, Trash2, Download, Phone, Mail, Search, Filter, X, Building, Briefcase, MapPin, Globe, Tag, Camera, Loader2, FolderPlus, Settings2, Folder, History, MessageCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CustomerHistoryPanel } from "@/components/crm/CustomerHistoryPanel";
import { toast } from "sonner";

interface Category {
  id: string;
  user_id: string;
  name: string;
  color: string;
  created_at: string;
  updated_at: string;
}

interface Customer {
  id: string;
  user_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  position: string | null;
  status: 'lead' | 'prospect' | 'customer' | 'inactive' | 'vip';
  document: string | null;
  tags: string[] | null;
  notes: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  postal_code: string | null;
  website: string | null;
  created_at: string;
  updated_at: string;
  last_contact_at: string | null;
  category_id: string | null;
  business_id: string | null;
}

interface Business {
  id: string;
  name: string;
}

const statusColors = {
  lead: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  prospect: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  customer: "bg-green-500/10 text-green-500 border-green-500/20",
  inactive: "bg-gray-500/10 text-gray-500 border-gray-500/20",
  vip: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
};

const statusLabels = {
  lead: "Lead",
  prospect: "Prospect",
  customer: "Cliente",
  inactive: "Inativo",
  vip: "VIP",
};

interface TeamContext {
  adminUserId: string;
  allowedIds: string[];
}

interface ClientsManagementPanelProps {
  teamContext?: TeamContext;
  categoryId?: string | null;
}

export function ClientsManagementPanel({ teamContext, categoryId: propCategoryId }: ClientsManagementPanelProps) {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [tagFilter, setTagFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [sortOrder, setSortOrder] = useState<string>("date-desc");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [isProcessingOCR, setIsProcessingOCR] = useState(false);
  
  // Categories state
  const [categories, setCategories] = useState<Category[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [categoriesDialogOpen, setCategoriesDialogOpen] = useState(false);
  const [categoryFormData, setCategoryFormData] = useState({ name: "", color: "#3b82f6" });
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [deleteCategoryDialogOpen, setDeleteCategoryDialogOpen] = useState(false);
  
  // Selected category for adding clients
  const [selectedCategoryForAdd, setSelectedCategoryForAdd] = useState<Category | null>(null);
  
  useEffect(() => {
    if (propCategoryId) {
      setCategoryFilter(propCategoryId);
    }
  }, [propCategoryId]);
  const categoryFileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    position: "",
    document: "",
    status: "lead" as Customer['status'],
    tags: [] as string[],
    notes: "",
    address: "",
    city: "",
    state: "",
    country: "",
    postal_code: "",
    website: "",
    category_id: "" as string,
    business_id: "" as string,
  });

  const [newTag, setNewTag] = useState("");

  useEffect(() => {
    if (!user) return;
    fetchCustomers();
    fetchCategories();
    fetchBusinesses();
  }, [user]);

  useEffect(() => {
    filterCustomers();
  }, [customers, searchTerm, statusFilter, tagFilter, categoryFilter, sortOrder]);

  const fetchCategories = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('registration_categories')
        .select('*')
        .eq('user_id', user.id)
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error: any) {
      console.error('Erro ao buscar categorias:', error);
    }
  };

  const fetchBusinesses = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('businesses')
        .select('id, name')
        .eq('user_id', user.id)
        .order('name');

      if (error) throw error;
      setBusinesses(data || []);
    } catch (error: any) {
      console.error('Erro ao buscar negócios:', error);
    }
  };

  const fetchCustomers = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setCustomers((data || []) as Customer[]);
      
      // Extrair todas as tags únicas
      const tagsSet = new Set<string>();
      data?.forEach(customer => {
        customer.tags?.forEach((tag: string) => tagsSet.add(tag));
      });
      setAllTags(Array.from(tagsSet));
    } catch (error: any) {
      console.error('Erro ao buscar clientes:', error);
      toast.error('Erro ao carregar clientes');
    } finally {
      setLoading(false);
    }
  };

  const filterCustomers = () => {
    let filtered = [...customers];

    // Filtro de busca
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(customer =>
        customer.name.toLowerCase().includes(term) ||
        customer.email?.toLowerCase().includes(term) ||
        customer.phone?.includes(term) ||
        customer.company?.toLowerCase().includes(term)
      );
    }

    // Filtro por status
    if (statusFilter !== "all") {
      filtered = filtered.filter(customer => customer.status === statusFilter);
    }

    // Filtro por tag
    if (tagFilter !== "all") {
      filtered = filtered.filter(customer => customer.tags?.includes(tagFilter));
    }

    // Filtro por categoria
    if (categoryFilter !== "all") {
      if (categoryFilter === "none") {
        filtered = filtered.filter(customer => !customer.category_id);
      } else {
        filtered = filtered.filter(customer => customer.category_id === categoryFilter);
      }
    }

    // Ordenação
    switch (sortOrder) {
      case "name-asc":
        filtered.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
        break;
      case "name-desc":
        filtered.sort((a, b) => b.name.localeCompare(a.name, 'pt-BR'));
        break;
      case "date-asc":
        filtered.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        break;
      case "date-desc":
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
    }

    setFilteredCustomers(filtered);
  };

  // Category CRUD
  const handleAddCategory = async () => {
    if (!user || !categoryFormData.name.trim()) {
      toast.error('Nome da categoria é obrigatório');
      return;
    }

    try {
      const { error } = await supabase
        .from('customer_categories')
        .insert({
          user_id: user.id,
          name: categoryFormData.name.trim(),
          color: categoryFormData.color,
        });

      if (error) throw error;

      toast.success('Categoria criada com sucesso!');
      setCategoryFormData({ name: "", color: "#3b82f6" });
      fetchCategories();
    } catch (error: any) {
      console.error('Erro ao criar categoria:', error);
      toast.error('Erro ao criar categoria');
    }
  };

  const handleUpdateCategory = async () => {
    if (!editingCategory || !categoryFormData.name.trim()) {
      toast.error('Nome da categoria é obrigatório');
      return;
    }

    try {
      const { error } = await supabase
        .from('customer_categories')
        .update({
          name: categoryFormData.name.trim(),
          color: categoryFormData.color,
        })
        .eq('id', editingCategory.id);

      if (error) throw error;

      toast.success('Categoria atualizada!');
      setEditingCategory(null);
      setCategoryFormData({ name: "", color: "#3b82f6" });
      fetchCategories();
    } catch (error: any) {
      console.error('Erro ao atualizar categoria:', error);
      toast.error('Erro ao atualizar categoria');
    }
  };

  const handleDeleteCategory = async () => {
    if (!categoryToDelete) return;

    try {
      const { error } = await supabase
        .from('customer_categories')
        .delete()
        .eq('id', categoryToDelete.id);

      if (error) throw error;

      toast.success('Categoria excluída!');
      setDeleteCategoryDialogOpen(false);
      setCategoryToDelete(null);
      fetchCategories();
    } catch (error: any) {
      console.error('Erro ao excluir categoria:', error);
      toast.error('Erro ao excluir categoria');
    }
  };

  const startEditCategory = (category: Category) => {
    setEditingCategory(category);
    setCategoryFormData({ name: category.name, color: category.color });
  };

  const cancelEditCategory = () => {
    setEditingCategory(null);
    setCategoryFormData({ name: "", color: "#3b82f6" });
  };

  const getCategoryById = (id: string | null) => {
    if (!id) return null;
    return categories.find(c => c.id === id);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      company: "",
      position: "",
      document: "",
      status: "lead",
      tags: [],
      notes: "",
      address: "",
      city: "",
      state: "",
      country: "",
      postal_code: "",
      website: "",
      category_id: selectedCategoryForAdd?.id || "",
      business_id: "",
    });
    setNewTag("");
  };

  const openAddDialogForCategory = (category: Category | null) => {
    setSelectedCategoryForAdd(category);
    setFormData({
      name: "",
      email: "",
      phone: "",
      company: "",
      position: "",
      document: "",
      status: "lead",
      tags: [],
      notes: "",
      address: "",
      city: "",
      state: "",
      country: "",
      postal_code: "",
      website: "",
      category_id: category?.id || "",
      business_id: "",
    });
    setNewTag("");
    setAddDialogOpen(true);
  };

  const handleImageUploadForCategory = async (event: React.ChangeEvent<HTMLInputElement>, category: Category | null) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione uma imagem.');
      return;
    }

    const { data: sessionCheck } = await supabase.auth.getSession();
    if (!sessionCheck.session?.access_token) {
      toast.error('Sessão expirada. Por favor, faça login novamente.');
      return;
    }

    setIsProcessingOCR(true);

    try {
      const reader = new FileReader();
      
      reader.onerror = () => {
        toast.error('Não foi possível ler o arquivo selecionado.');
        setIsProcessingOCR(false);
      };

      reader.onloadend = async () => {
        try {
          const base64Image = reader.result as string;

          if (!base64Image) {
            throw new Error('Imagem vazia');
          }

          const { data, error } = await supabase.functions.invoke('parse-leads-from-image', {
            body: { imageDataUrl: base64Image }
          });

          if (error) {
            const ctx: any = (error as any)?.context;
            const serverMsg = ctx?.json?.error || ctx?.body?.error || (data as any)?.error;
            throw new Error(serverMsg || error.message || 'Erro ao processar imagem');
          }

          if ((data as any)?.error) {
            throw new Error(String((data as any).error));
          }

          const extractedLeads = (data as any)?.leads;

          if (Array.isArray(extractedLeads) && extractedLeads.length > 0) {
            let addedCount = 0;
            for (const lead of extractedLeads) {
              if (lead.name || lead.phone || lead.email) {
                const { error: insertError } = await supabase
                  .from('customers')
                  .insert({
                    user_id: user?.id,
                    name: lead.name || 'Cliente',
                    phone: lead.phone || null,
                    email: lead.email || null,
                    status: 'lead',
                    category_id: category?.id || null,
                  });

                if (!insertError) addedCount++;
              }
            }

            if (addedCount > 0) {
              toast.success(`${addedCount} cliente(s) adicionado(s)${category ? ` na categoria "${category.name}"` : ''}!`);
              fetchCustomers();
            } else {
              toast.error('Nenhum cliente válido foi encontrado na imagem.');
            }
          } else {
            toast.error('Não foi possível identificar contatos na imagem.');
          }
        } catch (error) {
          console.error('Erro no processamento OCR:', error);
          toast.error(error instanceof Error ? error.message : 'Não foi possível extrair os dados da imagem.');
        } finally {
          setIsProcessingOCR(false);
        }
      };

      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Erro no OCR:', error);
      toast.error('Não foi possível processar a imagem.');
      setIsProcessingOCR(false);
    }

    if (categoryFileInputRef.current) {
      categoryFileInputRef.current.value = '';
    }
  };

  const handleAddCustomer = async () => {
    if (!user || !formData.name) {
      toast.error('Nome é obrigatório');
      return;
    }

    try {
      const customerData = {
        ...formData,
        user_id: user.id,
        category_id: formData.category_id || null,
        business_id: formData.business_id || null,
      };

      const { error } = await supabase
        .from('customers')
        .insert([customerData])
        .select()
        .single();

      if (error) throw error;

      toast.success('Cliente adicionado com sucesso!');
      setAddDialogOpen(false);
      resetForm();
      fetchCustomers();
    } catch (error: any) {
      console.error('Erro ao adicionar cliente:', error);
      toast.error('Erro ao adicionar cliente');
    }
  };

  const handleEditCustomer = async () => {
    if (!selectedCustomer || !formData.name) {
      toast.error('Nome é obrigatório');
      return;
    }

    try {
      const updateData = {
        ...formData,
        category_id: formData.category_id || null,
        business_id: formData.business_id || null,
      };

      const { error } = await supabase
        .from('customers')
        .update(updateData)
        .eq('id', selectedCustomer.id);

      if (error) throw error;

      toast.success('Cliente atualizado com sucesso!');
      setEditDialogOpen(false);
      setSelectedCustomer(null);
      resetForm();
      fetchCustomers();
    } catch (error: any) {
      console.error('Erro ao atualizar cliente:', error);
      toast.error('Erro ao atualizar cliente');
    }
  };

  const handleDeleteCustomer = async () => {
    if (!customerToDelete) return;

    try {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', customerToDelete.id);

      if (error) throw error;

      toast.success('Cliente excluído com sucesso!');
      setDeleteDialogOpen(false);
      setCustomerToDelete(null);
      fetchCustomers();
    } catch (error: any) {
      console.error('Erro ao excluir cliente:', error);
      toast.error('Erro ao excluir cliente');
    }
  };

  const openAddDialog = () => {
    resetForm();
    setAddDialogOpen(true);
  };

  const openEditDialog = (customer: Customer) => {
    setSelectedCustomer(customer);
    setFormData({
      name: customer.name,
      email: customer.email || "",
      phone: customer.phone || "",
      company: customer.company || "",
      position: customer.position || "",
      document: (customer as any).document || "",
      status: customer.status,
      tags: customer.tags || [],
      notes: customer.notes || "",
      address: customer.address || "",
      city: customer.city || "",
      state: customer.state || "",
      country: customer.country || "",
      postal_code: customer.postal_code || "",
      website: customer.website || "",
      category_id: customer.category_id || "",
      business_id: customer.business_id || "",
    });
    setEditDialogOpen(true);
  };

  const openDetailsDialog = (customer: Customer) => {
    setSelectedCustomer(customer);
    setDetailsDialogOpen(true);
  };

  const openDeleteDialog = (customer: Customer) => {
    setCustomerToDelete(customer);
    setDeleteDialogOpen(true);
  };

  const addTag = () => {
    if (newTag && !formData.tags.includes(newTag)) {
      setFormData({ ...formData, tags: [...formData.tags, newTag] });
      setNewTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData({ ...formData, tags: formData.tags.filter(tag => tag !== tagToRemove) });
  };

  const downloadCSV = () => {
    const csv = [
      'Nome,Email,Telefone,Empresa,Cargo,Status,Tags,Data de Cadastro',
      ...filteredCustomers.map(customer =>
        `"${customer.name}","${customer.email || ''}","${customer.phone || ''}","${customer.company || ''}","${customer.position || ''}","${statusLabels[customer.status]}","${customer.tags?.join(', ') || ''}","${new Date(customer.created_at).toLocaleString('pt-BR')}"`
      )
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'clientes.csv';
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Lista de clientes exportada!');
  };

  const downloadPhones = () => {
    const phones = filteredCustomers
      .filter(c => c.phone)
      .map(c => c.phone)
      .join('\n');

    const blob = new Blob([phones], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'telefones-clientes.txt';
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Telefones exportados!');
  };

  const downloadEmails = () => {
    const emails = filteredCustomers
      .filter(c => c.email)
      .map(c => c.email)
      .join('\n');

    const blob = new Blob([emails], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'emails-clientes.txt';
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('E-mails exportados!');
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione uma imagem.');
      return;
    }

    const { data: sessionCheck } = await supabase.auth.getSession();
    if (!sessionCheck.session?.access_token) {
      toast.error('Sessão expirada. Por favor, faça login novamente.');
      return;
    }

    setIsProcessingOCR(true);

    try {
      const reader = new FileReader();
      
      reader.onerror = () => {
        toast.error('Não foi possível ler o arquivo selecionado.');
        setIsProcessingOCR(false);
      };

      reader.onloadend = async () => {
        try {
          const base64Image = reader.result as string;

          if (!base64Image) {
            throw new Error('Imagem vazia');
          }

          const { data, error } = await supabase.functions.invoke('parse-leads-from-image', {
            body: { imageDataUrl: base64Image }
          });

          if (error) {
            const ctx: any = (error as any)?.context;
            const serverMsg = ctx?.json?.error || ctx?.body?.error || (data as any)?.error;
            throw new Error(serverMsg || error.message || 'Erro ao processar imagem');
          }

          if ((data as any)?.error) {
            throw new Error(String((data as any).error));
          }

          const extractedLeads = (data as any)?.leads;

          if (Array.isArray(extractedLeads) && extractedLeads.length > 0) {
            let addedCount = 0;
            for (const lead of extractedLeads) {
              if (lead.name || lead.phone || lead.email) {
                const { error: insertError } = await supabase
                  .from('customers')
                  .insert({
                    user_id: user?.id,
                    name: lead.name || 'Cliente',
                    phone: lead.phone || null,
                    email: lead.email || null,
                    status: 'lead',
                  });

                if (!insertError) addedCount++;
              }
            }

            if (addedCount > 0) {
              toast.success(`${addedCount} cliente(s) adicionado(s) via OCR!`);
              fetchCustomers();
            } else {
              toast.error('Nenhum cliente válido foi encontrado na imagem.');
            }
          } else {
            toast.error('Não foi possível identificar contatos na imagem.');
          }
        } catch (error) {
          console.error('Erro no processamento OCR:', error);
          toast.error(error instanceof Error ? error.message : 'Não foi possível extrair os dados da imagem.');
        } finally {
          setIsProcessingOCR(false);
        }
      };

      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Erro no OCR:', error);
      toast.error('Não foi possível processar a imagem.');
      setIsProcessingOCR(false);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        className="hidden"
        onChange={handleImageUpload}
      />
      <input
        type="file"
        ref={categoryFileInputRef}
        accept="image/*"
        className="hidden"
        onChange={(e) => handleImageUploadForCategory(e, selectedCategoryForAdd)}
      />
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="text-2xl">Gestão de Clientes</CardTitle>
              <CardDescription>
                Gerencie todos os seus clientes em um só lugar
              </CardDescription>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button 
                variant="outline" 
                onClick={() => setCategoriesDialogOpen(true)}
                className="flex-1 sm:flex-none"
              >
                <Settings2 className="h-4 w-4 mr-2" />
                Gerenciar Categorias
              </Button>
              <Button onClick={openAddDialog} className="flex-1 sm:flex-none">
                <UserPlus className="h-4 w-4 mr-2" />
                Adicionar Cliente
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Categorias como Cards Clicáveis */}
          {categories.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-muted-foreground mb-3">Adicionar clientes por categoria:</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {categories.map((category) => {
                  const categoryCustomerCount = customers.filter(c => c.category_id === category.id).length;
                  return (
                    <div
                      key={category.id}
                      className="relative group rounded-lg border p-4 hover:shadow-md transition-all cursor-pointer"
                      style={{ borderColor: category.color, backgroundColor: `${category.color}10` }}
                    >
                      <div className="flex flex-col items-center text-center">
                        <Folder className="h-8 w-8 mb-2" style={{ color: category.color }} />
                        <span className="font-medium text-sm truncate w-full" style={{ color: category.color }}>
                          {category.name}
                        </span>
                        <span className="text-xs text-muted-foreground">{categoryCustomerCount} clientes</span>
                      </div>
                      
                      {/* Botões de ação */}
                      <div className="absolute inset-0 bg-background/90 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            openAddDialogForCategory(category);
                          }}
                          className="text-xs"
                        >
                          <UserPlus className="h-3 w-3 mr-1" />
                          Manual
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCategoryForAdd(category);
                            categoryFileInputRef.current?.click();
                          }}
                          disabled={isProcessingOCR}
                          className="text-xs"
                        >
                          {isProcessingOCR ? (
                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                          ) : (
                            <Camera className="h-3 w-3 mr-1" />
                          )}
                          Foto
                        </Button>
                      </div>
                    </div>
                  );
                })}
                
                {/* Card para Sem Categoria */}
                <div
                  className="relative group rounded-lg border border-dashed p-4 hover:shadow-md transition-all cursor-pointer border-muted-foreground/30"
                >
                  <div className="flex flex-col items-center text-center">
                    <Folder className="h-8 w-8 mb-2 text-muted-foreground" />
                    <span className="font-medium text-sm truncate w-full text-muted-foreground">
                      Sem Categoria
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {customers.filter(c => !c.category_id).length} clientes
                    </span>
                  </div>
                  
                  <div className="absolute inset-0 bg-background/90 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        openAddDialogForCategory(null);
                      }}
                      className="text-xs"
                    >
                      <UserPlus className="h-3 w-3 mr-1" />
                      Manual
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedCategoryForAdd(null);
                        categoryFileInputRef.current?.click();
                      }}
                      disabled={isProcessingOCR}
                      className="text-xs"
                    >
                      {isProcessingOCR ? (
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      ) : (
                        <Camera className="h-3 w-3 mr-1" />
                      )}
                      Foto
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Filtros e Busca */}
          <div className="flex flex-col gap-4 mb-6">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, email, telefone ou empresa..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="lead">Lead</SelectItem>
                  <SelectItem value="prospect">Prospect</SelectItem>
                  <SelectItem value="customer">Cliente</SelectItem>
                  <SelectItem value="vip">VIP</SelectItem>
                  <SelectItem value="inactive">Inativo</SelectItem>
                </SelectContent>
              </Select>
              <Select value={tagFilter} onValueChange={setTagFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <Tag className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filtrar por tag" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as Tags</SelectItem>
                  {allTags.map(tag => (
                    <SelectItem key={tag} value={tag}>{tag}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <Folder className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filtrar por categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as Categorias</SelectItem>
                  <SelectItem value="none">Sem Categoria</SelectItem>
                  {categories.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                        {cat.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex flex-wrap gap-2">
                <Button onClick={downloadCSV} variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Exportar CSV
                </Button>
                <Button onClick={downloadPhones} variant="outline" size="sm">
                  <Phone className="h-4 w-4 mr-2" />
                  Exportar Telefones
                </Button>
                <Button onClick={downloadEmails} variant="outline" size="sm">
                  <Mail className="h-4 w-4 mr-2" />
                  Exportar E-mails
                </Button>
              </div>
              
              <Select value={sortOrder} onValueChange={setSortOrder}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Ordenar por" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name-asc">Nome (A → Z)</SelectItem>
                  <SelectItem value="name-desc">Nome (Z → A)</SelectItem>
                  <SelectItem value="date-desc">Mais Recentes</SelectItem>
                  <SelectItem value="date-asc">Mais Antigos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Tabela de Clientes */}
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Carregando clientes...
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
            {searchTerm || statusFilter !== "all" || tagFilter !== "all" || categoryFilter !== "all"
              ? "Nenhum cliente encontrado com os filtros aplicados"
              : "Nenhum cliente cadastrado ainda"}
          </div>
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Contato</TableHead>
                    <TableHead>Empresa</TableHead>
                    <TableHead>Negócio</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Tags</TableHead>
                    <TableHead>Cadastro</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCustomers.map((customer) => (
                    <TableRow key={customer.id} className="cursor-pointer hover:bg-muted/50" onClick={() => openDetailsDialog(customer)}>
                      <TableCell className="font-medium">{customer.name}</TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1 text-sm">
                          {customer.email && <span className="text-muted-foreground">{customer.email}</span>}
                          {customer.phone && <span className="text-muted-foreground">{customer.phone}</span>}
                        </div>
                      </TableCell>
                      <TableCell>
                        {customer.company && (
                          <div className="flex flex-col gap-1">
                            <span className="font-medium">{customer.company}</span>
                            {customer.position && <span className="text-sm text-muted-foreground">{customer.position}</span>}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {(() => {
                          const biz = businesses.find(b => b.id === customer.business_id);
                          return biz ? (
                            <Badge variant="outline" className="border-primary/30 text-primary bg-primary/10">
                              <Building className="w-3 h-3 mr-1" />
                              {biz.name}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-xs">-</span>
                          );
                        })()}
                      </TableCell>
                      <TableCell>
                        {(() => {
                          const category = getCategoryById(customer.category_id);
                          return category ? (
                            <Badge 
                              variant="outline" 
                              className="border"
                              style={{ 
                                borderColor: category.color, 
                                color: category.color,
                                backgroundColor: `${category.color}15`
                              }}
                            >
                              {category.name}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-xs">-</span>
                          );
                        })()}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={statusColors[customer.status]}>
                          {statusLabels[customer.status]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {customer.tags?.slice(0, 2).map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {customer.tags && customer.tags.length > 2 && (
                            <Badge variant="secondary" className="text-xs">
                              +{customer.tags.length - 2}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(customer.created_at).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {customer.phone && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                const cleanPhone = customer.phone!.replace(/\D/g, '');
                                window.open(`https://wa.me/${cleanPhone}`, '_blank');
                              }}
                              title="Falar no WhatsApp"
                              className="text-emerald-500 hover:text-emerald-600 hover:bg-emerald-500/10"
                            >
                              <MessageCircle className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditDialog(customer);
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              openDeleteDialog(customer);
                            }}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          <div className="mt-4 text-sm text-muted-foreground">
            {filteredCustomers.length !== customers.length ? (
              <>Mostrando <span className="font-semibold">{filteredCustomers.length}</span> de <span className="font-semibold">{customers.length}</span> clientes</>
            ) : (
              <>Total de clientes: <span className="font-semibold">{customers.length}</span></>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dialog: Adicionar Cliente */}
      <Dialog open={addDialogOpen} onOpenChange={(open) => {
        setAddDialogOpen(open);
        if (!open) setSelectedCategoryForAdd(null);
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Adicionar Novo Cliente
              {selectedCategoryForAdd && (
                <Badge 
                  variant="outline" 
                  className="ml-2"
                  style={{ 
                    borderColor: selectedCategoryForAdd.color, 
                    color: selectedCategoryForAdd.color,
                    backgroundColor: `${selectedCategoryForAdd.color}15`
                  }}
                >
                  {selectedCategoryForAdd.name}
                </Badge>
              )}
            </DialogTitle>
            <DialogDescription>
              {selectedCategoryForAdd 
                ? `O cliente será adicionado na categoria "${selectedCategoryForAdd.name}"`
                : 'Preencha os dados do novo cliente'
              }
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nome completo"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@exemplo.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="(11) 99999-9999"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="document">CPF/CNPJ</Label>
              <Input
                id="document"
                value={formData.document}
                onChange={(e) => setFormData({ ...formData, document: e.target.value })}
                placeholder="000.000.000-00 ou 00.000.000/0001-00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">Empresa</Label>
              <Input
                id="company"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                placeholder="Nome da empresa"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="position">Cargo</Label>
              <Input
                id="position"
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                placeholder="Cargo na empresa"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value: Customer['status']) => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lead">Lead</SelectItem>
                  <SelectItem value="prospect">Prospect</SelectItem>
                  <SelectItem value="customer">Cliente</SelectItem>
                  <SelectItem value="vip">VIP</SelectItem>
                  <SelectItem value="inactive">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Categoria</Label>
              <Select value={formData.category_id || "none"} onValueChange={(value) => setFormData({ ...formData, category_id: value === "none" ? "" : value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem Categoria</SelectItem>
                  {categories.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                        {cat.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="business">Negócio (Origem)</Label>
              <Select value={formData.business_id || "none"} onValueChange={(value) => setFormData({ ...formData, business_id: value === "none" ? "" : value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um negócio" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum (Pessoal)</SelectItem>
                  {businesses.map(business => (
                    <SelectItem key={business.id} value={business.id}>
                      {business.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="tags">Tags</Label>
              <div className="flex gap-2">
                <Input
                  id="tags"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Digite uma tag"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                />
                <Button type="button" onClick={addTag} variant="outline">
                  Adicionar
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() => removeTag(tag)}>
                    {tag}
                    <X className="h-3 w-3 ml-1" />
                  </Badge>
                ))}
              </div>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                placeholder="https://www.exemplo.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Endereço</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Rua, número, complemento"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">Cidade</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="Cidade"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">Estado</Label>
              <Input
                id="state"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                placeholder="Estado"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">País</Label>
              <Input
                id="country"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                placeholder="País"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="notes">Notas</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Anotações sobre o cliente..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddCustomer}>
              Adicionar Cliente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Editar Cliente */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Cliente</DialogTitle>
            <DialogDescription>
              Atualize as informações do cliente
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nome *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nome completo"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">E-mail</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@exemplo.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-phone">Telefone</Label>
              <Input
                id="edit-phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="(11) 99999-9999"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-document">CPF/CNPJ</Label>
              <Input
                id="edit-document"
                value={formData.document}
                onChange={(e) => setFormData({ ...formData, document: e.target.value })}
                placeholder="000.000.000-00 ou 00.000.000/0001-00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-company">Empresa</Label>
              <Input
                id="edit-company"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                placeholder="Nome da empresa"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-position">Cargo</Label>
              <Input
                id="edit-position"
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                placeholder="Cargo na empresa"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-status">Status</Label>
              <Select value={formData.status} onValueChange={(value: Customer['status']) => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lead">Lead</SelectItem>
                  <SelectItem value="prospect">Prospect</SelectItem>
                  <SelectItem value="customer">Cliente</SelectItem>
                  <SelectItem value="vip">VIP</SelectItem>
                  <SelectItem value="inactive">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-category">Categoria</Label>
              <Select value={formData.category_id || "none"} onValueChange={(value) => setFormData({ ...formData, category_id: value === "none" ? "" : value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem Categoria</SelectItem>
                  {categories.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                        {cat.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-business">Negócio (Origem)</Label>
              <Select value={formData.business_id || "none"} onValueChange={(value) => setFormData({ ...formData, business_id: value === "none" ? "" : value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um negócio" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum (Pessoal)</SelectItem>
                  {businesses.map(business => (
                    <SelectItem key={business.id} value={business.id}>
                      {business.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="edit-tags">Tags</Label>
              <div className="flex gap-2">
                <Input
                  id="edit-tags"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Digite uma tag"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                />
                <Button type="button" onClick={addTag} variant="outline">
                  Adicionar
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() => removeTag(tag)}>
                    {tag}
                    <X className="h-3 w-3 ml-1" />
                  </Badge>
                ))}
              </div>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="edit-website">Website</Label>
              <Input
                id="edit-website"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                placeholder="https://www.exemplo.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-address">Endereço</Label>
              <Input
                id="edit-address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Rua, número, complemento"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-city">Cidade</Label>
              <Input
                id="edit-city"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="Cidade"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-state">Estado</Label>
              <Input
                id="edit-state"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                placeholder="Estado"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-country">País</Label>
              <Input
                id="edit-country"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                placeholder="País"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="edit-notes">Notas</Label>
              <Textarea
                id="edit-notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Anotações sobre o cliente..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEditCustomer}>
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Detalhes do Cliente */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do Cliente</DialogTitle>
          </DialogHeader>
          {selectedCustomer && (
            <Tabs defaultValue="info" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="info">Informações</TabsTrigger>
                <TabsTrigger value="history">
                  <History className="w-4 h-4 mr-2" />
                  Histórico
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="info" className="space-y-6 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Nome</Label>
                    <p className="font-medium">{selectedCustomer.name}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Status</Label>
                    <Badge variant="outline" className={`${statusColors[selectedCustomer.status]} mt-1`}>
                      {statusLabels[selectedCustomer.status]}
                    </Badge>
                  </div>
                  {selectedCustomer.email && (
                    <div>
                      <Label className="text-muted-foreground">E-mail</Label>
                      <p className="font-medium">{selectedCustomer.email}</p>
                    </div>
                  )}
                  {selectedCustomer.phone && (
                    <div>
                      <Label className="text-muted-foreground">Telefone</Label>
                      <p className="font-medium">{selectedCustomer.phone}</p>
                    </div>
                  )}
                  {(selectedCustomer as any).document && (
                    <div>
                      <Label className="text-muted-foreground">CPF/CNPJ</Label>
                      <p className="font-medium">{(selectedCustomer as any).document}</p>
                    </div>
                  )}
                  {selectedCustomer.company && (
                    <div>
                      <Label className="text-muted-foreground">Empresa</Label>
                      <p className="font-medium">{selectedCustomer.company}</p>
                    </div>
                  )}
                  {selectedCustomer.position && (
                    <div>
                      <Label className="text-muted-foreground">Cargo</Label>
                      <p className="font-medium">{selectedCustomer.position}</p>
                    </div>
                  )}
                  {selectedCustomer.website && (
                    <div>
                      <Label className="text-muted-foreground">Website</Label>
                      <a href={selectedCustomer.website} target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline">
                        {selectedCustomer.website}
                      </a>
                    </div>
                  )}
                </div>
                
                {selectedCustomer.tags && selectedCustomer.tags.length > 0 && (
                  <div>
                    <Label className="text-muted-foreground">Tags</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedCustomer.tags.map((tag) => (
                        <Badge key={tag} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {(selectedCustomer.address || selectedCustomer.city || selectedCustomer.state || selectedCustomer.country) && (
                  <div>
                    <Label className="text-muted-foreground">Endereço</Label>
                    <p className="font-medium">
                      {[selectedCustomer.address, selectedCustomer.city, selectedCustomer.state, selectedCustomer.country]
                        .filter(Boolean)
                        .join(', ')}
                    </p>
                  </div>
                )}

                {selectedCustomer.notes && (
                  <div>
                    <Label className="text-muted-foreground">Notas</Label>
                    <p className="font-medium whitespace-pre-wrap">{selectedCustomer.notes}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                  <div>
                    <Label className="text-muted-foreground">Cadastrado em</Label>
                    <p className="font-medium">{new Date(selectedCustomer.created_at).toLocaleString('pt-BR')}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Última atualização</Label>
                    <p className="font-medium">{new Date(selectedCustomer.updated_at).toLocaleString('pt-BR')}</p>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="history" className="mt-4">
                <CustomerHistoryPanel 
                  customerId={selectedCustomer.id} 
                  contactName={selectedCustomer.name} 
                />
              </TabsContent>
            </Tabs>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailsDialogOpen(false)}>
              Fechar
            </Button>
            <Button onClick={() => {
              setDetailsDialogOpen(false);
              if (selectedCustomer) openEditDialog(selectedCustomer);
            }}>
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Confirmar Exclusão */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o cliente <strong>{customerToDelete?.name}</strong>? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCustomer} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog: Gerenciar Categorias */}
      <Dialog open={categoriesDialogOpen} onOpenChange={setCategoriesDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Gerenciar Categorias</DialogTitle>
            <DialogDescription>
              Crie e gerencie as categorias de clientes
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Formulário para adicionar/editar categoria */}
            <div className="flex gap-2">
              <Input
                placeholder="Nome da categoria"
                value={categoryFormData.name}
                onChange={(e) => setCategoryFormData({ ...categoryFormData, name: e.target.value })}
                className="flex-1"
              />
              <input
                type="color"
                value={categoryFormData.color}
                onChange={(e) => setCategoryFormData({ ...categoryFormData, color: e.target.value })}
                className="w-10 h-10 rounded border cursor-pointer"
              />
              {editingCategory ? (
                <>
                  <Button onClick={handleUpdateCategory} size="sm">
                    Salvar
                  </Button>
                  <Button onClick={cancelEditCategory} variant="outline" size="sm">
                    Cancelar
                  </Button>
                </>
              ) : (
                <Button onClick={handleAddCategory} size="sm">
                  <FolderPlus className="h-4 w-4 mr-1" />
                  Criar
                </Button>
              )}
            </div>

            {/* Lista de categorias */}
            <div className="space-y-2">
              {categories.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">
                  Nenhuma categoria criada ainda
                </p>
              ) : (
                categories.map(category => (
                  <div
                    key={category.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: category.color }}
                      />
                      <span className="font-medium">{category.name}</span>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => startEditCategory(category)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setCategoryToDelete(category);
                          setDeleteCategoryDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setCategoriesDialogOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Confirmar Exclusão de Categoria */}
      <AlertDialog open={deleteCategoryDialogOpen} onOpenChange={setDeleteCategoryDialogOpen}>
        <AlertDialogContent className="z-[200]">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Categoria</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a categoria <strong>{categoryToDelete?.name}</strong>? Os clientes desta categoria ficarão sem categoria.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCategory} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}