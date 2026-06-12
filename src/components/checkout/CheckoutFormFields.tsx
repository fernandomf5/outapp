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
    { id: 'colors', label: '3. Cores', icon: Palette },
    { id: 'product', label: '4. Produto', icon: Package },
    { id: 'summary', label: '5. Resumo', icon: ShoppingCart },
    { id: 'form', label: '6. Formulário', icon: ListTodo },
    { id: 'payment', label: '7. Pagamento', icon: CreditCard },
    { id: 'benefits', label: '8. Benefícios', icon: Gift },
    { id: 'testimonials', label: '9. Depoimentos', icon: Users },
    { id: 'guarantee', label: '10. Garantia', icon: ShieldCheck },
    { id: 'scarcity', label: '11. Contador', icon: Clock },
    { id: 'cta', label: '12. Botão', icon: MousePointer2 },
    { id: 'footer', label: '13. Rodapé', icon: ListTodo },
    { id: 'mobile', label: '14. Mobile', icon: Smartphone },
    { id: 'tracking', label: '15. SEO & Tracking', icon: Code },
    { id: 'preview_tab', label: '16. Visualizar', icon: Eye },
  ];

  const tabsRef = useRef<HTMLDivElement>(null);
  const [device, setDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

  useEffect(() => {
    const activeElement = tabsRef.current?.querySelector(`[data-active="true"]`);
    if (activeElement) {
      activeElement.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [formTab]);

  const updateSetting = (key: string, value: any) => {
    const deviceSuffix = device === 'mobile' ? '_mobile' : device === 'tablet' ? '_tablet' : '';
    const finalKey = (device === 'mobile' || device === 'tablet') && ['logo_size', 'logo_alignment', 'header_title_font_size', 'layout_structure'].includes(key) 
      ? `${key}${deviceSuffix}` 
      : key;

    setFormData((prev: any) => ({
      ...prev,
      custom_settings: {
        ...prev.custom_settings,
        [finalKey]: value
      }
    }));
  };

  const getSetting = (key: string) => {
    const deviceSuffix = device === 'mobile' ? '_mobile' : device === 'tablet' ? '_tablet' : '';
    const deviceKey = `${key}${deviceSuffix}`;
    
    if ((device === 'mobile' || device === 'tablet') && formData.custom_settings[deviceKey] !== undefined) {
      return formData.custom_settings[deviceKey];
    }
    return formData.custom_settings[key];
  };

  const renderContent = () => {
    return (
      <div className="flex flex-col h-full">
        {/* Mobile/Desktop Selector */}
        <div className="px-6 py-2 border-b border-slate-100 flex items-center justify-center gap-2 bg-slate-50/50">
          <Button 
            variant={device === 'desktop' ? 'default' : 'outline'} 
            size="sm" 
            onClick={() => setDevice('desktop')}
            className="h-8 gap-1.5 text-xs font-semibold"
          >
            <Layout className="w-3.5 h-3.5" /> Desktop
          </Button>
          <Button 
            variant={device === 'tablet' ? 'default' : 'outline'} 
            size="sm" 
            onClick={() => setDevice('tablet')}
            className="h-8 gap-1.5 text-xs font-semibold"
          >
            <Smartphone className="w-3.5 h-3.5 rotate-90" /> Tablet
          </Button>
          <Button 
            variant={device === 'mobile' ? 'default' : 'outline'} 
            size="sm" 
            onClick={() => setDevice('mobile')}
            className="h-8 gap-1.5 text-xs font-semibold"
          >
            <Smartphone className="w-3.5 h-3.5" /> Mobile
          </Button>
        </div>

        {renderTabContent()}
      </div>
    );
  };

  const renderTabContent = () => {
    switch (formTab) {
      case 'general':
        return (
          <div className="space-y-4 p-6">
            <h3 className="font-bold text-lg text-slate-900">Informações Básicas</h3>
            <div className="space-y-3">
              <div>
                <Label className="text-slate-700 font-semibold mb-1.5 block">Nome do Checkout</Label>
                <Input value={formData.name} onChange={(e) => setFormData((prev: any) => ({...prev, name: e.target.value}))} className="bg-white border-slate-200 focus:border-green-500 focus:ring-green-500 text-slate-900" />
              </div>
              <div>
                <Label className="text-slate-700 font-semibold mb-1.5 block">URL Personalizada</Label>
                <Input value={formData.slug} onChange={(e) => setFormData((prev: any) => ({...prev, slug: e.target.value}))} className="bg-white border-slate-200 focus:border-green-500 focus:ring-green-500 text-slate-900" />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-slate-700 font-semibold">Status Ativo</Label>
                <Switch checked={formData.is_active} onCheckedChange={(v) => setFormData((prev: any) => ({...prev, is_active: v}))} />
              </div>
              <div>
                <Label className="text-slate-700 font-semibold mb-1.5 block">Tipo de Produto</Label>
                <Select value={formData.product_type} onValueChange={(v) => setFormData((prev: any) => ({...prev, product_type: v}))}>
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
             <CheckoutImageUpload label="Upload da Logo" value={formData.item_image_url} onChange={(url) => setFormData((prev: any) => ({...prev, item_image_url: url}))} />
             <div className="grid grid-cols-2 gap-2">
                <div>
                   <Label className="text-slate-700 font-semibold mb-1.5 block">Tamanho da Logo</Label>
                   <Select value={getSetting('logo_size')} onValueChange={(v) => updateSetting('logo_size', v)}>
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
                   <Select value={getSetting('logo_alignment')} onValueChange={(v) => updateSetting('logo_alignment', v)}>
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
                <div className="grid grid-cols-2 gap-2 pt-2">
                   <div className="flex items-center gap-2">
                      <Input type="color" value={formData.custom_settings.header_title_color} onChange={(e) => updateSetting('header_title_color', e.target.value)} className="w-10 p-1 bg-white border-slate-200 h-10" />
                      <Label className="text-slate-700 font-semibold text-xs">Cor</Label>
                   </div>
                   <div>
                      <Select value={getSetting('header_title_font_size') || 'text-xl'} onValueChange={(v) => updateSetting('header_title_font_size', v)}>
                         <SelectTrigger className="bg-white text-slate-900 border-slate-200 h-10 text-xs"><SelectValue placeholder="Tamanho" /></SelectTrigger>
                         <SelectContent>
                           <SelectItem value="text-sm">Pequeno (sm)</SelectItem>
                           <SelectItem value="text-base">Base</SelectItem>
                           <SelectItem value="text-lg">Grande (lg)</SelectItem>
                           <SelectItem value="text-xl">Extra Grande (xl)</SelectItem>
                           <SelectItem value="text-2xl">2X Grande (2xl)</SelectItem>
                           <SelectItem value="text-3xl">3X Grande (3xl)</SelectItem>
                           <SelectItem value="text-4xl">4X Grande (4xl)</SelectItem>
                         </SelectContent>
                      </Select>
                   </div>
                </div>
                <div className="flex items-center justify-between pt-2">
                   <Label className="text-slate-700 font-semibold text-xs">Negrito</Label>
                   <Switch checked={formData.custom_settings.header_title_bold !== false} onCheckedChange={(v) => updateSetting('header_title_bold', v)} />
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
                <Input type="color" value={formData.primary_color} onChange={(e) => setFormData((prev: any) => ({...prev, primary_color: e.target.value}))} className="w-12 h-10 p-1 bg-white border-slate-200" />
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                <Label className="text-slate-700 font-semibold">Cor do Fundo Geral</Label>
                <Input type="color" value={formData.background_color || '#F8FAFC'} onChange={(e) => setFormData((prev: any) => ({...prev, background_color: e.target.value}))} className="w-12 h-10 p-1 bg-white border-slate-200" />
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                <Label className="text-slate-700 font-semibold">Cor do Cabeçalho (Logo)</Label>
                <Input type="color" value={formData.top_bar_bg_color || '#ffffff'} onChange={(e) => setFormData((prev: any) => ({...prev, top_bar_bg_color: e.target.value}))} className="w-12 h-10 p-1 bg-white border-slate-200" />
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                <Label className="text-slate-700 font-semibold">Cor do Selo 'Oferta Ativa'</Label>
                <Input type="color" value={formData.custom_settings.badge_bg_color || formData.primary_color} onChange={(e) => updateSetting('badge_bg_color', e.target.value)} className="w-12 h-10 p-1 bg-white border-slate-200" />
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                <Label className="text-slate-700 font-semibold">Cor do Cartão/Conteúdo</Label>
                <Input type="color" value={formData.custom_settings.card_color || '#ffffff'} onChange={(e) => updateSetting('card_color', e.target.value)} className="w-12 h-10 p-1 bg-white border-slate-200" />
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                <Label className="text-slate-700 font-semibold text-xs">Cor do Fundo Interno (Cinza)</Label>
                <div className="flex items-center gap-2">
                  <Input type="color" value={formData.custom_settings.inner_bg_color || '#f3f4f6'} onChange={(e) => updateSetting('inner_bg_color', e.target.value)} className="w-10 h-8 p-1 bg-white border-slate-200" />
                  <Button variant="ghost" size="sm" onClick={() => updateSetting('inner_bg_color', 'transparent')} className="text-[10px] h-6 px-2">Limpar</Button>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                <Label className="text-slate-700 font-semibold text-xs">Cor das Bordas</Label>
                <Input type="color" value={formData.custom_settings.border_color || '#e2e8f0'} onChange={(e) => updateSetting('border_color', e.target.value)} className="w-12 h-10 p-1 bg-white border-slate-200" />
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                <Label className="text-slate-700 font-semibold">Cor dos Títulos</Label>
                <Input type="color" value={formData.custom_settings.title_color || '#000000'} onChange={(e) => updateSetting('title_color', e.target.value)} className="w-12 h-10 p-1 bg-white border-slate-200" />
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                <Label className="text-slate-700 font-semibold">Cor dos Subtítulos / Labels</Label>
                <Input type="color" value={formData.custom_settings.subtitle_color || '#666666'} onChange={(e) => updateSetting('subtitle_color', e.target.value)} className="w-12 h-10 p-1 bg-white border-slate-200" />
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                <Label className="text-slate-700 font-semibold">Cor de Fundo dos Inputs</Label>
                <Input type="color" value={formData.custom_settings.field_color || '#ffffff'} onChange={(e) => updateSetting('field_color', e.target.value)} className="w-12 h-10 p-1 bg-white border-slate-200" />
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                <Label className="text-slate-700 font-semibold">Cor do Texto dos Inputs</Label>
                <Input type="color" value={formData.custom_settings.field_text_color || '#000000'} onChange={(e) => updateSetting('field_text_color', e.target.value)} className="w-12 h-10 p-1 bg-white border-slate-200" />
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                <Label className="text-slate-700 font-semibold">Cor do Botão Texto</Label>
                <Input type="color" value={formData.custom_settings.button_text_color || '#ffffff'} onChange={(e) => updateSetting('button_text_color', e.target.value)} className="w-12 h-10 p-1 bg-white border-slate-200" />
              </div>
              
              <div className="pt-4 border-t border-slate-100 space-y-4">
                <h4 className="font-bold text-sm text-slate-900">Ajustes Finos</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-slate-700 text-xs">Arredondamento dos Cards</Label>
                    <Select value={formData.custom_settings.card_radius || 'rounded-3xl'} onValueChange={(v) => updateSetting('card_radius', v)}>
                      <SelectTrigger className="w-[140px] h-8 text-xs bg-white"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="rounded-none">Nenhum</SelectItem>
                        <SelectItem value="rounded-lg">Pequeno</SelectItem>
                        <SelectItem value="rounded-2xl">Médio</SelectItem>
                        <SelectItem value="rounded-3xl">Grande</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-slate-700 text-xs">Sombra dos Cards</Label>
                    <Select value={formData.custom_settings.card_shadow || 'shadow-sm'} onValueChange={(v) => updateSetting('card_shadow', v)}>
                      <SelectTrigger className="w-[140px] h-8 text-xs bg-white"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="shadow-none">Nenhuma</SelectItem>
                        <SelectItem value="shadow-sm">Suave</SelectItem>
                        <SelectItem value="shadow-md">Média</SelectItem>
                        <SelectItem value="shadow-xl">Forte</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
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
                <Input value={formData.item_name} onChange={(e) => setFormData((prev: any) => ({...prev, item_name: e.target.value}))} className="bg-white border-slate-200 text-slate-900" />
              </div>
              <div>
                <Label className="text-slate-700 font-semibold mb-1.5 block">Preço (R$)</Label>
                <Input type="number" value={formData.price} onChange={(e) => setFormData((prev: any) => ({...prev, price: e.target.value}))} className="bg-white border-slate-200 text-slate-900" />
              </div>
              <div>
                <Label className="text-slate-700 font-semibold mb-1.5 block">Descrição Breve</Label>
                <Textarea value={formData.item_description} onChange={(e) => setFormData((prev: any) => ({...prev, item_description: e.target.value}))} className="bg-white border-slate-200 text-slate-900 min-h-[100px]" />
              </div>
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-slate-700 font-semibold">Mostrar Preço Original (De:)</Label>
                  <Switch checked={formData.custom_settings.show_original_price} onCheckedChange={(v) => updateSetting('show_original_price', v)} />
                </div>
                {formData.custom_settings.show_original_price && (
                  <div>
                    <Label className="text-slate-700 font-semibold mb-1.5 block">Preço Original (R$)</Label>
                    <Input type="number" value={formData.custom_settings.original_price} onChange={(e) => updateSetting('original_price', e.target.value)} className="bg-white border-slate-200 text-slate-900" placeholder="Ex: 75.00" />
                  </div>
                )}
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
                <Label className="text-slate-700 font-semibold">Cor de Fundo Cabeçalho Resumo</Label>
                <Input type="color" value={formData.custom_settings.summary_header_bg_color || '#ffffff'} onChange={(e) => updateSetting('summary_header_bg_color', e.target.value)} className="w-12 h-10 p-1 bg-white border-slate-200" />
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                <Label className="text-slate-700 font-semibold">Cor de Fundo do Resumo</Label>
                <Input type="color" value={formData.custom_settings.summary_bg_color || '#f3f4f6'} onChange={(e) => updateSetting('summary_bg_color', e.target.value)} className="w-12 h-10 p-1 bg-white border-slate-200" />
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                <Label className="text-slate-700 font-semibold">Cor do Texto do Resumo</Label>
                <Input type="color" value={formData.custom_settings.summary_text_color || '#000000'} onChange={(e) => updateSetting('summary_text_color', e.target.value)} className="w-12 h-10 p-1 bg-white border-slate-200" />
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                <Label className="text-slate-700 font-semibold">Cor dos Preços no Resumo</Label>
                <Input type="color" value={formData.custom_settings.summary_price_color || '#000000'} onChange={(e) => updateSetting('summary_price_color', e.target.value)} className="w-12 h-10 p-1 bg-white border-slate-200" />
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
                      <Switch checked={formData.custom_settings.show_field_zip} onCheckedChange={(v) => updateSetting('show_field_zip', v)} />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-slate-500 text-xs">Cidade/Estado</Label>
                      <Switch checked={formData.custom_settings.show_field_city} onCheckedChange={(v) => updateSetting('show_field_city', v)} />
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
                    <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-600 font-bold text-xs">PIX</div>
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
                      <Input value={formData.custom_settings.pix_whatsapp || ''} onChange={(e) => updateSetting('pix_whatsapp', e.target.value)} placeholder="Ex: 5511999999999" className="h-9 bg-white text-slate-900" />
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
                      Configure suas credenciais do Mercado Pago para este checkout.
                    </div>
                    <div>
                      <Label className="text-slate-700 text-xs font-semibold mb-1 block">Public Key (PK_...)</Label>
                      <Input 
                        value={formData.mp_public_key || ''} 
                        onChange={(e) => setFormData((prev: any) => ({...prev, mp_public_key: e.target.value}))} 
                        placeholder="APP_USR-..." 
                        className="h-9 bg-white text-slate-900" 
                      />
                    </div>
                    <div>
                      <Label className="text-slate-700 text-xs font-semibold mb-1 block">Access Token (APP_USR-...)</Label>
                      <Input 
                        type="password"
                        value={formData.mp_access_token || ''} 
                        onChange={(e) => setFormData((prev: any) => ({...prev, mp_access_token: e.target.value}))} 
                        placeholder="TEST-..." 
                        className="h-9 bg-white text-slate-900" 
                      />
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
              }} className="bg-green-600 text-white h-8">
                <Plus className="w-4 h-4 mr-1" /> Adicionar
              </Button>
            </div>
            <div className="space-y-3">
              {(formData.custom_settings.benefits || []).map((b: any, i: number) => (
                <div key={i} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 relative group shadow-sm">
                  <div className="space-y-1">
                    <Label className="text-[10px] uppercase font-bold text-slate-400">Título do Benefício</Label>
                    <Input 
                      value={b.title} 
                      onChange={(e) => {
                        const benefits = [...(formData.custom_settings.benefits || [])];
                        benefits[i].title = e.target.value;
                        updateSetting('benefits', benefits);
                      }} 
                      className="font-bold text-slate-900 h-9 bg-slate-50 border-slate-100 focus:bg-white transition-colors" 
                      placeholder="Ex: Entrega Grátis" 
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] uppercase font-bold text-slate-400">Descrição</Label>
                    <Textarea 
                      value={b.description} 
                      onChange={(e) => {
                        const benefits = [...(formData.custom_settings.benefits || [])];
                        benefits[i].description = e.target.value;
                        updateSetting('benefits', benefits);
                      }} 
                      className="text-sm text-slate-600 bg-slate-50 border-slate-100 focus:bg-white transition-colors min-h-[60px]" 
                      placeholder="Descreva brevemente este benefício..." 
                    />
                  </div>

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
              }} className="bg-green-600 text-white h-8">
                <Plus className="w-4 h-4 mr-1" /> Adicionar
              </Button>
            </div>
            <div className="space-y-3">
              {(formData.custom_settings.testimonials || []).map((t: any, i: number) => (
                <div key={i} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 relative group shadow-sm">
                  <div className="space-y-1">
                    <Label className="text-[10px] uppercase font-bold text-slate-400">Nome do Cliente</Label>
                    <Input 
                      value={t.name} 
                      onChange={(e) => {
                        const testimonials = [...(formData.custom_settings.testimonials || [])];
                        testimonials[i].name = e.target.value;
                        updateSetting('testimonials', testimonials);
                      }} 
                      className="font-bold text-slate-900 h-9 bg-slate-50 border-slate-100 focus:bg-white transition-colors" 
                      placeholder="Ex: João Silva" 
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] uppercase font-bold text-slate-400">Depoimento</Label>
                    <Textarea 
                      value={t.text} 
                      onChange={(e) => {
                        const testimonials = [...(formData.custom_settings.testimonials || [])];
                        testimonials[i].text = e.target.value;
                        updateSetting('testimonials', testimonials);
                      }} 
                      className="text-sm text-slate-600 bg-slate-50 border-slate-100 focus:bg-white transition-colors min-h-[80px]" 
                      placeholder="O que o cliente disse sobre seu produto..." 
                    />
                  </div>

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
            <div className="p-4 bg-green-50 border border-green-100 rounded-xl">
               <p className="text-green-800 text-xs font-medium">As configurações mobile são otimizadas automaticamente, mas você pode ajustar elementos específicos aqui.</p>
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
             <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                <Eye className="w-10 h-10" />
             </div>
             <div>
                <h3 className="font-bold text-xl text-slate-900">Pronto para Visualizar</h3>
                <p className="text-slate-500 max-w-xs mt-2">Use o painel ao lado para ver o preview em tempo real em diferentes dispositivos.</p>
             </div>
             <Button onClick={() => setFormTab('general')} className="bg-slate-900 text-white hover:bg-slate-800 px-8 py-6 rounded-xl font-bold text-lg shadow-xl transition-all hover:scale-105 active:scale-95">Voltar ao Início</Button>
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
                ? 'border-green-600 text-green-600 bg-green-50/30' 
                : 'border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50'
            }`}
          >
            <tab.icon className={`w-4 h-4 ${formTab === tab.id ? 'text-green-600' : 'text-slate-400'}`} />
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