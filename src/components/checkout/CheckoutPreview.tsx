import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Package, Shield, ShoppingCart, CheckCircle2, Star, CreditCard, Lock, Smartphone, Heart, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const CheckoutPreview = ({ checkout, activeTab }: { checkout: any, activeTab?: string }) => {
  const primaryColor = checkout.primary_color || '#8B5CF6';
  const bgColor = checkout.background_color || checkout.card_color || '#F8FAFC';
  const textColor = checkout.title_color || '#0f172a';
  const subtitleColor = checkout.subtitle_color || '#666666';
  const footerColor = checkout.footer_text_color || '#64748b';
  
  const layoutModel = 'modern';
  const layoutStructure = 'split';
  const layoutWidth = 'full';
  
  const feedbacks = checkout.fake_feedbacks || [
    { name: "Ana Silva", text: "Amei o curso! Muito prático.", rating: 5, avatar: "" },
    { name: "João Pereira", text: "Entrega super rápida do acesso.", rating: 5, avatar: "" }
  ];

  return (
    <div 
      className={`w-full h-full min-h-[600px] border rounded-xl overflow-y-auto scrollbar-hide shadow-lg transition-all duration-300 relative ${
        layoutWidth === 'full' ? 'max-w-none' : 'max-w-4xl'
      }`}
      style={{ backgroundColor: bgColor }}
    >
      {/* Mini Header / Logo */}
      <div className={`w-full p-4 border-b sticky top-0 z-10 flex items-center gap-4 ${checkout.logo_alignment === 'left' ? 'justify-start' : checkout.logo_alignment === 'right' ? 'justify-end flex-row-reverse' : 'justify-center'}`} style={{ backgroundColor: checkout.card_color || '#ffffff' }}>
        <div className="flex items-center gap-2">
          {checkout.item_image_url ? (
            <img src={checkout.item_image_url} alt="Logo" className={`${checkout.logo_size || 'h-8'} object-contain`} />
          ) : (
            <div className="font-bold text-xl flex items-center gap-2" style={{ color: textColor }}>
              <Package className="w-6 h-6" style={{ color: primaryColor }} />
              <span>{checkout.name || 'Minha Loja'}</span>
            </div>
          )}
        </div>
        {checkout.header_title && (
          <h1 
            className={`${checkout.header_title_font_size || 'text-xl'} ${checkout.header_title_bold ? 'font-bold' : ''}`}
            style={{ color: checkout.header_title_color || textColor }}
          >
            {checkout.header_title}
          </h1>
        )}
      </div>

      <div className={`p-4 md:p-6 space-y-6 ${layoutWidth === 'full' ? 'max-w-6xl mx-auto' : ''}`}>
        {/* Banner */}
        {checkout.banner_url && (
          <div className={`w-full overflow-hidden rounded-2xl shadow-sm h-32 md:h-48`}>
            <img src={checkout.banner_url} alt="Banner" className="w-full h-full object-cover" />
          </div>
        )}

        <div className={`grid grid-cols-1 gap-6 ${layoutStructure === 'split' ? 'lg:grid-cols-12' : ''}`}>
          <div className={`${layoutStructure === 'split' ? 'lg:col-span-7 space-y-6' : 'space-y-6'}`}>
            {/* Main Product Info */}
            <Card className={`border-none shadow-sm overflow-hidden rounded-3xl ${activeTab === 'product' || activeTab === 'summary' ? 'ring-2 ring-indigo-500 ring-offset-4 ring-offset-slate-900 animate-pulse' : ''}`} style={{ backgroundColor: checkout.card_color || '#ffffff' }}>
              <CardContent className="p-0">
                <div className="p-5 flex gap-4">
                  {checkout.item_image_url ? (
                    <img src={checkout.item_image_url} alt="Item" className="w-20 h-20 md:w-24 md:h-24 rounded-xl object-cover shadow-sm" />
                  ) : (
                    <div className="w-20 h-20 md:w-24 md:h-24 rounded-xl bg-muted flex items-center justify-center">
                      <Package className="w-10 h-10 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 flex flex-col justify-center">
                    <Badge variant="outline" className="w-fit mb-1 text-[10px] uppercase tracking-wider font-bold" style={{ borderColor: primaryColor, color: primaryColor }}>Oferta Especial</Badge>
                    <h3 className="font-bold text-lg md:text-xl leading-tight" style={{ color: textColor }}>{checkout.item_name || 'Nome do Produto'}</h3>
                    <p className="text-xs mt-1 line-clamp-1" style={{ color: subtitleColor }}>{checkout.item_description || 'Breve descrição do que você está comprando...'}</p>
                  </div>
                </div>
                
                <div className="p-5 flex items-center justify-between border-t border-muted/50" style={{ backgroundColor: checkout.summary_bg_color || 'rgba(0,0,0,0.03)' }}>
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-semibold" style={{ color: subtitleColor }}>Valor Total</span>
                    <p className="text-2xl font-black" style={{ color: checkout.summary_price_color || primaryColor }}>R$ {Number(checkout.price || 0).toFixed(2)}</p>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] text-green-600 font-bold flex items-center gap-1">
                      <Lock className="w-3 h-3" /> PAGAMENTO SEGURO
                    </span>
                    <div className="flex gap-1 mt-1 opacity-60">
                      <CreditCard className="w-4 h-4" />
                      <Smartphone className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className={`${layoutStructure === 'split' ? 'lg:col-span-5 space-y-6' : 'space-y-6'}`}>
            {/* Checkout Form Simulation */}
            <Card className={`border-none shadow-sm p-6 space-y-4 rounded-3xl ${activeTab === 'form' || activeTab === 'payment' ? 'ring-2 ring-indigo-500 ring-offset-4 ring-offset-slate-900 animate-pulse' : ''}`} style={{ backgroundColor: checkout.card_color || '#ffffff' }}>
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
                        <Input disabled placeholder="Ex: Maria Souza" className="h-10 border-slate-200" style={{ backgroundColor: checkout.field_color || '#ffffff', color: textColor }} />
                      </div>
                    )}
                    {checkout.show_field_email !== false && (
                      <div className="space-y-1">
                        <Label className="text-xs" style={{ color: subtitleColor }}>E-mail para entrega</Label>
                        <Input disabled placeholder="exemplo@email.com" className="h-10 border-slate-200" style={{ backgroundColor: checkout.field_color || '#ffffff', color: textColor }} />
                      </div>
                    )}
                    {checkout.show_field_whatsapp && (
                      <div className="space-y-1">
                        <Label className="text-xs" style={{ color: subtitleColor }}>WhatsApp</Label>
                        <Input disabled placeholder="(00) 00000-0000" className="h-10 border-slate-200" style={{ backgroundColor: checkout.field_color || '#ffffff', color: textColor }} />
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
                              <Input disabled placeholder="00000-000" className="h-9 border-slate-200 text-xs" style={{ backgroundColor: checkout.field_color || '#ffffff', color: textColor }} />
                            </div>
                          )}
                          <div className="col-span-2 space-y-1">
                            <Label className="text-[10px]" style={{ color: subtitleColor }}>Rua</Label>
                            <Input disabled placeholder="Nome da rua..." className="h-9 border-slate-200 text-xs" style={{ backgroundColor: checkout.field_color || '#ffffff', color: textColor }} />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <Button className={`w-full h-12 font-bold rounded-xl shadow-lg transition-transform active:scale-95 mt-4 ${activeTab === 'cta' ? 'ring-2 ring-indigo-500 ring-offset-4 ring-offset-slate-900 animate-pulse scale-105' : ''}`} style={{ backgroundColor: primaryColor, color: checkout.button_text_color || '#ffffff' }}>
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
                        <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                          <DollarSign className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-bold" style={{ color: textColor }}>PIX (Manual)</p>
                          <p className="text-[10px] text-muted-foreground">Aprovação manual via WhatsApp</p>
                        </div>
                        <CheckCircle2 className="w-4 h-4 text-indigo-600" />
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
              <div className={`grid grid-cols-1 md:grid-cols-2 gap-3 ${activeTab === 'benefits' ? 'ring-2 ring-indigo-500 ring-offset-4 ring-offset-slate-900 animate-pulse p-2 rounded-xl' : ''}`}>
                {checkout.custom_settings.benefits.map((b: any, i: number) => (
                  <div key={i} className="flex gap-3 p-3 rounded-xl border border-muted bg-white/50">
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
              <div className="space-y-4">
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
                <div className="space-y-3">
                  {([...(checkout.custom_settings?.testimonials || []), ...(checkout.show_fake_feedback ? feedbacks : [])]).map((f: any, i: number) => (
                    <Card key={i} className={`border-none shadow-sm rounded-xl p-4 ${activeTab === 'testimonials' ? 'ring-2 ring-indigo-500 ring-offset-2 animate-pulse' : ''}`} style={{ backgroundColor: checkout.card_color || '#ffffff', opacity: 0.9 }}>
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
              <div className={`p-4 rounded-2xl bg-indigo-600 text-white shadow-lg flex items-center justify-between gap-4 ${activeTab === 'scarcity' ? 'ring-2 ring-indigo-500 ring-offset-4 ring-offset-slate-900 animate-pulse' : ''}`}>
                <div className="flex items-center gap-2">
                  <Clock className="w-6 h-6 animate-pulse" />
                  <p className="text-[10px] font-bold leading-tight">OFERTA POR TEMPO LIMITADO!</p>
                </div>
                <div className="text-xl font-black font-mono bg-white/10 px-3 py-1 rounded-lg">
                   {Math.floor((checkout.custom_settings?.scarcity_timer || 600) / 60)}:{String((checkout.custom_settings?.scarcity_timer || 600) % 60).padStart(2, '0')}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-8 pb-4 text-center space-y-4">
          <div className="flex justify-center gap-6 opacity-30 grayscale contrast-125">
            <img src="https://logodownload.org/wp-content/uploads/2014/10/mercado-pago-logo-1.png" alt="MP" className="h-4 object-contain" />
            <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Logo_Pix.svg/1200px-Logo_Pix.svg.png" alt="PIX" className="h-4 object-contain" />
          </div>
          <p className="text-[10px] font-medium uppercase tracking-[0.2em]" style={{ color: footerColor }}>
            {checkout.custom_settings?.footer_contact_info || checkout.footer_text || 'Compra 100% Segura'}
          </p>
          <div className="flex justify-center gap-2">
            <Badge variant="outline" className="text-[9px] rounded-full px-3" style={{ color: footerColor, borderColor: footerColor, opacity: 0.5 }}>Privacidade</Badge>
            <Badge variant="outline" className="text-[9px] rounded-full px-3" style={{ color: footerColor, borderColor: footerColor, opacity: 0.5 }}>Termos de Uso</Badge>
          </div>
        </div>
      </div>
    </div>
  );
};