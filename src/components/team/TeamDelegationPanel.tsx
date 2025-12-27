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
  Key, Shield, Eye, Edit, Trash2, Plus, Save, 
  Users, Calendar, DollarSign, CheckSquare, BarChart3,
  MessageSquare, Settings, Briefcase, FileText, Image,
  Globe, Link, Megaphone, Palette
} from 'lucide-react';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  status: string;
  role: string;
  department: string;
}

interface Credential {
  id: string;
  username: string;
  is_active: boolean;
  last_login_at: string | null;
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
    resourceType: 'financial_businesses'
  },
  { 
    key: 'tasks', 
    label: 'Tarefas', 
    icon: CheckSquare,
    description: 'Organizador de tarefas',
    hasResourceSelection: true,
    resourceType: 'task_lists'
  },
  { 
    key: 'crm', 
    label: 'CRM / Contatos', 
    icon: Users,
    description: 'Gestão de contatos e leads'
  },
  { 
    key: 'chatbots', 
    label: 'Chatbots', 
    icon: MessageSquare,
    description: 'Gerenciamento de chatbots',
    hasResourceSelection: true,
    resourceType: 'chatbots'
  },
  { 
    key: 'ai_agents', 
    label: 'Chat Online', 
    icon: Briefcase,
    description: 'Chats de atendimento online',
    hasResourceSelection: true,
    resourceType: 'ai_agents'
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
    description: 'Páginas de links'
  },
  { 
    key: 'briefings', 
    label: 'Briefings', 
    icon: FileText,
    description: 'Formulários de briefing'
  },
  { 
    key: 'portfolio', 
    label: 'Portfólio', 
    icon: Image,
    description: 'Portfólio de trabalhos'
  },
  { 
    key: 'websites', 
    label: 'Sites', 
    icon: Globe,
    description: 'Criador de sites'
  },
  { 
    key: 'ads', 
    label: 'Campanhas/Anúncios', 
    icon: Megaphone,
    description: 'Gestão de campanhas'
  },
  { 
    key: 'cloner', 
    label: 'Clonador de Páginas', 
    icon: Palette,
    description: 'Clonador de páginas web'
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
  const [activeTab, setActiveTab] = useState('credentials');
  
  // Credentials state
  const [credential, setCredential] = useState<Credential | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Permissions state
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [originalPermissions, setOriginalPermissions] = useState<Permission[]>([]);
  
  // Resources state for selection
  const [availableResources, setAvailableResources] = useState<Record<string, Resource[]>>({});
  const [selectedResources, setSelectedResources] = useState<Record<string, string[]>>({});

  useEffect(() => {
    loadCredentials();
    loadPermissions();
    loadAvailableResources();
  }, [member.id]);

  const loadAvailableResources = async () => {
    if (!user) return;
    
    const resources: Record<string, Resource[]> = {};
    
    // Load AI Agents (Chat Online)
    const { data: agents } = await supabase
      .from('ai_agents')
      .select('id, name')
      .eq('user_id', user.id);
    if (agents) resources.ai_agents = agents;
    
    // Load Chatbots
    const { data: chatbots } = await supabase
      .from('chatbots')
      .select('id, name')
      .eq('user_id', user.id);
    if (chatbots) resources.chatbots = chatbots;
    
    // Load Financial Businesses
    const { data: businesses } = await supabase
      .from('financial_businesses')
      .select('id, name')
      .eq('user_id', user.id);
    if (businesses) resources.financial_businesses = businesses;
    
    // Load Task Categories/Lists (using task_categories or similar)
    // For now, using placeholder since we need to check the actual table
    
    setAvailableResources(resources);
  };

  const loadCredentials = async () => {
    const { data, error } = await supabase
      .from('team_member_credentials')
      .select('id, username, is_active, last_login_at')
      .eq('team_member_id', member.id)
      .single();

    if (!error && data) {
      setCredential(data);
      setUsername(data.username);
    }
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

  const handleSaveCredentials = async () => {
    if (!username.trim()) {
      toast({
        title: "Erro",
        description: "O nome de usuário é obrigatório.",
        variant: "destructive"
      });
      return;
    }

    if (!credential && (!password || password.length < 6)) {
      toast({
        title: "Erro",
        description: "A senha deve ter pelo menos 6 caracteres.",
        variant: "destructive"
      });
      return;
    }

    if (password && password !== confirmPassword) {
      toast({
        title: "Erro",
        description: "As senhas não coincidem.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      const { data: session } = await supabase.auth.getSession();
      
      const { data, error } = await supabase.functions.invoke('team-member-auth', {
        body: {
          action: 'create_credentials',
          teamMemberId: member.id,
          username: username.trim().toLowerCase(),
          password: password || undefined
        },
        headers: {
          Authorization: `Bearer ${session?.session?.access_token}`
        }
      });

      if (error || !data?.success) {
        throw new Error(data?.error || 'Erro ao salvar credenciais');
      }

      toast({
        title: credential ? "Credenciais atualizadas" : "Usuário criado com sucesso! ✅",
        description: credential 
          ? "As credenciais foram atualizadas com sucesso!"
          : `O membro ${member.name} agora pode acessar o sistema com o usuário "${username.trim().toLowerCase()}".`
      });

      loadCredentials();
      setPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao salvar credenciais.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const togglePermission = (moduleKey: string, action: 'create' | 'read' | 'update' | 'delete') => {
    setPermissions(prev => {
      const existing = prev.find(p => p.module_key === moduleKey && p.action === action);
      
      if (existing) {
        // Remove permission
        return prev.filter(p => !(p.module_key === moduleKey && p.action === action));
      } else {
        // Add permission with resource restrictions if any selected
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
      
      // Also update permissions restrictions
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
      const { data: session } = await supabase.auth.getSession();
      
      const { data, error } = await supabase.functions.invoke('team-member-auth', {
        body: {
          action: 'update_permissions',
          teamMemberId: member.id,
          permissions: permissions.filter(p => p.is_allowed)
        },
        headers: {
          Authorization: `Bearer ${session?.session?.access_token}`
        }
      });

      if (error || !data?.success) {
        throw new Error(data?.error || 'Erro ao salvar permissões');
      }

      toast({
        title: "Sucesso",
        description: "Permissões atualizadas com sucesso!"
      });

      setOriginalPermissions(permissions);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao salvar permissões.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const hasUnsavedPermissions = JSON.stringify(permissions) !== JSON.stringify(originalPermissions);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">{member.name}</h3>
          <p className="text-sm text-muted-foreground">{member.email}</p>
        </div>
        <Badge variant={member.status === 'active' ? 'default' : 'secondary'}>
          {member.status === 'active' ? 'Ativo' : member.status === 'inactive' ? 'Inativo' : 'Afastado'}
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="credentials" className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            Credenciais
          </TabsTrigger>
          <TabsTrigger value="permissions" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Permissões
          </TabsTrigger>
        </TabsList>

        <TabsContent value="credentials" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Dados de Acesso</CardTitle>
              <CardDescription>
                Defina o usuário e senha que o membro usará para acessar o sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {credential && (
                <div className="p-3 bg-muted/50 rounded-lg text-sm">
                  <p className="text-muted-foreground">
                    Último acesso: {credential.last_login_at 
                      ? new Date(credential.last_login_at).toLocaleString('pt-BR')
                      : 'Nunca'}
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="username">Nome de Usuário</Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="ex: joao.silva"
                />
                <p className="text-xs text-muted-foreground">
                  O usuário será convertido para minúsculas automaticamente
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">
                  {credential ? 'Nova Senha (deixe em branco para manter a atual)' : 'Senha'}
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={credential ? '••••••••' : 'Mínimo 6 caracteres'}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Digite a senha novamente"
                />
              </div>

              <Button 
                onClick={handleSaveCredentials} 
                disabled={loading}
                className="w-full"
              >
                <Save className="h-4 w-4 mr-2" />
                {credential ? 'Atualizar Credenciais' : 'Criar Credenciais'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="permissions" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Permissões por Módulo</CardTitle>
              <CardDescription>
                Defina quais recursos o membro pode acessar e quais ações pode realizar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px] pr-4">
                <Accordion type="multiple" className="space-y-2">
                  {MODULES.map((module) => {
                    const Icon = module.icon;
                    const hasAll = hasAllPermissions(module.key);
                    const hasAny = hasAnyPermission(module.key);

                    return (
                      <AccordionItem 
                        key={module.key} 
                        value={module.key}
                        className="border rounded-lg px-4"
                      >
                        <AccordionTrigger className="hover:no-underline py-3">
                          <div className="flex items-center justify-between w-full pr-4">
                            <div className="flex items-center gap-3">
                              <Icon className="h-5 w-5 text-muted-foreground" />
                              <div className="text-left">
                                <p className="font-medium">{module.label}</p>
                                <p className="text-xs text-muted-foreground">{module.description}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                              <Switch
                                checked={hasAny}
                                onCheckedChange={(checked) => toggleModuleAllPermissions(module.key, checked)}
                              />
                              <Badge variant={hasAll ? 'default' : hasAny ? 'secondary' : 'outline'} className="text-xs">
                                {hasAll ? 'Completo' : hasAny ? 'Parcial' : 'Bloqueado'}
                              </Badge>
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="pb-4 space-y-4">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                            {ACTIONS.map((action) => {
                              const ActionIcon = action.icon;
                              const isEnabled = hasPermission(module.key, action.key);

                              return (
                                <button
                                  key={action.key}
                                  onClick={() => togglePermission(module.key, action.key)}
                                  className={`
                                    flex items-center gap-2 p-2 rounded-lg border transition-colors
                                    ${isEnabled 
                                      ? 'bg-primary/10 border-primary text-primary' 
                                      : 'bg-muted/30 border-border text-muted-foreground hover:bg-muted/50'
                                    }
                                  `}
                                >
                                  <ActionIcon className="h-4 w-4" />
                                  <span className="text-sm">{action.label}</span>
                                </button>
                              );
                            })}
                          </div>
                          
                          {/* Resource Selection for modules with hasResourceSelection */}
                          {module.hasResourceSelection && getResourcesForModule(module).length > 0 && (
                            <div className="mt-4 pt-4 border-t">
                              <p className="text-sm font-medium mb-2">
                                Selecionar {module.label} específicos:
                              </p>
                              <p className="text-xs text-muted-foreground mb-3">
                                Deixe todos desmarcados para permitir acesso a todos. Marque apenas os que deseja permitir.
                              </p>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {getResourcesForModule(module).map((resource) => {
                                  const isSelected = (selectedResources[module.key] || []).includes(resource.id);
                                  return (
                                    <button
                                      key={resource.id}
                                      onClick={() => toggleResourceSelection(module.key, resource.id)}
                                      className={`
                                        flex items-center gap-2 p-2 rounded-lg border transition-colors text-left
                                        ${isSelected 
                                          ? 'bg-primary/10 border-primary text-primary' 
                                          : 'bg-muted/30 border-border text-muted-foreground hover:bg-muted/50'
                                        }
                                      `}
                                    >
                                      <div className={`w-4 h-4 rounded border flex items-center justify-center ${isSelected ? 'bg-primary border-primary' : 'border-muted-foreground'}`}>
                                        {isSelected && <span className="text-primary-foreground text-xs">✓</span>}
                                      </div>
                                      <span className="text-sm truncate">{resource.name}</span>
                                    </button>
                                  );
                                })}
                              </div>
                              {(selectedResources[module.key] || []).length > 0 && (
                                <p className="text-xs text-primary mt-2">
                                  {(selectedResources[module.key] || []).length} selecionado(s)
                                </p>
                              )}
                            </div>
                          )}
                        </AccordionContent>
                      </AccordionItem>
                    );
                  })}
                </Accordion>
              </ScrollArea>

              <div className="mt-4 pt-4 border-t">
                <Button 
                  onClick={handleSavePermissions} 
                  disabled={loading || !hasUnsavedPermissions}
                  className="w-full"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Permissões
                  {hasUnsavedPermissions && (
                    <Badge variant="secondary" className="ml-2">Alterações não salvas</Badge>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}