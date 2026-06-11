import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { CreditCard, Loader2, QrCode, Copy, CheckCircle2, AlertCircle, Smartphone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TransparentCheckoutProps {
  checkoutId: string;
  orderId: string;
  amount: number;
  customerName: string;
  customerEmail: string;
  customerCpf: string;
  primaryColor: string;
  itemName: string;
  textColor?: string;
  subtitleColor?: string;
  onSuccess: (data: { accessCode?: string; paymentId: string; isManualPix?: boolean }) => void;
  onError: (error: string) => void;
  mpPublicKey: string;
}

declare global {
  interface Window {
    MercadoPago: any;
  }
}

export const TransparentCheckout = ({
  checkoutId, orderId, amount, customerName, customerEmail, customerCpf,
  primaryColor, itemName, textColor, subtitleColor, onSuccess, onError, mpPublicKey, pixKey, pixWhatsapp,
}: TransparentCheckoutProps & { pixKey?: string, pixWhatsapp?: string }) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("credit_card");
  const [processing, setProcessing] = useState(false);
  const [sdkLoaded, setSdkLoaded] = useState(false);
  const [mp, setMp] = useState<any>(null);

  // Card form state
  const [cardNumber, setCardNumber] = useState("");
  const [cardHolder, setCardHolder] = useState("");
  const [expMonth, setExpMonth] = useState("");
  const [expYear, setExpYear] = useState("");
  const [cvv, setCvv] = useState("");
  const [installments, setInstallments] = useState(1);
  const [availableInstallments, setAvailableInstallments] = useState<any[]>([]);
  const [cardBrand, setCardBrand] = useState("");

  // PIX state
  const [pixQrCode, setPixQrCode] = useState("");
  const [pixQrCodeBase64, setPixQrCodeBase64] = useState("");
  const [pixCopied, setPixCopied] = useState(false);
  const [pixPending, setPixPending] = useState(false);
  const [checkingPixStatus, setCheckingPixStatus] = useState(false);

  // Load MercadoPago SDK
  useEffect(() => {
    if (window.MercadoPago) {
      const mpInstance = new window.MercadoPago(mpPublicKey, { locale: 'pt-BR' });
      setMp(mpInstance);
      setSdkLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://sdk.mercadopago.com/js/v2';
    script.async = true;
    script.onload = () => {
      const mpInstance = new window.MercadoPago(mpPublicKey, { locale: 'pt-BR' });
      setMp(mpInstance);
      setSdkLoaded(true);
    };
    script.onerror = () => onError('Erro ao carregar SDK do Mercado Pago');
    document.body.appendChild(script);
  }, [mpPublicKey]);

  // Get installments when card number changes
  useEffect(() => {
    if (!mp || cardNumber.replace(/\s/g, '').length < 6) return;

    const bin = cardNumber.replace(/\s/g, '').substring(0, 6);
    
    mp.getPaymentMethods({ bin }).then((result: any) => {
      if (result.results?.length > 0) {
        setCardBrand(result.results[0].id);
      }
    }).catch(() => {});

    mp.getInstallments({
      amount: String(amount),
      bin,
    }).then((result: any) => {
      if (result?.length > 0) {
        setAvailableInstallments(result[0].payer_costs || []);
      }
    }).catch(() => {});
  }, [mp, cardNumber, amount]);

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\D/g, '').substring(0, 16);
    return v.replace(/(\d{4})(?=\d)/g, '$1 ');
  };

  const handleCardPayment = async () => {
    if (!mp) return;
    if (!cardNumber || !cardHolder || !expMonth || !expYear || !cvv) {
      toast({ title: "Preencha todos os dados do cartão", variant: "destructive" });
      return;
    }

    setProcessing(true);
    try {
      // Create card token
      const cardData = {
        cardNumber: cardNumber.replace(/\s/g, ''),
        cardholderName: cardHolder,
        cardExpirationMonth: expMonth,
        cardExpirationYear: expYear.length === 2 ? `20${expYear}` : expYear,
        securityCode: cvv,
        identificationType: 'CPF',
        identificationNumber: customerCpf.replace(/\D/g, ''),
      };

      const tokenResult = await mp.createCardToken(cardData);
      if (!tokenResult?.id) throw new Error('Erro ao tokenizar cartão');

      const { data, error } = await supabase.functions.invoke('checkout-transparent-payment', {
        body: {
          checkoutId,
          orderId,
          paymentMethod: 'credit_card',
          token: tokenResult.id,
          installments,
          paymentMethodId: cardBrand,
          amount,
          payerEmail: customerEmail,
          payerName: customerName,
          payerCpf: customerCpf,
        },
      });

      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);

      if (data?.status === 'approved') {
        onSuccess({ accessCode: data.access_code, paymentId: data.payment_id });
      } else if (data?.status === 'in_process' || data?.status === 'pending') {
        toast({ title: "Pagamento em análise", description: "Seu pagamento está sendo processado. Você receberá uma confirmação em breve." });
      } else {
        throw new Error('Pagamento não aprovado. Tente outro cartão.');
      }
    } catch (err: any) {
      console.error('Card payment error:', err);
      onError(err.message || 'Erro ao processar pagamento com cartão');
    } finally {
      setProcessing(false);
    }
  };

  const handlePixPayment = async () => {
    if (pixKey) {
      // Manual PIX flow
      setPixPending(true);
      setPixQrCode(pixKey); // Use the key directly as content for manual flow
      return;
    }

    setProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('checkout-transparent-payment', {
        body: {
          checkoutId,
          orderId,
          paymentMethod: 'pix',
          amount,
          payerEmail: customerEmail,
          payerName: customerName,
          payerCpf: customerCpf,
        },
      });

      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);

      if (data?.pix_qr_code) {
        setPixQrCode(data.pix_qr_code);
        setPixQrCodeBase64(data.pix_qr_code_base64);
        setPixPending(true);
        // Start polling for payment status
        startPixPolling(data.payment_id);
      } else {
        throw new Error('Erro ao gerar QR Code PIX');
      }
    } catch (err: any) {
      console.error('PIX payment error:', err);
      onError(err.message || 'Erro ao gerar PIX');
    } finally {
      setProcessing(false);
    }
  };

  const startPixPolling = useCallback((paymentId: string) => {
    setCheckingPixStatus(true);
    const interval = setInterval(async () => {
      try {
        const { data: order } = await supabase
          .from('checkout_orders')
          .select('status, metadata')
          .eq('id', orderId)
          .single();

        if (order?.status === 'approved') {
          clearInterval(interval);
          setCheckingPixStatus(false);
          const accessCode = (order.metadata as any)?.access_code;
          onSuccess({ accessCode, paymentId });
        }
      } catch (err) {
        console.error('Error checking PIX status:', err);
      }
    }, 5000); // Check every 5 seconds

    // Stop after 30 minutes
    setTimeout(() => {
      clearInterval(interval);
      setCheckingPixStatus(false);
    }, 30 * 60 * 1000);
  }, [orderId, onSuccess]);

  const copyPixCode = () => {
    navigator.clipboard.writeText(pixQrCode);
    setPixCopied(true);
    toast({ title: "Código PIX copiado!" });
    setTimeout(() => setPixCopied(false), 3000);
  };

  if (!sdkLoaded) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        <span className="text-sm text-muted-foreground">Carregando pagamento seguro...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="credit_card" className="flex items-center gap-2">
            <CreditCard className="w-4 h-4" />
            Cartão de Crédito
          </TabsTrigger>
          <TabsTrigger value="pix" className="flex items-center gap-2">
            <QrCode className="w-4 h-4" />
            PIX
          </TabsTrigger>
        </TabsList>

        <TabsContent value="credit_card" className="space-y-4 mt-4">
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Número do Cartão</Label>
              <Input
                placeholder="0000 0000 0000 0000"
                value={cardNumber}
                onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                maxLength={19}
                disabled={processing}
              />
            </div>
            <div>
              <Label className="text-xs">Nome no Cartão</Label>
              <Input
                placeholder="Nome como está no cartão"
                value={cardHolder}
                onChange={(e) => setCardHolder(e.target.value.toUpperCase())}
                disabled={processing}
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs">Mês</Label>
                <Input placeholder="MM" value={expMonth}
                  onChange={(e) => setExpMonth(e.target.value.replace(/\D/g, '').substring(0, 2))}
                  maxLength={2} disabled={processing} />
              </div>
              <div>
                <Label className="text-xs">Ano</Label>
                <Input placeholder="AA" value={expYear}
                  onChange={(e) => setExpYear(e.target.value.replace(/\D/g, '').substring(0, 4))}
                  maxLength={4} disabled={processing} />
              </div>
              <div>
                <Label className="text-xs">CVV</Label>
                <Input placeholder="123" value={cvv} type="password"
                  onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').substring(0, 4))}
                  maxLength={4} disabled={processing} />
              </div>
            </div>

            {availableInstallments.length > 1 && (
              <div>
                <Label className="text-xs">Parcelas</Label>
                <select
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={installments}
                  onChange={(e) => setInstallments(Number(e.target.value))}
                  disabled={processing}
                >
                  {availableInstallments.map((inst: any) => (
                    <option key={inst.installments} value={inst.installments}>
                      {inst.installments}x de R$ {(inst.installment_amount).toFixed(2)}
                      {inst.installments > 1 && inst.installment_rate > 0 ? ` (total: R$ ${inst.total_amount.toFixed(2)})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <Button
              className="w-full h-12 text-base font-semibold"
              style={{ backgroundColor: primaryColor }}
              onClick={handleCardPayment}
              disabled={processing}
            >
              {processing ? (
                <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Processando...</>
              ) : (
                <><CreditCard className="w-5 h-5 mr-2" />Pagar R$ {amount.toFixed(2)}</>
              )}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="pix" className="space-y-4 mt-4">
          {!pixPending ? (
            <div className="text-center space-y-6 py-4">
              <div className="p-6 bg-primary/5 rounded-2xl border-2 border-dashed border-primary/20">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <QrCode className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-semibold text-lg">Pagar com PIX</h3>
                <p className="text-sm text-muted-foreground max-w-[250px] mx-auto mt-2">
                  Liberação imediata! Gere o seu código PIX agora para finalizar.
                </p>
              </div>
              <Button
                className="w-full h-14 text-lg font-bold rounded-xl shadow-lg hover:shadow-xl transition-all"
                style={{ backgroundColor: primaryColor }}
                onClick={handlePixPayment}
                disabled={processing}
              >
                {processing ? (
                  <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Gerando PIX...</>
                ) : (
                  <><QrCode className="w-5 h-5 mr-2" />Gerar QR Code PIX</>
                )}
              </Button>
            </div>

          ) : (
            <div className="text-center space-y-4">
              <div className="p-4 bg-muted/50 rounded-lg space-y-3">
                {pixKey ? (
                  <div className="py-4 space-y-4">
                    <div className="p-4 bg-white rounded-xl border shadow-inner">
                      <p className="text-[10px] uppercase font-bold text-slate-400 mb-2">Chave PIX para Pagamento</p>
                      <p className="text-lg font-black break-all">{pixKey}</p>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Após o pagamento, clique no botão abaixo para finalizar seu pedido e enviar o comprovante.
                    </p>
                  </div>
                ) : pixQrCodeBase64 && (
                  <img
                    src={`data:image/png;base64,${pixQrCodeBase64}`}
                    alt="QR Code PIX"
                    className="w-48 h-48 mx-auto rounded-lg"
                  />
                )}
                {!pixKey && <p className="text-sm font-medium">Escaneie o QR Code ou copie o código PIX</p>}
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={copyPixCode}
                >
                  {pixCopied ? (
                    <><CheckCircle2 className="w-4 h-4 mr-2 text-green-500" />Copiado!</>
                  ) : (
                    <><Copy className="w-4 h-4 mr-2" />Copiar {pixKey ? 'Chave' : 'Código'} PIX</>
                  )}
                </Button>

                {pixKey && (
                  <div className="space-y-3">
                    <Button 
                      className="w-full h-14 font-black bg-green-500 hover:bg-green-600 text-white rounded-xl shadow-lg flex items-center justify-center gap-2" 
                      onClick={() => {
                        const msg = encodeURIComponent(`Olá, realizei o pagamento via PIX manual. Nome: ${customerName}. Valor: R$ ${amount.toFixed(2)}`);
                        window.open(`https://wa.me/${pixWhatsapp}?text=${msg}`, '_blank');
                      }}
                    >
                      <Smartphone className="w-5 h-5" /> Confirmar no WhatsApp
                    </Button>
                    <Button 
                      variant="ghost"
                      className="w-full h-12 font-bold" 
                      onClick={() => onSuccess({ paymentId: 'manual_pix', isManualPix: true })}
                    >
                      Já realizei o pagamento
                    </Button>
                  </div>
                )}
              </div>

              {checkingPixStatus && !pixKey && (
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground animate-pulse">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Aguardando confirmação do pagamento...
                </div>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
