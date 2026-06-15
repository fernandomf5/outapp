import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Trash2, Edit, Lock, Unlock, Image, Video, FileText, Link as LinkIcon, MousePointer, GripVertical, ExternalLink, Settings, Download, Music, Code, HelpCircle, GitBranch, History, CheckSquare, Award, Radio, Brain, StickyNote, MessageSquare, Presentation, Images, Film, Megaphone, Eye, EyeOff, Mail, ShoppingCart, Key } from "lucide-react";
import { DocumentUpload } from "@/components/DocumentUpload";
import { DeleteConfirmDialog } from "@/components/ui/delete-confirm-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ImageUpload } from "@/components/ImageUpload";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { SimpleMembersAreaPreview } from "@/components/members-area/SimpleMembersAreaPreview";
import { ManageQuestionsDialog } from "@/components/members-area/ManageQuestionsDialog";
import { AccessCodesDialog } from "@/components/members-area/AccessCodesDialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
interface ContentBlock {
  id: string;
  type: 'image' | 'video' | 'document' | 'link' | 'button' | 'text' | 'download' | 'audio' | 'embed' | 'quiz' | 'timeline' | 'customer_history' | 'checklist' | 'certificate' | 'webinar' | 'notes' | 'faq' | 'mindmap' | 'slides' | 'gallery' | 'video_gallery' | 'ads_dashboard' | 'secret' | 'payment_history';
  content: string;
  title?: string;
  order_index: number;
  block_position: number; // qual bloco da seção (0, 1, 2...)
  customer_id?: string; // Para histórico do cliente
  customer_name?: string; // Nome do cliente selecionado
}

interface Section {
  id: string;
  title: string;
  description?: string;
  order_index: number;
  blocks_layout: ('full' | 'half' | 'third')[]; // Define quantos blocos e suas larguras
  blocks: ContentBlock[];
}

interface MembersArea {
  id: string;
  name: string;
  description: string;
  password: string;
  slug: string;
  sections: Section[];
  is_active: boolean;
  primary_color?: string;
  secondary_color?: string;
  logo_url?: string;
  customer_id?: string;
  customer_name?: string;
  business_id?: string;
  area_type?: string; // 'course' or 'exclusive'
  access_type?: string; // 'password' or 'email_code'
  // Design da área interna
  background_color?: string;
  text_color?: string;
  card_background_color?: string;
  card_text_color?: string;
  header_background_color?: string;
  accent_color?: string;
}

interface Customer {
  id: string;
  name: string;
}

interface Business {
  id: string;
  name: string;
}

const SortableBlock = ({ block, onEdit, onDelete }: { block: ContentBlock; onEdit: () => void; onDelete: () => void }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getIcon = () => {
    const icons: Record<string, React.ReactNode> = {
      image: <Image className="w-4 h-4" />,
      video: <Video className="w-4 h-4" />,
      document: <FileText className="w-4 h-4" />,
      link: <LinkIcon className="w-4 h-4" />,
      button: <MousePointer className="w-4 h-4" />,
      download: <Download className="w-4 h-4" />,
      audio: <Music className="w-4 h-4" />,
      embed: <Code className="w-4 h-4" />,
      quiz: <HelpCircle className="w-4 h-4" />,
      timeline: <GitBranch className="w-4 h-4" />,
      customer_history: <History className="w-4 h-4" />,
      checklist: <CheckSquare className="w-4 h-4" />,
      certificate: <Award className="w-4 h-4" />,
      webinar: <Radio className="w-4 h-4" />,
      notes: <StickyNote className="w-4 h-4" />,
      faq: <MessageSquare className="w-4 h-4" />,
      mindmap: <Brain className="w-4 h-4" />,
      slides: <Presentation className="w-4 h-4" />,
      text: <FileText className="w-4 h-4" />,
      gallery: <Images className="w-4 h-4" />,
      video_gallery: <Film className="w-4 h-4" />,
      secret: <EyeOff className="w-4 h-4" />,
      payment_history: <History className="w-4 h-4" />,
    };
    return icons[block.type] || <FileText className="w-4 h-4" />;
  };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-2 p-3 bg-muted rounded-lg">
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing shrink-0">
        <GripVertical className="w-4 h-4 text-muted-foreground" />
      </div>
      <div className="shrink-0">{getIcon()}</div>
      <div className="flex-1 min-w-0 overflow-hidden">
        <div className="font-medium text-sm truncate">{block.title || (block.type === 'secret' ? 'Conteúdo Oculto' : block.type)}</div>
        <div className="text-xs text-muted-foreground truncate max-w-full">
          {(block.type === 'customer_history' || block.type === 'payment_history') && block.customer_name 
            ? `Cliente: ${block.customer_name}` 
            : block.type === 'secret'
            ? '•'.repeat(Math.min((block.content || '').length || 10, 30))
            : block.content}
        </div>
      </div>
      <Button variant="ghost" size="icon" onClick={onEdit} className="shrink-0">
        <Edit className="w-4 h-4" />
      </Button>
      <Button variant="ghost" size="icon" onClick={onDelete} className="shrink-0">
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  );
};

const SortableBlockContainer = ({ id, children }: { id: string; children: (dragHandleProps: Record<string, any>) => React.ReactNode }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="border rounded-lg overflow-hidden">
      {children({ ...attributes, ...listeners })}
    </div>
  );
};

const SortableSection = ({ id, children }: { id: string; children: React.ReactNode }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <div className="flex items-start gap-1">
        <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing mt-5 shrink-0 p-1 rounded hover:bg-muted">
          <GripVertical className="w-5 h-5 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </div>
  );
};

export function SimpleMembersArea() {
  const [areas, setAreas] = useState<MembersArea[]>([]);
  const [selectedArea, setSelectedArea] = useState<MembersArea | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [areaToDelete, setAreaToDelete] = useState<MembersArea | null>(null);
  const [questionsAreaId, setQuestionsAreaId] = useState<{ id: string; name: string } | null>(null);
  const [editingArea, setEditingArea] = useState<MembersArea | null>(null);
  const [isAddSectionDialogOpen, setIsAddSectionDialogOpen] = useState(false);
  const [isEditSectionDialogOpen, setIsEditSectionDialogOpen] = useState(false);
  const [isDeleteSectionDialogOpen, setIsDeleteSectionDialogOpen] = useState(false);
  const [isAddBlockDialogOpen, setIsAddBlockDialogOpen] = useState(false);
  const [selectedSection, setSelectedSection] = useState<Section | null>(null);
  const [editingSection, setEditingSection] = useState<Section | null>(null);
  const [sectionToDelete, setSectionToDelete] = useState<Section | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [adClients, setAdClients] = useState<{ id: string; name: string }[]>([]);
  const defaultAreaFormData = {
    name: '',
    description: '',
    password: '',
    access_type: 'password' as string,
    primary_color: '#8B5CF6',
    secondary_color: '#EC4899',
    logo_url: '',
    customer_id: '',
    customer_name: '',
    business_id: '',
    area_type: 'course' as string,
    enable_questions: false as boolean,
    // Design da tela de login
    login_background_color: '#1a1a2e',
    login_text_color: '#ffffff',
    // Design da área interna
    background_color: '#ffffff',
    text_color: '#1f2937',
    card_background_color: '#f9fafb',
    card_text_color: '#374151',
    header_background_color: '#f3f4f6',
    accent_color: '#8B5CF6',
  };
  const [areaFormData, setAreaFormData] = useState(defaultAreaFormData);

  const [sectionFormData, setSectionFormData] = useState({
    title: '',
    description: '',
    blocks_layout: ['full'] as ('full' | 'half' | 'third')[],
  });

  const [blockFormData, setBlockFormData] = useState({
    type: 'text' as ContentBlock['type'],
    title: '',
    content: '',
    block_position: 0, // Em qual bloco da seção vai o conteúdo
    customer_id: '', // Para histórico do cliente
  });

  const [editingBlock, setEditingBlock] = useState<{ sectionId: string; block: ContentBlock } | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor)
  );

  useEffect(() => {
    loadAreas();
    loadCustomersAndBusinesses();
  }, []);

  const loadCustomersAndBusinesses = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [customersRes, businessesRes, adClientsRes] = await Promise.all([
        supabase.from('customers').select('id, name').eq('user_id', user.id).order('name'),
        supabase.from('businesses').select('id, name').eq('user_id', user.id).order('name'),
        supabase.from('ad_clients').select('id, name').eq('user_id', user.id).order('name')
      ]);

      if (customersRes.data) setCustomers(customersRes.data);
      if (businessesRes.data) setBusinesses(businessesRes.data);
      if (adClientsRes.data) setAdClients(adClientsRes.data);
    } catch (error) {
      console.error('Error loading customers/businesses:', error);
    }
  };

  const loadAreas = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('simple_members_areas' as any)
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAreas((data || []) as any as MembersArea[]);
    } catch (error: any) {
      toast.error('Erro ao carregar áreas: ' + error.message);
    }
  };

  const handleCreateArea = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const slug = areaFormData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

      // Get customer name if customer is selected
      const selectedCustomer = areaFormData.customer_id 
        ? customers.find(c => c.id === areaFormData.customer_id) 
        : null;

      const { data, error } = await supabase
        .from('simple_members_areas' as any)
        .insert({
          user_id: user.id,
          name: areaFormData.name,
          description: areaFormData.description,
          password: areaFormData.access_type === 'email_code' ? 'email_code_access' : areaFormData.password,
          slug,
          sections: [],
          is_active: true,
          primary_color: areaFormData.primary_color,
          secondary_color: areaFormData.secondary_color,
          logo_url: areaFormData.logo_url || null,
          customer_id: areaFormData.customer_id || null,
          customer_name: selectedCustomer?.name || null,
          business_id: areaFormData.business_id || null,
          area_type: areaFormData.area_type,
          enable_questions: areaFormData.enable_questions,
          access_type: areaFormData.access_type,
          login_background_color: areaFormData.login_background_color,
          login_text_color: areaFormData.login_text_color,
          background_color: areaFormData.background_color,
          text_color: areaFormData.text_color,
          card_background_color: areaFormData.card_background_color,
          card_text_color: areaFormData.card_text_color,
          header_background_color: areaFormData.header_background_color,
          accent_color: areaFormData.accent_color,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Área de membros criada com sucesso!');
      setIsCreateDialogOpen(false);
      setAreaFormData(defaultAreaFormData);
      loadAreas();
    } catch (error: any) {
      toast.error('Erro ao criar área: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSection = async () => {
    if (!selectedArea) return;

    try {
      const newSection: Section = {
        id: crypto.randomUUID(),
        title: sectionFormData.title,
        description: sectionFormData.description,
        order_index: selectedArea.sections.length,
        blocks_layout: sectionFormData.blocks_layout,
        blocks: [],
      };

      const updatedSections = [...selectedArea.sections, newSection];

      const { error } = await supabase
        .from('simple_members_areas' as any)
        .update({ sections: updatedSections as any })
        .eq('id', selectedArea.id);

      if (error) throw error;

      const updatedArea = { ...selectedArea, sections: updatedSections };
      setSelectedArea(updatedArea);
      setAreas(prev => prev.map(a => a.id === updatedArea.id ? updatedArea : a));
      setIsAddSectionDialogOpen(false);
      setSectionFormData({ title: '', description: '', blocks_layout: ['full'] });
      toast.success('Seção adicionada!');
    } catch (error: any) {
      toast.error('Erro ao adicionar seção: ' + error.message);
    }
  };

  const handleEditSection = async () => {
    if (!selectedArea || !editingSection) return;

    try {
      const updatedSections = selectedArea.sections.map(section =>
        section.id === editingSection.id
          ? {
              ...section,
              title: sectionFormData.title,
              description: sectionFormData.description,
              blocks_layout: sectionFormData.blocks_layout,
            }
          : section
      );

      const { error } = await supabase
        .from('simple_members_areas' as any)
        .update({ sections: updatedSections as any })
        .eq('id', selectedArea.id);

      if (error) throw error;

      const updatedArea = { ...selectedArea, sections: updatedSections };
      setSelectedArea(updatedArea);
      setAreas(prev => prev.map(a => a.id === updatedArea.id ? updatedArea : a));
      setIsEditSectionDialogOpen(false);
      setEditingSection(null);
      setSectionFormData({ title: '', description: '', blocks_layout: ['full'] });
      toast.success('Seção atualizada!');
    } catch (error: any) {
      toast.error('Erro ao atualizar seção: ' + error.message);
    }
  };

  const handleDeleteSection = async () => {
    if (!selectedArea || !sectionToDelete) return;

    try {
      const updatedSections = selectedArea.sections.filter(
        section => section.id !== sectionToDelete.id
      );

      const { error } = await supabase
        .from('simple_members_areas' as any)
        .update({ sections: updatedSections as any })
        .eq('id', selectedArea.id);

      if (error) throw error;

      const updatedArea = { ...selectedArea, sections: updatedSections };
      setSelectedArea(updatedArea);
      setAreas(prev => prev.map(a => a.id === updatedArea.id ? updatedArea : a));
      setIsDeleteSectionDialogOpen(false);
      setSectionToDelete(null);
      toast.success('Seção excluída!');
    } catch (error: any) {
      toast.error('Erro ao excluir seção: ' + error.message);
    }
  };

  const handleAddBlock = async () => {
    if (!selectedArea || !selectedSection) return;

    try {
      // Pegar nome do cliente se for histórico
      const selectedCustomer = (blockFormData.type === 'customer_history' || blockFormData.type === 'payment_history')
        ? customers.find(c => c.id === blockFormData.customer_id)
        : null;

      const newBlock: ContentBlock = {
        id: crypto.randomUUID(),
        type: blockFormData.type,
        title: blockFormData.title,
        content: blockFormData.content,
        order_index: selectedSection.blocks.length,
        block_position: blockFormData.block_position,
        customer_id: blockFormData.customer_id || undefined,
        customer_name: selectedCustomer?.name || undefined,
      };

      const updatedSections = selectedArea.sections.map(section => {
        if (section.id === selectedSection.id) {
          return { ...section, blocks: [...section.blocks, newBlock] };
        }
        return section;
      });

      const { error } = await supabase
        .from('simple_members_areas' as any)
        .update({ sections: updatedSections as any })
        .eq('id', selectedArea.id);

      if (error) throw error;

      const updatedArea = { ...selectedArea, sections: updatedSections };
      setSelectedArea(updatedArea);
      setAreas(prev => prev.map(a => a.id === updatedArea.id ? updatedArea : a));
      setIsAddBlockDialogOpen(false);
      setBlockFormData({ type: 'text', title: '', content: '', block_position: 0, customer_id: '' });
      setUploadedImageUrl('');
      toast.success('Bloco adicionado!');
    } catch (error: any) {
      toast.error('Erro ao adicionar bloco: ' + error.message);
    }
  };

  const handleEditBlock = async () => {
    if (!selectedArea || !editingBlock) return;

    try {
      // Pegar nome do cliente se for histórico
      const selectedCustomer = (blockFormData.type === 'customer_history' || blockFormData.type === 'payment_history')
        ? customers.find(c => c.id === blockFormData.customer_id)
        : null;

      const updatedSections = selectedArea.sections.map(section => {
        if (section.id === editingBlock.sectionId) {
          return {
            ...section,
            blocks: section.blocks.map(block => 
              block.id === editingBlock.block.id
                ? { 
                    ...block, 
                    ...blockFormData,
                    customer_name: selectedCustomer?.name || block.customer_name,
                  }
                : block
            ),
          };
        }
        return section;
      });

      const { error } = await supabase
        .from('simple_members_areas' as any)
        .update({ sections: updatedSections as any })
        .eq('id', selectedArea.id);

      if (error) throw error;

      const updatedArea = { ...selectedArea, sections: updatedSections };
      setSelectedArea(updatedArea);
      setAreas(prev => prev.map(a => a.id === updatedArea.id ? updatedArea : a));
      setEditingBlock(null);
      setIsAddBlockDialogOpen(false);
      setBlockFormData({ type: 'text', title: '', content: '', block_position: 0, customer_id: '' });
      toast.success('Bloco atualizado!');
    } catch (error: any) {
      toast.error('Erro ao atualizar bloco: ' + error.message);
    }
  };

  const handleDeleteBlock = async (sectionId: string, blockId: string) => {
    if (!selectedArea) return;

    try {
      const updatedSections = selectedArea.sections.map(section => {
        if (section.id === sectionId) {
          return {
            ...section,
            blocks: section.blocks.filter(block => block.id !== blockId),
          };
        }
        return section;
      });

      const { error } = await supabase
        .from('simple_members_areas' as any)
        .update({ sections: updatedSections as any })
        .eq('id', selectedArea.id);

      if (error) throw error;

      const updatedArea = { ...selectedArea, sections: updatedSections };
      setSelectedArea(updatedArea);
      setAreas(prev => prev.map(a => a.id === updatedArea.id ? updatedArea : a));
      toast.success('Bloco excluído!');
    } catch (error: any) {
      toast.error('Erro ao excluir bloco: ' + error.message);
    }
  };

  const handleCopyLink = (area: MembersArea) => {
    const link = `${window.location.origin}/members/${area.slug}`;
    navigator.clipboard.writeText(link);
    toast.success('Link copiado!');
  };

  const handleOpenEditDialog = (area: MembersArea) => {
    setEditingArea(area);
    setAreaFormData({
      name: area.name,
      description: area.description,
      password: area.password,
      access_type: area.access_type || 'password',
      primary_color: area.primary_color || '#8B5CF6',
      secondary_color: area.secondary_color || '#EC4899',
      logo_url: area.logo_url || '',
      customer_id: area.customer_id || '',
      customer_name: area.customer_name || '',
      business_id: area.business_id || '',
      area_type: area.area_type || 'course',
      enable_questions: (area as any).enable_questions || false,
      login_background_color: (area as any).login_background_color || '#1a1a2e',
      login_text_color: (area as any).login_text_color || '#ffffff',
      background_color: area.background_color || '#ffffff',
      text_color: area.text_color || '#1f2937',
      card_background_color: area.card_background_color || '#f9fafb',
      card_text_color: area.card_text_color || '#374151',
      header_background_color: area.header_background_color || '#f3f4f6',
      accent_color: area.accent_color || '#8B5CF6',
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateArea = async () => {
    if (!editingArea) return;
    
    try {
      setLoading(true);

      // Get customer name if customer is selected
      const selectedCustomer = areaFormData.customer_id 
        ? customers.find(c => c.id === areaFormData.customer_id) 
        : null;

      const { error } = await supabase
        .from('simple_members_areas' as any)
        .update({
          name: areaFormData.name,
          description: areaFormData.description,
          password: areaFormData.access_type === 'email_code' ? 'email_code_access' : areaFormData.password,
          primary_color: areaFormData.primary_color,
          secondary_color: areaFormData.secondary_color,
          logo_url: areaFormData.logo_url || null,
          customer_id: areaFormData.customer_id || null,
          customer_name: selectedCustomer?.name || null,
          business_id: areaFormData.business_id || null,
          area_type: areaFormData.area_type,
          enable_questions: areaFormData.enable_questions,
          access_type: areaFormData.access_type,
          login_background_color: areaFormData.login_background_color,
          login_text_color: areaFormData.login_text_color,
          background_color: areaFormData.background_color,
          text_color: areaFormData.text_color,
          card_background_color: areaFormData.card_background_color,
          card_text_color: areaFormData.card_text_color,
          header_background_color: areaFormData.header_background_color,
          accent_color: areaFormData.accent_color,
        })
        .eq('id', editingArea.id);

      if (error) throw error;

      toast.success('Área atualizada com sucesso!');
      setIsEditDialogOpen(false);
      setEditingArea(null);
      setAreaFormData(defaultAreaFormData);
      loadAreas();
    } catch (error: any) {
      toast.error('Erro ao atualizar área: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteArea = async () => {
    if (!areaToDelete) return;
    
    try {
      setLoading(true);
      const { error } = await supabase
        .from('simple_members_areas' as any)
        .delete()
        .eq('id', areaToDelete.id);

      if (error) throw error;

      toast.success('Área excluída com sucesso!');
      setIsDeleteDialogOpen(false);
      setAreaToDelete(null);
      loadAreas();
    } catch (error: any) {
      toast.error('Erro ao excluir área: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = async (event: any, sectionId: string) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !selectedArea) return;

    const section = selectedArea.sections.find(s => s.id === sectionId);
    if (!section) return;

    const oldIndex = section.blocks.findIndex(b => b.id === active.id);
    const newIndex = section.blocks.findIndex(b => b.id === over.id);

    const reorderedBlocks = arrayMove(section.blocks, oldIndex, newIndex).map((block, idx) => ({
      ...block,
      order_index: idx,
    }));

    const updatedSections = selectedArea.sections.map(s => 
      s.id === sectionId ? { ...s, blocks: reorderedBlocks } : s
    );

    try {
      const { error } = await supabase
        .from('simple_members_areas' as any)
        .update({ sections: updatedSections as any })
        .eq('id', selectedArea.id);

      if (error) throw error;
      const updatedArea = { ...selectedArea, sections: updatedSections };
      setSelectedArea(updatedArea);
      setAreas(prev => prev.map(a => a.id === updatedArea.id ? updatedArea : a));
    } catch (error: any) {
      toast.error('Erro ao reordenar: ' + error.message);
    }
  };

  const handleBlockContainerDragEnd = async (event: any, sectionId: string) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !selectedArea) return;

    const section = selectedArea.sections.find(s => s.id === sectionId);
    if (!section || !section.blocks_layout) return;

    const prefix = `block-container-${sectionId}-`;
    const oldIndex = parseInt(String(active.id).replace(prefix, ''));
    const newIndex = parseInt(String(over.id).replace(prefix, ''));

    const reorderedLayout = arrayMove(section.blocks_layout, oldIndex, newIndex);

    // Remap block_position for all blocks
    const blocksByOldPosition: Record<number, ContentBlock[]> = {};
    section.blocks.forEach(b => {
      const pos = b.block_position || 0;
      if (!blocksByOldPosition[pos]) blocksByOldPosition[pos] = [];
      blocksByOldPosition[pos].push(b);
    });

    // Build mapping: old position -> new position
    const positionMapping: Record<number, number> = {};
    const oldOrder = section.blocks_layout.map((_, i) => i);
    const newOrder = arrayMove(oldOrder, oldIndex, newIndex);
    newOrder.forEach((oldPos, newPos) => {
      positionMapping[oldPos] = newPos;
    });

    const updatedBlocks = section.blocks.map(block => ({
      ...block,
      block_position: positionMapping[block.block_position || 0] ?? block.block_position ?? 0,
    }));

    const updatedSections = selectedArea.sections.map(s =>
      s.id === sectionId ? { ...s, blocks_layout: reorderedLayout, blocks: updatedBlocks } : s
    );

    try {
      const { error } = await supabase
        .from('simple_members_areas' as any)
        .update({ sections: updatedSections as any })
        .eq('id', selectedArea.id);

      if (error) throw error;
      const updatedArea = { ...selectedArea, sections: updatedSections };
      setSelectedArea(updatedArea);
      setAreas(prev => prev.map(a => a.id === updatedArea.id ? updatedArea : a));
      toast.success('Blocos reordenados!');
    } catch (error: any) {
      toast.error('Erro ao reordenar blocos: ' + error.message);
    }
  };

  const handleSectionDragEnd = async (event: any) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !selectedArea) return;

    const oldIndex = selectedArea.sections.findIndex(s => s.id === active.id);
    const newIndex = selectedArea.sections.findIndex(s => s.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reorderedSections = arrayMove(selectedArea.sections, oldIndex, newIndex).map((s, idx) => ({
      ...s,
      order_index: idx,
    }));

    try {
      const { error } = await supabase
        .from('simple_members_areas' as any)
        .update({ sections: reorderedSections as any })
        .eq('id', selectedArea.id);

      if (error) throw error;
      const updatedArea = { ...selectedArea, sections: reorderedSections };
      setSelectedArea(updatedArea);
      setAreas(prev => prev.map(a => a.id === updatedArea.id ? updatedArea : a));
      toast.success('Seções reordenadas!');
    } catch (error: any) {
      toast.error('Erro ao reordenar seções: ' + error.message);
    }
  };

  if (selectedArea) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <Button variant="ghost" onClick={() => setSelectedArea(null)} className="mb-2">
              ← Voltar
            </Button>
            <h2 className="text-2xl font-bold">{selectedArea.name}</h2>
            <p className="text-muted-foreground">{selectedArea.description}</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" onClick={() => handleCopyLink(selectedArea)}>
              <LinkIcon className="w-4 h-4 mr-2" />
              Copiar Link
            </Button>
            <Button variant="outline" onClick={() => window.open(`/members/${selectedArea.slug}`, '_blank')}>
              <ExternalLink className="w-4 h-4 mr-2" />
              Visualizar
            </Button>
            <Button onClick={() => setIsAddSectionDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Nova Seção
            </Button>
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="bg-muted/30">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${selectedArea.primary_color || '#8B5CF6'}20` }}>
                  {selectedArea.access_type === 'email_code' 
                    ? <Mail className="w-5 h-5" style={{ color: selectedArea.primary_color || '#8B5CF6' }} />
                    : <Lock className="w-5 h-5" style={{ color: selectedArea.primary_color || '#8B5CF6' }} />
                  }
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">
                    {selectedArea.access_type === 'email_code' ? 'Acesso por Código (Venda)' : 'Senha de Acesso'}
                  </p>
                  <p className="font-mono font-medium">
                    {selectedArea.access_type === 'email_code' ? 'Código automático via Checkout' : selectedArea.password}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-muted/30">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-primary/10">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total de Seções</p>
                  <p className="font-medium">{selectedArea.sections.length} seções</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-muted/30">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-primary/10">
                  <Video className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total de Conteúdos</p>
                  <p className="font-medium">
                    {selectedArea.sections.reduce((acc, s) => acc + s.blocks.length, 0)} itens
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Live Preview Toggle */}
        <div className="lg:grid lg:grid-cols-3 lg:gap-6">
          {/* Sections List - 2/3 width on large screens */}
          <div className="lg:col-span-2 space-y-4">

            {selectedArea.sections.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-muted-foreground mb-4">Nenhuma seção criada ainda</p>
                  <Button onClick={() => setIsAddSectionDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Criar Primeira Seção
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleSectionDragEnd}
              >
                <SortableContext
                  items={selectedArea.sections.map(s => s.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-4">
                    {selectedArea.sections.map((section) => (
                      <SortableSection key={section.id} id={section.id}>
                        <Card>
                          <CardHeader>
                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <div className="flex-1 min-w-0">
                                <CardTitle className="truncate">{section.title}</CardTitle>
                                {section.description && <p className="text-sm text-muted-foreground truncate">{section.description}</p>}
                              </div>
                              <div className="flex gap-2 shrink-0">
                                <Button 
                                  variant="outline" 
                                  size="icon"
                                  onClick={() => {
                                    setEditingSection(section);
                                    setSectionFormData({
                                      title: section.title,
                                      description: section.description || '',
                                      blocks_layout: section.blocks_layout || ['full'],
                                    });
                                    setIsEditSectionDialogOpen(true);
                                  }}
                                >
                                  <Settings className="w-4 h-4" />
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="icon"
                                  onClick={() => {
                                    setSectionToDelete(section);
                                    setIsDeleteSectionDialogOpen(true);
                                  }}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                                <Button onClick={() => { setSelectedSection(section); setIsAddBlockDialogOpen(true); }}>
                                  <Plus className="w-4 h-4 mr-2" />
                                  Adicionar Conteúdo
                                </Button>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent>
                            {/* Render blocks as containers based on layout */}
                            <div className="space-y-4">
                              {section.blocks_layout && section.blocks_layout.length > 0 ? (
                                <DndContext
                                  sensors={sensors}
                                  collisionDetection={closestCenter}
                                  onDragEnd={(e) => handleBlockContainerDragEnd(e, section.id)}
                                >
                                  <SortableContext
                                    items={section.blocks_layout.map((_, i) => `block-container-${section.id}-${i}`)}
                                    strategy={verticalListSortingStrategy}
                                  >
                                    <div className="space-y-4">
                                      {section.blocks_layout.map((layoutType, blockIndex) => {
                                        const blockContents = section.blocks
                                          .filter(b => (b.block_position || 0) === blockIndex)
                                          .sort((a, b) => a.order_index - b.order_index);
                                        
                                        const layoutLabel = layoutType === 'full' ? 'Largura Total' : 
                                          layoutType === 'half' ? 'Metade' : 'Um Terço';

                                        return (
                                          <SortableBlockContainer key={`block-container-${section.id}-${blockIndex}`} id={`block-container-${section.id}-${blockIndex}`}>
                                            {(dragHandleProps) => (
                                              <>
                                                {/* Block Header */}
                                                <div className="px-4 py-2 bg-muted/50 border-b flex items-center justify-between">
                                                  <div className="flex items-center gap-2">
                                                    <div {...dragHandleProps} className="cursor-grab active:cursor-grabbing">
                                                      <GripVertical className="w-4 h-4 text-muted-foreground" />
                                                    </div>
                                                    <Badge variant="outline" className="text-xs">
                                                      Bloco {blockIndex + 1}
                                                    </Badge>
                                                    <span className="text-xs text-muted-foreground">
                                                      ({layoutLabel}) • {blockContents.length} conteúdo(s)
                                                    </span>
                                                  </div>
                                                  <Button 
                                                    variant="ghost" 
                                                    size="sm"
                                                    onClick={() => { 
                                                      setSelectedSection(section); 
                                                      setBlockFormData(prev => ({ ...prev, block_position: blockIndex }));
                                                      setIsAddBlockDialogOpen(true); 
                                                    }}
                                                  >
                                                    <Plus className="w-4 h-4" />
                                                  </Button>
                                                </div>
                                                {/* Block Contents */}
                                                <div className="p-3">
                                                  {blockContents.length > 0 ? (
                                                    <DndContext
                                                      sensors={sensors}
                                                      collisionDetection={closestCenter}
                                                      onDragEnd={(e) => handleDragEnd(e, section.id)}
                                                    >
                                                      <SortableContext
                                                        items={blockContents.map(b => b.id)}
                                                        strategy={verticalListSortingStrategy}
                                                      >
                                                        <div className="space-y-2">
                                                          {blockContents.map((block) => (
                                                            <SortableBlock
                                                              key={block.id}
                                                              block={block}
                                                              onEdit={() => {
                                                                setEditingBlock({ sectionId: section.id, block });
                                                                setBlockFormData({
                                                                  type: block.type,
                                                                  title: block.title || '',
                                                                  content: block.content,
                                                                  block_position: block.block_position || 0,
                                                                  customer_id: block.customer_id || '',
                                                                });
                                                                setIsAddBlockDialogOpen(true);
                                                              }}
                                                              onDelete={() => handleDeleteBlock(section.id, block.id)}
                                                            />
                                                          ))}
                                                        </div>
                                                      </SortableContext>
                                                    </DndContext>
                                                  ) : (
                                                    <div className="text-center py-4 text-sm text-muted-foreground border-2 border-dashed rounded-lg">
                                                      Clique em "Adicionar" para incluir conteúdo neste bloco
                                                    </div>
                                                  )}
                                                </div>
                                              </>
                                            )}
                                          </SortableBlockContainer>
                                        );
                                      })}
                                    </div>
                                  </SortableContext>
                                </DndContext>
                              ) : (
                                <div className="text-center py-8 text-muted-foreground">
                                  Configure o layout da seção para definir os blocos
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </SortableSection>
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </div>

          {/* Live Preview - Right Column */}
          <div className="hidden lg:block">
            <div className="sticky top-4">
              <p className="text-sm font-medium text-muted-foreground mb-3">Preview em Tempo Real</p>
              <SimpleMembersAreaPreview
                name={selectedArea.name}
                description={selectedArea.description}
                primaryColor={selectedArea.primary_color || '#8B5CF6'}
                secondaryColor={selectedArea.secondary_color || '#EC4899'}
                logoUrl={selectedArea.logo_url}
                sections={selectedArea.sections}
                loginBackgroundColor={(selectedArea as any).login_background_color || '#1a1a2e'}
                loginTextColor={(selectedArea as any).login_text_color || '#ffffff'}
                backgroundColor={selectedArea.background_color || '#ffffff'}
                textColor={selectedArea.text_color || '#1f2937'}
                cardBackgroundColor={selectedArea.card_background_color || '#f9fafb'}
                cardTextColor={selectedArea.card_text_color || '#374151'}
                headerBackgroundColor={selectedArea.header_background_color || '#f3f4f6'}
                accentColor={selectedArea.accent_color || '#8B5CF6'}
                areaType={selectedArea.area_type || 'course'}
                customerName={selectedArea.customer_name}
              />
            </div>
          </div>
        </div>

        <Dialog modal={false} open={isAddSectionDialogOpen} onOpenChange={setIsAddSectionDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova Seção</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Título da Seção</Label>
                <Input
                  value={sectionFormData.title}
                  onChange={(e) => setSectionFormData({ ...sectionFormData, title: e.target.value })}
                  placeholder="Ex: Módulo 1 - Introdução"
                />
              </div>
              <div>
                <Label>Descrição</Label>
                <Textarea
                  value={sectionFormData.description}
                  onChange={(e) => setSectionFormData({ ...sectionFormData, description: e.target.value })}
                  placeholder="Descreva esta seção..."
                />
              </div>
              <div>
                <Label>Layout dos Blocos</Label>
                <Select 
                  value={sectionFormData.blocks_layout.join(',')} 
                  onValueChange={(value) => setSectionFormData({ ...sectionFormData, blocks_layout: value.split(',') as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full">1 Bloco (Largura Total)</SelectItem>
                    <SelectItem value="half,half">2 Blocos (Lado a Lado)</SelectItem>
                    <SelectItem value="third,third,third">3 Blocos (Lado a Lado)</SelectItem>
                    <SelectItem value="half,full">Bloco Metade + Bloco Total</SelectItem>
                    <SelectItem value="full,half">Bloco Total + Bloco Metade</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  Define quantos blocos esta seção terá e suas larguras
                </p>
              </div>
              <Button onClick={handleAddSection} className="w-full">Adicionar Seção</Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog modal={false} open={isEditSectionDialogOpen} onOpenChange={setIsEditSectionDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Seção</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Título da Seção</Label>
                <Input
                  value={sectionFormData.title}
                  onChange={(e) => setSectionFormData({ ...sectionFormData, title: e.target.value })}
                  placeholder="Ex: Módulo 1 - Introdução"
                />
              </div>
              <div>
                <Label>Descrição</Label>
                <Textarea
                  value={sectionFormData.description}
                  onChange={(e) => setSectionFormData({ ...sectionFormData, description: e.target.value })}
                  placeholder="Descreva esta seção..."
                />
              </div>
              <div>
                <Label>Layout dos Blocos</Label>
                <Select 
                  value={sectionFormData.blocks_layout.join(',')} 
                  onValueChange={(value) => setSectionFormData({ ...sectionFormData, blocks_layout: value.split(',') as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full">1 Bloco (Largura Total)</SelectItem>
                    <SelectItem value="half,half">2 Blocos (Lado a Lado)</SelectItem>
                    <SelectItem value="third,third,third">3 Blocos (Lado a Lado)</SelectItem>
                    <SelectItem value="half,full">Bloco Metade + Bloco Total</SelectItem>
                    <SelectItem value="full,half">Bloco Total + Bloco Metade</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  Define quantos blocos esta seção terá e suas larguras
                </p>
              </div>
              <Button onClick={handleEditSection} className="w-full">Salvar Alterações</Button>
            </div>
          </DialogContent>
        </Dialog>

        <DeleteConfirmDialog
          open={isDeleteSectionDialogOpen}
          onOpenChange={setIsDeleteSectionDialogOpen}
          onConfirm={handleDeleteSection}
          title="Excluir Seção"
          description="Tem certeza que deseja excluir esta seção? Todos os conteúdos dentro dela serão perdidos permanentemente."
        />

        <Dialog modal={false} open={isAddBlockDialogOpen} onOpenChange={(open) => {
          setIsAddBlockDialogOpen(open);
          if (!open) {
            setEditingBlock(null);
            setBlockFormData({ type: 'text', title: '', content: '', block_position: 0, customer_id: '' });
          }
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingBlock ? 'Editar Conteúdo' : 'Adicionar Conteúdo'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {selectedSection && selectedSection.blocks_layout && selectedSection.blocks_layout.length > 1 && (
                <div>
                  <Label>Adicionar no Bloco</Label>
                  <Select 
                    value={blockFormData.block_position.toString()} 
                    onValueChange={(value) => setBlockFormData({ ...blockFormData, block_position: parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedSection.blocks_layout.map((layout, index) => (
                        <SelectItem key={index} value={index.toString()}>
                          Bloco {index + 1} ({layout === 'full' ? 'Largura Total' : layout === 'half' ? 'Metade' : 'Um Terço'})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    Escolha em qual bloco desta seção o conteúdo será adicionado
                  </p>
                </div>
              )}
              <div>
                <Label>Tipo de Conteúdo</Label>
                <Select value={blockFormData.type} onValueChange={(value: any) => setBlockFormData({ ...blockFormData, type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    <SelectItem value="text">📝 Texto</SelectItem>
                    <SelectItem value="image">🖼️ Imagem</SelectItem>
                    <SelectItem value="gallery">🖼️ Galeria de Imagens</SelectItem>
                    <SelectItem value="video">🎬 Vídeo (URL)</SelectItem>
                    <SelectItem value="video_gallery">🎬 Múltiplos Vídeos</SelectItem>
                    <SelectItem value="audio">🎧 Áudio/Podcast</SelectItem>
                    <SelectItem value="document">📄 Documento (PDF)</SelectItem>
                    <SelectItem value="download">⬇️ Arquivo para Download</SelectItem>
                    <SelectItem value="slides">📊 Apresentação/Slides</SelectItem>
                    <SelectItem value="link">🔗 Link Externo</SelectItem>
                    <SelectItem value="button">👆 Botão</SelectItem>
                    <SelectItem value="embed">💻 Embed (HTML/Iframe)</SelectItem>
                    <SelectItem value="notes">📒 Anotações/Resumo</SelectItem>
                    <SelectItem value="faq">❓ Perguntas Frequentes</SelectItem>
                    <SelectItem value="checklist">✅ Checklist/Tarefas</SelectItem>
                    <SelectItem value="quiz">🧩 Quiz/Questionário</SelectItem>
                    <SelectItem value="timeline">📅 Linha do Tempo</SelectItem>
                    <SelectItem value="mindmap">🧠 Mapa Mental</SelectItem>
                    <SelectItem value="webinar">📡 Webinar/Live</SelectItem>
                    <SelectItem value="certificate">🏆 Certificado</SelectItem>
                    <SelectItem value="customer_history">📜 Histórico do Cliente</SelectItem>
                    <SelectItem value="ads_dashboard">📊 Anúncios (Dashboard)</SelectItem>
                    <SelectItem value="payment_history">💰 Histórico de Pagamentos</SelectItem>
                    <SelectItem value="secret">🔒 Conteúdo Oculto (Senha)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Título</Label>
                <Input
                  value={blockFormData.title}
                  onChange={(e) => setBlockFormData({ ...blockFormData, title: e.target.value })}
                  placeholder="Título do conteúdo"
                />
              </div>

              {/* Seleção de Cliente para Histórico */}
              {(blockFormData.type === 'customer_history' || blockFormData.type === 'payment_history') && (
                <div>
                  <Label>Selecionar Cliente</Label>
                  <Select 
                    value={blockFormData.customer_id} 
                    onValueChange={(value) => setBlockFormData({ ...blockFormData, customer_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Escolha um cliente..." />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.length === 0 ? (
                        <div className="p-2 text-sm text-muted-foreground text-center">
                          Nenhum cliente cadastrado
                        </div>
                      ) : (
                        customers.map((customer) => (
                          <SelectItem key={customer.id} value={customer.id}>
                            {customer.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    O histórico de serviços, compras e pagamentos deste cliente será exibido automaticamente
                  </p>
                </div>
              )}

              {/* Seleção de Cliente de Anúncios */}
              {blockFormData.type === 'ads_dashboard' && (
                <div>
                  <Label>Selecionar Cliente de Anúncios</Label>
                  <Select 
                    value={(() => {
                      try { return JSON.parse(blockFormData.content)?.client_id || ''; } catch { return ''; }
                    })()}
                    onValueChange={(value) => {
                      const client = adClients.find(c => c.id === value);
                      setBlockFormData({ ...blockFormData, content: JSON.stringify({ client_id: value, client_name: client?.name || '' }) });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Escolha um cliente de anúncios..." />
                    </SelectTrigger>
                    <SelectContent>
                      {adClients.length === 0 ? (
                        <div className="p-2 text-sm text-muted-foreground text-center">
                          Nenhum cliente de anúncios cadastrado. Cadastre na Gestão de Anúncios.
                        </div>
                      ) : (
                        adClients.map((client) => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    O dashboard com campanhas e caixa deste cliente será exibido em tempo real
                  </p>
                </div>
              )}

              {blockFormData.type !== 'customer_history' && blockFormData.type !== 'payment_history' && blockFormData.type !== 'ads_dashboard' && (
              <div>
                <Label>Conteúdo</Label>
                {blockFormData.type === 'image' ? (
                  <ImageUpload
                    currentImage={blockFormData.content}
                    onImageSelect={(url) => setBlockFormData({ ...blockFormData, content: url })}
                    bucketName="members-content"
                  />
                ) : blockFormData.type === 'gallery' ? (
                  <div className="space-y-3">
                    <p className="text-xs text-muted-foreground">
                      Adicione várias imagens à galeria. Cada upload adiciona uma imagem.
                    </p>
                    {blockFormData.content && blockFormData.content.split('|||').filter(Boolean).map((url, idx) => (
                      <div key={idx} className="flex items-center gap-2 p-2 border rounded-md">
                        <img src={url} alt={`Imagem ${idx + 1}`} className="w-16 h-16 object-cover rounded" />
                        <span className="text-xs text-muted-foreground flex-1 truncate">{url}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const urls = blockFormData.content.split('|||').filter(Boolean);
                            urls.splice(idx, 1);
                            setBlockFormData({ ...blockFormData, content: urls.join('|||') });
                          }}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                    <ImageUpload
                      currentImage=""
                      onImageSelect={(url) => {
                        const existing = blockFormData.content ? blockFormData.content.split('|||').filter(Boolean) : [];
                        existing.push(url);
                        setBlockFormData({ ...blockFormData, content: existing.join('|||') });
                      }}
                      bucketName="members-content"
                    />
                  </div>
                ) : blockFormData.type === 'video_gallery' ? (
                  <div className="space-y-3">
                    <p className="text-xs text-muted-foreground">
                      Adicione várias URLs de vídeo com título e descrição.
                    </p>
                    {(() => {
                      let videos: { url: string; title: string; description: string }[] = [];
                      try {
                        videos = blockFormData.content ? JSON.parse(blockFormData.content) : [];
                      } catch {
                        // Migração de formato antigo (|||)
                        if (blockFormData.content) {
                          videos = blockFormData.content.split('|||').filter(Boolean).map(u => ({ url: u, title: '', description: '' }));
                        }
                      }
                      const updateVideos = (newVideos: typeof videos) => {
                        setBlockFormData({ ...blockFormData, content: JSON.stringify(newVideos) });
                      };
                      return (
                        <>
                          {videos.map((video, idx) => (
                            <div key={idx} className="p-3 border rounded-lg space-y-2 bg-muted/20">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-muted-foreground">Vídeo {idx + 1}</span>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    const updated = [...videos];
                                    updated.splice(idx, 1);
                                    updateVideos(updated);
                                  }}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                              <Input
                                value={video.title}
                                onChange={(e) => {
                                  const updated = [...videos];
                                  updated[idx] = { ...updated[idx], title: e.target.value };
                                  updateVideos(updated);
                                }}
                                placeholder="Título do vídeo"
                              />
                              <Input
                                value={video.url}
                                onChange={(e) => {
                                  const updated = [...videos];
                                  updated[idx] = { ...updated[idx], url: e.target.value };
                                  updateVideos(updated);
                                }}
                                placeholder="URL do vídeo (YouTube, Vimeo, etc)"
                              />
                              <Textarea
                                value={video.description}
                                onChange={(e) => {
                                  const updated = [...videos];
                                  updated[idx] = { ...updated[idx], description: e.target.value };
                                  updateVideos(updated);
                                }}
                                placeholder="Descrição do vídeo (opcional)"
                                className="min-h-[60px]"
                              />
                            </div>
                          ))}
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              updateVideos([...videos, { url: '', title: '', description: '' }]);
                            }}
                          >
                            <Plus className="w-4 h-4 mr-1" /> Adicionar vídeo
                          </Button>
                        </>
                      );
                    })()}
                  </div>
                ) : blockFormData.type === 'document' ? (
                  <DocumentUpload
                    currentDocument={blockFormData.content}
                    onDocumentSelect={(url) => setBlockFormData({ ...blockFormData, content: url })}
                    bucketName="members-content"
                  />
                ) : blockFormData.type === 'download' ? (
                  <>
                    <Input
                      value={blockFormData.content}
                      onChange={(e) => setBlockFormData({ ...blockFormData, content: e.target.value })}
                      placeholder="URL do arquivo para download"
                      className="mb-2"
                    />
                    <p className="text-xs text-muted-foreground">
                      Cole a URL do arquivo que deseja disponibilizar para download
                    </p>
                  </>
                ) : blockFormData.type === 'button' || blockFormData.type === 'link' ? (
                  <div className="space-y-3">
                    {(() => {
                      let data: { items: { label: string; url: string }[]; layout: 'horizontal' | 'vertical' } = { items: [{ label: '', url: '' }], layout: 'horizontal' };
                      try {
                        const parsed = JSON.parse(blockFormData.content);
                        if (parsed?.items) data = parsed;
                      } catch {
                        // Legacy single URL
                        if (blockFormData.content) {
                          data = { items: [{ label: blockFormData.title || '', url: blockFormData.content }], layout: 'horizontal' };
                        }
                      }
                      const updateData = (newData: typeof data) => {
                        setBlockFormData({ ...blockFormData, content: JSON.stringify(newData) });
                      };
                      return (
                        <>
                          <div className="flex items-center gap-2">
                            <Label className="text-xs">Disposição:</Label>
                            <Select value={data.layout} onValueChange={(v: 'horizontal' | 'vertical') => updateData({ ...data, layout: v })}>
                              <SelectTrigger className="w-[160px] h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="horizontal">Horizontal</SelectItem>
                                <SelectItem value="vertical">Vertical</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          {data.items.map((item, idx) => (
                            <div key={idx} className="p-3 border rounded-lg space-y-2 bg-muted/20">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-muted-foreground">
                                  {blockFormData.type === 'button' ? 'Botão' : 'Link'} {idx + 1}
                                </span>
                                {data.items.length > 1 && (
                                  <Button type="button" variant="ghost" size="sm" onClick={() => {
                                    const updated = { ...data, items: data.items.filter((_, i) => i !== idx) };
                                    updateData(updated);
                                  }}>
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                )}
                              </div>
                              <Input
                                value={item.label}
                                onChange={(e) => {
                                  const items = [...data.items];
                                  items[idx] = { ...items[idx], label: e.target.value };
                                  updateData({ ...data, items });
                                }}
                                placeholder={blockFormData.type === 'button' ? 'Texto do botão' : 'Texto do link'}
                              />
                              <Input
                                value={item.url}
                                onChange={(e) => {
                                  const items = [...data.items];
                                  items[idx] = { ...items[idx], url: e.target.value };
                                  updateData({ ...data, items });
                                }}
                                placeholder="URL (https://...)"
                              />
                            </div>
                          ))}
                          <Button type="button" variant="outline" size="sm" onClick={() => {
                            updateData({ ...data, items: [...data.items, { label: '', url: '' }] });
                          }}>
                            <Plus className="w-4 h-4 mr-1" /> Adicionar {blockFormData.type === 'button' ? 'botão' : 'link'}
                          </Button>
                        </>
                      );
                    })()}
                  </div>
                ) : blockFormData.type === 'video' ? (
                  <div className="space-y-3">
                    {(() => {
                      let videoData = { url: '', description: '' };
                      try {
                        const parsed = JSON.parse(blockFormData.content);
                        if (parsed?.url) videoData = parsed;
                        else videoData = { url: blockFormData.content, description: '' };
                      } catch {
                        videoData = { url: blockFormData.content || '', description: '' };
                      }
                      const updateVideoData = (newData: typeof videoData) => {
                        setBlockFormData({ ...blockFormData, content: JSON.stringify(newData) });
                      };
                      return (
                        <>
                          <div>
                            <Label className="text-xs">URL do Vídeo</Label>
                            <Input
                              value={videoData.url}
                              onChange={(e) => updateVideoData({ ...videoData, url: e.target.value })}
                              placeholder="URL do vídeo (YouTube, Vimeo, etc)"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Descrição (opcional)</Label>
                            <Textarea
                              value={videoData.description}
                              onChange={(e) => updateVideoData({ ...videoData, description: e.target.value })}
                              placeholder="Descrição do vídeo..."
                              rows={3}
                            />
                          </div>
                        </>
                      );
                    })()}
                  </div>
                ) : blockFormData.type === 'text' ? (
                  <div className="space-y-1">
                    <RichTextEditor
                      value={blockFormData.content}
                      onChange={(val) => setBlockFormData({ ...blockFormData, content: val })}
                    />
                  </div>
                ) : (
                  <div className="space-y-1">
                    <Textarea
                      value={blockFormData.content}
                      onChange={(e) => setBlockFormData({ ...blockFormData, content: e.target.value })}
                      placeholder={blockFormData.type === 'secret' ? "Digite o conteúdo oculto (senha, chave, etc)..." : "Conteúdo..."}
                    />
                    {blockFormData.type === 'secret' && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <EyeOff className="w-3 h-3" /> Este conteúdo será exibido mascarado. O aluno poderá clicar para revelar.
                      </p>
                    )}
                  </div>
                )}
              </div>
              )}
              <Button onClick={editingBlock ? handleEditBlock : handleAddBlock} className="w-full">
                {editingBlock ? 'Salvar' : 'Adicionar'}
              </Button>
            </div>
          </DialogContent>
      </Dialog>

      <DeleteConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleDeleteArea}
        title="Excluir Área de Membros"
        description="Tem certeza que deseja excluir esta área de membros? Todas as seções e conteúdos serão perdidos permanentemente."
      />
    </div>
  );
}

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Áreas de Membros</h2>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nova Área
        </Button>
      </div>

      {areas.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground mb-4">Nenhuma área de membros criada ainda</p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Criar Primeira Área
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {areas.map((area) => (
            <Card key={area.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center justify-between text-xl sm:text-lg gap-3">
                  <span className="line-clamp-2 flex-1">{area.name}</span>
                  {area.is_active ? <Unlock className="w-5 h-5 sm:w-4 sm:h-4 text-green-500 flex-shrink-0" /> : <Lock className="w-5 h-5 sm:w-4 sm:h-4 flex-shrink-0" />}
                </CardTitle>
                <p className="text-base sm:text-sm text-muted-foreground line-clamp-2">{area.description}</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Badge variant="outline" className="text-sm py-1">{area.sections.length} seções</Badge>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button variant="outline" size="default" className="flex-1 h-11 sm:h-9 text-base sm:text-sm" onClick={() => setSelectedArea(area)}>
                      <Edit className="w-5 h-5 sm:w-4 sm:h-4 mr-2" />
                      Gerenciar
                    </Button>
                    <Button variant="outline" size="default" className="h-11 sm:h-9 px-4 sm:px-3" onClick={(e) => { e.stopPropagation(); handleOpenEditDialog(area); }}>
                      <Edit className="w-5 h-5 sm:w-4 sm:h-4" />
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="default" className="flex-1 h-11 sm:h-9 text-base sm:text-sm" onClick={(e) => { e.stopPropagation(); handleCopyLink(area); }}>
                      <LinkIcon className="w-5 h-5 sm:w-4 sm:h-4 mr-2" />
                      Copiar Link
                    </Button>
                    <Button 
                      variant="outline" 
                      size="default"
                      className="h-11 sm:h-9 px-4 sm:px-3"
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        window.open(`/members/${area.slug}`, '_blank');
                      }}
                    >
                      <ExternalLink className="w-5 h-5 sm:w-4 sm:h-4" />
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="default"
                      className="h-11 sm:h-9 px-4 sm:px-3"
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        setAreaToDelete(area);
                        setIsDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="w-5 h-5 sm:w-4 sm:h-4" />
                    </Button>
                  </div>
                  {(area as any).enable_questions && (
                    <Button
                      variant="secondary"
                      size="default"
                      className="w-full h-11 sm:h-9 text-base sm:text-sm"
                      onClick={(e) => { e.stopPropagation(); setQuestionsAreaId({ id: area.id, name: area.name }); }}
                    >
                      <MessageSquare className="w-5 h-5 sm:w-4 sm:h-4 mr-2" />
                      Gerenciar Dúvidas
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {questionsAreaId && (
        <ManageQuestionsDialog
          open={!!questionsAreaId}
          onOpenChange={(o) => !o && setQuestionsAreaId(null)}
          areaId={questionsAreaId.id}
          areaName={questionsAreaId.name}
        />
      )}


      <Dialog modal={false} open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Nova Área de Membros</DialogTitle>
          </DialogHeader>
          <div className="grid gap-6 lg:grid-cols-2">
            <ScrollArea className="h-[65vh] pr-4">
              <div className="space-y-4">
                <div>
                  <Label>Nome da Área</Label>
                  <Input
                    value={areaFormData.name}
                    onChange={(e) => setAreaFormData({ ...areaFormData, name: e.target.value })}
                    placeholder="Ex: Curso de Marketing Digital"
                  />
                </div>
                <div>
                  <Label>Descrição</Label>
                  <Textarea
                    value={areaFormData.description}
                    onChange={(e) => setAreaFormData({ ...areaFormData, description: e.target.value })}
                    placeholder="Descreva a área de membros..."
                  />
                </div>
                <div>
                  <Label>Tipo de Acesso</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => setAreaFormData({ ...areaFormData, access_type: 'password' })}
                      className={`flex items-center gap-2 p-3 rounded-lg border-2 transition-all text-left ${
                        areaFormData.access_type === 'password' 
                          ? 'border-primary bg-primary/5' 
                          : 'border-border hover:border-muted-foreground/30'
                      }`}
                    >
                      <Key className="w-5 h-5 text-primary shrink-0" />
                      <div>
                        <p className="font-medium text-sm">Senha</p>
                        <p className="text-xs text-muted-foreground">Acesso com senha manual</p>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setAreaFormData({ ...areaFormData, access_type: 'email_code' })}
                      className={`flex items-center gap-2 p-3 rounded-lg border-2 transition-all text-left ${
                        areaFormData.access_type === 'email_code' 
                          ? 'border-primary bg-primary/5' 
                          : 'border-border hover:border-muted-foreground/30'
                      }`}
                    >
                      <ShoppingCart className="w-5 h-5 text-primary shrink-0" />
                      <div>
                        <p className="font-medium text-sm">Venda</p>
                        <p className="text-xs text-muted-foreground">Código por email após compra</p>
                      </div>
                    </button>
                  </div>
                </div>
                {areaFormData.access_type === 'password' ? (
                  <div>
                    <Label>Senha de Acesso</Label>
                    <Input
                      value={areaFormData.password}
                      onChange={(e) => setAreaFormData({ ...areaFormData, password: e.target.value })}
                      placeholder="Defina uma senha"
                      type="text"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Os membros precisarão desta senha para acessar o conteúdo</p>
                  </div>
                ) : (
                  <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-primary" />
                      <p className="font-medium text-sm">Acesso por código de compra</p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Ao vincular esta área ao <strong>Criador de Checkout</strong>, um código único será gerado automaticamente após cada compra e enviado por email ao cliente. O aluno usará esse código para acessar o conteúdo.
                    </p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <Badge variant="outline" className="text-xs">Automático</Badge>
                      <Badge variant="outline" className="text-xs">Seguro</Badge>
                      <Badge variant="outline" className="text-xs">Sem senha manual</Badge>
                    </div>
                  </div>
                )}
                <div>
                  <Label>Tipo de Área</Label>
                  <Select 
                    value={areaFormData.area_type} 
                    onValueChange={(value) => setAreaFormData({ ...areaFormData, area_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="course">📚 Curso (com progresso e acompanhamento)</SelectItem>
                      <SelectItem value="exclusive">🔒 Área Exclusiva (sem progresso)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    {areaFormData.area_type === 'course' 
                      ? 'Mostrará barra de progresso e acompanhamento de módulos' 
                      : 'Área exclusiva sem acompanhamento de progresso'}
                  </p>
                </div>
                {areaFormData.area_type === 'course' && (
                  <div className="flex items-start justify-between gap-3 rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <Label className="text-sm">Habilitar dúvidas dos alunos</Label>
                      <p className="text-xs text-muted-foreground">
                        Cada aluno poderá comentar abaixo dos vídeos para tirar dúvidas. Apenas o próprio aluno vê suas perguntas e suas respostas.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      className="mt-1 h-5 w-5 cursor-pointer"
                      checked={areaFormData.enable_questions}
                      onChange={(e) => setAreaFormData({ ...areaFormData, enable_questions: e.target.checked })}
                    />
                  </div>
                )}
                <div>
                  <ImageUpload
                    label="Logo (opcional)"
                    onImageSelect={(url) => setAreaFormData({ ...areaFormData, logo_url: url })}
                    currentImage={areaFormData.logo_url}
                    bucketName="business-logos"
                  />
                </div>
                <div className="space-y-3">
                  <Label className="flex items-center gap-2">
                    🔐 Design da Tela de Login
                  </Label>
                  <p className="text-xs text-muted-foreground">Personalize as cores da página de acesso</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <Label className="text-sm">Cor de Fundo</Label>
                      <Input
                        type="color"
                        value={areaFormData.login_background_color}
                        onChange={(e) => setAreaFormData({ ...areaFormData, login_background_color: e.target.value })}
                        className="h-10 w-full"
                      />
                    </div>
                    <div>
                      <Label className="text-sm">Cor do Texto</Label>
                      <Input
                        type="color"
                        value={areaFormData.login_text_color}
                        onChange={(e) => setAreaFormData({ ...areaFormData, login_text_color: e.target.value })}
                        className="h-10 w-full"
                      />
                    </div>
                    <div>
                      <Label className="text-sm">Cor Primária (Gradiente)</Label>
                      <Input
                        type="color"
                        value={areaFormData.primary_color}
                        onChange={(e) => setAreaFormData({ ...areaFormData, primary_color: e.target.value })}
                        className="h-10 w-full"
                      />
                    </div>
                    <div>
                      <Label className="text-sm">Cor Secundária (Gradiente)</Label>
                      <Input
                        type="color"
                        value={areaFormData.secondary_color}
                        onChange={(e) => setAreaFormData({ ...areaFormData, secondary_color: e.target.value })}
                        className="h-10 w-full"
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <Label className="flex items-center gap-2">
                    🎨 Design da Área Interna
                  </Label>
                  <p className="text-xs text-muted-foreground">Personalize as cores da área após o login</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <Label className="text-sm">Cor de Fundo</Label>
                      <Input
                        type="color"
                        value={areaFormData.background_color}
                        onChange={(e) => setAreaFormData({ ...areaFormData, background_color: e.target.value })}
                        className="h-10 w-full"
                      />
                    </div>
                    <div>
                      <Label className="text-sm">Cor do Texto</Label>
                      <Input
                        type="color"
                        value={areaFormData.text_color}
                        onChange={(e) => setAreaFormData({ ...areaFormData, text_color: e.target.value })}
                        className="h-10 w-full"
                      />
                    </div>
                    <div>
                      <Label className="text-sm">Fundo do Header</Label>
                      <Input
                        type="color"
                        value={areaFormData.header_background_color}
                        onChange={(e) => setAreaFormData({ ...areaFormData, header_background_color: e.target.value })}
                        className="h-10 w-full"
                      />
                    </div>
                    <div>
                      <Label className="text-sm">Cor de Destaque</Label>
                      <Input
                        type="color"
                        value={areaFormData.accent_color}
                        onChange={(e) => setAreaFormData({ ...areaFormData, accent_color: e.target.value })}
                        className="h-10 w-full"
                      />
                    </div>
                    <div>
                      <Label className="text-sm">Fundo dos Cards</Label>
                      <Input
                        type="color"
                        value={areaFormData.card_background_color}
                        onChange={(e) => setAreaFormData({ ...areaFormData, card_background_color: e.target.value })}
                        className="h-10 w-full"
                      />
                    </div>
                    <div>
                      <Label className="text-sm">Texto dos Cards</Label>
                      <Input
                        type="color"
                        value={areaFormData.card_text_color}
                        onChange={(e) => setAreaFormData({ ...areaFormData, card_text_color: e.target.value })}
                        className="h-10 w-full"
                      />
                    </div>
                  </div>
                </div>
                <Button onClick={handleCreateArea} className="w-full" disabled={loading}>
                  {loading ? 'Criando...' : 'Criar Área'}
                </Button>
              </div>
            </ScrollArea>
            <div className="hidden lg:block">
              <div className="sticky top-0">
                <p className="text-sm font-medium text-muted-foreground mb-3">Pré-visualização</p>
                <SimpleMembersAreaPreview
                  name={areaFormData.name}
                  description={areaFormData.description}
                  primaryColor={areaFormData.primary_color}
                  secondaryColor={areaFormData.secondary_color}
                  logoUrl={areaFormData.logo_url}
                  loginBackgroundColor={areaFormData.login_background_color}
                  loginTextColor={areaFormData.login_text_color}
                  backgroundColor={areaFormData.background_color}
                  textColor={areaFormData.text_color}
                  cardBackgroundColor={areaFormData.card_background_color}
                  cardTextColor={areaFormData.card_text_color}
                  headerBackgroundColor={areaFormData.header_background_color}
                  accentColor={areaFormData.accent_color}
                  areaType={areaFormData.area_type}
                  customerName={areaFormData.customer_id ? customers.find(c => c.id === areaFormData.customer_id)?.name : undefined}
                />
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog modal={false} open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Editar Área de Membros</DialogTitle>
          </DialogHeader>
          <div className="grid gap-6 lg:grid-cols-2">
            <ScrollArea className="h-[65vh] pr-4">
              <div className="space-y-4">
                <div>
                  <Label>Nome da Área</Label>
                  <Input
                    value={areaFormData.name}
                    onChange={(e) => setAreaFormData({ ...areaFormData, name: e.target.value })}
                    placeholder="Ex: Curso de Marketing Digital"
                  />
                </div>
                <div>
                  <Label>Descrição</Label>
                  <Textarea
                    value={areaFormData.description}
                    onChange={(e) => setAreaFormData({ ...areaFormData, description: e.target.value })}
                    placeholder="Descreva a área de membros..."
                  />
                </div>
                <div>
                  <Label>Tipo de Acesso</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => setAreaFormData({ ...areaFormData, access_type: 'password' })}
                      className={`flex items-center gap-2 p-3 rounded-lg border-2 transition-all text-left ${
                        areaFormData.access_type === 'password' 
                          ? 'border-primary bg-primary/5' 
                          : 'border-border hover:border-muted-foreground/30'
                      }`}
                    >
                      <Key className="w-5 h-5 text-primary shrink-0" />
                      <div>
                        <p className="font-medium text-sm">Senha</p>
                        <p className="text-xs text-muted-foreground">Acesso com senha manual</p>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setAreaFormData({ ...areaFormData, access_type: 'email_code' })}
                      className={`flex items-center gap-2 p-3 rounded-lg border-2 transition-all text-left ${
                        areaFormData.access_type === 'email_code' 
                          ? 'border-primary bg-primary/5' 
                          : 'border-border hover:border-muted-foreground/30'
                      }`}
                    >
                      <ShoppingCart className="w-5 h-5 text-primary shrink-0" />
                      <div>
                        <p className="font-medium text-sm">Venda</p>
                        <p className="text-xs text-muted-foreground">Código por email após compra</p>
                      </div>
                    </button>
                  </div>
                </div>
                {areaFormData.access_type === 'password' ? (
                  <div>
                    <Label>Senha de Acesso</Label>
                    <Input
                      value={areaFormData.password}
                      onChange={(e) => setAreaFormData({ ...areaFormData, password: e.target.value })}
                      placeholder="Defina uma senha"
                      type="text"
                    />
                  </div>
                ) : (
                  <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-primary" />
                      <p className="font-medium text-sm">Acesso por código de compra</p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Código único gerado automaticamente pelo Checkout e enviado por email ao cliente.
                    </p>
                  </div>
                )}
                <div>
                  <Label>Tipo de Área</Label>
                  <Select 
                    value={areaFormData.area_type} 
                    onValueChange={(value) => setAreaFormData({ ...areaFormData, area_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="course">📚 Curso (com progresso e acompanhamento)</SelectItem>
                      <SelectItem value="exclusive">🔒 Área Exclusiva (sem progresso)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    {areaFormData.area_type === 'course' 
                      ? 'Mostrará barra de progresso e acompanhamento de módulos' 
                      : 'Área exclusiva sem acompanhamento de progresso'}
                  </p>
                </div>
                {areaFormData.area_type === 'course' && (
                  <div className="flex items-start justify-between gap-3 rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <Label className="text-sm">Habilitar dúvidas dos alunos</Label>
                      <p className="text-xs text-muted-foreground">
                        Cada aluno poderá comentar abaixo dos vídeos para tirar dúvidas. Apenas o próprio aluno vê suas perguntas e suas respostas.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      className="mt-1 h-5 w-5 cursor-pointer"
                      checked={areaFormData.enable_questions}
                      onChange={(e) => setAreaFormData({ ...areaFormData, enable_questions: e.target.checked })}
                    />
                  </div>
                )}
                <div>
                  <ImageUpload
                    label="Logo (opcional)"
                    onImageSelect={(url) => setAreaFormData({ ...areaFormData, logo_url: url })}
                    currentImage={areaFormData.logo_url}
                    bucketName="business-logos"
                  />
                </div>
                <div className="space-y-3">
                  <Label className="flex items-center gap-2">
                    🔐 Design da Tela de Login
                  </Label>
                  <p className="text-xs text-muted-foreground">Personalize as cores da página de acesso</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <Label className="text-sm">Cor de Fundo</Label>
                      <Input
                        type="color"
                        value={areaFormData.login_background_color}
                        onChange={(e) => setAreaFormData({ ...areaFormData, login_background_color: e.target.value })}
                        className="h-10 w-full"
                      />
                    </div>
                    <div>
                      <Label className="text-sm">Cor do Texto</Label>
                      <Input
                        type="color"
                        value={areaFormData.login_text_color}
                        onChange={(e) => setAreaFormData({ ...areaFormData, login_text_color: e.target.value })}
                        className="h-10 w-full"
                      />
                    </div>
                    <div>
                      <Label className="text-sm">Cor Primária (Gradiente)</Label>
                      <Input
                        type="color"
                        value={areaFormData.primary_color}
                        onChange={(e) => setAreaFormData({ ...areaFormData, primary_color: e.target.value })}
                        className="h-10 w-full"
                      />
                    </div>
                    <div>
                      <Label className="text-sm">Cor Secundária (Gradiente)</Label>
                      <Input
                        type="color"
                        value={areaFormData.secondary_color}
                        onChange={(e) => setAreaFormData({ ...areaFormData, secondary_color: e.target.value })}
                        className="h-10 w-full"
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <Label className="flex items-center gap-2">
                    🎨 Design da Área Interna
                  </Label>
                  <p className="text-xs text-muted-foreground">Personalize as cores da área após o login</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <Label className="text-sm">Cor de Fundo</Label>
                      <Input
                        type="color"
                        value={areaFormData.background_color}
                        onChange={(e) => setAreaFormData({ ...areaFormData, background_color: e.target.value })}
                        className="h-10 w-full"
                      />
                    </div>
                    <div>
                      <Label className="text-sm">Cor do Texto</Label>
                      <Input
                        type="color"
                        value={areaFormData.text_color}
                        onChange={(e) => setAreaFormData({ ...areaFormData, text_color: e.target.value })}
                        className="h-10 w-full"
                      />
                    </div>
                    <div>
                      <Label className="text-sm">Fundo do Header</Label>
                      <Input
                        type="color"
                        value={areaFormData.header_background_color}
                        onChange={(e) => setAreaFormData({ ...areaFormData, header_background_color: e.target.value })}
                        className="h-10 w-full"
                      />
                    </div>
                    <div>
                      <Label className="text-sm">Cor de Destaque</Label>
                      <Input
                        type="color"
                        value={areaFormData.accent_color}
                        onChange={(e) => setAreaFormData({ ...areaFormData, accent_color: e.target.value })}
                        className="h-10 w-full"
                      />
                    </div>
                    <div>
                      <Label className="text-sm">Fundo dos Cards</Label>
                      <Input
                        type="color"
                        value={areaFormData.card_background_color}
                        onChange={(e) => setAreaFormData({ ...areaFormData, card_background_color: e.target.value })}
                        className="h-10 w-full"
                      />
                    </div>
                    <div>
                      <Label className="text-sm">Texto dos Cards</Label>
                      <Input
                        type="color"
                        value={areaFormData.card_text_color}
                        onChange={(e) => setAreaFormData({ ...areaFormData, card_text_color: e.target.value })}
                        className="h-10 w-full"
                      />
                    </div>
                  </div>
                </div>
                <Button onClick={handleUpdateArea} className="w-full" disabled={loading}>
                  {loading ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
              </div>
            </ScrollArea>
            <div className="hidden lg:block">
              <div className="sticky top-0">
                <p className="text-sm font-medium text-muted-foreground mb-3">Pré-visualização</p>
                <SimpleMembersAreaPreview
                  name={areaFormData.name}
                  description={areaFormData.description}
                  primaryColor={areaFormData.primary_color}
                  secondaryColor={areaFormData.secondary_color}
                  logoUrl={areaFormData.logo_url}
                  loginBackgroundColor={areaFormData.login_background_color}
                  loginTextColor={areaFormData.login_text_color}
                  backgroundColor={areaFormData.background_color}
                  textColor={areaFormData.text_color}
                  cardBackgroundColor={areaFormData.card_background_color}
                  cardTextColor={areaFormData.card_text_color}
                  headerBackgroundColor={areaFormData.header_background_color}
                  accentColor={areaFormData.accent_color}
                  areaType={areaFormData.area_type}
                  customerName={areaFormData.customer_id ? customers.find(c => c.id === areaFormData.customer_id)?.name : undefined}
                />
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleDeleteArea}
        title="Excluir Área de Membros"
        description="Tem certeza que deseja excluir esta área de membros? Todas as seções e conteúdos serão perdidos permanentemente."
      />
    </div>
  );
}