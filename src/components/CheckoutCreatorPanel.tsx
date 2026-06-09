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
import { Plus, Edit2, Trash2, Copy, ExternalLink, ShoppingCart, DollarSign, Eye, BarChart3, Package, Code, Gift, Settings2, Link2, Palette, CheckCircle2, TrendingUp, ChevronDown, ArrowLeft, Save, X } from "lucide-react";
import { CheckoutImageUpload } from "@/components/checkout/CheckoutImageUpload";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CheckoutPreview } from "./checkout/CheckoutPreview";
import { CheckoutFormFields } from "./checkout/CheckoutFormFields";


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
  product_type: string | null;
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
  const [view, setView] = useState<'list' | 'editor'>('list');

  const [checkouts, setCheckouts] = useState<Checkout[]>([]);
  const [orders, setOrders] = useState<CheckoutOrder[]>([]);
  const [loading, setLoading] = useState(true);
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
    // Design Ext
    logo_url: '',
    background_color: '#F8FAFC',
    text_color: '#0f172a',
    footer_text: 'Compra 100% Segura',
    footer_color: '#64748b',
    show_fake_feedback: false,
    fake_feedbacks: [] as any[],
    product_type: 'digital_product',
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
      logo_url: '', background_color: '#F8FAFC', text_color: '#0f172a',
      footer_text: 'Compra 100% Segura', footer_color: '#64748b',
      show_fake_feedback: false, fake_feedbacks: [],
      product_type: 'digital_product',
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
    logo_url: formData.logo_url || null,
    background_color: formData.background_color,
    text_color: formData.text_color,
    footer_text: formData.footer_text,
    footer_color: formData.footer_color,
    show_fake_feedback: formData.show_fake_feedback,
    fake_feedbacks: formData.fake_feedbacks,
    product_type: formData.product_type,
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
      setView('list'); resetForm(); loadCheckouts();
    } catch (error: any) { toast.error(error.message || 'Erro ao criar checkout'); }
  };

  const handleEdit = async () => {
    if (!selectedCheckout) return;
    try {
      const { error } = await supabase.from('checkouts').update(buildCheckoutPayload()).eq('id', selectedCheckout.id);
      if (error) throw error;
      toast.success('Checkout atualizado!');
      setView('list'); resetForm(); loadCheckouts();
    } catch (error: any) { toast.error(error.message || 'Erro ao atualizar'); }
  };

  const handleDelete = async (id: string) => {
    const confirmation = prompt('Para excluir este checkout, digite a palavra "excluir":');
    if (confirmation !== 'excluir') {
      if (confirmation !== null) toast.error('Palavra de confirmação incorreta.');
      return;
    }
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
      logo_url: (checkout as any).logo_url || '',
      background_color: (checkout as any).background_color || '#F8FAFC',
      text_color: (checkout as any).text_color || '#0f172a',
      footer_text: (checkout as any).footer_text || 'Compra 100% Segura',
      footer_color: (checkout as any).footer_color || '#64748b',
      show_fake_feedback: (checkout as any).show_fake_feedback || false,
      fake_feedbacks: (checkout as any).fake_feedbacks || [],
      product_type: (checkout as any).product_type || 'digital_product',
    });
    setView('editor');
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
    <CheckoutFormFields 
      formData={formData} 
      setFormData={setFormData} 
      formTab={formTab} 
      setFormTab={setFormTab} 
      membersAreas={membersAreas}
      catalogs={catalogs}
    />
  );


  if (view === 'editor') {
    return (
      <div className="fixed inset-0 z-50 bg-background flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Editor Header */}
        <div className="h-16 border-b px-6 flex items-center justify-between bg-slate-900 text-white shadow-sm shrink-0">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setView('list')} 
              className="rounded-full text-white hover:bg-white/10 hover:text-white"
            >
              <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
            </Button>
            <div className="h-6 w-px bg-white/20 hidden sm:block"></div>
            <h2 className="font-bold text-lg hidden sm:block text-white">
              {selectedCheckout ? 'Editando: ' + selectedCheckout.name : 'Novo Checkout'}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              onClick={() => setView('list')} 
              className="hidden sm:flex text-white hover:bg-white/10 hover:text-white"
            >
              <X className="w-4 h-4 mr-2" /> Cancelar
            </Button>
            <Button 
              onClick={selectedCheckout ? handleEdit : handleCreate} 
              className="gap-2 bg-primary hover:bg-primary/90 text-white border-0 px-6 shadow-lg shadow-primary/20 transition-all active:scale-95"
            >
              <Save className="w-4 h-4" /> {selectedCheckout ? 'Salvar Alterações' : 'Criar Checkout'}
            </Button>
          </div>
        </div>
        </div>

        {/* Editor Content */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Controls Panel */}
          <div className="w-full md:w-[450px] border-r bg-muted/10 overflow-hidden flex flex-col">
            <div className="p-6 overflow-y-auto">
              {renderFormFields()}
            </div>
          </div>

          {/* Live Preview Panel */}
          <div className="flex-1 bg-slate-100 p-4 md:p-8 overflow-y-auto flex flex-col items-center">
            <div className="w-full max-w-[800px] bg-white rounded-2xl shadow-2xl overflow-hidden ring-1 ring-black/5 aspect-[3/4] sm:aspect-auto sm:min-h-[90vh]">
               <div className="bg-slate-800 text-white p-2 px-4 flex items-center gap-2 text-xs opacity-50">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
                  </div>
                  <div className="flex-1 text-center font-mono opacity-80">
                    preview.meucheckout.com/{formData.slug || 'meu-link'}
                  </div>
               </div>
               <div className="w-full h-full overflow-y-auto bg-slate-50">
                  <CheckoutPreview checkout={formData} />
               </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
        <Button onClick={() => { resetForm(); setView('editor'); setSelectedCheckout(null); }}>
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
            <Button onClick={() => { resetForm(); setView('editor'); setSelectedCheckout(null); }}>
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
