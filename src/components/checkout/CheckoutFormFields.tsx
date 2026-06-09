
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { CheckoutImageUpload } from "@/components/checkout/CheckoutImageUpload";
import { ChevronRight, ChevronLeft, Code, Palette, Gift, TrendingUp, Link2, Settings2, BarChart3, CheckCircle2 } from "lucide-react";

export const CheckoutFormFields = ({ formData, setFormData, formTab, setFormTab, membersAreas, catalogs }: any) => {
  const tabs = [
    { id: 'basic', label: 'Básico', icon: Settings2, color: 'blue' },
    { id: 'integration', label: 'Integração', icon: Link2, color: 'purple' },
    { id: 'design', label: 'Design', icon: Palette, color: 'pink' },
    { id: 'thankyou', label: 'Obrigado', icon: Gift, color: 'green' },
    { id: 'upsell', label: 'Upsell', icon: TrendingUp, color: 'orange' },
    { id: 'tracking', label: 'Tracking', icon: Code, color: 'slate' },
  ];

  const handleNext = () => {
    const currentIndex = tabs.findIndex(t => t.id === formTab);
    if (currentIndex < tabs.length - 1) setFormTab(tabs[currentIndex + 1].id);
  };

  const handlePrev = () => {
    const currentIndex = tabs.findIndex(t => t.id === formTab);
    if (currentIndex > 0) setFormTab(tabs[currentIndex - 1].id);
  };

  const renderContent = () => {
    switch (formTab) {
      case 'basic':
        return (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-2 duration-300">
            <h4 className="font-bold text-xl flex items-center gap-2">
               <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                 <Settings2 className="w-5 h-5" />
               </div>
               Informações Principais
            </h4>
            
            <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 mb-4">
              <Label className="text-blue-900 font-bold mb-2 block">Tipo de Venda / Produto</Label>
              <Select 
                value={formData.product_type} 
                onValueChange={(v) => setFormData({ ...formData, product_type: v })}
              >
                <SelectTrigger className="bg-white border-blue-200">
                  <SelectValue placeholder="Selecione o tipo de produto..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="service">🛠️ Serviço</SelectItem>
                  <SelectItem value="online_course">🎓 Curso Online</SelectItem>
                  <SelectItem value="mentorship">🤝 Mentoria</SelectItem>
                  <SelectItem value="digital_product">📂 Produto Digital</SelectItem>
                  <SelectItem value="physical_product">📦 Produto Físico</SelectItem>
                  <SelectItem value="subscription">💳 Assinatura</SelectItem>
                  <SelectItem value="members_area">👥 Área de Membros</SelectItem>
                  <SelectItem value="other">✨ Outros</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-[10px] text-blue-700 mt-2">
                * O checkout se adaptará automaticamente com campos e fluxos específicos para este tipo.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div><Label>Nome do Checkout *</Label><Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Ex: Curso Alpha" /></div>
              <div><Label>Slug da URL</Label><Input value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: e.target.value })} placeholder="curso-alpha" /></div>
            </div>
            <div><Label>Descrição (Interna)</Label><Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Apenas para seu controle..." /></div>
            
            <div className="pt-4 border-t">
               <h5 className="font-bold mb-3">📦 Oferta do Produto</h5>
               <div className="space-y-3">
                 <div><Label>Nome exibido no Checkout *</Label><Input value={formData.item_name} onChange={(e) => setFormData({ ...formData, item_name: e.target.value })} /></div>
                 <div><Label>Preço da Oferta (R$) *</Label><Input type="number" step="0.01" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} /></div>
                 <CheckoutImageUpload label="Imagem do Produto" value={formData.item_image_url} onChange={(url) => setFormData({ ...formData, item_image_url: url })} />
               </div>
            </div>

            {formData.product_type === 'physical_product' && (
              <div className="pt-4 border-t animate-in fade-in slide-in-from-top-2">
                <h5 className="font-bold mb-3 flex items-center gap-2">🚚 Configurações de Frete</h5>
                <div className="bg-muted/30 p-4 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Habilitar Cálculo de Frete</Label>
                    <Switch checked={true} disabled />
                  </div>
                  <p className="text-[10px] text-muted-foreground italic">O formulário de endereço será solicitado obrigatoriamente para produtos físicos.</p>
                </div>
              </div>
            )}
          </div>
        );
      case 'integration':
        return (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-2 duration-300">
            <h4 className="font-bold text-xl flex items-center gap-2">
               <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center">
                 <Link2 className="w-5 h-5" />
               </div>
               Integração & Pagamento
            </h4>
            
            <div className="bg-muted/30 p-4 rounded-xl space-y-4">
              <h5 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">💳 Mercado Pago</h5>
              <div className="grid grid-cols-1 gap-3">
                <div><Label>Access Token (Opcional)</Label><Input type="password" value={formData.mp_access_token} onChange={(e) => setFormData({ ...formData, mp_access_token: e.target.value })} placeholder="APP_USR-..." /></div>
                <div><Label>Public Key (Opcional)</Label><Input value={formData.mp_public_key} onChange={(e) => setFormData({ ...formData, mp_public_key: e.target.value })} placeholder="APP_USR-..." /></div>
              </div>
            </div>

            <div className="space-y-4 pt-2">
              <div>
                <Label>Método de Pagamento</Label>
                <Select value={formData.integration_type === 'pix' ? 'pix' : 'mp'} onValueChange={(v) => setFormData({ ...formData, integration_type: v })}>
                  <SelectTrigger className="h-12"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mp">Mercado Pago (Cartão + Pix)</SelectItem>
                    <SelectItem value="pix">Somente Pix (Conversão Alta)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="pt-2 border-t">
                <Label className="flex items-center gap-2 mb-2">
                  Liberação de Acesso Automática
                  {formData.product_type === 'members_area' && <Badge variant="secondary" className="bg-purple-100 text-purple-700 text-[9px]">Recomendado</Badge>}
                </Label>
                <p className="text-[11px] text-muted-foreground mb-3">
                  Escolha o conteúdo que o cliente receberá automaticamente por e-mail e em sua conta assim que o pagamento for aprovado.
                </p>
                <Select value={formData.integration_id || 'none'} onValueChange={(v) => setFormData({ ...formData, integration_id: v === 'none' ? '' : v })}>
                  <SelectTrigger className={formData.product_type === 'members_area' && !formData.integration_id ? "border-purple-400 ring-1 ring-purple-100" : ""}><SelectValue placeholder="Nenhuma entrega selecionada" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhuma</SelectItem>
                    <optgroup label="🎓 Áreas de Membros Out App">
                      {membersAreas?.map((a: any) => <SelectItem key={a.id} value={a.id}>🎓 {a.name}</SelectItem>)}
                    </optgroup>
                    <optgroup label="📦 Catálogos / Outros">
                      {catalogs?.map((c: any) => <SelectItem key={c.id} value={c.id}>📦 {c.name}</SelectItem>)}
                    </optgroup>
                  </SelectContent>
                </Select>
                {formData.product_type === 'members_area' && (
                  <p className="text-[10px] text-purple-600 mt-2 font-medium">
                    ✨ Ao vincular a uma Área de Membros, o acesso será liberado automaticamente após o pagamento.
                  </p>
                )}
                {formData.product_type === 'digital_product' && (
                  <p className="text-[10px] text-muted-foreground mt-2 italic">
                    💡 Para produtos digitais, você também pode configurar um link de download na aba "Obrigado".
                  </p>
                )}
              </div>
            </div>
          </div>
        );
      case 'design':
        return (
          <div className="space-y-5 animate-in fade-in slide-in-from-right-2 duration-300">
            <h4 className="font-bold text-xl flex items-center gap-2">
               <div className="w-8 h-8 rounded-lg bg-pink-100 text-pink-600 flex items-center justify-center">
                 <Palette className="w-5 h-5" />
               </div>
               Personalização Visual
            </h4>
            
            <div className="grid grid-cols-2 gap-4">
              <CheckoutImageUpload label="Logo do Checkout" value={formData.logo_url} onChange={(url) => setFormData({ ...formData, logo_url: url })} />
              <CheckoutImageUpload label="Banner Superior" value={formData.banner_url} onChange={(url) => setFormData({ ...formData, banner_url: url })} aspectHint="1200x400" />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase font-bold text-muted-foreground">Cor Botão</Label>
                <div className="flex gap-2">
                  <Input type="color" value={formData.primary_color} onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })} className="w-full h-10 p-1 cursor-pointer" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase font-bold text-muted-foreground">Cor Fundo</Label>
                <Input type="color" value={formData.background_color} onChange={(e) => setFormData({ ...formData, background_color: e.target.value })} className="w-full h-10 p-1 cursor-pointer" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase font-bold text-muted-foreground">Cor Texto</Label>
                <Input type="color" value={formData.text_color} onChange={(e) => setFormData({ ...formData, text_color: e.target.value })} className="w-full h-10 p-1 cursor-pointer" />
              </div>
            </div>

            <div className="bg-muted/20 p-4 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="font-bold">Prova Social</Label>
                  <p className="text-[10px] text-muted-foreground">Exibir depoimentos de clientes</p>
                </div>
                <Switch checked={formData.show_fake_feedback} onCheckedChange={(v) => setFormData({ ...formData, show_fake_feedback: v })} />
              </div>
            </div>

            <div className="space-y-3 pt-2">
               <Label>Texto do Rodapé</Label>
               <Input value={formData.footer_text} onChange={(e) => setFormData({ ...formData, footer_text: e.target.value })} />
            </div>
          </div>
        );
      case 'thankyou':
        return (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-2 duration-300">
            <h4 className="font-bold text-xl flex items-center gap-2">
               <div className="w-8 h-8 rounded-lg bg-green-100 text-green-600 flex items-center justify-center">
                 <CheckCircle2 className="w-5 h-5" />
               </div>
               Página de Obrigado
            </h4>
            <div className="space-y-3">
              <div><Label>Título de Sucesso</Label><Input value={formData.thank_you_title} onChange={(e) => setFormData({ ...formData, thank_you_title: e.target.value })} /></div>
              <div><Label>Mensagem de Boas-vindas</Label><Textarea value={formData.thank_you_message} onChange={(e) => setFormData({ ...formData, thank_you_message: e.target.value })} /></div>
              
              {(formData.product_type === 'digital_product' || formData.product_type === 'other') && (
                <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl">
                  <Label className="text-blue-900">Link para Download do Produto</Label>
                  <Input 
                    value={formData.thank_you_download_url || ''} 
                    onChange={(e) => setFormData({ ...formData, thank_you_download_url: e.target.value })}
                    placeholder="https://sua-nuvem.com/arquivo.zip"
                    className="bg-white"
                  />
                  <p className="text-[9px] text-blue-600 mt-1">Este link será exibido na página de obrigado para o cliente baixar o produto.</p>
                </div>
              )}

              <CheckoutImageUpload label="Imagem de Destaque" value={formData.thank_you_image_url} onChange={(url) => setFormData({ ...formData, thank_you_image_url: url })} />
              
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div><Label>Texto do Botão (CTA)</Label><Input value={formData.thank_you_button_text} onChange={(e) => setFormData({ ...formData, thank_you_button_text: e.target.value })} /></div>
                <div><Label>Link do Botão</Label><Input value={formData.thank_you_button_url} onChange={(e) => setFormData({ ...formData, thank_you_button_url: e.target.value })} placeholder="https://..." /></div>
              </div>
            </div>
          </div>
        );
      case 'upsell':
        return (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-2 duration-300">
            <h4 className="font-bold text-xl flex items-center gap-2">
               <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center">
                 <TrendingUp className="w-5 h-5" />
               </div>
               Upsell (Aumente o Ticket)
            </h4>
            <div className="p-4 border-2 border-dashed rounded-2xl border-orange-200 bg-orange-50/30">
               <p className="text-sm text-orange-800 font-medium mb-3">Oferta pós-compra exibida imediatamente após o pagamento.</p>
               <div className="space-y-3">
                 <div><Label>Título da Oferta</Label><Input value={formData.upsell_title} onChange={(e) => setFormData({ ...formData, upsell_title: e.target.value })} placeholder="Espere! Temos algo mais..." /></div>
                 <div><Label>Preço do Upsell (R$)</Label><Input type="number" step="0.01" value={formData.upsell_price} onChange={(e) => setFormData({ ...formData, upsell_price: e.target.value })} /></div>
                 <CheckoutImageUpload label="Imagem do Upsell" value={formData.upsell_image_url} onChange={(url) => setFormData({ ...formData, upsell_image_url: url })} />
               </div>
            </div>
          </div>
        );
      case 'tracking':
        return (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-2 duration-300">
            <h4 className="font-bold text-xl flex items-center gap-2">
               <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
                 <Code className="w-5 h-5" />
               </div>
               Scripts & Tracking
            </h4>
            <div className="space-y-4">
              <div>
                <Label className="flex items-center gap-2">Código Header <span className="text-[10px] bg-slate-200 px-1 rounded">HEAD</span></Label>
                <Textarea className="font-mono text-[10px] min-h-[120px]" value={formData.head_code} onChange={(e) => setFormData({ ...formData, head_code: e.target.value })} placeholder="<!-- Google Tag Manager -->" />
              </div>
              <div>
                <Label className="flex items-center gap-2">Código Footer <span className="text-[10px] bg-slate-200 px-1 rounded">BODY</span></Label>
                <Textarea className="font-mono text-[10px] min-h-[120px]" value={formData.footer_code} onChange={(e) => setFormData({ ...formData, footer_code: e.target.value })} placeholder="<!-- Facebook Pixel -->" />
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Etapas do Checkout */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-50/80 backdrop-blur-sm border border-slate-100 rounded-2xl overflow-x-auto scrollbar-hide mb-6 shrink-0 shadow-sm">
        {tabs.map((t, index) => {
          const Icon = t.icon;
          const isActive = formTab === t.id;
          const currentIndex = tabs.findIndex(tab => tab.id === formTab);
          const isCompleted = index < currentIndex;
          
          return (
            <div key={t.id} className="flex items-center shrink-0">
              <button 
                onClick={() => setFormTab(t.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all duration-300 ${
                  isActive 
                    ? 'bg-white shadow-sm border border-slate-200 text-slate-900 scale-105' 
                    : isCompleted
                      ? 'text-primary'
                      : 'text-muted-foreground hover:bg-white/50'
                }`}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                  isActive 
                    ? 'bg-primary text-white shadow-sm' 
                    : isCompleted 
                      ? 'bg-primary/10 text-primary' 
                      : 'bg-slate-200 text-slate-500'
                }`}>
                  {isCompleted ? <CheckCircle2 className="w-3.5 h-3.5" /> : <span className="text-[10px]">{index + 1}</span>}
                </div>
                <span className="hidden sm:inline">{t.label}</span>
              </button>
              {index < tabs.length - 1 && (
                <div className="mx-1 text-slate-300">
                  <ChevronRight className="w-3 h-3" />
                </div>
              )}
            </div>
          );
        })}
      </div>
              <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${isActive ? `bg-${t.color}-100 text-${t.color}-600` : 'bg-muted text-muted-foreground'}`}>
                <Icon className="w-3.5 h-3.5" />
              </div>
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto pr-1">
        {renderContent()}
      </div>

      {/* Navigation Footer */}
      <div className="pt-6 border-t mt-auto flex items-center justify-between gap-4">
        <Button 
          variant="outline" 
          onClick={handlePrev}
          disabled={formTab === 'basic'}
          className="rounded-xl border-2 font-bold px-6"
        >
          <ChevronLeft className="w-4 h-4 mr-2" /> Anterior
        </Button>
        <Button 
          onClick={handleNext}
          disabled={formTab === 'tracking'}
          className="rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold px-8 shadow-lg shadow-slate-200 transition-all active:scale-95"
        >
          Próximo <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
};
