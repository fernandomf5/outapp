import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Edit2, Trash2, Copy, ExternalLink, ShoppingCart, DollarSign, Eye, BarChart3, Package, Code, Gift, Settings2, Link2, Palette, CheckCircle2, TrendingUp, ChevronDown } from "lucide-react";
import { CheckoutImageUpload } from "@/components/checkout/CheckoutImageUpload";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CheckoutPreview } from "./checkout/CheckoutPreview";


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
  // Thank you page
  thank_you_title: string | null;
  thank_you_message: string | null;
  thank_you_image_url: string | null;
  thank_you_button_text: string | null;
  thank_you_button_url: string | null;
  thank_you_download_url: string | null;
  show_order_details: boolean;
  // Tracking
  head_code: string | null;
  footer_code: string | null;
  // Upsell/Downsell
  upsell_title: string | null;
  upsell_description: string | null;
  upsell_price: number | null;
  upsell_image_url: string | null;
  upsell_checkout_url: string | null;
  downsell_title: string | null;
  downsell_description: string | null;
  downsell_price: number | null;
  downsell_image_url: string | null;
  downsell_checkout_url: string | null;
  // Integration
  integration_type: string | null;
  integration_id: string | null;
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
  additional_items: any;
  created_at: string;
}

interface AdditionalItem {
  id: string;
  checkout_id: string;
  item_type: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  product_id: string | null;
  is_active: boolean;
  sort_order: number;
}

interface Product {
  id: string;
  name: string;
  price: number;
  image_url: string | null;
}

export const CheckoutCreatorPanel = () => {
  const [checkouts, setCheckouts] = useState<Checkout[]>([]);
  const [orders, setOrders] = useState<CheckoutOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isOrdersDialogOpen, setIsOrdersDialogOpen] = useState(false);
  const [isItemsDialogOpen, setIsItemsDialogOpen] = useState(false);
  const [selectedCheckout, setSelectedCheckout] = useState<Checkout | null>(null);
  const [additionalItems, setAdditionalItems] = useState<AdditionalItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [formTab, setFormTab] = useState('basic');

  const [catalogs, setCatalogs] = useState<{ id: string; name: string }[]>([]);
  const [membersAreas, setMembersAreas] = useState<{ id: string; name: string }[]>([]);

  const [formData, setFormData] = useState({
    name: '', description: '', slug: '', item_name: '', item_description: '',
    item_image_url: '', price: '', primary_color: '#8B5CF6', banner_url: '',
    success_message: 'Pagamento realizado com sucesso!', redirect_url: '',
    mp_access_token: '', mp_public_key: '',
    // Thank you page
    thank_you_title: 'Obrigado pela sua compra!',
    thank_you_message: 'Seu pedido foi realizado com sucesso.',
    thank_you_image_url: '', thank_you_button_text: 'Falar no WhatsApp',
    thank_you_button_url: '', thank_you_download_url: '',
    show_order_details: true,
    // Tracking
    head_code: '', footer_code: '',
    // Upsell/Downsell
    upsell_title: '', upsell_description: '', upsell_price: '',
    upsell_image_url: '', upsell_checkout_url: '',
    downsell_title: '', downsell_description: '', downsell_price: '',
    downsell_image_url: '', downsell_checkout_url: '',
    // Integration
    integration_type: '', integration_id: '',
  });

  const [itemForm, setItemForm] = useState({
    item_type: 'bump', name: '', description: '', price: '',
    image_url: '', product_id: '', is_active: true,
  });
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  useEffect(() => { loadCheckouts(); loadProducts(); loadIntegrationOptions(); }, []);

  const loadIntegrationOptions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const [{ data: cats }, { data: areas }] = await Promise.all([
        supabase.from('catalogs').select('id, name').eq('user_id', user.id),
        supabase.from('simple_members_areas' as any).select('id, name').eq('user_id', user.id),
      ]);
      setCatalogs((cats || []) as any);
      setMembersAreas((areas || []) as any);
    } catch {}
  };

  const loadCheckouts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await supabase.from('checkouts').select('*')
        .eq('user_id', user.id).order('created_at', { ascending: false });
      if (error) throw error;
      setCheckouts((data || []) as any);
    } catch { toast.error('Erro ao carregar checkouts'); }
    finally { setLoading(false); }
  };

  const loadProducts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('products').select('id, name, price, image_url')
        .eq('user_id', user.id).eq('is_active', true);
      setProducts((data || []) as any);
    } catch {}
  };

  const loadOrders = async (checkoutId: string) => {
    try {
      const { data, error } = await supabase.from('checkout_orders').select('*')
        .eq('checkout_id', checkoutId).order('created_at', { ascending: false });
      if (error) throw error;
      setOrders((data || []) as any);
    } catch { toast.error('Erro ao carregar pedidos'); }
  };

  const loadAdditionalItems = async (checkoutId: string) => {
    try {
      const { data, error } = await supabase.from('checkout_additional_items').select('*')
        .eq('checkout_id', checkoutId).order('sort_order', { ascending: true });
      if (error) throw error;
      setAdditionalItems((data || []) as any);
    } catch { toast.error('Erro ao carregar itens'); }
  };

  const generateSlug = (name: string) => {
    return name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()
      .replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');
  };

  const resetForm = () => {
    setFormData({
      name: '', description: '', slug: '', item_name: '', item_description: '',
      item_image_url: '', price: '', primary_color: '#8B5CF6', banner_url: '',
      success_message: 'Pagamento realizado com sucesso!', redirect_url: '',
      mp_access_token: '', mp_public_key: '',
      thank_you_title: 'Obrigado pela sua compra!',
      thank_you_message: 'Seu pedido foi realizado com sucesso.',
      thank_you_image_url: '', thank_you_button_text: 'Falar no WhatsApp',
      thank_you_button_url: '', thank_you_download_url: '',
      show_order_details: true,
      head_code: '', footer_code: '',
      upsell_title: '', upsell_description: '', upsell_price: '',
      upsell_image_url: '', upsell_checkout_url: '',
      downsell_title: '', downsell_description: '', downsell_price: '',
      downsell_image_url: '', downsell_checkout_url: '',
      integration_type: '', integration_id: '',
    });
    setFormTab('basic');
  };

  const buildCheckoutPayload = () => ({
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
    thank_you_title: formData.thank_you_title || null,
    thank_you_message: formData.thank_you_message || null,
    thank_you_image_url: formData.thank_you_image_url || null,
    thank_you_button_text: formData.thank_you_button_text || null,
    thank_you_button_url: formData.thank_you_button_url || null,
    thank_you_download_url: formData.thank_you_download_url || null,
    show_order_details: formData.show_order_details,
    head_code: formData.head_code || null,
    footer_code: formData.footer_code || null,
    upsell_title: formData.upsell_title || null,
    upsell_description: formData.upsell_description || null,
    upsell_price: formData.upsell_price ? parseFloat(formData.upsell_price) : null,
    upsell_image_url: formData.upsell_image_url || null,
    upsell_checkout_url: formData.upsell_checkout_url || null,
    downsell_title: formData.downsell_title || null,
    downsell_description: formData.downsell_description || null,
    downsell_price: formData.downsell_price ? parseFloat(formData.downsell_price) : null,
    downsell_image_url: formData.downsell_image_url || null,
    downsell_checkout_url: formData.downsell_checkout_url || null,
    integration_type: formData.integration_type || null,
    integration_id: formData.integration_id || null,
  });

  const handleCreate = async () => {
    if (!formData.name.trim() || !formData.item_name.trim() || !formData.price) {
      toast.error('Preencha os campos obrigatórios'); return;
    }
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { error } = await supabase.from('checkouts').insert({ user_id: user.id, ...buildCheckoutPayload() });
      if (error) throw error;
      toast.success('Checkout criado com sucesso!');
      setIsCreateDialogOpen(false); resetForm(); loadCheckouts();
    } catch (error: any) { toast.error(error.message || 'Erro ao criar checkout'); }
  };

  const handleEdit = async () => {
    if (!selectedCheckout) return;
    try {
      const { error } = await supabase.from('checkouts').update(buildCheckoutPayload()).eq('id', selectedCheckout.id);
      if (error) throw error;
      toast.success('Checkout atualizado!');
      setIsEditDialogOpen(false); resetForm(); loadCheckouts();
    } catch (error: any) { toast.error(error.message || 'Erro ao atualizar'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este checkout?')) return;
    try {
      const { error } = await supabase.from('checkouts').delete().eq('id', id);
      if (error) throw error;
      toast.success('Checkout excluído!'); loadCheckouts();
    } catch { toast.error('Erro ao excluir'); }
  };

  const handleToggleActive = async (checkout: Checkout) => {
    try {
      const { error } = await supabase.from('checkouts').update({ is_active: !checkout.is_active }).eq('id', checkout.id);
      if (error) throw error;
      loadCheckouts();
    } catch { toast.error('Erro ao alterar status'); }
  };

  const openEditDialog = (checkout: Checkout) => {
    setSelectedCheckout(checkout);
    setFormData({
      name: checkout.name, description: checkout.description || '', slug: checkout.slug,
      item_name: checkout.item_name, item_description: checkout.item_description || '',
      item_image_url: checkout.item_image_url || '', price: String(checkout.price),
      primary_color: checkout.primary_color || '#8B5CF6', banner_url: checkout.banner_url || '',
      success_message: checkout.success_message || '', redirect_url: checkout.redirect_url || '',
      mp_access_token: checkout.mp_access_token || '', mp_public_key: checkout.mp_public_key || '',
      thank_you_title: checkout.thank_you_title || 'Obrigado pela sua compra!',
      thank_you_message: checkout.thank_you_message || 'Seu pedido foi realizado com sucesso.',
      thank_you_image_url: checkout.thank_you_image_url || '',
      thank_you_button_text: checkout.thank_you_button_text || 'Falar no WhatsApp',
      thank_you_button_url: checkout.thank_you_button_url || '',
      thank_you_download_url: checkout.thank_you_download_url || '',
      show_order_details: checkout.show_order_details ?? true,
      head_code: checkout.head_code || '', footer_code: checkout.footer_code || '',
      upsell_title: checkout.upsell_title || '', upsell_description: checkout.upsell_description || '',
      upsell_price: checkout.upsell_price ? String(checkout.upsell_price) : '',
      upsell_image_url: checkout.upsell_image_url || '', upsell_checkout_url: checkout.upsell_checkout_url || '',
      downsell_title: checkout.downsell_title || '', downsell_description: checkout.downsell_description || '',
      downsell_price: checkout.downsell_price ? String(checkout.downsell_price) : '',
      downsell_image_url: checkout.downsell_image_url || '', downsell_checkout_url: checkout.downsell_checkout_url || '',
      integration_type: (checkout as any).integration_type || '', integration_id: (checkout as any).integration_id || '',
    });
    setIsEditDialogOpen(true);
  };

  const openOrdersDialog = (checkout: Checkout) => {
    setSelectedCheckout(checkout); loadOrders(checkout.id); setIsOrdersDialogOpen(true);
  };

  const openItemsDialog = (checkout: Checkout) => {
    setSelectedCheckout(checkout); loadAdditionalItems(checkout.id); setIsItemsDialogOpen(true);
    resetItemForm();
  };

  const resetItemForm = () => {
    setItemForm({ item_type: 'bump', name: '', description: '', price: '', image_url: '', product_id: '', is_active: true });
    setEditingItemId(null);
  };

  const handleSaveItem = async () => {
    if (!selectedCheckout || !itemForm.name.trim() || !itemForm.price) {
      toast.error('Preencha nome e preço'); return;
    }
    try {
      const payload = {
        checkout_id: selectedCheckout.id,
        item_type: itemForm.item_type,
        name: itemForm.name.trim(),
        description: itemForm.description || null,
        price: parseFloat(itemForm.price),
        image_url: itemForm.image_url || null,
        product_id: itemForm.product_id || null,
        is_active: itemForm.is_active,
      };

      if (editingItemId) {
        const { error } = await supabase.from('checkout_additional_items').update(payload).eq('id', editingItemId);
        if (error) throw error;
        toast.success('Item atualizado!');
      } else {
        const { error } = await supabase.from('checkout_additional_items').insert(payload);
        if (error) throw error;
        toast.success('Item adicionado!');
      }
      resetItemForm(); loadAdditionalItems(selectedCheckout.id);
    } catch (error: any) { toast.error(error.message || 'Erro ao salvar item'); }
  };

  const handleDeleteItem = async (id: string) => {
    if (!selectedCheckout) return;
    try {
      const { error } = await supabase.from('checkout_additional_items').delete().eq('id', id);
      if (error) throw error;
      toast.success('Item removido!'); loadAdditionalItems(selectedCheckout.id);
    } catch { toast.error('Erro ao remover item'); }
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (!confirm('Tem certeza que deseja excluir este pedido?')) return;
    if (!selectedCheckout) return;
    try {
      const { error } = await supabase.from('checkout_orders').delete().eq('id', orderId);
      if (error) throw error;
      toast.success('Pedido excluído!');
      loadOrders(selectedCheckout.id);
    } catch { toast.error('Erro ao excluir pedido'); }
  };

  const handleSelectProduct = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      setItemForm({ ...itemForm, product_id: productId, name: product.name, price: String(product.price), image_url: product.image_url || '' });
    }
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
    <div className="flex-1 overflow-y-auto pr-2 min-h-[500px]">
        <Tabs value={formTab} onValueChange={setFormTab}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2">
              <div className="mb-8 p-4 bg-muted/30 rounded-2xl border border-primary/10">
                <Label className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-black mb-3 block ml-1">Sessão em edição</Label>
                <Select value={formTab} onValueChange={setFormTab}>
                  <SelectTrigger className="w-full h-14 text-lg font-bold border-2 border-primary/20 hover:border-primary/40 transition-all bg-background shadow-sm rounded-xl">
                    <SelectValue placeholder="Selecione a etapa..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basic">
                      <div className="flex items-center gap-2 py-1">
                        <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                          <Settings2 className="w-4 h-4" />
                        </div>
                        <span className="font-semibold">Informações Básicas</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="integration">
                      <div className="flex items-center gap-2 py-1">
                        <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center">
                          <Link2 className="w-4 h-4" />
                        </div>
                        <span className="font-semibold">Integrações</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="design">
                      <div className="flex items-center gap-2 py-1">
                        <div className="w-8 h-8 rounded-lg bg-pink-100 text-pink-600 flex items-center justify-center">
                          <Palette className="w-4 h-4" />
                        </div>
                        <span className="font-semibold">Design & Visual</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="thankyou">
                      <div className="flex items-center gap-2 py-1">
                        <div className="w-8 h-8 rounded-lg bg-green-100 text-green-600 flex items-center justify-center">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                        <span className="font-semibold">Página de Obrigado</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="upsell">
                      <div className="flex items-center gap-2 py-1">
                        <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center">
                          <TrendingUp className="w-4 h-4" />
                        </div>
                        <span className="font-semibold">Upsell & Bumps</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="tracking">
                      <div className="flex items-center gap-2 py-1">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
                          <BarChart3 className="w-4 h-4" />
                        </div>
                        <span className="font-semibold">Tracking & Pixels</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="hidden md:block">
              <Label className="text-xs mb-2 block">Prévia</Label>
              <CheckoutPreview checkout={formData} />
            </div>
          </div>

        <TabsContent value="basic" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Nome do Checkout *</Label>
              <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value, slug: formData.slug ? formData.slug : generateSlug(e.target.value) })} placeholder="Ex: Curso de Marketing" />
            </div>
            <div>
              <Label>Slug (URL)</Label>
              <Input value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: e.target.value })} placeholder="curso-de-marketing" />
            </div>
          </div>
          <div>
            <Label>Descrição</Label>
            <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Descrição do checkout" />
          </div>
          <div className="border-t pt-4">
            <h4 className="font-semibold mb-3">📦 Produto / Serviço</h4>
            <div className="grid gap-3">
              <div>
                <Label>Nome do Item *</Label>
                <Input value={formData.item_name} onChange={(e) => setFormData({ ...formData, item_name: e.target.value })} placeholder="Nome do produto ou serviço" />
              </div>
              <div>
                <Label>Descrição do Item</Label>
                <Textarea value={formData.item_description} onChange={(e) => setFormData({ ...formData, item_description: e.target.value })} />
              </div>
              <div>
                <Label>Preço (R$) *</Label>
                <Input type="number" step="0.01" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} placeholder="99.90" />
              </div>
              <CheckoutImageUpload
                label="Imagem do Produto"
                value={formData.item_image_url}
                onChange={(url) => setFormData({ ...formData, item_image_url: url })}
                aspectHint="Recomendado: 400x400px"
              />
            </div>
          </div>
          <div className="border-t pt-4">
            <h4 className="font-semibold mb-3">💳 Mercado Pago</h4>
            <p className="text-xs text-muted-foreground mb-3">Se deixar vazio, usará as credenciais globais.</p>
            <div className="grid gap-3">
              <div>
                <Label>Access Token</Label>
                <Input type="password" value={formData.mp_access_token} onChange={(e) => setFormData({ ...formData, mp_access_token: e.target.value })} placeholder="APP_USR-... (opcional)" />
              </div>
              <div>
                <Label>Public Key</Label>
                <Input value={formData.mp_public_key} onChange={(e) => setFormData({ ...formData, mp_public_key: e.target.value })} placeholder="APP_USR-... (opcional)" />
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="integration" className="space-y-4">
          <h4 className="font-semibold">🔗 Integração com Produto</h4>
          <p className="text-xs text-muted-foreground">Conecte este checkout a um catálogo ou área de membros para processar automaticamente após o pagamento.</p>
          <div>
            <Label>Tipo de Integração</Label>
            <Select value={formData.integration_type || 'none'} onValueChange={(v) => setFormData({ ...formData, integration_type: v === 'none' ? '' : v, integration_id: '' })}>
              <SelectTrigger><SelectValue placeholder="Sem integração" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sem integração</SelectItem>
                <SelectItem value="catalog">📦 Catálogo</SelectItem>
                <SelectItem value="members_area">🎓 Área de Membros</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {formData.integration_type === 'catalog' && (
            <div>
              <Label>Selecionar Catálogo</Label>
              <Select value={formData.integration_id || 'none'} onValueChange={(v) => setFormData({ ...formData, integration_id: v === 'none' ? '' : v })}>
                <SelectTrigger><SelectValue placeholder="Selecione um catálogo" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Selecione...</SelectItem>
                  {catalogs.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">Após o pagamento, o pedido será criado automaticamente no catálogo selecionado como "pago".</p>
            </div>
          )}
          {formData.integration_type === 'members_area' && (
            <div>
              <Label>Selecionar Área de Membros</Label>
              <Select value={formData.integration_id || 'none'} onValueChange={(v) => setFormData({ ...formData, integration_id: v === 'none' ? '' : v })}>
                <SelectTrigger><SelectValue placeholder="Selecione uma área" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Selecione...</SelectItem>
                  {membersAreas.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">Após o pagamento, um código de acesso exclusivo será gerado e exibido na página de obrigado.</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="design" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Cor Principal</Label>
              <div className="flex gap-2">
                <Input type="color" value={formData.primary_color} onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })} className="w-12 h-10 p-1 cursor-pointer" />
                <Input value={formData.primary_color} onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })} />
              </div>
            </div>
            <CheckoutImageUpload
              label="Banner do Checkout"
              value={formData.banner_url}
              onChange={(url) => setFormData({ ...formData, banner_url: url })}
              aspectHint="Recomendado: 1200x400px"
            />
          </div>
          <div>
            <Label>Mensagem de Sucesso (legado)</Label>
            <Input value={formData.success_message} onChange={(e) => setFormData({ ...formData, success_message: e.target.value })} />
          </div>
          <div>
            <Label>URL de Redirecionamento (após pagamento)</Label>
            <Input value={formData.redirect_url} onChange={(e) => setFormData({ ...formData, redirect_url: e.target.value })} placeholder="https://..." />
          </div>
        </TabsContent>

        <TabsContent value="thankyou" className="space-y-4">
          <h4 className="font-semibold">🎉 Página de Obrigado</h4>
          <div>
            <Label>Título</Label>
            <Input value={formData.thank_you_title} onChange={(e) => setFormData({ ...formData, thank_you_title: e.target.value })} />
          </div>
          <div>
            <Label>Mensagem</Label>
            <Textarea value={formData.thank_you_message} onChange={(e) => setFormData({ ...formData, thank_you_message: e.target.value })} />
          </div>
          <CheckoutImageUpload
            label="Imagem da Página de Obrigado"
            value={formData.thank_you_image_url}
            onChange={(url) => setFormData({ ...formData, thank_you_image_url: url })}
          />
          <div className="flex items-center gap-2">
            <Switch checked={formData.show_order_details} onCheckedChange={(v) => setFormData({ ...formData, show_order_details: v })} />
            <Label>Mostrar detalhes do pedido</Label>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Texto do Botão</Label>
              <Input value={formData.thank_you_button_text} onChange={(e) => setFormData({ ...formData, thank_you_button_text: e.target.value })} />
            </div>
            <div>
              <Label>URL do Botão</Label>
              <Input value={formData.thank_you_button_url} onChange={(e) => setFormData({ ...formData, thank_you_button_url: e.target.value })} placeholder="https://wa.me/..." />
            </div>
          </div>
          <div>
            <Label>URL de Download (arquivo digital)</Label>
            <Input value={formData.thank_you_download_url} onChange={(e) => setFormData({ ...formData, thank_you_download_url: e.target.value })} placeholder="https://..." />
          </div>
        </TabsContent>

        <TabsContent value="upsell" className="space-y-4">
          <h4 className="font-semibold">⬆️ Upsell (pós-compra)</h4>
          <div className="grid gap-3">
            <div>
              <Label>Título do Upsell</Label>
              <Input value={formData.upsell_title} onChange={(e) => setFormData({ ...formData, upsell_title: e.target.value })} placeholder="Oferta especial para você!" />
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea value={formData.upsell_description} onChange={(e) => setFormData({ ...formData, upsell_description: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Preço (R$)</Label>
                <Input type="number" step="0.01" value={formData.upsell_price} onChange={(e) => setFormData({ ...formData, upsell_price: e.target.value })} />
              </div>
              <CheckoutImageUpload
                label="Imagem do Upsell"
                value={formData.upsell_image_url}
                onChange={(url) => setFormData({ ...formData, upsell_image_url: url })}
              />
            </div>
            <div>
              <Label>URL do Checkout (upsell)</Label>
              <Input value={formData.upsell_checkout_url} onChange={(e) => setFormData({ ...formData, upsell_checkout_url: e.target.value })} placeholder="Link para outro checkout" />
            </div>
          </div>

          <div className="border-t pt-4">
            <h4 className="font-semibold">⬇️ Downsell (se recusar o upsell)</h4>
            <div className="grid gap-3 mt-3">
              <div>
                <Label>Título do Downsell</Label>
                <Input value={formData.downsell_title} onChange={(e) => setFormData({ ...formData, downsell_title: e.target.value })} placeholder="Que tal essa oferta?" />
              </div>
              <div>
                <Label>Descrição</Label>
                <Textarea value={formData.downsell_description} onChange={(e) => setFormData({ ...formData, downsell_description: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Preço (R$)</Label>
                  <Input type="number" step="0.01" value={formData.downsell_price} onChange={(e) => setFormData({ ...formData, downsell_price: e.target.value })} />
                </div>
                <CheckoutImageUpload
                  label="Imagem do Downsell"
                  value={formData.downsell_image_url}
                  onChange={(url) => setFormData({ ...formData, downsell_image_url: url })}
                />
              </div>
              <div>
                <Label>URL do Checkout (downsell)</Label>
                <Input value={formData.downsell_checkout_url} onChange={(e) => setFormData({ ...formData, downsell_checkout_url: e.target.value })} placeholder="Link para outro checkout" />
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="tracking" className="space-y-4">
          <h4 className="font-semibold flex items-center gap-2"><Code className="w-4 h-4" /> Códigos de Rastreamento</h4>
          <p className="text-xs text-muted-foreground">Insira scripts de rastreamento (Google Tag, Meta Pixel, etc.) que serão injetados na página de checkout e obrigado.</p>
          <div>
            <Label>Código Head (antes de &lt;/head&gt;)</Label>
            <Textarea value={formData.head_code} onChange={(e) => setFormData({ ...formData, head_code: e.target.value })} placeholder="<script>...</script>" className="font-mono text-xs" rows={5} />
          </div>
          <div>
            <Label>Código Footer (antes de &lt;/body&gt;)</Label>
            <Textarea value={formData.footer_code} onChange={(e) => setFormData({ ...formData, footer_code: e.target.value })} placeholder="<script>...</script>" className="font-mono text-xs" rows={5} />
          </div>
        </TabsContent>

        <div className="mt-8 pt-6 border-t flex justify-end items-center gap-4">
          {formTab !== 'basic' && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => {
                const tabs = ['basic', 'integration', 'design', 'thankyou', 'upsell', 'tracking'];
                const currentIndex = tabs.indexOf(formTab);
                if (currentIndex > 0) setFormTab(tabs[currentIndex - 1]);
              }}
              className="text-muted-foreground"
            >
              Voltar
            </Button>
          )}
          
          {formTab !== 'tracking' ? (
            <Button 
              onClick={() => {
                const tabs = ['basic', 'integration', 'design', 'thankyou', 'upsell', 'tracking'];
                const currentIndex = tabs.indexOf(formTab);
                if (currentIndex < tabs.length - 1) setFormTab(tabs[currentIndex + 1]);
              }}
              className="gap-2 bg-primary hover:bg-primary/90 transition-all px-6"
            >
              Continuar <ChevronDown className="w-4 h-4 -rotate-90" />
            </Button>
          ) : (
            <div className="text-xs text-muted-foreground italic">
              Fim das configurações. Não esqueça de salvar abaixo.
            </div>
          )}
        </div>
      </Tabs>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2"><ShoppingCart className="w-4 h-4" />Total de Checkouts</CardTitle>
          </CardHeader>
          <CardContent><p className="text-2xl font-bold">{checkouts.length}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2"><BarChart3 className="w-4 h-4" />Vendas Totais</CardTitle>
          </CardHeader>
          <CardContent><p className="text-2xl font-bold">{totalSales}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2"><DollarSign className="w-4 h-4" />Receita Total</CardTitle>
          </CardHeader>
          <CardContent><p className="text-2xl font-bold text-green-600">R$ {totalRevenue.toFixed(2)}</p></CardContent>
        </Card>
      </div>

      {/* Action Bar */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Meus Checkouts</h3>
        <Button onClick={() => { resetForm(); setIsCreateDialogOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" />Novo Checkout
        </Button>
      </div>

      {/* Checkouts List */}
      {checkouts.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <ShoppingCart className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Nenhum checkout criado</h3>
            <p className="text-muted-foreground mb-4">Crie seu primeiro checkout para começar a receber pagamentos via Mercado Pago.</p>
            <Button onClick={() => { resetForm(); setIsCreateDialogOpen(true); }}>
              <Plus className="w-4 h-4 mr-2" />Criar Primeiro Checkout
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
                    <img src={checkout.item_image_url} alt={checkout.item_name} className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="flex-1 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold truncate">{checkout.name}</h4>
                        <Badge variant={checkout.is_active ? 'default' : 'secondary'}>{checkout.is_active ? 'Ativo' : 'Inativo'}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{checkout.item_name}</p>
                      <p className="text-lg font-bold mt-1" style={{ color: checkout.primary_color }}>R$ {Number(checkout.price).toFixed(2)}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span>{checkout.total_sales} vendas</span>
                        <span>R$ {Number(checkout.total_revenue).toFixed(2)} faturado</span>
                      </div>
                    </div>
                    <Switch checked={checkout.is_active} onCheckedChange={() => handleToggleActive(checkout)} />
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <Button size="sm" variant="outline" onClick={() => copyCheckoutLink(checkout)}><Copy className="w-3 h-3 mr-1" />Link</Button>
                    <Button size="sm" variant="outline" onClick={() => window.open(`/checkout/${checkout.id}/${checkout.slug}`, '_blank')}><ExternalLink className="w-3 h-3 mr-1" />Abrir</Button>
                    <Button size="sm" variant="outline" onClick={() => openItemsDialog(checkout)}><Package className="w-3 h-3 mr-1" />Itens</Button>
                    <Button size="sm" variant="outline" onClick={() => openOrdersDialog(checkout)}><Eye className="w-3 h-3 mr-1" />Pedidos</Button>
                    <Button size="sm" variant="outline" onClick={() => openEditDialog(checkout)}><Edit2 className="w-3 h-3 mr-1" />Editar</Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDelete(checkout.id)}><Trash2 className="w-3 h-3 mr-1" />Excluir</Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader><DialogTitle>Criar Novo Checkout</DialogTitle></DialogHeader>
          {renderFormFields()}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreate}>Criar Checkout</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader><DialogTitle>Editar Checkout</DialogTitle></DialogHeader>
          {renderFormFields()}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleEdit}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Additional Items Dialog */}
      <Dialog open={isItemsDialogOpen} onOpenChange={setIsItemsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Itens Adicionais - {selectedCheckout?.name}</DialogTitle></DialogHeader>
          
          <div className="space-y-4">
            {/* Add/Edit Item Form */}
            <Card>
              <CardContent className="p-4 space-y-3">
                <h4 className="font-semibold text-sm">{editingItemId ? 'Editar Item' : 'Adicionar Item'}</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Tipo</Label>
                    <Select value={itemForm.item_type} onValueChange={(v) => setItemForm({ ...itemForm, item_type: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bump">Order Bump</SelectItem>
                        <SelectItem value="related">Produto Relacionado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Importar de Produto</Label>
                    <Select value={itemForm.product_id} onValueChange={handleSelectProduct}>
                      <SelectTrigger><SelectValue placeholder="Selecionar..." /></SelectTrigger>
                      <SelectContent>
                        {products.map(p => (
                          <SelectItem key={p.id} value={p.id}>{p.name} - R$ {Number(p.price).toFixed(2)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Nome *</Label>
                    <Input value={itemForm.name} onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })} placeholder="Nome do item" />
                  </div>
                  <div>
                    <Label className="text-xs">Preço (R$) *</Label>
                    <Input type="number" step="0.01" value={itemForm.price} onChange={(e) => setItemForm({ ...itemForm, price: e.target.value })} />
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Descrição</Label>
                  <Input value={itemForm.description} onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs">URL da Imagem</Label>
                  <Input value={itemForm.image_url} onChange={(e) => setItemForm({ ...itemForm, image_url: e.target.value })} />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Switch checked={itemForm.is_active} onCheckedChange={(v) => setItemForm({ ...itemForm, is_active: v })} />
                    <Label className="text-xs">Ativo</Label>
                  </div>
                  <div className="flex gap-2">
                    {editingItemId && <Button size="sm" variant="outline" onClick={resetItemForm}>Cancelar</Button>}
                    <Button size="sm" onClick={handleSaveItem}>{editingItemId ? 'Atualizar' : 'Adicionar'}</Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Items List */}
            {additionalItems.length > 0 && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Preço</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {additionalItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell><Badge variant="outline">{item.item_type === 'bump' ? 'Bump' : 'Relacionado'}</Badge></TableCell>
                      <TableCell>{item.name}</TableCell>
                      <TableCell>R$ {Number(item.price).toFixed(2)}</TableCell>
                      <TableCell><Badge variant={item.is_active ? 'default' : 'secondary'}>{item.is_active ? 'Ativo' : 'Inativo'}</Badge></TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" onClick={() => {
                            setEditingItemId(item.id);
                            setItemForm({ item_type: item.item_type, name: item.name, description: item.description || '', price: String(item.price), image_url: item.image_url || '', product_id: item.product_id || '', is_active: item.is_active });
                          }}><Edit2 className="w-3 h-3" /></Button>
                          <Button size="sm" variant="ghost" onClick={() => handleDeleteItem(item.id)}><Trash2 className="w-3 h-3" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Orders Dialog */}
      <Dialog open={isOrdersDialogOpen} onOpenChange={setIsOrdersDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Pedidos - {selectedCheckout?.name}</DialogTitle></DialogHeader>
          {orders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">Nenhum pedido registrado ainda.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead></TableHead>
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
                      <Badge variant={order.status === 'approved' ? 'default' : order.status === 'pending' ? 'secondary' : 'destructive'}>
                        {order.status === 'approved' ? 'Aprovado' : order.status === 'pending' ? 'Pendente' : order.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button size="sm" variant="ghost" onClick={() => handleDeleteOrder(order.id)}>
                        <Trash2 className="w-3.5 h-3.5 text-destructive" />
                      </Button>
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
