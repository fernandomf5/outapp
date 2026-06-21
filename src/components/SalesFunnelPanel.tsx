import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Settings, Trash2, Edit, ArrowRight, GripVertical, User, Phone, Mail, Building, DollarSign, Calendar, Tag, ChevronRight, Filter, BarChart3, Eye, History, Pencil, Camera, Loader2, ChevronDown, ChevronUp, Users, Folder, FolderOpen, Search, UserPlus } from 'lucide-react';
import FunnelChart from './FunnelChart';

import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent, DragOverlay, DragStartEvent, useDroppable, useDraggable } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface CustomerCategory {
  id: string;
  name: string;
  color: string;
}

interface Customer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  category_id: string | null;
}

interface SalesFunnel {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  color: string;
  is_active: boolean;
  created_at: string;
}

interface FunnelStage {
  id: string;
  funnel_id: string;
  name: string;
  color: string;
  order_index: number;
}

interface FunnelLead {
  id: string;
  funnel_id: string;
  stage_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  value: number;
  notes: string | null;
  tags: string[] | null;
  priority: string;
  expected_close_date: string | null;
  created_at: string;
}

interface LeadHistory {
  id: string;
  lead_id: string;
  from_stage_id: string | null;
  to_stage_id: string;
  notes: string | null;
  created_at: string;
}

// Sortable Stage Item Component
function SortableStageItem({ stage, leadsCount, onEdit, onDelete }: {
  stage: FunnelStage;
  leadsCount: number;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: stage.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 p-3 bg-muted rounded-lg ${isDragging ? 'ring-2 ring-primary shadow-lg' : ''}`}
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted-foreground/10 rounded"
      >
        <GripVertical className="w-4 h-4 text-muted-foreground" />
      </div>
      <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: stage.color }} />
      <span className="flex-1 font-medium">{stage.name}</span>
      <Badge variant="secondary">{leadsCount} leads</Badge>
      <Button variant="ghost" size="icon" onClick={onEdit}>
        <Edit className="w-4 h-4" />
      </Button>
      <Button variant="ghost" size="icon" className="text-destructive" onClick={onDelete}>
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  );
}

// Draggable Lead Card Component
function DraggableLeadCard({ lead, stages, onEdit, onDelete, onView }: { 
  lead: FunnelLead; 
  stages: FunnelStage[];
  onEdit: (lead: FunnelLead) => void;
  onDelete: (id: string) => void;
  onView: (lead: FunnelLead) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: lead.id,
    data: { lead }
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    zIndex: isDragging ? 1000 : 1,
    opacity: isDragging ? 0.8 : 1,
  } : undefined;

  const priorityColors = {
    low: 'bg-green-500/20 text-green-600 border-green-500/30',
    medium: 'bg-yellow-500/20 text-yellow-600 border-yellow-500/30',
    high: 'bg-red-500/20 text-red-600 border-red-500/30',
  };

  const priorityLabels = {
    low: 'Baixa',
    medium: 'Média',
    high: 'Alta',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-card border rounded-lg p-3 cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md transition-shadow ${isDragging ? 'ring-2 ring-primary' : ''}`}
      {...attributes}
      {...listeners}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <GripVertical className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <span className="font-medium text-sm line-clamp-1">{lead.name}</span>
        </div>
        <div className="flex gap-1 flex-shrink-0">
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); onView(lead); }}>
            <Eye className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); onEdit(lead); }}>
            <Pencil className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={(e) => { e.stopPropagation(); onDelete(lead.id); }}>
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {lead.company && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
          <Building className="w-3 h-3" />
          <span className="truncate">{lead.company}</span>
        </div>
      )}

      {lead.value > 0 && (
        <div className="flex items-center gap-1.5 text-xs font-medium text-primary mb-1">
          <DollarSign className="w-3 h-3" />
          <span>R$ {lead.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
        </div>
      )}

      <div className="flex items-center justify-between mt-2">
        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${priorityColors[lead.priority]}`}>
          {priorityLabels[lead.priority]}
        </Badge>
        {lead.expected_close_date && (
          <span className="text-[10px] text-muted-foreground">
            {format(new Date(lead.expected_close_date), 'dd/MM/yy')}
          </span>
        )}
      </div>
    </div>
  );
}

// Droppable Stage Column Component
function DroppableStageColumn({ stage, leads, children, onAddLead }: { 
  stage: FunnelStage; 
  leads: FunnelLead[];
  children: React.ReactNode;
  onAddLead: () => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: stage.id,
    data: { stage }
  });

  const totalValue = leads.reduce((acc, lead) => acc + (lead.value || 0), 0);

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col min-w-[290px] max-w-[290px] rounded-xl border-2 backdrop-blur-sm shadow-lg transition-all duration-300 ${isOver ? 'scale-[1.02] shadow-2xl ring-2 ring-primary/40' : 'hover:shadow-xl'}`}
      style={{
        background: `linear-gradient(180deg, ${stage.color}14 0%, hsl(var(--card)) 60%)`,
        borderColor: isOver ? stage.color : stage.color + '55',
      }}
    >
      <div
        className="p-3 rounded-t-xl relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${stage.color}33, ${stage.color}10)`,
          borderBottom: `2px solid ${stage.color}55`,
        }}
      >
        <div className="absolute top-0 left-0 right-0 h-1" style={{ background: stage.color }} />
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full ring-2 ring-background shadow" style={{ backgroundColor: stage.color, boxShadow: `0 0 12px ${stage.color}` }} />
            <span className="font-bold text-sm tracking-tight">{stage.name}</span>
          </div>
          <Badge
            className="text-xs font-bold border-0 text-white shadow"
            style={{ backgroundColor: stage.color }}
          >
            {leads.length}
          </Badge>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold" style={{ color: stage.color }}>
            R$ {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </span>
          <Button variant="ghost" size="sm" className="h-6 px-2 text-xs hover:bg-background/60" onClick={onAddLead}>
            <Plus className="w-3 h-3 mr-1" />
            Add
          </Button>
        </div>
      </div>
      <ScrollArea className="flex-1 p-2" style={{ maxHeight: 'calc(100vh - 400px)' }}>
        <div className="space-y-2">
          {children}
        </div>
      </ScrollArea>
    </div>
  );
}

export default function SalesFunnelPanel() {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [funnels, setFunnels] = useState<SalesFunnel[]>([]);
  const [selectedFunnel, setSelectedFunnel] = useState<SalesFunnel | null>(null);
  const [stages, setStages] = useState<FunnelStage[]>([]);
  const [leads, setLeads] = useState<FunnelLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('kanban');
  const [isProcessingOCR, setIsProcessingOCR] = useState(false);
  const [showFunnelChart, setShowFunnelChart] = useState(true);
  
  // Dialog states
  const [showFunnelDialog, setShowFunnelDialog] = useState(false);
  const [showStageDialog, setShowStageDialog] = useState(false);
  const [showLeadDialog, setShowLeadDialog] = useState(false);
  const [showLeadDetailDialog, setShowLeadDetailDialog] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  
  // Edit states
  const [editingFunnel, setEditingFunnel] = useState<SalesFunnel | null>(null);
  const [editingStage, setEditingStage] = useState<FunnelStage | null>(null);
  const [editingLead, setEditingLead] = useState<FunnelLead | null>(null);
  const [viewingLead, setViewingLead] = useState<FunnelLead | null>(null);
  const [leadHistory, setLeadHistory] = useState<LeadHistory[]>([]);
  
  // Import from clients states
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [categories, setCategories] = useState<CustomerCategory[]>([]);
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [importCategoryFilter, setImportCategoryFilter] = useState<string>("all");
  const [importSearchTerm, setImportSearchTerm] = useState("");
  const [importStageId, setImportStageId] = useState<string>("");
  const [isImporting, setIsImporting] = useState(false);
  const [loadingCustomers, setLoadingCustomers] = useState(false);

  // Import from Cadastro (contacts) states
  const [showImportContactsDialog, setShowImportContactsDialog] = useState(false);
  const [contacts, setContacts] = useState<any[]>([]);
  const [regCategories, setRegCategories] = useState<any[]>([]);
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [contactCategoryFilter, setContactCategoryFilter] = useState<string>("all");
  const [contactSearchTerm, setContactSearchTerm] = useState("");
  const [contactImportStageId, setContactImportStageId] = useState<string>("");
  const [loadingContacts, setLoadingContacts] = useState(false);
  
  // Form states
  const [funnelName, setFunnelName] = useState('');
  const [funnelDescription, setFunnelDescription] = useState('');
  const [funnelColor, setFunnelColor] = useState('#3b82f6');
  
  const [stageName, setStageName] = useState('');
  const [stageColor, setStageColor] = useState('#6b7280');
  const [preAddStageId, setPreAddStageId] = useState<string | null>(null);
  
  const [leadName, setLeadName] = useState('');
  const [leadEmail, setLeadEmail] = useState('');
  const [leadPhone, setLeadPhone] = useState('');
  const [leadCompany, setLeadCompany] = useState('');
  const [leadValue, setLeadValue] = useState('');
  const [leadNotes, setLeadNotes] = useState('');
  const [leadPriority, setLeadPriority] = useState<string>('medium');
  const [leadExpectedDate, setLeadExpectedDate] = useState('');
  const [leadTags, setLeadTags] = useState('');
  
  // Drag state
  const [activeDragId, setActiveDragId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  );

  const stageSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Handle stage reordering
  const handleStageDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id || !selectedFunnel) return;

    const oldIndex = stages.findIndex((s) => s.id === active.id);
    const newIndex = stages.findIndex((s) => s.id === over.id);

    const newStages = arrayMove(stages, oldIndex, newIndex);
    
    // Optimistic update
    setStages(newStages);

    try {
      // Update order_index for all affected stages
      const updates = newStages.map((stage, index) => ({
        id: stage.id,
        order_index: index,
      }));

      for (const update of updates) {
        await supabase
          .from('funnel_stages')
          .update({ order_index: update.order_index })
          .eq('id', update.id);
      }

      toast.success('Ordem das etapas atualizada!');
    } catch (error) {
      console.error('Error reordering stages:', error);
      toast.error('Erro ao reordenar etapas');
      // Revert on error
      loadStages(selectedFunnel.id);
    }
  };

  useEffect(() => {
    if (user) {
      loadFunnels();
    }
  }, [user]);

  useEffect(() => {
    if (selectedFunnel) {
      loadStages(selectedFunnel.id);
      loadLeads(selectedFunnel.id);
    }
  }, [selectedFunnel]);

  const loadFunnels = async () => {
    try {
      const { data, error } = await supabase
        .from('sales_funnels')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFunnels(data || []);
      
      if (data && data.length > 0 && !selectedFunnel) {
        setSelectedFunnel(data[0]);
      }
    } catch (error) {
      console.error('Error loading funnels:', error);
      toast.error('Erro ao carregar funis');
    } finally {
      setLoading(false);
    }
  };

  const loadStages = async (funnelId: string) => {
    try {
      const { data, error } = await supabase
        .from('funnel_stages')
        .select('*')
        .eq('funnel_id', funnelId)
        .order('order_index', { ascending: true });

      if (error) throw error;
      setStages(data || []);
    } catch (error) {
      console.error('Error loading stages:', error);
    }
  };

  const loadLeads = async (funnelId: string) => {
    try {
      const { data, error } = await supabase
        .from('funnel_leads')
        .select('*')
        .eq('funnel_id', funnelId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLeads(data || []);
    } catch (error) {
      console.error('Error loading leads:', error);
    }
  };

  // Load customers and categories for import
  const loadCustomersAndCategories = async () => {
    if (!user) return;
    setLoadingCustomers(true);
    
    try {
      const [customersRes, categoriesRes] = await Promise.all([
        supabase
          .from('customers')
          .select('id, name, email, phone, company, category_id')
          .eq('user_id', user.id)
          .order('name'),
        supabase
          .from('customer_categories')
          .select('id, name, color')
          .eq('user_id', user.id)
          .order('name')
      ]);

      if (customersRes.error) throw customersRes.error;
      if (categoriesRes.error) throw categoriesRes.error;

      setCustomers(customersRes.data || []);
      setCategories(categoriesRes.data || []);
    } catch (error) {
      console.error('Error loading customers:', error);
      toast.error('Erro ao carregar clientes');
    } finally {
      setLoadingCustomers(false);
    }
  };

  // Open import dialog
  const openImportDialog = () => {
    setSelectedCustomers([]);
    setImportCategoryFilter("all");
    setImportSearchTerm("");
    setImportStageId(stages[0]?.id || "");
    loadCustomersAndCategories();
    setShowImportDialog(true);
  };

  // Get filtered customers for import
  const getFilteredCustomersForImport = () => {
    let filtered = [...customers];
    
    // Filter by category
    if (importCategoryFilter !== "all") {
      if (importCategoryFilter === "none") {
        filtered = filtered.filter(c => !c.category_id);
      } else {
        filtered = filtered.filter(c => c.category_id === importCategoryFilter);
      }
    }
    
    // Filter by search
    if (importSearchTerm) {
      const term = importSearchTerm.toLowerCase();
      filtered = filtered.filter(c =>
        c.name.toLowerCase().includes(term) ||
        c.email?.toLowerCase().includes(term) ||
        c.phone?.includes(term) ||
        c.company?.toLowerCase().includes(term)
      );
    }
    
    return filtered;
  };

  // Toggle customer selection
  const toggleCustomerSelection = (customerId: string) => {
    setSelectedCustomers(prev => 
      prev.includes(customerId)
        ? prev.filter(id => id !== customerId)
        : [...prev, customerId]
    );
  };

  // Select all filtered customers
  const selectAllFilteredCustomers = () => {
    const filtered = getFilteredCustomersForImport();
    const allIds = filtered.map(c => c.id);
    setSelectedCustomers(allIds);
  };

  // Clear selection
  const clearSelection = () => {
    setSelectedCustomers([]);
  };

  // Import selected customers as leads
  const handleImportCustomers = async () => {
    if (!selectedFunnel || selectedCustomers.length === 0) {
      toast.error('Selecione pelo menos um cliente para importar');
      return;
    }

    const targetStageId = importStageId || stages[0]?.id;
    if (!targetStageId) {
      toast.error('Crie pelo menos uma etapa no funil primeiro');
      return;
    }

    setIsImporting(true);

    try {
      const customersToImport = customers.filter(c => selectedCustomers.includes(c.id));
      let importedCount = 0;

      for (const customer of customersToImport) {
        const { data: newLead, error } = await supabase
          .from('funnel_leads')
          .insert({
            funnel_id: selectedFunnel.id,
            stage_id: targetStageId,
            name: customer.name,
            email: customer.email,
            phone: customer.phone,
            company: customer.company,
            priority: 'medium',
            value: 0,
          })
          .select()
          .single();

        if (!error && newLead) {
          await supabase
            .from('funnel_lead_history')
            .insert({
              lead_id: newLead.id,
              to_stage_id: targetStageId,
              notes: 'Lead importado da Gestão de Clientes',
            });
          importedCount++;
        }
      }

      if (importedCount > 0) {
        toast.success(`${importedCount} lead(s) importado(s) com sucesso!`);
        loadLeads(selectedFunnel.id);
        setShowImportDialog(false);
      } else {
        toast.error('Nenhum lead foi importado');
      }
    } catch (error) {
      console.error('Error importing customers:', error);
      toast.error('Erro ao importar clientes');
    } finally {
      setIsImporting(false);
    }
  };

  // Import all customers from a category
  const handleImportCategory = async (categoryId: string) => {
    if (!selectedFunnel) return;

    const targetStageId = importStageId || stages[0]?.id;
    if (!targetStageId) {
      toast.error('Crie pelo menos uma etapa no funil primeiro');
      return;
    }

    const categoryCustomers = customers.filter(c => c.category_id === categoryId);
    if (categoryCustomers.length === 0) {
      toast.error('Nenhum cliente nesta categoria');
      return;
    }

    setIsImporting(true);

    try {
      let importedCount = 0;

      for (const customer of categoryCustomers) {
        const { data: newLead, error } = await supabase
          .from('funnel_leads')
          .insert({
            funnel_id: selectedFunnel.id,
            stage_id: targetStageId,
            name: customer.name,
            email: customer.email,
            phone: customer.phone,
            company: customer.company,
            priority: 'medium',
            value: 0,
          })
          .select()
          .single();

        if (!error && newLead) {
          await supabase
            .from('funnel_lead_history')
            .insert({
              lead_id: newLead.id,
              to_stage_id: targetStageId,
              notes: `Lead importado da categoria "${categories.find(c => c.id === categoryId)?.name}"`,
            });
          importedCount++;
        }
      }

      if (importedCount > 0) {
        toast.success(`${importedCount} lead(s) importado(s) da categoria!`);
        loadLeads(selectedFunnel.id);
        setShowImportDialog(false);
      }
    } catch (error) {
      console.error('Error importing category:', error);
      toast.error('Erro ao importar categoria');
    } finally {
      setIsImporting(false);
    }
  };

  // ===== Import from Cadastro (contacts) =====
  const loadContactsAndRegCategories = async () => {
    if (!user) return;
    setLoadingContacts(true);
    try {
      const [contactsRes, categoriesRes] = await Promise.all([
        supabase
          .from('contacts')
          .select('id, name, email, phone, company, registration_category_id')
          .eq('user_id', user.id)
          .order('name'),
        supabase
          .from('registration_categories')
          .select('id, name, color')
          .eq('user_id', user.id)
          .order('name'),
      ]);
      if (contactsRes.error) throw contactsRes.error;
      if (categoriesRes.error) throw categoriesRes.error;
      setContacts(contactsRes.data || []);
      setRegCategories(categoriesRes.data || []);
    } catch (error) {
      console.error('Error loading contacts:', error);
      toast.error('Erro ao carregar cadastros');
    } finally {
      setLoadingContacts(false);
    }
  };

  const openImportContactsDialog = () => {
    setSelectedContacts([]);
    setContactCategoryFilter("all");
    setContactSearchTerm("");
    setContactImportStageId(stages[0]?.id || "");
    loadContactsAndRegCategories();
    setShowImportContactsDialog(true);
  };

  const getFilteredContactsForImport = () => {
    let filtered = [...contacts];
    if (contactCategoryFilter !== "all") {
      if (contactCategoryFilter === "none") {
        filtered = filtered.filter(c => !c.registration_category_id);
      } else {
        filtered = filtered.filter(c => c.registration_category_id === contactCategoryFilter);
      }
    }
    if (contactSearchTerm) {
      const term = contactSearchTerm.toLowerCase();
      filtered = filtered.filter(c =>
        c.name?.toLowerCase().includes(term) ||
        c.email?.toLowerCase().includes(term) ||
        c.phone?.includes(term) ||
        c.company?.toLowerCase().includes(term)
      );
    }
    return filtered;
  };

  const toggleContactSelection = (id: string) => {
    setSelectedContacts(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const selectAllFilteredContacts = () => {
    setSelectedContacts(getFilteredContactsForImport().map(c => c.id));
  };

  const clearContactSelection = () => setSelectedContacts([]);

  const importContactsAsLeads = async (toImport: any[], notesLabel: string) => {
    if (!selectedFunnel) return 0;
    const targetStageId = contactImportStageId || stages[0]?.id;
    if (!targetStageId) {
      toast.error('Crie pelo menos uma etapa no funil primeiro');
      return 0;
    }
    let importedCount = 0;
    for (const c of toImport) {
      const { data: newLead, error } = await supabase
        .from('funnel_leads')
        .insert({
          funnel_id: selectedFunnel.id,
          stage_id: targetStageId,
          name: c.name,
          email: c.email,
          phone: c.phone,
          company: c.company,
          priority: 'medium',
          value: 0,
        })
        .select()
        .single();
      if (!error && newLead) {
        await supabase.from('funnel_lead_history').insert({
          lead_id: newLead.id,
          to_stage_id: targetStageId,
          notes: notesLabel,
        });
        importedCount++;
      }
    }
    return importedCount;
  };

  const handleImportContacts = async () => {
    if (!selectedFunnel || selectedContacts.length === 0) {
      toast.error('Selecione pelo menos um cadastro para importar');
      return;
    }
    setIsImporting(true);
    try {
      const toImport = contacts.filter(c => selectedContacts.includes(c.id));
      const count = await importContactsAsLeads(toImport, 'Lead importado do Cadastro');
      if (count > 0) {
        toast.success(`${count} lead(s) importado(s) com sucesso!`);
        loadLeads(selectedFunnel.id);
        setShowImportContactsDialog(false);
      } else {
        toast.error('Nenhum lead foi importado');
      }
    } catch (error) {
      console.error(error);
      toast.error('Erro ao importar cadastros');
    } finally {
      setIsImporting(false);
    }
  };

  const handleImportRegCategory = async (categoryId: string) => {
    if (!selectedFunnel) return;
    const catContacts = contacts.filter(c => c.registration_category_id === categoryId);
    if (catContacts.length === 0) {
      toast.error('Nenhum cadastro nesta categoria');
      return;
    }
    setIsImporting(true);
    try {
      const catName = regCategories.find(c => c.id === categoryId)?.name;
      const count = await importContactsAsLeads(catContacts, `Lead importado da categoria "${catName}"`);
      if (count > 0) {
        toast.success(`${count} lead(s) importado(s) da categoria!`);
        loadLeads(selectedFunnel.id);
        setShowImportContactsDialog(false);
      }
    } catch (error) {
      console.error(error);
      toast.error('Erro ao importar categoria');
    } finally {
      setIsImporting(false);
    }
  };


  const loadLeadHistory = async (leadId: string) => {
    try {
      const { data, error } = await supabase
        .from('funnel_lead_history')
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLeadHistory(data || []);
    } catch (error) {
      console.error('Error loading lead history:', error);
    }
  };

  // Funnel CRUD
  const handleSaveFunnel = async () => {
    if (!funnelName.trim()) {
      toast.error('Nome do funil é obrigatório');
      return;
    }

    try {
      if (editingFunnel) {
        const { error } = await supabase
          .from('sales_funnels')
          .update({
            name: funnelName,
            description: funnelDescription || null,
            color: funnelColor,
          })
          .eq('id', editingFunnel.id);

        if (error) throw error;
        toast.success('Funil atualizado!');
      } else {
        const { data, error } = await supabase
          .from('sales_funnels')
          .insert({
            user_id: user?.id,
            name: funnelName,
            description: funnelDescription || null,
            color: funnelColor,
          })
          .select()
          .single();

        if (error) throw error;

        // Create default stages
        const defaultStages = [
          { name: 'Prospecção', color: '#6b7280', order_index: 0 },
          { name: 'Conexão', color: '#3b82f6', order_index: 1 },
          { name: 'Em Análise', color: '#f59e0b', order_index: 2 },
          { name: 'Negociação', color: '#8b5cf6', order_index: 3 },
          { name: 'Fechamento', color: '#22c55e', order_index: 4 },
        ];

        await supabase
          .from('funnel_stages')
          .insert(defaultStages.map(s => ({ ...s, funnel_id: data.id })));

        toast.success('Funil criado com etapas padrão!');
        setSelectedFunnel(data);
      }

      loadFunnels();
      resetFunnelForm();
      setShowFunnelDialog(false);
    } catch (error) {
      console.error('Error saving funnel:', error);
      toast.error('Erro ao salvar funil');
    }
  };

  const handleDeleteFunnel = async (id: string) => {
    if (!confirm('Excluir este funil e todos os dados associados?')) return;

    try {
      const { error } = await supabase
        .from('sales_funnels')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast.success('Funil excluído!');
      if (selectedFunnel?.id === id) {
        setSelectedFunnel(null);
        setStages([]);
        setLeads([]);
      }
      loadFunnels();
    } catch (error) {
      console.error('Error deleting funnel:', error);
      toast.error('Erro ao excluir funil');
    }
  };

  const resetFunnelForm = () => {
    setFunnelName('');
    setFunnelDescription('');
    setFunnelColor('#3b82f6');
    setEditingFunnel(null);
  };

  // Stage CRUD
  const handleSaveStage = async () => {
    if (!stageName.trim() || !selectedFunnel) {
      toast.error('Nome da etapa é obrigatório');
      return;
    }

    try {
      if (editingStage) {
        const { error } = await supabase
          .from('funnel_stages')
          .update({
            name: stageName,
            color: stageColor,
          })
          .eq('id', editingStage.id);

        if (error) throw error;
        toast.success('Etapa atualizada!');
      } else {
        const maxOrder = Math.max(...stages.map(s => s.order_index), -1);
        const { error } = await supabase
          .from('funnel_stages')
          .insert({
            funnel_id: selectedFunnel.id,
            name: stageName,
            color: stageColor,
            order_index: maxOrder + 1,
          });

        if (error) throw error;
        toast.success('Etapa criada!');
      }

      loadStages(selectedFunnel.id);
      resetStageForm();
      setShowStageDialog(false);
    } catch (error) {
      console.error('Error saving stage:', error);
      toast.error('Erro ao salvar etapa');
    }
  };

  const handleDeleteStage = async (id: string) => {
    const stageLeads = leads.filter(l => l.stage_id === id);
    if (stageLeads.length > 0) {
      toast.error('Mova os leads desta etapa antes de excluí-la');
      return;
    }

    if (!confirm('Excluir esta etapa?')) return;

    try {
      const { error } = await supabase
        .from('funnel_stages')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast.success('Etapa excluída!');
      loadStages(selectedFunnel!.id);
    } catch (error) {
      console.error('Error deleting stage:', error);
      toast.error('Erro ao excluir etapa');
    }
  };

  const resetStageForm = () => {
    setStageName('');
    setStageColor('#6b7280');
    setEditingStage(null);
  };

  // Lead CRUD
  const handleSaveLead = async () => {
    if (!leadName.trim() || !selectedFunnel) {
      toast.error('Nome do lead é obrigatório');
      return;
    }

    const stageId = editingLead?.stage_id || preAddStageId || stages[0]?.id;
    if (!stageId) {
      toast.error('Crie pelo menos uma etapa primeiro');
      return;
    }

    try {
      const leadData = {
        funnel_id: selectedFunnel.id,
        stage_id: stageId,
        name: leadName,
        email: leadEmail || null,
        phone: leadPhone || null,
        company: leadCompany || null,
        value: parseFloat(leadValue) || 0,
        notes: leadNotes || null,
        priority: leadPriority,
        expected_close_date: leadExpectedDate || null,
        tags: leadTags ? leadTags.split(',').map(t => t.trim()) : null,
      };

      if (editingLead) {
        const { error } = await supabase
          .from('funnel_leads')
          .update(leadData)
          .eq('id', editingLead.id);

        if (error) throw error;
        toast.success('Lead atualizado!');
      } else {
        const { data, error } = await supabase
          .from('funnel_leads')
          .insert(leadData)
          .select()
          .single();

        if (error) throw error;

        // Create initial history
        await supabase
          .from('funnel_lead_history')
          .insert({
            lead_id: data.id,
            to_stage_id: stageId,
            notes: 'Lead criado',
          });

        toast.success('Lead criado!');
      }

      loadLeads(selectedFunnel.id);
      resetLeadForm();
      setShowLeadDialog(false);
    } catch (error) {
      console.error('Error saving lead:', error);
      toast.error('Erro ao salvar lead');
    }
  };

  const handleDeleteLead = async (id: string) => {
    if (!confirm('Excluir este lead?')) return;

    try {
      const { error } = await supabase
        .from('funnel_leads')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast.success('Lead excluído!');
      loadLeads(selectedFunnel!.id);
    } catch (error) {
      console.error('Error deleting lead:', error);
      toast.error('Erro ao excluir lead');
    }
  };

  const resetLeadForm = () => {
    setLeadName('');
    setLeadEmail('');
    setLeadPhone('');
    setLeadCompany('');
    setLeadValue('');
    setLeadNotes('');
    setLeadPriority('medium');
    setLeadExpectedDate('');
    setLeadTags('');
    setEditingLead(null);
    setPreAddStageId(null);
  };

  // Drag and Drop
  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveDragId(null);
    const { active, over } = event;

    if (!over || !selectedFunnel) return;

    const leadId = active.id as string;
    const newStageId = over.id as string;
    
    const lead = leads.find(l => l.id === leadId);
    if (!lead || lead.stage_id === newStageId) return;

    const oldStageId = lead.stage_id;

    // Optimistic update
    setLeads(prev => prev.map(l => 
      l.id === leadId ? { ...l, stage_id: newStageId } : l
    ));

    try {
      const { error } = await supabase
        .from('funnel_leads')
        .update({ stage_id: newStageId })
        .eq('id', leadId);

      if (error) throw error;

      // Record history
      await supabase
        .from('funnel_lead_history')
        .insert({
          lead_id: leadId,
          from_stage_id: oldStageId,
          to_stage_id: newStageId,
        });

      const fromStage = stages.find(s => s.id === oldStageId);
      const toStage = stages.find(s => s.id === newStageId);
      toast.success(`${lead.name} movido de "${fromStage?.name}" para "${toStage?.name}"`);
    } catch (error) {
      console.error('Error moving lead:', error);
      toast.error('Erro ao mover lead');
      // Revert optimistic update
      setLeads(prev => prev.map(l => 
        l.id === leadId ? { ...l, stage_id: oldStageId } : l
      ));
    }
  };

  // View Lead Details
  const handleViewLead = async (lead: FunnelLead) => {
    setViewingLead(lead);
    await loadLeadHistory(lead.id);
    setShowLeadDetailDialog(true);
  };

  // Edit handlers
  const openEditFunnel = (funnel: SalesFunnel) => {
    setEditingFunnel(funnel);
    setFunnelName(funnel.name);
    setFunnelDescription(funnel.description || '');
    setFunnelColor(funnel.color);
    setShowFunnelDialog(true);
  };

  const openEditStage = (stage: FunnelStage) => {
    setEditingStage(stage);
    setStageName(stage.name);
    setStageColor(stage.color);
    setShowStageDialog(true);
  };

  const openEditLead = (lead: FunnelLead) => {
    setEditingLead(lead);
    setLeadName(lead.name);
    setLeadEmail(lead.email || '');
    setLeadPhone(lead.phone || '');
    setLeadCompany(lead.company || '');
    setLeadValue(lead.value?.toString() || '');
    setLeadNotes(lead.notes || '');
    setLeadPriority(lead.priority);
    setLeadExpectedDate(lead.expected_close_date || '');
    setLeadTags(lead.tags?.join(', ') || '');
    setShowLeadDialog(true);
  };

  const openAddLeadToStage = (stageId: string) => {
    resetLeadForm();
    setPreAddStageId(stageId);
    setShowLeadDialog(true);
  };

  // OCR Function
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione uma imagem.');
      return;
    }

    if (!selectedFunnel) {
      toast.error('Selecione um funil primeiro.');
      return;
    }

    if (stages.length === 0) {
      toast.error('Crie pelo menos uma etapa no funil primeiro.');
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
          const firstStageId = stages[0].id;

          if (Array.isArray(extractedLeads) && extractedLeads.length > 0) {
            let addedCount = 0;
            for (const lead of extractedLeads) {
              if (lead.name || lead.phone || lead.email) {
                const { data: newLead, error: insertError } = await supabase
                  .from('funnel_leads')
                  .insert({
                    funnel_id: selectedFunnel.id,
                    stage_id: firstStageId,
                    name: lead.name || 'Lead',
                    phone: lead.phone || null,
                    email: lead.email || null,
                    priority: 'medium',
                    value: 0,
                  })
                  .select()
                  .single();

                if (!insertError && newLead) {
                  await supabase
                    .from('funnel_lead_history')
                    .insert({
                      lead_id: newLead.id,
                      to_stage_id: firstStageId,
                      notes: 'Lead criado via OCR',
                    });
                  addedCount++;
                }
              }
            }

            if (addedCount > 0) {
              toast.success(`${addedCount} lead(s) adicionado(s) via OCR!`);
              loadLeads(selectedFunnel.id);
            } else {
              toast.error('Nenhum lead válido foi encontrado na imagem.');
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

  // Calculate stats
  const totalLeads = leads.length;
  const totalValue = leads.reduce((acc, l) => acc + (l.value || 0), 0);
  const highPriorityLeads = leads.filter(l => l.priority === 'high').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        className="hidden"
        onChange={handleImageUpload}
      />
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Funil de Vendas</h2>
          <p className="text-muted-foreground text-sm">Gerencie seus leads e acompanhe a jornada de vendas</p>
        </div>
        <div className="flex items-center gap-2">
          <Select 
            value={selectedFunnel?.id || ''} 
            onValueChange={(value) => {
              const funnel = funnels.find(f => f.id === value);
              setSelectedFunnel(funnel || null);
            }}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Selecione um funil" />
            </SelectTrigger>
            <SelectContent>
              {funnels.map(funnel => (
                <SelectItem key={funnel.id} value={funnel.id}>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: funnel.color }} />
                    {funnel.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Dialog open={showFunnelDialog} onOpenChange={(open) => { setShowFunnelDialog(open); if (!open) resetFunnelForm(); }}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-1" />
                Novo Funil
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingFunnel ? 'Editar Funil' : 'Novo Funil'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Nome do Funil</Label>
                  <Input value={funnelName} onChange={(e) => setFunnelName(e.target.value)} placeholder="Ex: Vendas B2B" />
                </div>
                <div>
                  <Label>Descrição (opcional)</Label>
                  <Textarea value={funnelDescription} onChange={(e) => setFunnelDescription(e.target.value)} placeholder="Descreva o objetivo deste funil" />
                </div>
                <div>
                  <Label>Cor</Label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={funnelColor} onChange={(e) => setFunnelColor(e.target.value)} className="w-10 h-10 rounded cursor-pointer" />
                    <Input value={funnelColor} onChange={(e) => setFunnelColor(e.target.value)} className="flex-1" />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => { setShowFunnelDialog(false); resetFunnelForm(); }}>Cancelar</Button>
                <Button onClick={handleSaveFunnel}>{editingFunnel ? 'Salvar' : 'Criar Funil'}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      {selectedFunnel && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Total de Leads</p>
                  <p className="text-2xl font-bold">{totalLeads}</p>
                </div>
                <User className="w-8 h-8 text-primary/50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Valor Total</p>
                  <p className="text-2xl font-bold">R$ {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}</p>
                </div>
                <DollarSign className="w-8 h-8 text-green-500/50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Etapas</p>
                  <p className="text-2xl font-bold">{stages.length}</p>
                </div>
                <ArrowRight className="w-8 h-8 text-blue-500/50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Alta Prioridade</p>
                  <p className="text-2xl font-bold">{highPriorityLeads}</p>
                </div>
                <Tag className="w-8 h-8 text-red-500/50" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Actions for selected funnel */}
      {selectedFunnel && (
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={() => openEditFunnel(selectedFunnel)}>
            <Edit className="w-4 h-4 mr-1" />
            Editar Funil
          </Button>
          <Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-1" />
                Gerenciar Etapas
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Gerenciar Etapas do Funil</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Input value={stageName} onChange={(e) => setStageName(e.target.value)} placeholder="Nome da nova etapa" className="flex-1" />
                  <input type="color" value={stageColor} onChange={(e) => setStageColor(e.target.value)} className="w-10 h-10 rounded cursor-pointer" />
                  <Button onClick={handleSaveStage}>
                    <Plus className="w-4 h-4 mr-1" />
                    Adicionar
                  </Button>
                </div>
                <DndContext
                  sensors={stageSensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleStageDragEnd}
                >
                  <SortableContext items={stages.map(s => s.id)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-2 max-h-[400px] overflow-y-auto">
                      {stages.map((stage) => (
                        <SortableStageItem
                          key={stage.id}
                          stage={stage}
                          leadsCount={leads.filter(l => l.stage_id === stage.id).length}
                          onEdit={() => openEditStage(stage)}
                          onDelete={() => handleDeleteStage(stage.id)}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              </div>
            </DialogContent>
          </Dialog>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessingOCR}
          >
            {isProcessingOCR ? (
              <Loader2 className="w-4 h-4 mr-1 animate-spin" />
            ) : (
              <Camera className="w-4 h-4 mr-1" />
            )}
            {isProcessingOCR ? 'Processando...' : 'Adicionar por Foto'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={openImportContactsDialog}
          >
            <UserPlus className="w-4 h-4 mr-1" />
            Importar de Cadastro
          </Button>
          <Dialog open={showLeadDialog} onOpenChange={(open) => { setShowLeadDialog(open); if (!open) resetLeadForm(); }}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-1" />
                Novo Lead
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{editingLead ? 'Editar Lead' : 'Novo Lead'}</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 max-h-[60vh] overflow-y-auto pr-2">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label>Nome *</Label>
                    <Input value={leadName} onChange={(e) => setLeadName(e.target.value)} placeholder="Nome do lead" />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input type="email" value={leadEmail} onChange={(e) => setLeadEmail(e.target.value)} placeholder="email@exemplo.com" />
                  </div>
                  <div>
                    <Label>Telefone</Label>
                    <Input value={leadPhone} onChange={(e) => setLeadPhone(e.target.value)} placeholder="(11) 99999-9999" />
                  </div>
                  <div>
                    <Label>Empresa</Label>
                    <Input value={leadCompany} onChange={(e) => setLeadCompany(e.target.value)} placeholder="Nome da empresa" />
                  </div>
                  <div>
                    <Label>Valor (R$)</Label>
                    <Input type="number" value={leadValue} onChange={(e) => setLeadValue(e.target.value)} placeholder="0,00" />
                  </div>
                  <div>
                    <Label>Prioridade</Label>
                    <Select value={leadPriority} onValueChange={(v) => setLeadPriority(v as 'low' | 'medium' | 'high')}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Baixa</SelectItem>
                        <SelectItem value="medium">Média</SelectItem>
                        <SelectItem value="high">Alta</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Previsão de Fechamento</Label>
                    <Input type="date" value={leadExpectedDate} onChange={(e) => setLeadExpectedDate(e.target.value)} />
                  </div>
                  <div className="col-span-2">
                    <Label>Tags (separadas por vírgula)</Label>
                    <Input value={leadTags} onChange={(e) => setLeadTags(e.target.value)} placeholder="cliente, b2b, premium" />
                  </div>
                  <div className="col-span-2">
                    <Label>Observações</Label>
                    <Textarea value={leadNotes} onChange={(e) => setLeadNotes(e.target.value)} placeholder="Anotações sobre o lead..." />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => { setShowLeadDialog(false); resetLeadForm(); }}>Cancelar</Button>
                <Button onClick={handleSaveLead}>{editingLead ? 'Salvar' : 'Criar Lead'}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Button variant="destructive" size="sm" onClick={() => handleDeleteFunnel(selectedFunnel.id)}>
            <Trash2 className="w-4 h-4 mr-1" />
            Excluir Funil
          </Button>
        </div>
      )}

      {/* Kanban Board */}
      {selectedFunnel ? (
        <div className="rounded-2xl border bg-gradient-to-br from-card via-card to-muted/20 p-4 shadow-xl">
          <div className="flex items-center justify-between mb-3 px-1">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-6 rounded-full bg-gradient-to-b from-primary to-primary/40" />
              <h3 className="text-base font-bold tracking-tight">Quadro Kanban</h3>
              <Badge variant="outline" className="ml-2">{leads.length} leads</Badge>
            </div>
          </div>
          <div className="overflow-x-auto pb-2">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <div className="flex gap-4" style={{ minWidth: stages.length * 306 }}>
                {stages.map((stage) => {
                  const stageLeads = leads.filter(l => l.stage_id === stage.id);
                  return (
                    <DroppableStageColumn
                      key={stage.id}
                      stage={stage}
                      leads={stageLeads}
                      onAddLead={() => openAddLeadToStage(stage.id)}
                    >
                      {stageLeads.map((lead) => (
                        <DraggableLeadCard
                          key={lead.id}
                          lead={lead}
                          stages={stages}
                          onEdit={openEditLead}
                          onDelete={handleDeleteLead}
                          onView={handleViewLead}
                        />
                      ))}
                      {stageLeads.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground text-xs italic">
                          Arraste leads para cá
                        </div>
                      )}
                    </DroppableStageColumn>
                  );
                })}
              </div>
              <DragOverlay>
                {activeDragId ? (
                  <div className="bg-card border-2 border-primary rounded-lg p-3 shadow-2xl opacity-95">
                    <span className="font-medium text-sm">
                      {leads.find(l => l.id === activeDragId)?.name}
                    </span>
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          </div>
        </div>
      ) : (
        <Card className="p-12">
          <div className="text-center">
            <BarChart3 className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum funil selecionado</h3>
            <p className="text-muted-foreground mb-4">Crie seu primeiro funil de vendas para começar</p>
            <Button onClick={() => setShowFunnelDialog(true)}>
              <Plus className="w-4 h-4 mr-1" />
              Criar Funil
            </Button>
          </div>
        </Card>
      )}

      {/* Funnel Chart Visualization */}
      {selectedFunnel && stages.length > 0 && (
        <div className="space-y-2">
          <Button
            variant="ghost"
            size="sm"
            className="w-full flex items-center justify-between hover:bg-muted/50"
            onClick={() => setShowFunnelChart(!showFunnelChart)}
          >
            <span className="flex items-center gap-2 text-sm font-medium">
              <BarChart3 className="w-4 h-4" />
              Gráfico do Funil
            </span>
            {showFunnelChart ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </Button>
          
          {showFunnelChart && (
            <FunnelChart stages={stages} leads={leads} />
          )}
        </div>
      )}


      {/* Stage Edit Dialog */}
      <Dialog open={showStageDialog} onOpenChange={(open) => { setShowStageDialog(open); if (!open) resetStageForm(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Etapa</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome</Label>
              <Input value={stageName} onChange={(e) => setStageName(e.target.value)} placeholder="Nome da etapa" />
            </div>
            <div>
              <Label>Cor</Label>
              <div className="flex items-center gap-2">
                <input type="color" value={stageColor} onChange={(e) => setStageColor(e.target.value)} className="w-10 h-10 rounded cursor-pointer" />
                <Input value={stageColor} onChange={(e) => setStageColor(e.target.value)} className="flex-1" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowStageDialog(false); resetStageForm(); }}>Cancelar</Button>
            <Button onClick={handleSaveStage}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Lead Detail Dialog */}
      <Dialog open={showLeadDetailDialog} onOpenChange={setShowLeadDetailDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Lead</DialogTitle>
          </DialogHeader>
          {viewingLead && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground text-xs">Nome</Label>
                  <p className="font-medium">{viewingLead.name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Empresa</Label>
                  <p className="font-medium">{viewingLead.company || '-'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Email</Label>
                  <p className="font-medium">{viewingLead.email || '-'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Telefone</Label>
                  <p className="font-medium">{viewingLead.phone || '-'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Valor</Label>
                  <p className="font-medium text-primary">R$ {viewingLead.value?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Etapa Atual</Label>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: stages.find(s => s.id === viewingLead.stage_id)?.color }} />
                    <span className="font-medium">{stages.find(s => s.id === viewingLead.stage_id)?.name}</span>
                  </div>
                </div>
                <div className="col-span-2">
                  <Label className="text-muted-foreground text-xs">Observações</Label>
                  <p className="font-medium">{viewingLead.notes || '-'}</p>
                </div>
                {viewingLead.tags && viewingLead.tags.length > 0 && (
                  <div className="col-span-2">
                    <Label className="text-muted-foreground text-xs">Tags</Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {viewingLead.tags.map((tag, i) => (
                        <Badge key={i} variant="secondary">{tag}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* History */}
              <div>
                <Label className="text-muted-foreground text-xs flex items-center gap-1 mb-2">
                  <History className="w-3 h-3" />
                  Histórico de Movimentação
                </Label>
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {leadHistory.map((h) => {
                    const fromStage = stages.find(s => s.id === h.from_stage_id);
                    const toStage = stages.find(s => s.id === h.to_stage_id);
                    return (
                      <div key={h.id} className="flex items-center gap-2 text-sm p-2 bg-muted rounded">
                        <span className="text-muted-foreground text-xs">
                          {format(new Date(h.created_at), "dd/MM/yy HH:mm", { locale: ptBR })}
                        </span>
                        {fromStage ? (
                          <>
                            <span className="font-medium">{fromStage.name}</span>
                            <ChevronRight className="w-4 h-4" />
                            <span className="font-medium">{toStage?.name}</span>
                          </>
                        ) : (
                          <span className="text-muted-foreground italic">Lead criado em "{toStage?.name}"</span>
                        )}
                      </div>
                    );
                  })}
                  {leadHistory.length === 0 && (
                    <p className="text-sm text-muted-foreground italic">Nenhum histórico disponível</p>
                  )}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLeadDetailDialog(false)}>Fechar</Button>
            <Button onClick={() => { setShowLeadDetailDialog(false); if (viewingLead) openEditLead(viewingLead); }}>
              <Edit className="w-4 h-4 mr-1" />
              Editar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import from Clients Dialog */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Importar da Gestão de Clientes
            </DialogTitle>
            <DialogDescription>
              Selecione clientes individualmente ou importe uma categoria inteira para o funil.
            </DialogDescription>
          </DialogHeader>
          
          {loadingCustomers ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-4">
              {/* Stage Selection */}
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <Label>Etapa de Destino</Label>
                  <Select value={importStageId} onValueChange={setImportStageId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a etapa" />
                    </SelectTrigger>
                    <SelectContent>
                      {stages.map(stage => (
                        <SelectItem key={stage.id} value={stage.id}>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: stage.color }} />
                            {stage.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Tabs for Import Options */}
              <Tabs defaultValue="individual" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="individual" className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Clientes Individuais
                  </TabsTrigger>
                  <TabsTrigger value="category" className="flex items-center gap-2">
                    <Folder className="w-4 h-4" />
                    Por Categoria
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="individual" className="space-y-4 mt-4">
                  {/* Filters */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex-1 min-w-[200px]">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input 
                          value={importSearchTerm}
                          onChange={(e) => setImportSearchTerm(e.target.value)}
                          placeholder="Buscar cliente..."
                          className="pl-9"
                        />
                      </div>
                    </div>
                    <Select value={importCategoryFilter} onValueChange={setImportCategoryFilter}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas as categorias</SelectItem>
                        <SelectItem value="none">Sem categoria</SelectItem>
                        {categories.map(cat => (
                          <SelectItem key={cat.id} value={cat.id}>
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                              {cat.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Selection Actions */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={selectAllFilteredCustomers}>
                        Selecionar Todos ({getFilteredCustomersForImport().length})
                      </Button>
                      <Button variant="ghost" size="sm" onClick={clearSelection}>
                        Limpar Seleção
                      </Button>
                    </div>
                    <Badge variant="secondary">
                      {selectedCustomers.length} selecionado(s)
                    </Badge>
                  </div>

                  {/* Customers List */}
                  <ScrollArea className="h-[300px] border rounded-lg">
                    <div className="p-2 space-y-1">
                      {getFilteredCustomersForImport().length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                          <p>Nenhum cliente encontrado</p>
                        </div>
                      ) : (
                        getFilteredCustomersForImport().map(customer => {
                          const category = categories.find(c => c.id === customer.category_id);
                          return (
                            <div 
                              key={customer.id}
                              className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                                selectedCustomers.includes(customer.id) 
                                  ? 'bg-primary/10 border-primary' 
                                  : 'hover:bg-muted border-transparent'
                              }`}
                              onClick={() => toggleCustomerSelection(customer.id)}
                            >
                              <Checkbox 
                                checked={selectedCustomers.includes(customer.id)}
                                onCheckedChange={() => toggleCustomerSelection(customer.id)}
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium truncate">{customer.name}</span>
                                  {category && (
                                    <Badge 
                                      variant="outline" 
                                      className="text-[10px] px-1.5"
                                      style={{ borderColor: category.color, color: category.color }}
                                    >
                                      {category.name}
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                                  {customer.email && (
                                    <span className="flex items-center gap-1">
                                      <Mail className="w-3 h-3" />
                                      {customer.email}
                                    </span>
                                  )}
                                  {customer.phone && (
                                    <span className="flex items-center gap-1">
                                      <Phone className="w-3 h-3" />
                                      {customer.phone}
                                    </span>
                                  )}
                                  {customer.company && (
                                    <span className="flex items-center gap-1">
                                      <Building className="w-3 h-3" />
                                      {customer.company}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="category" className="mt-4">
                  <ScrollArea className="h-[400px]">
                    <div className="grid grid-cols-2 gap-3 p-1">
                      {categories.length === 0 ? (
                        <div className="col-span-2 text-center py-8 text-muted-foreground">
                          <Folder className="w-12 h-12 mx-auto mb-2 opacity-50" />
                          <p>Nenhuma categoria encontrada</p>
                          <p className="text-sm">Crie categorias na Gestão de Clientes</p>
                        </div>
                      ) : (
                        categories.map(category => {
                          const categoryCustomers = customers.filter(c => c.category_id === category.id);
                          return (
                            <Card 
                              key={category.id} 
                              className="cursor-pointer hover:border-primary transition-colors"
                              onClick={() => handleImportCategory(category.id)}
                            >
                              <CardContent className="p-4">
                                <div className="flex items-center gap-3 mb-2">
                                  <div 
                                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                                    style={{ backgroundColor: category.color + '20' }}
                                  >
                                    <FolderOpen className="w-5 h-5" style={{ color: category.color }} />
                                  </div>
                                  <div>
                                    <h4 className="font-semibold">{category.name}</h4>
                                    <p className="text-xs text-muted-foreground">
                                      {categoryCustomers.length} cliente(s)
                                    </p>
                                  </div>
                                </div>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="w-full"
                                  disabled={isImporting || categoryCustomers.length === 0}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleImportCategory(category.id);
                                  }}
                                >
                                  {isImporting ? (
                                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                                  ) : (
                                    <UserPlus className="w-4 h-4 mr-1" />
                                  )}
                                  Importar Categoria
                                </Button>
                              </CardContent>
                            </Card>
                          );
                        })
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowImportDialog(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleImportCustomers}
              disabled={isImporting || selectedCustomers.length === 0}
            >
              {isImporting ? (
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
              ) : (
                <UserPlus className="w-4 h-4 mr-1" />
              )}
              Importar {selectedCustomers.length > 0 ? `(${selectedCustomers.length})` : 'Selecionados'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import from Cadastro Dialog */}
      <Dialog open={showImportContactsDialog} onOpenChange={setShowImportContactsDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              Importar de Cadastro
            </DialogTitle>
            <DialogDescription>
              Selecione cadastros individualmente ou importe uma categoria inteira para o funil.
            </DialogDescription>
          </DialogHeader>

          {loadingContacts ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <Label>Etapa de Destino</Label>
                <Select value={contactImportStageId} onValueChange={setContactImportStageId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a etapa" />
                  </SelectTrigger>
                  <SelectContent>
                    {stages.map(stage => (
                      <SelectItem key={stage.id} value={stage.id}>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: stage.color }} />
                          {stage.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Tabs defaultValue="individual" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="individual" className="flex items-center gap-2">
                    <User className="w-4 h-4" /> Um por Um
                  </TabsTrigger>
                  <TabsTrigger value="category" className="flex items-center gap-2">
                    <Folder className="w-4 h-4" /> Por Categoria
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="individual" className="space-y-4 mt-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex-1 min-w-[200px]">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          value={contactSearchTerm}
                          onChange={(e) => setContactSearchTerm(e.target.value)}
                          placeholder="Buscar cadastro..."
                          className="pl-9"
                        />
                      </div>
                    </div>
                    <Select value={contactCategoryFilter} onValueChange={setContactCategoryFilter}>
                      <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas as categorias</SelectItem>
                        <SelectItem value="none">Sem categoria</SelectItem>
                        {regCategories.map(cat => (
                          <SelectItem key={cat.id} value={cat.id}>
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                              {cat.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={selectAllFilteredContacts}>
                        Selecionar Todos ({getFilteredContactsForImport().length})
                      </Button>
                      <Button variant="ghost" size="sm" onClick={clearContactSelection}>
                        Limpar Seleção
                      </Button>
                    </div>
                    <Badge variant="secondary">{selectedContacts.length} selecionado(s)</Badge>
                  </div>

                  <ScrollArea className="h-[300px] border rounded-lg">
                    <div className="p-2 space-y-1">
                      {getFilteredContactsForImport().length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                          <p>Nenhum cadastro encontrado</p>
                        </div>
                      ) : (
                        getFilteredContactsForImport().map(contact => {
                          const category = regCategories.find(c => c.id === contact.registration_category_id);
                          return (
                            <div
                              key={contact.id}
                              className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                                selectedContacts.includes(contact.id)
                                  ? 'bg-primary/10 border-primary'
                                  : 'hover:bg-muted border-transparent'
                              }`}
                              onClick={() => toggleContactSelection(contact.id)}
                            >
                              <Checkbox
                                checked={selectedContacts.includes(contact.id)}
                                onCheckedChange={() => toggleContactSelection(contact.id)}
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium truncate">{contact.name}</span>
                                  {category && (
                                    <Badge
                                      variant="outline"
                                      className="text-[10px] px-1.5"
                                      style={{ borderColor: category.color, color: category.color }}
                                    >
                                      {category.name}
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                                  {contact.email && (
                                    <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{contact.email}</span>
                                  )}
                                  {contact.phone && (
                                    <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{contact.phone}</span>
                                  )}
                                  {contact.company && (
                                    <span className="flex items-center gap-1"><Building className="w-3 h-3" />{contact.company}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="category" className="mt-4">
                  <ScrollArea className="h-[400px]">
                    <div className="grid grid-cols-2 gap-3 p-1">
                      {regCategories.length === 0 ? (
                        <div className="col-span-2 text-center py-8 text-muted-foreground">
                          <Folder className="w-12 h-12 mx-auto mb-2 opacity-50" />
                          <p>Nenhuma categoria encontrada</p>
                          <p className="text-sm">Crie categorias em Cadastro</p>
                        </div>
                      ) : (
                        regCategories.map(category => {
                          const catContacts = contacts.filter(c => c.registration_category_id === category.id);
                          return (
                            <Card
                              key={category.id}
                              className="cursor-pointer hover:border-primary transition-colors"
                              onClick={() => handleImportRegCategory(category.id)}
                            >
                              <CardContent className="p-4">
                                <div className="flex items-center gap-3 mb-2">
                                  <div
                                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                                    style={{ backgroundColor: (category.color || '#888') + '20' }}
                                  >
                                    <FolderOpen className="w-5 h-5" style={{ color: category.color || '#888' }} />
                                  </div>
                                  <div>
                                    <h4 className="font-semibold">{category.name}</h4>
                                    <p className="text-xs text-muted-foreground">{catContacts.length} cadastro(s)</p>
                                  </div>
                                </div>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="w-full"
                                  disabled={isImporting || catContacts.length === 0}
                                  onClick={(e) => { e.stopPropagation(); handleImportRegCategory(category.id); }}
                                >
                                  {isImporting ? (
                                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                                  ) : (
                                    <UserPlus className="w-4 h-4 mr-1" />
                                  )}
                                  Importar Categoria
                                </Button>
                              </CardContent>
                            </Card>
                          );
                        })
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowImportContactsDialog(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleImportContacts}
              disabled={isImporting || selectedContacts.length === 0}
            >
              {isImporting ? (
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
              ) : (
                <UserPlus className="w-4 h-4 mr-1" />
              )}
              Importar {selectedContacts.length > 0 ? `(${selectedContacts.length})` : 'Selecionados'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
