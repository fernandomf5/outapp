import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { CreditCard, Loader2, ShoppingCart, Shield, Plus, Minus, CheckCircle2 } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { TransparentCheckout } from "@/components/TransparentCheckout";

interface CheckoutData {
  id: string;
  name: string;
  description: string | null;
  slug: string;
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
  user_id: string;
  head_code: string | null;
  footer_code: string | null;
}

interface AdditionalItem {
  id: string;
  item_type: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_active: boolean;
}

const CheckoutPage = () => {
  const { checkoutId } = useParams();
  const [checkout, setCheckout] = useState<CheckoutData | null>(null);
  const [additionalItems, setAdditionalItems] = useState<AdditionalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBumps, setSelectedBumps] = useState<Set<string>>(new Set());
  const [relatedCart, setRelatedCart] = useState<Map<string, number>>(new Map());
  const [mpPublicKey, setMpPublicKey] = useState<string | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [accessCode, setAccessCode] = useState<string | null>(null);

  const [customerData, setCustomerData] = useState({
    name: '', email: '', phone: '', cpf: '',
  });

  useEffect(() => { loadCheckout(); }, [checkoutId]);

  const loadCheckout = async () => {
    try {
      if (!checkoutId) { setError('Checkout não encontrado'); return; }

      const { data, error: fetchError } = await supabase
        .from('checkouts').select('*').eq('id', checkoutId).eq('is_active', true).single();
      if (fetchError || !data) { setError('Checkout não encontrado ou inativo'); return; }
      setCheckout(data as any);

      let pubKey = (data as any).mp_public_key;
      if (!pubKey) {
        const { data: mpSettings } = await supabase
          .from('site_settings').select('value').eq('key', 'mercadopago_public_key').single();
        pubKey = mpSettings?.value;
      }
      setMpPublicKey(pubKey);

      const { data: items } = await supabase
        .from('checkout_additional_items').select('*')
        .eq('checkout_id', checkoutId).eq('is_active', true).order('sort_order');
      setAdditionalItems((items || []) as any);
    } catch { setError('Erro ao carregar checkout'); }
    finally { setLoading(false); }
  };

  const toggleBump = (id: string) => {
    const newSet = new Set(selectedBumps);
    if (newSet.has(id)) newSet.delete(id); else newSet.add(id);
    setSelectedBumps(newSet);
  };

  const updateRelatedQty = (id: string, delta: number) => {
    const newMap = new Map(relatedCart);
    const current = newMap.get(id) || 0;
    const newQty = Math.max(0, current + delta);
    if (newQty === 0) newMap.delete(id); else newMap.set(id, newQty);
    setRelatedCart(newMap);
  };

  const calculateTotal = () => {
    if (!checkout) return 0;
    let total = Number(checkout.price);
    selectedBumps.forEach(id => {
      const item = additionalItems.find(i => i.id === id);
      if (item) total += Number(item.price);
    });
    relatedCart.forEach((qty, id) => {
      const item = additionalItems.find(i => i.id === id);
      if (item) total += Number(item.price) * qty;
    });
    return total;
  };

  const getSelectedExtras = () => {
    const extras: any[] = [];
    selectedBumps.forEach(id => {
      const item = additionalItems.find(i => i.id === id);
      if (item) extras.push({ id: item.id, name: item.name, price: Number(item.price), qty: 1, type: 'bump' });
    });
    relatedCart.forEach((qty, id) => {
      const item = additionalItems.find(i => i.id === id);
      if (item) extras.push({ id: item.id, name: item.name, price: Number(item.price), qty, type: 'related' });
    });
    return extras;
  };

  const handleProceedToPayment = async () => {
    if (!checkout) return;
    if (!customerData.name.trim() || !customerData.email.trim()) {
      alert('Preencha nome e email para continuar'); return;
    }
    if (!customerData.cpf.trim()) {
      alert('Preencha o CPF para pagamento'); return;
    }

    try {
      const totalAmount = calculateTotal();
      const extras = getSelectedExtras();

      const { data: order, error: orderError } = await supabase
        .from('checkout_orders').insert({
          checkout_id: checkout.id, user_id: checkout.user_id,
          customer_name: customerData.name, customer_email: customerData.email,
          customer_phone: customerData.phone || null, customer_cpf: customerData.cpf || null,
          amount: totalAmount, status: 'pending',
          additional_items: extras,
        }).select().single();
      if (orderError) throw orderError;

      setOrderId(order.id);
      setShowPayment(true);
    } catch (err: any) {
      console.error('Erro ao criar pedido:', err);
      alert(err.message || 'Erro ao processar');
    }
  };

  const handlePaymentSuccess = (data: { accessCode?: string; paymentId: string }) => {
    setPaymentSuccess(true);
    if (data.accessCode) setAccessCode(data.accessCode);
  };

  const handlePaymentError = (errorMsg: string) => {
    alert(errorMsg);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !checkout) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="p-8">
            <ShoppingCart className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">Checkout Indisponível</h2>
            <p className="text-muted-foreground">{error || 'Este checkout não está disponível.'}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const primaryColor = checkout.primary_color || '#8B5CF6';
  const total = calculateTotal();
  const bumps = additionalItems.filter(i => i.item_type === 'bump');
  const related = additionalItems.filter(i => i.item_type === 'related');

  if (paymentSuccess) {
    return (
      <>
        <Helmet><title>Pagamento Confirmado!</title></Helmet>
        <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
          <Card className="w-full max-w-lg text-center overflow-hidden shadow-xl border-none rounded-2xl">
            <div className="p-8 space-y-6">
              <div className="w-20 h-20 mx-auto rounded-full flex items-center justify-center" style={{ backgroundColor: `${primaryColor}20` }}>
                <CheckCircle2 className="w-10 h-10" style={{ color: primaryColor }} />
              </div>
              <div>
                <h1 className="text-2xl font-bold mb-2">🎉 Pagamento Confirmado!</h1>
                <p className="text-muted-foreground">Seu pagamento foi processado com sucesso.</p>
              </div>
              {accessCode && (
                <div className="p-6 rounded-xl border-2 border-dashed" style={{ borderColor: primaryColor, backgroundColor: `${primaryColor}08` }}>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Seu Código de Acesso</p>
                  <p className="text-3xl font-bold font-mono tracking-widest" style={{ color: primaryColor }}>{accessCode}</p>
                </div>
              )}
              <p className="text-sm text-muted-foreground">{checkout.success_message || 'Obrigado pela sua compra!'}</p>
              {checkout.redirect_url && (
                <Button className="w-full" style={{ backgroundColor: primaryColor }} onClick={() => window.location.href = checkout.redirect_url!}>Continuar</Button>
              )}
            </div>
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>{checkout.name}</title>
        {checkout.head_code && <script>{checkout.head_code}</script>}
      </Helmet>

      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center p-4 md:p-8">
        <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-12 gap-8">
          <div className="md:col-span-7 lg:col-span-8 space-y-6">
            <Card className="overflow-hidden shadow-sm border-none bg-white rounded-2xl">
              {checkout.banner_url && (
                <div className="w-full h-48 overflow-hidden">
                  <img src={checkout.banner_url} alt="Banner" className="w-full h-full object-cover" />
                </div>
              )}
              <CardHeader className="text-center" style={{ borderBottom: `3px solid ${primaryColor}` }}>
                <CardTitle className="text-2xl">{checkout.name}</CardTitle>
                {checkout.description && <p className="text-sm text-muted-foreground mt-1">{checkout.description}</p>}
              </CardHeader>

              <CardContent className="space-y-6 p-6">
                <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/50 border">
                  {checkout.item_image_url && (
                    <img src={checkout.item_image_url} alt={checkout.item_name} className="w-20 h-20 rounded-lg object-cover flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <h3 className="font-semibold">{checkout.item_name}</h3>
                    {checkout.item_description && <p className="text-sm text-muted-foreground mt-1">{checkout.item_description}</p>}
                    <p className="text-2xl font-bold mt-2" style={{ color: primaryColor }}>R$ {Number(checkout.price).toFixed(2)}</p>
                  </div>
                </div>

                {bumps.length > 0 && !showPayment && (
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm flex items-center gap-2">🔥 Aproveite e adicione:</h4>
                    {bumps.map(bump => (
                      <div key={bump.id} className="flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors"
                        style={{ borderColor: selectedBumps.has(bump.id) ? primaryColor : 'transparent', backgroundColor: selectedBumps.has(bump.id) ? `${primaryColor}10` : undefined }}
                        onClick={() => toggleBump(bump.id)}
                      >
                        <Checkbox checked={selectedBumps.has(bump.id)} onCheckedChange={() => toggleBump(bump.id)} />
                        {bump.image_url && <img src={bump.image_url} alt={bump.name} className="w-12 h-12 rounded object-cover" />}
                        <div className="flex-1">
                          <p className="font-medium text-sm">{bump.name}</p>
                          <span className="font-bold text-sm" style={{ color: primaryColor }}>+ R$ {Number(bump.price).toFixed(2)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {!showPayment && (
                  <div className="space-y-4">
                    <div>
                      <Label>Nome Completo *</Label>
                      <Input value={customerData.name} onChange={(e) => setCustomerData({ ...customerData, name: e.target.value })} placeholder="Seu nome completo" />
                    </div>
                    <div>
                      <Label>Email *</Label>
                      <Input type="email" value={customerData.email} onChange={(e) => setCustomerData({ ...customerData, email: e.target.value })} placeholder="seu@email.com" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div><Label>Telefone</Label><Input value={customerData.phone} onChange={(e) => setCustomerData({ ...customerData, phone: e.target.value })} placeholder="(00) 00000-0000" /></div>
                      <div><Label>CPF *</Label><Input value={customerData.cpf} onChange={(e) => setCustomerData({ ...customerData, cpf: e.target.value })} placeholder="000.000.000-00" /></div>
                    </div>
                  </div>
                )}

                {showPayment && orderId && mpPublicKey ? (
                  <TransparentCheckout
                    checkoutId={checkout.id} orderId={orderId} amount={total}
                    customerName={customerData.name} customerEmail={customerData.email} customerCpf={customerData.cpf}
                    primaryColor={primaryColor} itemName={checkout.item_name}
                    onSuccess={handlePaymentSuccess} onError={handlePaymentError} mpPublicKey={mpPublicKey}
                  />
                ) : !showPayment ? (
                  <Button className="w-full h-12 text-lg font-semibold" style={{ backgroundColor: primaryColor }} onClick={handleProceedToPayment}>
                    <CreditCard className="w-5 h-5 mr-2" />Continuar para Pagamento - R$ {total.toFixed(2)}
                  </Button>
                ) : !mpPublicKey ? (
                  <div className="text-center p-4 bg-destructive/10 rounded-lg"><p className="text-sm text-destructive">Mercado Pago Public Key não configurada.</p></div>
                ) : null}
              </CardContent>
            </Card>
          </div>

          <div className="md:col-span-5 lg:col-span-4 space-y-6">
            <Card className="shadow-sm border-none bg-white rounded-2xl sticky top-8">
              <CardHeader><CardTitle className="text-xl flex items-center gap-2"><ShoppingCart className="w-5 h-5 text-primary" />Resumo do Pedido</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-4">
                  {checkout.item_image_url && <img src={checkout.item_image_url} alt={checkout.item_name} className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />}
                  <div className="flex-1"><h3 className="font-semibold text-sm">{checkout.item_name}</h3><p className="text-lg font-bold" style={{ color: primaryColor }}>R$ {Number(checkout.price).toFixed(2)}</p></div>
                </div>
                {getSelectedExtras().length > 0 && (
                  <div className="space-y-2 pt-4 border-t">
                    {getSelectedExtras().map((ex, i) => (
                      <div key={i} className="flex justify-between text-sm"><span className="text-muted-foreground">{ex.name}</span><span>R$ {(ex.price * ex.qty).toFixed(2)}</span></div>
                    ))}
                  </div>
                )}
                <div className="pt-4 border-t space-y-2">
                  <div className="flex justify-between text-xl font-bold pt-2"><span>Total</span><span style={{ color: primaryColor }}>R$ {total.toFixed(2)}</span></div>
                </div>
                <div className="pt-4 space-y-3">
                  <div className="flex items-center gap-3 text-xs text-green-600 bg-green-50 p-3 rounded-lg border border-green-100"><Shield className="w-4 h-4" /><span>Ambiente seguro</span></div>
                  <div className="flex justify-center gap-4 opacity-50 grayscale">
                    <img src="https://logodownload.org/wp-content/uploads/2014/10/mercado-pago-logo-1.png" alt="Mercado Pago" className="h-4 object-contain" />
                    <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Logo_Pix.svg/1200px-Logo_Pix.svg.png" alt="PIX" className="h-4 object-contain" />
                  </div>
                </div>
              </CardContent>
            </Card>
            {!showPayment && related.length > 0 && (
              <Card className="shadow-sm border-none bg-white rounded-2xl">
                <CardHeader className="pb-3"><CardTitle className="text-base">🛍️ Você também pode gostar</CardTitle></CardHeader>
                <CardContent className="grid gap-3">
                  {related.map(item => (
                    <div key={item.id} className="flex items-center gap-3 p-3 rounded-lg border bg-muted/50">
                      {item.image_url && <img src={item.image_url} alt={item.name} className="w-12 h-12 rounded object-cover" />}
                      <div className="flex-1"><p className="font-medium text-xs">{item.name}</p><p className="font-bold text-xs" style={{ color: primaryColor }}>R$ {Number(item.price).toFixed(2)}</p></div>
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => updateRelatedQty(item.id, 1)}><Plus className="w-4 h-4 text-primary" /></Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
        {checkout.footer_code && <div dangerouslySetInnerHTML={{ __html: checkout.footer_code }} />}
      </div>
    </>
  );
};

export default CheckoutPage;
