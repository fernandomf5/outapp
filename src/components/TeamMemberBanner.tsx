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
    navigate('/team-login', { replace: true });
  };

  return (
    <div className="bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 border-b border-primary/30">
      <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between">
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