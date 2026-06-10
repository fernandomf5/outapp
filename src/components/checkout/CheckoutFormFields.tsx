import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { CheckoutImageUpload } from "@/components/checkout/CheckoutImageUpload";
import { 
  Settings2, 
  Layout, 
  Palette, 
  Type, 
  Package, 
  ShoppingCart, 
  CreditCard, 
  Gift, 
  Users, 
  ShieldCheck, 
  Clock, 
  MousePointer2, 
  ListTodo, 
  Smartphone, 
  Code, 
  Eye,
  Heading,
  Plus
} from "lucide-react";

export const CheckoutFormFields = ({ formData, setFormData, formTab, setFormTab }: any) => {
  const tabs = [
    { id: 'general', label: '1. Geral', icon: Settings2 },
    { id: 'header', label: '2. Cabeçalho', icon: Heading },
    { id: 'layout', label: '3. Layout', icon: Layout },
    { id: 'colors', label: '4. Cores', icon: Palette },
    { id: 'typography', label: '5. Tipografia', icon: Type },
    { id: 'product', label: '6. Produto', icon: Package },
    { id: 'summary', label: '7. Resumo', icon: ShoppingCart },
    { id: 'form', label: '8. Formulário', icon: ListTodo },
    { id: 'payment', label: '9. Pagamento', icon: CreditCard },
    { id: 'benefits', label: '10. Benefícios', icon: Gift },
    { id: 'testimonials', label: '11. Depoimentos', icon: Users },
    { id: 'guarantee', label: '12. Garantia', icon: ShieldCheck },
    { id: 'scarcity', label: '13. Contador', icon: Clock },
    { id: 'cta', label: '14. Botão', icon: MousePointer2 },
    { id: 'footer', label: '15. Rodapé', icon: ListTodo },
    { id: 'mobile', label: '16. Mobile', icon: Smartphone },
    { id: 'tracking', label: '17. SEO & Tracking', icon: Code },
    { id: 'preview_tab', label: '18. Visualizar', icon: Eye },
  ];

  const tabsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const activeElement = tabsRef.current?.querySelector(`[data-active="true"]`);
    if (activeElement) {
      activeElement.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [formTab]);

  const updateSetting = (key: string, value: any) => {
    setFormData({
      ...formData,
      custom_settings: {
        ...formData.custom_settings,
        [key]: value
      }
    });
  };

  const renderContent = () => {
    switch (formTab) {
      case 'general':
        return (
          <div className="space-y-4 p-6">
            <h3 className="font-bold text-lg text-slate-900">Informações Básicas</h3>
            <div className="space-y-3">
              <div>
                <Label className="text-slate-700 font-semibold mb-1.5 block">Nome do Checkout</Label>
                <Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="bg-white border-slate-200 focus:border-indigo-500 focus:ring-indigo-500 text-slate-900" />
              </div>
              <div>
                <Label className="text-slate-700 font-semibold mb-1.5 block">URL Personalizada</Label>
                <Input value={formData.slug} onChange={(e) => setFormData({...formData, slug: e.target.value})} className="bg-white border-slate-200 focus:border-indigo-500 focus:ring-indigo-500 text-slate-900" />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-slate-700 font-semibold">Status Ativo</Label>
                <Switch checked={formData.is_active} onCheckedChange={(v) => setFormData({...formData, is_active: v})} />
              </div>
              <div>
                <Label className="text-slate-700 font-semibold mb-1.5 block">Tipo de Produto</Label>
                <Select value={formData.product_type} onValueChange={(v) => setFormData({...formData, product_type: v})}>
                  <SelectTrigger className="bg-white text-slate-900 border-slate-200"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="service">Serviço</SelectItem>
                    <SelectItem value="online_course">Curso Online</SelectItem>
                    <SelectItem value="mentorship">Mentoria</SelectItem>
                    <SelectItem value="digital_product">Produto Digital</SelectItem>
                    <SelectItem value="physical_product">Produto Físico</SelectItem>
                    <SelectItem value="subscription">Assinatura</SelectItem>
                    <SelectItem value="members_area">Área de Membros</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );
      case 'header':
        return (
          <div className="space-y-4 p-6">
             <h3 className="font-bold text-lg text-slate-900">Cabeçalho</h3>
             <CheckoutImageUpload label="Upload da Logo" value={formData.item_image_url} onChange={(url) => setFormData({...formData, item_image_url: url})} />
             <div className="grid grid-cols-2 gap-2">
                <div>
                   <Label className="text-slate-700 font-semibold mb-1.5 block">Tamanho da Logo</Label>
                   <Select value={formData.custom_settings.logo_size} onValueChange={(v) => updateSetting('logo_size', v)}>
                      <SelectTrigger className="bg-white text-slate-900 border-slate-200"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="h-8">Pequeno (h-8)</SelectItem>
                        <SelectItem value="h-16">Médio (h-16)</SelectItem>
                        <SelectItem value="h-24">Grande (h-24)</SelectItem>
                      </SelectContent>
                   </Select>
                </div>
                <div>
                   <Label className="text-slate-700 font-semibold mb-1.5 block">Alinhamento</Label>
                   <Select value={formData.custom_settings.logo_alignment} onValueChange={(v) => updateSetting('logo_alignment', v)}>
                      <SelectTrigger className="bg-white text-slate-900 border-slate-200"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="left">Esquerda</SelectItem>
                        <SelectItem value="center">Centro</SelectItem>
                        <SelectItem value="right">Direita</SelectItem>
                      </SelectContent>
                   </Select>
                </div>
             </div>
             <div className="pt-4 border-t border-slate-100 space-y-3">
                <Label className="text-slate-700 font-semibold mb-1.5 block">Título Principal</Label>
                <Input value={formData.custom_settings.header_title} onChange={(e) => updateSetting('header_title', e.target.value)} className="bg-white border-slate-200 text-slate-900" />
                <div className="flex items-center gap-2">
                   <Input type="color" value={formData.custom_settings.header_title_color} onChange={(e) => updateSetting('header_title_color', e.target.value)} className="w-10 p-1 bg-white border-slate-200 h-10" />
                   <Label className="text-slate-700 font-semibold">Cor do Título</Label>
                </div>
             </div>
          </div>
        );
      case 'layout':
        return (
          <div className="space-y-4 p-6">
            <h3 className="font-bold text-lg text-slate-900">Configurações de Layout</h3>
            <div className="space-y-3">
              <div>
                <Label className="text-slate-700 font-semibold mb-1.5 block">Modelo de Layout</Label>
                <Select value={formData.custom_settings.layout_model} onValueChange={(v) => updateSetting('layout_model', v)}>
                  <SelectTrigger className="bg-white text-slate-900 border-slate-200"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="modern">Moderno</SelectItem>
                    <SelectItem value="classic">Clássico</SelectItem>
                    <SelectItem value="minimal">Minimalista</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-slate-700 font-semibold mb-1.5 block">Estrutura</Label>
                <Select value={formData.custom_settings.layout_structure} onValueChange={(v) => updateSetting('layout_structure', v)}>
                  <SelectTrigger className="bg-white text-slate-900 border-slate-200"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="split">Lado a Lado (Split)</SelectItem>
                    <SelectItem value="single">Coluna Única</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-slate-700 font-semibold mb-1.5 block">Largura do Checkout</Label>
                <Select value={formData.custom_settings.layout_width} onValueChange={(v) => updateSetting('layout_width', v)}>
                  <SelectTrigger className="bg-white text-slate-900 border-slate-200"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="boxed">Boxed (Centralizado)</SelectItem>
                    <SelectItem value="full">Largura Total</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );
      case 'colors':
        return (
          <div className="space-y-4 p-6">
            <h3 className="font-bold text-lg text-slate-900">Paleta de Cores</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                <Label className="text-slate-700 font-semibold">Cor Principal</Label>
                <Input type="color" value={formData.primary_color} onChange={(e) => setFormData({...formData, primary_color: e.target.value})} className="w-12 h-10 p-1 bg-white border-slate-200" />
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                <Label className="text-slate-700 font-semibold">Cor do Cartão/Fundo</Label>
                <Input type="color" value={formData.custom_settings.card_color} onChange={(e) => updateSetting('card_color', e.target.value)} className="w-12 h-10 p-1 bg-white border-slate-200" />
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                <Label className="text-slate-700 font-semibold">Cor dos Títulos</Label>
                <Input type="color" value={formData.custom_settings.title_color} onChange={(e) => updateSetting('title_color', e.target.value)} className="w-12 h-10 p-1 bg-white border-slate-200" />
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                <Label className="text-slate-700 font-semibold">Cor dos Subtítulos</Label>
                <Input type="color" value={formData.custom_settings.subtitle_color} onChange={(e) => updateSetting('subtitle_color', e.target.value)} className="w-12 h-10 p-1 bg-white border-slate-200" />
              </div>
            </div>
          </div>
        );
      case 'typography':
        return (
          <div className="space-y-4 p-6">
            <h3 className="font-bold text-lg text-slate-900">Tipografia</h3>
            <div className="space-y-3">
              <div>
                <Label className="text-slate-700 font-semibold mb-1.5 block">Fonte dos Títulos</Label>
                <Select value={formData.custom_settings.font_title} onValueChange={(v) => updateSetting('font_title', v)}>
                  <SelectTrigger className="bg-white text-slate-900 border-slate-200"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sans">Sans Serif (Inter/Roboto)</SelectItem>
                    <SelectItem value="serif">Serif (Playfair Display)</SelectItem>
                    <SelectItem value="mono">Monospace</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-slate-700 font-semibold mb-1.5 block">Tamanho H1</Label>
                <Select value={formData.custom_settings.size_h1} onValueChange={(v) => updateSetting('size_h1', v)}>
                  <SelectTrigger className="bg-white text-slate-900 border-slate-200"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text-2xl">Pequeno</SelectItem>
                    <SelectItem value="text-3xl">Médio</SelectItem>
                    <SelectItem value="text-4xl">Grande</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );
      case 'product':
        return (
          <div className="space-y-4 p-6">
            <h3 className="font-bold text-lg text-slate-900">Detalhes do Produto</h3>
            <div className="space-y-3">
              <div>
                <Label className="text-slate-700 font-semibold mb-1.5 block">Nome do Produto</Label>
                <Input value={formData.item_name} onChange={(e) => setFormData({...formData, item_name: e.target.value})} className="bg-white border-slate-200 text-slate-900" />
              </div>
              <div>
                <Label className="text-slate-700 font-semibold mb-1.5 block">Preço (R$)</Label>
                <Input type="number" value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} className="bg-white border-slate-200 text-slate-900" />
              </div>
              <div>
                <Label className="text-slate-700 font-semibold mb-1.5 block">Descrição Breve</Label>
                <Textarea value={formData.item_description} onChange={(e) => setFormData({...formData, item_description: e.target.value})} className="bg-white border-slate-200 text-slate-900 min-h-[100px]" />
              </div>
            </div>
          </div>
        );
      case 'summary':
        return (
          <div className="space-y-4 p-6">
            <h3 className="font-bold text-lg text-slate-900">Resumo do Pedido</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-slate-700 font-semibold">Mostrar Imagem do Produto</Label>
                <Switch checked={formData.custom_settings.show_summary_image} onCheckedChange={(v) => updateSetting('show_summary_image', v)} />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-slate-700 font-semibold">Mostrar Descrição</Label>
                <Switch checked={formData.custom_settings.show_summary_description} onCheckedChange={(v) => updateSetting('show_summary_description', v)} />
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                <Label className="text-slate-700 font-semibold">Cor de Fundo do Resumo</Label>
                <Input type="color" value={formData.custom_settings.summary_bg_color} onChange={(e) => updateSetting('summary_bg_color', e.target.value)} className="w-12 h-10 p-1 bg-white border-slate-200" />
              </div>
            </div>
          </div>
        );
      case 'form':
        return (
          <div className="space-y-4 p-6">
            <h3 className="font-bold text-lg text-slate-900">Campos do Formulário</h3>
            <div className="space-y-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
              <div className="flex items-center justify-between">
                <Label className="text-slate-700 font-medium">Nome Completo</Label>
                <Switch checked={formData.custom_settings.show_field_name} onCheckedChange={(v) => updateSetting('show_field_name', v)} />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-slate-700 font-medium">E-mail</Label>
                <Switch checked={formData.custom_settings.show_field_email} onCheckedChange={(v) => updateSetting('show_field_email', v)} />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-slate-700 font-medium">WhatsApp</Label>
                <Switch checked={formData.custom_settings.show_field_whatsapp} onCheckedChange={(v) => updateSetting('show_field_whatsapp', v)} />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-slate-700 font-medium">CPF/CNPJ</Label>
                <Switch checked={formData.custom_settings.show_field_cpf} onCheckedChange={(v) => updateSetting('show_field_cpf', v)} />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-slate-700 font-medium">Telefone Fixo</Label>
                <Switch checked={formData.custom_settings.show_field_phone} onCheckedChange={(v) => updateSetting('show_field_phone', v)} />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-slate-700 font-medium">Data de Nascimento</Label>
                <Switch checked={formData.custom_settings.show_field_birth} onCheckedChange={(v) => updateSetting('show_field_birth', v)} />
              </div>
              <div className="pt-2 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <Label className="text-slate-700 font-bold">Endereço de Entrega</Label>
                  <Switch checked={formData.custom_settings.show_field_address} onCheckedChange={(v) => updateSetting('show_field_address', v)} />
                </div>
                {formData.custom_settings.show_field_address && (
                  <div className="mt-2 space-y-2 pl-4 border-l-2 border-slate-200">
                    <div className="flex items-center justify-between">
                      <Label className="text-slate-500 text-xs">CEP</Label>
                      <Switch size="sm" checked={formData.custom_settings.show_field_zip} onCheckedChange={(v) => updateSetting('show_field_zip', v)} />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-slate-500 text-xs">Cidade/Estado</Label>
                      <Switch size="sm" checked={formData.custom_settings.show_field_city} onCheckedChange={(v) => updateSetting('show_field_city', v)} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      case 'payment':
        return (
          <div className="space-y-4 p-6">
            <h3 className="font-bold text-lg text-slate-900">Métodos de Pagamento</h3>
            <div className="space-y-3">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-xs">PIX</div>
                    <div>
                      <Label className="text-slate-900 font-bold block">Pix Manual</Label>
                      <p className="text-[10px] text-slate-500">QR Code manual e confirmação via WhatsApp</p>
                    </div>
                  </div>
                  <Switch checked={formData.custom_settings.enable_pix} onCheckedChange={(v) => updateSetting('enable_pix', v)} />
                </div>
                {formData.custom_settings.enable_pix && (
                  <div className="space-y-3 pt-2 border-t border-slate-200">
                    <div>
                      <Label className="text-slate-700 text-xs font-semibold mb-1 block">Chave PIX</Label>
                      <Input value={formData.custom_settings.pix_key || ''} onChange={(e) => updateSetting('pix_key', e.target.value)} placeholder="Sua chave PIX" className="h-9 bg-white text-slate-900" />
                    </div>
                    <div>
                      <Label className="text-slate-700 text-xs font-semibold mb-1 block">Número WhatsApp para Comprovante</Label>
                      <Input value={formData.custom_settings.pix_whatsapp || ''} onChange={(e) => updateSetting('pix_whatsapp', e.target.value)} placeholder="5511999999999" className="h-9 bg-white text-slate-900" />
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-xs">MP</div>
                    <div>
                      <Label className="text-slate-900 font-bold block">Mercado Pago</Label>
                      <p className="text-[10px] text-slate-500">Integração automática e cartão de crédito</p>
                    </div>
                  </div>
                  <Switch checked={formData.custom_settings.enable_mp} onCheckedChange={(v) => updateSetting('enable_mp', v)} />
                </div>
                {formData.custom_settings.enable_mp && (
                  <div className="space-y-3 pt-2 border-t border-slate-200">
                    <div className="p-2 bg-blue-100/50 border border-blue-200 rounded text-[10px] text-blue-800">
                      Configure suas credenciais nas configurações de integração do dashboard.
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      case 'benefits':
        return (
          <div className="space-y-4 p-6">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-lg text-slate-900">Benefícios</h3>
              <Button size="sm" onClick={() => {
                const benefits = formData.custom_settings.benefits || [];
                updateSetting('benefits', [...benefits, { title: 'Novo Benefício', description: 'Descrição curta do benefício' }]);
              }} className="bg-indigo-600 text-white h-8">
                <Plus className="w-4 h-4 mr-1" /> Adicionar
              </Button>
            </div>
            <div className="space-y-3">
              {(formData.custom_settings.benefits || []).map((b: any, i: number) => (
                <div key={i} className="p-4 bg-white border border-slate-200 rounded-xl space-y-2 relative group">
                  <Input 
                    value={b.title} 
                    onChange={(e) => {
                      const benefits = [...(formData.custom_settings.benefits || [])];
                      benefits[i].title = e.target.value;
                      updateSetting('benefits', benefits);
                    }} 
                    className="font-bold text-slate-900 h-8 border-none p-0 focus-visible:ring-0" 
                    placeholder="Título do Benefício" 
                  />
                  <Textarea 
                    value={b.description} 
                    onChange={(e) => {
                      const benefits = [...(formData.custom_settings.benefits || [])];
                      benefits[i].description = e.target.value;
                      updateSetting('benefits', benefits);
                    }} 
                    className="text-xs text-slate-500 border-none p-0 focus-visible:ring-0 min-h-[40px] resize-none" 
                    placeholder="Descrição do benefício..." 
                  />
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 h-6 w-6 text-red-500 hover:bg-red-50"
                    onClick={() => {
                      const benefits = (formData.custom_settings.benefits || []).filter((_: any, idx: number) => idx !== i);
                      updateSetting('benefits', benefits);
                    }}
                  >
                    <Plus className="w-4 h-4 rotate-45" />
                  </Button>
                </div>
              ))}
              {(formData.custom_settings.benefits || []).length === 0 && (
                <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                  <Gift className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-slate-400 text-xs">Nenhum benefício adicionado.</p>
                </div>
              )}
            </div>
          </div>
        );
      case 'testimonials':
        return (
          <div className="space-y-4 p-6">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-lg text-slate-900">Depoimentos</h3>
              <Button size="sm" onClick={() => {
                const testimonials = formData.custom_settings.testimonials || [];
                updateSetting('testimonials', [...testimonials, { name: 'Cliente Satisfeito', text: 'Excelente produto, super recomendo!', rating: 5 }]);
              }} className="bg-indigo-600 text-white h-8">
                <Plus className="w-4 h-4 mr-1" /> Adicionar
              </Button>
            </div>
            <div className="space-y-3">
              {(formData.custom_settings.testimonials || []).map((t: any, i: number) => (
                <div key={i} className="p-4 bg-white border border-slate-200 rounded-xl space-y-2 relative group">
                  <Input 
                    value={t.name} 
                    onChange={(e) => {
                      const testimonials = [...(formData.custom_settings.testimonials || [])];
                      testimonials[i].name = e.target.value;
                      updateSetting('testimonials', testimonials);
                    }} 
                    className="font-bold text-slate-900 h-8 border-none p-0 focus-visible:ring-0" 
                    placeholder="Nome do Cliente" 
                  />
                  <Textarea 
                    value={t.text} 
                    onChange={(e) => {
                      const testimonials = [...(formData.custom_settings.testimonials || [])];
                      testimonials[i].text = e.target.value;
                      updateSetting('testimonials', testimonials);
                    }} 
                    className="text-xs text-slate-500 border-none p-0 focus-visible:ring-0 min-h-[40px] resize-none" 
                    placeholder="Texto do depoimento..." 
                  />
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 h-6 w-6 text-red-500 hover:bg-red-50"
                    onClick={() => {
                      const testimonials = (formData.custom_settings.testimonials || []).filter((_: any, idx: number) => idx !== i);
                      updateSetting('testimonials', testimonials);
                    }}
                  >
                    <Plus className="w-4 h-4 rotate-45" />
                  </Button>
                </div>
              ))}
              {(formData.custom_settings.testimonials || []).length === 0 && (
                <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                  <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-slate-400 text-xs">Nenhum depoimento adicionado.</p>
                </div>
              )}
            </div>
          </div>
        );
      case 'guarantee':
        return (
          <div className="space-y-4 p-6">
            <h3 className="font-bold text-lg text-slate-900">Selo de Garantia</h3>
            <div className="space-y-3">
               <Label className="text-slate-700 font-semibold mb-1.5 block">Título da Garantia</Label>
               <Input value={formData.custom_settings.guarantee_title} onChange={(e) => updateSetting('guarantee_title', e.target.value)} className="bg-white border-slate-200 text-slate-900" />
               
               <Label className="text-slate-700 font-semibold mb-1.5 block">Descrição</Label>
               <Textarea value={formData.custom_settings.guarantee_description} onChange={(e) => updateSetting('guarantee_description', e.target.value)} className="bg-white border-slate-200 text-slate-900" />
            </div>
          </div>
        );
      case 'scarcity':
        return (
          <div className="space-y-4 p-6">
            <h3 className="font-bold text-lg text-slate-900">Gatilhos de Escassez</h3>
            <div className="space-y-4">
               <div className="flex items-center justify-between">
                 <Label className="text-slate-700 font-semibold">Ativar Contador de Tempo</Label>
                 <Switch checked={formData.custom_settings.show_scarcity} onCheckedChange={(v) => updateSetting('show_scarcity', v)} />
               </div>
               {formData.custom_settings.show_scarcity && (
                 <div>
                   <Label className="text-slate-700 font-semibold mb-1.5 block">Segundos do Contador</Label>
                   <Input type="number" value={formData.custom_settings.scarcity_timer} onChange={(e) => updateSetting('scarcity_timer', parseInt(e.target.value))} className="bg-white border-slate-200 text-slate-900" />
                 </div>
               )}
            </div>
          </div>
        );
      case 'cta':
        return (
          <div className="space-y-4 p-6">
            <h3 className="font-bold text-lg text-slate-900">Botão de Pagamento</h3>
            <div className="space-y-3">
               <Label className="text-slate-700 font-semibold mb-1.5 block">Texto do Botão</Label>
               <Input value={formData.custom_settings.thank_you_button_text} onChange={(e) => updateSetting('thank_you_button_text', e.target.value)} className="bg-white border-slate-200 text-slate-900" />
               
               <Label className="text-slate-700 font-semibold mb-1.5 block">Arredondamento</Label>
               <Select value={formData.custom_settings.button_radius} onValueChange={(v) => updateSetting('button_radius', v)}>
                  <SelectTrigger className="bg-white text-slate-900 border-slate-200"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rounded-none">Quadrado</SelectItem>
                    <SelectItem value="rounded-md">Suave</SelectItem>
                    <SelectItem value="rounded-xl">Arredondado</SelectItem>
                    <SelectItem value="rounded-full">Pílula</SelectItem>
                  </SelectContent>
               </Select>
            </div>
          </div>
        );
      case 'footer':
        return (
          <div className="space-y-4 p-6">
            <h3 className="font-bold text-lg text-slate-900">Rodapé</h3>
            <div className="space-y-3">
               <Label className="text-slate-700 font-semibold mb-1.5 block">Informações de Contato</Label>
               <Input value={formData.custom_settings.footer_contact_info} onChange={(e) => updateSetting('footer_contact_info', e.target.value)} className="bg-white border-slate-200 text-slate-900" />
               
               <Label className="text-slate-700 font-semibold mb-1.5 block">Link Termos de Uso</Label>
               <Input value={formData.custom_settings.footer_terms_url} onChange={(e) => updateSetting('footer_terms_url', e.target.value)} className="bg-white border-slate-200 text-slate-900" />
               
               <Label className="text-slate-700 font-semibold mb-1.5 block">Link Política de Privacidade</Label>
               <Input value={formData.custom_settings.footer_privacy_url} onChange={(e) => updateSetting('footer_privacy_url', e.target.value)} className="bg-white border-slate-200 text-slate-900" />
            </div>
          </div>
        );
      case 'mobile':
        return (
          <div className="space-y-4 p-6 text-slate-900">
            <h3 className="font-bold text-lg text-slate-900">Configurações Mobile</h3>
            <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl">
               <p className="text-indigo-800 text-xs font-medium">As configurações mobile são otimizadas automaticamente, mas você pode ajustar elementos específicos aqui.</p>
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-slate-700 font-semibold">Ocultar Elementos Pesados</Label>
              <Switch checked={true} />
            </div>
          </div>
        );
      case 'tracking':
        return (
          <div className="space-y-4 p-6">
            <h3 className="font-bold text-lg text-slate-900">SEO & Rastreamento</h3>
            <div className="space-y-4">
              <div>
                <Label className="text-slate-700 font-semibold mb-1.5 block">Pixel do Facebook/Meta</Label>
                <Input value={formData.custom_settings.pixel_meta} onChange={(e) => updateSetting('pixel_meta', e.target.value)} placeholder="ID do Pixel" className="bg-white border-slate-200 text-slate-900" />
              </div>
              <div>
                <Label className="text-slate-700 font-semibold mb-1.5 block">Google Analytics (ID)</Label>
                <Input value={formData.custom_settings.pixel_google_analytics} onChange={(e) => updateSetting('pixel_google_analytics', e.target.value)} placeholder="G-XXXXXX" className="bg-white border-slate-200 text-slate-900" />
              </div>
              <div>
                <Label className="text-slate-700 font-semibold mb-1.5 block">Scripts Personalizados (Header)</Label>
                <Textarea value={formData.custom_settings.custom_scripts} onChange={(e) => updateSetting('custom_scripts', e.target.value)} placeholder="<script>...</script>" className="bg-white border-slate-200 text-slate-900 min-h-[150px]" />
              </div>
            </div>
          </div>
        );
      case 'preview_tab':
        return (
          <div className="flex flex-col items-center justify-center p-12 text-center space-y-6">
             <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
                <Eye className="w-10 h-10" />
             </div>
             <div>
                <h3 className="font-bold text-xl text-slate-900">Pronto para Visualizar</h3>
                <p className="text-slate-500 max-w-xs mt-2">Use o painel ao lado para ver o preview em tempo real em diferentes dispositivos.</p>
             </div>
             <Button onClick={() => setFormTab('general')} variant="outline" className="text-slate-900 border-slate-200">Voltar ao Início</Button>
          </div>
        );
      default:
        return <div className="p-6 text-slate-500 bg-white min-h-[200px] flex items-center justify-center border m-6 rounded-xl border-dashed">Em desenvolvimento...</div>;
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <div 
        ref={tabsRef}
        className="flex overflow-x-auto border-b border-slate-200 scrollbar-hide bg-white sticky top-0 z-10"
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            data-active={formTab === tab.id}
            onClick={() => setFormTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-4 text-xs font-bold whitespace-nowrap border-b-2 transition-all duration-200 ${
              formTab === tab.id 
                ? 'border-indigo-600 text-indigo-600 bg-indigo-50/30' 
                : 'border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50'
            }`}
          >
            <tab.icon className={`w-4 h-4 ${formTab === tab.id ? 'text-indigo-600' : 'text-slate-400'}`} />
            {tab.label}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto">
        {renderContent()}
      </div>
    </div>
  );
};