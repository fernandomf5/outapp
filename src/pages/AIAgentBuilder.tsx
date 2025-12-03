import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useAIAgent } from "@/hooks/useAIAgent";
import { supabase } from "@/integrations/supabase/client";
import {
  ArrowLeft,
  MessageSquare,
  Save,
  Play,
  Link2,
  Power,
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

const AIAgentBuilder = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const agentId = searchParams.get('id');
  
  const { saveAgent, loadAgent } = useAIAgent();
  
  const [agentName, setAgentName] = useState("Novo Chat");
  const [welcomeMessage, setWelcomeMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [accessType, setAccessType] = useState<'public' | 'private' | 'anonymous'>('public');
  const [originalAccessType, setOriginalAccessType] = useState<'public' | 'private' | 'anonymous'>('public');
  const [showAccessChangeDialog, setShowAccessChangeDialog] = useState(false);
  const [pendingAccessType, setPendingAccessType] = useState<'public' | 'private' | 'anonymous' | null>(null);

  useEffect(() => {
    if (agentId && user) {
      loadAgent(agentId).then(agent => {
        setAgentName(agent.name);
        setWelcomeMessage(agent.config?.welcomeMessage || "");
        setIsActive(agent.is_active);
        const at = (agent as any).access_type || 'public';
        const normalizedAt = at === 'restricted' ? 'private' : at;
        setAccessType(normalizedAt);
        setOriginalAccessType(normalizedAt);
      }).catch(console.error);
    }
  }, [agentId, user]);

  const handleAccessTypeChange = (value: 'public' | 'private' | 'anonymous') => {
    if (agentId && value !== originalAccessType) {
      setPendingAccessType(value);
      setShowAccessChangeDialog(true);
    } else {
      setAccessType(value);
    }
  };

  const handleConfirmAccessTypeChange = async () => {
    if (!pendingAccessType || !agentId) return;

    try {
      await supabase
        .from('agent_customers')
        .delete()
        .eq('agent_id', agentId);

      await supabase
        .from('agent_access_requests')
        .delete()
        .eq('agent_id', agentId);

      setAccessType(pendingAccessType);
      setOriginalAccessType(pendingAccessType);
      setShowAccessChangeDialog(false);
      setPendingAccessType(null);

      toast({
        title: "Tipo de acesso alterado",
        description: "Todos os usuários foram excluídos e podem se cadastrar novamente.",
      });
    } catch (error) {
      console.error('Error changing access type:', error);
      toast({
        title: "Erro",
        description: "Não foi possível alterar o tipo de acesso.",
        variant: "destructive",
      });
    }
  };

  const handleCancelAccessTypeChange = () => {
    setShowAccessChangeDialog(false);
    setPendingAccessType(null);
  };

  const handleSave = async () => {
    if (!user) return;
    
    setIsSaving(true);
    try {
      const agentData = {
        id: agentId || undefined,
        name: agentName,
        niche: 'chat', // default niche for chat only
        config: {
          welcomeMessage,
          aiEnabled: false, // AI always disabled
        },
        training_data: {},
        is_active: isActive,
        access_type: accessType,
      };

      const result = await saveAgent(agentData, user.id);
      
      if (!agentId && result) {
        navigate(`/ai-agent?id=${result.id}`);
      }
    } catch (error) {
      console.error('Save error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyLink = () => {
    if (!agentId) {
      toast({
        title: "Salve primeiro! 💾",
        description: "Você precisa salvar o chat antes de gerar o link.",
        variant: "destructive",
      });
      return;
    }

    const link = `${window.location.origin}/agent-auth/${agentId}`;
    navigator.clipboard.writeText(link);
    toast({
      title: "Link copiado! 🔗",
      description: "O link do chat foi copiado para a área de transferência.",
    });
  };

  const handleTestInNewTab = () => {
    if (!agentId) {
      toast({
        title: "Salve primeiro! 💾",
        description: "Você precisa salvar o chat antes de testar.",
        variant: "destructive",
      });
      return;
    }
    
    const link = `${window.location.origin}/agent-auth/${agentId}`;
    window.open(link, '_blank');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border px-3 sm:px-6 py-3 sm:py-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 sm:gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard?tab=ai-agents")} className="shrink-0">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="bg-primary/10 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium text-primary flex items-center gap-2">
              <MessageSquare className="w-3 h-3 sm:w-4 sm:h-4" />
              Chat Online
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0">
            {agentId && (
              <>
                <div className="flex items-center gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg border border-border bg-card shrink-0">
                  <Label htmlFor="active-switch" className="">
                    <Power className="w-3 h-3 sm:w-4 sm:h-4" />
                  </Label>
                  <Switch
                    id="active-switch"
                    checked={isActive}
                    onCheckedChange={setIsActive}
                  />
                  <span className="text-xs sm:text-sm font-medium hidden sm:inline">
                    {isActive ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
                <Button 
                  variant="outline" 
                  onClick={handleCopyLink}
                  className="hover:bg-primary/10 hover:border-primary shrink-0"
                  size="sm"
                >
                  <Link2 className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Copiar Link</span>
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleTestInNewTab}
                  className="hover:bg-primary/10 hover:border-primary shrink-0"
                  size="sm"
                >
                  <Play className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Testar</span>
                </Button>
              </>
            )}
            <Button 
              onClick={handleSave} 
              className="bg-primary hover:bg-primary/90 shrink-0"
              disabled={isSaving || !agentName.trim()}
              size="sm"
            >
              <Save className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
              {isSaving ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-8">
        <div className="space-y-4 sm:space-y-6">
          {/* Nome do Chat - Destaque */}
          <Card className="p-4 sm:p-8 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <div className="max-w-2xl space-y-6">
              <div>
                <Label className="text-base sm:text-lg font-semibold mb-3 block">Nome do Chat</Label>
                <Input
                  value={agentName}
                  onChange={(e) => setAgentName(e.target.value)}
                  placeholder="Digite o nome do seu chat online..."
                  className="text-lg sm:text-2xl font-bold h-12 sm:h-14 bg-background"
                />
                <p className="text-xs sm:text-sm text-muted-foreground mt-2">
                  Escolha um nome que represente bem o seu chat de atendimento
                </p>
              </div>

              <div>
                <Label className="text-base sm:text-lg font-semibold mb-3 block">Mensagem de Boas-vindas</Label>
                <Textarea
                  value={welcomeMessage}
                  onChange={(e) => setWelcomeMessage(e.target.value)}
                  placeholder="Ex: Olá! Como posso ajudar você hoje?"
                  rows={3}
                  className="bg-background"
                />
                <p className="text-xs sm:text-sm text-muted-foreground mt-2">
                  Esta mensagem será exibida quando o cliente iniciar uma conversa
                </p>
              </div>
            </div>
          </Card>

          {/* Tipo de Acesso */}
          <Card className="p-4 sm:p-6 border-primary/20">
            <div className="max-w-2xl">
              <Label className="text-base sm:text-lg font-semibold mb-3 block">Tipo de Acesso</Label>
              <Select value={accessType} onValueChange={handleAccessTypeChange}>
                <SelectTrigger className="w-full h-10 sm:h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="anonymous">
                    <div className="flex flex-col items-start">
                      <span className="font-semibold text-sm">💬 Acesso Direto (Sem Cadastro)</span>
                      <span className="text-xs text-muted-foreground">Chat instantâneo sem login</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="public">
                    <div className="flex flex-col items-start">
                      <span className="font-semibold text-sm">🌐 Acesso Livre (Com Cadastro)</span>
                      <span className="text-xs text-muted-foreground">Qualquer pessoa pode se cadastrar e usar</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="private">
                    <div className="flex flex-col items-start">
                      <span className="font-semibold text-sm">🔒 Acesso Privado (Com Aprovação)</span>
                      <span className="text-xs text-muted-foreground">Requer aprovação para acessar</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs sm:text-sm text-muted-foreground mt-2">
                {accessType === 'anonymous' 
                  ? '⚡ Usuários entram direto no chat sem precisar se cadastrar ou fazer login'
                  : accessType === 'public' 
                    ? '✓ Usuários podem se cadastrar e usar o chat livremente'
                    : '🔐 Você precisará aprovar cada solicitação de acesso individualmente'}
              </p>
            </div>
          </Card>
        </div>
      </div>

      {/* Dialog de confirmação de mudança de tipo de acesso */}
      <AlertDialog open={showAccessChangeDialog} onOpenChange={setShowAccessChangeDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>⚠️ Alterar tipo de acesso</AlertDialogTitle>
            <AlertDialogDescription>
              Ao alterar o tipo de acesso, <strong>todos os usuários cadastrados serão excluídos</strong>. Eles poderão se cadastrar novamente seguindo as novas regras de acesso.
              <br/><br/>
              Tem certeza que deseja continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelAccessTypeChange}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmAccessTypeChange}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AIAgentBuilder;
