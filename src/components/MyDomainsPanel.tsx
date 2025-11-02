import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Globe, Trash2, Check, AlertCircle, Plus } from "lucide-react";
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

            {/* Instruções DNS */}
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-primary" />
                Configuração DNS
              </h4>
              <p className="text-sm text-muted-foreground mb-2">
                Após adicionar um domínio, configure os seguintes registros DNS:
              </p>
              <div className="space-y-1 text-sm font-mono bg-background p-3 rounded">
                <div><strong>Tipo:</strong> A</div>
                <div><strong>Nome:</strong> @ (ou www)</div>
                <div><strong>Valor:</strong> 185.158.133.1</div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                A propagação DNS pode levar até 72 horas
              </p>
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
