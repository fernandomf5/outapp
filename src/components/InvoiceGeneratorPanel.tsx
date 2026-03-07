import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  FileText, Plus, Trash2, Eye, Loader2, Building2, Users, Save, Search,
  Edit, X, Download, MessageCircle, Mail, Copy, RefreshCw, Calendar,
  Clock, DollarSign, CheckCircle, AlertCircle, XCircle, Send
} from "lucide-react";
import jsPDF from "jspdf";

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
}

interface InvoiceData {
  invoice_number: string;
  invoice_title: string;
  due_date: string;
  items: InvoiceItem[];
  payment_method: string;
  notes: string;
  client_name: string;
  client_email: string;
  client_phone: string;
  client_document: string;
  client_address: string;
  company_name: string;
  company_document: string;
  company_address: string;
  company_phone: string;
  logo_url: string;
  primary_color: string;
  pix_key: string;
  pix_key_type: string;
  discount_amount: number;
}

interface RecurringPlan {
  id: string;
  plan_name: string;
  description: string | null;
  amount: number;
  recurrence_type: string;
  next_invoice_date: string;
  start_date: string;
  is_active: boolean;
  customer_id: string | null;
  business_id: string | null;
  pix_key: string | null;
  pix_key_type: string | null;
  auto_send_email: boolean;
  reminder_days_before: number;
  payment_method: string | null;
}

interface SavedInvoice {
  id: string;
  invoice_number: string;
  invoice_title: string;
  total_amount: number;
  status: string;
  due_date: string;
  client_name: string | null;
  company_name: string | null;
  public_token: string;
  paid_at: string | null;
  payment_method: string | null;
  items: any;
  created_at: string;
}

interface BusinessOption {
  id: string; name: string; cnpj: string | null; company_name: string | null;
  phone: string | null; address: string | null; city: string | null; state: string | null; logo_url: string | null;
}

interface CustomerOption {
  id: string; name: string; email: string | null; phone: string | null;
  address: string | null; city: string | null; state: string | null; company: string | null;
}

const defaultInvoice: InvoiceData = {
  invoice_number: `FAT-${Date.now().toString().slice(-6)}`,
  invoice_title: 'FATURA',
  due_date: (() => { const d = new Date(); d.setMonth(d.getMonth() + 1); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; })(),
  items: [{ id: crypto.randomUUID(), description: '', quantity: 1, unit_price: 0 }],
  payment_method: 'pix',
  notes: '',
  client_name: '', client_email: '', client_phone: '', client_document: '', client_address: '',
  company_name: '', company_document: '', company_address: '', company_phone: '',
  logo_url: '', primary_color: '#2563eb',
  pix_key: '', pix_key_type: 'cpf',
  discount_amount: 0,
};

const paymentMethods: Record<string, string> = {
  pix: 'PIX', mercadopago: 'Mercado Pago', credit_card: 'Cartão de Crédito', debit_card: 'Cartão de Débito',
  bank_transfer: 'Transferência', boleto: 'Boleto', other: 'Outro',
};

const recurrenceLabels: Record<string, string> = {
  monthly: 'Mensal', quarterly: 'Trimestral', semiannual: 'Semestral', annual: 'Anual',
};

const statusLabels: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  paid: { label: 'Pago', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  overdue: { label: 'Vencida', color: 'bg-red-100 text-red-800', icon: AlertCircle },
  cancelled: { label: 'Cancelada', color: 'bg-gray-100 text-gray-800', icon: XCircle },
  draft: { label: 'Rascunho', color: 'bg-blue-100 text-blue-800', icon: FileText },
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

export function InvoiceGeneratorPanel() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [invoice, setInvoice] = useState<InvoiceData>({ ...defaultInvoice });
  const [activeTab, setActiveTab] = useState('criar');
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState('');
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Data
  const [businesses, setBusinesses] = useState<BusinessOption[]>([]);
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [selectedBusinessId, setSelectedBusinessId] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [savedInvoices, setSavedInvoices] = useState<SavedInvoice[]>([]);
  const [recurringPlans, setRecurringPlans] = useState<RecurringPlan[]>([]);

  // Recurring plan form
  const [planDialogOpen, setPlanDialogOpen] = useState(false);
  const [planForm, setPlanForm] = useState({
    plan_name: '', description: '', amount: 0, recurrence_type: 'monthly',
    next_invoice_date: '', pix_key: '', pix_key_type: 'cpf', customer_id: '', business_id: '',
    auto_send_email: false, reminder_days_before: 5, payment_method: 'pix',
  });
  const [savingPlan, setSavingPlan] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [generatingBulk, setGeneratingBulk] = useState(false);
  const [sendingEmail, setSendingEmail] = useState<string | null>(null);

  // Search
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const [bizRes, custRes, invRes, planRes] = await Promise.all([
        supabase.from('businesses').select('id, name, cnpj, company_name, phone, address, city, state, logo_url').eq('user_id', user.id).order('name'),
        supabase.from('customers').select('id, name, email, phone, address, city, state, company').eq('user_id', user.id).order('name'),
        supabase.from('invoices').select('id, invoice_number, invoice_title, total_amount, status, due_date, client_name, company_name, public_token, paid_at, payment_method, items, created_at, reminder_sent, last_reminder_sent_at').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('invoice_recurring_plans').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      ]);
      if (bizRes.data) setBusinesses(bizRes.data);
      if (custRes.data) setCustomers(custRes.data);
      if (invRes.data) setSavedInvoices(invRes.data as any);
      if (planRes.data) setRecurringPlans(planRes.data as any);
    };
    fetchData();
  }, [user]);

  const refreshInvoices = async () => {
    if (!user) return;
    const { data } = await supabase.from('invoices').select('id, invoice_number, invoice_title, total_amount, status, due_date, client_name, company_name, public_token, paid_at, payment_method, items, created_at, reminder_sent, last_reminder_sent_at').eq('user_id', user.id).order('created_at', { ascending: false });
    if (data) setSavedInvoices(data as any);
  };

  const refreshPlans = async () => {
    if (!user) return;
    const { data } = await supabase.from('invoice_recurring_plans').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    if (data) setRecurringPlans(data as any);
  };

  const updateField = (field: keyof InvoiceData, value: any) => {
    setInvoice(prev => ({ ...prev, [field]: value }));
  };

  const addItem = () => {
    setInvoice(prev => ({
      ...prev,
      items: [...prev.items, { id: crypto.randomUUID(), description: '', quantity: 1, unit_price: 0 }]
    }));
  };

  const updateItem = (id: string, data: Partial<InvoiceItem>) => {
    setInvoice(prev => ({
      ...prev,
      items: prev.items.map(item => item.id === id ? { ...item, ...data } : item)
    }));
  };

  const removeItem = (id: string) => {
    if (invoice.items.length <= 1) return;
    setInvoice(prev => ({ ...prev, items: prev.items.filter(item => item.id !== id) }));
  };

  const subtotal = invoice.items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
  const total = Math.max(0, subtotal - (invoice.discount_amount || 0));

  const handleSelectBusiness = (bizId: string) => {
    setSelectedBusinessId(bizId);
    if (bizId === '_none') {
      updateField('company_name', ''); updateField('company_document', '');
      updateField('company_address', ''); updateField('company_phone', '');
      setLogoPreview(''); updateField('logo_url', '');
      return;
    }
    const biz = businesses.find(b => b.id === bizId);
    if (!biz) return;
    const addr = [biz.address, biz.city, biz.state].filter(Boolean).join(', ');
    updateField('company_name', biz.company_name || biz.name || '');
    updateField('company_document', biz.cnpj || '');
    updateField('company_address', addr);
    updateField('company_phone', biz.phone || '');
    if (biz.logo_url) { setLogoPreview(biz.logo_url); updateField('logo_url', biz.logo_url); }
  };

  const handleSelectCustomer = (custId: string) => {
    setSelectedCustomerId(custId);
    if (custId === '_none') {
      updateField('client_name', ''); updateField('client_email', '');
      updateField('client_phone', ''); updateField('client_address', ''); updateField('client_document', '');
      return;
    }
    const cust = customers.find(c => c.id === custId);
    if (!cust) return;
    const addr = [cust.address, cust.city, cust.state].filter(Boolean).join(', ');
    updateField('client_name', cust.name || '');
    updateField('client_email', cust.email || '');
    updateField('client_phone', cust.phone || '');
    updateField('client_address', addr);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setLogoPreview(dataUrl); updateField('logo_url', dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveInvoice = async (status: string = 'pending') => {
    if (!user) return;
    if (!invoice.client_name) {
      toast({ title: "Erro", description: "Informe o nome do cliente.", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        user_id: user.id,
        invoice_number: invoice.invoice_number,
        invoice_title: invoice.invoice_title,
        items: JSON.parse(JSON.stringify(invoice.items)),
        subtotal, discount_amount: invoice.discount_amount || 0, total_amount: total,
        status,
        due_date: invoice.due_date,
        payment_method: invoice.payment_method,
        pix_key: invoice.pix_key || null,
        pix_key_type: invoice.pix_key_type || null,
        client_name: invoice.client_name, client_email: invoice.client_email,
        client_phone: invoice.client_phone, client_document: invoice.client_document,
        client_address: invoice.client_address,
        company_name: invoice.company_name, company_document: invoice.company_document,
        company_address: invoice.company_address, company_phone: invoice.company_phone,
        logo_url: invoice.logo_url, primary_color: invoice.primary_color,
        notes: invoice.notes,
        business_id: selectedBusinessId && selectedBusinessId !== '_none' ? selectedBusinessId : null,
        customer_id: selectedCustomerId && selectedCustomerId !== '_none' ? selectedCustomerId : null,
      };

      if (editingId) {
        const { error } = await supabase.from('invoices').update(payload).eq('id', editingId);
        if (error) throw error;
        toast({ title: "Fatura atualizada! ✅" });
      } else {
        const { error } = await supabase.from('invoices').insert([payload]);
        if (error) throw error;
        toast({ title: "Fatura salva! ✅", description: `Fatura ${invoice.invoice_number} criada.` });
      }
      await refreshInvoices();
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleLoadInvoice = (inv: SavedInvoice) => {
    setInvoice({
      invoice_number: inv.invoice_number,
      invoice_title: inv.invoice_title,
      due_date: inv.due_date,
      items: (inv.items as InvoiceItem[]) || [{ id: crypto.randomUUID(), description: '', quantity: 1, unit_price: 0 }],
      payment_method: inv.payment_method || 'pix',
      notes: '', client_name: inv.client_name || '', client_email: '', client_phone: '',
      client_document: '', client_address: '', company_name: inv.company_name || '',
      company_document: '', company_address: '', company_phone: '',
      logo_url: '', primary_color: '#2563eb', pix_key: '', pix_key_type: 'cpf',
      discount_amount: 0,
    });
    setEditingId(inv.id);
    setActiveTab('criar');
    toast({ title: "Fatura carregada para edição" });
  };

  const handleDeleteInvoice = async (id: string) => {
    const { error } = await supabase.from('invoices').delete().eq('id', id);
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    if (editingId === id) setEditingId(null);
    toast({ title: "Fatura excluída" });
    await refreshInvoices();
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    const payload: any = { status };
    if (status === 'paid') payload.paid_at = new Date().toISOString();
    const { error } = await supabase.from('invoices').update(payload).eq('id', id);
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    toast({ title: `Status atualizado para ${statusLabels[status]?.label || status}` });
    await refreshInvoices();
  };

  const handleCopyLink = (token: string) => {
    const url = `${window.location.origin}/fatura/${token}`;
    navigator.clipboard.writeText(url);
    toast({ title: "Link copiado! 📋", description: "Envie o link para o cliente." });
  };

  const handleSendWhatsApp = (inv: SavedInvoice) => {
    const phone = (inv.client_name || '').replace(/\D/g, '');
    const url = `${window.location.origin}/fatura/${inv.public_token}`;
    const message = encodeURIComponent(
      `Olá! Segue sua fatura ${inv.invoice_number} no valor de ${formatCurrency(inv.total_amount)}.\n\nAcesse: ${url}`
    );
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  const handleNewInvoice = () => {
    setInvoice({
      ...defaultInvoice,
      invoice_number: `FAT-${Date.now().toString().slice(-6)}`,
      company_name: invoice.company_name, company_document: invoice.company_document,
      company_address: invoice.company_address, company_phone: invoice.company_phone,
      logo_url: invoice.logo_url, primary_color: invoice.primary_color,
      pix_key: invoice.pix_key, pix_key_type: invoice.pix_key_type,
    });
    setEditingId(null);
    setSelectedCustomerId('');
  };

  // Recurring Plans
  const handleSavePlan = async () => {
    if (!user || !planForm.plan_name || !planForm.amount) {
      toast({ title: "Erro", description: "Preencha nome e valor do plano.", variant: "destructive" });
      return;
    }
    setSavingPlan(true);
    try {
      const payload = {
        user_id: user.id,
        plan_name: planForm.plan_name,
        description: planForm.description || null,
        amount: planForm.amount,
        recurrence_type: planForm.recurrence_type,
        next_invoice_date: planForm.next_invoice_date || new Date().toISOString().slice(0, 10),
        start_date: planForm.next_invoice_date || new Date().toISOString().slice(0, 10),
        pix_key: planForm.pix_key || null,
        pix_key_type: planForm.pix_key_type || null,
        customer_id: planForm.customer_id && planForm.customer_id !== '_none' ? planForm.customer_id : null,
        business_id: planForm.business_id && planForm.business_id !== '_none' ? planForm.business_id : null,
        auto_send_email: planForm.auto_send_email,
        reminder_days_before: planForm.reminder_days_before,
        payment_method: planForm.payment_method,
      };
      if (editingPlanId) {
        const { error } = await supabase.from('invoice_recurring_plans').update(payload).eq('id', editingPlanId);
        if (error) throw error;
        toast({ title: "Plano atualizado! ✅" });
      } else {
        const { error } = await supabase.from('invoice_recurring_plans').insert([payload]);
        if (error) throw error;
        toast({ title: "Plano criado! ✅" });
      }
      setPlanDialogOpen(false);
      const defaultPlanForm = { plan_name: '', description: '', amount: 0, recurrence_type: 'monthly', next_invoice_date: '', pix_key: '', pix_key_type: 'cpf', customer_id: '', business_id: '', auto_send_email: false, reminder_days_before: 5, payment_method: 'pix' };
      setPlanForm(defaultPlanForm);
      setEditingPlanId(null);
      await refreshPlans();
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } finally {
      setSavingPlan(false);
    }
  };

  const handleDeletePlan = async (id: string) => {
    const { error } = await supabase.from('invoice_recurring_plans').delete().eq('id', id);
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Plano excluído" });
    await refreshPlans();
  };

  const handleGenerateFromPlan = (plan: RecurringPlan) => {
    const cust = customers.find(c => c.id === plan.customer_id);
    setInvoice({
      ...defaultInvoice,
      invoice_number: `FAT-${Date.now().toString().slice(-6)}`,
      invoice_title: `FATURA - ${plan.plan_name}`,
      due_date: plan.next_invoice_date,
      items: [{ id: crypto.randomUUID(), description: plan.plan_name + (plan.description ? ` - ${plan.description}` : ''), quantity: 1, unit_price: plan.amount }],
      client_name: cust?.name || '',
      client_email: cust?.email || '',
      client_phone: cust?.phone || '',
      client_address: [cust?.address, cust?.city, cust?.state].filter(Boolean).join(', '),
      pix_key: plan.pix_key || '',
      pix_key_type: plan.pix_key_type || 'cpf',
      payment_method: plan.payment_method || 'pix',
    });
    if (plan.customer_id) setSelectedCustomerId(plan.customer_id);
    if (plan.business_id) {
      setSelectedBusinessId(plan.business_id);
      handleSelectBusiness(plan.business_id);
    }
    setEditingId(null);
    setActiveTab('criar');
    toast({ title: "Fatura gerada a partir do plano! 📋" });
  };

  const handleGenerateAllFromPlan = async (plan: RecurringPlan) => {
    if (!user) return;
    setGeneratingBulk(true);
    try {
      const cust = customers.find(c => c.id === plan.customer_id);
      const biz = businesses.find(b => b.id === plan.business_id);
      const startDate = new Date(plan.next_invoice_date || new Date().toISOString().slice(0, 10));
      
      // Calculate number of invoices based on recurrence
      const monthsMap: Record<string, number> = { monthly: 1, quarterly: 3, semiannual: 6, annual: 12 };
      const intervalMonths = monthsMap[plan.recurrence_type] || 1;
      const totalInvoices = Math.floor(12 / intervalMonths);
      
      const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
      
      const invoicesToCreate = [];
      for (let i = 0; i < totalInvoices; i++) {
        const dueDate = new Date(startDate);
        dueDate.setMonth(dueDate.getMonth() + (i * intervalMonths));
        const dueDateStr = `${dueDate.getFullYear()}-${String(dueDate.getMonth() + 1).padStart(2, '0')}-${String(dueDate.getDate()).padStart(2, '0')}`;
        const monthLabel = monthNames[dueDate.getMonth()];
        
        const addr = biz ? [biz.address, biz.city, biz.state].filter(Boolean).join(', ') : '';
        
        invoicesToCreate.push({
          user_id: user.id,
          invoice_number: `FAT-${Date.now().toString().slice(-6)}-${String(i + 1).padStart(2, '0')}`,
          invoice_title: `FATURA - ${plan.plan_name}`,
          items: JSON.parse(JSON.stringify([{ id: crypto.randomUUID(), description: `${plan.plan_name} - ${monthLabel}/${dueDate.getFullYear()}${plan.description ? ` (${plan.description})` : ''}`, quantity: 1, unit_price: plan.amount }])),
          subtotal: plan.amount,
          discount_amount: 0,
          total_amount: plan.amount,
          status: 'pending',
          due_date: dueDateStr,
          payment_method: plan.payment_method || 'pix',
          pix_key: plan.pix_key || null,
          pix_key_type: plan.pix_key_type || null,
          client_name: cust?.name || '',
          client_email: cust?.email || '',
          client_phone: cust?.phone || '',
          client_document: '',
          client_address: cust ? [cust.address, cust.city, cust.state].filter(Boolean).join(', ') : '',
          company_name: biz?.company_name || biz?.name || '',
          company_document: biz?.cnpj || '',
          company_address: addr,
          company_phone: biz?.phone || '',
          logo_url: biz?.logo_url || '',
          primary_color: '#2563eb',
          notes: '',
          business_id: plan.business_id || null,
          customer_id: plan.customer_id || null,
          recurring_plan_id: plan.id,
        });
      }
      
      const { error } = await supabase.from('invoices').insert(invoicesToCreate);
      if (error) throw error;
      
      toast({ title: `${totalInvoices} faturas geradas! 🎉`, description: `Faturas criadas para o plano "${plan.plan_name}".` });
      await refreshInvoices();
      setActiveTab('faturas');
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } finally {
      setGeneratingBulk(false);
    }
  };

  const handleSendInvoiceEmail = async (invoiceId: string, isReminder: boolean = false) => {
    setSendingEmail(invoiceId);
    try {
      const { data, error } = await supabase.functions.invoke('send-invoice-reminder', {
        body: { invoice_id: invoiceId, is_reminder: isReminder },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast({ title: isReminder ? "Lembrete enviado! 📧" : "Fatura enviada por email! 📧" });
      await refreshInvoices();
    } catch (error: any) {
      toast({ title: "Erro ao enviar email", description: error.message, variant: "destructive" });
    } finally {
      setSendingEmail(null);
    }
  };

  const filteredInvoices = savedInvoices.filter(inv => {
    if (filterStatus !== 'all' && inv.status !== filterStatus) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return inv.invoice_number.toLowerCase().includes(q) || (inv.client_name || '').toLowerCase().includes(q) || (inv.company_name || '').toLowerCase().includes(q);
    }
    return true;
  });

  const generatePDF = (): jsPDF => {
    const doc = new jsPDF();
    const color = invoice.primary_color;
    const cr = parseInt(color.slice(1, 3), 16);
    const cg = parseInt(color.slice(3, 5), 16);
    const cb = parseInt(color.slice(5, 7), 16);

    doc.setFillColor(cr, cg, cb);
    doc.rect(0, 0, 210, 40, 'F');

    if (logoPreview) { try { doc.addImage(logoPreview, 'PNG', 10, 5, 30, 30); } catch {} }

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text(invoice.invoice_title || 'FATURA', logoPreview ? 50 : 15, 20);
    doc.setFontSize(11);
    doc.text(`Nº ${invoice.invoice_number}`, logoPreview ? 50 : 15, 30);
    doc.text(`Vencimento: ${invoice.due_date.split('-').reverse().join('/')}`, 140, 20);

    let y = 50;
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12); doc.setFont('helvetica', 'bold');
    if (invoice.company_name) { doc.text(invoice.company_name, 15, y); y += 6; }
    doc.setFontSize(9); doc.setFont('helvetica', 'normal');
    if (invoice.company_document) { doc.text(`CNPJ/CPF: ${invoice.company_document}`, 15, y); y += 5; }
    if (invoice.company_address) { doc.text(invoice.company_address, 15, y); y += 5; }
    if (invoice.company_phone) { doc.text(`Tel: ${invoice.company_phone}`, 15, y); y += 5; }

    y += 5;
    doc.setFillColor(245, 245, 245);
    doc.rect(10, y - 4, 190, 25, 'F');
    doc.setFontSize(11); doc.setFont('helvetica', 'bold');
    doc.text('CLIENTE', 15, y + 2); y += 8;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
    if (invoice.client_name) { doc.text(`Nome: ${invoice.client_name}`, 15, y); y += 5; }
    if (invoice.client_document) { doc.text(`CPF/CNPJ: ${invoice.client_document}`, 15, y); y += 5; }
    if (invoice.client_address) { doc.text(`Endereço: ${invoice.client_address}`, 15, y); y += 5; }

    y += 8;
    doc.setFillColor(cr, cg, cb);
    doc.rect(10, y - 4, 190, 8, 'F');
    doc.setTextColor(255, 255, 255); doc.setFontSize(9); doc.setFont('helvetica', 'bold');
    doc.text('Descrição', 15, y + 1); doc.text('Qtd', 120, y + 1);
    doc.text('Valor Unit.', 140, y + 1); doc.text('Subtotal', 175, y + 1);
    y += 8;

    doc.setTextColor(0, 0, 0); doc.setFont('helvetica', 'normal');
    invoice.items.forEach(item => {
      if (y > 260) { doc.addPage(); y = 20; }
      doc.text(item.description || '-', 15, y);
      doc.text(String(item.quantity), 120, y);
      doc.text(formatCurrency(item.unit_price), 140, y);
      doc.text(formatCurrency(item.quantity * item.unit_price), 175, y);
      y += 7;
    });

    y += 3; doc.setDrawColor(cr, cg, cb); doc.line(10, y, 200, y); y += 8;

    if (invoice.discount_amount > 0) {
      doc.setFontSize(10);
      doc.text('Subtotal:', 140, y); doc.text(formatCurrency(subtotal), 175, y); y += 6;
      doc.setTextColor(200, 0, 0);
      doc.text('Desconto:', 140, y); doc.text(`- ${formatCurrency(invoice.discount_amount)}`, 175, y); y += 8;
    }

    doc.setFontSize(12); doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0); doc.text('TOTAL:', 140, y);
    doc.setTextColor(cr, cg, cb); doc.text(formatCurrency(total), 175, y);

    y += 10;
    doc.setTextColor(0, 0, 0); doc.setFontSize(10); doc.setFont('helvetica', 'normal');
    doc.text(`Forma de Pagamento: ${paymentMethods[invoice.payment_method] || invoice.payment_method}`, 15, y);

    if (invoice.pix_key) {
      y += 8;
      doc.setFontSize(9); doc.setFont('helvetica', 'bold');
      doc.setTextColor(cr, cg, cb);
      doc.text('CHAVE PIX', 15, y); y += 5;
      doc.setFont('helvetica', 'normal'); doc.setTextColor(0, 0, 0);
      doc.text(`Tipo: ${invoice.pix_key_type?.toUpperCase() || 'CPF'}`, 15, y); y += 5;
      doc.text(`Chave: ${invoice.pix_key}`, 15, y);
    }

    if (invoice.notes) {
      y += 10;
      doc.setFontSize(9); doc.setFont('helvetica', 'italic');
      doc.text(`Observações: ${invoice.notes}`, 15, y, { maxWidth: 180 });
    }

    return doc;
  };

  const handleDownloadPDF = () => {
    const doc = generatePDF();
    doc.save(`fatura-${invoice.invoice_number}.pdf`);
    toast({ title: "PDF da fatura gerado!" });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <FileText className="w-6 h-6 text-primary" />
          Gerador de Faturas
        </h2>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 w-full max-w-md">
          <TabsTrigger value="criar"><Plus className="w-4 h-4 mr-1" /> Criar</TabsTrigger>
          <TabsTrigger value="faturas"><FileText className="w-4 h-4 mr-1" /> Faturas</TabsTrigger>
          <TabsTrigger value="recorrentes"><RefreshCw className="w-4 h-4 mr-1" /> Recorrentes</TabsTrigger>
        </TabsList>

        {/* TAB: Criar Fatura */}
        <TabsContent value="criar" className="mt-4">
          {editingId && (
            <div className="flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-lg px-4 py-2 text-sm mb-4">
              <Edit className="w-4 h-4 text-primary" />
              <span>Editando: <strong>{invoice.invoice_number}</strong></span>
              <Button variant="ghost" size="sm" className="ml-auto h-6 px-2" onClick={handleNewInvoice}>
                <X className="w-3 h-3 mr-1" /> Cancelar
              </Button>
            </div>
          )}

          <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
            {/* LEFT: Form */}
            <div className="xl:col-span-3 space-y-4">
              {/* Company & Client */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm">Empresa</CardTitle></CardHeader>
                  <CardContent className="space-y-2">
                    {businesses.length > 0 && (
                      <div>
                        <Label className="text-xs flex items-center gap-1"><Building2 className="w-3 h-3" /> Negócio</Label>
                        <Select value={selectedBusinessId} onValueChange={handleSelectBusiness}>
                          <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Selecionar..." /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="_none">— Manual —</SelectItem>
                            {businesses.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                      <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => logoInputRef.current?.click()}>
                        {logoPreview ? 'Trocar Logo' : 'Logo'}
                      </Button>
                      {logoPreview && <img src={logoPreview} alt="Logo" className="w-8 h-8 object-contain rounded border" />}
                    </div>
                    <Input className="h-8 text-xs" value={invoice.company_name} onChange={e => updateField('company_name', e.target.value)} placeholder="Nome da Empresa" />
                    <Input className="h-8 text-xs" value={invoice.company_document} onChange={e => updateField('company_document', e.target.value)} placeholder="CNPJ/CPF" />
                    <Input className="h-8 text-xs" value={invoice.company_address} onChange={e => updateField('company_address', e.target.value)} placeholder="Endereço" />
                    <Input className="h-8 text-xs" value={invoice.company_phone} onChange={e => updateField('company_phone', e.target.value)} placeholder="Telefone" />
                    <div>
                      <Label className="text-xs">Cor</Label>
                      <div className="flex items-center gap-2">
                        <input type="color" value={invoice.primary_color} onChange={e => updateField('primary_color', e.target.value)} className="w-8 h-8 rounded cursor-pointer border-0" />
                        <span className="text-[10px] text-muted-foreground">{invoice.primary_color}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm">Cliente</CardTitle></CardHeader>
                  <CardContent className="space-y-2">
                    {customers.length > 0 && (
                      <div>
                        <Label className="text-xs flex items-center gap-1"><Users className="w-3 h-3" /> Cliente cadastrado</Label>
                        <Select value={selectedCustomerId} onValueChange={handleSelectCustomer}>
                          <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Selecionar..." /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="_none">— Manual —</SelectItem>
                            {customers.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    <Input className="h-8 text-xs" value={invoice.client_name} onChange={e => updateField('client_name', e.target.value)} placeholder="Nome do Cliente *" />
                    <Input className="h-8 text-xs" value={invoice.client_document} onChange={e => updateField('client_document', e.target.value)} placeholder="CPF/CNPJ" />
                    <Input className="h-8 text-xs" value={invoice.client_email} onChange={e => updateField('client_email', e.target.value)} placeholder="Email" />
                    <Input className="h-8 text-xs" value={invoice.client_phone} onChange={e => updateField('client_phone', e.target.value)} placeholder="Telefone" />
                    <Input className="h-8 text-xs" value={invoice.client_address} onChange={e => updateField('client_address', e.target.value)} placeholder="Endereço" />
                  </CardContent>
                </Card>
              </div>

              {/* Invoice Details */}
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Detalhes da Fatura</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div>
                      <Label className="text-xs">Título</Label>
                      <Input className="h-8 text-xs" value={invoice.invoice_title} onChange={e => updateField('invoice_title', e.target.value)} />
                    </div>
                    <div>
                      <Label className="text-xs">Nº Fatura</Label>
                      <Input className="h-8 text-xs" value={invoice.invoice_number} onChange={e => updateField('invoice_number', e.target.value)} />
                    </div>
                    <div>
                      <Label className="text-xs">Vencimento</Label>
                      <Input type="date" className="h-8 text-xs" value={invoice.due_date} onChange={e => updateField('due_date', e.target.value)} />
                    </div>
                    <div>
                      <Label className="text-xs">Pagamento</Label>
                      <Select value={invoice.payment_method} onValueChange={v => updateField('payment_method', v)}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {Object.entries(paymentMethods).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

              {/* PIX Key */}
                  {(invoice.payment_method === 'pix' || invoice.payment_method === 'mercadopago') && (
                    <div className="grid grid-cols-2 gap-2">
                      {invoice.payment_method === 'pix' && (
                        <>
                          <div>
                            <Label className="text-xs">Tipo Chave PIX</Label>
                            <Select value={invoice.pix_key_type} onValueChange={v => updateField('pix_key_type', v)}>
                              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="cpf">CPF</SelectItem>
                                <SelectItem value="cnpj">CNPJ</SelectItem>
                                <SelectItem value="email">Email</SelectItem>
                                <SelectItem value="phone">Telefone</SelectItem>
                                <SelectItem value="random">Aleatória</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label className="text-xs">Chave PIX</Label>
                            <Input className="h-8 text-xs" value={invoice.pix_key} onChange={e => updateField('pix_key', e.target.value)} placeholder="Sua chave PIX" />
                          </div>
                        </>
                      )}
                      {invoice.payment_method === 'mercadopago' && (
                        <div className="col-span-2">
                          <div className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-950/30 rounded text-xs text-blue-700 dark:text-blue-300">
                            <DollarSign className="w-3 h-3" />
                            <span>O link de pagamento Mercado Pago será gerado automaticamente ao salvar a fatura. O cliente poderá pagar com cartão, PIX ou boleto.</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Items */}
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold">Itens</Label>
                    {invoice.items.map(item => (
                      <div key={item.id} className="border rounded-lg p-2 space-y-1.5 sm:p-0 sm:border-0 sm:rounded-none sm:space-y-0">
                        {/* Mobile: stacked layout */}
                        <div className="sm:hidden space-y-1.5">
                          <Input className="h-8 text-xs" value={item.description} onChange={e => updateItem(item.id, { description: e.target.value })} placeholder="Descrição" />
                          <div className="flex gap-1.5 items-center">
                            <Input type="number" className="h-8 text-xs flex-1" min={1} value={item.quantity} onChange={e => updateItem(item.id, { quantity: parseInt(e.target.value) || 1 })} placeholder="Qtd" />
                            <Input type="number" className="h-8 text-xs flex-1" min={0} step={0.01} value={item.unit_price} onChange={e => updateItem(item.id, { unit_price: parseFloat(e.target.value) || 0 })} placeholder="Valor" />
                            <span className="text-xs font-medium px-2 py-1.5 bg-muted rounded whitespace-nowrap">{formatCurrency(item.quantity * item.unit_price)}</span>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive shrink-0" onClick={() => removeItem(item.id)} disabled={invoice.items.length <= 1}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        {/* Desktop: grid layout */}
                        <div className="hidden sm:grid grid-cols-12 gap-1 items-end">
                          <div className="col-span-5">
                            <Input className="h-8 text-xs" value={item.description} onChange={e => updateItem(item.id, { description: e.target.value })} placeholder="Descrição" />
                          </div>
                          <div className="col-span-2">
                            <Input type="number" className="h-8 text-xs" min={1} value={item.quantity} onChange={e => updateItem(item.id, { quantity: parseInt(e.target.value) || 1 })} />
                          </div>
                          <div className="col-span-2">
                            <Input type="number" className="h-8 text-xs" min={0} step={0.01} value={item.unit_price} onChange={e => updateItem(item.id, { unit_price: parseFloat(e.target.value) || 0 })} />
                          </div>
                          <div className="col-span-2 text-xs font-medium flex items-center h-8 px-1 bg-muted rounded">
                            {formatCurrency(item.quantity * item.unit_price)}
                          </div>
                          <div className="col-span-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeItem(item.id)} disabled={invoice.items.length <= 1}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                    <Button variant="outline" size="sm" onClick={addItem} className="w-full h-7 text-xs">
                      <Plus className="h-3 w-3 mr-1" /> Adicionar Item
                    </Button>
                  </div>

                  {/* Discount & Total */}
                  <div className="grid grid-cols-2 gap-2 items-end">
                    <div>
                      <Label className="text-xs">Desconto (R$)</Label>
                      <Input type="number" className="h-8 text-xs" min={0} step={0.01} value={invoice.discount_amount} onChange={e => updateField('discount_amount', parseFloat(e.target.value) || 0)} />
                    </div>
                    <div className="text-right">
                      <div className="bg-primary/10 px-3 py-2 rounded-lg">
                        {invoice.discount_amount > 0 && <p className="text-[10px] text-muted-foreground">Subtotal: {formatCurrency(subtotal)}</p>}
                        <p className="text-sm font-bold text-primary">{formatCurrency(total)}</p>
                      </div>
                    </div>
                  </div>

                  <Textarea className="text-xs" rows={2} value={invoice.notes} onChange={e => updateField('notes', e.target.value)} placeholder="Observações..." />
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="flex flex-wrap gap-2">
                <Button size="sm" onClick={() => handleSaveInvoice('pending')} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
                  {editingId ? 'Atualizar' : 'Salvar'}
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleSaveInvoice('draft')} disabled={saving}>
                  <FileText className="h-4 w-4 mr-1" /> Rascunho
                </Button>
                <Button size="sm" variant="outline" onClick={handleDownloadPDF}>
                  <Download className="h-4 w-4 mr-1" /> PDF
                </Button>
                <Button size="sm" variant="outline" onClick={handleNewInvoice}>
                  <Plus className="h-4 w-4 mr-1" /> Nova
                </Button>
              </div>
            </div>

            {/* RIGHT: Live Preview */}
            <div className="xl:col-span-2">
              <div className="sticky top-4">
                <Card className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Eye className="w-4 h-4 text-primary" /> Prévia da Fatura
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="bg-white text-black max-h-[80vh] overflow-y-auto">
                      <div className="p-4 text-white" style={{ backgroundColor: invoice.primary_color }}>
                        <div className="flex items-center gap-3">
                          {logoPreview && <img src={logoPreview} alt="Logo" className="w-10 h-10 object-contain rounded" />}
                          <div>
                            <h3 className="text-base font-bold">{invoice.invoice_title || 'FATURA'}</h3>
                            <p className="text-xs opacity-80">Nº {invoice.invoice_number}</p>
                          </div>
                          <div className="ml-auto text-right text-xs opacity-80">
                            <p>Venc: {invoice.due_date ? invoice.due_date.split('-').reverse().join('/') : ''}</p>
                          </div>
                        </div>
                      </div>
                      <div className="p-4 space-y-3 text-xs">
                        {invoice.company_name && (
                          <div>
                            <p className="font-semibold text-sm">{invoice.company_name}</p>
                            {invoice.company_document && <p className="text-gray-500">CNPJ/CPF: {invoice.company_document}</p>}
                            {invoice.company_address && <p className="text-gray-500">{invoice.company_address}</p>}
                          </div>
                        )}
                        <div className="bg-gray-50 p-2.5 rounded">
                          <p className="font-semibold mb-1" style={{ color: invoice.primary_color }}>CLIENTE</p>
                          <p className="text-sm">{invoice.client_name || '—'}</p>
                          {invoice.client_document && <p className="text-gray-500">CPF/CNPJ: {invoice.client_document}</p>}
                          {invoice.client_email && <p className="text-gray-500">{invoice.client_email}</p>}
                        </div>
                        <table className="w-full">
                          <thead>
                            <tr style={{ backgroundColor: invoice.primary_color, color: 'white' }}>
                              <th className="text-left p-1.5 rounded-tl text-[10px]">Descrição</th>
                              <th className="text-center p-1.5 text-[10px]">Qtd</th>
                              <th className="text-right p-1.5 text-[10px]">V.Unit</th>
                              <th className="text-right p-1.5 rounded-tr text-[10px]">Sub</th>
                            </tr>
                          </thead>
                          <tbody>
                            {invoice.items.map((item, idx) => (
                              <tr key={item.id} className={idx % 2 === 0 ? 'bg-gray-50' : ''}>
                                <td className="p-1.5 text-[11px]">{item.description || '—'}</td>
                                <td className="text-center p-1.5 text-[11px]">{item.quantity}</td>
                                <td className="text-right p-1.5 text-[11px]">{formatCurrency(item.unit_price)}</td>
                                <td className="text-right p-1.5 text-[11px] font-medium">{formatCurrency(item.quantity * item.unit_price)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        <div className="border-t pt-2 text-right" style={{ borderColor: invoice.primary_color }}>
                          {invoice.discount_amount > 0 && (
                            <>
                              <p className="text-gray-500">Subtotal: {formatCurrency(subtotal)}</p>
                              <p className="text-red-500">Desconto: − {formatCurrency(invoice.discount_amount)}</p>
                            </>
                          )}
                          <p className="text-sm font-bold mt-1" style={{ color: invoice.primary_color }}>Total: {formatCurrency(total)}</p>
                        </div>
                        <p className="text-gray-600">Pagamento: {paymentMethods[invoice.payment_method]}</p>
                        {invoice.pix_key && (
                          <div className="p-2 border rounded bg-gray-50">
                            <p className="font-bold text-[10px]" style={{ color: invoice.primary_color }}>CHAVE PIX</p>
                            <p className="text-[10px] text-gray-600">{invoice.pix_key_type?.toUpperCase()}: {invoice.pix_key}</p>
                          </div>
                        )}
                        {invoice.notes && <p className="italic text-gray-500">Obs: {invoice.notes}</p>}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* TAB: Lista de Faturas */}
        <TabsContent value="faturas" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="w-5 h-5" /> Faturas ({savedInvoices.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2 flex-wrap">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input placeholder="Buscar..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9 h-8 text-xs" />
                </div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-[140px] h-8 text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {Object.entries(statusLabels).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {filteredInvoices.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p>Nenhuma fatura encontrada.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredInvoices.map(inv => {
                    const st = statusLabels[inv.status] || statusLabels.draft;
                    const StatusIcon = st.icon;
                    return (
                      <div key={inv.id} className="p-3 border rounded-lg hover:bg-muted/50 transition-colors space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-medium text-sm truncate">{inv.invoice_number}</p>
                              <Badge variant="outline" className={`text-[10px] ${st.color}`}>
                                <StatusIcon className="w-3 h-3 mr-0.5" /> {st.label}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {inv.client_name || 'Sem cliente'} • {formatCurrency(inv.total_amount)} • Venc: {inv.due_date?.split('-').reverse().join('/')}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 flex-wrap">
                          {inv.status === 'pending' && (
                            <Button variant="ghost" size="sm" className="text-green-600 h-7 text-xs" onClick={() => handleUpdateStatus(inv.id, 'paid')}>
                              <CheckCircle className="w-3 h-3 mr-1" /> Pago
                            </Button>
                          )}
                          {inv.payment_method === 'mercadopago' && inv.status === 'pending' && (
                            <Button variant="ghost" size="sm" className="text-blue-600 h-7 text-xs" onClick={async () => {
                              try {
                                const { data, error } = await supabase.functions.invoke('invoice-mercadopago-payment', { body: { invoice_id: inv.id } });
                                if (error) throw error;
                                if (data?.error) throw new Error(data.error);
                                if (data?.checkout_url) {
                                  navigator.clipboard.writeText(data.checkout_url);
                                  toast({ title: "Link MP copiado! 💳", description: "Link de pagamento copiado para a área de transferência." });
                                }
                              } catch (err: any) {
                                toast({ title: "Erro", description: err.message, variant: "destructive" });
                              }
                            }} title="Gerar link Mercado Pago">
                              <DollarSign className="w-3 h-3 mr-1" /> MP
                            </Button>
                          )}
                          {inv.status === 'pending' && (
                            <Button variant="ghost" size="sm" className="h-7 text-xs" 
                              onClick={() => handleSendInvoiceEmail(inv.id, false)} 
                              disabled={sendingEmail === inv.id} title="Enviar por email">
                              {sendingEmail === inv.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Mail className="w-3 h-3" />}
                            </Button>
                          )}
                          {inv.status === 'pending' && (inv as any).reminder_sent && (
                            <Button variant="ghost" size="sm" className="h-7 text-xs text-orange-600" 
                              onClick={() => handleSendInvoiceEmail(inv.id, true)} 
                              disabled={sendingEmail === inv.id} title="Reenviar lembrete">
                              {sendingEmail === inv.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                            </Button>
                          )}
                          <Button variant="ghost" size="sm" className="h-7" onClick={() => handleCopyLink(inv.public_token)} title="Copiar link">
                            <Copy className="w-3 h-3" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-7" onClick={() => handleSendWhatsApp(inv)} title="WhatsApp">
                            <MessageCircle className="w-3 h-3" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-7" onClick={() => handleLoadInvoice(inv)} title="Editar">
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-7 text-destructive" onClick={() => handleDeleteInvoice(inv.id)} title="Excluir">
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: Planos Recorrentes */}
        <TabsContent value="recorrentes" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5" /> Planos ({recurringPlans.length})
                </CardTitle>
                <Button size="sm" className="text-xs" onClick={() => { setPlanDialogOpen(true); setEditingPlanId(null); setPlanForm({ plan_name: '', description: '', amount: 0, recurrence_type: 'monthly', next_invoice_date: '', pix_key: '', pix_key_type: 'cpf', customer_id: '', business_id: '', auto_send_email: false, reminder_days_before: 5, payment_method: 'pix' }); }}>
                  <Plus className="w-4 h-4 mr-1" /> Novo Plano
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {recurringPlans.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <RefreshCw className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p>Nenhum plano recorrente.</p>
                  <p className="text-xs">Crie um plano para gerar faturas automaticamente.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {recurringPlans.map(plan => {
                    const cust = customers.find(c => c.id === plan.customer_id);
                    return (
                      <div key={plan.id} className="p-3 border rounded-lg hover:bg-muted/50 space-y-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-medium text-sm">{plan.plan_name}</p>
                            <Badge variant="outline" className="text-[10px]">
                              {recurrenceLabels[plan.recurrence_type] || plan.recurrence_type}
                            </Badge>
                            {plan.is_active ? (
                              <Badge variant="outline" className="text-[10px] bg-green-100 text-green-800">Ativo</Badge>
                            ) : (
                              <Badge variant="outline" className="text-[10px] bg-gray-100 text-gray-600">Inativo</Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {cust?.name || 'Sem cliente'} • {formatCurrency(plan.amount)} • Próx: {plan.next_invoice_date?.split('-').reverse().join('/')}
                            {plan.auto_send_email && <span className="ml-1 text-green-600">• 📧 {plan.reminder_days_before}d antes</span>}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 flex-wrap">
                          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => handleGenerateFromPlan(plan)} title="Gerar 1 fatura">
                            <FileText className="w-3 h-3 mr-1" /> 1
                          </Button>
                          <Button variant="ghost" size="sm" className="h-7 text-xs text-primary" onClick={() => handleGenerateAllFromPlan(plan)} disabled={generatingBulk} title="Gerar todas as faturas do ano">
                            {generatingBulk ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Calendar className="w-3 h-3 mr-1" />} Todas
                          </Button>
                          <Button variant="ghost" size="sm" className="h-7" onClick={() => {
                            setEditingPlanId(plan.id);
                            setPlanForm({
                              plan_name: plan.plan_name, description: plan.description || '',
                              amount: plan.amount, recurrence_type: plan.recurrence_type,
                              next_invoice_date: plan.next_invoice_date, pix_key: plan.pix_key || '',
                              pix_key_type: plan.pix_key_type || 'cpf',
                              customer_id: plan.customer_id || '', business_id: plan.business_id || '',
                              auto_send_email: plan.auto_send_email || false,
                              reminder_days_before: plan.reminder_days_before || 5,
                              payment_method: plan.payment_method || 'pix',
                            });
                            setPlanDialogOpen(true);
                          }}>
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-7 text-destructive" onClick={() => handleDeletePlan(plan.id)}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Plan Dialog */}
      <Dialog open={planDialogOpen} onOpenChange={setPlanDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPlanId ? 'Editar Plano' : 'Novo Plano Recorrente'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Nome do Plano *</Label>
              <Input className="h-8 text-xs" value={planForm.plan_name} onChange={e => setPlanForm(p => ({ ...p, plan_name: e.target.value }))} placeholder="Ex: Hospedagem de Site" />
            </div>
            <div>
              <Label className="text-xs">Descrição</Label>
              <Input className="h-8 text-xs" value={planForm.description} onChange={e => setPlanForm(p => ({ ...p, description: e.target.value }))} placeholder="Detalhes do serviço" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Valor (R$) *</Label>
                <Input type="number" className="h-8 text-xs" min={0} step={0.01} value={planForm.amount} onChange={e => setPlanForm(p => ({ ...p, amount: parseFloat(e.target.value) || 0 }))} />
              </div>
              <div>
                <Label className="text-xs">Recorrência</Label>
                <Select value={planForm.recurrence_type} onValueChange={v => setPlanForm(p => ({ ...p, recurrence_type: v }))}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(recurrenceLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-xs">Próximo Vencimento</Label>
              <Input type="date" className="h-8 text-xs" value={planForm.next_invoice_date} onChange={e => setPlanForm(p => ({ ...p, next_invoice_date: e.target.value }))} />
            </div>
            {customers.length > 0 && (
              <div>
                <Label className="text-xs">Cliente</Label>
                <Select value={planForm.customer_id} onValueChange={v => setPlanForm(p => ({ ...p, customer_id: v }))}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Selecionar cliente..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">— Nenhum —</SelectItem>
                    {customers.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            {businesses.length > 0 && (
              <div>
                <Label className="text-xs">Negócio</Label>
                <Select value={planForm.business_id} onValueChange={v => setPlanForm(p => ({ ...p, business_id: v }))}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Selecionar negócio..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">— Nenhum —</SelectItem>
                    {businesses.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Tipo Chave PIX</Label>
                <Select value={planForm.pix_key_type} onValueChange={v => setPlanForm(p => ({ ...p, pix_key_type: v }))}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cpf">CPF</SelectItem>
                    <SelectItem value="cnpj">CNPJ</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="phone">Telefone</SelectItem>
                    <SelectItem value="random">Aleatória</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Chave PIX</Label>
                <Input className="h-8 text-xs" value={planForm.pix_key} onChange={e => setPlanForm(p => ({ ...p, pix_key: e.target.value }))} placeholder="Sua chave PIX" />
              </div>
            </div>
            <div>
              <Label className="text-xs">Forma de Pagamento</Label>
              <Select value={planForm.payment_method} onValueChange={v => setPlanForm(p => ({ ...p, payment_method: v }))}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(paymentMethods).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="border rounded-lg p-3 space-y-3 bg-muted/30">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-xs font-semibold flex items-center gap-1"><Mail className="w-3 h-3" /> Envio automático por email</Label>
                  <p className="text-[10px] text-muted-foreground">Enviar fatura para o email do cliente antes do vencimento</p>
                </div>
                <Switch checked={planForm.auto_send_email} onCheckedChange={v => setPlanForm(p => ({ ...p, auto_send_email: v }))} />
              </div>
              {planForm.auto_send_email && (
                <div>
                  <Label className="text-xs">Enviar quantos dias antes do vencimento?</Label>
                  <Select value={String(planForm.reminder_days_before)} onValueChange={v => setPlanForm(p => ({ ...p, reminder_days_before: parseInt(v) }))}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 dia antes</SelectItem>
                      <SelectItem value="3">3 dias antes</SelectItem>
                      <SelectItem value="5">5 dias antes</SelectItem>
                      <SelectItem value="7">7 dias antes</SelectItem>
                      <SelectItem value="10">10 dias antes</SelectItem>
                      <SelectItem value="15">15 dias antes</SelectItem>
                      <SelectItem value="30">30 dias antes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <Button onClick={handleSavePlan} disabled={savingPlan} className="w-full">
              {savingPlan ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
              {editingPlanId ? 'Atualizar Plano' : 'Criar Plano'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
