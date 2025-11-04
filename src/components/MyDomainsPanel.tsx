import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Globe, Trash2, Check, AlertCircle, Plus, Lock, Link2, HelpCircle, Users } from "lucide-react";
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

interface Domain {
  id: string;
  domain: string;
  is_verified: boolean;
  is_active: boolean;
  created_at: string;
}

export function MyDomainsPanel() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [domains, setDomains] = useState<Domain[]>([]);
  const [newDomain, setNewDomain] = useState("");
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchDomains();
    }
  }, [user]);

  const fetchDomains = async () => {
    const { data, error } = await supabase
      .from("user_domains")
      .select("*")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setDomains(data);
    }
  };

  const handleAddDomain = async () => {
    if (!newDomain.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, insira um domínio válido",
        variant: "destructive",
      });
      return;
    }

    const domainRegex = /^[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,}$/i;
    if (!domainRegex.test(newDomain.trim())) {
      toast({
        title: "Erro",
        description: "Formato de domínio inválido. Use algo como: seudominio.com",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    const { error } = await supabase
      .from("user_domains")
      .insert({
        user_id: user!.id,
        domain: newDomain.trim().toLowerCase(),
        is_verified: false,
        is_active: true,
      });

    if (error) {
      toast({
        title: "Erro ao adicionar domínio",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Domínio adicionado!",
        description: "Configure os registros DNS para ativar o domínio.",
      });
      setNewDomain("");
      fetchDomains();
    }

    setLoading(false);
  };

  const handleDeleteDomain = async () => {
    if (!deletingId) return;

    const { error } = await supabase
      .from("user_domains")
      .delete()
      .eq("id", deletingId);

    if (error) {
      toast({
        title: "Erro ao remover domínio",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Domínio removido com sucesso",
      });
      fetchDomains();
    }

    setDeletingId(null);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Meus Domínios</CardTitle>
          <CardDescription>
            Gerencie seus domínios personalizados para usar em páginas clonadas, Link na Bio e muito mais
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Adicionar novo domínio */}
            <div className="flex gap-2">
              <div className="flex-1">
                <Label htmlFor="newDomain">Adicionar Domínio</Label>
                <Input
                  id="newDomain"
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                  placeholder="seudominio.com"
                  disabled={loading}
                />
              </div>
              <Button
                onClick={handleAddDomain}
                disabled={loading}
                className="mt-auto gradient-primary"
              >
                <Plus className="w-4 h-4 mr-2" />
                Adicionar
              </Button>
            </div>

            {/* Instruções DNS Detalhadas */}
            <div className="space-y-6">
              <div className="p-6 bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg border border-primary/20">
                <div className="flex items-center justify-center mb-4">
                  <Lock className="w-12 h-12 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-center mb-6">Como Configurar Seu Domínio Customizado</h3>
                
                <div className="space-y-6">
                  <div className="space-y-3">
                    <h4 className="font-semibold text-base flex items-center gap-2">
                      <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary text-primary-foreground text-sm font-bold">1</span>
                      Adicione Seu Domínio
                    </h4>
                    <p className="text-sm text-muted-foreground pl-9">
                      No campo acima, digite o domínio que você possui (exemplo: <code className="bg-background px-2 py-0.5 rounded text-xs font-mono">seudominio.com.br</code>) e clique em "Adicionar"
                    </p>
                  </div>
                  
                  <div className="space-y-3">
                    <h4 className="font-semibold text-base flex items-center gap-2">
                      <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary text-primary-foreground text-sm font-bold">2</span>
                      Configure os Registros DNS
                    </h4>
                    <p className="text-sm text-muted-foreground pl-9 mb-3">
                      Acesse o painel do seu provedor de domínio (Registro.br, GoDaddy, Hostgator, etc.) e adicione estes registros DNS:
                    </p>
                    
                    <div className="pl-9 space-y-3">
                      <div className="bg-background p-4 rounded-md border border-border">
                        <p className="text-xs font-semibold mb-3 text-primary">📍 Registro A (Domínio Raiz)</p>
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-muted-foreground w-16">Tipo:</span>
                            <code className="bg-muted px-3 py-1 rounded text-sm font-mono">A</code>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-muted-foreground w-16">Nome:</span>
                            <code className="bg-muted px-3 py-1 rounded text-sm font-mono">@</code>
                            <span className="text-xs text-muted-foreground">(ou deixe em branco)</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-muted-foreground w-16">Valor:</span>
                            <code className="bg-primary/10 px-3 py-1 rounded text-sm font-mono font-bold text-primary">185.158.133.1</code>
                          </div>
                        </div>
                      </div>

                      <div className="bg-background p-4 rounded-md border border-border">
                        <p className="text-xs font-semibold mb-3 text-primary">🌐 Registro A (Subdomínio WWW)</p>
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-muted-foreground w-16">Tipo:</span>
                            <code className="bg-muted px-3 py-1 rounded text-sm font-mono">A</code>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-muted-foreground w-16">Nome:</span>
                            <code className="bg-muted px-3 py-1 rounded text-sm font-mono">www</code>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-muted-foreground w-16">Valor:</span>
                            <code className="bg-primary/10 px-3 py-1 rounded text-sm font-mono font-bold text-primary">185.158.133.1</code>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="pl-9 mt-3 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                      <p className="text-xs font-semibold text-destructive mb-1">⚠️ Atenção:</p>
                      <p className="text-xs text-muted-foreground">
                        Remova quaisquer outros registros A ou CNAME conflitantes para o mesmo domínio/subdomínio antes de adicionar os novos.
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <h4 className="font-semibold text-base flex items-center gap-2">
                      <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary text-primary-foreground text-sm font-bold">3</span>
                      Aguarde a Propagação DNS
                    </h4>
                    <p className="text-sm text-muted-foreground pl-9">
                      A propagação pode levar de alguns minutos até 72 horas. Você pode verificar o status em{" "}
                      <a href="https://dnschecker.org" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold">
                        DNSChecker.org ↗
                      </a>
                    </p>
                  </div>
                  
                  <div className="space-y-3">
                    <h4 className="font-semibold text-base flex items-center gap-2">
                      <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary text-primary-foreground text-sm font-bold">4</span>
                      Use o Domínio nas Suas Ferramentas
                    </h4>
                    <p className="text-sm text-muted-foreground pl-9 mb-2">
                      Após a verificação ✓, seu domínio aparecerá automaticamente nas listas suspensas das seguintes ferramentas:
                    </p>
                    <div className="pl-9 grid grid-cols-1 md:grid-cols-2 gap-2">
                      <div className="flex items-center gap-2 text-sm bg-background p-2 rounded border">
                        <Globe className="w-4 h-4 text-primary" />
                        <span>Clonador de Página</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm bg-background p-2 rounded border">
                        <Link2 className="w-4 h-4 text-primary" />
                        <span>Link na Bio</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm bg-background p-2 rounded border">
                        <HelpCircle className="w-4 h-4 text-primary" />
                        <span>Criador de Quiz</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm bg-background p-2 rounded border">
                        <Users className="w-4 h-4 text-primary" />
                        <span>Área de Membros</span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground pl-9 mt-2">
                      Exemplo: <code className="bg-background px-2 py-0.5 rounded font-mono">seudominio.com.br/meu-slug</code>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Lista de domínios */}
            <div className="space-y-3">
              <h4 className="font-semibold">Domínios Cadastrados</h4>
              {domains.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum domínio cadastrado ainda
                </div>
              ) : (
                domains.map((domain) => (
                  <div
                    key={domain.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Globe className="w-5 h-5 text-primary" />
                      <div>
                        <div className="font-medium">{domain.domain}</div>
                        <div className="text-xs text-muted-foreground">
                          Adicionado em {new Date(domain.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {domain.is_verified ? (
                        <Badge className="bg-green-500/20 text-green-500">
                          <Check className="w-3 h-3 mr-1" />
                          Verificado
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-yellow-500 border-yellow-500">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          Pendente
                        </Badge>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeletingId(domain.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dialog de confirmação de exclusão */}
      <AlertDialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Domínio</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este domínio? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteDomain}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
