import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { CreditCard, Loader2, QrCode, Copy, CheckCircle2, Lock, ShieldCheck, Smartphone } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import { useToast } from "@/hooks/use-toast";
import { generatePixBRCode } from "@/lib/pix";

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
  fieldColor?: string;
  fieldTextColor?: string;
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
  primaryColor, itemName, textColor, subtitleColor, fieldColor, fieldTextColor, onSuccess, onError, mpPublicKey, pixKey, pixWhatsapp,
  enableMp = true, enablePixManual,
}: TransparentCheckoutProps & { pixKey?: string, pixWhatsapp?: string, enableMp?: boolean, enablePixManual?: boolean }) => {
  const { toast } = useToast();
  const mpReady = enableMp && !!mpPublicKey;
  const showCard = mpReady;
  const showMpPix = mpReady;
  const showManualPix = enablePixManual ?? !!pixKey;
  const tabCount = [showCard, showMpPix, showManualPix].filter(Boolean).length;
  const [activeTab, setActiveTab] = useState<string>(showCard ? "credit_card" : showMpPix ? "pix" : "pix_manual");
  const [processing, setProcessing] = useState(false);
  const [sdkLoaded, setSdkLoaded] = useState(!enableMp || !mpPublicKey);
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
    if (!enableMp || !mpPublicKey) { setSdkLoaded(true); return; }
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
  }, [mpPublicKey, enableMp]);

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

  const handleManualPixPayment = () => {
    if (!pixKey?.trim()) return;
    const brcode = generatePixBRCode({
      pixKey: pixKey.trim(),
      amount: Number(amount.toFixed(2)),
      merchantName: "PAGAMENTO PIX",
      merchantCity: "BRASIL",
      description: itemName,
      txid: "***",
    });
    setPixPending(true);
    setPixQrCode(brcode);
    setPixQrCodeBase64("");
  };

  const handlePixPayment = async () => {
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
        const { data: rows } = await supabase
          .rpc('get_checkout_order_status', { _order_id: orderId });
        const order = Array.isArray(rows) ? rows[0] : rows;

        if (order?.status === 'approved') {
          clearInterval(interval);
          setCheckingPixStatus(false);
          const accessCode = order.access_code || undefined;
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

  const copyPixCode = async () => {
    const code = pixQrCode || pixKey || "";
    if (!code) {
      toast({ title: "Gere o QR Code PIX primeiro", variant: "destructive" });
      return;
    }
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = code;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
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
    <div className="space-y-5 rounded-2xl border border-border/70 bg-card/80 p-4 shadow-xl sm:p-5">
      <div className="flex flex-col gap-3 rounded-xl border border-primary/15 bg-primary/5 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-bold" style={{ color: textColor }}>Checkout transparente e seguro</p>
            <p className="mt-0.5 text-xs leading-relaxed" style={{ color: subtitleColor }}>
              Cartão e PIX são processados pelo Mercado Pago sem tirar o cliente desta página.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-border/70 bg-background/80 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide" style={{ color: subtitleColor }}>
          <Lock className="h-3.5 w-3.5 text-primary" />
          Dados protegidos
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => {
        setActiveTab(v);
        setPixPending(false);
        setPixQrCode("");
        setPixQrCodeBase64("");
      }}>

        <TabsList className={`grid h-auto w-full gap-2 rounded-xl bg-muted/60 p-1.5 ${tabCount === 3 ? 'grid-cols-3' : tabCount === 2 ? 'grid-cols-2' : 'grid-cols-1'}`}>
          {showCard && (
            <TabsTrigger value="credit_card" className="h-11 rounded-lg text-xs font-bold sm:text-sm data-[state=active]:shadow-sm" style={{
              color: activeTab === 'credit_card' ? primaryColor : textColor,
              backgroundColor: activeTab === 'credit_card' ? `${primaryColor}12` : 'transparent',
              border: activeTab === 'credit_card' ? `1px solid ${primaryColor}35` : '1px solid transparent'
            }}>
              <CreditCard className="w-4 h-4" />
              Cartão
            </TabsTrigger>
          )}
          {showMpPix && (
            <TabsTrigger value="pix" className="h-11 rounded-lg text-xs font-bold sm:text-sm data-[state=active]:shadow-sm" style={{
              color: activeTab === 'pix' ? primaryColor : textColor,
              backgroundColor: activeTab === 'pix' ? `${primaryColor}12` : 'transparent',
              border: activeTab === 'pix' ? `1px solid ${primaryColor}35` : '1px solid transparent'
            }}>
              <QrCode className="w-4 h-4" />
              PIX
            </TabsTrigger>
          )}
          {showManualPix && (
            <TabsTrigger value="pix_manual" className="h-11 rounded-lg text-xs font-bold sm:text-sm data-[state=active]:shadow-sm" style={{
              color: activeTab === 'pix_manual' ? primaryColor : textColor,
              backgroundColor: activeTab === 'pix_manual' ? `${primaryColor}12` : 'transparent',
              border: activeTab === 'pix_manual' ? `1px solid ${primaryColor}35` : '1px solid transparent'
            }}>
              <QrCode className="w-4 h-4" />
              PIX Manual
            </TabsTrigger>
          )}
        </TabsList>



        <TabsContent value="credit_card" className="space-y-4 mt-4">
          <div className="space-y-4 rounded-2xl border border-border/70 bg-background/70 p-4">
            <div>
              <Label className="text-xs font-bold uppercase tracking-wide" style={{ color: subtitleColor }}>Número do Cartão</Label>
              <Input
                placeholder="0000 0000 0000 0000"
                value={cardNumber}
                onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                maxLength={19}
                 disabled={processing}
                className="mt-1 h-12 rounded-xl border-border/70 text-base shadow-sm"
                style={{ color: fieldTextColor || '#0f172a', backgroundColor: fieldColor || '#ffffff', opacity: 1 }}
              />
            </div>
            <div>
              <Label className="text-xs font-bold uppercase tracking-wide" style={{ color: subtitleColor }}>Nome no Cartão</Label>
              <Input
                placeholder="Nome como está no cartão"
                value={cardHolder}
                onChange={(e) => setCardHolder(e.target.value.toUpperCase())}
                 disabled={processing}
                className="mt-1 h-12 rounded-xl border-border/70 shadow-sm"
                style={{ color: fieldTextColor || '#0f172a', backgroundColor: fieldColor || '#ffffff', opacity: 1 }}
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs font-bold uppercase tracking-wide" style={{ color: subtitleColor }}>Mês</Label>
                <Input placeholder="MM" value={expMonth}
                  onChange={(e) => setExpMonth(e.target.value.replace(/\D/g, '').substring(0, 2))}
                  maxLength={2} disabled={processing} 
                  className="mt-1 h-12 rounded-xl bg-white text-slate-900 border-slate-200 focus:ring-primary focus:border-primary"
                  style={{ color: fieldTextColor || '#0f172a', backgroundColor: fieldColor || '#ffffff', opacity: 1 }} />
              </div>
              <div>
                <Label className="text-xs font-bold uppercase tracking-wide" style={{ color: subtitleColor }}>Ano</Label>
                <Input placeholder="AA" value={expYear}
                  onChange={(e) => setExpYear(e.target.value.replace(/\D/g, '').substring(0, 4))}
                  maxLength={4} disabled={processing} 
                  className="mt-1 h-12 rounded-xl bg-white text-slate-900 border-slate-200 focus:ring-primary focus:border-primary"
                  style={{ color: fieldTextColor || '#0f172a', backgroundColor: fieldColor || '#ffffff', opacity: 1 }} />
              </div>
              <div>
                <Label className="text-xs font-bold uppercase tracking-wide" style={{ color: subtitleColor }}>CVV</Label>
                <Input placeholder="123" value={cvv} type="password"
                  onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').substring(0, 4))}
                  maxLength={4} disabled={processing} 
                  className="mt-1 h-12 rounded-xl bg-white text-slate-900 border-slate-200 focus:ring-primary focus:border-primary"
                  style={{ color: fieldTextColor || '#0f172a', backgroundColor: fieldColor || '#ffffff', opacity: 1 }} />
              </div>
            </div>

            {availableInstallments.length > 0 && (
              <div>
                <Label className="text-xs font-bold uppercase tracking-wide" style={{ color: subtitleColor }}>Parcelas</Label>
                <select
                  className="mt-1 h-12 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm shadow-sm"
                  style={{ color: fieldTextColor || textColor, backgroundColor: fieldColor || '#ffffff' }}
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

            <div className="grid grid-cols-1 gap-2 rounded-xl border border-border/70 bg-muted/40 p-3 text-[11px] font-medium sm:grid-cols-3" style={{ color: subtitleColor }}>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-primary" /> Pagamento na página</span>
              <span className="flex items-center gap-1.5"><Lock className="h-3.5 w-3.5 text-primary" /> Cartão tokenizado</span>
              <span className="flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-primary" /> Mercado Pago</span>
            </div>

            <Button
              className="w-full h-12 text-base font-semibold"
              style={{ 
                backgroundColor: primaryColor, 
                color: (textColor && textColor !== '#0f172a' && textColor !== '#000000') ? textColor : '#ffffff'
              }}
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
                <div className="p-6 bg-primary/5 rounded-2xl border-2 border-dashed border-primary/20 shadow-sm">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <QrCode className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-semibold text-lg" style={{ color: textColor }}>Pagar com PIX</h3>
                <p className="text-sm max-w-[250px] mx-auto mt-2" style={{ color: subtitleColor }}>
                  Liberação imediata! Gere o seu código PIX agora para finalizar.
                </p>
              </div>
              <Button
                className="w-full h-14 text-lg font-bold rounded-xl shadow-lg hover:shadow-xl transition-all"
                style={{ 
                  backgroundColor: primaryColor, 
                  color: (textColor && textColor !== '#0f172a' && textColor !== '#000000') ? textColor : '#ffffff'
                }}
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
              <div className="p-4 rounded-2xl border border-border/70 space-y-3" style={{ backgroundColor: 'rgba(0,0,0,0.03)' }}>
                {pixQrCodeBase64 ? (
                  <div className="flex justify-center">
                    <div className="p-4 bg-white rounded-2xl shadow-lg border-2" style={{ borderColor: `${primaryColor}30` }}>
                      <img src={`data:image/png;base64,${pixQrCodeBase64}`} alt="QR Code PIX" className="w-56 h-56 mx-auto" />
                    </div>
                  </div>
                ) : pixQrCode && (
                  <div className="flex justify-center">
                    <div className="p-4 bg-white rounded-2xl shadow-lg border-2" style={{ borderColor: `${primaryColor}30` }}>
                      <QRCodeCanvas value={pixQrCode} size={236} level="H" includeMargin bgColor="#ffffff" fgColor="#000000" />
                    </div>
                  </div>
                )}
                <p className="text-sm font-medium" style={{ color: textColor }}>Escaneie o QR Code ou copie o código PIX</p>
                <Button
                  className="w-full h-12 font-bold rounded-xl shadow-md"
                  onClick={copyPixCode}
                  style={{ backgroundColor: primaryColor, color: (textColor && textColor !== '#0f172a' && textColor !== '#000000') ? textColor : '#ffffff', borderColor: primaryColor }}
                >
                  {pixCopied ? (
                    <><CheckCircle2 className="w-4 h-4 mr-2" />Copiado!</>
                  ) : (
                    <><Copy className="w-4 h-4 mr-2" />Copiar Código PIX</>
                  )}
                </Button>
              </div>

              {checkingPixStatus && (
                <div className="flex items-center justify-center gap-2 text-sm animate-pulse" style={{ color: subtitleColor }}>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Aguardando confirmação do pagamento...
                </div>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="pix_manual" className="space-y-4 mt-4">
          {!pixPending ? (
            <div className="text-center space-y-6 py-4">
                <div className="p-6 bg-primary/5 rounded-2xl border-2 border-dashed border-primary/20 shadow-sm">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <QrCode className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-semibold text-lg" style={{ color: textColor }}>PIX Manual</h3>
                <p className="text-sm max-w-[260px] mx-auto mt-2" style={{ color: subtitleColor }}>
                  Gere o código PIX, pague e envie o comprovante para liberar seu acesso.
                </p>
              </div>
                <Button
                className="w-full h-14 text-lg font-bold rounded-xl shadow-lg hover:shadow-xl transition-all"
                style={{ 
                  backgroundColor: primaryColor, 
                  color: (textColor && textColor !== '#0f172a' && textColor !== '#000000') ? textColor : '#ffffff'
                }}
                onClick={handleManualPixPayment}
              >
                <QrCode className="w-5 h-5 mr-2" />Gerar QR Code PIX
              </Button>
            </div>
          ) : (
            <div className="text-center space-y-4">
              <div className="p-4 rounded-2xl border border-border/70 space-y-3" style={{ backgroundColor: 'rgba(0,0,0,0.03)' }}>
                <div className="py-4 space-y-4">
                  <div className="flex justify-center mb-4">
                    <div className="p-4 bg-white rounded-2xl shadow-lg border-2" style={{ borderColor: `${primaryColor}30` }}>
                      <QRCodeCanvas value={pixQrCode || pixKey || ''} size={236} level="H" includeMargin bgColor="#ffffff" fgColor="#000000" />
                    </div>
                  </div>
                  <div className="p-4 bg-white rounded-xl border shadow-inner">
                    <p className="text-[10px] uppercase font-bold text-slate-400 mb-2">PIX Copia e Cola</p>
                    <p className="text-xs font-mono break-all text-slate-700 leading-relaxed">{pixQrCode || pixKey}</p>
                  </div>
                  <p className="text-xs leading-relaxed" style={{ color: subtitleColor }}>
                    Escaneie o QR Code no app do seu banco ou use o código copia e cola. Após pagar, clique no botão abaixo para enviar o comprovante.
                  </p>
                </div>
                <Button
                  className="w-full h-12 font-bold rounded-xl shadow-md"
                  onClick={copyPixCode}
                  style={{ backgroundColor: primaryColor, color: (textColor && textColor !== '#0f172a' && textColor !== '#000000') ? textColor : '#ffffff', borderColor: primaryColor }}
                >
                  {pixCopied ? (
                    <><CheckCircle2 className="w-4 h-4 mr-2" />Copiado!</>
                  ) : (
                    <><Copy className="w-4 h-4 mr-2" />Copiar Código PIX</>
                  )}
                </Button>
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
                    style={{ color: subtitleColor }}
                  >
                    Já realizei o pagamento
                  </Button>
                </div>
              </div>
            </div>
          )}
        </TabsContent>

      </Tabs>
    </div>
  );
};
