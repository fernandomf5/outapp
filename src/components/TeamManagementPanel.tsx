import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  UserPlus, 
  Mail,
  Phone,
  Shield,
  Edit,
  Trash2,
  MoreVertical,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  Key,
  Send,
  RefreshCw,
  X
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { TeamDelegationPanel } from "@/components/team/TeamDelegationPanel";

interface Invitation {
  id: string;
  invited_email: string;
  status: string;
  created_at: string;
  expires_at: string;
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  department: string;
  status: 'active' | 'inactive' | 'on_leave';
  avatar_url?: string;
  joined_date: string;
  created_at: string;
}

export const TeamManagementPanel = () => {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDelegationDialogOpen, setIsDelegationDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [delegatingMember, setDelegatingMember] = useState<TeamMember | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [sendingInvite, setSendingInvite] = useState(false);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loadingInvitations, setLoadingInvitations] = useState(false);
  const [activeTab, setActiveTab] = useState<'members' | 'invitations'>('members');
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: '',
    department: '',
    status: 'active' as 'active' | 'inactive' | 'on_leave'
  });

  useEffect(() => {
    loadMembers();
    loadInvitations();
  }, []);

  const loadInvitations = async () => {
    setLoadingInvitations(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('team_invitations')
        .select('*')
        .eq('admin_user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInvitations(data || []);
    } catch (error: any) {
      console.error("Erro ao carregar convites:", error);
    } finally {
      setLoadingInvitations(false);
    }
  };

  const loadMembers = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('team_members')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMembers(data as any || []);
    } catch (error: any) {
      toast.error("Erro ao carregar equipe");
    } finally {
      setLoading(false);
    }
  };

  const handleSendInvitation = async () => {
    if (!formData.email) {
      toast.error("Informe o e-mail do convidado");
      return;
    }

    setSendingInvite(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase.functions.invoke('team-member-auth', {
        body: {
          action: 'send_invitation',
          adminUserId: user.id,
          invitedEmail: formData.email,
          role: formData.role,
          department: formData.department
        }
      });

      if (error || !data?.success) {
        throw new Error(data?.error || 'Erro ao enviar convite');
      }

      const wasResent = Boolean((data as any)?.resent);
      toast.success(
        wasResent
          ? `Convite já estava pendente — reenviado para ${formData.email}!`
          : `Convite enviado para ${formData.email}!`
      );
      setIsAddDialogOpen(false);
      loadInvitations(); // Reload invitations list
      setFormData({
        name: '',
        email: '',
        phone: '',
        role: '',
        department: '',
        status: 'active'
      });
    } catch (error: any) {
      toast.error(error.message || "Erro ao enviar convite");
    } finally {
      setSendingInvite(false);
    }
  };

  const handleResendInvitation = async (invitationId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('team-member-auth', {
        body: {
          action: 'resend_invitation',
          invitationId
        }
      });

      if (error || !data?.success) {
        throw new Error(data?.error || 'Erro ao reenviar convite');
      }

      toast.success("Convite reenviado com sucesso!");
      loadInvitations();
    } catch (error: any) {
      toast.error(error.message || "Erro ao reenviar convite");
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('team-member-auth', {
        body: {
          action: 'cancel_invitation',
          invitationId
        }
      });

      if (error || !data?.success) {
        throw new Error(data?.error || 'Erro ao cancelar convite');
      }

      toast.success("Convite cancelado");
      loadInvitations();
    } catch (error: any) {
      toast.error(error.message || "Erro ao cancelar convite");
    }
  };

  const getInvitationStatusBadge = (status: string, expiresAt: string) => {
    const isExpired = new Date(expiresAt) < new Date();

    if (status === 'accepted') {
      return (
        <Badge className="bg-success text-success-foreground gap-1">
          <CheckCircle2 className="h-3 w-3" /> Aceito
        </Badge>
      );
    }

    if (status === 'rejected') {
      return (
        <Badge className="bg-destructive text-destructive-foreground gap-1">
          <XCircle className="h-3 w-3" /> Cancelado
        </Badge>
      );
    }

    if (isExpired) {
      return (
        <Badge className="bg-destructive text-destructive-foreground gap-1">
          <Clock className="h-3 w-3" /> Expirado
        </Badge>
      );
    }

    return (
      <Badge variant="secondary" className="gap-1">
        <Clock className="h-3 w-3" /> Pendente
      </Badge>
    );
  };

  const handleDeleteMember = async (id: string) => {
    try {
      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success("Membro removido!");
      loadMembers();
    } catch (error: any) {
      toast.error("Erro ao remover membro");
    }
  };

  const handleEditMember = (member: TeamMember) => {
    setEditingMember(member);
    setFormData({
      name: member.name,
      email: member.email,
      phone: member.phone || '',
      role: member.role,
      department: member.department,
      status: member.status
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateMember = async () => {
    if (!editingMember) return;
    
    try {
      const { error } = await supabase
        .from('team_members')
        .update({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          role: formData.role,
          department: formData.department,
          status: formData.status
        })
        .eq('id', editingMember.id);

      if (error) throw error;

      toast.success("Membro atualizado com sucesso!");
      setIsEditDialogOpen(false);
      setEditingMember(null);
      loadMembers();
      
      setFormData({
        name: '',
        email: '',
        phone: '',
        role: '',
        department: '',
        status: 'active'
      });
    } catch (error: any) {
      toast.error("Erro ao atualizar membro");
    }
  };

  const filteredMembers = members.filter(m => {
    if (filter === 'all') return true;
    return m.status === filter;
  });

  const activeCount = members.filter(m => m.status === 'active').length;
  const inactiveCount = members.filter(m => m.status === 'inactive').length;
  const onLeaveCount = members.filter(m => m.status === 'on_leave').length;

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'active': return 'bg-success/20 text-success';
      case 'inactive': return 'bg-destructive/20 text-destructive';
      case 'on_leave': return 'bg-warning/20 text-warning';
      default: return '';
    }
  };

  const getStatusLabel = (status: string) => {
    switch(status) {
      case 'active': return 'Ativo';
      case 'inactive': return 'Inativo';
      case 'on_leave': return 'De Férias';
      default: return status;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Gestão de Equipe</h2>
          <p className="text-muted-foreground">Gerencie sua equipe de colaboradores</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-primary shadow-glow">
              <Mail className="mr-2 h-4 w-4" />
              Enviar Convite
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Enviar Convite para Equipe</DialogTitle>
              <DialogDescription>Convide alguém para fazer parte da sua equipe</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>E-mail do Convidado</Label>
                <Input 
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="email@exemplo.com"
                />
                <p className="text-xs text-muted-foreground">
                  Um convite será enviado para este e-mail. Após aceitar, a pessoa aparecerá como membro da equipe.
                </p>
              </div>
              <div className="grid gap-2">
                <Label>Cargo (opcional)</Label>
                <Input 
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                  placeholder="Ex: Assistente, Gerente..."
                />
              </div>
              <div className="grid gap-2">
                <Label>Departamento (opcional)</Label>
                <Select value={formData.department} onValueChange={(value) => setFormData({...formData, department: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tecnologia">Tecnologia</SelectItem>
                    <SelectItem value="marketing">Marketing</SelectItem>
                    <SelectItem value="vendas">Vendas</SelectItem>
                    <SelectItem value="financeiro">Financeiro</SelectItem>
                    <SelectItem value="rh">Recursos Humanos</SelectItem>
                    <SelectItem value="operacoes">Operações</SelectItem>
                    <SelectItem value="suporte">Suporte</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSendInvitation} className="gradient-primary" disabled={sendingInvite}>
                {sendingInvite ? (
                  <>Enviando...</>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Enviar Convite
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Estatísticas */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="glass hover:shadow-glow transition-smooth">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Membros</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{members.length}</div>
            <p className="text-xs text-muted-foreground">colaboradores</p>
          </CardContent>
        </Card>

        <Card className="glass hover:shadow-glow transition-smooth">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ativos</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{activeCount}</div>
            <p className="text-xs text-muted-foreground">trabalhando</p>
          </CardContent>
        </Card>

        <Card className="glass hover:shadow-glow transition-smooth">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inativos</CardTitle>
            <XCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{inactiveCount}</div>
            <p className="text-xs text-muted-foreground">desligados</p>
          </CardContent>
        </Card>

        <Card className="glass hover:shadow-glow transition-smooth">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">De Férias</CardTitle>
            <Calendar className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{onLeaveCount}</div>
            <p className="text-xs text-muted-foreground">ausentes</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs: Membros / Convites */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'members' | 'invitations')}>
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="members" className="gap-2">
            <Users className="h-4 w-4" />
            Membros ({members.length})
          </TabsTrigger>
          <TabsTrigger value="invitations" className="gap-2">
            <Send className="h-4 w-4" />
            Convites ({invitations.filter(i => i.status === 'pending').length})
          </TabsTrigger>
        </TabsList>

        {/* Tab: Membros */}
        <TabsContent value="members">
          <Card className="glass">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Membros da Equipe</CardTitle>
                <Select value={filter} onValueChange={(value: any) => setFilter(value)}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="active">Ativos</SelectItem>
                    <SelectItem value="inactive">Inativos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Carregando...</div>
          ) : filteredMembers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">
                Nenhum membro da equipe cadastrado
              </p>
              <Button onClick={() => setIsAddDialogOpen(true)} className="gradient-primary">
                <UserPlus className="mr-2 h-4 w-4" />
                Adicionar Primeiro Membro
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredMembers.map((member) => (
                <Card key={member.id} className="p-4 hover:shadow-lg transition-smooth">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={member.avatar_url} />
                        <AvatarFallback className="bg-primary/10 text-primary font-bold">
                          {getInitials(member.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{member.name}</h3>
                          <Badge className={getStatusColor(member.status)}>
                            {getStatusLabel(member.status)}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{member.role} • {member.department}</p>
                        <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {member.email}
                          </span>
                          {member.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {member.phone}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Desde {format(new Date(member.joined_date), "MMM yyyy", { locale: ptBR })}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setDelegatingMember(member);
                          setIsDelegationDialogOpen(true);
                        }}
                        className="gap-1"
                      >
                        <Key className="h-4 w-4" />
                        Delegar
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleEditMember(member)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleDeleteMember(member.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
            )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Convites Enviados */}
        <TabsContent value="invitations">
          <Card className="glass">
            <CardHeader>
              <CardTitle>Convites Enviados</CardTitle>
              <CardDescription>Acompanhe os convites enviados para sua equipe</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingInvitations ? (
                <div className="text-center py-8 text-muted-foreground">Carregando...</div>
              ) : invitations.length === 0 ? (
                <div className="text-center py-12">
                  <Mail className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground mb-4">
                    Nenhum convite enviado ainda
                  </p>
                  <Button onClick={() => setIsAddDialogOpen(true)} className="gradient-primary">
                    <Send className="mr-2 h-4 w-4" />
                    Enviar Primeiro Convite
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {invitations.map((invitation) => (
                    <Card key={invitation.id} className="p-4 hover:shadow-lg transition-smooth">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1">
                          <div className="p-3 rounded-full bg-primary/10">
                            <Mail className="h-5 w-5 text-primary" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-semibold">{invitation.invited_email}</h3>
                              {getInvitationStatusBadge(invitation.status, invitation.expires_at)}
                            </div>
                            <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                Enviado em {format(new Date(invitation.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                Expira em {format(new Date(invitation.expires_at), "dd/MM/yyyy", { locale: ptBR })}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {invitation.status === 'pending' && (
                            <>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleResendInvitation(invitation.id)}
                                className="gap-1"
                              >
                                <RefreshCw className="h-4 w-4" />
                                Reenviar
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => handleCancelInvitation(invitation.id)}
                              >
                                <X className="h-4 w-4 text-destructive" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog de Edição */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Editar Membro da Equipe</DialogTitle>
            <DialogDescription>Atualize as informações do colaborador</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Nome Completo</Label>
              <Input 
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="João Silva"
              />
            </div>
            <div className="grid gap-2">
              <Label>E-mail</Label>
              <Input 
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                placeholder="joao@empresa.com"
              />
            </div>
            <div className="grid gap-2">
              <Label>Telefone</Label>
              <Input 
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                placeholder="(11) 99999-9999"
              />
            </div>
            <div className="grid gap-2">
              <Label>Cargo</Label>
              <Input 
                value={formData.role}
                onChange={(e) => setFormData({...formData, role: e.target.value})}
                placeholder="Ex: Desenvolvedor, Designer..."
              />
            </div>
            <div className="grid gap-2">
              <Label>Departamento</Label>
              <Select value={formData.department} onValueChange={(value) => setFormData({...formData, department: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tecnologia">Tecnologia</SelectItem>
                  <SelectItem value="marketing">Marketing</SelectItem>
                  <SelectItem value="vendas">Vendas</SelectItem>
                  <SelectItem value="financeiro">Financeiro</SelectItem>
                  <SelectItem value="rh">Recursos Humanos</SelectItem>
                  <SelectItem value="operacoes">Operações</SelectItem>
                  <SelectItem value="suporte">Suporte</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Status</Label>
              <Select value={formData.status} onValueChange={(value: any) => setFormData({...formData, status: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="inactive">Inativo</SelectItem>
                  <SelectItem value="on_leave">De Férias</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdateMember} className="gradient-primary">
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Delegação de Funções */}
      <Dialog open={isDelegationDialogOpen} onOpenChange={setIsDelegationDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="h-5 w-5 text-primary" />
              Delegar Funções
            </DialogTitle>
            <DialogDescription>
              Crie credenciais de acesso e defina permissões para este membro
            </DialogDescription>
          </DialogHeader>
          {delegatingMember && (
            <TeamDelegationPanel 
              member={delegatingMember} 
              onClose={() => setIsDelegationDialogOpen(false)} 
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
