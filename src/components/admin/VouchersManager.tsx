import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Trash2, Ticket, Copy, CheckCircle2, User, Calendar } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";

interface Voucher {
  id: string;
  code: string;
  plan_id: string | null;
  duration_days: number | null;
  max_uses: number;
  current_uses: number;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
  plans?: { name: string } | null;
}

interface VoucherRedemption {
  id: string;
  voucher_id: string;
  user_id: string;
  redeemed_at: string;
  voucher_code?: string;
  user_name?: string;
  user_email?: string;
  plan_name?: string;
}

interface Feature {
  id: string;
  name: string;
  key: string;
  category: string | null;
}

export const VouchersManager = () => {
  const { toast } = useToast();
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [redemptions, setRedemptions] = useState<VoucherRedemption[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [features, setFeatures] = useState<Feature[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [useCustomFeatures, setUseCustomFeatures] = useState(false);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [newVoucher, setNewVoucher] = useState({
    code: "",
    plan_id: "",
    duration_days: "",
    max_uses: 1,
    expires_at: "",
    isLifetime: false,
    allFeatures: false,
    isExpiredTrial: false
  });

  useEffect(() => {
    fetchVouchers();
    fetchRedemptions();
    fetchPlans();
    fetchFeatures();
  }, []);

  const fetchVouchers = async () => {
    const { data, error } = await supabase
      .from('vouchers')
      .select('*, plans(name)')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setVouchers(data);
    }
  };

  const fetchRedemptions = async () => {
    // Buscar resgates
    const { data: redemptionsData, error: redemptionsError } = await supabase
      .from('voucher_redemptions')
      .select('*')
      .order('redeemed_at', { ascending: false });

    if (redemptionsError || !redemptionsData) {
      console.error('Error fetching redemptions:', redemptionsError);
      return;
    }

    // Buscar vouchers e profiles relacionados
    const voucherIds = [...new Set(redemptionsData.map(r => r.voucher_id))];
    const userIds = [...new Set(redemptionsData.map(r => r.user_id))];

    const [vouchersResult, profilesResult] = await Promise.all([
      supabase.from('vouchers').select('id, code, plans(name)').in('id', voucherIds),
      supabase.from('profiles').select('user_id, full_name, email').in('user_id', userIds)
    ]);

    // Merge data
    const enrichedRedemptions: VoucherRedemption[] = redemptionsData.map(r => {
      const voucher = vouchersResult.data?.find(v => v.id === r.voucher_id);
      const profile = profilesResult.data?.find(p => p.user_id === r.user_id);
      return {
        ...r,
        voucher_code: voucher?.code || 'N/A',
        plan_name: voucher?.plans?.name || 'N/A',
        user_name: profile?.full_name || 'N/A',
        user_email: profile?.email || 'N/A'
      };
    });

    setRedemptions(enrichedRedemptions);
  };

  const fetchPlans = async () => {
    const { data, error } = await supabase
      .from('plans')
      .select('*')
      .eq('is_active', true);

    if (!error && data) {
      setPlans(data);
    }
  };

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

  const generateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewVoucher({ ...newVoucher, code });
  };

  const handleCreate = async () => {
    if (!newVoucher.code) {
      toast({
        title: "Erro",
        description: "Código é obrigatório",
        variant: "destructive"
      });
      return;
    }

    if (!useCustomFeatures && !newVoucher.plan_id && !newVoucher.isExpiredTrial) {
      toast({
        title: "Erro",
        description: "Selecione um plano, configure recursos customizados ou marque como teste expirado",
        variant: "destructive"
      });
      return;
    }

    if (useCustomFeatures && !newVoucher.isLifetime && !newVoucher.duration_days) {
      toast({
        title: "Erro",
        description: "Defina a duração ou marque como vitalício",
        variant: "destructive"
      });
      return;
    }

    if (useCustomFeatures && !newVoucher.allFeatures && selectedFeatures.length === 0) {
      toast({
        title: "Erro",
        description: "Selecione pelo menos um recurso ou marque 'Todas as Features'",
        variant: "destructive"
      });
      return;
    }

    // Buscar todas as features se "Todas as Features" estiver marcado
    let featuresToUse = selectedFeatures;
    if (newVoucher.allFeatures) {
      const { data: allFeatures } = await supabase
        .from('features')
        .select('id')
        .eq('is_active', true);
      featuresToUse = allFeatures?.map(f => f.id) || [];
    }

    let finalPlanId = newVoucher.plan_id;

    // Se usar recursos customizados, criar plano oculto primeiro
    if (useCustomFeatures) {
      const planName = newVoucher.allFeatures 
        ? `Voucher ${newVoucher.code} - ACESSO TOTAL` 
        : `Voucher ${newVoucher.code}`;
      const planDesc = newVoucher.isLifetime 
        ? `Plano VITALÍCIO ativado por voucher ${newVoucher.code}`
        : `Plano ativado por voucher ${newVoucher.code} com ${parseInt(newVoucher.duration_days)} dias`;
      
      // Criar plano oculto para este voucher
      const { data: newPlan, error: planError } = await supabase
        .from('plans')
        .insert({
          name: planName,
          description: planDesc,
          price: 0,
          duration_days: newVoucher.isLifetime ? null : parseInt(newVoucher.duration_days),
          plan_type: 'chatbot',
          is_active: false,
          features: null
        })
        .select()
        .single();

      if (planError) {
        toast({ 
          title: "Erro ao criar plano do voucher", 
          description: planError.message, 
          variant: "destructive" 
        });
        return;
      }

      finalPlanId = newPlan.id;

      // Vincular features ao plano
      const planFeatureInserts = featuresToUse.map((featureId) => ({
        plan_id: newPlan.id,
        feature_id: featureId
      }));
      
      const { error: pfError } = await supabase
        .from('plan_features')
        .insert(planFeatureInserts);

      if (pfError) {
        toast({ 
          title: "Erro ao vincular recursos ao plano", 
          description: pfError.message, 
          variant: "destructive" 
        });
        return;
      }

      // Guardar vínculo voucher x features (auditoria)
      const featureInserts = featuresToUse.map(featureId => ({
        voucher_id: newVoucher.code, // Temporário, será atualizado depois
        feature_id: featureId
      }));
      
      // Será inserido depois que o voucher for criado
    }

    // Inserir voucher com plan_id definido
    const voucherData = {
      code: newVoucher.code,
      plan_id: newVoucher.isExpiredTrial ? null : finalPlanId,
      duration_days: null, // Não usado mais, a duração vem do plano
      max_uses: newVoucher.max_uses,
      expires_at: newVoucher.expires_at || null,
      is_expired_trial: newVoucher.isExpiredTrial
    };

    const { data: voucherInserted, error: voucherError } = await supabase
      .from('vouchers')
      .insert(voucherData)
      .select()
      .single();

    if (voucherError) {
      toast({
        title: "Erro ao criar voucher",
        description: voucherError.message,
        variant: "destructive"
      });
      return;
    }

    // Se usou recursos customizados, salvar vínculo de auditoria
    if (useCustomFeatures && voucherInserted) {
      const featureInserts = featuresToUse.map(featureId => ({
        voucher_id: voucherInserted.id,
        feature_id: featureId
      }));
      await supabase.from('voucher_features').insert(featureInserts);
    }

    toast({
      title: "Voucher criado!",
      description: `Código: ${newVoucher.code}`
    });
    fetchVouchers();
    setIsDialogOpen(false);
    setNewVoucher({ code: "", plan_id: "", duration_days: "", max_uses: 1, expires_at: "", isLifetime: false, allFeatures: false, isExpiredTrial: false });
    setSelectedFeatures([]);
    setUseCustomFeatures(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from('vouchers')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: "Erro ao excluir",
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Voucher excluído"
      });
      fetchVouchers();
    }
  };

  const handleToggleStatus = async (voucher: Voucher) => {
    const { error } = await supabase
      .from('vouchers')
      .update({ is_active: !voucher.is_active })
      .eq('id', voucher.id);

    if (!error) {
      fetchVouchers();
      toast({
        title: voucher.is_active ? "Voucher desativado" : "Voucher ativado"
      });
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: "Código copiado!",
      description: code
    });
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Ticket className="w-6 h-6 text-primary" />
          Gerenciar Vouchers
        </h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-primary">
              <Plus className="w-4 h-4 mr-2" />
              Novo Voucher
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Novo Voucher</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>Código do Voucher *</Label>
                <div className="flex gap-2">
                  <Input
                    value={newVoucher.code}
                    onChange={(e) => setNewVoucher({ ...newVoucher, code: e.target.value.toUpperCase() })}
                    placeholder="Ex: PROMO2024"
                    maxLength={20}
                  />
                  <Button onClick={generateCode} variant="outline">
                    Gerar
                  </Button>
                </div>
              </div>

              <div className="flex items-center space-x-2 p-3 bg-orange-50 dark:bg-orange-900/20 rounded border border-orange-200 dark:border-orange-800">
                <Checkbox
                  id="expiredTrial"
                  checked={newVoucher.isExpiredTrial}
                  onCheckedChange={(checked) => {
                    setNewVoucher({ 
                      ...newVoucher, 
                      isExpiredTrial: checked as boolean,
                      plan_id: checked ? "" : newVoucher.plan_id
                    });
                  }}
                />
                <Label htmlFor="expiredTrial" className="cursor-pointer text-sm font-bold text-orange-700 dark:text-orange-400">
                  ⏰ Teste Expirado (cancela assinatura do usuário)
                </Label>
              </div>

              {!newVoucher.isExpiredTrial && (
                <div>
                  <Label>Plano *</Label>
                  <Select value={newVoucher.plan_id} onValueChange={(v) => setNewVoucher({ ...newVoucher, plan_id: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um plano" />
                    </SelectTrigger>
                    <SelectContent>
                      {plans.map((plan) => (
                        <SelectItem key={plan.id} value={plan.id}>
                          {plan.name} - R$ {plan.price}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {false && (
                <>
                  <div>
                    <Label>Duração (dias) *</Label>
                    <Input
                      type="number"
                      min="1"
                      value={newVoucher.duration_days}
                      onChange={(e) => setNewVoucher({ ...newVoucher, duration_days: e.target.value })}
                      placeholder="Ex: 30"
                      disabled={newVoucher.isLifetime}
                    />
                    <div className="flex items-center space-x-2 mt-2 p-2 bg-green-50 rounded border border-green-200">
                      <Checkbox
                        id="lifetime"
                        checked={newVoucher.isLifetime}
                        onCheckedChange={(checked) => setNewVoucher({ ...newVoucher, isLifetime: checked as boolean })}
                      />
                      <Label htmlFor="lifetime" className="cursor-pointer text-sm font-bold text-green-700">
                        ⭐ Vitalício (sem expiração)
                      </Label>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center space-x-2 mb-3 p-3 bg-purple-50 rounded border border-purple-200">
                      <Checkbox
                        id="allFeatures"
                        checked={newVoucher.allFeatures}
                        onCheckedChange={(checked) => {
                          setNewVoucher({ ...newVoucher, allFeatures: checked as boolean });
                          if (checked) setSelectedFeatures([]);
                        }}
                      />
                      <Label htmlFor="allFeatures" className="cursor-pointer text-sm font-bold text-purple-700">
                        ✨ TODAS AS FEATURES (Acesso Total)
                      </Label>
                    </div>
                    
                    <Label>Funcionalidades a Liberar</Label>
                    <div className="border rounded-lg p-3 max-h-60 overflow-y-auto space-y-2">
                      {features.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          Nenhum recurso disponível
                        </p>
                      ) : (
                        features.map((feature) => (
                          <div key={feature.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`feature-${feature.id}`}
                              checked={newVoucher.allFeatures || selectedFeatures.includes(feature.id)}
                              disabled={newVoucher.allFeatures}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedFeatures([...selectedFeatures, feature.id]);
                                } else {
                                  setSelectedFeatures(selectedFeatures.filter(id => id !== feature.id));
                                }
                              }}
                            />
                            <Label htmlFor={`feature-${feature.id}`} className="cursor-pointer flex-1">
                              <div className="font-medium text-sm">{feature.name}</div>
                              {feature.category && (
                                <div className="text-xs text-muted-foreground">{feature.category}</div>
                              )}
                            </Label>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}

              <div>
                <Label>Número de Usos</Label>
                <Input
                  type="number"
                  min="1"
                  value={newVoucher.max_uses}
                  onChange={(e) => setNewVoucher({ ...newVoucher, max_uses: parseInt(e.target.value) })}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Quantas vezes este voucher pode ser usado
                </p>
              </div>

              <div>
                <Label>Data de Expiração (opcional)</Label>
                <Input
                  type="datetime-local"
                  value={newVoucher.expires_at}
                  onChange={(e) => setNewVoucher({ ...newVoucher, expires_at: e.target.value })}
                />
              </div>

              <Button onClick={handleCreate} className="w-full gradient-primary">
                Criar Voucher
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="vouchers" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="vouchers">
            Vouchers ({vouchers.length})
          </TabsTrigger>
          <TabsTrigger value="redemptions">
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Utilizados ({redemptions.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="vouchers">
          <div className="space-y-4">
            {vouchers.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Nenhum voucher criado ainda</p>
            ) : (
              vouchers.map((voucher) => (
                <Card key={voucher.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <code className="text-lg font-mono font-bold">{voucher.code}</code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopyCode(voucher.code)}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Badge className={voucher.is_active ? 'bg-success/20 text-success' : 'bg-gray-500/20 text-gray-500'}>
                          {voucher.is_active ? 'Ativo' : 'Inativo'}
                        </Badge>
                        {voucher.current_uses > 0 && (
                          <Badge variant="secondary" className="bg-primary/20 text-primary">
                            {voucher.current_uses}x usado
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        {(voucher as any).is_expired_trial ? (
                          <p className="text-orange-600 font-semibold">⏰ Teste Expirado (cancela assinatura)</p>
                        ) : voucher.plans ? (
                          <p>Plano: <span className="font-semibold">{voucher.plans.name}</span></p>
                        ) : (
                          <>
                            <p>Tipo: <span className="font-semibold">Recursos Customizados</span></p>
                            {voucher.duration_days && (
                              <p>Duração: <span className="font-semibold">{voucher.duration_days} dias</span></p>
                            )}
                          </>
                        )}
                        <p>Usos: {voucher.current_uses} / {voucher.max_uses}</p>
                        {voucher.expires_at && (
                          <p>Expira: {new Date(voucher.expires_at).toLocaleDateString('pt-BR')}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleStatus(voucher)}
                      >
                        {voucher.is_active ? 'Desativar' : 'Ativar'}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(voucher.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="redemptions">
          <div className="space-y-4">
            {redemptions.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle2 className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-muted-foreground">Nenhum voucher foi utilizado ainda</p>
              </div>
            ) : (
              redemptions.map((redemption) => (
                <Card key={redemption.id} className="p-4 border-l-4 border-l-success">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Badge className="bg-success/20 text-success">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Utilizado
                        </Badge>
                        <code className="text-lg font-mono font-bold">{redemption.voucher_code}</code>
                      </div>
                      <div className="text-sm space-y-2 mt-3">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <User className="w-4 h-4" />
                          <div>
                            <span className="font-medium text-foreground">{redemption.user_name}</span>
                            <span className="mx-2">•</span>
                            <span>{redemption.user_email}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Ticket className="w-4 h-4" />
                          <span>Plano: <span className="font-semibold text-foreground">{redemption.plan_name}</span></span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          <span>
                            Resgatado em: {format(new Date(redemption.redeemed_at), 'dd/MM/yyyy HH:mm')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
};
