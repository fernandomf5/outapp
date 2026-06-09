import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Copy, Eye, Save, Plus } from "lucide-react";
import { CheckoutPreview } from "./checkout/CheckoutPreview";
import { CheckoutFormFields } from "./checkout/CheckoutFormFields";

export const CheckoutCreatorPanel = () => {
  const [view, setView] = useState<'list' | 'editor'>('list');
  const [checkouts, setCheckouts] = useState<any[]>([]);
  const [selectedCheckout, setSelectedCheckout] = useState<any | null>(null);
  const [formTab, setFormTab] = useState('general');

  const [formData, setFormData] = useState({
    name: '', description: '', slug: '', item_name: '', item_description: '',
    item_image_url: '', price: '', primary_color: '#8B5CF6', banner_url: '',
    success_message: 'Pagamento realizado com sucesso!', redirect_url: '',
    mp_access_token: '', mp_public_key: '',
    thank_you_title: 'Obrigado pela sua compra!',
    thank_you_message: 'Seu pedido foi realizado com sucesso.',
    thank_you_image_url: '', thank_you_button_text: 'Falar no WhatsApp',
    thank_you_button_url: '', thank_you_download_url: '',
    show_order_details: true,
    head_code: '', footer_code: '',
    upsell_title: '', upsell_description: '', upsell_price: '',
    upsell_image_url: '', upsell_checkout_url: '',
    downsell_title: '', downsell_description: '', downsell_price: '',
    downsell_image_url: '', downsell_checkout_url: '',
    integration_type: '', integration_id: '',
    product_type: 'digital_product',
    custom_settings: {
      language: 'pt-BR',
      currency: 'BRL',
      logo_size: 'h-8',
      logo_alignment: 'center',
      header_title: '',
      header_title_color: '#000000',
      header_title_font_size: 'text-2xl',
      header_title_font_family: 'sans',
      header_title_bold: true,
      header_subtitle: '',
      header_subtitle_color: '#666666',
      header_subtitle_font_family: 'sans',
      header_subtitle_font_size: 'text-sm',
      top_bar_bg_color: '#ffffff',
      top_bar_text_color: '#000000',
      show_secure_badge: true,
      show_whatsapp_support: false,
      layout_model: 'modern',
      layout_structure: 'split',
      layout_width: 'boxed',
      background_gradient: '',
      background_image: '',
      card_color: '#ffffff',
      card_transparency: 100,
      card_border: true,
      title_color: '#000000',
      subtitle_color: '#666666',
      field_color: '#ffffff',
      button_hover_color: '',
      button_text_color: '#ffffff',
      font_title: 'sans',
      font_subtitle: 'sans',
      font_fields: 'sans',
      font_buttons: 'sans',
      size_h1: 'text-3xl',
      size_h2: 'text-2xl',
      size_text: 'text-base',
      size_button: 'text-lg',
      item_gallery: [],
      item_category: '',
      item_original_price: '',
      show_summary_image: true,
      show_summary_name: true,
      show_summary_description: true,
      show_summary_discount: true,
      show_summary_warranty: true,
      show_summary_installments: true,
      show_summary_savings: true,
      summary_bg_color: '#f3f4f6',
      summary_text_color: '#000000',
      summary_price_color: '#000000',
      show_field_name: true,
      show_field_email: true,
      show_field_whatsapp: true,
      show_field_cpf: true,
      show_field_address: true,
      show_field_city: true,
      show_field_state: true,
      show_field_zip: true,
      custom_fields: [],
      enable_pix: true,
      enable_card: true,
      enable_boleto: true,
      enable_mp: true,
      enable_stripe: false,
      enable_paypal: false,
      payment_button_color: '',
      payment_icons: true,
      payment_order: [],
      benefits: [],
      benefits_icon_color: '#000000',
      benefits_title_color: '#000000',
      benefits_desc_color: '#666666',
      testimonials: [],
      testimonials_layout: 'carousel',
      guarantee_seal_url: '',
      guarantee_title: '7 Dias de Garantia',
      guarantee_description: 'Se você não gostar, devolvemos seu dinheiro.',
      show_scarcity: false,
      scarcity_type: 'countdown',
      scarcity_timer: 600,
      scarcity_daily_close: false,
      scarcity_spots: 10,
      button_size: 'large',
      button_radius: 'rounded-xl',
      button_icon: '',
      footer_terms_url: '',
      footer_privacy_url: '',
      footer_contact_info: '',
      footer_bg_color: '#ffffff',
      footer_text_color: '#666666',
      footer_links_color: '#3b82f6',
      pixel_meta: '',
      pixel_google_analytics: '',
      pixel_gtm: '',
      pixel_tiktok: '',
      custom_scripts: '',
    },
  });

  const loadCheckouts = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from('checkouts').select('*').eq('user_id', user.id);
    setCheckouts(data || []);
  };

  useEffect(() => { loadCheckouts(); }, []);

  const handleCreate = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from('checkouts').insert({ user_id: user.id, ...formData });
    if (error) toast.error('Erro ao criar');
    else { toast.success('Criado!'); setView('list'); loadCheckouts(); }
  };

  const handleEdit = async () => {
    if (!selectedCheckout) return;
    const { error } = await supabase.from('checkouts').update(formData).eq('id', selectedCheckout.id);
    if (error) toast.error('Erro ao atualizar');
    else { toast.success('Atualizado!'); setView('list'); loadCheckouts(); }
  };

  if (view === 'list') return (
    <div className="p-6">
      <Button onClick={() => { setView('editor'); setSelectedCheckout(null); }}><Plus className="mr-2"/> Novo Checkout</Button>
      <div className="mt-4 grid gap-4">
        {checkouts.map(c => <div key={c.id} className="p-4 border rounded" onClick={() => { setSelectedCheckout(c); setView('editor'); }}>{c.name}</div>)}
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden">
      <div className="w-[400px] border-r overflow-y-auto">
        <CheckoutFormFields formData={formData} setFormData={setFormData} formTab={formTab} setFormTab={setFormTab} />
      </div>
      <div className="flex-1 bg-gray-100 p-6 flex flex-col items-center justify-center">
        <CheckoutPreview checkout={{...formData, ...formData.custom_settings}} />
        <div className="fixed bottom-4 right-4 flex gap-2">
            <Button variant="outline"><Copy className="w-4 h-4 mr-2" /> Duplicar</Button>
            <Button variant="outline"><Eye className="w-4 h-4 mr-2" /> Visualizar</Button>
            <Button onClick={selectedCheckout ? handleEdit : handleCreate}><Save className="w-4 h-4 mr-2" /> Publicar</Button>
        </div>
      </div>
    </div>
  );
};
