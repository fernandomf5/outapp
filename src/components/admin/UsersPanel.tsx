import { useState, useEffect, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Users, Search, Mail, Calendar, Edit, Trash2, Key, LogIn, Ban, Crown, Filter, TrendingUp, TrendingDown, UserPlus, UserMinus, ChevronDown, Download, Phone } from "lucide-react";
import { format, subDays, startOfMonth, endOfMonth, startOfYear, endOfYear, isWithinInterval, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface UserProfile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  created_at: string;
  is_banned?: boolean;
  plan_name?: string;
  has_active_subscription?: boolean;
}

type DateFilterType = 'all' | '7days' | '15days' | '30days' | 'month' | 'year' | 'custom';

export const UsersPanel = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [displayCount, setDisplayCount] = useState(5);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [editForm, setEditForm] = useState({ full_name: "", email: "" });
  const [newPassword, setNewPassword] = useState("");
  const [banDialogOpen, setBanDialogOpen] = useState(false);
  const { toast } = useToast();

  // Filtros de data
  const [dateFilter, setDateFilter] = useState<DateFilterType>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    fetchUsers();
    // Realtime updates for profiles table
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        () => {
          fetchUsers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      // Buscar planos de cada usuário
      const usersWithPlans = await Promise.all(
        data.map(async (user) => {
          const { data: subscription } = await supabase
            .from('subscriptions')
            .select('plan_id, status, expires_at, plans(name)')
            .eq('user_id', user.user_id)
            .eq('status', 'active')
            .order('expires_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          const hasActiveSubscription = subscription && 
            (subscription as any).status === 'active' && 
            new Date((subscription as any).expires_at) > new Date();

          return {
            ...user,
            plan_name: (subscription as any)?.plans?.name || 'Sem plano',
            has_active_subscription: hasActiveSubscription
          };
        })
      );
      setUsers(usersWithPlans);
    }
    setLoading(false);
  };

  // Função para filtrar usuários por data
  const getFilteredByDate = (usersList: UserProfile[]) => {
    const now = new Date();

    return usersList.filter(user => {
      const userDate = parseISO(user.created_at);

      switch (dateFilter) {
        case '7days':
          return isWithinInterval(userDate, { start: subDays(now, 7), end: now });
        case '15days':
          return isWithinInterval(userDate, { start: subDays(now, 15), end: now });
        case '30days':
          return isWithinInterval(userDate, { start: subDays(now, 30), end: now });
        case 'month':
          if (!selectedMonth || !selectedYear) return true;
          const monthStart = startOfMonth(new Date(parseInt(selectedYear), parseInt(selectedMonth) - 1));
          const monthEnd = endOfMonth(new Date(parseInt(selectedYear), parseInt(selectedMonth) - 1));
          return isWithinInterval(userDate, { start: monthStart, end: monthEnd });
        case 'year':
          if (!selectedYear) return true;
          const yearStart = startOfYear(new Date(parseInt(selectedYear), 0));
          const yearEnd = endOfYear(new Date(parseInt(selectedYear), 0));
          return isWithinInterval(userDate, { start: yearStart, end: yearEnd });
        case 'custom':
          if (!customStartDate || !customEndDate) return true;
          return isWithinInterval(userDate, { 
            start: parseISO(customStartDate), 
            end: parseISO(customEndDate + 'T23:59:59') 
          });
        default:
          return true;
      }
    });
  };

  // Métricas calculadas
  const metrics = useMemo(() => {
    const now = new Date();
    const last7Days = users.filter(u => isWithinInterval(parseISO(u.created_at), { start: subDays(now, 7), end: now }));
    const last30Days = users.filter(u => isWithinInterval(parseISO(u.created_at), { start: subDays(now, 30), end: now }));
    const previous30Days = users.filter(u => isWithinInterval(parseISO(u.created_at), { start: subDays(now, 60), end: subDays(now, 30) }));
    
    const withPlan = users.filter(u => u.has_active_subscription);
    const withoutPlan = users.filter(u => !u.has_active_subscription);
    
    const growthRate = previous30Days.length > 0 
      ? ((last30Days.length - previous30Days.length) / previous30Days.length * 100).toFixed(1)
      : '100';

    return {
      total: users.length,
      last7Days: last7Days.length,
      last30Days: last30Days.length,
      withPlan: withPlan.length,
      withoutPlan: withoutPlan.length,
      growthRate: parseFloat(growthRate),
      conversionRate: users.length > 0 ? ((withPlan.length / users.length) * 100).toFixed(1) : '0'
    };
  }, [users]);

  // Anos disponíveis para filtro
  const availableYears = useMemo(() => {
    const years = new Set<string>();
    users.forEach(user => {
      years.add(new Date(user.created_at).getFullYear().toString());
    });
    return Array.from(years).sort((a, b) => parseInt(b) - parseInt(a));
  }, [users]);

  const filteredUsers = useMemo(() => {
    let result = users.filter(user => 
      user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
    return getFilteredByDate(result);
  }, [users, searchTerm, dateFilter, selectedMonth, selectedYear, customStartDate, customEndDate]);

  const displayedUsers = filteredUsers.slice(0, displayCount);
  const hasMore = displayCount < filteredUsers.length;

  const loadMore = () => {
    setDisplayCount(prev => Math.min(prev + 5, filteredUsers.length));
  };

  const resetFilters = () => {
    setDateFilter('all');
    setSelectedMonth('');
    setSelectedYear('');
    setCustomStartDate('');
    setCustomEndDate('');
  };

  // Funções de exportação de leads
  const downloadEmails = () => {
    const emails = filteredUsers.map(u => u.email).filter(Boolean).join('\n');
    const blob = new Blob([emails], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'emails-leads.txt';
    a.click();
    URL.revokeObjectURL(url);
    toast({
      title: "Download concluído",
      description: `${filteredUsers.length} emails exportados.`,
    });
  };

  const downloadCSV = () => {
    const header = 'Nome,Email,Data Cadastro,Plano,Status Plano\n';
    const rows = filteredUsers.map(u => 
      `"${u.full_name}","${u.email}","${format(new Date(u.created_at), 'dd/MM/yyyy')}","${u.plan_name}","${u.has_active_subscription ? 'Ativo' : 'Inativo'}"`
    ).join('\n');
    const csv = header + rows;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'leads-usuarios.csv';
    a.click();
    URL.revokeObjectURL(url);
    toast({
      title: "Download concluído",
      description: `${filteredUsers.length} leads exportados em CSV.`,
    });
  };

  const openEditDialog = (user: UserProfile) => {
    setSelectedUser(user);
    setEditForm({ full_name: user.full_name, email: user.email });
    setEditDialogOpen(true);
  };

  const openPasswordDialog = (user: UserProfile) => {
    setSelectedUser(user);
    setNewPassword("");
    setPasswordDialogOpen(true);
  };

  const openDeleteDialog = (user: UserProfile) => {
    setSelectedUser(user);
    setDeleteDialogOpen(true);
  };

  const openBanDialog = (user: UserProfile) => {
    setSelectedUser(user);
    setBanDialogOpen(true);
  };

  const handleBanUser = async () => {
    if (!selectedUser) return;

    try {
      const newBannedStatus = !selectedUser.is_banned;
      const { error } = await supabase
        .from('profiles')
        .update({ is_banned: newBannedStatus })
        .eq('user_id', selectedUser.user_id);

      if (error) throw error;

      toast({
        title: newBannedStatus ? "Usuário banido" : "Ban removido",
        description: newBannedStatus 
          ? "O usuário não poderá mais fazer login."
          : "O usuário pode fazer login novamente.",
      });
      setBanDialogOpen(false);
      fetchUsers();
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar status",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleEditUser = async () => {
    if (!selectedUser) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(
        'https://mlocikcfxbleddsvxciv.supabase.co/functions/v1/manage-user',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({
            action: 'update_profile',
            userId: selectedUser.user_id,
            data: {
              full_name: editForm.full_name,
              email: editForm.email
            }
          })
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao atualizar usuário');
      }

      toast({
        title: "Usuário atualizado",
        description: "As informações do usuário foram atualizadas com sucesso.",
      });
      setEditDialogOpen(false);
      fetchUsers();
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar usuário",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleResetPassword = async () => {
    if (!selectedUser || !newPassword) return;

    if (newPassword.length < 8) {
      toast({
        title: "Senha muito curta",
        description: "A senha deve ter pelo menos 8 caracteres.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(
        'https://mlocikcfxbleddsvxciv.supabase.co/functions/v1/manage-user',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({
            action: 'update_password',
            userId: selectedUser.user_id,
            data: { password: newPassword }
          })
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao resetar senha');
      }

      toast({
        title: "Senha resetada",
        description: "A senha do usuário foi alterada com sucesso.",
      });
      setPasswordDialogOpen(false);
      setNewPassword("");
    } catch (error: any) {
      toast({
        title: "Erro ao resetar senha",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    try {
      const userId = selectedUser.user_id;
      const { data: { session } } = await supabase.auth.getSession();
      
      // Deletar dados relacionados antes de deletar o usuário (em sequência)
      await supabase.from('chatbot_conversations' as any).delete().eq('user_id', userId);
      await supabase.from('agent_conversations' as any).delete().eq('customer_id', userId);
      await supabase.from('subscriptions' as any).delete().eq('user_id', userId);
      await supabase.from('chatbots' as any).delete().eq('user_id', userId);
      await supabase.from('ai_agents' as any).delete().eq('user_id', userId);
      await supabase.from('websites' as any).delete().eq('user_id', userId);
      await supabase.from('cloned_pages' as any).delete().eq('user_id', userId);
      await supabase.from('link_bios' as any).delete().eq('user_id', userId);
      await supabase.from('short_links' as any).delete().eq('user_id', userId);
      await supabase.from('profiles' as any).delete().eq('user_id', userId);
      
      // Deletar usuário da autenticação
      const response = await fetch(
        'https://mlocikcfxbleddsvxciv.supabase.co/functions/v1/manage-user',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({
            action: 'delete',
            userId: userId
          })
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao excluir usuário');
      }

      toast({
        title: "Usuário excluído",
        description: "O usuário e todos os seus dados foram removidos do sistema.",
      });
      setDeleteDialogOpen(false);
      fetchUsers();
    } catch (error: any) {
      toast({
        title: "Erro ao excluir usuário",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleLoginAsUser = async (user: UserProfile) => {
    console.log('Iniciando login como usuário:', user.email);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error('Você precisa estar autenticado para fazer login como outro usuário');
      }

      console.log('Token de admin obtido, fazendo chamada para edge function...');
      
      const response = await fetch(
        'https://mlocikcfxbleddsvxciv.supabase.co/functions/v1/impersonate-user',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
            'origin': window.location.origin
          },
          body: JSON.stringify({
            userId: user.user_id
          })
        }
      );

      console.log('Status da resposta:', response.status);

      const result = await response.json();
      console.log('Resultado da API:', result);

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao fazer login como usuário');
      }

      // Redireciona para o magic link para concluir a sessão como o usuário alvo
      const { action_link } = result;

      if (!action_link) {
        console.error('Magic link não encontrado:', result);
        throw new Error('Link de autenticação não encontrado na resposta');
      }

      toast({
        title: "Abrindo sessão...",
        description: `Entrando como ${user.full_name}`,
      });

      window.location.href = action_link;

    } catch (error: any) {
      console.error('Erro completo ao fazer login:', error);
      toast({
        title: "Erro ao fazer login",
        description: error.message || 'Erro desconhecido ao fazer login',
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="p-4 sm:p-6 glass">
      <div className="flex items-center gap-3 mb-4 sm:mb-6">
        <div className="bg-primary/10 p-2 sm:p-3 rounded-xl">
          <Users className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
        </div>
        <div>
          <h2 className="text-lg sm:text-xl font-bold">Usuários Cadastrados</h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Total: {users.length} usuários
          </p>
        </div>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-4 h-4 text-primary" />
            <span className="text-xs text-muted-foreground">Total</span>
          </div>
          <p className="text-lg font-bold">{metrics.total}</p>
        </div>
        
        <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
          <div className="flex items-center gap-2 mb-1">
            <UserPlus className="w-4 h-4 text-green-500" />
            <span className="text-xs text-muted-foreground">Últimos 7 dias</span>
          </div>
          <p className="text-lg font-bold text-green-500">{metrics.last7Days}</p>
        </div>
        
        <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="w-4 h-4 text-blue-500" />
            <span className="text-xs text-muted-foreground">Últimos 30 dias</span>
          </div>
          <p className="text-lg font-bold text-blue-500">{metrics.last30Days}</p>
        </div>
        
        <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
          <div className="flex items-center gap-2 mb-1">
            <Crown className="w-4 h-4 text-yellow-500" />
            <span className="text-xs text-muted-foreground">Com plano</span>
          </div>
          <p className="text-lg font-bold text-yellow-500">{metrics.withPlan}</p>
        </div>
        
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
          <div className="flex items-center gap-2 mb-1">
            <UserMinus className="w-4 h-4 text-red-500" />
            <span className="text-xs text-muted-foreground">Sem plano</span>
          </div>
          <p className="text-lg font-bold text-red-500">{metrics.withoutPlan}</p>
        </div>
        
        <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
          <div className="flex items-center gap-2 mb-1">
            {metrics.growthRate >= 0 ? (
              <TrendingUp className="w-4 h-4 text-purple-500" />
            ) : (
              <TrendingDown className="w-4 h-4 text-purple-500" />
            )}
            <span className="text-xs text-muted-foreground">Crescimento</span>
          </div>
          <p className="text-lg font-bold text-purple-500">{metrics.growthRate}%</p>
        </div>
      </div>

      {/* Filtros */}
      <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen} className="mb-4">
        <CollapsibleTrigger asChild>
          <Button variant="outline" className="w-full justify-between mb-2">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              <span>Filtros de Data</span>
              {dateFilter !== 'all' && (
                <span className="ml-2 px-2 py-0.5 bg-primary/20 text-primary text-xs rounded-full">
                  Ativo
                </span>
              )}
            </div>
            <ChevronDown className={`w-4 h-4 transition-transform ${filtersOpen ? 'rotate-180' : ''}`} />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-4 p-4 border border-border rounded-lg bg-card">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <Button 
              variant={dateFilter === 'all' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setDateFilter('all')}
            >
              Todos
            </Button>
            <Button 
              variant={dateFilter === '7days' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setDateFilter('7days')}
            >
              Últimos 7 dias
            </Button>
            <Button 
              variant={dateFilter === '15days' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setDateFilter('15days')}
            >
              Últimos 15 dias
            </Button>
            <Button 
              variant={dateFilter === '30days' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setDateFilter('30days')}
            >
              Últimos 30 dias
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Filtro por mês */}
            <div className="space-y-2">
              <Label className="text-sm">Por mês/ano</Label>
              <div className="flex gap-2">
                <Select 
                  value={selectedMonth} 
                  onValueChange={(v) => {
                    setSelectedMonth(v);
                    setDateFilter('month');
                  }}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Mês" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Janeiro</SelectItem>
                    <SelectItem value="2">Fevereiro</SelectItem>
                    <SelectItem value="3">Março</SelectItem>
                    <SelectItem value="4">Abril</SelectItem>
                    <SelectItem value="5">Maio</SelectItem>
                    <SelectItem value="6">Junho</SelectItem>
                    <SelectItem value="7">Julho</SelectItem>
                    <SelectItem value="8">Agosto</SelectItem>
                    <SelectItem value="9">Setembro</SelectItem>
                    <SelectItem value="10">Outubro</SelectItem>
                    <SelectItem value="11">Novembro</SelectItem>
                    <SelectItem value="12">Dezembro</SelectItem>
                  </SelectContent>
                </Select>
                <Select 
                  value={selectedYear} 
                  onValueChange={(v) => {
                    setSelectedYear(v);
                    if (selectedMonth) setDateFilter('month');
                  }}
                >
                  <SelectTrigger className="w-24">
                    <SelectValue placeholder="Ano" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableYears.map(year => (
                      <SelectItem key={year} value={year}>{year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Filtro por ano */}
            <div className="space-y-2">
              <Label className="text-sm">Apenas por ano</Label>
              <Select 
                value={dateFilter === 'year' ? selectedYear : ''} 
                onValueChange={(v) => {
                  setSelectedYear(v);
                  setSelectedMonth('');
                  setDateFilter('year');
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o ano" />
                </SelectTrigger>
                <SelectContent>
                  {availableYears.map(year => (
                    <SelectItem key={year} value={year}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Filtro customizado */}
          <div className="space-y-2">
            <Label className="text-sm">Período personalizado</Label>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex-1">
                <Label className="text-xs text-muted-foreground">De</Label>
                <Input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => {
                    setCustomStartDate(e.target.value);
                    if (e.target.value && customEndDate) setDateFilter('custom');
                  }}
                />
              </div>
              <div className="flex-1">
                <Label className="text-xs text-muted-foreground">Até</Label>
                <Input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => {
                    setCustomEndDate(e.target.value);
                    if (customStartDate && e.target.value) setDateFilter('custom');
                  }}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center pt-2 border-t border-border">
            <p className="text-sm text-muted-foreground">
              Mostrando <span className="font-bold text-foreground">{filteredUsers.length}</span> usuários
            </p>
            <Button variant="ghost" size="sm" onClick={resetFilters}>
              Limpar filtros
            </Button>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Ações de exportação de leads */}
      <div className="flex flex-wrap gap-2 mb-4 p-3 rounded-lg border border-border bg-card">
        <div className="flex items-center gap-2 mr-auto">
          <Download className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">Exportar Leads:</span>
        </div>
        <Button variant="outline" size="sm" onClick={downloadEmails}>
          <Mail className="w-4 h-4 mr-2" />
          Emails (.txt)
        </Button>
        <Button variant="outline" size="sm" onClick={downloadCSV}>
          <Download className="w-4 h-4 mr-2" />
          Todos os Dados (.csv)
        </Button>
      </div>

      <div className="mb-4 relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome ou email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="space-y-3">
        {loading ? (
          <p className="text-center text-muted-foreground py-8">Carregando...</p>
        ) : filteredUsers.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            Nenhum usuário encontrado
          </p>
        ) : (
          <>
            {displayedUsers.map((user) => (
            <div
              key={user.id}
              className="p-3 sm:p-4 rounded-lg border border-border bg-card hover:bg-accent/5 transition-colors"
            >
              <div className="flex flex-col sm:flex-row items-start justify-between gap-3">
                <div className="flex-1 w-full">
                  <h3 className="font-semibold text-base sm:text-lg">{user.full_name}</h3>
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground mt-1">
                    <Mail className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="truncate">{user.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                    <Calendar className="w-3 h-3" />
                    <span>
                      Cadastrado em: {format(new Date(user.created_at), 'dd/MM/yyyy')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs mt-2">
                    <Crown className="w-3 h-3 text-yellow-500" />
                    <span className={user.plan_name === 'Sem plano' ? 'text-muted-foreground' : 'text-primary font-medium'}>
                      {user.plan_name}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2 w-full sm:w-auto flex-wrap">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleLoginAsUser(user)}
                    className="flex-1 sm:flex-none bg-primary/10 hover:bg-primary/20"
                    title="Entrar como este usuário"
                  >
                    <LogIn className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(user)}
                    className="flex-1 sm:flex-none"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openPasswordDialog(user)}
                    className="flex-1 sm:flex-none"
                  >
                    <Key className="w-4 h-4" />
                  </Button>
                  {user.email !== 'fernandomoraisgarcia2011@gmail.com' && (
                    <>
                      <Button
                        variant={user.is_banned ? "default" : "outline"}
                        size="sm"
                        onClick={() => openBanDialog(user)}
                        className="flex-1 sm:flex-none"
                        title={user.is_banned ? "Remover ban" : "Banir usuário"}
                      >
                        <Ban className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => openDeleteDialog(user)}
                        className="flex-1 sm:flex-none"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
          {hasMore && (
            <div className="text-center pt-4">
              <Button variant="outline" onClick={loadMore}>
                Carregar mais usuários
              </Button>
            </div>
          )}
          </>
        )}
      </div>

      {/* Edit User Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
            <DialogDescription>
              Atualize as informações do usuário abaixo.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="full_name">Nome Completo</Label>
              <Input
                id="full_name"
                value={editForm.full_name}
                onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEditUser}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resetar Senha</DialogTitle>
            <DialogDescription>
              Digite uma nova senha para o usuário {selectedUser?.full_name}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="new_password">Nova Senha</Label>
              <Input
                id="new_password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Digite a nova senha"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPasswordDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleResetPassword}>Resetar Senha</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso excluirá permanentemente o usuário{" "}
              <strong>{selectedUser?.full_name}</strong> e todos os dados associados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Ban User Dialog */}
      <AlertDialog open={banDialogOpen} onOpenChange={setBanDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {selectedUser?.is_banned ? "Remover Banimento" : "Banir Usuário"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {selectedUser?.is_banned ? (
                <>
                  O usuário <strong>{selectedUser?.full_name}</strong> poderá fazer login novamente.
                </>
              ) : (
                <>
                  O usuário <strong>{selectedUser?.full_name}</strong> não poderá mais fazer login no sistema. 
                  Ao tentar fazer login, receberá a mensagem "Você foi banido do sistema".
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleBanUser} 
              className={selectedUser?.is_banned ? "" : "bg-destructive text-destructive-foreground hover:bg-destructive/90"}
            >
              {selectedUser?.is_banned ? "Remover Ban" : "Banir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};
