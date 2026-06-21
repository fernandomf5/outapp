import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Download, Phone, Mail, Edit, Trash2, Filter, FolderPlus, Settings2, Folder, Tag, Copy, CheckSquare } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  source: string;
  sourceName: string;
  createdAt: string;
  originalId?: string;
  originalSource?: string;
  categoryId?: string;
}

interface LeadCategory {
  id: string;
  user_id: string;
  name: string;
  color: string;
  created_at: string;
  updated_at: string;
}

interface CategoryAssignment {
  id: string;
  category_id: string;
  lead_source: string;
  lead_id: string;
}

export function GeneralCRMPanel() {
  const { user } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  // Categories state
  const [categories, setCategories] = useState<LeadCategory[]>([]);
  const [categoryAssignments, setCategoryAssignments] = useState<CategoryAssignment[]>([]);
  const [categoriesDialogOpen, setCategoriesDialogOpen] = useState(false);
  const [categoryFormData, setCategoryFormData] = useState({ name: "", color: "#3b82f6" });
  const [editingCategory, setEditingCategory] = useState<LeadCategory | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<LeadCategory | null>(null);
  const [deleteCategoryDialogOpen, setDeleteCategoryDialogOpen] = useState(false);

  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [copyDialogOpen, setCopyDialogOpen] = useState(false);
  const [copyMode, setCopyMode] = useState<"selected" | "category">("selected");
  const [copySourceCategoryId, setCopySourceCategoryId] = useState<string>("");
  const [copyTargetCategoryId, setCopyTargetCategoryId] = useState<string>("");


  // Get unique sources for filter dropdown
  const uniqueSources = useMemo(() => {
    const sources = [...new Set(leads.map(lead => lead.source))];
    return sources.sort();
  }, [leads]);

  // Filtered leads based on source and category filter
  const filteredLeads = useMemo(() => {
    let filtered = leads;
    
    if (sourceFilter !== "all") {
      filtered = filtered.filter(lead => lead.source === sourceFilter);
    }
    
    if (categoryFilter !== "all") {
      if (categoryFilter === "none") {
        filtered = filtered.filter(lead => !lead.categoryId);
      } else {
        filtered = filtered.filter(lead => lead.categoryId === categoryFilter);
      }
    }
    
    return filtered;
  }, [leads, sourceFilter, categoryFilter]);

  useEffect(() => {
    if (!user) return;
    fetchCategories();
    fetchCategoryAssignments();
    fetchAllLeads();
  }, [user]);

  const fetchCategories = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('lead_categories')
        .select('*')
        .eq('user_id', user.id)
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error: any) {
      console.error('Erro ao buscar categorias:', error);
    }
  };

  const fetchCategoryAssignments = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('lead_category_assignments')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      setCategoryAssignments(data || []);
    } catch (error: any) {
      console.error('Erro ao buscar atribuições de categorias:', error);
    }
  };

  const getCategoryForLead = (leadSource: string, leadId: string): string | undefined => {
    const assignment = categoryAssignments.find(
      a => a.lead_source === leadSource && a.lead_id === leadId
    );
    return assignment?.category_id;
  };

  const getCategoryById = (id: string | undefined) => {
    if (!id) return null;
    return categories.find(c => c.id === id);
  };

  const fetchAllLeads = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const allLeads: Lead[] = [];
      const existingLeadIds = new Set<string>();

      // 1. Buscar clientes da Gestão de Clientes (tabela customers)
      const { data: customers } = await supabase
        .from('customers')
        .select('id, name, email, phone, status, created_at')
        .eq('user_id', user.id);

      if (customers) {
        customers.forEach(customer => {
          existingLeadIds.add(`customers-${customer.id}`);
          allLeads.push({
            id: `customer-${customer.id}`,
            originalId: customer.id,
            originalSource: 'customers',
            name: customer.name || 'N/A',
            email: customer.email || 'N/A',
            phone: customer.phone || 'N/A',
            source: 'Gestão de Clientes',
            sourceName: customer.status || 'Cliente',
            createdAt: customer.created_at
          });
        });
      }

      // 1b. Buscar leads do Cadastro (tabela contacts)
      const { data: regCats } = await supabase
        .from('registration_categories')
        .select('id, name')
        .eq('user_id', user.id);
      const regCatMap = new Map<string, string>((regCats || []).map((r: any) => [r.id, r.name]));

      const { data: contacts } = await supabase
        .from('contacts')
        .select('id, name, email, phone, source, registration_category_id, created_at')
        .eq('user_id', user.id);

      if (contacts) {
        contacts.forEach((c: any) => {
          existingLeadIds.add(`contacts-${c.id}`);
          allLeads.push({
            id: `contact-${c.id}`,
            originalId: c.id,
            originalSource: 'contacts',
            name: c.name || 'N/A',
            email: c.email || 'N/A',
            phone: c.phone || 'N/A',
            source: 'Cadastro',
            sourceName: regCatMap.get(c.registration_category_id) || c.source || 'Cadastro',
            createdAt: c.created_at
          });
        });
      }

      // 2. Buscar leads de conversas de chatbots
      const { data: chatbots } = await supabase
        .from('chatbots')
        .select('id, name')
        .eq('user_id', user.id);


      if (chatbots && chatbots.length > 0) {
        const chatbotIds = chatbots.map(c => c.id);
        
        const { data: chatbotConversations } = await supabase
          .from('chatbot_conversations')
          .select('id, visitor_name, visitor_email, visitor_phone, chatbot_id, created_at')
          .in('chatbot_id', chatbotIds)
          .not('visitor_name', 'is', null);

        if (chatbotConversations) {
          chatbotConversations.forEach(conv => {
            const chatbot = chatbots.find(c => c.id === conv.chatbot_id);
            if (conv.visitor_name || conv.visitor_email || conv.visitor_phone) {
              existingLeadIds.add(`chatbot_conversations-${conv.id}`);
              allLeads.push({
                id: `chatbot-${conv.id}`,
                originalId: conv.id,
                originalSource: 'chatbot_conversations',
                name: conv.visitor_name || 'N/A',
                email: conv.visitor_email || 'N/A',
                phone: conv.visitor_phone || 'N/A',
                source: 'Chatbot',
                sourceName: chatbot?.name || 'Chatbot',
                createdAt: conv.created_at
              });
            }
          });
        }
      }

      // 3. Buscar leads de Chat Online (apenas clientes cadastrados/verificados)
      const { data: agents } = await supabase
        .from('ai_agents')
        .select('id, name')
        .eq('user_id', user.id);

      if (agents && agents.length > 0) {
        const agentIds = agents.map(a => a.id);
        
        const { data: agentCustomers } = await supabase
          .from('agent_customers')
          .select('id, name, email, phone, agent_id, created_at, email_verified')
          .in('agent_id', agentIds)
          .eq('email_verified', true);

        if (agentCustomers) {
          agentCustomers.forEach(customer => {
            const agent = agents.find(a => a.id === customer.agent_id);
            existingLeadIds.add(`agent_customers-${customer.id}`);
            allLeads.push({
              id: `agent-${customer.id}`,
              originalId: customer.id,
              originalSource: 'agent_customers',
              name: customer.name || 'N/A',
              email: customer.email || 'N/A',
              phone: customer.phone || 'N/A',
              source: 'Chat Online',
              sourceName: agent?.name || 'Chat Online',
              createdAt: customer.created_at
            });
          });
        }
      }

      // 4. Buscar leads de páginas clonadas
      const { data: clonedPages } = await supabase
        .from('cloned_pages')
        .select('id')
        .eq('user_id', user.id);

      if (clonedPages && clonedPages.length > 0) {
        const pageIds = clonedPages.map(p => p.id);
        
        const { data: pageLeads } = await supabase
          .from('cloned_page_leads')
          .select('id, name, email, phone, page_id, created_at')
          .in('page_id', pageIds);

        if (pageLeads) {
          pageLeads.forEach(lead => {
            existingLeadIds.add(`cloned_page_leads-${lead.id}`);
            allLeads.push({
              id: `page-${lead.id}`,
              originalId: lead.id,
              originalSource: 'cloned_page_leads',
              name: lead.name || 'N/A',
              email: lead.email || 'N/A',
              phone: lead.phone || 'N/A',
              source: 'Página Clonada',
              sourceName: 'Página Clonada',
              createdAt: lead.created_at
            });
          });
        }
      }

      // 5. Buscar leads órfãos dos assignments (leads que foram removidos da origem mas ainda têm categoria)
      const { data: orphanAssignments } = await supabase
        .from('lead_category_assignments')
        .select('*, lead_categories!inner(name, color)')
        .eq('user_id', user.id);

      if (orphanAssignments) {
        orphanAssignments.forEach(assignment => {
          const key = `${assignment.lead_source}-${assignment.lead_id}`;
          // Só adiciona se o lead não existe nas fontes originais
          if (!existingLeadIds.has(key)) {
            const category = assignment.lead_categories as any;
            allLeads.push({
              id: `orphan-${assignment.lead_id}`,
              originalId: assignment.lead_id,
              originalSource: assignment.lead_source,
              name: 'Lead Categorizado',
              email: 'N/A',
              phone: 'N/A',
              source: 'Categoria',
              sourceName: category?.name || 'Categoria',
              createdAt: assignment.created_at,
              categoryId: assignment.category_id
            });
          }
        });
      }

      // Ordenar por data mais recente
      allLeads.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      setLeads(allLeads);
    } catch (error) {
      console.error('Erro ao buscar leads:', error);
      toast.error('Erro ao carregar leads');
    } finally {
      setLoading(false);
    }
  };

  // Atualizar leads com categorias quando assignments mudar
  useEffect(() => {
    if (leads.length > 0 && categoryAssignments.length >= 0) {
      setLeads(prevLeads => prevLeads.map(lead => ({
        ...lead,
        categoryId: getCategoryForLead(lead.originalSource || '', lead.originalId || '')
      })));
    }
  }, [categoryAssignments]);

  // Category CRUD
  const handleAddCategory = async () => {
    if (!user || !categoryFormData.name.trim()) {
      toast.error('Nome da categoria é obrigatório');
      return;
    }

    try {
      const { error } = await supabase
        .from('lead_categories')
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
        .from('lead_categories')
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
        .from('lead_categories')
        .delete()
        .eq('id', categoryToDelete.id);

      if (error) throw error;

      toast.success('Categoria excluída!');
      setDeleteCategoryDialogOpen(false);
      setCategoryToDelete(null);
      fetchCategories();
      fetchCategoryAssignments();
    } catch (error: any) {
      console.error('Erro ao excluir categoria:', error);
      toast.error('Erro ao excluir categoria');
    }
  };

  const startEditCategory = (category: LeadCategory) => {
    setEditingCategory(category);
    setCategoryFormData({ name: category.name, color: category.color });
  };

  const cancelEditCategory = () => {
    setEditingCategory(null);
    setCategoryFormData({ name: "", color: "#3b82f6" });
  };

  const assignCategoryToLead = async (lead: Lead, categoryId: string | null) => {
    if (!user || !lead.originalSource || !lead.originalId) return;

    try {
      // Primeiro, remove qualquer atribuição existente
      await supabase
        .from('lead_category_assignments')
        .delete()
        .eq('user_id', user.id)
        .eq('lead_source', lead.originalSource)
        .eq('lead_id', lead.originalId);

      // Se categoryId não é null, cria nova atribuição
      if (categoryId) {
        const { error } = await supabase
          .from('lead_category_assignments')
          .insert({
            user_id: user.id,
            category_id: categoryId,
            lead_source: lead.originalSource,
            lead_id: lead.originalId,
          });

        if (error) throw error;
      }

      toast.success('Categoria atualizada!');
      fetchCategoryAssignments();
    } catch (error: any) {
      console.error('Erro ao atribuir categoria:', error);
      toast.error('Erro ao atribuir categoria');
    }
  };

  const downloadPhones = () => {
    const phones = filteredLeads
      .filter(lead => lead.phone && lead.phone !== 'N/A')
      .map(lead => lead.phone)
      .join('\n');

    const blob = new Blob([phones], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `telefones-leads${sourceFilter !== 'all' ? `-${sourceFilter}` : ''}.txt`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Telefones baixados com sucesso!');
  };

  const downloadEmails = () => {
    const emails = filteredLeads
      .filter(lead => lead.email && lead.email !== 'N/A')
      .map(lead => lead.email)
      .join('\n');

    const blob = new Blob([emails], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `emails-leads${sourceFilter !== 'all' ? `-${sourceFilter}` : ''}.txt`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('E-mails baixados com sucesso!');
  };

  const deleteLead = async (lead: Lead) => {
    if (!confirm(`Tem certeza que deseja excluir o lead de ${lead.name}?`)) return;

    if (!lead.originalSource || !lead.originalId) {
      toast.error('Não foi possível identificar a origem do lead');
      return;
    }

    const { error } = await supabase
      .from(lead.originalSource as any)
      .delete()
      .eq('id', lead.originalId);

    if (error) {
      toast.error('Erro ao excluir lead: ' + error.message);
    } else {
      toast.success('Lead excluído com sucesso');
      fetchAllLeads();
    }
  };

  const openEditDialog = (lead: Lead) => {
    setEditingLead(lead);
    setEditDialogOpen(true);
  };

  const updateLead = async () => {
    if (!editingLead || !editingLead.originalSource || !editingLead.originalId) return;

    let updateData: any = {};
    
    if (editingLead.originalSource === 'chatbot_conversations') {
      updateData = {
        visitor_name: editingLead.name,
        visitor_email: editingLead.email,
        visitor_phone: editingLead.phone,
      };
    } else if (editingLead.originalSource === 'customers') {
      updateData = {
        name: editingLead.name,
        email: editingLead.email || null,
        phone: editingLead.phone || null,
      };
    } else {
      updateData = {
        name: editingLead.name,
        email: editingLead.email,
        phone: editingLead.phone,
      };
    }

    const { error } = await supabase
      .from(editingLead.originalSource as any)
      .update(updateData)
      .eq('id', editingLead.originalId);

    if (error) {
      toast.error('Erro ao atualizar lead: ' + error.message);
    } else {
      toast.success('Lead atualizado com sucesso');
      setEditDialogOpen(false);
      fetchAllLeads();
    }
  };

  const downloadAllLeads = () => {
    const csv = [
      'Nome,Email,Telefone,Origem,Fonte,Categoria,Data',
      ...filteredLeads.map(lead => {
        const category = getCategoryById(lead.categoryId);
        return `"${lead.name}","${lead.email}","${lead.phone}","${lead.source}","${lead.sourceName}","${category?.name || ''}","${new Date(lead.createdAt).toLocaleString('pt-BR')}"`;
      })
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leads${sourceFilter !== 'all' ? `-${sourceFilter}` : ''}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Leads baixados com sucesso!');
  };

  // ===== Bulk selection helpers =====
  const toggleSelect = (leadId: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(leadId)) next.delete(leadId); else next.add(leadId);
      return next;
    });
  };

  const allFilteredSelected = filteredLeads.length > 0 && filteredLeads.every(l => selectedIds.has(l.id));
  const toggleSelectAll = () => {
    if (allFilteredSelected) {
      setSelectedIds(prev => {
        const next = new Set(prev);
        filteredLeads.forEach(l => next.delete(l.id));
        return next;
      });
    } else {
      setSelectedIds(prev => {
        const next = new Set(prev);
        filteredLeads.forEach(l => next.add(l.id));
        return next;
      });
    }
  };

  const selectedLeads = useMemo(() => leads.filter(l => selectedIds.has(l.id)), [leads, selectedIds]);

  const downloadSelectedCSV = () => {
    if (selectedLeads.length === 0) {
      toast.error('Nenhum lead selecionado');
      return;
    }
    const csv = [
      'Nome,Email,Telefone,Origem,Fonte,Categoria,Data',
      ...selectedLeads.map(lead => {
        const category = getCategoryById(lead.categoryId);
        return `"${lead.name}","${lead.email}","${lead.phone}","${lead.source}","${lead.sourceName}","${category?.name || ''}","${new Date(lead.createdAt).toLocaleString('pt-BR')}"`;
      })
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leads-selecionados.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success(`${selectedLeads.length} leads baixados!`);
  };

  const bulkAssignCategory = async (categoryId: string | null) => {
    if (!user || selectedLeads.length === 0) {
      toast.error('Nenhum lead selecionado');
      return;
    }
    try {
      const targets = selectedLeads.filter(l => l.originalSource && l.originalId);
      // Remove existing assignments
      await Promise.all(targets.map(l =>
        supabase.from('lead_category_assignments').delete()
          .eq('user_id', user.id)
          .eq('lead_source', l.originalSource!)
          .eq('lead_id', l.originalId!)
      ));
      if (categoryId) {
        const rows = targets.map(l => ({
          user_id: user.id,
          category_id: categoryId,
          lead_source: l.originalSource!,
          lead_id: l.originalId!,
        }));
        if (rows.length > 0) {
          const { error } = await supabase.from('lead_category_assignments').insert(rows);
          if (error) throw error;
        }
      }
      toast.success(`Categoria aplicada a ${targets.length} leads`);
      setSelectedIds(new Set());
      fetchCategoryAssignments();
    } catch (e: any) {
      console.error(e);
      toast.error('Erro ao aplicar categoria em massa');
    }
  };

  const copyCategoryLeads = async () => {
    if (!user || !copyTargetCategoryId) {
      toast.error('Selecione a categoria de destino');
      return;
    }
    try {
      let sourceLeads: Lead[] = [];
      if (copyMode === 'selected') {
        sourceLeads = selectedLeads;
      } else {
        if (!copySourceCategoryId) {
          toast.error('Selecione a categoria de origem');
          return;
        }
        sourceLeads = leads.filter(l => l.categoryId === copySourceCategoryId);
      }
      const targets = sourceLeads.filter(l => l.originalSource && l.originalId);
      if (targets.length === 0) {
        toast.error('Nenhum lead encontrado para copiar');
        return;
      }
      const rows = targets.map(l => ({
        user_id: user.id,
        category_id: copyTargetCategoryId,
        lead_source: l.originalSource!,
        lead_id: l.originalId!,
      }));
      // Schema only allows one category per lead, so we move (delete any existing then insert)
      await Promise.all(targets.map(l =>
        supabase.from('lead_category_assignments').delete()
          .eq('user_id', user.id)
          .eq('lead_source', l.originalSource!)
          .eq('lead_id', l.originalId!)
      ));
      const { error } = await supabase.from('lead_category_assignments').insert(rows);
      if (error) throw error;
      toast.success(`${targets.length} leads copiados para a categoria`);
      setCopyDialogOpen(false);
      setCopySourceCategoryId('');
      setCopyTargetCategoryId('');
      fetchCategoryAssignments();
    } catch (e: any) {
      console.error(e);
      toast.error('Erro ao copiar leads');
    }
  };

  return (

    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Controle de Leads</CardTitle>
              <CardDescription>
                Todos os leads e clientes: gestão de clientes, chatbots, chat online e páginas clonadas
              </CardDescription>
            </div>
            <Button variant="outline" onClick={() => setCategoriesDialogOpen(true)}>
              <Settings2 className="h-4 w-4 mr-2" />
              Gerenciar Categorias
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Categorias como Cards Clicáveis (Pastas) */}
          {categories.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-muted-foreground mb-3">Categorias de Leads:</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {categories.map((category) => {
                  const categoryLeadCount = leads.filter(l => l.categoryId === category.id).length;
                  return (
                    <div
                      key={category.id}
                      onClick={() => setCategoryFilter(categoryFilter === category.id ? 'all' : category.id)}
                      className={`relative group rounded-lg border p-4 hover:shadow-md transition-all cursor-pointer ${
                        categoryFilter === category.id ? 'ring-2 ring-offset-2' : ''
                      }`}
                      style={{ 
                        borderColor: category.color, 
                        backgroundColor: `${category.color}10`,
                        ...(categoryFilter === category.id ? { ringColor: category.color } : {})
                      }}
                    >
                      <div className="flex flex-col items-center text-center">
                        <Folder className="h-8 w-8 mb-2" style={{ color: category.color }} />
                        <span className="font-medium text-sm truncate w-full" style={{ color: category.color }}>
                          {category.name}
                        </span>
                        <span className="text-xs text-muted-foreground">{categoryLeadCount} leads</span>
                      </div>
                    </div>
                  );
                })}
                
                {/* Card para Sem Categoria */}
                <div
                  onClick={() => setCategoryFilter(categoryFilter === 'none' ? 'all' : 'none')}
                  className={`relative group rounded-lg border border-dashed p-4 hover:shadow-md transition-all cursor-pointer border-muted-foreground/30 ${
                    categoryFilter === 'none' ? 'ring-2 ring-offset-2 ring-muted-foreground' : ''
                  }`}
                >
                  <div className="flex flex-col items-center text-center">
                    <Folder className="h-8 w-8 mb-2 text-muted-foreground" />
                    <span className="font-medium text-sm truncate w-full text-muted-foreground">
                      Sem Categoria
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {leads.filter(l => !l.categoryId).length} leads
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4">
            <div className="flex items-center gap-2 flex-wrap">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={sourceFilter} onValueChange={setSourceFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filtrar por origem" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as origens</SelectItem>
                  {uniqueSources.map(source => (
                    <SelectItem key={source} value={source}>{source}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Folder className="h-4 w-4 text-muted-foreground ml-2" />
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filtrar por categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as categorias</SelectItem>
                  <SelectItem value="none">Sem categoria</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category.id} value={category.id}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: category.color }}
                        />
                        {category.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={downloadPhones} variant="outline" size="sm">
                <Phone className="h-4 w-4 mr-2" />
                Baixar Telefones
              </Button>
              <Button onClick={downloadEmails} variant="outline" size="sm">
                <Mail className="h-4 w-4 mr-2" />
                Baixar E-mails
              </Button>
              <Button onClick={downloadAllLeads} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Baixar CSV (filtrados)
              </Button>
              <Button
                onClick={() => { setCopyMode('category'); setCopyDialogOpen(true); }}
                variant="outline"
                size="sm"
              >
                <Copy className="h-4 w-4 mr-2" />
                Copiar categoria → categoria
              </Button>
            </div>
          </div>

          {/* Bulk actions bar (visible when items selected) */}
          {selectedIds.size > 0 && (
            <div className="mb-4 flex flex-wrap items-center gap-2 p-3 rounded-md border bg-muted/40">
              <CheckSquare className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">{selectedIds.size} selecionados</span>
              <div className="ml-auto flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={downloadSelectedCSV}>
                  <Download className="h-4 w-4 mr-2" />
                  Baixar selecionados
                </Button>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button size="sm" variant="outline">
                      <Tag className="h-4 w-4 mr-2" />
                      Atribuir categoria
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-56 p-2" align="end">
                    <div className="space-y-1">
                      <Button variant="ghost" size="sm" className="w-full justify-start"
                        onClick={() => bulkAssignCategory(null)}>
                        <span className="text-muted-foreground">Remover categoria</span>
                      </Button>
                      {categories.map(cat => (
                        <Button key={cat.id} variant="ghost" size="sm" className="w-full justify-start"
                          onClick={() => bulkAssignCategory(cat.id)}>
                          <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: cat.color }} />
                          {cat.name}
                        </Button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
                <Button size="sm" variant="outline"
                  onClick={() => { setCopyMode('selected'); setCopyDialogOpen(true); }}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copiar para categoria
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setSelectedIds(new Set())}>
                  Limpar
                </Button>
              </div>
            </div>
          )}


          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Carregando leads...
            </div>
          ) : filteredLeads.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {sourceFilter !== "all" || categoryFilter !== "all" 
                ? "Nenhum lead encontrado com os filtros selecionados" 
                : "Nenhum lead capturado ainda"}
            </div>
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <Checkbox
                        checked={allFilteredSelected}
                        onCheckedChange={toggleSelectAll}
                        aria-label="Selecionar todos"
                      />
                    </TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>E-mail</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Origem</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLeads.map((lead) => {
                    const category = getCategoryById(lead.categoryId);
                    return (
                      <TableRow key={lead.id}>
                        <TableCell className="font-medium">{lead.name}</TableCell>
                        <TableCell>{lead.email}</TableCell>
                        <TableCell>{lead.phone}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{lead.source}</Badge>
                        </TableCell>
                        <TableCell>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 px-2">
                                {category ? (
                                  <div className="flex items-center gap-2">
                                    <div 
                                      className="w-3 h-3 rounded-full" 
                                      style={{ backgroundColor: category.color }}
                                    />
                                    <span className="text-sm">{category.name}</span>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-1 text-muted-foreground">
                                    <Tag className="h-3 w-3" />
                                    <span className="text-xs">Adicionar</span>
                                  </div>
                                )}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-48 p-2" align="start">
                              <div className="space-y-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="w-full justify-start"
                                  onClick={() => assignCategoryToLead(lead, null)}
                                >
                                  <span className="text-muted-foreground">Sem categoria</span>
                                </Button>
                                {categories.map(cat => (
                                  <Button
                                    key={cat.id}
                                    variant="ghost"
                                    size="sm"
                                    className="w-full justify-start"
                                    onClick={() => assignCategoryToLead(lead, cat.id)}
                                  >
                                    <div 
                                      className="w-3 h-3 rounded-full mr-2" 
                                      style={{ backgroundColor: cat.color }}
                                    />
                                    {cat.name}
                                  </Button>
                                ))}
                              </div>
                            </PopoverContent>
                          </Popover>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(lead.createdAt).toLocaleDateString('pt-BR')}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditDialog(lead)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteLead(lead)}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          <div className="mt-4 text-sm text-muted-foreground">
            {sourceFilter !== "all" || categoryFilter !== "all" ? (
              <>Mostrando <span className="font-semibold">{filteredLeads.length}</span> de <span className="font-semibold">{leads.length}</span> leads</>
            ) : (
              <>Total de leads: <span className="font-semibold">{leads.length}</span></>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dialog de Edição de Lead */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Lead</DialogTitle>
          </DialogHeader>
          {editingLead && (
            <div className="space-y-4">
              <div>
                <Label>Nome</Label>
                <Input
                  value={editingLead.name}
                  onChange={(e) => setEditingLead({ ...editingLead, name: e.target.value })}
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  value={editingLead.email || ''}
                  onChange={(e) => setEditingLead({ ...editingLead, email: e.target.value })}
                />
              </div>
              <div>
                <Label>Telefone</Label>
                <Input
                  value={editingLead.phone || ''}
                  onChange={(e) => setEditingLead({ ...editingLead, phone: e.target.value })}
                />
              </div>
              <Button onClick={updateLead} className="w-full">
                Salvar Alterações
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de Gerenciamento de Categorias */}
      <Dialog open={categoriesDialogOpen} onOpenChange={setCategoriesDialogOpen} modal={false}>
        <DialogContent className="max-w-md z-[60] top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%]">
          <DialogHeader>
            <DialogTitle>Gerenciar Categorias de Leads</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Form para adicionar/editar categoria */}
            <div className="space-y-3 p-4 border rounded-lg">
              <div className="flex gap-2">
                <div className="flex-1">
                  <Label>Nome da Categoria</Label>
                  <Input
                    value={categoryFormData.name}
                    onChange={(e) => setCategoryFormData({ ...categoryFormData, name: e.target.value })}
                    placeholder="Ex: Clientes VIP"
                  />
                </div>
                <div>
                  <Label>Cor</Label>
                  <Input
                    type="color"
                    value={categoryFormData.color}
                    onChange={(e) => setCategoryFormData({ ...categoryFormData, color: e.target.value })}
                    className="w-14 h-10 p-1 cursor-pointer"
                  />
                </div>
              </div>
              {editingCategory ? (
                <div className="flex gap-2">
                  <Button onClick={handleUpdateCategory} className="flex-1">
                    Salvar
                  </Button>
                  <Button variant="outline" onClick={cancelEditCategory}>
                    Cancelar
                  </Button>
                </div>
              ) : (
                <Button onClick={handleAddCategory} className="w-full">
                  <FolderPlus className="h-4 w-4 mr-2" />
                  Adicionar Categoria
                </Button>
              )}
            </div>

            {/* Lista de categorias existentes */}
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {categories.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">
                  Nenhuma categoria criada ainda
                </p>
              ) : (
                categories.map(category => (
                  <div
                    key={category.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: category.color }}
                      />
                      <span>{category.name}</span>
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
        </DialogContent>
      </Dialog>

      {/* Confirmação de exclusão de categoria */}
      <AlertDialog open={deleteCategoryDialogOpen} onOpenChange={setDeleteCategoryDialogOpen}>
        <AlertDialogContent className="z-[200]">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Categoria</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a categoria "{categoryToDelete?.name}"? 
              Todos os leads associados a ela ficarão sem categoria.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCategory} className="bg-destructive text-destructive-foreground">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}