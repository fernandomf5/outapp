import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Package, Shield, ShoppingCart, CheckCircle2, Star, CreditCard, Lock, Smartphone, Heart, Clock, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const CountdownTimer = ({ initialSeconds, activeTab }: { initialSeconds: number, activeTab?: string }) => {
  const [seconds, setSeconds] = useState(initialSeconds);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    // Reset timer when initialSeconds changes (e.g., edited in panel)
    setSeconds(initialSeconds);
    setIsActive(true);
  }, [initialSeconds]);

  useEffect(() => {
    if (!isActive) return;
    
    const intervalId = setInterval(() => {
      setSeconds(prev => {
        if (prev <= 0) {
          clearInterval(intervalId);
          setIsActive(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(intervalId);
  }, [isActive]);

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div className={`p-4 rounded-2xl bg-green-600 text-white shadow-lg flex items-center justify-between gap-4 ${activeTab === 'scarcity' ? 'ring-2 ring-green-500 ring-offset-4 ring-offset-slate-900 animate-pulse' : ''}`}>
      <div className="flex items-center gap-2">
        <Clock className="w-6 h-6 animate-pulse" />
        <p className="text-[10px] font-bold leading-tight">OFERTA POR TEMPO LIMITADO!</p>
      </div>
      <div className="text-xl font-black font-mono bg-white/10 px-3 py-1 rounded-lg">
        {formatTime(seconds)}
      </div>
    </div>
  );
};

export const CheckoutPreview = ({ checkout, activeTab, onTabChange, device = 'desktop' }: { checkout: any, activeTab?: string, onTabChange?: (tab: string) => void, device?: 'desktop' | 'tablet' | 'mobile' }) => {
  const primaryColor = checkout.primary_color || '#8B5CF6';
  const bgColor = checkout.background_color || checkout.card_color || '#F8FAFC';
  const textColor = checkout.title_color || '#0f172a';
  const subtitleColor = checkout.subtitle_color || '#666666';
  const footerColor = checkout.footer_text_color || '#64748b';
  
  const layoutModel = 'modern';
  const layoutStructure = 'split';
  const layoutWidth = 'full';

  const innerBgColor = checkout.inner_bg_color === 'transparent' ? 'transparent' : checkout.inner_bg_color || 'rgba(0,0,0,0.03)';
  const borderColor = checkout.border_color || '#e2e8f0';
  const cardRadius = checkout.card_radius || 'rounded-3xl';
  const cardShadow = checkout.card_shadow || 'shadow-sm';

  // Device-aware helpers (preview uses device prop, NOT real viewport)
  const isMobile = device === 'mobile';
  const isTablet = device === 'tablet';
  const isDesktop = device === 'desktop';

  const cs = checkout.custom_settings || {};
  const pickDevice = (base: string, key: string, fallback: string) => {
    if (isMobile) return cs[`${key}_mobile`] || checkout[`${key}_mobile`] || cs[key] || checkout[key] || base || fallback;
    if (isTablet) return cs[`${key}_tablet`] || checkout[`${key}_tablet`] || cs[key] || checkout[key] || base || fallback;
    return cs[key] || checkout[key] || base || fallback;
  };

  const logoSize = pickDevice('', 'logo_size', 'h-8');
  const logoAlign = pickDevice('', 'logo_alignment', 'center');
  const headerTitleSize = pickDevice('', 'header_title_font_size', 'text-xl');

  const logoAlignClass = logoAlign === 'left'
    ? 'justify-start mr-auto'
    : logoAlign === 'right'
      ? 'justify-end ml-auto flex-row-reverse'
      : 'justify-center mx-auto';

  const feedbacks = checkout.fake_feedbacks || [
    { name: "Ana Silva", text: "Amei o curso! Muito prático.", rating: 5, avatar: "" },
    { name: "João Pereira", text: "Entrega super rápida do acesso.", rating: 5, avatar: "" }
  ];

  const EditButton = ({ tab, className = "" }: { tab: string, className?: string }) => (
    <button 
      onClick={(e) => { e.stopPropagation(); onTabChange?.(tab); }}
      className={`absolute -top-2 -right-2 w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-50 shadow-lg hover:bg-green-700 cursor-pointer ${className}`}
    >
      <Pencil className="w-4 h-4" />
    </button>
  );

  // Layout: on mobile, always stacked. On tablet, stacked. On desktop, split.
  const useSplitLayout = isDesktop && layoutStructure === 'split';

  return (
    <div 
      className={`w-full h-full min-h-[600px] border rounded-xl overflow-y-auto scrollbar-hide shadow-lg transition-all duration-300 relative`}
      style={{ backgroundColor: bgColor }}
    >
      {/* Mini Header / Logo */}
      <div className={`w-full p-4 border-b sticky top-0 z-10 flex items-center group relative`} style={{ backgroundColor: checkout.top_bar_bg_color || cs.card_color || '#ffffff' }}>
        <EditButton tab="header" />
        <div className={`flex ${isMobile ? 'flex-col' : 'flex-row'} items-center gap-2 ${isMobile ? '' : 'gap-4'} w-full ${logoAlignClass}`}>
          <div className="flex items-center gap-2">
            {checkout.item_image_url ? (
              <img 
                src={checkout.item_image_url} 
                alt="Logo" 
                className={`object-contain ${logoSize}`}
              />
            ) : (
              <div className="font-bold text-xl flex items-center gap-2" style={{ color: textColor }}>
                <Package className="w-6 h-6" style={{ color: primaryColor }} />
                <span>{checkout.name || 'Minha Loja'}</span>
              </div>
            )}
          </div>
          {checkout.header_title && (
            <h1 
              className={`text-center ${headerTitleSize} ${cs.header_title_bold !== false ? 'font-bold' : ''}`}
              style={{ color: checkout.header_title_color || textColor }}
            >
              {checkout.header_title}
            </h1>
          )}
        </div>
      </div>

      <div className={`${isMobile ? 'p-3' : 'p-4'} space-y-6 ${isDesktop ? 'max-w-6xl mx-auto' : ''}`}>
        {/* Banner */}
        {checkout.banner_url && (
          <div className={`w-full overflow-hidden rounded-2xl shadow-sm ${isMobile ? 'h-32' : isTablet ? 'h-40' : 'h-48'}`}>
            <img src={checkout.banner_url} alt="Banner" className="w-full h-full object-cover" />
          </div>
        )}

        <div className={`grid grid-cols-1 gap-6 ${useSplitLayout ? 'grid-cols-12' : ''}`}>
          {/* Order Summary Column */}
          <div className={`${useSplitLayout ? 'col-span-4 order-2' : 'order-1'} space-y-6`}>

            {/* Order Summary (Resumo) */}
            <Card className={`shadow-2xl border overflow-hidden ${cardRadius} ${cardShadow}`} style={{ backgroundColor: checkout.card_color || '#ffffff', borderColor: borderColor }}>
              <div className="p-4 border-b flex items-center justify-between" style={{ backgroundColor: checkout.custom_settings?.summary_header_bg_color || checkout.card_color || '#ffffff' }}>
                <CardTitle className="text-sm font-black flex items-center gap-2" style={{ color: checkout.custom_settings?.summary_text_color || textColor }}>
                  <ShoppingCart className="w-4 h-4" style={{ color: primaryColor }} /> RESUMO
                </CardTitle>
                <Badge variant="outline" className="font-black text-[8px]" style={{ color: checkout.custom_settings?.summary_text_color || textColor, borderColor: `${checkout.custom_settings?.summary_text_color || textColor}40` }}>
                  TOTAL
                </Badge>
              </div>
              <CardContent className="space-y-4 p-4" style={{ backgroundColor: checkout.summary_bg_color || innerBgColor }}>
                <div className="flex gap-3 items-center">
                  {checkout.item_image_url && (
                    <img src={checkout.item_image_url} alt={checkout.item_name} className="w-12 h-12 rounded-lg object-cover flex-shrink-0 shadow-sm" />
                  )}
                  <div className="flex-1">
                    <h3 className="font-bold text-xs line-clamp-1" style={{ color: checkout.custom_settings?.summary_text_color || textColor }}>
                      {checkout.item_name || 'Nome do Produto'}
                    </h3>
                    <p className="text-base font-black" style={{ color: checkout.custom_settings?.summary_price_color || primaryColor }}>
                      R$ {Number(checkout.price || 0).toFixed(2)}
                    </p>
                  </div>
                </div>
                
                <div className="pt-4 mt-2 border-t border-black/5" style={{ borderColor: `${checkout.custom_settings?.summary_text_color || textColor}10` }}>
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: checkout.custom_settings?.summary_text_color || textColor }}>
                      Total a pagar
                    </span>
                    <span className="text-xl font-black" style={{ color: checkout.custom_settings?.summary_price_color || primaryColor }}>
                      R$ {Number(checkout.price || 0).toFixed(2)}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-[8px] font-black uppercase text-green-600 bg-green-50/50 p-2 rounded-lg border border-green-100" style={{ backgroundColor: `${checkout.custom_settings?.summary_text_color || textColor}05`, borderColor: `${checkout.custom_settings?.summary_text_color || textColor}10` }}>
                    <Shield className="w-3 h-3 flex-shrink-0" />
                    <span style={{ color: checkout.custom_settings?.summary_text_color || subtitleColor }}>
                      Compra 100% criptografada e segura.
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Product Section Card */}
            <Card className={`border shadow-sm overflow-hidden group relative ${cardRadius} ${cardShadow} ${activeTab === 'product' ? 'ring-2 ring-green-500' : ''}`} style={{ backgroundColor: checkout.custom_settings?.card_color || '#ffffff', borderColor: borderColor }}>
              <EditButton tab="product" />
              <CardContent className="p-4 flex gap-4">
                {checkout.item_image_url ? (
                  <img src={checkout.item_image_url} alt="Item" className="w-16 h-16 rounded-xl object-cover" />
                ) : (
                  <div className="w-16 h-16 rounded-xl flex items-center justify-center bg-slate-100">
                    <Package className="w-8 h-8 text-slate-300" />
                  </div>
                )}
                <div className="flex-1 flex flex-col justify-center">
                  <Badge variant="outline" className="w-fit mb-1 text-[8px] uppercase font-bold" style={{ borderColor: primaryColor, color: primaryColor }}>Oferta Ativa</Badge>
                  <h3 className="font-bold text-sm leading-tight" style={{ color: textColor }}>{checkout.item_name || 'Nome do Produto'}</h3>
                  <p className="text-[10px] line-clamp-1" style={{ color: subtitleColor }}>{checkout.item_description}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Form Column */}
          <div className={`${layoutStructure === 'split' ? 'lg:col-span-8' : ''} order-2 lg:order-1 space-y-6`}>
            {/* Checkout Form Simulation */}
            <Card className={`border shadow-sm p-6 space-y-4 group relative ${cardRadius} ${cardShadow} ${activeTab === 'form' || activeTab === 'payment' ? 'ring-2 ring-green-500 ring-offset-4 ring-offset-slate-900 animate-pulse' : ''}`} style={{ backgroundColor: checkout.custom_settings?.card_color || '#ffffff', borderColor: borderColor }}>
              <EditButton tab="form" />
              {activeTab !== 'payment' ? (
                <>
                  <h4 className="font-bold flex items-center gap-2" style={{ color: textColor }}>
                    <span className="w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center" style={{ backgroundColor: primaryColor }}>1</span>
                    Dados Pessoais
                  </h4>
                  <div className="space-y-3">
                    {checkout.show_field_name !== false && (
                      <div className="space-y-1">
                        <Label className="text-xs" style={{ color: subtitleColor }}>Nome Completo</Label>
                        <Input disabled placeholder="Ex: Maria Souza" className="h-10 border-slate-200" style={{ backgroundColor: checkout.custom_settings?.field_color || '#ffffff', color: checkout.custom_settings?.field_text_color || textColor }} />
                      </div>
                    )}
                    {checkout.show_field_email !== false && (
                      <div className="space-y-1">
                        <Label className="text-xs" style={{ color: subtitleColor }}>E-mail para entrega</Label>
                        <Input disabled placeholder="exemplo@email.com" className="h-10 border-slate-200" style={{ backgroundColor: checkout.custom_settings?.field_color || '#ffffff', color: checkout.custom_settings?.field_text_color || textColor }} />
                      </div>
                    )}
                    {checkout.show_field_whatsapp && (
                      <div className="space-y-1">
                        <Label className="text-xs" style={{ color: subtitleColor }}>WhatsApp</Label>
                        <Input disabled placeholder="(00) 00000-0000" className="h-10 border-slate-200" style={{ backgroundColor: checkout.custom_settings?.field_color || '#ffffff', color: checkout.custom_settings?.field_text_color || textColor }} />
                      </div>
                    )}
                    
                    {checkout.show_field_address && (
                      <div className="pt-4 border-t space-y-3 animate-in fade-in slide-in-from-top-2">
                        <h4 className="font-bold flex items-center gap-2" style={{ color: textColor }}>
                          <span className="w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center" style={{ backgroundColor: primaryColor }}>2</span>
                          Endereço de Entrega
                        </h4>
                        <div className="grid grid-cols-3 gap-2">
                          {checkout.show_field_zip !== false && (
                            <div className="col-span-1 space-y-1">
                              <Label className="text-[10px]" style={{ color: subtitleColor }}>CEP</Label>
                              <Input disabled placeholder="00000-000" className="h-9 border-slate-200 text-xs" style={{ backgroundColor: checkout.custom_settings?.field_color || '#ffffff', color: textColor }} />
                            </div>
                          )}
                          <div className="col-span-2 space-y-1">
                            <Label className="text-[10px]" style={{ color: subtitleColor }}>Rua</Label>
                            <Input disabled placeholder="Nome da rua..." className="h-9 border-slate-200 text-xs" style={{ backgroundColor: checkout.custom_settings?.field_color || '#ffffff', color: textColor }} />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <Button className={`w-full h-12 font-bold rounded-xl shadow-lg transition-transform active:scale-95 mt-4 ${activeTab === 'cta' ? 'ring-2 ring-green-500 ring-offset-4 ring-offset-slate-900 animate-pulse scale-105' : ''}`} style={{ backgroundColor: primaryColor, color: checkout.button_text_color || '#ffffff' }}>
                    {checkout.show_field_address ? 'Calcular Frete' : 'Próximo Passo'}
                  </Button>
                </>
              ) : (
                <div className="space-y-4">
                  <h4 className="font-bold flex items-center gap-2" style={{ color: textColor }}>
                    <span className="w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center" style={{ backgroundColor: primaryColor }}>2</span>
                    Pagamento
                  </h4>
                  <div className="space-y-2">
                    {checkout.enable_pix && (
                      <div className="p-3 border rounded-xl flex items-center gap-3 cursor-pointer hover:bg-slate-50 transition-colors">
                        <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center text-green-600">
                          <DollarSign className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-bold" style={{ color: textColor }}>PIX (Manual)</p>
                          <p className="text-[10px] text-muted-foreground">Aprovação manual via WhatsApp</p>
                        </div>
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                      </div>
                    )}
                    {checkout.enable_mp && (
                      <div className="p-3 border rounded-xl flex items-center gap-3 cursor-pointer hover:bg-slate-50 transition-colors">
                        <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                          <CreditCard className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-bold" style={{ color: textColor }}>Mercado Pago</p>
                          <p className="text-[10px] text-muted-foreground">Cartão, PIX Automático ou Boleto</p>
                        </div>
                      </div>
                    )}
                  </div>
                  <Button className="w-full h-12 font-bold rounded-xl shadow-lg" style={{ backgroundColor: primaryColor, color: checkout.button_text_color || '#ffffff' }}>
                    Finalizar Pagamento
                  </Button>
                </div>
              )}
              
              <p className="text-[10px] text-center text-muted-foreground flex items-center justify-center gap-1">
                <Shield className="w-3 h-3 text-green-500" /> Seus dados estão protegidos por criptografia de ponta a ponta.
              </p>
            </Card>

            {/* Benefits Section */}
            {(checkout.custom_settings?.benefits || []).length > 0 && (
              <div className={`grid grid-cols-1 md:grid-cols-2 gap-3 ${activeTab === 'benefits' ? 'ring-2 ring-green-500 ring-offset-4 ring-offset-slate-900 animate-pulse p-2 rounded-xl' : ''}`}>
                {checkout.custom_settings.benefits.map((b: any, i: number) => (
                  <div key={i} className={`flex gap-3 p-3 border border-muted bg-white/50 ${cardRadius}`}>
                    <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-xs font-bold" style={{ color: textColor }}>{b.title}</p>
                      <p className="text-[10px] text-muted-foreground leading-tight">{b.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Feedback Section */}
            {((checkout.custom_settings?.testimonials || []).length > 0 || checkout.show_fake_feedback) && (
              <div className="space-y-4 group relative">
                <EditButton tab="testimonials" />
                <div className="flex items-center justify-between px-1">
                  <h4 className="font-bold text-sm" style={{ color: textColor }}>O que nossos clientes dizem</h4>
                  <div className="flex text-yellow-500 gap-0.5">
                    <Star className="w-3 h-3 fill-current" />
                    <Star className="w-3 h-3 fill-current" />
                    <Star className="w-3 h-3 fill-current" />
                    <Star className="w-3 h-3 fill-current" />
                    <Star className="w-3 h-3 fill-current" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {([...(checkout.custom_settings?.testimonials || []), ...(checkout.show_fake_feedback ? feedbacks : [])]).map((f: any, i: number) => (
                    <Card key={i} className={`border shadow-sm p-4 ${cardRadius} ${activeTab === 'testimonials' ? 'ring-2 ring-green-500 ring-offset-2 animate-pulse' : ''}`} style={{ backgroundColor: checkout.card_color || '#ffffff', opacity: 0.9, borderColor: borderColor }}>
                      <div className="flex gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs" style={{ color: primaryColor }}>
                          {f.name?.[0] || 'U'}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <p className="text-xs font-bold" style={{ color: textColor }}>{f.name}</p>
                            <CheckCircle2 className="w-3 h-3 text-blue-500" />
                          </div>
                          <p className="text-[11px] leading-relaxed mt-1" style={{ color: subtitleColor }}>{f.text}</p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {checkout.custom_settings?.show_scarcity && (
              <div className="group relative">
                <EditButton tab="scarcity" />
                <CountdownTimer 
                  initialSeconds={checkout.custom_settings?.scarcity_timer || 600} 
                  activeTab={activeTab}
                />
              </div>
            )}

            {/* Guarantee Section */}
            <div className="p-6 rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50/50 text-center space-y-2 group relative">
              <EditButton tab="guarantee" />
              <Shield className="w-8 h-8 text-slate-300 mx-auto" />
              <div className="space-y-1">
                <h4 className="font-bold text-sm" style={{ color: textColor }}>{checkout.custom_settings?.guarantee_title || '7 Dias de Garantia'}</h4>
                <p className="text-[10px] opacity-70 max-w-xs mx-auto" style={{ color: subtitleColor }}>{checkout.custom_settings?.guarantee_description || 'Se você não gostar, devolvemos seu dinheiro.'}</p>
              </div>
            </div>

            {/* Footer Simulation */}
            <div className="py-6 border-t text-center space-y-4 group relative">
              <EditButton tab="footer" />
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-40" style={{ color: footerColor }}>
                {checkout.footer_text || 'Compra 100% Segura'}
              </p>
              <div className="flex justify-center gap-4 text-[10px] font-bold opacity-30 uppercase tracking-widest">
                <span>Privacidade</span>
                <span>Termos</span>
                <span>Contato</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-8 pb-4 text-center space-y-4">
          <div className="flex justify-center gap-6 opacity-30 grayscale contrast-125">
            <img src="https://logodownload.org/wp-content/uploads/2014/10/mercado-pago-logo-1.png" alt="MP" className="h-4 object-contain" />
            <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Logo_Pix.svg/1200px-Logo_Pix.svg.png" alt="PIX" className="h-4 object-contain" />
          </div>
          
          {checkout.custom_settings?.footer_contact_info && (
            <div className="flex justify-center">
              <Button 
                variant="outline" 
                size="sm" 
                className="rounded-full gap-2 font-bold px-6 h-10 transition-all hover:scale-105 active:scale-95"
                style={{ color: footerColor, borderColor: `${footerColor}40` }}
                onClick={() => window.open(`https://wa.me/${checkout.custom_settings.footer_contact_info.replace(/\D/g, '')}`, '_blank')}
              >
                <Smartphone className="w-4 h-4" /> Contato no WhatsApp
              </Button>
            </div>
          )}
          
          <p className="text-[10px] font-medium uppercase tracking-[0.2em]" style={{ color: footerColor }}>
            {checkout.footer_text || 'Compra 100% Segura'}
          </p>
          
          <div className="flex justify-center gap-2">
            <button className="text-[9px] hover:underline" style={{ color: footerColor, opacity: 0.7 }} onClick={() => checkout.custom_settings?.footer_privacy_url && window.open(checkout.custom_settings.footer_privacy_url, '_blank')}>Privacidade</button>
            <button className="text-[9px] hover:underline" style={{ color: footerColor, opacity: 0.7 }} onClick={() => checkout.custom_settings?.footer_terms_url && window.open(checkout.custom_settings.footer_terms_url, '_blank')}>Termos de Uso</button>
          </div>
        </div>
      </div>
    </div>
  );
};