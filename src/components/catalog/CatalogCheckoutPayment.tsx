import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { QRCodeCanvas } from "qrcode.react";
import { generatePixBRCode } from "@/lib/pix";
import {
  QrCode,
  CreditCard,
  Copy,
  CheckCircle2,
  Loader2,
  MessageCircle,
  ArrowLeft,
} from "lucide-react";

export interface CatalogPaymentConfig {
  enable_pix?: boolean;
  pix_key?: string;
  pix_receiver_name?: string;
  pix_city?: string;
  pix_instructions?: string;
  pix_whatsapp?: string;
  enable_mp?: boolean;
  mp_public_key?: string;
}

interface Props {
  orderId: string;
  orderNumber: string;
  amount: number;
  catalogName: string;
  config: CatalogPaymentConfig;
  primaryColor: string;
  textColor: string;
  onBack: () => void;
  onPaid: () => void;
}

export default function CatalogCheckoutPayment({
  orderId,
  orderNumber,
  amount,
  catalogName,
  config,
  primaryColor,
  textColor,
  onBack,
  onPaid,
}: Props) {
  const { toast } = useToast();
  const pixEnabled = !!(config.enable_pix && config.pix_key);
  const mpEnabled = !!config.enable_mp;
  const [method, setMethod] = useState<"pix" | "mp" | null>(
    pixEnabled ? "pix" : mpEnabled ? "mp" : null
  );
  const [loadingMp, setLoadingMp] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [paid, setPaid] = useState(false);
  const [sent, setSent] = useState(false);

  const pixCode = pixEnabled
    ? generatePixBRCode({
        pixKey: config.pix_key as string,
        amount,
        merchantName: config.pix_receiver_name || catalogName,
        merchantCity: config.pix_city || "SAO PAULO",
        txid: orderNumber,
      })
    : "";

  // Poll payment status when paying with Mercado Pago
  useEffect(() => {
    if (method !== "mp" || paid) return;
    const interval = setInterval(async () => {
      const { data } = await supabase.functions.invoke("catalog-payment", {
        body: { action: "status", order_id: orderId },
      });
      if ((data as any)?.payment_status === "paid") {
        setPaid(true);
        onPaid();
      }
    }, 6000);
    return () => clearInterval(interval);
  }, [method, paid, orderId, onPaid]);

  const handleCopy = () => {
    navigator.clipboard.writeText(pixCode);
    toast({ title: "Código PIX copiado!" });
  };

  const handleMercadoPago = async () => {
    setLoadingMp(true);
    try {
      const { data, error } = await supabase.functions.invoke("catalog-payment", {
        body: { action: "mp_checkout", order_id: orderId, origin: window.location.origin },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      window.open((data as any).checkout_url, "_blank");
    } catch (error: any) {
      toast({
        title: "Erro ao iniciar pagamento",
        description: error.message || "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoadingMp(false);
    }
  };

  const handlePixSent = async () => {
    setConfirming(true);
    try {
      await supabase.functions.invoke("catalog-payment", {
        body: { action: "pix_sent", order_id: orderId, pix_payload: pixCode },
      });
      setSent(true);
      toast({
        title: "Pagamento informado!",
        description: "Assim que confirmarmos, seu pedido será liberado.",
      });
      if (config.pix_whatsapp) {
        const msg = encodeURIComponent(
          `Olá! Paguei o pedido #${orderNumber} de ${new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
          }).format(amount)} via PIX. Segue o comprovante.`
        );
        window.open(`https://wa.me/${config.pix_whatsapp}?text=${msg}`, "_blank");
      }
    } finally {
      setConfirming(false);
    }
  };

  if (!method) {
    return (
      <div className="text-center text-sm py-6" style={{ color: `${textColor}90` }}>
        Nenhuma forma de pagamento online configurada.
      </div>
    );
  }

  if (paid) {
    return (
      <div className="text-center py-8 space-y-3">
        <CheckCircle2 className="w-14 h-14 mx-auto text-green-500" />
        <p className="font-bold" style={{ color: textColor }}>
          Pagamento confirmado!
        </p>
        <p className="text-sm" style={{ color: `${textColor}80` }}>
          Pedido #{orderNumber} confirmado com sucesso.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-xs font-medium"
        style={{ color: `${textColor}80` }}
      >
        <ArrowLeft className="w-3 h-3" /> Voltar ao carrinho
      </button>

      <div className="flex items-center justify-between rounded-xl p-3" style={{ backgroundColor: `${textColor}08` }}>
        <div>
          <p className="text-xs" style={{ color: `${textColor}70` }}>
            Pedido #{orderNumber}
          </p>
          <p className="font-bold" style={{ color: textColor }}>
            {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(amount)}
          </p>
        </div>
        <Badge variant="secondary">Aguardando pagamento</Badge>
      </div>

      {pixEnabled && mpEnabled && (
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant={method === "pix" ? "default" : "outline"}
            onClick={() => setMethod("pix")}
            style={method === "pix" ? { backgroundColor: primaryColor } : undefined}
          >
            <QrCode className="w-4 h-4 mr-1" /> PIX
          </Button>
          <Button
            variant={method === "mp" ? "default" : "outline"}
            onClick={() => setMethod("mp")}
            style={method === "mp" ? { backgroundColor: primaryColor } : undefined}
          >
            <CreditCard className="w-4 h-4 mr-1" /> Cartão / MP
          </Button>
        </div>
      )}

      {method === "pix" && (
        <div className="space-y-3">
          <div className="bg-white p-4 rounded-xl flex justify-center">
            <QRCodeCanvas value={pixCode} size={190} />
          </div>
          <div className="rounded-lg p-3 text-[11px] font-mono break-all" style={{ backgroundColor: `${textColor}08`, color: textColor }}>
            {pixCode}
          </div>
          <Button variant="outline" className="w-full" onClick={handleCopy}>
            <Copy className="w-4 h-4 mr-2" /> Copiar código PIX
          </Button>
          {config.pix_instructions && (
            <p className="text-xs text-center" style={{ color: `${textColor}80` }}>
              {config.pix_instructions}
            </p>
          )}
          <Button
            className="w-full text-white"
            style={{ backgroundColor: primaryColor }}
            onClick={handlePixSent}
            disabled={confirming || sent}
          >
            {confirming ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : sent ? (
              <CheckCircle2 className="w-4 h-4 mr-2" />
            ) : (
              <MessageCircle className="w-4 h-4 mr-2" />
            )}
            {sent ? "Pagamento informado" : "Já paguei / enviar comprovante"}
          </Button>
        </div>
      )}

      {method === "mp" && (
        <div className="space-y-3">
          <p className="text-sm text-center" style={{ color: `${textColor}80` }}>
            Pague com cartão, boleto ou PIX automático pelo Mercado Pago. A confirmação é automática.
          </p>
          <Button
            className="w-full text-white"
            style={{ backgroundColor: primaryColor }}
            onClick={handleMercadoPago}
            disabled={loadingMp}
          >
            {loadingMp ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <CreditCard className="w-4 h-4 mr-2" />
            )}
            Pagar com Mercado Pago
          </Button>
          <p className="text-[11px] text-center" style={{ color: `${textColor}60` }}>
            Esta janela atualiza sozinha assim que o pagamento for confirmado.
          </p>
        </div>
      )}
    </div>
  );
}
