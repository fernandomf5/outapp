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
import { Plus, Trash2, Ticket, Copy } from "lucide-react";

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

interface Feature {
  id: string;
  name: string;
  key: string;
  category: string | null;
}

export const VouchersManager = () => {
  const { toast } = useToast();
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
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
    allFeatures: false
  });

  useEffect(() => {
    fetchVouchers();
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

    if (!useCustomFeatures && !newVoucher.plan_id) {
      toast({
        title: "Erro",
        description: "Selecione um plano ou configure recursos customizados",
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

    // Inserir voucher
    const voucherData = {
      code: newVoucher.code,
      plan_id: useCustomFeatures ? null : newVoucher.plan_id,
      duration_days: useCustomFeatures ? (newVoucher.isLifetime ? null : parseInt(newVoucher.duration_days)) : null,
      max_uses: newVoucher.max_uses,
      expires_at: newVoucher.expires_at || null
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

    // Se usar recursos customizados, criar plano oculto e vincular ao voucher
    if (useCustomFeatures && voucherInserted) {
      // 1) Guardar o vínculo voucher x features (para auditoria/gestão)
      const featureInserts = featuresToUse.map(featureId => ({
        voucher_id: voucherInserted.id,
        feature_id: featureId
      }));
      const { error: featuresError } = await supabase
        .from('voucher_features')
        .insert(featureInserts);
      if (featuresError) {
        toast({ title: "Erro ao adicionar recursos", description: featuresError.message, variant: "destructive" });
        return;
      }

      // 2) Criar um plano "oculto" específico deste voucher (admin pode inserir planos)
      const planName = newVoucher.allFeatures ? `Voucher ${voucherInserted.code} - ACESSO TOTAL` : `Voucher ${voucherInserted.code}`;
      const planDesc = newVoucher.isLifetime 
        ? `Plano VITALÍCIO ativado por voucher ${voucherInserted.code}`
        : `Plano ativado por voucher ${voucherInserted.code} com ${parseInt(newVoucher.duration_days)} dias`;
      
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
        toast({ title: "Erro ao criar plano do voucher", description: planError.message, variant: "destructive" });
        return;
      }

      // 3) Ligar as funcionalidades marcadas ao plano criado
      const planFeatureInserts = featuresToUse.map((featureId) => ({
        plan_id: newPlan.id,
        feature_id: featureId
      }));
      const { error: pfError } = await supabase.from('plan_features').insert(planFeatureInserts);
      if (pfError) {
        toast({ title: "Erro ao vincular recursos ao plano", description: pfError.message, variant: "destructive" });
        return;
      }

      // 4) Atualizar o voucher para apontar para o plano criado
      const { error: updateVoucherError } = await supabase
        .from('vouchers')
        .update({ plan_id: newPlan.id })
        .eq('id', voucherInserted.id);
      if (updateVoucherError) {
        toast({ title: "Erro ao finalizar configuração do voucher", description: updateVoucherError.message, variant: "destructive" });
        return;
      }
    }

    toast({
      title: "Voucher criado!",
      description: `Código: ${newVoucher.code}`
    });
    fetchVouchers();
    setIsDialogOpen(false);
    setNewVoucher({ code: "", plan_id: "", duration_days: "", max_uses: 1, expires_at: "", isLifetime: false, allFeatures: false });
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

              <div className="flex items-center space-x-2 p-3 border rounded-lg">
                <Checkbox
                  id="custom-features"
                  checked={useCustomFeatures}
                  onCheckedChange={(checked) => setUseCustomFeatures(checked as boolean)}
                />
                <Label htmlFor="custom-features" className="cursor-pointer">
                  Configurar recursos e duração customizados
                </Label>
              </div>

              {!useCustomFeatures ? (
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
              ) : (
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
                  </div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    {voucher.plans ? (
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
    </Card>
  );
};
