import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Mail, Shield, Eye, Edit, Trash2, Plus, Save, 
  Users, Calendar, DollarSign, CheckSquare, BarChart3,
  Settings, Briefcase, FileText, Image, MessageSquare,
  Globe, Link, Megaphone, Palette, Send, RefreshCw, Clock, CheckCircle, XCircle, Loader2
} from 'lucide-react';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  status: string;
  role: string;
  department: string;
  user_id?: string;
  linked_user_id?: string;
}

interface Invitation {
  id: string;
  invited_email: string;
  status: string;
  created_at: string;
  expires_at: string;
}

interface Permission {
  module_key: string;
  action: 'create' | 'read' | 'update' | 'delete';
  is_allowed: boolean;
  restrictions: Record<string, any>;
}

// Define available modules with their features
const MODULES = [
  { 
    key: 'agenda', 
    label: 'Agenda', 
    icon: Calendar,
    description: 'Calendário e eventos'
  },
  { 
    key: 'financial', 
    label: 'Financeiro', 
    icon: DollarSign,
    description: 'Gestão financeira',
    hasResourceSelection: true,
    resourceType: 'financial_businesses',
    resourceLabel: 'empresas/contas'
  },
  { 
    key: 'tasks', 
    label: 'Tarefas', 
    icon: CheckSquare,
    description: 'Organizador de tarefas'
  },
  { 
    key: 'crm', 
    label: 'CRM / Contatos', 
    icon: Users,
    description: 'Gestão de contatos e leads'
  },
  { 
    key: 'ai_agents', 
    label: 'Chat Online', 
    icon: Briefcase,
    description: 'Chats de atendimento online',
    hasResourceSelection: true,
    resourceType: 'ai_agents',
    resourceLabel: 'chatbots'
  },
  { 
    key: 'chatbots', 
    label: 'Chatbots Fluxo', 
    icon: MessageSquare,
    description: 'Chatbots com fluxo de conversa',
    hasResourceSelection: true,
    resourceType: 'chatbots',
    resourceLabel: 'chatbots de fluxo'
  },
  { 
    key: 'reports', 
    label: 'Relatórios', 
    icon: BarChart3,
    description: 'Relatórios e análises'
  },
  { 
    key: 'link_bio', 
    label: 'Link na Bio', 
    icon: Link,
    description: 'Páginas de links',
    hasResourceSelection: true,
    resourceType: 'link_bios',
    resourceLabel: 'páginas de link'
  },
  { 
    key: 'briefings', 
    label: 'Briefings', 
    icon: FileText,
    description: 'Formulários de briefing',
    hasResourceSelection: true,
    resourceType: 'briefings',
    resourceLabel: 'briefings'
  },
  { 
    key: 'portfolio', 
    label: 'Portfólio', 
    icon: Image,
    description: 'Portfólio de trabalhos',
    hasResourceSelection: true,
    resourceType: 'portfolios',
    resourceLabel: 'portfólios'
  },
  { 
    key: 'websites', 
    label: 'Sites', 
    icon: Globe,
    description: 'Criador de sites',
    hasResourceSelection: true,
    resourceType: 'websites',
    resourceLabel: 'sites'
  },
  { 
    key: 'ads', 
    label: 'Campanhas/Anúncios', 
    icon: Megaphone,
    description: 'Gestão de campanhas',
    hasResourceSelection: true,
    resourceType: 'ad_campaigns',
    resourceLabel: 'campanhas'
  },
  { 
    key: 'cloner', 
    label: 'Clonador de Páginas', 
    icon: Palette,
    description: 'Clonador de páginas web',
    hasResourceSelection: true,
    resourceType: 'cloned_pages',
    resourceLabel: 'páginas clonadas'
  },
  { 
    key: 'settings', 
    label: 'Configurações', 
    icon: Settings,
    description: 'Configurações da conta'
  }
];

const ACTIONS = [
  { key: 'create' as const, label: 'Criar', icon: Plus },
  { key: 'read' as const, label: 'Visualizar', icon: Eye },
  { key: 'update' as const, label: 'Editar', icon: Edit },
  { key: 'delete' as const, label: 'Excluir', icon: Trash2 }
];

interface TeamDelegationPanelProps {
  member: TeamMember;
  onClose: () => void;
}

interface Resource {
  id: string;
  name: string;
}

export function TeamDelegationPanel({ member, onClose }: TeamDelegationPanelProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('invitation');
  
  // Invitation state
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [sendingInvite, setSendingInvite] = useState(false);
  
  // Permissions state
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [originalPermissions, setOriginalPermissions] = useState<Permission[]>([]);
  
  // Resources state for selection
  const [availableResources, setAvailableResources] = useState<Record<string, Resource[]>>({});
  const [selectedResources, setSelectedResources] = useState<Record<string, string[]>>({});

  useEffect(() => {
    loadInvitation();
    loadPermissions();
    loadAvailableResources();
  }, [member.id]);

  const loadInvitation = async () => {
    // Check for existing invitation
    const { data, error } = await supabase
      .from('team_invitations')
      .select('*')
      .eq('invited_email', member.email)
      .order('created_at', { ascending: false })
      .limit(1);

    if (!error && data && data.length > 0) {
      setInvitation(data[0]);
    }
  };

  const loadAvailableResources = async () => {
    if (!user) return;
    
    const resources: Record<string, Resource[]> = {};
    
    // Load AI Agents (Chat Online)
    const { data: agents } = await supabase
      .from('ai_agents')
      .select('id, name')
      .eq('user_id', user.id);
    if (agents) resources.ai_agents = agents as Resource[];
    
    // Load Chatbots (Flow-based)
    const { data: chatbots } = await supabase
      .from('chatbots')
      .select('id, name')
      .eq('user_id', user.id);
    if (chatbots) resources.chatbots = chatbots as Resource[];
    
    // Load Financial Businesses
    const { data: businesses } = await supabase
      .from('financial_businesses')
      .select('id, name')
      .eq('user_id', user.id);
    if (businesses) resources.financial_businesses = businesses as Resource[];
    
    // Load Link Bios
    const { data: linkBios } = await supabase
      .from('link_bios')
      .select('id, display_name, username')
      .eq('user_id', user.id);
    if (linkBios) {
      resources.link_bios = linkBios.map(lb => ({
        id: lb.id,
        name: lb.display_name || lb.username || 'Sem nome'
      }));
    }
    
    // Load Briefings
    const { data: briefings } = await supabase
      .from('briefings')
      .select('id, title')
      .eq('user_id', user.id);
    if (briefings) {
      resources.briefings = briefings.map(b => ({
        id: b.id,
        name: b.title
      }));
    }
    
    // Load Portfolios
    const { data: portfolios } = await supabase
      .from('portfolios')
      .select('id, name')
      .eq('user_id', user.id);
    if (portfolios) resources.portfolios = portfolios as Resource[];
    
    // Load Websites
    const { data: websites } = await supabase
      .from('websites')
      .select('id, title')
      .eq('user_id', user.id);
    if (websites) {
      resources.websites = websites.map(w => ({
        id: w.id,
        name: w.title
      }));
    }
    
    // Load Ad Campaigns
    const { data: campaigns } = await supabase
      .from('ad_campaigns')
      .select('id, name')
      .eq('user_id', user.id);
    if (campaigns) resources.ad_campaigns = campaigns as Resource[];
    
    // Load Cloned Pages
    const { data: clonedPages } = await supabase
      .from('cloned_pages')
      .select('id, slug, original_url')
      .eq('user_id', user.id);
    if (clonedPages) {
      resources.cloned_pages = clonedPages.map(cp => ({
        id: cp.id,
        name: cp.slug || cp.original_url?.substring(0, 50) || 'Sem nome'
      }));
    }
    
    setAvailableResources(resources);
  };

  const loadPermissions = async () => {
    const { data, error } = await supabase
      .from('team_member_permissions')
      .select('module_key, action, is_allowed, restrictions')
      .eq('team_member_id', member.id);

    if (!error && data) {
      const perms = data.map(p => ({
        module_key: p.module_key,
        action: p.action as 'create' | 'read' | 'update' | 'delete',
        is_allowed: p.is_allowed,
        restrictions: (p.restrictions as Record<string, any>) || {}
      }));
      setPermissions(perms);
      
      // Extract selected resources from restrictions
      const resources: Record<string, string[]> = {};
      perms.forEach(p => {
        if (p.restrictions?.allowed_ids) {
          resources[p.module_key] = p.restrictions.allowed_ids;
        }
      });
      setSelectedResources(resources);
      setOriginalPermissions(perms);
    }
  };

  const handleSendInvitation = async () => {
    if (!user) return;

    setSendingInvite(true);
    try {
      const { data, error } = await supabase.functions.invoke('team-member-auth', {
        body: {
          action: 'send_invitation',
          adminUserId: user.id,
          teamMemberId: member.id,
          invitedEmail: member.email
        }
      });

      if (error || !data?.success) {
        throw new Error(data?.error || 'Erro ao enviar convite');
      }

      toast({
        title: 'Convite enviado! ✅',
        description: `Um email de convite foi enviado para ${member.email}`
      });

      loadInvitation();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao enviar convite',
        variant: 'destructive'
      });
    } finally {
      setSendingInvite(false);
    }
  };

  const handleResendInvitation = async () => {
    if (!invitation) return;

    setSendingInvite(true);
    try {
      const { data, error } = await supabase.functions.invoke('team-member-auth', {
        body: {
          action: 'resend_invitation',
          invitationId: invitation.id
        }
      });

      if (error || !data?.success) {
        throw new Error(data?.error || 'Erro ao reenviar convite');
      }

      toast({
        title: 'Convite reenviado! ✅',
        description: `Um novo email de convite foi enviado para ${member.email}`
      });

      loadInvitation();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao reenviar convite',
        variant: 'destructive'
      });
    } finally {
      setSendingInvite(false);
    }
  };

  const handleCancelInvitation = async () => {
    if (!invitation) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('team-member-auth', {
        body: {
          action: 'cancel_invitation',
          invitationId: invitation.id
        }
      });

      if (error || !data?.success) {
        throw new Error(data?.error || 'Erro ao cancelar convite');
      }

      toast({
        title: 'Convite cancelado',
        description: 'O convite foi cancelado com sucesso'
      });

      setInvitation(null);
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao cancelar convite',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const togglePermission = (moduleKey: string, action: 'create' | 'read' | 'update' | 'delete') => {
    setPermissions(prev => {
      const existing = prev.find(p => p.module_key === moduleKey && p.action === action);
      
      if (existing) {
        return prev.filter(p => !(p.module_key === moduleKey && p.action === action));
      } else {
        const restrictions: Record<string, any> = {};
        if (selectedResources[moduleKey]?.length > 0) {
          restrictions.allowed_ids = selectedResources[moduleKey];
        }
        return [...prev, { module_key: moduleKey, action, is_allowed: true, restrictions }];
      }
    });
  };

  const toggleModuleAllPermissions = (moduleKey: string, enable: boolean) => {
    setPermissions(prev => {
      const otherPerms = prev.filter(p => p.module_key !== moduleKey);
      
      if (enable) {
        const restrictions: Record<string, any> = {};
        if (selectedResources[moduleKey]?.length > 0) {
          restrictions.allowed_ids = selectedResources[moduleKey];
        }
        const newPerms = ACTIONS.map(a => ({
          module_key: moduleKey,
          action: a.key,
          is_allowed: true,
          restrictions
        }));
        return [...otherPerms, ...newPerms];
      } else {
        return otherPerms;
      }
    });
  };

  const toggleResourceSelection = (moduleKey: string, resourceId: string) => {
    setSelectedResources(prev => {
      const current = prev[moduleKey] || [];
      const updated = current.includes(resourceId)
        ? current.filter(id => id !== resourceId)
        : [...current, resourceId];
      
      setPermissions(prevPerms => 
        prevPerms.map(p => {
          if (p.module_key === moduleKey) {
            return {
              ...p,
              restrictions: updated.length > 0 ? { allowed_ids: updated } : {}
            };
          }
          return p;
        })
      );
      
      return { ...prev, [moduleKey]: updated };
    });
  };

  const hasPermission = (moduleKey: string, action: 'create' | 'read' | 'update' | 'delete'): boolean => {
    return permissions.some(p => p.module_key === moduleKey && p.action === action && p.is_allowed);
  };

  const hasAnyPermission = (moduleKey: string): boolean => {
    return permissions.some(p => p.module_key === moduleKey && p.is_allowed);
  };

  const hasAllPermissions = (moduleKey: string): boolean => {
    return ACTIONS.every(a => hasPermission(moduleKey, a.key));
  };

  const getResourcesForModule = (module: typeof MODULES[0]): Resource[] => {
    if (!module.hasResourceSelection || !module.resourceType) return [];
    return availableResources[module.resourceType] || [];
  };

  const handleSavePermissions = async () => {
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('team-member-auth', {
        body: {
          action: 'update_permissions',
          teamMemberId: member.id,
          permissions: permissions.filter(p => p.is_allowed)
        }
      });

      if (error || !data?.success) {
        throw new Error(data?.error || 'Erro ao salvar permissões');
      }

      toast({
        title: 'Sucesso',
        description: 'Permissões atualizadas com sucesso!'
      });

      setOriginalPermissions(permissions);
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao salvar permissões.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const hasUnsavedPermissions = JSON.stringify(permissions) !== JSON.stringify(originalPermissions);

  const getInvitationStatusBadge = () => {
    if (!invitation) return null;
    
    switch (invitation.status) {
      case 'pending':
        return <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" /> Pendente</Badge>;
      case 'accepted':
        return <Badge variant="default" className="gap-1 bg-green-600"><CheckCircle className="h-3 w-3" /> Aceito</Badge>;
      case 'expired':
        return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" /> Expirado</Badge>;
      default:
        return null;
    }
  };

  const isLinked = !!member.linked_user_id;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">{member.name}</h3>
          <p className="text-sm text-muted-foreground">{member.email}</p>
        </div>
        <div className="flex items-center gap-2">
          {isLinked ? (
            <Badge variant="default" className="gap-1 bg-green-600">
              <CheckCircle className="h-3 w-3" /> Vinculado
            </Badge>
          ) : (
            <Badge variant="secondary">Não vinculado</Badge>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="invitation" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Convite
          </TabsTrigger>
          <TabsTrigger value="permissions" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Permissões
          </TabsTrigger>
        </TabsList>

        <TabsContent value="invitation" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Convite por Email</CardTitle>
              <CardDescription>
                Envie um convite para o membro da equipe aceitar e vincular sua conta
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLinked ? (
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                    <CheckCircle className="h-5 w-5" />
                    <span className="font-medium">Conta vinculada com sucesso!</span>
                  </div>
                  <p className="text-sm text-green-600 dark:text-green-500 mt-1">
                    Este membro já aceitou o convite e pode acessar o sistema.
                  </p>
                </div>
              ) : invitation ? (
                <div className="space-y-4">
                  <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Status do Convite</span>
                      {getInvitationStatusBadge()}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <p>Enviado em: {new Date(invitation.created_at).toLocaleString('pt-BR')}</p>
                      <p>Expira em: {new Date(invitation.expires_at).toLocaleString('pt-BR')}</p>
                    </div>
                  </div>

                  {invitation.status === 'pending' && (
                    <div className="flex gap-2">
                      <Button 
                        onClick={handleResendInvitation}
                        disabled={sendingInvite}
                        variant="outline"
                        className="flex-1"
                      >
                        {sendingInvite ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <RefreshCw className="h-4 w-4 mr-2" />
                        )}
                        Reenviar Convite
                      </Button>
                      <Button 
                        onClick={handleCancelInvitation}
                        disabled={loading}
                        variant="destructive"
                      >
                        Cancelar
                      </Button>
                    </div>
                  )}

                  {invitation.status === 'expired' && (
                    <Button 
                      onClick={handleSendInvitation}
                      disabled={sendingInvite}
                      className="w-full"
                    >
                      {sendingInvite ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4 mr-2" />
                      )}
                      Enviar Novo Convite
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      Ao enviar o convite, o membro receberá um email com um link para aceitar.
                      Após aceitar, ele poderá acessar o sistema com a conta dele e ver apenas o que você liberar.
                    </p>
                  </div>

                  <Button 
                    onClick={handleSendInvitation}
                    disabled={sendingInvite}
                    className="w-full"
                  >
                    {sendingInvite ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4 mr-2" />
                    )}
                    Enviar Convite para {member.email}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="permissions" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Módulos e Permissões
              </CardTitle>
              <CardDescription>
                Defina quais módulos e ações o membro pode acessar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px] pr-4">
                <Accordion type="multiple" className="space-y-2">
                  {MODULES.map((module) => {
                    const ModuleIcon = module.icon;
                    const moduleResources = getResourcesForModule(module);
                    
                    return (
                      <AccordionItem 
                        key={module.key} 
                        value={module.key}
                        className="border rounded-lg px-3"
                      >
                        <AccordionTrigger className="hover:no-underline py-3">
                          <div className="flex items-center justify-between w-full pr-2">
                            <div className="flex items-center gap-3">
                              <ModuleIcon className="h-4 w-4 text-muted-foreground" />
                              <div className="text-left">
                                <p className="font-medium text-sm">{module.label}</p>
                                <p className="text-xs text-muted-foreground">{module.description}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                              <Switch
                                checked={hasAnyPermission(module.key)}
                                onCheckedChange={(checked) => toggleModuleAllPermissions(module.key, checked)}
                              />
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="pb-3">
                          <div className="space-y-4 pt-2">
                            {/* Actions */}
                            <div className="grid grid-cols-2 gap-2">
                              {ACTIONS.map((action) => {
                                const ActionIcon = action.icon;
                                const isActive = hasPermission(module.key, action.key);
                                
                                return (
                                  <Button
                                    key={action.key}
                                    variant={isActive ? "default" : "outline"}
                                    size="sm"
                                    className="justify-start gap-2"
                                    onClick={() => togglePermission(module.key, action.key)}
                                  >
                                    <ActionIcon className="h-3 w-3" />
                                    {action.label}
                                  </Button>
                                );
                              })}
                            </div>

                            {/* Resource Selection */}
                            {module.hasResourceSelection && moduleResources.length > 0 && (
                              <div className="space-y-2 pt-2 border-t">
                                <Label className="text-xs text-muted-foreground">
                                  Selecione quais {module.resourceLabel || module.label.toLowerCase()} o membro pode acessar:
                                </Label>
                                <div className="space-y-1 max-h-40 overflow-y-auto">
                                  {moduleResources.map((resource) => {
                                    const isSelected = selectedResources[module.key]?.includes(resource.id);
                                    return (
                                      <div 
                                        key={resource.id}
                                        className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${
                                          isSelected 
                                            ? 'bg-primary/10 border border-primary/30' 
                                            : 'hover:bg-muted/50 border border-transparent'
                                        }`}
                                        onClick={() => toggleResourceSelection(module.key, resource.id)}
                                      >
                                        <Switch checked={isSelected} />
                                        <span className="text-sm truncate">{resource.name}</span>
                                      </div>
                                    );
                                  })}
                                </div>
                                <div className="flex items-center gap-2 pt-1">
                                  <Badge variant={selectedResources[module.key]?.length > 0 ? "default" : "secondary"} className="text-xs">
                                    {selectedResources[module.key]?.length || 0} de {moduleResources.length} selecionados
                                  </Badge>
                                  {selectedResources[module.key]?.length === 0 && (
                                    <span className="text-xs text-amber-600 dark:text-amber-400">
                                      = acesso a todos
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Empty resource message */}
                            {module.hasResourceSelection && moduleResources.length === 0 && (
                              <div className="pt-2 border-t">
                                <p className="text-xs text-muted-foreground italic">
                                  Nenhum(a) {module.resourceLabel || module.label.toLowerCase()} cadastrado(a)
                                </p>
                              </div>
                            )}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    );
                  })}
                </Accordion>
              </ScrollArea>

              {hasUnsavedPermissions && (
                <div className="mt-4 pt-4 border-t">
                  <Button 
                    onClick={handleSavePermissions}
                    disabled={loading}
                    className="w-full"
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Salvar Permissões
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
