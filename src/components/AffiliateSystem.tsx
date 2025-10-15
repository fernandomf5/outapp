import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Users, Copy, DollarSign, MousePointerClick, TrendingUp, Globe } from "lucide-react";

interface AffiliateProgram {
  id: string;
  name: string;
  commission_percentage: number;
  cookie_duration_days: number;
  is_active: boolean;
  created_at: string;
}

interface Affiliate {
  id: string;
  affiliate_code: string;
  custom_domain: string | null;
  total_clicks: number;
  total_conversions: number;
  total_commission: number;
  status: string;
  created_at: string;
}

interface ClonedPage {
  id: string;
  original_url: string;
  cloned_url: string;
  is_active: boolean;
  created_at: string;
}

export const AffiliateSystem = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [programs, setPrograms] = useState<AffiliateProgram[]>([]);
  const [myAffiliates, setMyAffiliates] = useState<Affiliate[]>([]);
  const [clonedPages, setClonedPages] = useState<ClonedPage[]>([]);
  const [isProgramDialogOpen, setIsProgramDialogOpen] = useState(false);
  const [isCloneDialogOpen, setIsCloneDialogOpen] = useState(false);
  const [selectedAffiliate, setSelectedAffiliate] = useState<Affiliate | null>(null);
  const [newProgram, setNewProgram] = useState({
    name: "",
    commission_percentage: "10",
    cookie_duration_days: "30"
  });
  const [cloneData, setCloneData] = useState({
    original_url: "",
    custom_domain: ""
  });

  useEffect(() => {
    if (user) {
      fetchPrograms();
      fetchMyAffiliates();
    }
  }, [user]);

  useEffect(() => {
    if (selectedAffiliate) {
      fetchClonedPages(selectedAffiliate.id);
    }
  }, [selectedAffiliate]);

  const fetchPrograms = async () => {
    const { data, error } = await supabase
      .from('affiliate_programs')
      .select('*')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setPrograms(data);
    }
  };

  const fetchMyAffiliates = async () => {
    const { data, error } = await supabase
      .from('affiliates')
      .select('*')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setMyAffiliates(data);
      if (data.length > 0 && !selectedAffiliate) {
        setSelectedAffiliate(data[0]);
      }
    }
  };

  const fetchClonedPages = async (affiliateId: string) => {
    const { data, error } = await supabase
      .from('cloned_pages')
      .select('*')
      .eq('affiliate_id', affiliateId)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setClonedPages(data);
    }
  };

  const handleCreateProgram = async () => {
    if (!newProgram.name) {
      toast({
        title: "Erro",
        description: "Nome do programa é obrigatório",
        variant: "destructive"
      });
      return;
    }

    const { data, error } = await supabase
      .from('affiliate_programs')
      .insert({
        ...newProgram,
        user_id: user!.id,
        commission_percentage: parseFloat(newProgram.commission_percentage),
        cookie_duration_days: parseInt(newProgram.cookie_duration_days)
      })
      .select()
      .single();

    if (error) {
      toast({
        title: "Erro ao criar programa",
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({ title: "Programa criado com sucesso!" });
      setPrograms([data, ...programs]);
      setNewProgram({ name: "", commission_percentage: "10", cookie_duration_days: "30" });
      setIsProgramDialogOpen(false);

      // Auto-create affiliate account for the user
      await createAffiliateAccount(data.id);
    }
  };

  const createAffiliateAccount = async (programId: string) => {
    const affiliateCode = `AFF-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    
    const { data, error } = await supabase
      .from('affiliates')
      .insert({
        program_id: programId,
        user_id: user!.id,
        affiliate_code: affiliateCode
      })
      .select()
      .single();

    if (!error && data) {
      setMyAffiliates([data, ...myAffiliates]);
      if (!selectedAffiliate) {
        setSelectedAffiliate(data);
      }
    }
  };

  const handleClonePage = async () => {
    if (!cloneData.original_url || !selectedAffiliate) {
      toast({
        title: "Erro",
        description: "URL é obrigatória",
        variant: "destructive"
      });
      return;
    }

    const clonedUrl = `${window.location.origin}/a/${selectedAffiliate.affiliate_code}`;

    const { data, error } = await supabase
      .from('cloned_pages')
      .insert({
        affiliate_id: selectedAffiliate.id,
        original_url: cloneData.original_url,
        cloned_url: clonedUrl
      })
      .select()
      .single();

    if (error) {
      toast({
        title: "Erro ao clonar página",
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({ title: "Página clonada com sucesso!" });
      setClonedPages([data, ...clonedPages]);
      setCloneData({ original_url: "", custom_domain: "" });
      setIsCloneDialogOpen(false);
    }
  };

  const copyAffiliateLink = (code: string) => {
    const link = `${window.location.origin}/a/${code}`;
    navigator.clipboard.writeText(link);
    toast({ title: "Link copiado!" });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Sistema de Afiliados</h2>
        <Dialog open={isProgramDialogOpen} onOpenChange={setIsProgramDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-primary">
              <Users className="w-4 h-4 mr-2" />
              Criar Programa
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo Programa de Afiliados</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>Nome do Programa *</Label>
                <Input
                  value={newProgram.name}
                  onChange={(e) => setNewProgram({ ...newProgram, name: e.target.value })}
                  placeholder="Ex: Programa VIP"
                />
              </div>
              <div>
                <Label>Comissão (%)</Label>
                <Input
                  type="number"
                  value={newProgram.commission_percentage}
                  onChange={(e) => setNewProgram({ ...newProgram, commission_percentage: e.target.value })}
                  placeholder="10"
                />
              </div>
              <div>
                <Label>Duração do Cookie (dias)</Label>
                <Input
                  type="number"
                  value={newProgram.cookie_duration_days}
                  onChange={(e) => setNewProgram({ ...newProgram, cookie_duration_days: e.target.value })}
                  placeholder="30"
                />
              </div>
              <Button onClick={handleCreateProgram} className="w-full gradient-primary">
                Criar Programa
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="programs">Meus Programas</TabsTrigger>
          <TabsTrigger value="pages">Páginas Clonadas</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-primary/10 p-3 rounded-xl">
                  <MousePointerClick className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold">
                    {myAffiliates.reduce((acc, aff) => acc + aff.total_clicks, 0)}
                  </h3>
                  <p className="text-sm text-muted-foreground">Total de Clicks</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-success/10 p-3 rounded-xl">
                  <TrendingUp className="w-6 h-6 text-success" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold">
                    {myAffiliates.reduce((acc, aff) => acc + aff.total_conversions, 0)}
                  </h3>
                  <p className="text-sm text-muted-foreground">Conversões</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-warning/10 p-3 rounded-xl">
                  <DollarSign className="w-6 h-6 text-warning" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold">
                    R$ {myAffiliates.reduce((acc, aff) => acc + parseFloat(aff.total_commission.toString()), 0).toFixed(2)}
                  </h3>
                  <p className="text-sm text-muted-foreground">Comissão Total</p>
                </div>
              </div>
            </Card>
          </div>

          <Card className="p-6">
            <h3 className="font-semibold mb-4">Meus Links de Afiliado</h3>
            <div className="space-y-3">
              {myAffiliates.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Crie um programa de afiliados para começar
                </p>
              ) : (
                myAffiliates.map((affiliate) => (
                  <Card key={affiliate.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-medium">{affiliate.affiliate_code}</p>
                        <p className="text-sm text-muted-foreground">
                          {window.location.origin}/a/{affiliate.affiliate_code}
                        </p>
                        <div className="flex gap-4 mt-2">
                          <span className="text-xs text-muted-foreground">
                            Clicks: {affiliate.total_clicks}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            Conversões: {affiliate.total_conversions}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            Comissão: R$ {parseFloat(affiliate.total_commission.toString()).toFixed(2)}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant={affiliate.status === 'active' ? 'default' : 'secondary'}>
                          {affiliate.status}
                        </Badge>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyAffiliateLink(affiliate.affiliate_code)}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="programs">
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Programas ({programs.length})</h3>
            <div className="space-y-3">
              {programs.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Nenhum programa criado ainda
                </p>
              ) : (
                programs.map((program) => (
                  <Card key={program.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold">{program.name}</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          Comissão: {program.commission_percentage}% | 
                          Cookie: {program.cookie_duration_days} dias
                        </p>
                      </div>
                      <Badge variant={program.is_active ? 'default' : 'secondary'}>
                        {program.is_active ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="pages">
          <div className="space-y-4">
            <div className="flex justify-end">
              <Dialog open={isCloneDialogOpen} onOpenChange={setIsCloneDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" disabled={!selectedAffiliate}>
                    <Globe className="w-4 h-4 mr-2" />
                    Clonar Página
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Clonar Página</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <div>
                      <Label>URL da Página Original *</Label>
                      <Input
                        value={cloneData.original_url}
                        onChange={(e) => setCloneData({ ...cloneData, original_url: e.target.value })}
                        placeholder="https://exemplo.com/pagina"
                      />
                    </div>
                    <Button onClick={handleClonePage} className="w-full gradient-primary">
                      Clonar Página
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <Card className="p-6">
              <h3 className="font-semibold mb-4">Páginas Clonadas ({clonedPages.length})</h3>
              <div className="space-y-3">
                {clonedPages.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhuma página clonada ainda
                  </p>
                ) : (
                  clonedPages.map((page) => (
                    <Card key={page.id} className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Globe className="w-4 h-4 text-primary" />
                            <h4 className="font-semibold">Página Clonada</h4>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Original: {page.original_url}
                          </p>
                          <p className="text-sm text-primary mt-1">
                            Clone: {page.cloned_url}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Badge variant={page.is_active ? 'default' : 'secondary'}>
                            {page.is_active ? 'Ativa' : 'Inativa'}
                          </Badge>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              navigator.clipboard.writeText(page.cloned_url);
                              toast({ title: "Link copiado!" });
                            }}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
