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
  Heading
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
                        <SelectItem value="h-8">Pequeno</SelectItem>
                        <SelectItem value="h-12">Médio</SelectItem>
                        <SelectItem value="h-16">Grande</SelectItem>
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
          <div className="space-y-4 p-6 text-slate-900">
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
