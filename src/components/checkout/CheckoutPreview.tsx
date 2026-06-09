import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Package, Shield, ShoppingCart, CheckCircle2, Star, CreditCard, Lock, Smartphone, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const CheckoutPreview = ({ checkout }: { checkout: any }) => {
  const primaryColor = checkout.primary_color || '#8B5CF6';
  const bgColor = checkout.background_color || '#F8FAFC';
  const textColor = checkout.text_color || '#0f172a';
  const footerColor = checkout.footer_color || '#64748b';
  
  const feedbacks = checkout.fake_feedbacks || [
    { name: "Ana Silva", text: "Amei o curso! Muito prático.", rating: 5, avatar: "" },
    { name: "João Pereira", text: "Entrega super rápida do acesso.", rating: 5, avatar: "" }
  ];

  return (
    <div 
      className="w-full h-full min-h-[600px] border rounded-xl overflow-y-auto scrollbar-hide shadow-lg transition-all duration-300"
      style={{ backgroundColor: bgColor, color: textColor }}
    >
      {/* Mini Header / Logo */}
      <div className="w-full p-4 flex justify-center bg-white/80 backdrop-blur-sm border-b sticky top-0 z-10">
        {checkout.logo_url ? (
          <img src={checkout.logo_url} alt="Logo" className="h-8 object-contain" />
        ) : (
          <div className="font-bold text-xl flex items-center gap-2">
            <Package className="w-6 h-6" style={{ color: primaryColor }} />
            <span>{checkout.name || 'Minha Loja'}</span>
          </div>
        )}
      </div>

      <div className="p-4 md:p-6 space-y-6">
        {/* Banner */}
        {checkout.banner_url && (
          <div className="w-full h-32 md:h-48 overflow-hidden rounded-2xl shadow-sm">
            <img src={checkout.banner_url} alt="Banner" className="w-full h-full object-cover" />
          </div>
        )}

        <div className="grid grid-cols-1 gap-6">
          {/* Main Product Info */}
          <Card className="border-none shadow-sm overflow-hidden rounded-2xl bg-white">
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
                  <h3 className="font-bold text-lg md:text-xl leading-tight">{checkout.item_name || 'Nome do Produto'}</h3>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{checkout.item_description || 'Breve descrição do que você está comprando...'}</p>
                </div>
              </div>
              
              <div className="bg-muted/30 p-5 flex items-center justify-between border-t border-muted/50">
                <div className="flex flex-col">
                  <span className="text-[10px] text-muted-foreground uppercase font-semibold">Valor Total</span>
                  <p className="text-2xl font-black" style={{ color: primaryColor }}>R$ {Number(checkout.price || 0).toFixed(2)}</p>
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

          {/* Checkout Form Simulation */}
          <Card className="border-none shadow-sm rounded-2xl bg-white p-6 space-y-4">
            <h4 className="font-bold flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center" style={{ backgroundColor: primaryColor }}>1</span>
              Dados Pessoais
            </h4>
            <div className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs opacity-70">Nome Completo</Label>
                <Input disabled placeholder="Ex: Maria Souza" className="h-10 bg-muted/20" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs opacity-70">E-mail para entrega</Label>
                <Input disabled placeholder="exemplo@email.com" className="h-10 bg-muted/20" />
              </div>
              
              {checkout.product_type === 'physical_product' && (
                <div className="pt-4 border-t space-y-3 animate-in fade-in slide-in-from-top-2">
                  <h4 className="font-bold flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center" style={{ backgroundColor: primaryColor }}>2</span>
                    Endereço de Entrega
                  </h4>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-1 space-y-1">
                      <Label className="text-[10px] opacity-70">CEP</Label>
                      <Input disabled placeholder="00000-000" className="h-9 bg-muted/20 text-xs" />
                    </div>
                    <div className="col-span-2 space-y-1">
                      <Label className="text-[10px] opacity-70">Rua</Label>
                      <Input disabled placeholder="Nome da rua..." className="h-9 bg-muted/20 text-xs" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <Button className="w-full h-12 font-bold rounded-xl shadow-lg transition-transform active:scale-95 mt-4" style={{ backgroundColor: primaryColor }}>
              {checkout.product_type === 'physical_product' ? 'Calcular Frete' : 'Próximo Passo'}
            </Button>
            
            <p className="text-[10px] text-center text-muted-foreground flex items-center justify-center gap-1">
              <Shield className="w-3 h-3 text-green-500" /> Seus dados estão protegidos por criptografia de ponta a ponta.
            </p>
          </Card>

          {/* Feedback Section */}
          {checkout.show_fake_feedback && (
            <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <h4 className="font-bold text-sm">O que nossos clientes dizem</h4>
                <div className="flex text-yellow-500 gap-0.5">
                  <Star className="w-3 h-3 fill-current" />
                  <Star className="w-3 h-3 fill-current" />
                  <Star className="w-3 h-3 fill-current" />
                  <Star className="w-3 h-3 fill-current" />
                  <Star className="w-3 h-3 fill-current" />
                </div>
              </div>
              <div className="space-y-3">
                {feedbacks.map((f: any, i: number) => (
                  <Card key={i} className="border-none shadow-sm rounded-xl bg-white/50 backdrop-blur-sm p-4">
                    <div className="flex gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs" style={{ color: primaryColor }}>
                        {f.name?.[0] || 'U'}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <p className="text-xs font-bold">{f.name}</p>
                          <CheckCircle2 className="w-3 h-3 text-blue-500" />
                        </div>
                        <p className="text-[11px] leading-relaxed mt-1 opacity-80">{f.text}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-8 pb-4 text-center space-y-4">
          <div className="flex justify-center gap-6 opacity-30 grayscale contrast-125">
             <img src="https://logodownload.org/wp-content/uploads/2014/10/mercado-pago-logo-1.png" alt="MP" className="h-4 object-contain" />
             <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Logo_Pix.svg/1200px-Logo_Pix.svg.png" alt="PIX" className="h-4 object-contain" />
          </div>
          <p className="text-[10px] font-medium uppercase tracking-[0.2em]" style={{ color: footerColor }}>
            {checkout.footer_text || 'Compra 100% Segura'}
          </p>
          <div className="flex justify-center gap-2">
            <Badge variant="outline" className="text-[9px] rounded-full opacity-50 px-3">Privacidade</Badge>
            <Badge variant="outline" className="text-[9px] rounded-full opacity-50 px-3">Termos de Uso</Badge>
          </div>
        </div>
      </div>
    </div>
  );
};
