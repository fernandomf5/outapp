import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle, Download, MessageSquare, ExternalLink, ShoppingCart, X, ArrowRight } from "lucide-react";
import { Helmet } from "react-helmet-async";

interface CheckoutData {
  id: string;
  name: string;
  primary_color: string;
  thank_you_title: string | null;
  thank_you_message: string | null;
  thank_you_image_url: string | null;
  thank_you_button_text: string | null;
  thank_you_button_url: string | null;
  thank_you_download_url: string | null;
  show_order_details: boolean;
  head_code: string | null;
  footer_code: string | null;
  upsell_title: string | null;
  upsell_description: string | null;
  upsell_price: number | null;
  upsell_image_url: string | null;
  upsell_checkout_url: string | null;
  downsell_title: string | null;
  downsell_description: string | null;
  downsell_price: number | null;
  downsell_image_url: string | null;
  downsell_checkout_url: string | null;
  integration_type: string | null;
  integration_id: string | null;
}

interface OrderData {
  id: string;
  customer_name: string | null;
  customer_email: string | null;
  amount: number;
  status: string;
  additional_items: any;
  metadata: any;
  created_at: string;
}

const CheckoutThankYouPage = () => {
  const { checkoutId } = useParams();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('order');
  const [checkout, setCheckout] = useState<CheckoutData | null>(null);
  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showUpsell, setShowUpsell] = useState(true);
  const [showDownsell, setShowDownsell] = useState(false);
  const [accessCode, setAccessCode] = useState<string | null>(null);
  const [membersAreaSlug, setMembersAreaSlug] = useState<string | null>(null);

  useEffect(() => { loadData(); }, [checkoutId, orderId]);

  const loadData = async () => {
    try {
      if (!checkoutId) return;
      const { data: checkoutData } = await supabase
        .from('checkouts').select('*').eq('id', checkoutId).single();
      if (checkoutData) setCheckout(checkoutData as any);

      if (orderId) {
        const { data: orderData } = await supabase
          .from('checkout_orders').select('*').eq('id', orderId).single();
        if (orderData) {
          setOrder(orderData as any);
          // Check for access code in metadata
          const metadata = (orderData as any).metadata;
          if (metadata?.access_code) {
            setAccessCode(metadata.access_code);
          }
          // Get members area slug for link
          if (metadata?.members_area_id) {
            const { data: areaData } = await supabase
              .from('simple_members_areas' as any)
              .select('slug')
              .eq('id', metadata.members_area_id)
              .single();
            if (areaData) setMembersAreaSlug((areaData as any).slug);
          }
        }
      }
    } catch {}
    finally { setLoading(false); }
  };

  const handleDeclineUpsell = () => {
    setShowUpsell(false);
    if (checkout?.downsell_title) setShowDownsell(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!checkout) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="p-8">
            <ShoppingCart className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold">Página não encontrada</h2>
          </CardContent>
        </Card>
      </div>
    );
  }

  const primaryColor = checkout.primary_color || '#8B5CF6';
  const extras = order?.additional_items as any[] || [];

  return (
    <>
      <Helmet>
        <title>{checkout.thank_you_title || 'Obrigado!'}</title>
        {checkout.head_code && <script>{checkout.head_code}</script>}
      </Helmet>

      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex items-center justify-center p-4">
        <div className="w-full max-w-lg space-y-4">
          {/* Main Thank You Card */}
          <Card className="overflow-hidden shadow-xl">
            <CardContent className="p-8 text-center space-y-6">
              {checkout.thank_you_image_url ? (
                <img src={checkout.thank_you_image_url} alt="Obrigado" className="w-32 h-32 mx-auto rounded-full object-cover" />
              ) : (
                <div className="w-20 h-20 mx-auto rounded-full flex items-center justify-center" style={{ backgroundColor: `${primaryColor}20` }}>
                  <CheckCircle className="w-10 h-10" style={{ color: primaryColor }} />
                </div>
              )}
              
              <div>
                <h1 className="text-2xl font-bold mb-2">{checkout.thank_you_title || 'Obrigado pela sua compra!'}</h1>
                <p className="text-muted-foreground">{checkout.thank_you_message || 'Seu pedido foi realizado com sucesso.'}</p>
              </div>

              {/* Order Details */}
              {checkout.show_order_details && order && (
                <div className="text-left p-4 rounded-lg bg-muted/50 border space-y-2">
                  <h3 className="font-semibold text-sm">📋 Detalhes do Pedido</h3>
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between"><span className="text-muted-foreground">Cliente</span><span>{order.customer_name}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Email</span><span>{order.customer_email}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Status</span>
                      <Badge variant={order.status === 'approved' ? 'default' : 'secondary'}>
                        {order.status === 'approved' ? 'Aprovado' : order.status === 'pending' ? 'Pendente' : order.status}
                      </Badge>
                    </div>
                    {extras.length > 0 && (
                      <div className="border-t pt-2 mt-2">
                        <p className="text-xs text-muted-foreground mb-1">Itens adicionais:</p>
                        {extras.map((ex: any, i: number) => (
                          <div key={i} className="flex justify-between text-xs">
                            <span>{ex.name} {ex.qty > 1 ? `x${ex.qty}` : ''}</span>
                            <span>R$ {(ex.price * ex.qty).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex justify-between font-bold pt-2 border-t">
                      <span>Total</span><span style={{ color: primaryColor }}>R$ {Number(order.amount).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Access Code for Members Area */}
              {accessCode && (
                <div className="p-4 rounded-lg border-2 text-left space-y-2" style={{ borderColor: primaryColor, backgroundColor: `${primaryColor}10` }}>
                  <h3 className="font-semibold text-sm flex items-center gap-2">🔑 Seu Código de Acesso</h3>
                  <div className="flex items-center gap-2">
                    <code className="text-2xl font-bold tracking-widest px-4 py-2 rounded bg-background border flex-1 text-center">{accessCode}</code>
                    <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(accessCode); import('sonner').then(m => m.toast.success('Código copiado!')); }}>
                      Copiar
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">Use este código para acessar o conteúdo exclusivo.</p>
                  {membersAreaSlug && (
                    <Button className="w-full mt-2" variant="outline" style={{ borderColor: primaryColor, color: primaryColor }}
                      onClick={() => window.open(`/members/${membersAreaSlug}`, '_blank')}>
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Acessar Área de Membros
                    </Button>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col gap-3">
                {checkout.thank_you_button_url && (
                  <Button className="w-full" style={{ backgroundColor: primaryColor }}
                    onClick={() => window.open(checkout.thank_you_button_url!, '_blank')}>
                    <MessageSquare className="w-4 h-4 mr-2" />
                    {checkout.thank_you_button_text || 'Falar no WhatsApp'}
                  </Button>
                )}
                {checkout.thank_you_download_url && (
                  <Button variant="outline" className="w-full"
                    onClick={() => window.open(checkout.thank_you_download_url!, '_blank')}>
                    <Download className="w-4 h-4 mr-2" />
                    Baixar Arquivo
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Upsell Offer */}
          {showUpsell && checkout.upsell_title && (
            <Card className="overflow-hidden shadow-xl border-2" style={{ borderColor: primaryColor }}>
              <CardHeader className="text-center pb-2" style={{ backgroundColor: `${primaryColor}10` }}>
                <CardTitle className="text-lg">⚡ {checkout.upsell_title}</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                {checkout.upsell_image_url && (
                  <img src={checkout.upsell_image_url} alt="Upsell" className="w-full h-40 object-cover rounded-lg" />
                )}
                {checkout.upsell_description && (
                  <p className="text-sm text-muted-foreground">{checkout.upsell_description}</p>
                )}
                {checkout.upsell_price && (
                  <p className="text-2xl font-bold text-center" style={{ color: primaryColor }}>
                    R$ {Number(checkout.upsell_price).toFixed(2)}
                  </p>
                )}
                <div className="flex flex-col gap-2">
                  <Button className="w-full" style={{ backgroundColor: primaryColor }}
                    onClick={() => checkout.upsell_checkout_url && (window.location.href = checkout.upsell_checkout_url)}>
                    <ArrowRight className="w-4 h-4 mr-2" />
                    Quero essa oferta!
                  </Button>
                  <Button variant="ghost" className="w-full text-muted-foreground" onClick={handleDeclineUpsell}>
                    Não, obrigado
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Downsell Offer */}
          {showDownsell && checkout.downsell_title && (
            <Card className="overflow-hidden shadow-xl">
              <CardHeader className="text-center pb-2">
                <CardTitle className="text-lg">🎁 {checkout.downsell_title}</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                {checkout.downsell_image_url && (
                  <img src={checkout.downsell_image_url} alt="Downsell" className="w-full h-40 object-cover rounded-lg" />
                )}
                {checkout.downsell_description && (
                  <p className="text-sm text-muted-foreground">{checkout.downsell_description}</p>
                )}
                {checkout.downsell_price && (
                  <p className="text-2xl font-bold text-center" style={{ color: primaryColor }}>
                    R$ {Number(checkout.downsell_price).toFixed(2)}
                  </p>
                )}
                <div className="flex flex-col gap-2">
                  <Button className="w-full" variant="outline"
                    onClick={() => checkout.downsell_checkout_url && (window.location.href = checkout.downsell_checkout_url)}>
                    <ArrowRight className="w-4 h-4 mr-2" />
                    Aceitar oferta
                  </Button>
                  <Button variant="ghost" className="w-full text-muted-foreground" onClick={() => setShowDownsell(false)}>
                    Não, obrigado
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {checkout.footer_code && <div dangerouslySetInnerHTML={{ __html: checkout.footer_code }} />}
    </>
  );
};

export default CheckoutThankYouPage;
