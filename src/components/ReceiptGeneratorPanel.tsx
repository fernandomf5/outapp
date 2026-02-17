import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Receipt, Send, Download, MessageCircle, Mail, Plus, Trash2, Eye, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import jsPDF from "jspdf";

interface ReceiptItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
}

interface ReceiptData {
  receipt_number: string;
  date: string;
  client_name: string;
  client_document: string;
  client_address: string;
  client_email: string;
  client_phone: string;
  items: ReceiptItem[];
  payment_method: string;
  notes: string;
  company_name: string;
  company_document: string;
  company_address: string;
  company_phone: string;
  primary_color: string;
  logo_url: string;
}

const defaultReceipt: ReceiptData = {
  receipt_number: `REC-${Date.now().toString().slice(-6)}`,
  date: new Date().toISOString().split('T')[0],
  client_name: '',
  client_document: '',
  client_address: '',
  client_email: '',
  client_phone: '',
  items: [{ id: crypto.randomUUID(), description: '', quantity: 1, unit_price: 0 }],
  payment_method: 'pix',
  notes: '',
  company_name: '',
  company_document: '',
  company_address: '',
  company_phone: '',
  primary_color: '#2563eb',
  logo_url: '',
};

export function ReceiptGeneratorPanel() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [receipt, setReceipt] = useState<ReceiptData>({ ...defaultReceipt });
  const [previewOpen, setPreviewOpen] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');

  const updateField = (field: keyof ReceiptData, value: any) => {
    setReceipt(prev => ({ ...prev, [field]: value }));
  };

  const addItem = () => {
    setReceipt(prev => ({
      ...prev,
      items: [...prev.items, { id: crypto.randomUUID(), description: '', quantity: 1, unit_price: 0 }]
    }));
  };

  const updateItem = (id: string, data: Partial<ReceiptItem>) => {
    setReceipt(prev => ({
      ...prev,
      items: prev.items.map(item => item.id === id ? { ...item, ...data } : item)
    }));
  };

  const removeItem = (id: string) => {
    if (receipt.items.length <= 1) return;
    setReceipt(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== id)
    }));
  };

  const total = receipt.items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const paymentMethods: Record<string, string> = {
    pix: 'PIX',
    cash: 'Dinheiro',
    credit_card: 'Cartão de Crédito',
    debit_card: 'Cartão de Débito',
    bank_transfer: 'Transferência Bancária',
    boleto: 'Boleto',
    other: 'Outro',
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setLogoPreview(dataUrl);
      updateField('logo_url', dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const generatePDF = (): jsPDF => {
    const doc = new jsPDF();
    const color = receipt.primary_color;
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);

    // Header
    doc.setFillColor(r, g, b);
    doc.rect(0, 0, 210, 40, 'F');

    if (logoPreview) {
      try { doc.addImage(logoPreview, 'PNG', 10, 5, 30, 30); } catch {}
    }

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('RECIBO', logoPreview ? 50 : 15, 20);
    doc.setFontSize(11);
    doc.text(`Nº ${receipt.receipt_number}`, logoPreview ? 50 : 15, 30);
    doc.text(`Data: ${new Date(receipt.date).toLocaleDateString('pt-BR')}`, 150, 20);

    // Company info
    let y = 50;
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    if (receipt.company_name) {
      doc.text(receipt.company_name, 15, y);
      y += 6;
    }
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    if (receipt.company_document) { doc.text(`CNPJ/CPF: ${receipt.company_document}`, 15, y); y += 5; }
    if (receipt.company_address) { doc.text(receipt.company_address, 15, y); y += 5; }
    if (receipt.company_phone) { doc.text(`Tel: ${receipt.company_phone}`, 15, y); y += 5; }

    // Client info
    y += 5;
    doc.setFillColor(245, 245, 245);
    doc.rect(10, y - 4, 190, 25, 'F');
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('CLIENTE', 15, y + 2);
    y += 8;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    if (receipt.client_name) { doc.text(`Nome: ${receipt.client_name}`, 15, y); y += 5; }
    if (receipt.client_document) { doc.text(`CPF/CNPJ: ${receipt.client_document}`, 15, y); y += 5; }
    if (receipt.client_address) { doc.text(`Endereço: ${receipt.client_address}`, 15, y); y += 5; }

    // Items table
    y += 8;
    doc.setFillColor(r, g, b);
    doc.rect(10, y - 4, 190, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Descrição', 15, y + 1);
    doc.text('Qtd', 120, y + 1);
    doc.text('Valor Unit.', 140, y + 1);
    doc.text('Subtotal', 175, y + 1);
    y += 8;

    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    receipt.items.forEach((item) => {
      if (y > 260) { doc.addPage(); y = 20; }
      doc.text(item.description || '-', 15, y);
      doc.text(String(item.quantity), 120, y);
      doc.text(formatCurrency(item.unit_price), 140, y);
      doc.text(formatCurrency(item.quantity * item.unit_price), 175, y);
      y += 7;
    });

    // Total
    y += 3;
    doc.setDrawColor(r, g, b);
    doc.line(10, y, 200, y);
    y += 8;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('TOTAL:', 140, y);
    doc.setTextColor(r, g, b);
    doc.text(formatCurrency(total), 175, y);

    // Payment method
    y += 10;
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Forma de Pagamento: ${paymentMethods[receipt.payment_method] || receipt.payment_method}`, 15, y);

    // Notes
    if (receipt.notes) {
      y += 10;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'italic');
      doc.text(`Observações: ${receipt.notes}`, 15, y, { maxWidth: 180 });
    }

    // Signature line
    y = Math.max(y + 25, 240);
    doc.setDrawColor(0, 0, 0);
    doc.line(50, y, 160, y);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Assinatura', 95, y + 5);

    return doc;
  };

  const handleDownloadPDF = () => {
    const doc = generatePDF();
    doc.save(`recibo-${receipt.receipt_number}.pdf`);
    toast({ title: "PDF gerado!", description: "O recibo foi baixado com sucesso." });
  };

  const handleSendWhatsApp = () => {
    const phone = receipt.client_phone.replace(/\D/g, '');
    if (!phone) {
      toast({ title: "Erro", description: "Informe o telefone do cliente.", variant: "destructive" });
      return;
    }
    // Download the PDF first
    handleDownloadPDF();
    const message = encodeURIComponent(
      `Olá ${receipt.client_name}! Segue o recibo Nº ${receipt.receipt_number} no valor de ${formatCurrency(total)}. Confira o arquivo em anexo.`
    );
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
    toast({ title: "WhatsApp aberto!", description: "Envie o PDF baixado na conversa do WhatsApp." });
  };

  const handleSendEmail = async () => {
    if (!receipt.client_email) {
      toast({ title: "Erro", description: "Informe o email do cliente.", variant: "destructive" });
      return;
    }
    setSendingEmail(true);
    try {
      const doc = generatePDF();
      const pdfBase64 = doc.output('datauristring').split(',')[1];

      const { data, error } = await supabase.functions.invoke('send-receipt-email', {
        body: {
          to: receipt.client_email,
          clientName: receipt.client_name,
          receiptNumber: receipt.receipt_number,
          total: formatCurrency(total),
          companyName: receipt.company_name || 'Empresa',
          pdfBase64,
        }
      });

      if (error) throw error;

      toast({ title: "Email enviado!", description: `Recibo enviado para ${receipt.client_email}` });
    } catch (error: any) {
      console.error('Erro ao enviar email:', error);
      toast({ title: "Erro ao enviar email", description: error.message || "Tente novamente.", variant: "destructive" });
    } finally {
      setSendingEmail(false);
    }
  };

  const handleNewReceipt = () => {
    setReceipt({
      ...defaultReceipt,
      receipt_number: `REC-${Date.now().toString().slice(-6)}`,
      company_name: receipt.company_name,
      company_document: receipt.company_document,
      company_address: receipt.company_address,
      company_phone: receipt.company_phone,
      primary_color: receipt.primary_color,
      logo_url: receipt.logo_url,
    });
    setLogoPreview(receipt.logo_url ? receipt.logo_url : '');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Receipt className="w-6 h-6 text-primary" />
          Gerador de Recibo Online
        </h2>
        <Button variant="outline" onClick={handleNewReceipt}>Novo Recibo</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Company Info */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Dados da Empresa</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <div>
                <Label className="text-xs">Logo</Label>
                <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                <Button variant="outline" size="sm" onClick={() => logoInputRef.current?.click()}>
                  {logoPreview ? 'Trocar Logo' : 'Carregar Logo'}
                </Button>
              </div>
              {logoPreview && (
                <img src={logoPreview} alt="Logo" className="w-12 h-12 object-contain rounded border" />
              )}
            </div>
            <div>
              <Label className="text-xs">Nome da Empresa</Label>
              <Input value={receipt.company_name} onChange={e => updateField('company_name', e.target.value)} placeholder="Sua Empresa LTDA" />
            </div>
            <div>
              <Label className="text-xs">CNPJ/CPF</Label>
              <Input value={receipt.company_document} onChange={e => updateField('company_document', e.target.value)} placeholder="00.000.000/0001-00" />
            </div>
            <div>
              <Label className="text-xs">Endereço</Label>
              <Input value={receipt.company_address} onChange={e => updateField('company_address', e.target.value)} placeholder="Rua, Nº, Cidade - UF" />
            </div>
            <div>
              <Label className="text-xs">Telefone</Label>
              <Input value={receipt.company_phone} onChange={e => updateField('company_phone', e.target.value)} placeholder="(11) 99999-9999" />
            </div>
            <div>
              <Label className="text-xs">Cor Principal</Label>
              <div className="flex items-center gap-2">
                <input type="color" value={receipt.primary_color} onChange={e => updateField('primary_color', e.target.value)} className="w-10 h-10 rounded cursor-pointer border-0" />
                <span className="text-xs text-muted-foreground">{receipt.primary_color}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Client Info */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Dados do Cliente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-xs">Nome do Cliente *</Label>
              <Input value={receipt.client_name} onChange={e => updateField('client_name', e.target.value)} placeholder="Nome completo" />
            </div>
            <div>
              <Label className="text-xs">CPF/CNPJ</Label>
              <Input value={receipt.client_document} onChange={e => updateField('client_document', e.target.value)} placeholder="000.000.000-00" />
            </div>
            <div>
              <Label className="text-xs">Endereço</Label>
              <Input value={receipt.client_address} onChange={e => updateField('client_address', e.target.value)} placeholder="Endereço completo" />
            </div>
            <div>
              <Label className="text-xs">Email</Label>
              <Input type="email" value={receipt.client_email} onChange={e => updateField('client_email', e.target.value)} placeholder="cliente@email.com" />
            </div>
            <div>
              <Label className="text-xs">Telefone (WhatsApp)</Label>
              <Input value={receipt.client_phone} onChange={e => updateField('client_phone', e.target.value)} placeholder="5511999999999" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Receipt Details */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Detalhes do Recibo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <Label className="text-xs">Nº do Recibo</Label>
              <Input value={receipt.receipt_number} onChange={e => updateField('receipt_number', e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Data</Label>
              <Input type="date" value={receipt.date} onChange={e => updateField('date', e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Forma de Pagamento</Label>
              <Select value={receipt.payment_method} onValueChange={v => updateField('payment_method', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(paymentMethods).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Items */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold">Itens / Serviços</Label>
            {receipt.items.map(item => (
              <div key={item.id} className="grid grid-cols-12 gap-2 items-end">
                <div className="col-span-5">
                  <Input value={item.description} onChange={e => updateItem(item.id, { description: e.target.value })} placeholder="Descrição" />
                </div>
                <div className="col-span-2">
                  <Input type="number" min={1} value={item.quantity} onChange={e => updateItem(item.id, { quantity: parseInt(e.target.value) || 1 })} />
                </div>
                <div className="col-span-2">
                  <Input type="number" min={0} step={0.01} value={item.unit_price} onChange={e => updateItem(item.id, { unit_price: parseFloat(e.target.value) || 0 })} />
                </div>
                <div className="col-span-2 text-sm font-medium flex items-center h-10 px-2 bg-muted rounded-md">
                  {formatCurrency(item.quantity * item.unit_price)}
                </div>
                <div className="col-span-1">
                  <Button variant="ghost" size="icon" onClick={() => removeItem(item.id)} disabled={receipt.items.length <= 1} className="text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={addItem} className="w-full">
              <Plus className="h-4 w-4 mr-1" /> Adicionar Item
            </Button>
          </div>

          {/* Total */}
          <div className="flex justify-end">
            <div className="bg-primary/10 px-6 py-3 rounded-lg text-right">
              <span className="text-sm text-muted-foreground">Total: </span>
              <span className="text-xl font-bold text-primary">{formatCurrency(total)}</span>
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label className="text-xs">Observações</Label>
            <Textarea value={receipt.notes} onChange={e => updateField('notes', e.target.value)} placeholder="Observações adicionais..." rows={2} />
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <Button onClick={() => setPreviewOpen(true)} variant="outline">
          <Eye className="h-4 w-4 mr-2" /> Visualizar
        </Button>
        <Button onClick={handleDownloadPDF} variant="outline">
          <Download className="h-4 w-4 mr-2" /> Baixar PDF
        </Button>
        <Button onClick={handleSendWhatsApp} className="bg-green-600 hover:bg-green-700 text-white">
          <MessageCircle className="h-4 w-4 mr-2" /> Enviar por WhatsApp
        </Button>
        <Button onClick={handleSendEmail} disabled={sendingEmail}>
          {sendingEmail ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Mail className="h-4 w-4 mr-2" />}
          Enviar por Email
        </Button>
      </div>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Pré-visualização do Recibo</DialogTitle>
          </DialogHeader>
          <div className="border rounded-lg p-6 bg-white text-black">
            {/* Preview Header */}
            <div className="flex items-center justify-between border-b pb-4 mb-4" style={{ borderColor: receipt.primary_color }}>
              <div className="flex items-center gap-3">
                {logoPreview && <img src={logoPreview} alt="Logo" className="w-16 h-16 object-contain" />}
                <div>
                  <h3 className="text-xl font-bold" style={{ color: receipt.primary_color }}>RECIBO</h3>
                  <p className="text-sm text-gray-500">Nº {receipt.receipt_number}</p>
                </div>
              </div>
              <div className="text-right text-sm text-gray-600">
                <p>{new Date(receipt.date).toLocaleDateString('pt-BR')}</p>
              </div>
            </div>

            {/* Company */}
            {receipt.company_name && (
              <div className="mb-4">
                <p className="font-semibold">{receipt.company_name}</p>
                {receipt.company_document && <p className="text-sm text-gray-600">CNPJ/CPF: {receipt.company_document}</p>}
                {receipt.company_address && <p className="text-sm text-gray-600">{receipt.company_address}</p>}
              </div>
            )}

            {/* Client */}
            <div className="bg-gray-50 p-3 rounded mb-4">
              <p className="font-semibold text-sm mb-1" style={{ color: receipt.primary_color }}>CLIENTE</p>
              <p>{receipt.client_name || '-'}</p>
              {receipt.client_document && <p className="text-sm text-gray-600">CPF/CNPJ: {receipt.client_document}</p>}
              {receipt.client_address && <p className="text-sm text-gray-600">{receipt.client_address}</p>}
            </div>

            {/* Items Table */}
            <table className="w-full text-sm mb-4">
              <thead>
                <tr style={{ backgroundColor: receipt.primary_color, color: 'white' }}>
                  <th className="text-left p-2 rounded-tl">Descrição</th>
                  <th className="text-center p-2">Qtd</th>
                  <th className="text-right p-2">Valor Unit.</th>
                  <th className="text-right p-2 rounded-tr">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {receipt.items.map((item, idx) => (
                  <tr key={item.id} className={idx % 2 === 0 ? 'bg-gray-50' : ''}>
                    <td className="p-2">{item.description || '-'}</td>
                    <td className="text-center p-2">{item.quantity}</td>
                    <td className="text-right p-2">{formatCurrency(item.unit_price)}</td>
                    <td className="text-right p-2 font-medium">{formatCurrency(item.quantity * item.unit_price)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Total */}
            <div className="flex justify-end mb-4">
              <div className="text-right">
                <span className="text-lg font-bold" style={{ color: receipt.primary_color }}>
                  Total: {formatCurrency(total)}
                </span>
              </div>
            </div>

            <p className="text-sm text-gray-600 mb-2">
              Forma de Pagamento: {paymentMethods[receipt.payment_method]}
            </p>

            {receipt.notes && (
              <p className="text-sm text-gray-500 italic">Obs: {receipt.notes}</p>
            )}

            {/* Signature */}
            <div className="mt-10 text-center">
              <div className="border-t border-gray-400 w-48 mx-auto pt-1">
                <p className="text-sm text-gray-500">Assinatura</p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
