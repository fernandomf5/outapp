
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckoutImageUpload } from "@/components/checkout/CheckoutImageUpload";
import { ChevronDown, Code, Palette, Gift, TrendingUp, Link2, Settings2 } from "lucide-react";

export const CheckoutFormFields = ({ formData, setFormData, formTab, setFormTab, membersAreas }: any) => {
  const tabs = [
    { id: 'basic', label: 'Básico', icon: Settings2 },
    { id: 'integration', label: 'Integração', icon: Link2 },
    { id: 'design', label: 'Design', icon: Palette },
    { id: 'thankyou', label: 'Obrigado', icon: Gift },
    { id: 'upsell', label: 'Upsell', icon: TrendingUp },
    { id: 'tracking', label: 'Tracking', icon: Code },
  ];

  const renderContent = () => {
    switch (formTab) {
      case 'basic':
        return (
          <div className="space-y-4">
            <h4 className="font-semibold text-lg">📝 Configurações Básicas</h4>
            <div><Label>Nome do Checkout</Label><Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} /></div>
            <div><Label>Descrição</Label><Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Item (Produto)</Label><Input value={formData.item_name} onChange={(e) => setFormData({ ...formData, item_name: e.target.value })} /></div>
              <div><Label>Preço (R$)</Label><Input type="number" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} /></div>
            </div>
            <CheckoutImageUpload label="Imagem do Produto" value={formData.item_image_url} onChange={(url) => setFormData({ ...formData, item_image_url: url })} />
          </div>
        );
      case 'integration':
        return (
          <div className="space-y-4">
            <h4 className="font-semibold text-lg">🔗 Integrações e Pagamento</h4>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Token MP Access</Label><Input value={formData.mp_access_token} onChange={(e) => setFormData({ ...formData, mp_access_token: e.target.value })} /></div>
              <div><Label>Public Key MP</Label><Input value={formData.mp_public_key} onChange={(e) => setFormData({ ...formData, mp_public_key: e.target.value })} /></div>
            </div>
            <div>
              <Label>Tipo de Pagamento</Label>
              <Select value={formData.integration_type || 'mp'} onValueChange={(v) => setFormData({ ...formData, integration_type: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="mp">Mercado Pago (Cartão + Pix)</SelectItem>
                  <SelectItem value="pix">Somente Pix</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );
      case 'design':
        return (
          <div className="space-y-4">
            <h4 className="font-semibold text-lg">🎨 Personalização Visual</h4>
            <div className="grid grid-cols-2 gap-4">
              <CheckoutImageUpload label="Logo" value={formData.logo_url} onChange={(url) => setFormData({ ...formData, logo_url: url })} />
              <CheckoutImageUpload label="Banner" value={formData.banner_url} onChange={(url) => setFormData({ ...formData, banner_url: url })} />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div><Label>Cor Primária</Label><Input type="color" value={formData.primary_color} onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })} className="h-10" /></div>
              <div><Label>Cor Fundo</Label><Input type="color" value={formData.background_color} onChange={(e) => setFormData({ ...formData, background_color: e.target.value })} className="h-10" /></div>
              <div><Label>Cor Texto</Label><Input type="color" value={formData.text_color} onChange={(e) => setFormData({ ...formData, text_color: e.target.value })} className="h-10" /></div>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={formData.show_fake_feedback} onCheckedChange={(v) => setFormData({ ...formData, show_fake_feedback: v })} />
              <Label>Exibir Prova Social</Label>
            </div>
          </div>
        );
      default:
        return <div>Configuração para {formTab}</div>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-2 p-1 bg-muted rounded-lg overflow-x-auto">
        {tabs.map(t => (
          <button 
            key={t.id}
            onClick={() => setFormTab(t.id)}
            className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${formTab === t.id ? 'bg-white shadow' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>
      {renderContent()}
    </div>
  );
};
