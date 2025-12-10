import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, Copy, Trash2, Edit, Percent, DollarSign, Ticket, Users, TrendingUp } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface DiscountCoupon {
  id: string;
  code: string;
  description: string | null;
  discount_type: string;
  discount_value: number;
  min_purchase_amount: number;
  max_uses: number | null;
  uses_count: number;
  max_uses_per_user: number;
  valid_from: string;
  valid_until: string | null;
  applicable_plans: string[] | null;
  is_active: boolean;
  created_at: string;
}

interface CouponUsage {
  id: string;
  coupon_id: string;
  user_id: string;
  plan_id: string | null;
  original_price: number;
  discounted_price: number;
  discount_amount: number;
  used_at: string;
  coupon?: { code: string };
  user_email?: string;
}

interface Plan {
  id: string;
  name: string;
  price: number;
}

export const DiscountCouponsManager = () => {
  const { toast } = useToast();
  const [coupons, setCoupons] = useState<DiscountCoupon[]>([]);
  const [usages, setUsages] = useState<CouponUsage[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<DiscountCoupon | null>(null);

  const [formData, setFormData] = useState({
    code: "",
    description: "",
    discount_type: "percentage",
    discount_value: 10,
    min_purchase_amount: 0,
    max_uses: "",
    max_uses_per_user: 1,
    valid_from: new Date().toISOString().slice(0, 16),
    valid_until: "",
    applicable_plans: [] as string[],
    is_active: true,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([fetchCoupons(), fetchUsages(), fetchPlans()]);
    setLoading(false);
  };

  const fetchCoupons = async () => {
    const { data, error } = await supabase
      .from("discount_coupons")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setCoupons(data);
    }
  };

  const fetchUsages = async () => {
    const { data, error } = await supabase
      .from("coupon_usages")
      .select(`
        *,
        coupon:discount_coupons(code)
      `)
      .order("used_at", { ascending: false })
      .limit(100);

    if (!error && data) {
      // Fetch user emails
      const userIds = [...new Set(data.map(u => u.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, email")
        .in("user_id", userIds);

      const emailMap = new Map(profiles?.map(p => [p.user_id, p.email]) || []);
      
      setUsages(data.map(u => ({
        ...u,
        user_email: emailMap.get(u.user_id) || "Usuário desconhecido"
      })));
    }
  };

  const fetchPlans = async () => {
    const { data, error } = await supabase
      .from("plans")
      .select("id, name, price")
      .eq("is_active", true)
      .order("price");

    if (!error && data) {
      setPlans(data);
    }
  };

  const generateCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData(prev => ({ ...prev, code }));
  };

  const resetForm = () => {
    setFormData({
      code: "",
      description: "",
      discount_type: "percentage",
      discount_value: 10,
      min_purchase_amount: 0,
      max_uses: "",
      max_uses_per_user: 1,
      valid_from: new Date().toISOString().slice(0, 16),
      valid_until: "",
      applicable_plans: [],
      is_active: true,
    });
    setEditingCoupon(null);
  };

  const handleEdit = (coupon: DiscountCoupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      description: coupon.description || "",
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value,
      min_purchase_amount: coupon.min_purchase_amount,
      max_uses: coupon.max_uses?.toString() || "",
      max_uses_per_user: coupon.max_uses_per_user,
      valid_from: coupon.valid_from.slice(0, 16),
      valid_until: coupon.valid_until?.slice(0, 16) || "",
      applicable_plans: coupon.applicable_plans || [],
      is_active: coupon.is_active,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.code) {
      toast({ title: "Erro", description: "Código é obrigatório", variant: "destructive" });
      return;
    }

    const couponData = {
      code: formData.code.toUpperCase(),
      description: formData.description || null,
      discount_type: formData.discount_type,
      discount_value: formData.discount_value,
      min_purchase_amount: formData.min_purchase_amount,
      max_uses: formData.max_uses ? parseInt(formData.max_uses) : null,
      max_uses_per_user: formData.max_uses_per_user,
      valid_from: formData.valid_from,
      valid_until: formData.valid_until || null,
      applicable_plans: formData.applicable_plans.length > 0 ? formData.applicable_plans : null,
      is_active: formData.is_active,
    };

    let error;
    if (editingCoupon) {
      const result = await supabase
        .from("discount_coupons")
        .update(couponData)
        .eq("id", editingCoupon.id);
      error = result.error;
    } else {
      const result = await supabase
        .from("discount_coupons")
        .insert(couponData);
      error = result.error;
    }

    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "Sucesso", description: editingCoupon ? "Cupom atualizado!" : "Cupom criado!" });
    setDialogOpen(false);
    resetForm();
    fetchCoupons();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este cupom?")) return;

    const { error } = await supabase
      .from("discount_coupons")
      .delete()
      .eq("id", id);

    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "Sucesso", description: "Cupom excluído!" });
    fetchCoupons();
  };

  const handleToggleStatus = async (id: string, is_active: boolean) => {
    const { error } = await supabase
      .from("discount_coupons")
      .update({ is_active: !is_active })
      .eq("id", id);

    if (!error) {
      fetchCoupons();
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({ title: "Copiado!", description: `Código ${code} copiado` });
  };

  const totalDiscount = usages.reduce((acc, u) => acc + u.discount_amount, 0);
  const activeCoupons = coupons.filter(c => c.is_active).length;

  if (loading) {
    return <div className="flex items-center justify-center p-8">Carregando...</div>;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Ticket className="w-5 h-5" />
          Cupons de Desconto
        </CardTitle>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setDialogOpen(true); }}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Cupom
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingCoupon ? "Editar Cupom" : "Novo Cupom de Desconto"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Código do Cupom</Label>
                  <div className="flex gap-2">
                    <Input
                      value={formData.code}
                      onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                      placeholder="EX: DESCONTO10"
                    />
                    <Button type="button" variant="outline" onClick={generateCode}>
                      Gerar
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Tipo de Desconto</Label>
                  <Select
                    value={formData.discount_type}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, discount_type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Porcentagem (%)</SelectItem>
                      <SelectItem value="fixed">Valor Fixo (R$)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Valor do Desconto</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      value={formData.discount_value}
                      onChange={(e) => setFormData(prev => ({ ...prev, discount_value: parseFloat(e.target.value) || 0 }))}
                      className="pl-8"
                    />
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      {formData.discount_type === "percentage" ? "%" : "R$"}
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Valor Mínimo de Compra</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      value={formData.min_purchase_amount}
                      onChange={(e) => setFormData(prev => ({ ...prev, min_purchase_amount: parseFloat(e.target.value) || 0 }))}
                      className="pl-10"
                    />
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">R$</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Descrição (opcional)</Label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Ex: Cupom de boas-vindas"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Máximo de Usos (total)</Label>
                  <Input
                    type="number"
                    value={formData.max_uses}
                    onChange={(e) => setFormData(prev => ({ ...prev, max_uses: e.target.value }))}
                    placeholder="Ilimitado"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Máximo por Usuário</Label>
                  <Input
                    type="number"
                    value={formData.max_uses_per_user}
                    onChange={(e) => setFormData(prev => ({ ...prev, max_uses_per_user: parseInt(e.target.value) || 1 }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Válido a partir de</Label>
                  <Input
                    type="datetime-local"
                    value={formData.valid_from}
                    onChange={(e) => setFormData(prev => ({ ...prev, valid_from: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Válido até (opcional)</Label>
                  <Input
                    type="datetime-local"
                    value={formData.valid_until}
                    onChange={(e) => setFormData(prev => ({ ...prev, valid_until: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Planos Aplicáveis (deixe vazio para todos)</Label>
                <div className="flex flex-wrap gap-2 p-3 border rounded-lg">
                  {plans.map(plan => (
                    <Badge
                      key={plan.id}
                      variant={formData.applicable_plans.includes(plan.id) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => {
                        setFormData(prev => ({
                          ...prev,
                          applicable_plans: prev.applicable_plans.includes(plan.id)
                            ? prev.applicable_plans.filter(p => p !== plan.id)
                            : [...prev.applicable_plans, plan.id]
                        }));
                      }}
                    >
                      {plan.name} - R$ {plan.price}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                />
                <Label>Cupom ativo</Label>
              </div>

              <Button onClick={handleSave} className="w-full">
                {editingCoupon ? "Atualizar Cupom" : "Criar Cupom"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>

      <CardContent>
        {/* Métricas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="p-4">
            <div className="flex items-center gap-2">
              <Ticket className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Total de Cupons</p>
                <p className="text-2xl font-bold">{coupons.length}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-success" />
              <div>
                <p className="text-sm text-muted-foreground">Cupons Ativos</p>
                <p className="text-2xl font-bold">{activeCoupons}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Usos Totais</p>
                <p className="text-2xl font-bold">{usages.length}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-warning" />
              <div>
                <p className="text-sm text-muted-foreground">Desconto Total</p>
                <p className="text-2xl font-bold">R$ {totalDiscount.toFixed(2)}</p>
              </div>
            </div>
          </Card>
        </div>

        <Tabs defaultValue="coupons">
          <TabsList className="mb-4">
            <TabsTrigger value="coupons">Cupons</TabsTrigger>
            <TabsTrigger value="usages">Histórico de Uso</TabsTrigger>
          </TabsList>

          <TabsContent value="coupons">
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Desconto</TableHead>
                    <TableHead>Usos</TableHead>
                    <TableHead>Validade</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {coupons.map(coupon => (
                    <TableRow key={coupon.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <code className="bg-muted px-2 py-1 rounded font-mono">{coupon.code}</code>
                          <Button variant="ghost" size="icon" onClick={() => copyCode(coupon.code)}>
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                        {coupon.description && (
                          <p className="text-xs text-muted-foreground mt-1">{coupon.description}</p>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="flex items-center gap-1 w-fit">
                          {coupon.discount_type === "percentage" ? (
                            <><Percent className="w-3 h-3" /> {coupon.discount_value}%</>
                          ) : (
                            <><DollarSign className="w-3 h-3" /> R$ {coupon.discount_value}</>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {coupon.uses_count}{coupon.max_uses ? `/${coupon.max_uses}` : ""}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>De: {format(parseISO(coupon.valid_from), "dd/MM/yy HH:mm")}</p>
                          {coupon.valid_until && (
                            <p>Até: {format(parseISO(coupon.valid_until), "dd/MM/yy HH:mm")}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={coupon.is_active}
                          onCheckedChange={() => handleToggleStatus(coupon.id, coupon.is_active)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(coupon)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(coupon.id)}>
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {coupons.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        Nenhum cupom criado ainda
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="usages">
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cupom</TableHead>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Preço Original</TableHead>
                    <TableHead>Desconto</TableHead>
                    <TableHead>Preço Final</TableHead>
                    <TableHead>Data</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usages.map(usage => (
                    <TableRow key={usage.id}>
                      <TableCell>
                        <code className="bg-muted px-2 py-1 rounded font-mono">
                          {usage.coupon?.code || "N/A"}
                        </code>
                      </TableCell>
                      <TableCell className="text-sm">{usage.user_email}</TableCell>
                      <TableCell>R$ {usage.original_price.toFixed(2)}</TableCell>
                      <TableCell className="text-success">-R$ {usage.discount_amount.toFixed(2)}</TableCell>
                      <TableCell className="font-medium">R$ {usage.discounted_price.toFixed(2)}</TableCell>
                      <TableCell className="text-sm">
                        {format(parseISO(usage.used_at), "dd/MM/yy HH:mm", { locale: ptBR })}
                      </TableCell>
                    </TableRow>
                  ))}
                  {usages.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        Nenhum cupom foi utilizado ainda
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
