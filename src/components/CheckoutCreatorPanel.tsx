import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Copy, Eye, Save, Plus, ArrowLeft } from "lucide-react";
import { CheckoutPreview } from "./checkout/CheckoutPreview";
import { CheckoutFormFields } from "./checkout/CheckoutFormFields";

export const CheckoutCreatorPanel = () => {
  const navigate = useNavigate();
  const [checkouts, setCheckouts] = useState<any[]>([]);
  const [selectedCheckout, setSelectedCheckout] = useState<any | null>(null);
  const [formTab, setFormTab] = useState('general');

  const [formData, setFormData] = useState<any>({
    name: '', description: '', slug: '', item_name: '', item_description: '',
    item_image_url: '', price: '0', primary_color: '#8B5CF6', banner_url: '',
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

  const preparePayload = () => {
    const payload = { ...formData };
    payload.price = parseFloat(formData.price) || 0;
    payload.upsell_price = formData.upsell_price ? parseFloat(formData.upsell_price) : null;
    payload.downsell_price = formData.downsell_price ? parseFloat(formData.downsell_price) : null;
    // Remove null values for optional UUID fields if they are empty strings
    if (payload.integration_id === '') payload.integration_id = null;
    return payload;
  };

  const handleCreate = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from('checkouts').insert({ user_id: user.id, ...preparePayload() });
    if (error) {
      console.error(error);
      toast.error('Erro ao criar: ' + error.message);
    }
    else { toast.success('Criado!'); setView('list'); loadCheckouts(); }
  };

  const handleEdit = async () => {
    if (!selectedCheckout) return;
    const { error } = await supabase.from('checkouts').update(preparePayload()).eq('id', selectedCheckout.id);
    if (error) {
       console.error(error);
       toast.error('Erro ao atualizar: ' + error.message);
    }
    else { toast.success('Atualizado!'); setView('list'); loadCheckouts(); }
  };

  const openEditor = (checkout: any) => {
    setSelectedCheckout(checkout);
    setFormData({
      ...checkout,
      price: String(checkout.price),
      upsell_price: checkout.upsell_price ? String(checkout.upsell_price) : '',
      downsell_price: checkout.downsell_price ? String(checkout.downsell_price) : '',
      custom_settings: checkout.custom_settings || formData.custom_settings
    });
    setView('editor');
  };

  return (
    <div className=\"p-6 max-w-7xl mx-auto bg-slate-50 min-h-screen\">
      <div className=\"flex justify-between items-center mb-8\">
        <div>
          <h1 className=\"text-3xl font-bold text-slate-900\">Meus Checkouts</h1>
          <p className=\"text-slate-500\">Crie e gerencie seus fluxos de pagamento</p>
        </div>
        <Button onClick={() => window.open('/checkout-editor/new', '_blank')} className=\"bg-indigo-600 hover:bg-indigo-700 h-12 px-6 rounded-xl shadow-lg shadow-indigo-200 gap-2\">
          <Plus className=\"w-5 h-5\"/> Novo Checkout
        </Button>
      </div>
      
      <div className=\"grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6\">
        {checkouts.map(c => (
          <Card key={c.id} className=\"group hover:shadow-xl transition-all duration-300 border-none bg-white rounded-2xl overflow-hidden cursor-pointer\" onClick={() => window.open(`/checkout-editor/${c.id}`, '_blank')}>
            <div className=\"p-6\">
              <div className=\"flex justify-between items-start mb-4\">
                <div className=\"w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300\">
                  <Save className=\"w-6 h-6\" />
                </div>
                <div className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${c.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                  {c.is_active ? 'Ativo' : 'Inativo'}
                </div>
              </div>
              <h3 className=\"text-lg font-bold text-slate-900 mb-1\">{c.name}</h3>
              <p className=\"text-sm text-slate-500 line-clamp-2 mb-4\">{c.item_name} - R$ {Number(c.price).toFixed(2)}</p>
              <div className=\"flex items-center gap-2 pt-4 border-t border-slate-50\">
                <Button variant=\"ghost\" size=\"sm\" className=\"text-xs h-8 px-3 rounded-lg text-slate-600 flex items-center gap-1\">
                  <Pencil className=\"w-3 h-3\" /> Editar
                </Button>
                <Button variant=\"ghost\" size=\"sm\" className=\"text-xs h-8 px-3 rounded-lg text-slate-600 flex items-center gap-1\" onClick={(e) => { e.stopPropagation(); window.open(`/checkout/${c.id}`, '_blank'); }}>
                  <ExternalLink className=\"w-3 h-3\" /> Visualizar
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
