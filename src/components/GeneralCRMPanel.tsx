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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";

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

const getLeadAssignmentKey = (leadSource?: string, leadId?: string) => {
  return leadSource && leadId ? `${leadSource}:${leadId}` : '';
};

const applyAssignmentsToLeads = (sourceLeads: Lead[], assignments: CategoryAssignment[]) => {
  const assignmentMap = new Map(
    assignments.map(assignment => [
      getLeadAssignmentKey(assignment.lead_source, assignment.lead_id),
      assignment.category_id,
    ])
  );

  return sourceLeads.map(lead => ({
    ...lead,
    categoryId: assignmentMap.get(getLeadAssignmentKey(lead.originalSource, lead.originalId)),
  }));
};

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
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkDeleteConfirmText, setBulkDeleteConfirmText] = useState("");
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [singleDeleteLead, setSingleDeleteLead] = useState<Lead | null>(null);
  const [singleDeleteText, setSingleDeleteText] = useState("");
  const [singleDeleting, setSingleDeleting] = useState(false);
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

      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('lead_category_assignments')
        .select('*')
        .eq('user_id', user.id);

      if (assignmentsError) throw assignmentsError;

      const latestAssignments = assignmentsData || [];
      setCategoryAssignments(latestAssignments);

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

      // 4b. Buscar leads do Questionário Marketing
      const { data: qmResponses } = await (supabase as any)
        .from('marketing_questionnaire_responses')
        .select('id, name, email, phone, created_at, marketing_questionnaires!inner(user_id, title)')
        .eq('marketing_questionnaires.user_id', user.id);

      if (qmResponses) {
        qmResponses.forEach((r: any) => {
          existingLeadIds.add(`marketing_questionnaire_responses-${r.id}`);
          allLeads.push({
            id: `qm-${r.id}`,
            originalId: r.id,
            originalSource: 'marketing_questionnaire_responses',
            name: r.name || 'N/A',
            email: r.email || 'N/A',
            phone: r.phone || 'N/A',
            source: 'Questionário Marketing',
            sourceName: r.marketing_questionnaires?.title || 'Questionário Marketing',
            createdAt: r.created_at,
          });
        });
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
      const categorizedLeads = applyAssignmentsToLeads(allLeads, latestAssignments);
      categorizedLeads.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      setLeads(categorizedLeads);
    } catch (error) {
      console.error('Erro ao buscar leads:', error);
      toast.error('Erro ao carregar leads');
    } finally {
      setLoading(false);
    }
  };

  // Atualizar leads com categorias quando assignments mudar
  useEffect(() => {
    setLeads(prevLeads => {
      if (prevLeads.length === 0) return prevLeads;

      const categorizedLeads = applyAssignmentsToLeads(prevLeads, categoryAssignments);
      const hasChanges = categorizedLeads.some((lead, index) => lead.categoryId !== prevLeads[index].categoryId);

      return hasChanges ? categorizedLeads : prevLeads;
    });
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

  const deleteLead = (lead: Lead) => {
    if (!lead.originalSource || !lead.originalId) {
      toast.error('Não foi possível identificar a origem do lead');
      return;
    }
    setSingleDeleteText("");
    setSingleDeleteLead(lead);
  };

  const confirmSingleDelete = async () => {
    if (!singleDeleteLead) return;
    if (singleDeleteText.trim().toUpperCase() !== 'EXCLUIR') {
      toast.error('Digite "EXCLUIR" para confirmar');
      return;
    }
    setSingleDeleting(true);
    try {
      const { error } = await supabase
        .from(singleDeleteLead.originalSource as any)
        .delete()
        .eq('id', singleDeleteLead.originalId);
      if (error) {
        toast.error('Erro ao excluir lead: ' + error.message);
        return;
      }
      // Limpa atribuições de categoria do lead
      if (user) {
        await supabase.from('lead_category_assignments').delete()
          .eq('user_id', user.id)
          .eq('lead_source', singleDeleteLead.originalSource!)
          .eq('lead_id', singleDeleteLead.originalId!);
      }
      toast.success('Lead excluído de todo o sistema');
      setSingleDeleteLead(null);
      setSingleDeleteText("");
      fetchAllLeads();
    } finally {
      setSingleDeleting(false);
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

  const bulkDeleteSelected = async () => {
    if (!user || selectedLeads.length === 0) {
      toast.error('Nenhum lead selecionado');
      return;
    }
    if (bulkDeleteConfirmText.trim().toUpperCase() !== 'EXCLUIR') {
      toast.error('Digite "EXCLUIR" para confirmar');
      return;
    }
    setBulkDeleting(true);
    try {
      const targets = selectedLeads.filter(l => l.originalSource && l.originalId);
      // Group by source table to batch deletes
      const bySource = new Map<string, string[]>();
      targets.forEach(l => {
        const arr = bySource.get(l.originalSource!) || [];
        arr.push(l.originalId!);
        bySource.set(l.originalSource!, arr);
      });
      let totalDeleted = 0;
      let errors: string[] = [];
      for (const [source, ids] of bySource.entries()) {
        const { error } = await supabase.from(source as any).delete().in('id', ids);
        if (error) errors.push(`${source}: ${error.message}`);
        else totalDeleted += ids.length;
      }
      // Also clean category assignments
      await Promise.all(targets.map(l =>
        supabase.from('lead_category_assignments').delete()
          .eq('user_id', user.id)
          .eq('lead_source', l.originalSource!)
          .eq('lead_id', l.originalId!)
      ));
      if (errors.length > 0) {
        toast.error(`Alguns leads não foram excluídos: ${errors.join('; ')}`);
      }
      if (totalDeleted > 0) toast.success(`${totalDeleted} lead(s) excluído(s)`);
      setSelectedIds(new Set());
      setBulkDeleteOpen(false);
      setBulkDeleteConfirmText('');
      fetchAllLeads();
    } catch (e: any) {
      console.error(e);
      toast.error('Erro ao excluir leads em massa');
    } finally {
      setBulkDeleting(false);
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
      <Card className="border-none sm:border shadow-none sm:shadow-sm">
        <CardHeader className="px-4 sm:px-6">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <CardTitle className="text-xl sm:text-2xl truncate">Controle de Leads</CardTitle>
              <CardDescription className="text-xs sm:text-sm line-clamp-2">
                Gestão unificada de leads e clientes de todas as suas fontes.
              </CardDescription>
            </div>
            <TooltipProvider delayDuration={150}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" onClick={() => setCategoriesDialogOpen(true)} className="shrink-0 h-9 w-9">
                    <Settings2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Gerenciar Categorias</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </CardHeader>
        <CardContent className="px-4 sm:px-6">
          {/* Categorias como Pastas - Scroll horizontal no mobile */}
          {categories.length > 0 && (
            <div className="mb-6">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Categorias:</h3>
              <div className="flex sm:grid sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 overflow-x-auto pb-2 sm:pb-0 scrollbar-none">
                {categories.map((category) => {
                  const categoryLeadCount = leads.filter(l => l.categoryId === category.id).length;
                  return (
                    <div
                      key={category.id}
                      onClick={() => setCategoryFilter(categoryFilter === category.id ? 'all' : category.id)}
                      className={`relative group rounded-xl border p-3 sm:p-4 hover:shadow-md transition-all cursor-pointer min-w-[140px] sm:min-w-0 ${
                        categoryFilter === category.id ? 'ring-2 ring-offset-2' : ''
                      }`}
                      style={{ 
                        borderColor: `${category.color}40`, 
                        backgroundColor: `${category.color}10`,
                        ...(categoryFilter === category.id ? { ringColor: category.color } : {})
                      }}
                    >
                      <div className="flex flex-col items-center text-center">
                        <Folder className="h-7 w-7 sm:h-8 sm:w-8 mb-2" style={{ color: category.color }} />
                        <span className="font-bold text-xs sm:text-sm truncate w-full" style={{ color: category.color }}>
                          {category.name}
                        </span>
                        <span className="text-[10px] sm:text-xs text-muted-foreground font-medium">{categoryLeadCount} leads</span>
                      </div>
                    </div>
                  );
                })}
                
                <div
                  onClick={() => setCategoryFilter(categoryFilter === 'none' ? 'all' : 'none')}
                  className={`relative group rounded-xl border border-dashed p-3 sm:p-4 hover:shadow-md transition-all cursor-pointer border-muted-foreground/30 min-w-[140px] sm:min-w-0 ${
                    categoryFilter === 'none' ? 'ring-2 ring-offset-2 ring-muted-foreground' : ''
                  }`}
                >
                  <div className="flex flex-col items-center text-center">
                    <Folder className="h-7 w-7 sm:h-8 sm:w-8 mb-2 text-muted-foreground" />
                    <span className="font-bold text-xs sm:text-sm truncate w-full text-muted-foreground">
                      Sem Categoria
                    </span>
                    <span className="text-[10px] sm:text-xs text-muted-foreground font-medium">
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
            <TooltipProvider delayDuration={150}>
              <div className="flex items-center gap-1 rounded-md border bg-card p-1 sm:ml-auto">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button onClick={downloadPhones} variant="ghost" size="icon" className="h-8 w-8" aria-label="Baixar Telefones">
                      <Phone className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Baixar Telefones</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button onClick={downloadEmails} variant="ghost" size="icon" className="h-8 w-8" aria-label="Baixar E-mails">
                      <Mail className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Baixar E-mails</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button onClick={downloadAllLeads} variant="ghost" size="icon" className="h-8 w-8" aria-label="Baixar CSV filtrados">
                      <Download className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Baixar CSV (filtrados)</TooltipContent>
                </Tooltip>
                <Separator orientation="vertical" className="mx-1 h-6" />
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={() => { setCopyMode('category'); setCopyDialogOpen(true); }}
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      aria-label="Copiar categoria para categoria"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Copiar categoria → categoria</TooltipContent>
                </Tooltip>
              </div>
            </TooltipProvider>
          </div>

          {/* Bulk actions bar (visible when items selected) */}
          {selectedIds.size > 0 && (
            <div className="mb-4 flex flex-wrap items-center gap-2 p-3 rounded-md border bg-muted/40">
              <CheckSquare className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">{selectedIds.size} selecionados</span>
              <TooltipProvider delayDuration={150}>
                <div className="ml-auto flex items-center gap-1 rounded-md border bg-card p-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={downloadSelectedCSV} aria-label="Baixar selecionados">
                        <Download className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Baixar selecionados</TooltipContent>
                  </Tooltip>
                  <Popover>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <PopoverTrigger asChild>
                          <Button size="icon" variant="ghost" className="h-8 w-8" aria-label="Atribuir categoria">
                            <Tag className="h-4 w-4" />
                          </Button>
                        </PopoverTrigger>
                      </TooltipTrigger>
                      <TooltipContent>Atribuir categoria</TooltipContent>
                    </Tooltip>
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
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button size="icon" variant="ghost" className="h-8 w-8"
                        onClick={() => { setCopyMode('selected'); setCopyDialogOpen(true); }}
                        aria-label="Copiar para categoria">
                        <Copy className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Copiar para categoria</TooltipContent>
                  </Tooltip>
                  <Separator orientation="vertical" className="mx-1 h-6" />
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => { setBulkDeleteConfirmText(''); setBulkDeleteOpen(true); }}
                        aria-label="Excluir selecionados"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Excluir selecionados</TooltipContent>
                  </Tooltip>
                  <Separator orientation="vertical" className="mx-1 h-6" />
                  <Button size="sm" variant="ghost" className="h-8" onClick={() => setSelectedIds(new Set())}>
                    Limpar
                  </Button>
                </div>
              </TooltipProvider>
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
                        <TableCell>
                          <Checkbox
                            checked={selectedIds.has(lead.id)}
                            onCheckedChange={() => toggleSelect(lead.id)}
                            aria-label="Selecionar"
                          />
                        </TableCell>
                        <TableCell className="font-medium">
                          {lead.name}
                          <div className="text-xs text-muted-foreground font-normal">{lead.sourceName}</div>
                        </TableCell>
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

      {/* Dialog: copiar leads para categoria */}
      <Dialog open={copyDialogOpen} onOpenChange={setCopyDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {copyMode === 'selected' ? 'Mover selecionados para categoria' : 'Mover leads entre categorias'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground">
              Cada lead pode estar em apenas uma categoria, portanto esta ação move os leads para a categoria de destino.
            </p>
            {copyMode === 'category' && (
              <div>
                <Label>Categoria de origem</Label>
                <Select value={copySourceCategoryId} onValueChange={setCopySourceCategoryId}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {categories.map(c => (
                      <SelectItem key={c.id} value={c.id}>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: c.color }} />
                          {c.name} ({leads.filter(l => l.categoryId === c.id).length})
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <Label>Categoria de destino</Label>
              <Select value={copyTargetCategoryId} onValueChange={setCopyTargetCategoryId}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {categories.filter(c => c.id !== copySourceCategoryId).map(c => (
                    <SelectItem key={c.id} value={c.id}>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: c.color }} />
                        {c.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setCopyDialogOpen(false)}>Cancelar</Button>
              <Button onClick={copyCategoryLeads}>Confirmar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!singleDeleteLead} onOpenChange={(o) => { if (!o) { setSingleDeleteLead(null); setSingleDeleteText(""); } }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive flex items-center gap-2">
              <Trash2 className="h-5 w-5" /> Excluir lead permanentemente
            </AlertDialogTitle>
            <AlertDialogDescription>
              Esse lead vai sair <strong>totalmente do sistema</strong> — tanto daqui do Controle de Leads
              quanto da origem onde ele foi cadastrado
              {singleDeleteLead?.sourceName ? <> (<strong>{singleDeleteLead.sourceName}</strong>)</> : null}.
              Esta ação <strong>não pode ser desfeita</strong>. Deseja mesmo excluir?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <Label className="text-xs">Digite <strong>EXCLUIR</strong> para confirmar:</Label>
            <Input
              value={singleDeleteText}
              onChange={(e) => setSingleDeleteText(e.target.value)}
              placeholder="EXCLUIR"
              autoFocus
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={singleDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); confirmSingleDelete(); }}
              disabled={singleDeleting || singleDeleteText.trim().toUpperCase() !== 'EXCLUIR'}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {singleDeleting ? 'Excluindo...' : 'Excluir definitivamente'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={bulkDeleteOpen} onOpenChange={(o) => { setBulkDeleteOpen(o); if (!o) setBulkDeleteConfirmText(''); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive flex items-center gap-2">
              <Trash2 className="h-5 w-5" /> Excluir leads selecionados
            </AlertDialogTitle>
            <AlertDialogDescription>
              Você está prestes a excluir <strong>{selectedIds.size}</strong> lead(s) permanentemente.
              Esta ação <strong>não pode ser desfeita</strong> e removerá o registro original em cada origem (chat, agente, página clonada, cliente, etc.).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <Label className="text-xs">Digite <strong>EXCLUIR</strong> para confirmar:</Label>
            <Input
              value={bulkDeleteConfirmText}
              onChange={(e) => setBulkDeleteConfirmText(e.target.value)}
              placeholder="EXCLUIR"
              autoFocus
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={bulkDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); bulkDeleteSelected(); }}
              disabled={bulkDeleting || bulkDeleteConfirmText.trim().toUpperCase() !== 'EXCLUIR'}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {bulkDeleting ? 'Excluindo...' : 'Excluir definitivamente'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}