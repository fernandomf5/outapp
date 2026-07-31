import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Trash2, Copy, Key, ExternalLink, Clock, User, Lock, RefreshCw, Power } from "lucide-react";

interface AccessCode {
  id: string;
  access_code: string;
  customer_name: string | null;
  customer_email: string | null;
  expires_at: string | null;
  is_active: boolean | null;
  created_at: string | null;
}

interface MemberUser {
  id: string;
  username: string;
  customer_name: string | null;
  customer_email: string | null;
  expires_at: string | null;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
}

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  areaId: string;
  areaSlug: string;
  areaName: string;
  initialTab?: "codes" | "users";
}

const DURATION_OPTIONS: Record<string, number | null> = {
  never: null,
  "1h": 1,
  "24h": 24,
  "3d": 72,
  "7d": 168,
  "30d": 720,
  "90d": 2160,
};

const durationToExpires = (duration: string) => {
  const hours = DURATION_OPTIONS[duration];
  return hours ? new Date(Date.now() + hours * 60 * 60 * 1000).toISOString() : null;
};

const DurationSelect = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
  <Select value={value} onValueChange={onChange}>
    <SelectTrigger>
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="never">Sem expiração</SelectItem>
      <SelectItem value="1h">1 hora</SelectItem>
      <SelectItem value="24h">24 horas</SelectItem>
      <SelectItem value="3d">3 dias</SelectItem>
      <SelectItem value="7d">7 dias</SelectItem>
      <SelectItem value="30d">30 dias</SelectItem>
      <SelectItem value="90d">90 dias</SelectItem>
    </SelectContent>
  </Select>
);

export function AccessCodesDialog({ open, onOpenChange, areaId, areaSlug, areaName, initialTab = "codes" }: Props) {
  const [codes, setCodes] = useState<AccessCode[]>([]);
  const [loading, setLoading] = useState(false);
  const [studentName, setStudentName] = useState("");
  const [duration, setDuration] = useState<string>("never");
  const [creating, setCreating] = useState(false);

  // login users
  const [users, setUsers] = useState<MemberUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [uName, setUName] = useState("");
  const [uUsername, setUUsername] = useState("");
  const [uEmail, setUEmail] = useState("");
  const [uPassword, setUPassword] = useState("");
  const [uDuration, setUDuration] = useState<string>("never");
  const [savingUser, setSavingUser] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("members_area_access_codes" as any)
      .select("*")
      .eq("members_area_id", areaId)
      .order("created_at", { ascending: false });
    if (error) {
      toast.error("Erro ao carregar códigos");
    } else {
      setCodes((data as any) || []);
    }
    setLoading(false);
  };

  const loadUsers = async () => {
    setLoadingUsers(true);
    const { data, error } = await supabase
      .from("members_area_users" as any)
      .select("id, username, customer_name, customer_email, expires_at, is_active, last_login_at, created_at")
      .eq("members_area_id", areaId)
      .order("created_at", { ascending: false });
    if (error) toast.error("Erro ao carregar usuários");
    else setUsers((data as any) || []);
    setLoadingUsers(false);
  };

  useEffect(() => {
    if (open) {
      load();
      loadUsers();
    }
  }, [open, areaId]);

  const generateCode = () =>
    Math.random().toString(36).substring(2, 6).toUpperCase() +
    Math.random().toString(36).substring(2, 6).toUpperCase();

  const handleCreate = async () => {
    setCreating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Você precisa estar logado");
        return;
      }
      const { error } = await supabase.from("members_area_access_codes" as any).insert({
        members_area_id: areaId,
        user_id: user.id,
        access_code: generateCode(),
        customer_name: studentName.trim() || "Acesso Avulso",
        expires_at: durationToExpires(duration),
        is_active: true,
      });
      if (error) throw error;
      toast.success("Código gerado com sucesso!");
      setStudentName("");
      setDuration("never");
      load();
    } catch (e: any) {
      toast.error(e.message || "Erro ao gerar código");
    } finally {
      setCreating(false);
    }
  };

  const callFn = async (payload: Record<string, unknown>) => {
    const { data, error } = await supabase.functions.invoke("members-area-user-auth", {
      body: { areaId, ...payload },
    });
    if (error) {
      const msg = (data as any)?.error || error.message;
      throw new Error(msg || "Erro na operação");
    }
    if ((data as any)?.error) throw new Error((data as any).error);
    return data;
  };

  const handleCreateUser = async () => {
    if (!uUsername.trim() || !uPassword.trim()) {
      toast.error("Informe nome de usuário e senha");
      return;
    }
    setSavingUser(true);
    try {
      await callFn({
        action: "create",
        username: uUsername,
        password: uPassword,
        name: uName,
        email: uEmail,
        expires_at: durationToExpires(uDuration),
      });
      toast.success("Usuário criado com sucesso!");
      setUName(""); setUUsername(""); setUEmail(""); setUPassword(""); setUDuration("never");
      loadUsers();
    } catch (e: any) {
      toast.error(e.message || "Erro ao criar usuário");
    } finally {
      setSavingUser(false);
    }
  };

  const handleResetPassword = async (u: MemberUser) => {
    const newPass = window.prompt(`Nova senha para "${u.username}" (mín. 6 caracteres):`);
    if (!newPass) return;
    try {
      await callFn({ action: "set_password", id: u.id, password: newPass });
      toast.success("Senha atualizada!");
    } catch (e: any) {
      toast.error(e.message || "Erro ao atualizar senha");
    }
  };

  const toggleUserActive = async (u: MemberUser) => {
    const { error } = await supabase
      .from("members_area_users" as any)
      .update({ is_active: !u.is_active })
      .eq("id", u.id);
    if (error) toast.error("Erro ao atualizar");
    else {
      setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, is_active: !x.is_active } : x)));
      toast.success(!u.is_active ? "Usuário ativado" : "Usuário desativado");
    }
  };

  const deleteUser = async (id: string) => {
    const { error } = await supabase.from("members_area_users" as any).delete().eq("id", id);
    if (error) toast.error("Erro ao excluir");
    else {
      setUsers((prev) => prev.filter((u) => u.id !== id));
      toast.success("Usuário excluído");
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("members_area_access_codes" as any).delete().eq("id", id);
    if (error) toast.error("Erro ao excluir");
    else {
      toast.success("Código excluído");
      setCodes((prev) => prev.filter((c) => c.id !== id));
    }
  };

  const buildUrl = (code: string) =>
    `${window.location.origin}/members/${areaSlug}?code=${code}`;

  const areaUrl = `${window.location.origin}/members/${areaSlug}`;

  const copy = async (text: string, msg: string) => {
    await navigator.clipboard.writeText(text);
    toast.success(msg);
  };

  const isExpired = (c: { expires_at: string | null }) =>
    c.expires_at ? new Date(c.expires_at).getTime() < Date.now() : false;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-[750px] h-[calc(100dvh-2rem)] sm:h-[90dvh] !max-h-[90dvh] !flex flex-col !overflow-hidden">
        <DialogHeader className="shrink-0 pr-8">
          <DialogTitle className="flex items-center gap-2">
            <Key className="w-5 h-5" />
            Acessos — {areaName}
          </DialogTitle>
          <DialogDescription>
            Libere o acesso por código avulso ou criando login com usuário e senha.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue={initialTab} className="flex-1 min-h-0 flex flex-col">
          <TabsList className="shrink-0 grid grid-cols-2">
            <TabsTrigger value="codes" className="gap-2">
              <Key className="w-4 h-4" /> Códigos
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-2">
              <User className="w-4 h-4" /> Usuário e Senha
            </TabsTrigger>
          </TabsList>

          {/* ---------- CODES ---------- */}
          <TabsContent value="codes" className="flex-1 min-h-0 flex flex-col mt-3 data-[state=inactive]:hidden">
            <div className="shrink-0 grid grid-cols-1 sm:grid-cols-[1fr_180px_auto] gap-2 items-end border rounded-md p-3 bg-muted/30">
              <div>
                <Label className="text-xs">Nome (opcional)</Label>
                <Input
                  placeholder="Ex: João ou Teste"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                />
              </div>
              <div>
                <Label className="text-xs">Validade</Label>
                <DurationSelect value={duration} onChange={setDuration} />
              </div>
              <Button onClick={handleCreate} disabled={creating}>
                <Plus className="w-4 h-4 mr-2" />
                Gerar
              </Button>
            </div>

            <div className="flex-1 min-h-0 mt-2 overflow-y-auto overscroll-contain pr-3">
              <div className="space-y-2 pb-2">
                {loading ? (
                  <p className="text-sm text-muted-foreground text-center py-6">Carregando...</p>
                ) : codes.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">
                    Nenhum código gerado ainda
                  </p>
                ) : (
                  codes.map((c) => {
                    const expired = isExpired(c);
                    return (
                      <div
                        key={c.id}
                        className="flex flex-col sm:flex-row sm:items-center gap-2 p-3 border rounded-md"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <code className="font-mono font-bold text-base">{c.access_code}</code>
                            {expired ? (
                              <Badge variant="destructive">Expirado</Badge>
                            ) : c.expires_at ? (
                              <Badge variant="secondary" className="gap-1">
                                <Clock className="w-3 h-3" />
                                até {new Date(c.expires_at).toLocaleString("pt-BR")}
                              </Badge>
                            ) : (
                              <Badge variant="outline">Sem expiração</Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 truncate">
                            {c.customer_name || "Acesso Avulso"}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copy(c.access_code, "Código copiado!")}
                            title="Copiar código"
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copy(buildUrl(c.access_code), "Link copiado!")}
                            title="Copiar link com código"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(buildUrl(c.access_code), "_blank")}
                            title="Abrir"
                          >
                            <Key className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(c.id)}
                            title="Excluir"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </TabsContent>

          {/* ---------- USERS ---------- */}
          <TabsContent value="users" className="flex-1 min-h-0 flex flex-col mt-3 data-[state=inactive]:hidden">
            <div className="shrink-0 border rounded-md p-3 bg-muted/30 space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Nome do aluno</Label>
                  <Input placeholder="Ex: João Silva" value={uName} onChange={(e) => setUName(e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs">Email (opcional)</Label>
                  <Input placeholder="email@exemplo.com" value={uEmail} onChange={(e) => setUEmail(e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs">Nome de usuário *</Label>
                  <Input
                    placeholder="joaosilva"
                    value={uUsername}
                    onChange={(e) => setUUsername(e.target.value.toLowerCase().replace(/\s+/g, ""))}
                  />
                </div>
                <div>
                  <Label className="text-xs">Senha *</Label>
                  <Input
                    type="text"
                    placeholder="mínimo 6 caracteres"
                    value={uPassword}
                    onChange={(e) => setUPassword(e.target.value)}
                  />
                </div>
                <div>
                  <Label className="text-xs">Validade</Label>
                  <DurationSelect value={uDuration} onChange={setUDuration} />
                </div>
                <div className="flex items-end">
                  <Button className="w-full" onClick={handleCreateUser} disabled={savingUser}>
                    <Plus className="w-4 h-4 mr-2" />
                    Criar acesso
                  </Button>
                </div>
              </div>
              <Button variant="ghost" size="sm" className="text-xs" onClick={() => copy(areaUrl, "Link da área copiado!")}>
                <Copy className="w-3 h-3 mr-2" /> Copiar link de login da área
              </Button>
            </div>

            <div className="flex-1 min-h-0 mt-2 overflow-y-auto overscroll-contain pr-3">
              <div className="space-y-2 pb-2">
                {loadingUsers ? (
                  <p className="text-sm text-muted-foreground text-center py-6">Carregando...</p>
                ) : users.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">
                    Nenhum usuário criado ainda
                  </p>
                ) : (
                  users.map((u) => {
                    const expired = isExpired(u);
                    return (
                      <div key={u.id} className="flex flex-col sm:flex-row sm:items-center gap-2 p-3 border rounded-md">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <code className="font-mono font-bold text-base">{u.username}</code>
                            {!u.is_active ? (
                              <Badge variant="destructive">Desativado</Badge>
                            ) : expired ? (
                              <Badge variant="destructive">Expirado</Badge>
                            ) : u.expires_at ? (
                              <Badge variant="secondary" className="gap-1">
                                <Clock className="w-3 h-3" /> até {new Date(u.expires_at).toLocaleString("pt-BR")}
                              </Badge>
                            ) : (
                              <Badge variant="outline">Sem expiração</Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 truncate">
                            {u.customer_name || "Aluno"}
                            {u.customer_email ? ` • ${u.customer_email}` : ""}
                            {u.last_login_at ? ` • último acesso ${new Date(u.last_login_at).toLocaleDateString("pt-BR")}` : ""}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          <Button size="sm" variant="outline" title="Redefinir senha" onClick={() => handleResetPassword(u)}>
                            <RefreshCw className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="outline" title={u.is_active ? "Desativar" : "Ativar"} onClick={() => toggleUserActive(u)}>
                            <Power className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="outline" title="Abrir área" onClick={() => window.open(areaUrl, "_blank")}>
                            <Lock className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="destructive" title="Excluir" onClick={() => deleteUser(u.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
