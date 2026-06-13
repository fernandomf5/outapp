import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Copy, Eye, Save, ArrowLeft, Loader2 } from "lucide-react";
import { CheckoutPreview } from "@/components/checkout/CheckoutPreview";
import { CheckoutFormFields } from "@/components/checkout/CheckoutFormFields";
import { useParams, useNavigate } from "react-router-dom";

const CheckoutEditorPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [selectedCheckout, setSelectedCheckout] = useState<any | null>(null);
  const [formTab, setFormTab] = useState('general');
  const [viewport, setViewport] = useState('desktop');

  const [formData, setFormData] = useState<any>({
    name: '', description: '', slug: '', item_name: '', item_description: '',
    item_image_url: '', price: '0', primary_color: '#16A34A', banner_url: '',
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

  useEffect(() => {
    const fetchCheckout = async () => {
      if (!id || id === 'new') {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('checkouts')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        toast.error('Erro ao carregar checkout');
        navigate('/dashboard?tab=checkout-creator');
        return;
      }

      if (data) {
        setSelectedCheckout(data);
        const settings = data.custom_settings && typeof data.custom_settings === 'object' ? data.custom_settings : {};
        setFormData({
          ...data,
          price: String(data.price),
          upsell_price: data.upsell_price ? String(data.upsell_price) : '',
          downsell_price: data.downsell_price ? String(data.downsell_price) : '',
          custom_settings: {
            ...formData.custom_settings,
            ...settings
          }
        });
      }
      setLoading(false);
    };

    fetchCheckout();
  }, [id, navigate]);

  const ALLOWED_COLUMNS = new Set([
    'name','description','slug','item_name','item_description','item_image_url','price',
    'primary_color','background_color','text_color','footer_color','footer_text','logo_url',
    'banner_url','success_message','redirect_url','mp_access_token','mp_public_key',
    'thank_you_title','thank_you_message','thank_you_image_url','thank_you_button_text',
    'thank_you_button_url','thank_you_download_url','show_order_details','show_fake_feedback',
    'fake_feedbacks','head_code','footer_code','upsell_title','upsell_description','upsell_price',
    'upsell_image_url','upsell_checkout_url','upsell_product_id','downsell_title',
    'downsell_description','downsell_price','downsell_image_url','downsell_checkout_url',
    'downsell_product_id','integration_type','integration_id','product_type','is_active',
    'custom_settings'
  ]);

  const preparePayload = () => {
    const payload: any = {};
    const extraSettings: any = {};
    for (const [key, value] of Object.entries(formData)) {
      if (key === 'id' || key === 'user_id' || key === 'created_at' || key === 'updated_at' || key === 'total_sales' || key === 'total_revenue') continue;
      if (ALLOWED_COLUMNS.has(key)) {
        payload[key] = value;
      } else if (key !== 'custom_settings') {
        extraSettings[key] = value;
      }
    }
    payload.custom_settings = {
      ...(formData.custom_settings || {}),
      ...extraSettings,
    };
    payload.price = parseFloat(formData.price) || 0;
    payload.upsell_price = formData.upsell_price ? parseFloat(formData.upsell_price) : null;
    payload.downsell_price = formData.downsell_price ? parseFloat(formData.downsell_price) : null;
    if (payload.integration_id === '') payload.integration_id = null;
    return payload;
  };

  const handleSave = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const payload = preparePayload();

    if (id === 'new') {
      const { data, error } = await supabase
        .from('checkouts')
        .insert({ user_id: user.id, ...payload })
        .select()
        .single();

      if (error) {
        toast.error('Erro ao criar: ' + error.message);
      } else {
        toast.success('Checkout criado com sucesso!');
        navigate(`/checkout-editor/${data.id}`, { replace: true });
      }
    } else {
      const { error } = await supabase
        .from('checkouts')
        .update(payload)
        .eq('id', id);

      if (error) {
        toast.error('Erro ao atualizar: ' + error.message);
      } else {
        toast.success('Alterações salvas!');
      }
    }
  };

  const currentSettings = formData.custom_settings && typeof formData.custom_settings === 'object' ? formData.custom_settings : {};

  return (
    <div className="flex h-screen overflow-hidden bg-slate-900">
      <div className="w-[450px] border-r border-slate-800 bg-white flex flex-col h-full shadow-2xl z-20 text-slate-900">
        <div className="p-4 border-b border-slate-100 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard?tab=checkout-creator')} className="rounded-xl hover:bg-slate-100">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </Button>
          <div className="flex-1">
            <h2 className="font-bold text-slate-900">Editor de Checkout</h2>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Personalização Profissional</p>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          <CheckoutFormFields formData={formData} setFormData={setFormData} formTab={formTab} setFormTab={setFormTab} device={viewport} />
        </div>
      </div>
      
      <div className="flex-1 bg-[#0F172A] relative flex flex-col overflow-hidden">
        <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/5 backdrop-blur-md">
           <div className="flex items-center gap-3">
             <div className="px-3 py-1 rounded-full bg-white/10 text-white text-[10px] font-bold uppercase tracking-wider">
               Preview em Tempo Real
             </div>
             <span className="text-white/40 text-sm">|</span>
             <span className="text-white/60 text-xs">{formData.name || 'Sem nome'}</span>
           </div>
           
           <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => {
                  if (!id || id === 'new') {
                    toast.error('Por favor, salve seu checkout primeiro para copiar o link.');
                    return;
                  }
                  const url = `${window.location.origin}/checkout/${id}`;
                  navigator.clipboard.writeText(url);
                  toast.success('Link do checkout copiado!');
                }}
                className="text-white/60 hover:text-white hover:bg-white/10 gap-2"
              >
                <Copy className="w-4 h-4" /> Copiar Link
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => {
                  if (!id || id === 'new') {
                    toast.error('Por favor, salve seu checkout primeiro para visualizar a página final.');
                    return;
                  }
                  window.open(`/checkout/${id}`, '_blank');
                }} 
                className="text-white/60 hover:text-white hover:bg-white/10 gap-2"
              >
                <Eye className="w-4 h-4" /> Visualizar
              </Button>
              <Button onClick={handleSave} className="bg-green-600 hover:bg-green-500 text-white gap-2 shadow-xl shadow-green-900/20">
                <Save className="w-4 h-4" /> {id === 'new' ? 'Publicar Checkout' : 'Salvar Alterações'}
              </Button>
           </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 flex flex-col items-center scrollbar-hide">
           <div className="w-full flex justify-center gap-4 mb-6">
              <Button variant="outline" size="sm" onClick={() => setViewport('desktop')} className={viewport === 'desktop' ? 'bg-green-600 text-white border-green-600' : 'text-white/70 border-white/20 hover:text-white hover:bg-white/10'}>Desktop</Button>
              <Button variant="outline" size="sm" onClick={() => setViewport('tablet')} className={viewport === 'tablet' ? 'bg-green-600 text-white border-green-600' : 'text-white/70 border-white/20 hover:text-white hover:bg-white/10'}>Tablet</Button>
              <Button variant="outline" size="sm" onClick={() => setViewport('mobile')} className={viewport === 'mobile' ? 'bg-green-600 text-white border-green-600' : 'text-white/70 border-white/20 hover:text-white hover:bg-white/10'}>Mobile</Button>
           </div>
           <div className={`transition-all duration-500 origin-top ${viewport === 'mobile' ? 'w-[375px]' : viewport === 'tablet' ? 'w-[768px]' : 'w-full max-w-4xl'}`}>
              <CheckoutPreview checkout={{...formData, ...currentSettings}} activeTab={formTab} onTabChange={setFormTab} device={viewport as any} />
           </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutEditorPage;