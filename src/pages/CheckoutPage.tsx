import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { CreditCard, Check, Loader2, ShoppingCart, Shield } from "lucide-react";

interface CheckoutData {
  id: string;
  name: string;
  description: string | null;
  slug: string;
  item_name: string;
  item_description: string | null;
  item_image_url: string | null;
  price: number;
  primary_color: string;
  banner_url: string | null;
  success_message: string;
  redirect_url: string | null;
  mp_access_token: string | null;
  user_id: string;
}

const CheckoutPage = () => {
  const { checkoutId } = useParams();
  const [checkout, setCheckout] = useState<CheckoutData | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [customerData, setCustomerData] = useState({
    name: '',
    email: '',
    phone: '',
    cpf: '',
  });

  useEffect(() => {
    loadCheckout();
  }, [checkoutId]);

  const loadCheckout = async () => {
    try {
      if (!checkoutId) {
        setError('Checkout não encontrado');
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('checkouts')
        .select('*')
        .eq('id', checkoutId)
        .eq('is_active', true)
        .single();

      if (fetchError || !data) {
        setError('Checkout não encontrado ou inativo');
        return;
      }

      setCheckout(data as any);
    } catch (err) {
      setError('Erro ao carregar checkout');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!checkout) return;
    if (!customerData.name.trim() || !customerData.email.trim()) {
      alert('Preencha nome e email para continuar');
      return;
    }

    setProcessing(true);

    try {
      // Create the order first
      const { data: order, error: orderError } = await supabase
        .from('checkout_orders')
        .insert({
          checkout_id: checkout.id,
          user_id: checkout.user_id,
          customer_name: customerData.name,
          customer_email: customerData.email,
          customer_phone: customerData.phone || null,
          customer_cpf: customerData.cpf || null,
          amount: checkout.price,
          status: 'pending',
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Call edge function to create MercadoPago preference
      const { data, error: fnError } = await supabase.functions.invoke('checkout-payment', {
        body: {
          checkoutId: checkout.id,
          orderId: order.id,
          customerName: customerData.name,
          customerEmail: customerData.email,
          amount: checkout.price,
        },
      });

      if (fnError) throw fnError;

      if (data?.init_point) {
        window.location.href = data.init_point;
      } else {
        throw new Error('Erro ao processar pagamento');
      }
    } catch (err: any) {
      console.error('Erro no pagamento:', err);
      alert(err.message || 'Erro ao processar pagamento');
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !checkout) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="p-8">
            <ShoppingCart className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">Checkout Indisponível</h2>
            <p className="text-muted-foreground">{error || 'Este checkout não está disponível.'}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const primaryColor = checkout.primary_color || '#8B5CF6';

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg overflow-hidden shadow-xl">
        {/* Banner */}
        {checkout.banner_url && (
          <div className="w-full h-48 overflow-hidden">
            <img src={checkout.banner_url} alt="Banner" className="w-full h-full object-cover" />
          </div>
        )}

        <CardHeader className="text-center" style={{ borderBottom: `3px solid ${primaryColor}` }}>
          <CardTitle className="text-2xl">{checkout.name}</CardTitle>
          {checkout.description && (
            <p className="text-sm text-muted-foreground mt-1">{checkout.description}</p>
          )}
        </CardHeader>

        <CardContent className="space-y-6 p-6">
          {/* Product Info */}
          <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/50 border">
            {checkout.item_image_url && (
              <img
                src={checkout.item_image_url}
                alt={checkout.item_name}
                className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
              />
            )}
            <div className="flex-1">
              <h3 className="font-semibold">{checkout.item_name}</h3>
              {checkout.item_description && (
                <p className="text-sm text-muted-foreground mt-1">{checkout.item_description}</p>
              )}
              <p className="text-2xl font-bold mt-2" style={{ color: primaryColor }}>
                R$ {Number(checkout.price).toFixed(2)}
              </p>
            </div>
          </div>

          {/* Customer Form */}
          <div className="space-y-4">
            <div>
              <Label>Nome Completo *</Label>
              <Input
                value={customerData.name}
                onChange={(e) => setCustomerData({ ...customerData, name: e.target.value })}
                placeholder="Seu nome completo"
              />
            </div>
            <div>
              <Label>Email *</Label>
              <Input
                type="email"
                value={customerData.email}
                onChange={(e) => setCustomerData({ ...customerData, email: e.target.value })}
                placeholder="seu@email.com"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Telefone</Label>
                <Input
                  value={customerData.phone}
                  onChange={(e) => setCustomerData({ ...customerData, phone: e.target.value })}
                  placeholder="(00) 00000-0000"
                />
              </div>
              <div>
                <Label>CPF</Label>
                <Input
                  value={customerData.cpf}
                  onChange={(e) => setCustomerData({ ...customerData, cpf: e.target.value })}
                  placeholder="000.000.000-00"
                />
              </div>
            </div>
          </div>

          {/* Pay Button */}
          <Button
            className="w-full h-12 text-lg font-semibold"
            style={{ backgroundColor: primaryColor }}
            onClick={handlePayment}
            disabled={processing}
          >
            {processing ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Processando...
              </>
            ) : (
              <>
                <CreditCard className="w-5 h-5 mr-2" />
                Pagar R$ {Number(checkout.price).toFixed(2)}
              </>
            )}
          </Button>

          {/* Security */}
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Shield className="w-4 h-4" />
            <span>Pagamento 100% seguro via Mercado Pago</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CheckoutPage;
