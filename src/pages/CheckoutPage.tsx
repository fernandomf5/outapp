import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { CreditCard, Loader2, ShoppingCart, Shield, Plus, Minus, CheckCircle2, Lock, Smartphone, Star, Package, TrendingUp } from "lucide-react";
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
  logo_url: string | null;
  background_color: string | null;
  text_color: string | null;
  footer_text: string | null;
  footer_color: string | null;
  show_fake_feedback: boolean;
  fake_feedbacks: any[];
  custom_settings?: any;
  card_color?: string;
  title_color?: string;
  subtitle_color?: string;
  footer_text_color?: string;
  logo_size?: string;
  logo_alignment?: string;
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
      const settings = data.custom_settings && typeof data.custom_settings === 'object' ? data.custom_settings : {};
      setCheckout({ ...data, ...settings });

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
  
  // Custom Styles from Settings
  const bgColor = checkout.background_color || checkout.card_color || '#F8FAFC';
  const textColor = checkout.title_color || checkout.text_color || '#0f172a';
  const subtitleColor = checkout.subtitle_color || '#666666';
  const footerColor = checkout.footer_text_color || checkout.footer_color || '#64748b';

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

  // Styles were moved up for accessibility


  return (
    <>
      <Helmet>
        <title>{checkout.name}</title>
        {checkout.head_code && <script>{checkout.head_code}</script>}
      </Helmet>

      <div className="min-h-screen flex flex-col items-center transition-all duration-300" style={{ backgroundColor: bgColor, color: textColor }}>
        {/* Modern Header */}
        <div className="w-full bg-white/80 backdrop-blur-md border-b sticky top-0 z-50 flex justify-center p-4" style={{ backgroundColor: checkout.card_color || '#ffffff', color: textColor }}>
          <div className={`w-full max-w-6xl flex items-center ${checkout.logo_alignment === 'left' ? 'justify-start' : checkout.logo_alignment === 'right' ? 'justify-end' : 'justify-center'} relative`}>
             <div className="flex items-center justify-between w-full">
               <div className={`flex items-center gap-2 ${checkout.logo_alignment === 'center' ? 'mx-auto' : ''}`}>
                 {checkout.logo_url || checkout.item_image_url ? (
                   <img src={checkout.logo_url || checkout.item_image_url || ""} alt="Logo" className={`${checkout.logo_size || 'h-8 md:h-10'} object-contain`} />
                 ) : (
                   <div className="font-bold text-xl md:text-2xl flex items-center gap-2" style={{ color: textColor }}>
                     <Package className="w-6 h-6 md:w-8 md:h-8" style={{ color: primaryColor }} />
                     <span>{checkout.name}</span>
                   </div>
                 )}
               </div>
               
               <div className={`hidden md:flex items-center gap-4 text-[10px] font-bold uppercase tracking-wider opacity-60 ${checkout.logo_alignment === 'right' ? 'absolute left-0' : ''}`}>
                 <span className="flex items-center gap-1" style={{ color: textColor }}><Shield className="w-3 h-3 text-green-500" /> Compra Segura</span>
                 <span className="flex items-center gap-1" style={{ color: textColor }}><Lock className="w-3 h-3" /> SSL Protegido</span>
               </div>
             </div>
          </div>
        </div>

        <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8 p-4 md:p-8">
          <div className="md:col-span-7 lg:col-span-8 space-y-6">
            <Card className="overflow-hidden shadow-xl border-none rounded-3xl" style={{ backgroundColor: checkout.card_color || '#ffffff', color: textColor }}>
              {checkout.banner_url && (
                <div className="w-full h-40 md:h-64 overflow-hidden">
                  <img src={checkout.banner_url} alt="Banner" className="w-full h-full object-cover" />
                </div>
              )}
              
              <CardContent className="space-y-8 p-6 md:p-10">
                {/* Product Section */}
                <div className="relative group">
                   <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-primary/10 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
                   <div className="relative flex flex-col md:flex-row items-center gap-6 p-6 rounded-2xl bg-muted/20 border border-white/50">
                    {checkout.item_image_url && (
                      <img src={checkout.item_image_url} alt={checkout.item_name} className="w-24 h-24 md:w-32 md:h-32 rounded-2xl object-cover shadow-lg" />
                    )}
                    <div className="flex-1 text-center md:text-left">
                      <Badge className="mb-2" style={{ backgroundColor: primaryColor }}>Oferta Ativa</Badge>
                      <h3 className="text-xl md:text-2xl font-black leading-tight" style={{ color: textColor }}>{checkout.item_name}</h3>
                      {checkout.item_description && <p className="text-sm mt-2 line-clamp-2" style={{ color: subtitleColor }}>{checkout.item_description}</p>}
                      <div className="flex items-center justify-center md:justify-start gap-3 mt-4">
                        <p className="text-3xl font-black" style={{ color: primaryColor }}>R$ {Number(checkout.price).toFixed(2)}</p>
                        <span className="text-sm text-muted-foreground line-through opacity-50">R$ {(Number(checkout.price) * 1.5).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {bumps.length > 0 && !showPayment && (
                  <div className="space-y-4">
                    <h4 className="font-black text-sm uppercase tracking-widest flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" style={{ color: primaryColor }} /> 🔥 Aproveite Agora
                    </h4>
                    <div className="grid gap-3">
                      {bumps.map(bump => (
                        <div key={bump.id} className="group relative">
                          <div className={`absolute -inset-0.5 rounded-2xl blur opacity-20 transition duration-500 ${selectedBumps.has(bump.id) ? 'bg-primary' : 'bg-transparent'}`}></div>
                          <div className={`relative flex items-center gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all duration-300 ${selectedBumps.has(bump.id) ? 'border-primary bg-primary/5' : 'bg-white hover:border-primary/30'}`}
                            style={{ borderColor: selectedBumps.has(bump.id) ? primaryColor : undefined, backgroundColor: checkout.card_color || '#ffffff' }}
                            onClick={() => toggleBump(bump.id)}
                          >
                            <Checkbox checked={selectedBumps.has(bump.id)} onCheckedChange={() => toggleBump(bump.id)} className="w-5 h-5" />
                            {bump.image_url && <img src={bump.image_url} alt={bump.name} className="w-14 h-14 rounded-xl object-cover" />}
                            <div className="flex-1">
                              <p className="font-bold text-sm md:text-base" style={{ color: textColor }}>{bump.name}</p>
                              <div className="flex items-center gap-2">
                                <span className="font-black text-sm" style={{ color: primaryColor }}>+ R$ {Number(bump.price).toFixed(2)}</span>
                                <Badge variant="secondary" className="text-[9px] h-4">SÓ HOJE</Badge>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="border-t pt-8">
                  {!showPayment && (
                    <div className="space-y-6">
                      <h4 className="font-black text-sm uppercase tracking-widest flex items-center gap-2" style={{ color: textColor }}>
                        <span className="w-6 h-6 rounded-full text-white text-[10px] flex items-center justify-center font-black" style={{ backgroundColor: primaryColor }}>1</span>
                        Informações de Contato
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-xs font-bold uppercase opacity-70" style={{ color: textColor }}>Nome Completo *</Label>
                          <Input className="h-12 rounded-xl border-none shadow-sm" style={{ backgroundColor: checkout.field_color || 'rgba(0,0,0,0.05)', color: textColor }} value={customerData.name} onChange={(e) => setCustomerData({ ...customerData, name: e.target.value })} placeholder="Como prefere ser chamado?" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs font-bold uppercase opacity-70" style={{ color: textColor }}>E-mail para entrega *</Label>
                          <Input className="h-12 rounded-xl border-none shadow-sm" type="email" style={{ backgroundColor: checkout.field_color || 'rgba(0,0,0,0.05)', color: textColor }} value={customerData.email} onChange={(e) => setCustomerData({ ...customerData, email: e.target.value })} placeholder="Onde enviaremos seu acesso?" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs font-bold uppercase opacity-70" style={{ color: textColor }}>WhatsApp</Label>
                          <Input className="h-12 rounded-xl bg-muted/20 border-none" value={customerData.phone} onChange={(e) => setCustomerData({ ...customerData, phone: e.target.value })} placeholder="(00) 00000-0000" />
                        </div>
                         <div className="space-y-2">
                          <Label className="text-xs font-bold uppercase opacity-70" style={{ color: textColor }}>CPF / CNPJ *</Label>
                          <Input className="h-12 rounded-xl bg-muted/20 border-none" value={customerData.cpf} onChange={(e) => setCustomerData({ ...customerData, cpf: e.target.value })} placeholder="000.000.000-00" />
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="mt-8">
                    {showPayment && orderId && mpPublicKey ? (
                      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                         <h4 className="font-black text-sm uppercase tracking-widest flex items-center gap-2 mb-6">
                          <span className="w-6 h-6 rounded-full text-white text-[10px] flex items-center justify-center font-black" style={{ backgroundColor: primaryColor }}>2</span>
                          Escolha a forma de pagamento
                        </h4>
                        <TransparentCheckout
                          checkoutId={checkout.id} orderId={orderId} amount={total}
                          customerName={customerData.name} customerEmail={customerData.email} customerCpf={customerData.cpf}
                          primaryColor={primaryColor} itemName={checkout.item_name}
                          onSuccess={handlePaymentSuccess} onError={handlePaymentError} mpPublicKey={mpPublicKey}
                        />
                      </div>
                    ) : !showPayment ? (
                      <Button className="w-full h-16 text-lg font-black rounded-2xl shadow-2xl transition-all active:scale-95 group relative overflow-hidden" style={{ backgroundColor: primaryColor }} onClick={handleProceedToPayment}>
                        <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500"></div>
                        <CreditCard className="w-6 h-6 mr-3" /> IR PARA O PAGAMENTO
                      </Button>
                    ) : !mpPublicKey ? (
                      <div className="text-center p-6 bg-destructive/5 rounded-2xl border-2 border-dashed border-destructive/20 text-destructive font-bold">
                        Mercado Pago não configurado corretamente.
                      </div>
                    ) : null}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Social Proof Section */}
            {checkout.show_fake_feedback && checkout.fake_feedbacks && checkout.fake_feedbacks.length > 0 && (
               <div className="space-y-6 animate-in fade-in duration-700 delay-300">
                  <div className="flex items-center justify-between px-2">
                    <h4 className="font-black text-sm uppercase tracking-widest" style={{ color: textColor }}>Opinião de quem já comprou</h4>
                    <div className="flex text-yellow-400 gap-1">
                      {[1,2,3,4,5].map(s => <Star key={s} className="w-4 h-4 fill-current" />)}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {checkout.fake_feedbacks.map((f: any, i: number) => (
                      <Card key={i} className="border-none shadow-sm rounded-2xl p-6 flex gap-4" style={{ backgroundColor: (checkout.card_color || '#ffffff') + '99', backdropFilter: 'blur(8px)' }}>
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary flex-shrink-0" style={{ color: primaryColor }}>{f.name?.[0] || 'U'}</div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                             <p className="font-bold text-sm" style={{ color: textColor }}>{f.name}</p>
                             <CheckCircle2 className="w-3 h-3 text-blue-500" />
                          </div>
                          <p className="text-sm opacity-80 leading-relaxed italic" style={{ color: subtitleColor }}>"{f.text}"</p>
                        </div>
                      </Card>
                    ))}
                  </div>
               </div>
            )}
          </div>

          <div className="md:col-span-5 lg:col-span-4 space-y-6">
            <Card className="shadow-2xl border-none rounded-3xl sticky top-24 overflow-hidden" style={{ backgroundColor: checkout.card_color || '#ffffff' }}>
              <div className="p-6 bg-muted/30 border-b flex items-center justify-between">
                <CardTitle className="text-lg font-black flex items-center gap-2" style={{ color: textColor }}><ShoppingCart className="w-5 h-5" style={{ color: primaryColor }} /> RESUMO</CardTitle>
                <Badge variant="outline" className="font-black text-[10px]">TOTAL</Badge>
              </div>
              <CardContent className="space-y-6 p-6">
                <div className="flex gap-4 items-center">
                  {checkout.item_image_url && <img src={checkout.item_image_url} alt={checkout.item_name} className="w-16 h-16 rounded-xl object-cover flex-shrink-0 shadow-md" />}
                  <div className="flex-1">
                    <h3 className="font-bold text-sm line-clamp-1" style={{ color: textColor }}>{checkout.item_name}</h3>
                    <p className="text-lg font-black" style={{ color: primaryColor }}>R$ {Number(checkout.price).toFixed(2)}</p>
                  </div>
                </div>
                
                {getSelectedExtras().length > 0 && (
                  <div className="space-y-3 pt-4 border-t border-dashed">
                    {getSelectedExtras().map((ex, i) => (
                      <div key={i} className="flex justify-between items-center text-sm">
                        <span className="font-medium flex items-center gap-2" style={{ color: subtitleColor }}><Plus className="w-3 h-3" /> {ex.name}</span>
                        <span className="font-bold" style={{ color: textColor }}>R$ {(ex.price * ex.qty).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="pt-6 mt-4 border-t-2 border-black/5">
                  <div className="flex justify-between items-center mb-6">
                    <span className="text-sm font-black uppercase tracking-widest opacity-60" style={{ color: textColor }}>Total a pagar</span>
                    <span className="text-3xl font-black" style={{ color: primaryColor }}>R$ {total.toFixed(2)}</span>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 text-[10px] font-black uppercase text-green-600 bg-green-50 p-4 rounded-xl border border-green-100">
                      <Shield className="w-5 h-5 flex-shrink-0" />
                      <span style={{ color: subtitleColor }}>Sua compra é processada em um ambiente 100% criptografado e seguro.</span>
                    </div>
                    
                    <div className="flex justify-center items-center gap-6 opacity-40 grayscale hover:grayscale-0 transition-all duration-500">
                      <img src="https://logodownload.org/wp-content/uploads/2014/10/mercado-pago-logo-1.png" alt="Mercado Pago" className="h-4 object-contain" />
                      <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Logo_Pix.svg/1200px-Logo_Pix.svg.png" alt="PIX" className="h-4 object-contain" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {!showPayment && related.length > 0 && (
              <Card className="shadow-xl border-none rounded-3xl overflow-hidden" style={{ backgroundColor: checkout.card_color || '#ffffff' }}>
                <CardHeader className="bg-muted/20 pb-4"><CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2" style={{ color: textColor }}>🛒 Frequentemente comprados juntos</CardTitle></CardHeader>
                <CardContent className="p-4 grid gap-3">
                  {related.map(item => (
                    <div key={item.id} className="group flex items-center gap-3 p-3 rounded-2xl border-2 border-transparent bg-muted/10 hover:border-primary/20 transition-all">
                      {item.image_url && <img src={item.image_url} alt={item.name} className="w-12 h-12 rounded-xl object-cover shadow-sm" />}
                      <div className="flex-1">
                        <p className="font-bold text-xs truncate" style={{ color: textColor }}>{item.name}</p>
                        <p className="font-black text-xs" style={{ color: primaryColor }}>R$ {Number(item.price).toFixed(2)}</p>
                      </div>
                      <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full bg-white shadow-sm hover:bg-primary hover:text-white transition-all" onClick={() => updateRelatedQty(item.id, 1)}>
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
        
        {/* Modern Footer */}
        <div className="w-full max-w-6xl mt-12 mb-12 px-8 text-center space-y-6">
           <div className="w-full h-px bg-black/5"></div>
           <p className="text-[10px] md:text-xs font-black uppercase tracking-[0.3em]" style={{ color: footerColor }}>
             {checkout.footer_text || 'COMPRA 100% SEGURA & PROTEGIDA'}
           </p>
           <div className="flex justify-center flex-wrap gap-4 text-[10px] font-bold opacity-40 uppercase tracking-widest">
             <span className="hover:opacity-100 cursor-pointer transition-opacity" style={{ color: footerColor }}>Privacidade</span>
             <span className="hover:opacity-100 cursor-pointer transition-opacity" style={{ color: footerColor }}>Termos de Uso</span>
             <span className="hover:opacity-100 cursor-pointer transition-opacity" style={{ color: footerColor }}>Contato</span>
           </div>
        </div>

        {checkout.footer_code && <div dangerouslySetInnerHTML={{ __html: checkout.footer_code }} />}
      </div>
    </>
  );
};

export default CheckoutPage;
