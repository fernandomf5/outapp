import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Trash2, Shield, Edit, Globe, User } from "lucide-react";

interface Feature {
  id: string;
  name: string;
  key: string;
  category: string | null;
}

interface FeatureOverride {
  id: string;
  feature_key: string;
  user_id: string | null;
  is_blocked: boolean;
  message: string | null;
  profiles?: {
    full_name: string;
    email: string;
  };
}

export const FeatureOverridesManager = () => {
  const { toast } = useToast();
  const [features, setFeatures] = useState<Feature[]>([]);
  const [overrides, setOverrides] = useState<FeatureOverride[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingOverride, setEditingOverride] = useState<FeatureOverride | null>(null);
  const [formData, setFormData] = useState({
    feature_key: "",
    user_id: "",
    is_blocked: true,
    message: ""
  });
  const [debugError, setDebugError] = useState<string | null>(null);
  const [showDebug, setShowDebug] = useState(false);

  useEffect(() => {
    fetchFeatures();
    fetchOverrides();
    fetchUsers();
  }, []);

  const fetchFeatures = async () => {
    const { data, error } = await supabase
      .from('features')
      .select('*')
      .eq('is_active', true)
      .order('category', { ascending: true });

    if (!error && data) {
      setFeatures(data);
    }
  };

  const fetchOverrides = async () => {
    const { data, error } = await supabase
      .from('feature_overrides')
      .select(`
        id,
        feature_key,
        user_id,
        is_blocked,
        message,
        created_at
      `)
      .order('created_at', { ascending: false });

    if (!error && data) {
      // Buscar dados dos usuários separadamente
      const userIds = data.filter(o => o.user_id).map(o => o.user_id) as string[];
      
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, full_name, email')
          .in('user_id', userIds);

        const enrichedData = data.map(override => {
          if (override.user_id) {
            const profile = profiles?.find(p => p.user_id === override.user_id);
            return {
              ...override,
              profiles: profile ? { full_name: profile.full_name, email: profile.email } : undefined
            };
          }
          return override;
        });
        
        setOverrides(enrichedData as FeatureOverride[]);
      } else {
        setOverrides(data as FeatureOverride[]);
      }
    }
  };

  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('user_id, full_name, email')
      .order('full_name', { ascending: true });

    if (!error && data) {
      setUsers(data);
    }
  };

  const handleSubmit = async () => {
    if (!formData.feature_key) {
      toast({
        title: "Erro",
        description: "Selecione um recurso",
        variant: "destructive"
      });
      return;
    }

    const data = {
      feature_key: formData.feature_key,
      user_id: formData.user_id || null,
      is_blocked: formData.is_blocked,
      message: formData.message || null
    };

    if (editingOverride) {
      const { error } = await supabase
        .from('feature_overrides')
        .update(data)
        .eq('id', editingOverride.id);

      if (error) {
        toast({
          title: "Erro ao atualizar",
          description: error.message,
          variant: "destructive"
        });
      } else {
        toast({ title: "Bloqueio atualizado!" });
        fetchOverrides();
        handleCloseDialog();
      }
    } else {
      const { error } = await supabase
        .from('feature_overrides')
        .insert(data);

      if (error) {
        toast({
          title: "Erro ao criar",
          description: error.message,
          variant: "destructive"
        });
      } else {
        toast({ title: "Bloqueio criado!" });
        fetchOverrides();
        handleCloseDialog();
      }
    }
  };

  const handleEdit = (override: FeatureOverride) => {
    setEditingOverride(override);
    setFormData({
      feature_key: override.feature_key,
      user_id: override.user_id || "",
      is_blocked: override.is_blocked,
      message: override.message || ""
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from('feature_overrides')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: "Erro ao excluir",
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({ title: "Bloqueio removido" });
      fetchOverrides();
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingOverride(null);
    setFormData({ feature_key: "", user_id: "", is_blocked: true, message: "" });
  };

  const handleDialogOpenChange = (open: boolean) => {
    console.log('[FeatureOverrides] onOpenChange ->', open);
    setIsDialogOpen(open);
    if (open) {
      (async () => {
        try {
          await Promise.allSettled([fetchFeatures(), fetchUsers()]);
          // Verifica se o Dialog realmente ficou visível
          requestAnimationFrame(() => {
            setTimeout(() => {
              const node = document.querySelector('[role="dialog"][data-state="open"]');
              if (!node) {
                const details = buildDebugReport('Dialog não visível após abertura');
                setDebugError(details);
                setShowDebug(false);
                toast({
                  title: "Falha ao abrir 'Novo Bloqueio'",
                  description: "Clique em Detalhes abaixo e me envie o conteúdo.",
                  variant: "destructive",
                } as any);
              }
            }, 100);
          });
        } catch (err) {
          const details = buildDebugReport('Erro ao abrir dialog', err);
          setDebugError(details);
          setShowDebug(false);
          toast({
            title: "Erro ao abrir 'Novo Bloqueio'",
            description: "Clique em Detalhes abaixo e me envie o conteúdo.",
            variant: "destructive",
          } as any);
        }
      })();
    } else {
      setEditingOverride(null);
      setFormData({ feature_key: "", user_id: "", is_blocked: true, message: "" });
    }
  };

  const handleOpenNewBlockClick = (e?: React.MouseEvent) => {
    e?.preventDefault();
    setIsDialogOpen(true);
  };

  const buildDebugReport = (reason: string, err?: unknown) => {
    const errorStr = err instanceof Error
      ? `${err.name}: ${err.message}\n${err.stack}`
      : err
      ? (() => { try { return JSON.stringify(err); } catch { return String(err); } })()
      : '';

    const dialogStates = Array.from(document.querySelectorAll('[role="dialog"]'))
      .map((n) => (n as HTMLElement).getAttribute('data-state') || 'unknown');

    return [
      '# FeatureOverrides Debug',
      `timestamp: ${new Date().toISOString()}`,
      `reason: ${reason}`,
      `route: ${window.location.pathname}`,
      `isDialogOpen: ${isDialogOpen}`,
      `features_count: ${features.length}`,
      `users_count: ${users.length}`,
      `overrides_count: ${overrides.length}`,
      `dom_dialog_states: ${JSON.stringify(dialogStates)}`,
      errorStr ? `error: ${errorStr}` : ''
    ].filter(Boolean).join('\n');
  };
  const getFeatureName = (key: string) => {
    const feature = features.find(f => f.key === key);
    return feature?.name || key;
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Shield className="w-6 h-6 text-primary" />
          Gerenciar Acesso a Recursos
        </h2>
          {/* Botão fora do DialogTrigger para controle manual e evitar conflitos */}
          <Button 
            type="button"
            className="gradient-primary"
            onClick={() => handleDialogOpenChange(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo Bloqueio
          </Button>

          {/* Dialog controlado por estado */}
          <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingOverride ? 'Editar Bloqueio' : 'Criar Novo Bloqueio'}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <Label>Recurso *</Label>
                  <Select
                    value={formData.feature_key}
                    onValueChange={(value) => setFormData({ ...formData, feature_key: value })}
                    disabled={!!editingOverride}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um recurso" />
                    </SelectTrigger>
                    <SelectContent>
                    {features.length === 0 ? (
                      <SelectItem disabled value="no-features">
                        Nenhum recurso disponível
                      </SelectItem>
                    ) : (
                      features.map((feature) => (
                        <SelectItem key={feature.id} value={feature.key}>
                          {feature.name} ({feature.key})
                        </SelectItem>
                      ))
                    )}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Aplicar para (deixe vazio para global)</Label>
                  <Select
                    value={formData.user_id}
                    onValueChange={(value) => setFormData({ ...formData, user_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todos os usuários (global)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todos os usuários (global)</SelectItem>
                      {users.map((user) => (
                        <SelectItem key={user.user_id} value={user.user_id}>
                          {user.full_name} ({user.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Status</Label>
                  <Select
                    value={formData.is_blocked ? "blocked" : "allowed"}
                    onValueChange={(value) => setFormData({ ...formData, is_blocked: value === "blocked" })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="blocked">🚫 Bloqueado</SelectItem>
                      <SelectItem value="allowed">✅ Liberado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Mensagem personalizada</Label>
                  <Textarea
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Ex: Recurso em manutenção. Previsão: 2 horas"
                    rows={3}
                  />
                </div>

                <Button type="button" onClick={handleSubmit} className="w-full gradient-primary">
                  {editingOverride ? 'Atualizar' : 'Criar'} Bloqueio
                </Button>
              </div>
            </DialogContent>
          </Dialog>
      </div>

      {debugError && (
        <Card className="mb-4 p-4 border-destructive/40 bg-destructive/5">
          <div className="flex items-center justify-between">
            <p className="text-sm">Não foi possível abrir o modal. Clique em Detalhes e me envie o conteúdo.</p>
            <Button variant="destructive" size="sm" onClick={() => setShowDebug((v) => !v)}>
              {showDebug ? 'Ocultar detalhes' : 'Detalhes'}
            </Button>
          </div>
          {showDebug && (
            <div className="mt-3 space-y-2">
              <Textarea readOnly rows={8} value={debugError || ''} />
              <div className="flex gap-2">
                <Button size="sm" onClick={() => { if (debugError) { navigator.clipboard.writeText(debugError); toast({ title: 'Detalhes copiados' }); } }}>
                  Copiar
                </Button>
                <Button size="sm" variant="secondary" onClick={() => setDebugError(null)}>
                  Limpar
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}

      <div className="space-y-3">
        {overrides.map((override) => (
          <Card key={override.id} className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  {override.user_id ? (
                    <User className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <Globe className="w-4 h-4 text-muted-foreground" />
                  )}
                  <h4 className="font-semibold">{getFeatureName(override.feature_key)}</h4>
                  <Badge variant={override.is_blocked ? "destructive" : "default"}>
                    {override.is_blocked ? '🚫 Bloqueado' : '✅ Liberado'}
                  </Badge>
                  {override.user_id ? (
                    <Badge variant="outline">
                      Usuário específico
                    </Badge>
                  ) : (
                    <Badge variant="secondary">
                      Global
                    </Badge>
                  )}
                </div>
                {override.user_id && override.profiles && (
                  <p className="text-sm text-muted-foreground mb-1">
                    👤 {override.profiles.full_name} ({override.profiles.email})
                  </p>
                )}
                {override.message && (
                  <p className="text-sm text-muted-foreground">
                    💬 {override.message}
                  </p>
                )}
                <code className="text-xs bg-muted px-2 py-1 rounded mt-2 inline-block">
                  {override.feature_key}
                </code>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(override)}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(override.id)}
                  className="text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}

        {overrides.length === 0 && (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">
              Nenhum bloqueio configurado. Todos os recursos estão disponíveis para todos os usuários.
            </p>
          </Card>
        )}
      </div>
    </Card>
  );
};
