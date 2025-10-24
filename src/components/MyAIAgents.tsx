import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Pencil, Trash2, Copy, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
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

export const MyAIAgents = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [agents, setAgents] = useState<any[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAgents();

    // Subscrever mudanças em tempo real
    const subscription = supabase
      .channel('my_agents_changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'ai_agents',
        filter: `user_id=eq.${user?.id}`
      }, () => {
        fetchAgents();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  const fetchAgents = async () => {
    if (!user) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from('ai_agents')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setAgents(data);
    }
    setLoading(false);
  };

  const handleEdit = (agentId: string) => {
    navigate(`/ai-agent?id=${agentId}`);
  };

  const handleDelete = async () => {
    if (!deletingId) return;

    const { error } = await supabase
      .from('ai_agents')
      .delete()
      .eq('id', deletingId);

    if (error) {
      toast({
        title: "Erro ao excluir",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setAgents(agents.filter(agent => agent.id !== deletingId));
      toast({
        title: "Agente IA excluído",
        description: "O agente foi removido com sucesso.",
      });
    }
    setDeletingId(null);
  };

  const handleCopyLink = (agentId: string, agentName: string) => {
    const slug = (agentName || '')
      .normalize('NFD').replace(/\p{Diacritic}/gu, '')
      .toLowerCase().trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
    const link = `${window.location.origin}/chat/${agentId}/${slug || 'agent'}`;
    navigator.clipboard.writeText(link);
    toast({
      title: "Link copiado! 🔗",
      description: "O link do agente IA foi copiado para a área de transferência.",
    });
  };

  const handleOpenChat = (agentId: string, agentName: string) => {
    const slug = (agentName || '')
      .normalize('NFD').replace(/\p{Diacritic}/gu, '')
      .toLowerCase().trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
    window.open(`/chat/${agentId}/${slug || 'agent'}`, '_blank');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (agents.length === 0) {
    return (
      <Card className="p-12 text-center">
        <Sparkles className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-xl font-semibold mb-2">Nenhum agente IA criado ainda</h3>
        <p className="text-muted-foreground mb-6">
          Crie seu primeiro agente IA para automatizar atendimentos com inteligência artificial
        </p>
        <Button onClick={() => navigate("/ai-agent")} className="mx-auto">
          <Sparkles className="w-4 h-4 mr-2" />
          Criar Agente IA
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Meus Agentes IA</h2>
        <Button onClick={() => navigate("/ai-agent")}>
          <Sparkles className="w-4 h-4 mr-2" />
          Novo Agente IA
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {agents.map((agent) => (
          <Card key={agent.id} className="p-6 hover:shadow-lg transition-all">
            <div className="flex items-start justify-between mb-4">
              <div className="bg-success/10 p-3 rounded-xl">
                <Sparkles className="w-6 h-6 text-success" />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleEdit(agent.id)}
                  title="Editar"
                >
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setDeletingId(agent.id)}
                  title="Excluir"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <h3 className="text-lg font-semibold mb-2">{agent.name}</h3>
            {agent.description && (
              <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                {agent.description}
              </p>
            )}

            <div className="flex items-center justify-between text-sm mb-4">
              <span className={`px-2 py-1 rounded-full ${agent.is_active ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'}`}>
                {agent.is_active ? 'Ativo' : 'Inativo'}
              </span>
              <span className="text-muted-foreground">
                {new Date(agent.created_at).toLocaleDateString('pt-BR')}
              </span>
            </div>

            <div className="mb-3">
              <span className="text-xs font-medium text-muted-foreground">Nicho:</span>
              <span className="text-sm ml-2 capitalize">{agent.niche || 'Não definido'}</span>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => handleCopyLink(agent.id, agent.name)}
              >
                <Copy className="w-3 h-3 mr-2" />
                Copiar Link
              </Button>
              <Button
                variant="default"
                size="sm"
                className="flex-1"
                onClick={() => handleOpenChat(agent.id, agent.name)}
              >
                <ExternalLink className="w-3 h-3 mr-2" />
                Abrir Chat
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <AlertDialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Agente IA</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este agente IA? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
