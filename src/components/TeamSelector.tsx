import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, User, ArrowRight, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface TeamMembership {
  id: string;
  admin_user_id: string;
  is_active: boolean;
  admin: {
    full_name: string;
    email: string;
  };
}

interface TeamSelectorProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  onSelectTeam: (membership: TeamMembership | null) => void;
}

export function TeamSelector({ open, onClose, userId, onSelectTeam }: TeamSelectorProps) {
  const [memberships, setMemberships] = useState<TeamMembership[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (open && userId) {
      loadMemberships();
    }
  }, [open, userId]);

  const loadMemberships = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('team-member-auth', {
        body: { action: 'get_team_memberships', userId }
      });

      if (error) throw error;
      setMemberships(data?.memberships || []);
    } catch (error) {
      console.error('Error loading memberships:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar suas equipes',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTeam = (membership: TeamMembership | null) => {
    onSelectTeam(membership);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Selecionar Modo de Acesso
          </DialogTitle>
          <DialogDescription>
            Escolha como deseja acessar o sistema
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 mt-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <>
              {/* Own account option */}
              <Card 
                className="cursor-pointer hover:border-primary transition-colors"
                onClick={() => handleSelectTeam(null)}
              >
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Minha Conta</p>
                      <p className="text-sm text-muted-foreground">Acessar como proprietário</p>
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground" />
                </CardContent>
              </Card>

              {/* Team memberships */}
              {memberships.length > 0 && (
                <>
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">
                        Ou acesse como membro
                      </span>
                    </div>
                  </div>

                  {memberships.map((membership) => (
                    <Card 
                      key={membership.id}
                      className="cursor-pointer hover:border-primary transition-colors"
                      onClick={() => handleSelectTeam(membership)}
                    >
                      <CardContent className="flex items-center justify-between p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-secondary/50 rounded-full flex items-center justify-center">
                            <Users className="h-5 w-5 text-secondary-foreground" />
                          </div>
                          <div>
                            <p className="font-medium">{membership.admin?.full_name || 'Equipe'}</p>
                            <p className="text-sm text-muted-foreground">{membership.admin?.email}</p>
                          </div>
                        </div>
                        <Badge variant="secondary">Membro</Badge>
                      </CardContent>
                    </Card>
                  ))}
                </>
              )}

              {memberships.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Você não faz parte de nenhuma equipe ainda.
                </p>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
