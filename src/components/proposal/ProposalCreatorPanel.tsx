import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { FileText, Plus, History, Eye, Copy, Trash2, ExternalLink, Send, CheckCircle, XCircle, Clock, Filter, Pencil, Files } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { ProposalWizard } from './ProposalWizard';
import { CompanyDataStep } from './steps/CompanyDataStep';
import { ClientDataStep } from './steps/ClientDataStep';
import { IntroductionStep } from './steps/IntroductionStep';
import { ServicesStep } from './steps/ServicesStep';
import { TimelineStep } from './steps/TimelineStep';
import { PricingStep } from './steps/PricingStep';
import { ConditionsStep } from './steps/ConditionsStep';
import { SummaryStep } from './steps/SummaryStep';
import { Building2, User, FileText as FileTextIcon, Briefcase, Calendar, DollarSign, ScrollText, ClipboardList } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DeleteConfirmDialog } from '@/components/ui/delete-confirm-dialog';


interface Proposal {
  id: string;
  title: string;
  client_name: string;
  client_company: string | null;
  status: string;
  created_at: string;
  valid_until: string | null;
  pricing: { total: number };
  slug: string | null;
}

const STEPS = [
  { label: 'Empresa', icon: <Building2 className="h-3 w-3" /> },
  { label: 'Cliente', icon: <User className="h-3 w-3" /> },
  { label: 'Introdução', icon: <FileTextIcon className="h-3 w-3" /> },
  { label: 'Serviços', icon: <Briefcase className="h-3 w-3" /> },
  { label: 'Cronograma', icon: <Calendar className="h-3 w-3" /> },
  { label: 'Valores', icon: <DollarSign className="h-3 w-3" /> },
  { label: 'Condições', icon: <ScrollText className="h-3 w-3" /> },
  { label: 'Resumo', icon: <ClipboardList className="h-3 w-3" /> },
];

const initialProposalData = {
  company_name: '',
  company_logo_url: '',
  company_email: '',
  company_phone: '',
  company_address: '',
  company_cnpj: '',
  client_name: '',
  client_email: '',
  client_phone: '',
  client_company: '',
  client_cnpj: '',
  client_address: '',
  title: '',
  introduction: '',
  introduction_image_url: '',
  introduction_images: [] as string[],
  services: [] as { id: string; name: string; description: string; image_url?: string; gallery_images?: string[] }[],
  timeline: [] as { id: string; phase: string; duration: string; deliverables: string }[],
  pricing: { items: [] as { id: string; description: string; quantity: number; unit_price: number }[], discount: 0, total: 0 },
  conditions: '',
  valid_until: '',
  primary_color: '#6366f1',
  auto_carousel: false,
};

export function ProposalCreatorPanel() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('create');
  const [currentStep, setCurrentStep] = useState(0);
  const [proposalData, setProposalData] = useState(initialProposalData);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [generatedLink, setGeneratedLink] = useState('');
  const [deleteProposal, setDeleteProposal] = useState<Proposal | null>(null);
  const [editingProposal, setEditingProposal] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchProposals();
    }
  }, [user]);

  const fetchProposals = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('commercial_proposals')
        .select('id, title, client_name, client_company, status, created_at, valid_until, pricing, slug')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProposals((data || []).map((p: any) => ({
        ...p,
        pricing: p.pricing as { total: number }
      })));
    } catch (error: any) {
      toast.error('Erro ao carregar propostas');
    } finally {
      setLoading(false);
    }
  };

  const updateProposalData = (data: Partial<typeof proposalData>) => {
    setProposalData(prev => ({ ...prev, ...data }));
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0: return !!proposalData.company_name;
      case 1: return !!proposalData.client_name;
      case 2: return !!proposalData.title;
      default: return true;
    }
  };

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const generateSlug = (title: string) => {
    const base = title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    return `${base}-${Date.now().toString(36)}`;
  };

  const saveProposal = async (status: string = 'draft') => {
    if (!user) return;

    try {
      setSaving(true);
      const slug = generateSlug(proposalData.title);
      
      const payload = {
        user_id: user.id,
        ...proposalData,
        status,
        slug,
        private_token: crypto.randomUUID(),
        valid_until: proposalData.valid_until || null,
      };

      if (editingProposal) {
        const { error } = await supabase
          .from('commercial_proposals')
          .update(payload)
          .eq('id', editingProposal);
        if (error) throw error;
        toast.success('Proposta atualizada!');
      } else {
        const { data, error } = await supabase
          .from('commercial_proposals')
          .insert([payload])
          .select()
          .single();
        if (error) throw error;
        
        if (status === 'sent') {
          setGeneratedLink(`${window.location.origin}/proposta/${data.slug}`);
          setShowLinkDialog(true);
        }
        toast.success(status === 'sent' ? 'Proposta enviada!' : 'Proposta salva como rascunho!');
      }

      setProposalData(initialProposalData);
      setCurrentStep(0);
      setEditingProposal(null);
      fetchProposals();
      if (status === 'draft') {
        setActiveTab('history');
      }
    } catch (error: any) {
      toast.error('Erro ao salvar proposta');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleFinish = () => {
    saveProposal('sent');
  };

  const copyLink = (slug: string) => {
    const link = `${window.location.origin}/proposta/${slug}`;
    navigator.clipboard.writeText(link);
    toast.success('Link copiado!');
  };

  const handleDelete = async () => {
    if (!deleteProposal) return;
    try {
      const { error } = await supabase
        .from('commercial_proposals')
        .delete()
        .eq('id', deleteProposal.id);
      if (error) throw error;
      toast.success('Proposta excluída');
      fetchProposals();
    } catch (error) {
      toast.error('Erro ao excluir');
    } finally {
      setDeleteProposal(null);
    }
  };

  const loadProposalForEdit = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('commercial_proposals')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      
      setProposalData({
        company_name: data.company_name || '',
        company_logo_url: data.company_logo_url || '',
        company_email: data.company_email || '',
        company_phone: data.company_phone || '',
        company_address: data.company_address || '',
        company_cnpj: data.company_cnpj || '',
        client_name: data.client_name || '',
        client_email: data.client_email || '',
        client_phone: data.client_phone || '',
        client_company: data.client_company || '',
        client_cnpj: data.client_cnpj || '',
        client_address: data.client_address || '',
        title: data.title || '',
        introduction: data.introduction || '',
        introduction_image_url: data.introduction_image_url || '',
        introduction_images: (data as any).introduction_images || [],
        services: (data.services || []) as any[],
        timeline: (data.timeline || []) as any[],
        pricing: (data.pricing || { items: [], discount: 0, total: 0 }) as any,
        conditions: data.conditions || '',
        valid_until: data.valid_until || '',
        primary_color: data.primary_color || '#6366f1',
        auto_carousel: (data as any).auto_carousel ?? false,
      });
      setEditingProposal(id);
      setCurrentStep(0);
      setActiveTab('create');
    } catch (error) {
      toast.error('Erro ao carregar proposta');
    }
  };

  const duplicateProposal = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('commercial_proposals')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      
      setProposalData({
        company_name: data.company_name || '',
        company_logo_url: data.company_logo_url || '',
        company_email: data.company_email || '',
        company_phone: data.company_phone || '',
        company_address: data.company_address || '',
        company_cnpj: data.company_cnpj || '',
        client_name: data.client_name || '',
        client_email: data.client_email || '',
        client_phone: data.client_phone || '',
        client_company: data.client_company || '',
        client_cnpj: data.client_cnpj || '',
        client_address: data.client_address || '',
        title: `${data.title} (Cópia)`,
        introduction: data.introduction || '',
        introduction_image_url: data.introduction_image_url || '',
        introduction_images: (data as any).introduction_images || [],
        services: (data.services || []) as any[],
        timeline: (data.timeline || []) as any[],
        pricing: (data.pricing || { items: [], discount: 0, total: 0 }) as any,
        conditions: data.conditions || '',
        valid_until: '',
        primary_color: data.primary_color || '#6366f1',
        auto_carousel: (data as any).auto_carousel ?? false,
      });
      setEditingProposal(null); // Not editing, creating new
      setCurrentStep(0);
      setActiveTab('create');
      toast.success('Proposta duplicada! Faça as alterações e salve.');
    } catch (error) {
      toast.error('Erro ao duplicar proposta');
    }
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ReactNode }> = {
      draft: { label: 'Rascunho', variant: 'secondary', icon: <FileText className="h-3 w-3" /> },
      sent: { label: 'Enviada', variant: 'default', icon: <Send className="h-3 w-3" /> },
      viewed: { label: 'Visualizada', variant: 'outline', icon: <Eye className="h-3 w-3" /> },
      accepted: { label: 'Aceita', variant: 'default', icon: <CheckCircle className="h-3 w-3" /> },
      rejected: { label: 'Recusada', variant: 'destructive', icon: <XCircle className="h-3 w-3" /> },
      expired: { label: 'Expirada', variant: 'secondary', icon: <Clock className="h-3 w-3" /> },
    };
    const c = config[status] || config.draft;
    return (
      <Badge variant={c.variant} className="gap-1">
        {c.icon} {c.label}
      </Badge>
    );
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const filteredProposals = statusFilter === 'all' 
    ? proposals 
    : proposals.filter(p => p.status === statusFilter);

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return <CompanyDataStep data={proposalData} onChange={updateProposalData} />;
      case 1:
        return <ClientDataStep data={proposalData} onChange={updateProposalData} />;
      case 2:
        return <IntroductionStep title={proposalData.title} introduction={proposalData.introduction} introductionImageUrl={proposalData.introduction_image_url} introductionImages={proposalData.introduction_images} onChange={updateProposalData} />;
      case 3:
        return <ServicesStep services={proposalData.services} autoCarousel={proposalData.auto_carousel} onChange={(services, autoCarousel) => updateProposalData({ services, auto_carousel: autoCarousel })} />;
      case 4:
        return <TimelineStep timeline={proposalData.timeline} onChange={(timeline) => updateProposalData({ timeline })} />;
      case 5:
        return <PricingStep pricing={proposalData.pricing} onChange={(pricing) => updateProposalData({ pricing })} />;
      case 6:
        return <ConditionsStep conditions={proposalData.conditions} validUntil={proposalData.valid_until} primaryColor={proposalData.primary_color} onChange={updateProposalData} />;
      case 7:
        return <SummaryStep data={proposalData} />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            Criador de Propostas
          </h1>
          <p className="text-muted-foreground">Crie e gerencie propostas comerciais profissionais</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="create" className="gap-2">
            <Plus className="h-4 w-4" />
            {editingProposal ? 'Editar Proposta' : 'Nova Proposta'}
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <History className="h-4 w-4" />
            Histórico
          </TabsTrigger>
        </TabsList>

        <TabsContent value="create" className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              {renderStepContent()}
              
              <div className="mt-6 pt-6 border-t">
                <ProposalWizard
                  currentStep={currentStep}
                  totalSteps={STEPS.length}
                  onNext={handleNext}
                  onPrev={handlePrev}
                  onFinish={handleFinish}
                  canProceed={canProceed()}
                  isLastStep={currentStep === STEPS.length - 1}
                  steps={STEPS}
                />
              </div>
              
              {currentStep === STEPS.length - 1 && (
                <div className="flex justify-center gap-3 mt-4">
                  <Button variant="outline" onClick={() => saveProposal('draft')} disabled={saving}>
                    Salvar como Rascunho
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Propostas ({filteredProposals.length})
                </CardTitle>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filtrar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="draft">Rascunhos</SelectItem>
                    <SelectItem value="sent">Enviadas</SelectItem>
                    <SelectItem value="viewed">Visualizadas</SelectItem>
                    <SelectItem value="accepted">Aceitas</SelectItem>
                    <SelectItem value="rejected">Recusadas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-center py-8 text-muted-foreground">Carregando...</p>
              ) : filteredProposals.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">Nenhuma proposta encontrada</p>
              ) : (
                <div className="space-y-3">
                  {filteredProposals.map(proposal => (
                    <Card key={proposal.id} className="hover:bg-muted/50 transition-colors">
                      <CardContent className="p-4">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                          <div className="flex-1">
                            <h3 className="font-medium">{proposal.title}</h3>
                            <p className="text-sm text-muted-foreground">
                              {proposal.client_name} {proposal.client_company && `- ${proposal.client_company}`}
                            </p>
                            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                              <span>{format(new Date(proposal.created_at), "dd 'de' MMM, yyyy", { locale: ptBR })}</span>
                              {proposal.valid_until && (
                                <>
                                  <span>•</span>
                                  <span>Válida até {format(new Date(proposal.valid_until), 'dd/MM/yyyy')}</span>
                                </>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <span className="font-semibold text-primary">
                              {formatCurrency(proposal.pricing?.total || 0)}
                            </span>
                            {getStatusBadge(proposal.status)}
                          </div>
                          
                          <div className="flex items-center gap-1">
                            {proposal.slug && (
                              <>
                                <Button variant="ghost" size="icon" onClick={() => copyLink(proposal.slug!)}>
                                  <Copy className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" asChild>
                                  <a href={`/proposta/${proposal.slug}`} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="h-4 w-4" />
                                  </a>
                                </Button>
                              </>
                            )}
                            <Button variant="ghost" size="icon" onClick={() => duplicateProposal(proposal.id)} title="Duplicar proposta">
                              <Files className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => loadProposalForEdit(proposal.id)} title="Editar proposta">
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeleteProposal(proposal)} title="Excluir proposta">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Link Dialog */}
      <Dialog open={showLinkDialog} onOpenChange={setShowLinkDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Proposta Criada com Sucesso!</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-muted-foreground">Compartilhe o link abaixo com seu cliente:</p>
            <div className="flex gap-2">
              <input
                readOnly
                value={generatedLink}
                className="flex-1 px-3 py-2 text-sm border rounded-md bg-muted"
              />
              <Button onClick={() => { navigator.clipboard.writeText(generatedLink); toast.success('Link copiado!'); }}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLinkDialog(false)}>Fechar</Button>
            <Button asChild>
              <a href={generatedLink} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                Visualizar
              </a>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <DeleteConfirmDialog
        open={!!deleteProposal}
        onOpenChange={() => setDeleteProposal(null)}
        onConfirm={handleDelete}
        title="Excluir Proposta"
        description={`Deseja excluir a proposta "${deleteProposal?.title}"? Esta ação não pode ser desfeita.`}
      />
    </div>
  );
}
