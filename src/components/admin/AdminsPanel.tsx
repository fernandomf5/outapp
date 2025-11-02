import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Shield, Search, UserPlus, Trash2, Crown } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
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

interface AdminUser {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  created_at: string;
  role: string;
}

export const AdminsPanel = () => {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [allUsers, setAllUsers] = useState<AdminUser[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    fetchAdmins();
    fetchAllUsers();
  }, []);

  const fetchAdmins = async () => {
    setLoading(true);
    
    // First, get all admin user IDs
    const { data: adminRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'admin');

    if (rolesError || !adminRoles) {
      setLoading(false);
      return;
    }

    const adminUserIds = adminRoles.map(role => role.user_id);

    // Then fetch profiles for those users
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .in('user_id', adminUserIds);

    if (!profilesError && profiles) {
      const adminsList = profiles.map(profile => ({
        id: profile.id,
        user_id: profile.user_id,
        full_name: profile.full_name,
        email: profile.email,
        created_at: profile.created_at,
        role: 'admin'
      }));
      setAdmins(adminsList);
    }
    
    setLoading(false);
  };

  const fetchAllUsers = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setAllUsers(data.map(profile => ({
        ...profile,
        role: 'user'
      })));
    }
  };

  const filteredUsers = allUsers.filter(u => 
    !admins.some(a => a.user_id === u.user_id) &&
    (u.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const openAddDialog = () => {
    setSearchTerm("");
    setAddDialogOpen(true);
  };

  const openRemoveDialog = (admin: AdminUser) => {
    setSelectedUser(admin);
    setRemoveDialogOpen(true);
  };

  const handleAddAdmin = async (userId: string) => {
    try {
      // Check if user already has admin role
      const { data: existingRole } = await supabase
        .from('user_roles')
        .select('id')
        .eq('user_id', userId)
        .eq('role', 'admin')
        .single();

      if (existingRole) {
        toast({
          title: "Usuário já é administrador",
          variant: "destructive",
        });
        return;
      }

      // Add admin role
      const { error } = await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          role: 'admin'
        });

      if (error) throw error;

      toast({
        title: "Administrador adicionado",
        description: "O usuário agora tem privilégios de administrador.",
      });
      
      setAddDialogOpen(false);
      fetchAdmins();
    } catch (error: any) {
      toast({
        title: "Erro ao adicionar administrador",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleRemoveAdmin = async () => {
    if (!selectedUser) return;

    // Prevent removing master account
    if (selectedUser.email === 'fernandomoraisgarcia2011@gmail.com') {
      toast({
        title: "Operação não permitida",
        description: "Não é possível remover a conta master.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', selectedUser.user_id)
        .eq('role', 'admin');

      if (error) throw error;

      toast({
        title: "Administrador removido",
        description: "Os privilégios de administrador foram removidos do usuário.",
      });
      
      setRemoveDialogOpen(false);
      fetchAdmins();
    } catch (error: any) {
      toast({
        title: "Erro ao remover administrador",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const isMasterAccount = (email: string) => email === 'fernandomoraisgarcia2011@gmail.com';

  return (
    <Card className="p-4 sm:p-6 glass">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-2 sm:p-3 rounded-xl">
            <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold">Administradores</h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Total: {admins.length} administradores
            </p>
          </div>
        </div>
        <Button onClick={openAddDialog}>
          <UserPlus className="w-4 h-4 mr-2" />
          Adicionar Admin
        </Button>
      </div>

      <div className="space-y-3">
        {loading ? (
          <p className="text-center text-muted-foreground py-8">Carregando...</p>
        ) : admins.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            Nenhum administrador encontrado
          </p>
        ) : (
          admins.map((admin) => (
            <div
              key={admin.id}
              className="p-3 sm:p-4 rounded-lg border border-border bg-card hover:bg-accent/5 transition-colors"
            >
              <div className="flex flex-col sm:flex-row items-start justify-between gap-3">
                <div className="flex-1 w-full">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-base sm:text-lg">{admin.full_name}</h3>
                    {isMasterAccount(admin.email) && (
                      <div title="Master Account">
                        <Crown className="w-4 h-4 text-yellow-500" />
                      </div>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1 truncate">
                    {admin.email}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Admin desde: {format(new Date(admin.created_at), 'dd/MM/yyyy')}
                  </p>
                </div>
                {!isMasterAccount(admin.email) && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => openRemoveDialog(admin)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Admin Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Adicionar Administrador</DialogTitle>
            <DialogDescription>
              Selecione um usuário para conceder privilégios de administrador.
            </DialogDescription>
          </DialogHeader>
          
          <div className="mb-4 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredUsers.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhum usuário encontrado
              </p>
            ) : (
              filteredUsers.map((u) => (
                <div
                  key={u.id}
                  className="p-3 rounded-lg border border-border hover:bg-accent/5 transition-colors flex items-center justify-between"
                >
                  <div>
                    <p className="font-medium">{u.full_name}</p>
                    <p className="text-sm text-muted-foreground">{u.email}</p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleAddAdmin(u.user_id)}
                  >
                    Adicionar
                  </Button>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Remove Admin Dialog */}
      <AlertDialog open={removeDialogOpen} onOpenChange={setRemoveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover Administrador?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover os privilégios de administrador de{" "}
              <strong>{selectedUser?.full_name}</strong>? Este usuário voltará a ter acesso apenas como usuário comum.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemoveAdmin} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};