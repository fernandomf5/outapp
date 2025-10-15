import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, Copy, ExternalLink, TrendingUp, DollarSign, Users, MousePointer } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [clonedPages, setClonedPages] = useState<ClonedPage[]>([]);
  const [isCreateProgramOpen, setIsCreateProgramOpen] = useState(false);
  const [isClonePageOpen, setIsClonePageOpen] = useState(false);
  const [newProgram, setNewProgram] = useState({
    name: "",
    commission_percentage: "10",
    cookie_duration_days: "30"
  });
  const [pageToClone, setPageToClone] = useState("");

  useEffect(() => {
    if (user) {
      fetchPrograms();
      fetchAffiliates();
      fetchClonedPages();
    }
  }, [user]);

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

  const fetchAffiliates = async () => {
    const { data: programsData } = await supabase
      .from('affiliate_programs')
      .select('id')
      .eq('user_id', user!.id);

    if (programsData && programsData.length > 0) {
      const programIds = programsData.map(p => p.id);
      const { data, error } = await supabase
        .from('affiliates')
        .select('*')
        .in('program_id', programIds)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setAffiliates(data);
      }
    }
  };

  const fetchClonedPages = async () => {
    const { data: affiliatesData } = await supabase
      .from('affiliates')
      .select('id')
      .eq('user_id', user!.id);

    if (affiliatesData && affiliatesData.length > 0) {
      const affiliateIds = affiliatesData.map(a => a.id);
      const { data, error } = await supabase
        .from('cloned_pages')
        .select('*')
        .in('affiliate_id', affiliateIds)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setClonedPages(data);
      }
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
        name: newProgram.name,
        commission_percentage: parseFloat(newProgram.commission_percentage),
        cookie_duration_days: parseInt(newProgram.cookie_duration_days),
        user_id: user!.id
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
      
      // Criar conta de afiliado automaticamente
      const affiliateCode = `AFF${Date.now().toString(36).toUpperCase()}`;
      await supabase.from('affiliates').insert({
        program_id: data.id,
        user_id: user!.id,
        affiliate_code: affiliateCode
      });

      setNewProgram({ name: "", commission_percentage: "10", cookie_duration_days: "30" });
      setIsCreateProgramOpen(false);
      fetchAffiliates();
    }
  };

  const handleClonePage = async () => {
    if (!pageToClone || !affiliates.length) {
      toast({
        title: "Erro",
        description: "URL e conta de afiliado são necessários",
        variant: "destructive"
      });
      return;
    }

    const affiliateId = affiliates[0].id;
    const clonedUrl = `${window.location.origin}/aff/${affiliates[0].affiliate_code}`;

    const { data, error } = await supabase
      .from('cloned_pages')
      .insert({
        affiliate_id: affiliateId,
        original_url: pageToClone,
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
      setPageToClone("");
      setIsClonePageOpen(false);
    }
  };

  const copyAffiliateLink = (affiliate: Affiliate) => {
    const link = `${window.location.origin}/aff/${affiliate.affiliate_code}`;
    navigator.clipboard.writeText(link);
    toast({ title: "Link copiado!" });
  };

  const totalStats = affiliates.reduce((acc, aff) => ({
    clicks: acc.clicks + aff.total_clicks,
    conversions: acc.conversions + aff.total_conversions,
    commission: acc.commission + parseFloat(aff.total_commission.toString())
  }), { clicks: 0, conversions: 0, commission: 0 });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Sistema de Afiliados</h2>
        <div className="flex gap-2">
          <Dialog open={isClonePageOpen} onOpenChange={setIsClonePageOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <ExternalLink className="w-4 h-4 mr-2" />
                Clonar Página
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Clonar Página para Afiliado</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <Label>URL da Página Original</Label>
                  <Input
                    value={pageToClone}
                    onChange={(e) => setPageToClone(e.target.value)}
                    placeholder="https://example.com/produto"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    A página será clonada com seu código de afiliado
                  </p>
                </div>
                <Button onClick={handleClonePage} className="w-full gradient-primary">
                  Clonar Página
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={isCreateProgramOpen} onOpenChange={setIsCreateProgramOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-primary">
                <Plus className="w-4 h-4 mr-2" />
                Novo Programa
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Programa de Afiliados</DialogTitle>
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
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="bg-blue-500/10 p-3 rounded-lg">
              <MousePointer className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalStats.clicks}</p>
              <p className="text-sm text-muted-foreground">Total de Cliques</p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="bg-green-500/10 p-3 rounded-lg">
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalStats.conversions}</p>
              <p className="text-sm text-muted-foreground">Conversões</p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="bg-yellow-500/10 p-3 rounded-lg">
              <DollarSign className="w-5 h-5 text-yellow-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">R$ {totalStats.commission.toFixed(2)}</p>
              <p className="text-sm text-muted-foreground">Comissão Total</p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="bg-purple-500/10 p-3 rounded-lg">
              <Users className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{affiliates.length}</p>
              <p className="text-sm text-muted-foreground">Afiliados</p>
            </div>
          </div>
        </Card>
      </div>

      <Tabs defaultValue="programs" className="w-full">
        <TabsList>
          <TabsTrigger value="programs">Programas</TabsTrigger>
          <TabsTrigger value="affiliates">Afiliados</TabsTrigger>
          <TabsTrigger value="pages">Páginas Clonadas</TabsTrigger>
        </TabsList>

        <TabsContent value="programs" className="space-y-4">
          {programs.length === 0 ? (
            <Card className="p-8">
              <p className="text-center text-muted-foreground">
                Nenhum programa criado ainda
              </p>
            </Card>
          ) : (
            programs.map((program) => (
              <Card key={program.id} className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">{program.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      Comissão: {program.commission_percentage}% | Cookie: {program.cookie_duration_days} dias
                    </p>
                  </div>
                  <Badge variant={program.is_active ? "default" : "secondary"}>
                    {program.is_active ? "Ativo" : "Inativo"}
                  </Badge>
                </div>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="affiliates" className="space-y-4">
          {affiliates.length === 0 ? (
            <Card className="p-8">
              <p className="text-center text-muted-foreground">
                Nenhum afiliado cadastrado ainda
              </p>
            </Card>
          ) : (
            affiliates.map((affiliate) => (
              <Card key={affiliate.id} className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold">Código: {affiliate.affiliate_code}</h3>
                    <Badge variant="outline">{affiliate.status}</Badge>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => copyAffiliateLink(affiliate)}>
                    <Copy className="w-4 h-4 mr-2" />
                    Copiar Link
                  </Button>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Cliques</p>
                    <p className="font-semibold">{affiliate.total_clicks}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Conversões</p>
                    <p className="font-semibold">{affiliate.total_conversions}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Comissão</p>
                    <p className="font-semibold">R$ {parseFloat(affiliate.total_commission.toString()).toFixed(2)}</p>
                  </div>
                </div>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="pages" className="space-y-4">
          {clonedPages.length === 0 ? (
            <Card className="p-8">
              <p className="text-center text-muted-foreground">
                Nenhuma página clonada ainda
              </p>
            </Card>
          ) : (
            clonedPages.map((page) => (
              <Card key={page.id} className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-sm mb-2">Página Original:</h3>
                    <p className="text-xs text-muted-foreground mb-3">{page.original_url}</p>
                    <h3 className="font-semibold text-sm mb-2">Link de Afiliado:</h3>
                    <p className="text-xs text-primary">{page.cloned_url}</p>
                  </div>
                  <div className="flex gap-2">
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
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(page.cloned_url, '_blank')}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
