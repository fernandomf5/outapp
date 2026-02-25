import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Edit2, Trash2, Copy, ExternalLink, ShoppingCart, DollarSign, Eye, BarChart3 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Checkout {
  id: string;
  name: string;
  description: string | null;
  slug: string;
  is_active: boolean;
  item_name: string;
  item_description: string | null;
  item_image_url: string | null;
  price: number;
  primary_color: string;
  banner_url: string | null;
  success_message: string;
  redirect_url: string | null;
  mp_access_token: string | null;
  mp_public_key: string | null;
  total_sales: number;
  total_revenue: number;
  created_at: string;
}

interface CheckoutOrder {
  id: string;
  checkout_id: string;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  amount: number;
  status: string;
  payment_method: string | null;
  created_at: string;
}

export const CheckoutCreatorPanel = () => {
  const [checkouts, setCheckouts] = useState<Checkout[]>([]);
  const [orders, setOrders] = useState<CheckoutOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isOrdersDialogOpen, setIsOrdersDialogOpen] = useState(false);
  const [selectedCheckout, setSelectedCheckout] = useState<Checkout | null>(null);
  const [activeTab, setActiveTab] = useState<'checkouts' | 'orders'>('checkouts');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    slug: '',
    item_name: '',
    item_description: '',
    item_image_url: '',
    price: '',
    primary_color: '#8B5CF6',
    banner_url: '',
    success_message: 'Pagamento realizado com sucesso!',
    redirect_url: '',
    mp_access_token: '',
    mp_public_key: '',
  });

  useEffect(() => {
    loadCheckouts();
  }, []);

  const loadCheckouts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('checkouts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCheckouts((data || []) as any);
    } catch (error: any) {
      toast.error('Erro ao carregar checkouts');
    } finally {
      setLoading(false);
    }
  };

  const loadOrders = async (checkoutId: string) => {
    try {
      const { data, error } = await supabase
        .from('checkout_orders')
        .select('*')
        .eq('checkout_id', checkoutId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders((data || []) as any);
    } catch (error: any) {
      toast.error('Erro ao carregar pedidos');
    }
  };

  const generateSlug = (name: string) => {
    return name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      slug: '',
      item_name: '',
      item_description: '',
      item_image_url: '',
      price: '',
      primary_color: '#8B5CF6',
      banner_url: '',
      success_message: 'Pagamento realizado com sucesso!',
      redirect_url: '',
      mp_access_token: '',
      mp_public_key: '',
    });
  };

  const handleCreate = async () => {
    if (!formData.name.trim() || !formData.item_name.trim() || !formData.price) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const slug = formData.slug || generateSlug(formData.name);

      const { error } = await supabase.from('checkouts').insert({
        user_id: user.id,
        name: formData.name.trim(),
        description: formData.description || null,
        slug,
        item_name: formData.item_name.trim(),
        item_description: formData.item_description || null,
        item_image_url: formData.item_image_url || null,
        price: parseFloat(formData.price),
        primary_color: formData.primary_color,
        banner_url: formData.banner_url || null,
        success_message: formData.success_message,
        redirect_url: formData.redirect_url || null,
        mp_access_token: formData.mp_access_token || null,
        mp_public_key: formData.mp_public_key || null,
      });

      if (error) throw error;

      toast.success('Checkout criado com sucesso!');
      setIsCreateDialogOpen(false);
      resetForm();
      loadCheckouts();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao criar checkout');
    }
  };

  const handleEdit = async () => {
    if (!selectedCheckout) return;

    try {
      const { error } = await supabase
        .from('checkouts')
        .update({
          name: formData.name.trim(),
          description: formData.description || null,
          slug: formData.slug || generateSlug(formData.name),
          item_name: formData.item_name.trim(),
          item_description: formData.item_description || null,
          item_image_url: formData.item_image_url || null,
          price: parseFloat(formData.price),
          primary_color: formData.primary_color,
          banner_url: formData.banner_url || null,
          success_message: formData.success_message,
          redirect_url: formData.redirect_url || null,
          mp_access_token: formData.mp_access_token || null,
          mp_public_key: formData.mp_public_key || null,
        })
        .eq('id', selectedCheckout.id);

      if (error) throw error;

      toast.success('Checkout atualizado!');
      setIsEditDialogOpen(false);
      resetForm();
      loadCheckouts();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao atualizar');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este checkout?')) return;

    try {
      const { error } = await supabase.from('checkouts').delete().eq('id', id);
      if (error) throw error;
      toast.success('Checkout excluído!');
      loadCheckouts();
    } catch (error: any) {
      toast.error('Erro ao excluir');
    }
  };

  const handleToggleActive = async (checkout: Checkout) => {
    try {
      const { error } = await supabase
        .from('checkouts')
        .update({ is_active: !checkout.is_active })
        .eq('id', checkout.id);

      if (error) throw error;
      loadCheckouts();
    } catch (error: any) {
      toast.error('Erro ao alterar status');
    }
  };

  const openEditDialog = (checkout: Checkout) => {
    setSelectedCheckout(checkout);
    setFormData({
      name: checkout.name,
      description: checkout.description || '',
      slug: checkout.slug,
      item_name: checkout.item_name,
      item_description: checkout.item_description || '',
      item_image_url: checkout.item_image_url || '',
      price: String(checkout.price),
      primary_color: checkout.primary_color || '#8B5CF6',
      banner_url: checkout.banner_url || '',
      success_message: checkout.success_message || '',
      redirect_url: checkout.redirect_url || '',
      mp_access_token: checkout.mp_access_token || '',
      mp_public_key: checkout.mp_public_key || '',
    });
    setIsEditDialogOpen(true);
  };

  const openOrdersDialog = (checkout: Checkout) => {
    setSelectedCheckout(checkout);
    loadOrders(checkout.id);
    setIsOrdersDialogOpen(true);
  };

  const copyCheckoutLink = (checkout: Checkout) => {
    const link = `${window.location.origin}/checkout/${checkout.id}/${checkout.slug}`;
    navigator.clipboard.writeText(link);
    toast.success('Link do checkout copiado!');
  };

  const totalRevenue = checkouts.reduce((sum, c) => sum + Number(c.total_revenue), 0);
  const totalSales = checkouts.reduce((sum, c) => sum + Number(c.total_sales), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const renderFormFields = () => (
    <div className="grid gap-4 max-h-[60vh] overflow-y-auto pr-2">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Nome do Checkout *</Label>
          <Input
            value={formData.name}
            onChange={(e) => {
              setFormData({
                ...formData,
                name: e.target.value,
                slug: formData.slug ? formData.slug : generateSlug(e.target.value),
              });
            }}
            placeholder="Ex: Curso de Marketing"
          />
        </div>
        <div>
          <Label>Slug (URL)</Label>
          <Input
            value={formData.slug}
            onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
            placeholder="curso-de-marketing"
          />
        </div>
      </div>

      <div>
        <Label>Descrição</Label>
        <Textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Descrição do checkout"
        />
      </div>

      <div className="border-t pt-4">
        <h4 className="font-semibold mb-3">📦 Produto / Serviço</h4>
        <div className="grid gap-3">
          <div>
            <Label>Nome do Item *</Label>
            <Input
              value={formData.item_name}
              onChange={(e) => setFormData({ ...formData, item_name: e.target.value })}
              placeholder="Nome do produto ou serviço"
            />
          </div>
          <div>
            <Label>Descrição do Item</Label>
            <Textarea
              value={formData.item_description}
              onChange={(e) => setFormData({ ...formData, item_description: e.target.value })}
              placeholder="Descrição detalhada"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Preço (R$) *</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="99.90"
              />
            </div>
            <div>
              <Label>URL da Imagem</Label>
              <Input
                value={formData.item_image_url}
                onChange={(e) => setFormData({ ...formData, item_image_url: e.target.value })}
                placeholder="https://..."
              />
            </div>
          </div>
        </div>
      </div>

      <div className="border-t pt-4">
        <h4 className="font-semibold mb-3">🎨 Personalização</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Cor Principal</Label>
            <div className="flex gap-2">
              <Input
                type="color"
                value={formData.primary_color}
                onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                className="w-12 h-10 p-1 cursor-pointer"
              />
              <Input
                value={formData.primary_color}
                onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
              />
            </div>
          </div>
          <div>
            <Label>URL do Banner</Label>
            <Input
              value={formData.banner_url}
              onChange={(e) => setFormData({ ...formData, banner_url: e.target.value })}
              placeholder="https://..."
            />
          </div>
        </div>
        <div className="mt-3">
          <Label>Mensagem de Sucesso</Label>
          <Input
            value={formData.success_message}
            onChange={(e) => setFormData({ ...formData, success_message: e.target.value })}
          />
        </div>
        <div className="mt-3">
          <Label>URL de Redirecionamento (após pagamento)</Label>
          <Input
            value={formData.redirect_url}
            onChange={(e) => setFormData({ ...formData, redirect_url: e.target.value })}
            placeholder="https://..."
          />
        </div>
      </div>

      <div className="border-t pt-4">
        <h4 className="font-semibold mb-3">💳 Mercado Pago</h4>
        <p className="text-xs text-muted-foreground mb-3">
          Se deixar vazio, usará as credenciais globais configuradas pelo admin.
        </p>
        <div className="grid gap-3">
          <div>
            <Label>Access Token</Label>
            <Input
              type="password"
              value={formData.mp_access_token}
              onChange={(e) => setFormData({ ...formData, mp_access_token: e.target.value })}
              placeholder="APP_USR-... (opcional)"
            />
          </div>
          <div>
            <Label>Public Key</Label>
            <Input
              value={formData.mp_public_key}
              onChange={(e) => setFormData({ ...formData, mp_public_key: e.target.value })}
              placeholder="APP_USR-... (opcional)"
            />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <ShoppingCart className="w-4 h-4" />
              Total de Checkouts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{checkouts.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Vendas Totais
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalSales}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Receita Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">R$ {totalRevenue.toFixed(2)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Action Bar */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Meus Checkouts</h3>
        <Button onClick={() => { resetForm(); setIsCreateDialogOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Checkout
        </Button>
      </div>

      {/* Checkouts List */}
      {checkouts.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <ShoppingCart className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Nenhum checkout criado</h3>
            <p className="text-muted-foreground mb-4">
              Crie seu primeiro checkout para começar a receber pagamentos via Mercado Pago.
            </p>
            <Button onClick={() => { resetForm(); setIsCreateDialogOpen(true); }}>
              <Plus className="w-4 h-4 mr-2" />
              Criar Primeiro Checkout
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {checkouts.map((checkout) => (
            <Card key={checkout.id} className="overflow-hidden">
              <div className="flex flex-col md:flex-row">
                {checkout.item_image_url && (
                  <div className="w-full md:w-32 h-32 md:h-auto flex-shrink-0">
                    <img
                      src={checkout.item_image_url}
                      alt={checkout.item_name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="flex-1 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold truncate">{checkout.name}</h4>
                        <Badge variant={checkout.is_active ? 'default' : 'secondary'}>
                          {checkout.is_active ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{checkout.item_name}</p>
                      <p className="text-lg font-bold mt-1" style={{ color: checkout.primary_color }}>
                        R$ {Number(checkout.price).toFixed(2)}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span>{checkout.total_sales} vendas</span>
                        <span>R$ {Number(checkout.total_revenue).toFixed(2)} faturado</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Switch
                        checked={checkout.is_active}
                        onCheckedChange={() => handleToggleActive(checkout)}
                      />
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <Button size="sm" variant="outline" onClick={() => copyCheckoutLink(checkout)}>
                      <Copy className="w-3 h-3 mr-1" />
                      Copiar Link
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => window.open(`/checkout/${checkout.id}/${checkout.slug}`, '_blank')}>
                      <ExternalLink className="w-3 h-3 mr-1" />
                      Abrir
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => openOrdersDialog(checkout)}>
                      <Eye className="w-3 h-3 mr-1" />
                      Pedidos
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => openEditDialog(checkout)}>
                      <Edit2 className="w-3 h-3 mr-1" />
                      Editar
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDelete(checkout.id)}>
                      <Trash2 className="w-3 h-3 mr-1" />
                      Excluir
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Criar Novo Checkout</DialogTitle>
          </DialogHeader>
          {renderFormFields()}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreate}>Criar Checkout</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Checkout</DialogTitle>
          </DialogHeader>
          {renderFormFields()}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleEdit}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Orders Dialog */}
      <Dialog open={isOrdersDialogOpen} onOpenChange={setIsOrdersDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Pedidos - {selectedCheckout?.name}</DialogTitle>
          </DialogHeader>
          {orders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum pedido registrado ainda.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>{format(new Date(order.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</TableCell>
                    <TableCell>{order.customer_name || '-'}</TableCell>
                    <TableCell>{order.customer_email || '-'}</TableCell>
                    <TableCell className="font-semibold">R$ {Number(order.amount).toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant={
                        order.status === 'approved' ? 'default' :
                        order.status === 'pending' ? 'secondary' : 'destructive'
                      }>
                        {order.status === 'approved' ? 'Aprovado' :
                         order.status === 'pending' ? 'Pendente' : order.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
