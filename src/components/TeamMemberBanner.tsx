import { useTeamMember } from '@/contexts/TeamMemberContext';
import { Users, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export function TeamMemberBanner() {
  const { isTeamMember, teamMember, logout } = useTeamMember();
  const navigate = useNavigate();

  if (!isTeamMember || !teamMember) {
    return null;
  }

  const handleLogout = async () => {
    await logout();
    navigate('/auth', { replace: true });
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-10 bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 border-b border-primary/30">
      <div className="flex items-center justify-center gap-4 px-4 py-2">
        <div className="flex items-center gap-2 text-sm">
          <Users className="h-4 w-4 text-primary" />
          <span className="font-medium text-foreground">
            Você entrou como membro da equipe de{' '}
            <span className="text-primary font-semibold">{teamMember.adminName}</span>
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="text-muted-foreground hover:text-foreground"
        >
          <LogOut className="h-4 w-4 mr-1" />
          Sair
        </Button>
      </div>
    </div>
  );
}