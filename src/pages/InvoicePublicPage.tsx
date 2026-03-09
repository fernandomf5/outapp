import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, Clock, AlertCircle, XCircle, Download, Copy, CreditCard, QrCode } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import jsPDF from "jspdf";
import { QRCodeSVG } from "qrcode.react";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

// Clean PIX key based on type (remove formatting)
const cleanPixKey = (key: string, keyType?: string): string => {
  if (!key) return '';
  const type = (keyType || '').toLowerCase();
  
  if (type === 'cpf' || type === 'cnpj' || type === 'telefone' || type === 'phone') {
    // Remove all non-numeric characters except + for phone
    return key.replace(/[^\d+]/g, '');
  }
  if (type === 'email') {
    return key.toLowerCase().trim();
  }
  // Random key or unknown - return as-is trimmed
  return key.trim();
};

// Generate PIX BRCode (EMV) payload - Banco Central format
const generatePixPayload = (pixKey: string, pixKeyType: string, merchantName: string, city: string, amount: number, txid?: string) => {
  const cleanedKey = cleanPixKey(pixKey, pixKeyType);
  
  const crc16 = (str: string): string => {
    let crc = 0xFFFF;
    for (let i = 0; i < str.length; i++) {
      crc ^= str.charCodeAt(i) << 8;
      for (let j = 0; j < 8; j++) {
        if (crc & 0x8000) {
          crc = (crc << 1) ^ 0x1021;
        } else {
          crc = crc << 1;
        }
        crc &= 0xFFFF;
      }
    }
    return crc.toString(16).toUpperCase().padStart(4, '0');
  };

  const pad = (id: string, val: string): string => {
    return id + val.length.toString().padStart(2, '0') + val;
  };

  // Build Merchant Account Information (field 26)
  const gui = pad('00', 'br.gov.bcb.pix');
  const key = pad('01', cleanedKey);
  const merchantAccountInfo = pad('26', gui + key);

  // Build payload
  let payload = '';
  payload += pad('00', '01'); // Payload Format Indicator
  payload += merchantAccountInfo; // Merchant Account Info
  payload += pad('52', '0000'); // Merchant Category Code
  payload += pad('53', '986'); // Transaction Currency (BRL)
  
  if (amount > 0) {
    payload += pad('54', amount.toFixed(2)); // Transaction Amount
  }
  
  payload += pad('58', 'BR'); // Country Code
  
  // Clean merchant name (max 25 chars, no special chars)
  const cleanName = (merchantName || 'PAGAMENTO')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9 ]/g, '')
    .toUpperCase()
    .substring(0, 25)
    .trim();
  payload += pad('59', cleanName || 'PAGAMENTO');
  
  // Clean city (max 15 chars)
  const cleanCity = (city || 'BRASIL')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9 ]/g, '')
    .toUpperCase()
    .substring(0, 15)
    .trim();
  payload += pad('60', cleanCity || 'BRASIL');
  
  // Additional Data Field (field 62) with txid
  const txidClean = (txid || '***')
    .replace(/[^A-Za-z0-9]/g, '')
    .substring(0, 25);
  payload += pad('62', pad('05', txidClean || '***'));
  
  // Add CRC placeholder and calculate
  payload += '6304';
  const crcValue = crc16(payload);
  
  return payload + crcValue;
};


const statusMap: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  paid: { label: 'Pago', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  overdue: { label: 'Vencida', color: 'bg-red-100 text-red-800', icon: AlertCircle },
  cancelled: { label: 'Cancelada', color: 'bg-gray-100 text-gray-800', icon: XCircle },
  draft: { label: 'Rascunho', color: 'bg-blue-100 text-blue-800', icon: Clock },
};

const paymentMethods: Record<string, string> = {
  pix: 'PIX', mercadopago: 'Mercado Pago', credit_card: 'Cartão de Crédito', debit_card: 'Cartão de Débito',
  bank_transfer: 'Transferência', boleto: 'Boleto', other: 'Outro',
};

export default function InvoicePublicPage() {
  const { token } = useParams<{ token: string }>();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMP, setLoadingMP] = useState(false);

  const paymentStatus = searchParams.get('payment');

  useEffect(() => {
    const fetchInvoice = async () => {
      if (!token) return;
      const { data } = await supabase
        .from('invoices')
        .select('*')
        .eq('public_token', token)
        .maybeSingle();
      if (data) setInvoice(data);
      setLoading(false);
    };
    fetchInvoice();
  }, [token]);

  // Handle payment redirect
  useEffect(() => {
    if (paymentStatus === 'success' && invoice && invoice.status !== 'paid') {
      toast({ title: "Pagamento recebido! ✅", description: "Sua fatura será atualizada em instantes." });
      // Re-fetch after a delay to catch webhook update
      const timer = setTimeout(async () => {
        const { data } = await supabase
          .from('invoices')
          .select('*')
          .eq('public_token', token)
          .maybeSingle();
        if (data) setInvoice(data);
      }, 3000);
      return () => clearTimeout(timer);
    }
    if (paymentStatus === 'failure') {
      toast({ title: "Pagamento não concluído", description: "Tente novamente ou escolha outra forma de pagamento.", variant: "destructive" });
    }
  }, [paymentStatus, invoice?.id]);

  const handleCopyPix = () => {
    if (invoice?.pix_key) {
      navigator.clipboard.writeText(invoice.pix_key);
      toast({ title: "Chave PIX copiada! 📋" });
    }
  };

  const handlePayWithMercadoPago = async () => {
    if (!invoice) return;
    setLoadingMP(true);
    try {
      const { data, error } = await supabase.functions.invoke('invoice-mercadopago-payment', {
        body: { public_token: invoice.public_token },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      if (data?.checkout_url) {
        window.location.href = data.checkout_url;
      }
    } catch (error: any) {
      toast({
        title: "Erro ao gerar pagamento",
        description: error.message || "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoadingMP(false);
    }
  };

  const handleDownloadPDF = () => {
    if (!invoice) return;
    const doc = new jsPDF();
    const color = invoice.primary_color || '#2563eb';
    const cr = parseInt(color.slice(1, 3), 16);
    const cg = parseInt(color.slice(3, 5), 16);
    const cb = parseInt(color.slice(5, 7), 16);

    doc.setFillColor(cr, cg, cb);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22); doc.setFont('helvetica', 'bold');
    doc.text(invoice.invoice_title || 'FATURA', 15, 20);
    doc.setFontSize(11);
    doc.text(`Nº ${invoice.invoice_number}`, 15, 30);
    doc.text(`Venc: ${invoice.due_date?.split('-').reverse().join('/')}`, 150, 20);

    let y = 50;
    doc.setTextColor(0, 0, 0); doc.setFontSize(12); doc.setFont('helvetica', 'bold');
    if (invoice.company_name) { doc.text(invoice.company_name, 15, y); y += 6; }
    doc.setFontSize(9); doc.setFont('helvetica', 'normal');
    if (invoice.company_document) { doc.text(`CNPJ/CPF: ${invoice.company_document}`, 15, y); y += 5; }

    y += 5;
    doc.setFillColor(245, 245, 245); doc.rect(10, y - 4, 190, 20, 'F');
    doc.setFontSize(11); doc.setFont('helvetica', 'bold');
    doc.text('CLIENTE', 15, y + 2); y += 8;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
    if (invoice.client_name) { doc.text(invoice.client_name, 15, y); y += 5; }

    y += 8;
    doc.setFillColor(cr, cg, cb); doc.rect(10, y - 4, 190, 8, 'F');
    doc.setTextColor(255, 255, 255); doc.setFontSize(9); doc.setFont('helvetica', 'bold');
    doc.text('Descrição', 15, y + 1); doc.text('Qtd', 120, y + 1);
    doc.text('Valor', 140, y + 1); doc.text('Sub', 175, y + 1); y += 8;

    doc.setTextColor(0, 0, 0); doc.setFont('helvetica', 'normal');
    const items = (invoice.items as any[]) || [];
    items.forEach((item: any) => {
      doc.text(item.description || '-', 15, y);
      doc.text(String(item.quantity), 120, y);
      doc.text(formatCurrency(item.unit_price), 140, y);
      doc.text(formatCurrency(item.quantity * item.unit_price), 175, y);
      y += 7;
    });

    y += 5;
    doc.setFontSize(12); doc.setFont('helvetica', 'bold');
    doc.text('TOTAL:', 140, y);
    doc.setTextColor(cr, cg, cb);
    doc.text(formatCurrency(invoice.total_amount), 175, y);

    if (invoice.pix_key) {
      y += 15;
      doc.setTextColor(cr, cg, cb); doc.setFontSize(9); doc.setFont('helvetica', 'bold');
      doc.text('CHAVE PIX', 15, y); y += 5;
      doc.setTextColor(0, 0, 0); doc.setFont('helvetica', 'normal');
      doc.text(`${(invoice.pix_key_type || 'cpf').toUpperCase()}: ${invoice.pix_key}`, 15, y);
    }

    doc.save(`fatura-${invoice.invoice_number}.pdf`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="max-w-md p-8 text-center">
          <h2 className="text-xl font-bold mb-2">Fatura não encontrada</h2>
          <p className="text-muted-foreground">O link da fatura é inválido ou expirou.</p>
        </Card>
      </div>
    );
  }

  const st = statusMap[invoice.status] || statusMap.pending;
  const StatusIcon = st.icon;
  const items = (invoice.items as any[]) || [];
  const color = invoice.primary_color || '#2563eb';
  const showMercadoPago = invoice.payment_method === 'mercadopago' && invoice.status !== 'paid' && invoice.status !== 'cancelled';

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Payment status banner */}
        {paymentStatus === 'success' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center mb-4">
            <CheckCircle className="w-6 h-6 text-green-600 mx-auto mb-1" />
            <p className="font-semibold text-green-800">Pagamento processado com sucesso!</p>
            <p className="text-xs text-green-600">A fatura será atualizada automaticamente.</p>
          </div>
        )}
        {paymentStatus === 'pending' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center mb-4">
            <Clock className="w-6 h-6 text-yellow-600 mx-auto mb-1" />
            <p className="font-semibold text-yellow-800">Pagamento pendente</p>
            <p className="text-xs text-yellow-600">Aguardando confirmação do pagamento.</p>
          </div>
        )}

        <Card className="overflow-hidden shadow-lg">
          {/* Header */}
          <div className="p-6 text-white" style={{ backgroundColor: color }}>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">{invoice.invoice_title || 'FATURA'}</h1>
                <p className="text-sm opacity-80 mt-1">Nº {invoice.invoice_number}</p>
              </div>
              <div className="text-right">
                <Badge className={`${st.color} text-xs`}>
                  <StatusIcon className="w-3 h-3 mr-1" /> {st.label}
                </Badge>
                <p className="text-xs opacity-80 mt-2">Venc: {invoice.due_date?.split('-').reverse().join('/')}</p>
              </div>
            </div>
          </div>

          <CardContent className="p-6 space-y-5">
            {/* Company */}
            {invoice.company_name && (
              <div>
                <p className="font-semibold text-lg">{invoice.company_name}</p>
                {invoice.company_document && <p className="text-sm text-muted-foreground">CNPJ/CPF: {invoice.company_document}</p>}
                {invoice.company_address && <p className="text-sm text-muted-foreground">{invoice.company_address}</p>}
                {invoice.company_phone && <p className="text-sm text-muted-foreground">Tel: {invoice.company_phone}</p>}
              </div>
            )}

            {/* Client */}
            <div className="bg-muted/50 p-4 rounded-lg">
              <p className="font-semibold text-sm mb-1" style={{ color }}>CLIENTE</p>
              <p className="font-medium">{invoice.client_name || '—'}</p>
              {invoice.client_document && <p className="text-sm text-muted-foreground">CPF/CNPJ: {invoice.client_document}</p>}
              {invoice.client_email && <p className="text-sm text-muted-foreground">{invoice.client_email}</p>}
              {invoice.client_address && <p className="text-sm text-muted-foreground">{invoice.client_address}</p>}
            </div>

            {/* Items */}
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: color, color: 'white' }}>
                  <th className="text-left p-2 rounded-tl">Descrição</th>
                  <th className="text-center p-2">Qtd</th>
                  <th className="text-right p-2">V. Unit.</th>
                  <th className="text-right p-2 rounded-tr">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item: any, idx: number) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-muted/30' : ''}>
                    <td className="p-2">{item.description || '—'}</td>
                    <td className="text-center p-2">{item.quantity}</td>
                    <td className="text-right p-2">{formatCurrency(item.unit_price)}</td>
                    <td className="text-right p-2 font-medium">{formatCurrency(item.quantity * item.unit_price)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals */}
            <div className="text-right border-t pt-3" style={{ borderColor: color }}>
              {invoice.discount_amount > 0 && (
                <>
                  <p className="text-muted-foreground">Subtotal: {formatCurrency(invoice.subtotal)}</p>
                  <p className="text-destructive">Desconto: − {formatCurrency(invoice.discount_amount)}</p>
                </>
              )}
              <p className="text-2xl font-bold mt-1" style={{ color }}>
                {formatCurrency(invoice.total_amount)}
              </p>
            </div>

            {/* Payment */}
            <p className="text-sm text-muted-foreground">
              Forma de Pagamento: {paymentMethods[invoice.payment_method] || invoice.payment_method}
            </p>

            {/* Mercado Pago Payment Button */}
            {showMercadoPago && (
              <div className="border-2 rounded-lg p-5 text-center space-y-3" style={{ borderColor: color }}>
                <p className="font-bold text-sm" style={{ color }}>💳 Pagar com Mercado Pago</p>
                <p className="text-xs text-muted-foreground">Pague com cartão de crédito, débito, PIX ou boleto de forma segura.</p>
                <Button 
                  onClick={handlePayWithMercadoPago} 
                  disabled={loadingMP}
                  className="w-full"
                  style={{ backgroundColor: color }}
                >
                  {loadingMP ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <CreditCard className="w-4 h-4 mr-2" />
                  )}
                  {loadingMP ? 'Gerando link...' : `Pagar ${formatCurrency(invoice.total_amount)}`}
                </Button>
              </div>
            )}

            {/* PIX Key with QR Code */}
            {invoice.pix_key && invoice.status !== 'paid' && invoice.payment_method === 'pix' && (
              <div className="border-2 rounded-lg p-4 text-center space-y-4" style={{ borderColor: color }}>
                <p className="font-bold text-sm flex items-center justify-center gap-2" style={{ color }}>
                  <QrCode className="w-4 h-4" /> Pagar via PIX
                </p>
                
                {/* QR Code with proper PIX BRCode payload */}
                <div className="bg-white p-4 rounded-lg inline-block mx-auto shadow-sm">
                  <QRCodeSVG 
                    value={generatePixPayload(
                      invoice.pix_key,
                      invoice.company_name || 'PAGAMENTO',
                      'BRASIL',
                      invoice.total_amount || 0,
                      invoice.invoice_number
                    )} 
                    size={180}
                    level="M"
                    includeMargin={true}
                  />
                </div>
                
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Tipo: {(invoice.pix_key_type || 'cpf').toUpperCase()}</p>
                  <p className="font-mono text-sm bg-muted p-2 rounded break-all">{invoice.pix_key}</p>
                </div>
                
                <Button size="sm" variant="outline" onClick={handleCopyPix}>
                  <Copy className="w-4 h-4 mr-1" /> Copiar Chave PIX
                </Button>
              </div>
            )}

            {invoice.status === 'paid' && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <p className="font-bold text-green-800">Fatura Paga</p>
                {invoice.paid_at && <p className="text-xs text-green-600">em {new Date(invoice.paid_at).toLocaleDateString('pt-BR')}</p>}
              </div>
            )}

            {invoice.notes && (
              <p className="text-sm text-muted-foreground italic">Obs: {invoice.notes}</p>
            )}

            <Button variant="outline" className="w-full" onClick={handleDownloadPDF}>
              <Download className="w-4 h-4 mr-2" /> Baixar PDF
            </Button>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-4">
          Fatura gerada digitalmente
        </p>
      </div>
    </div>
  );
}
