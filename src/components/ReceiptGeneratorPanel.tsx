import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Receipt, Send, Download, MessageCircle, Mail, Plus, Trash2, Eye, Loader2, Building2, Users, Save, Search, FileText, Edit, X, Printer } from "lucide-react";
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
  receipt_title: string;
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
  issuer_signer_name: string;
  client_signer_name: string;
}

interface BusinessOption {
  id: string;
  name: string;
  cnpj: string | null;
  company_name: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  logo_url: string | null;
}

interface CustomerOption {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  company: string | null;
}

interface SavedReceipt {
  id: string;
  receipt_number: string;
  receipt_data: ReceiptData;
  total_amount: number;
  client_name: string | null;
  created_at: string;
  updated_at: string;
}

const defaultReceipt: ReceiptData = {
  receipt_number: `REC-${Date.now().toString().slice(-6)}`,
  receipt_title: 'RECIBO',
  date: (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; })(),
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
  issuer_signer_name: '',
  client_signer_name: '',
};

export function ReceiptGeneratorPanel() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [receipt, setReceipt] = useState<ReceiptData>({ ...defaultReceipt });
  const [previewOpen, setPreviewOpen] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');

  // Business & Customer data
  const [businesses, setBusinesses] = useState<BusinessOption[]>([]);
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [selectedBusinessId, setSelectedBusinessId] = useState<string>('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');

  // Save & Search state
  const [savedReceipts, setSavedReceipts] = useState<SavedReceipt[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [editingReceiptId, setEditingReceiptId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const [bizRes, custRes] = await Promise.all([
        supabase.from('businesses').select('id, name, cnpj, company_name, phone, address, city, state, logo_url').eq('user_id', user.id).order('name'),
        supabase.from('customers').select('id, name, email, phone, address, city, state, company').eq('user_id', user.id).order('name'),
      ]);
      if (bizRes.data) setBusinesses(bizRes.data);
      if (custRes.data) setCustomers(custRes.data);
    };
    fetchData();
  }, [user]);

  const fetchSavedReceipts = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('saved_receipts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (data) setSavedReceipts(data as unknown as SavedReceipt[]);
  };

  useEffect(() => {
    fetchSavedReceipts();
  }, [user]);

  const handleSelectBusiness = (bizId: string) => {
    setSelectedBusinessId(bizId);
    if (bizId === '_none') {
      updateField('company_name', '');
      updateField('company_document', '');
      updateField('company_address', '');
      updateField('company_phone', '');
      setLogoPreview('');
      updateField('logo_url', '');
      return;
    }
    const biz = businesses.find(b => b.id === bizId);
    if (!biz) return;
    const addr = [biz.address, biz.city, biz.state].filter(Boolean).join(', ');
    updateField('company_name', biz.company_name || biz.name || '');
    updateField('company_document', biz.cnpj || '');
    updateField('company_address', addr);
    updateField('company_phone', biz.phone || '');
    if (biz.logo_url) {
      setLogoPreview(biz.logo_url);
      updateField('logo_url', biz.logo_url);
    }
  };

  const handleSelectCustomer = (custId: string) => {
    setSelectedCustomerId(custId);
    if (custId === '_none') {
      updateField('client_name', '');
      updateField('client_document', '');
      updateField('client_address', '');
      updateField('client_email', '');
      updateField('client_phone', '');
      return;
    }
    const cust = customers.find(c => c.id === custId);
    if (!cust) return;
    const addr = [cust.address, cust.city, cust.state].filter(Boolean).join(', ');
    updateField('client_name', cust.name || '');
    updateField('client_email', cust.email || '');
    updateField('client_phone', cust.phone || '');
    updateField('client_address', addr);
    updateField('client_document', '');
  };

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

  // Save receipt
  const handleSaveReceipt = async () => {
    if (!user) return;
    if (!receipt.receipt_number || !receipt.client_name) {
      toast({ title: "Erro", description: "Preencha o número do recibo e o nome do cliente.", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        user_id: user.id,
        receipt_number: receipt.receipt_number,
        receipt_data: JSON.parse(JSON.stringify(receipt)),
        total_amount: total,
        client_name: receipt.client_name,
      };

      if (editingReceiptId) {
        const { error } = await supabase
          .from('saved_receipts')
          .update(payload)
          .eq('id', editingReceiptId);
        if (error) throw error;
        toast({ title: "Recibo atualizado!", description: `Recibo ${receipt.receipt_number} atualizado com sucesso.` });
      } else {
        const { error } = await supabase
          .from('saved_receipts')
          .insert([payload]);
        if (error) throw error;
        toast({ title: "Recibo salvo!", description: `Recibo ${receipt.receipt_number} salvo com sucesso.` });
      }
      await fetchSavedReceipts();
    } catch (error: any) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleLoadReceipt = (saved: SavedReceipt) => {
    const data = saved.receipt_data;
    setReceipt(data);
    setEditingReceiptId(saved.id);
    setLogoPreview(data.logo_url || '');
    setSelectedBusinessId('');
    setSelectedCustomerId('');
    setSearchOpen(false);
    toast({ title: "Recibo carregado", description: `Editando recibo ${data.receipt_number}` });
  };

  const handleDeleteReceipt = async (id: string) => {
    const { error } = await supabase.from('saved_receipts').delete().eq('id', id);
    if (error) {
      toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
      return;
    }
    if (editingReceiptId === id) setEditingReceiptId(null);
    toast({ title: "Recibo excluído" });
    await fetchSavedReceipts();
  };

  const filteredReceipts = savedReceipts.filter(r => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.receipt_number.toLowerCase().includes(q) ||
      (r.client_name || '').toLowerCase().includes(q)
    );
  });

  const generatePDF = (): jsPDF => {
    const doc = new jsPDF();
    const color = receipt.primary_color;
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);

    doc.setFillColor(r, g, b);
    doc.rect(0, 0, 210, 40, 'F');

    if (logoPreview) {
      try { doc.addImage(logoPreview, 'PNG', 10, 5, 30, 30); } catch {}
    }

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text(receipt.receipt_title || 'RECIBO', logoPreview ? 50 : 15, 20);
    doc.setFontSize(11);
    doc.text(`Nº ${receipt.receipt_number}`, logoPreview ? 50 : 15, 30);
    doc.text(`Data: ${receipt.date.split('-').reverse().join('/')}`, 150, 20);

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

    y += 3;
    doc.setDrawColor(r, g, b);
    doc.line(10, y, 200, y);
    y += 8;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('TOTAL:', 140, y);
    doc.setTextColor(r, g, b);
    doc.text(formatCurrency(total), 175, y);

    y += 10;
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Forma de Pagamento: ${paymentMethods[receipt.payment_method] || receipt.payment_method}`, 15, y);

    if (receipt.notes) {
      y += 10;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'italic');
      doc.text(`Observações: ${receipt.notes}`, 15, y, { maxWidth: 180 });
    }

    y = Math.max(y + 25, 220);

    // Two signature lines side by side
    const sigY = y;
    // Issuer signature (left)
    doc.setDrawColor(0, 0, 0);
    doc.line(20, sigY, 90, sigY);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(receipt.issuer_signer_name || receipt.company_name || 'Emissor', 55, sigY + 5, { align: 'center' });

    // Client signature (right)
    doc.line(120, sigY, 190, sigY);
    doc.text(receipt.client_signer_name || receipt.client_name || 'Cliente', 155, sigY + 5, { align: 'center' });

    return doc;
  };

  const handleDownloadPDF = () => {
    const doc = generatePDF();
    doc.save(`recibo-${receipt.receipt_number}.pdf`);
    toast({ title: "PDF gerado!", description: "O recibo foi baixado com sucesso." });
  };

  const handlePrint = () => {
    const doc = generatePDF();
    const blobUrl = doc.output('bloburl');
    const printWindow = window.open(blobUrl as unknown as string, '_blank');
    if (printWindow) {
      printWindow.addEventListener('load', () => {
        printWindow.print();
      });
    }
  };

  const handleSendWhatsApp = () => {
    const phone = receipt.client_phone.replace(/\D/g, '');
    if (!phone) {
      toast({ title: "Erro", description: "Informe o telefone do cliente.", variant: "destructive" });
      return;
    }
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
    setSelectedCustomerId('');
    setEditingReceiptId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Receipt className="w-6 h-6 text-primary" />
          Gerador de Recibo Online
        </h2>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={() => { setSearchOpen(true); fetchSavedReceipts(); }}>
            <Search className="h-4 w-4 mr-1" /> Buscar Recibos
          </Button>
          <Button variant="outline" size="sm" onClick={handleNewReceipt}>Novo Recibo</Button>
        </div>
      </div>

      {/* Editing indicator */}
      {editingReceiptId && (
        <div className="flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-lg px-4 py-2 text-sm">
          <Edit className="w-4 h-4 text-primary" />
          <span>Editando: <strong>{receipt.receipt_number}</strong></span>
          <Button variant="ghost" size="sm" className="ml-auto h-6 px-2" onClick={() => { setEditingReceiptId(null); handleNewReceipt(); }}>
            <X className="w-3 h-3 mr-1" /> Cancelar edição
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Company Info */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Dados da Empresa</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Business selector */}
            {businesses.length > 0 && (
              <div>
                <Label className="text-xs flex items-center gap-1"><Building2 className="w-3 h-3" /> Selecionar Negócio</Label>
                <Select value={selectedBusinessId} onValueChange={handleSelectBusiness}>
                  <SelectTrigger><SelectValue placeholder="Preencher com dados de um negócio..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">— Preencher manualmente —</SelectItem>
                    {businesses.map(b => (
                      <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

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
            {/* Customer selector */}
            {customers.length > 0 && (
              <div>
                <Label className="text-xs flex items-center gap-1"><Users className="w-3 h-3" /> Selecionar Cliente Cadastrado</Label>
                <Select value={selectedCustomerId} onValueChange={handleSelectCustomer}>
                  <SelectTrigger><SelectValue placeholder="Preencher com cliente existente..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">— Preencher manualmente —</SelectItem>
                    {customers.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}{c.email ? ` (${c.email})` : ''}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <Label className="text-xs">Título do Recibo</Label>
              <Input value={receipt.receipt_title} onChange={e => updateField('receipt_title', e.target.value)} placeholder="RECIBO" />
            </div>
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

          {/* Signature Names */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Nome do Assinante (Emissor)</Label>
              <Input value={receipt.issuer_signer_name} onChange={e => updateField('issuer_signer_name', e.target.value)} placeholder="Nome de quem emite o recibo" />
            </div>
            <div>
              <Label className="text-xs">Nome do Assinante (Cliente)</Label>
              <Input value={receipt.client_signer_name} onChange={e => updateField('client_signer_name', e.target.value)} placeholder="Nome do cliente que assina" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <Button onClick={handleSaveReceipt} disabled={saving} variant="default">
          {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          {editingReceiptId ? 'Atualizar Recibo' : 'Salvar Recibo'}
        </Button>
        <Button onClick={() => setPreviewOpen(true)} variant="outline">
          <Eye className="h-4 w-4 mr-2" /> Visualizar
        </Button>
        <Button onClick={handleDownloadPDF} variant="outline">
          <Download className="h-4 w-4 mr-2" /> Baixar PDF
        </Button>
        <Button onClick={handlePrint} variant="outline">
          <Printer className="h-4 w-4 mr-2" /> Imprimir
        </Button>
        <Button onClick={handleSendWhatsApp} className="bg-green-600 hover:bg-green-700 text-white">
          <MessageCircle className="h-4 w-4 mr-2" /> Enviar por WhatsApp
        </Button>
        <Button onClick={handleSendEmail} disabled={sendingEmail}>
          {sendingEmail ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Mail className="h-4 w-4 mr-2" />}
          Enviar por Email
        </Button>
      </div>

      {/* Search Receipts Dialog */}
      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" /> Recibos Salvos
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por número ou nome do cliente..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {filteredReceipts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p>{searchQuery ? 'Nenhum recibo encontrado.' : 'Nenhum recibo salvo ainda.'}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredReceipts.map(r => (
                  <div key={r.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{r.receipt_number}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {r.client_name || 'Sem cliente'} • {formatCurrency(r.total_amount)} • {new Date(r.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 ml-2">
                      <Button variant="ghost" size="sm" onClick={() => handleLoadReceipt(r)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDeleteReceipt(r.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Pré-visualização do Recibo</DialogTitle>
          </DialogHeader>
          <div className="border rounded-lg p-6 bg-white text-black">
            <div className="flex items-center justify-between border-b pb-4 mb-4" style={{ borderColor: receipt.primary_color }}>
              <div className="flex items-center gap-3">
                {logoPreview && <img src={logoPreview} alt="Logo" className="w-16 h-16 object-contain" />}
                <div>
                  <h3 className="text-xl font-bold" style={{ color: receipt.primary_color }}>{receipt.receipt_title || 'RECIBO'}</h3>
                  <p className="text-sm text-gray-500">Nº {receipt.receipt_number}</p>
                </div>
              </div>
              <div className="text-right text-sm text-gray-600">
                <p>{receipt.date.split('-').reverse().join('/')}</p>
              </div>
            </div>

            {receipt.company_name && (
              <div className="mb-4">
                <p className="font-semibold">{receipt.company_name}</p>
                {receipt.company_document && <p className="text-sm text-gray-600">CNPJ/CPF: {receipt.company_document}</p>}
                {receipt.company_address && <p className="text-sm text-gray-600">{receipt.company_address}</p>}
              </div>
            )}

            <div className="bg-gray-50 p-3 rounded mb-4">
              <p className="font-semibold text-sm mb-1" style={{ color: receipt.primary_color }}>CLIENTE</p>
              <p>{receipt.client_name || '-'}</p>
              {receipt.client_document && <p className="text-sm text-gray-600">CPF/CNPJ: {receipt.client_document}</p>}
              {receipt.client_address && <p className="text-sm text-gray-600">{receipt.client_address}</p>}
            </div>

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

            <div className="mt-10 flex justify-between px-8">
              <div className="text-center">
                <div className="border-t border-gray-400 w-48 pt-1">
                  <p className="text-sm text-gray-500">{receipt.issuer_signer_name || receipt.company_name || 'Emissor'}</p>
                </div>
              </div>
              <div className="text-center">
                <div className="border-t border-gray-400 w-48 pt-1">
                  <p className="text-sm text-gray-500">{receipt.client_signer_name || receipt.client_name || 'Cliente'}</p>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
