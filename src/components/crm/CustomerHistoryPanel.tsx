import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  Plus, 
  Wrench, 
  CreditCard, 
  Calendar, 
  DollarSign,
  Trash2,
  FileText,
  Edit,
  Receipt,
  Link,
  Download,
  CheckCircle2,
  Upload,
  Loader2
} from "lucide-react";
import { downloadReceiptPDF } from "@/utils/receiptPdfGenerator";

interface ServiceHistory {
  id: string;
  service_id: string | null;
  service_name: string;
  description: string | null;
  price: number;
  service_date: string;
  status: string;
  notes: string | null;
  created_at: string;
}

interface PaymentHistory {
  id: string;
  amount: number;
  payment_method: string;
  payment_date: string;
  reference_type: string | null;
  reference_id: string | null;
  description: string | null;
  notes: string | null;
  created_at: string;
}

interface SavedReceipt {
  id: string;
  receipt_number: string;
  receipt_data: any;
  total_amount: number;
  client_name: string | null;
  created_at: string;
}

interface Contract {
  id: string;
  title: string;
  description: string | null;
  file_url: string | null;
  file_name: string | null;
  contract_date: string;
  created_at: string;
}

interface CustomerHistoryPanelProps {
  contactId?: string;
  customerId?: string;
  contactName: string;
}

export const CustomerHistoryPanel = ({ contactId, customerId, contactName }: CustomerHistoryPanelProps) => {
  const entityId = contactId || customerId;
  const entityType = contactId ? 'contact' : 'customer';
  const { user } = useAuth();
  const { toast } = useToast();
  const [savedReceipts, setSavedReceipts] = useState<SavedReceipt[]>([]);
  const [linkedReceipts, setLinkedReceipts] = useState<SavedReceipt[]>([]);
  const [isReceiptDialogOpen, setIsReceiptDialogOpen] = useState(false);
  
  const [servicesHistory, setServicesHistory] = useState<ServiceHistory[]>([]);
  const [paymentsHistory, setPaymentsHistory] = useState<PaymentHistory[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  
  const [isServiceDialogOpen, setIsServiceDialogOpen] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [isContractDialogOpen, setIsContractDialogOpen] = useState(false);
  
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null);
  const [editingContractId, setEditingContractId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  
  const [newService, setNewService] = useState({
    service_id: "",
    service_name: "",
    description: "",
    price: 0,
    service_date: new Date().toISOString().slice(0, 16),
    status: "completed",
    notes: ""
  });
  
  const [newPayment, setNewPayment] = useState({
    amount: 0,
    payment_method: "pix",
    payment_date: new Date().toISOString().slice(0, 16),
    description: "",
    notes: ""
  });

  const [newContract, setNewContract] = useState({
    title: "",
    description: "",
    file_url: "",
    file_name: "",
    contract_date: new Date().toISOString().slice(0, 16),
  });

  useEffect(() => {
    if (user && entityId) {
      fetchAllHistory();
      fetchAvailableData();
    }
  }, [user, entityId]);

  const fetchAllHistory = async () => {
    if (!entityId) return;
    
    const filterCondition = entityType === 'contact' 
      ? `contact_id.eq.${entityId}`
      : `customer_id.eq.${entityId}`;
    
    const { data: services } = await supabase
      .from('customer_services_history')
      .select('*')
      .or(filterCondition)
      .order('service_date', { ascending: false });
    if (services) setServicesHistory(services as ServiceHistory[]);

    const { data: payments } = await supabase
      .from('customer_payments_history')
      .select('*')
      .or(filterCondition)
      .order('payment_date', { ascending: false });
    if (payments) setPaymentsHistory(payments as PaymentHistory[]);

    // Fetch contracts
    const { data: contractsData } = await supabase
      .from('customer_contracts')
      .select('*')
      .or(filterCondition)
      .order('contract_date', { ascending: false });
    if (contractsData) setContracts(contractsData as Contract[]);
  };

  const fetchAvailableData = async () => {
    const { data: allReceipts } = await supabase
      .from('saved_receipts')
      .select('*')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false });
    if (allReceipts) setSavedReceipts(allReceipts as SavedReceipt[]);

    const { data: customerReceipts } = await supabase
      .from('saved_receipts')
      .select('*')
      .eq('user_id', user!.id)
      .eq('client_name', contactName)
      .order('created_at', { ascending: false });
    if (customerReceipts) setLinkedReceipts(customerReceipts as SavedReceipt[]);
  };

  const handleLinkReceipt = async (receiptId: string) => {
    const { error } = await supabase
      .from('saved_receipts')
      .update({ client_name: contactName })
      .eq('id', receiptId);

    if (error) {
      toast({ title: "Erro ao vincular recibo", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Recibo vinculado ao cliente! 🧾" });
      setIsReceiptDialogOpen(false);
      fetchAvailableData();
    }
  };

  const handleUnlinkReceipt = async (receiptId: string) => {
    const { error } = await supabase
      .from('saved_receipts')
      .update({ client_name: null })
      .eq('id', receiptId);

    if (error) {
      toast({ title: "Erro ao desvincular recibo", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Recibo desvinculado" });
      fetchAvailableData();
    }
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const handleAddService = async () => {
    if (!newService.service_name || !entityId) {
      toast({ title: "Nome do serviço é obrigatório", variant: "destructive" });
      return;
    }

    const baseData = {
      user_id: user!.id,
      service_id: newService.service_id || null,
      service_name: newService.service_name,
      description: newService.description || null,
      price: newService.price,
      service_date: newService.service_date,
      status: newService.status,
      notes: newService.notes || null,
      contact_id: entityType === 'contact' ? entityId : null,
      customer_id: entityType === 'customer' ? entityId : null
    };

    const { error } = await supabase.from('customer_services_history').insert(baseData);

    if (error) {
      toast({ title: "Erro ao registrar serviço", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Serviço registrado! ✅" });
      setIsServiceDialogOpen(false);
      resetServiceForm();
      fetchAllHistory();
    }
  };

  const handleAddPayment = async () => {
    if (newPayment.amount <= 0 || !entityId) {
      toast({ title: "Valor deve ser maior que zero", variant: "destructive" });
      return;
    }

    const baseData = {
      user_id: user!.id,
      amount: newPayment.amount,
      payment_method: newPayment.payment_method,
      payment_date: newPayment.payment_date,
      description: newPayment.description || null,
      notes: newPayment.notes || null,
      contact_id: entityType === 'contact' ? entityId : null,
      customer_id: entityType === 'customer' ? entityId : null
    };

    const { error } = await supabase.from('customer_payments_history').insert(baseData);

    if (error) {
      toast({ title: "Erro ao registrar pagamento", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Pagamento registrado! 💰" });
      setIsPaymentDialogOpen(false);
      resetPaymentForm();
      fetchAllHistory();
    }
  };

  const handleContractFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "Arquivo deve ter no máximo 10MB", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user!.id}/contracts/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('chatbot-media')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('chatbot-media')
        .getPublicUrl(fileName);

      setNewContract({ ...newContract, file_url: publicUrl, file_name: file.name });
      toast({ title: "Arquivo enviado com sucesso!" });
    } catch (error: any) {
      toast({ title: "Erro ao enviar arquivo", description: error.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleAddContract = async () => {
    if (!newContract.title || !entityId) {
      toast({ title: "Título do contrato é obrigatório", variant: "destructive" });
      return;
    }

    const baseData = {
      user_id: user!.id,
      title: newContract.title,
      description: newContract.description || null,
      file_url: newContract.file_url || null,
      file_name: newContract.file_name || null,
      contract_date: newContract.contract_date,
      contact_id: entityType === 'contact' ? entityId : null,
      customer_id: entityType === 'customer' ? entityId : null
    };

    const { error } = await supabase.from('customer_contracts').insert(baseData);

    if (error) {
      toast({ title: "Erro ao registrar contrato", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Contrato registrado! 📄" });
      setIsContractDialogOpen(false);
      resetContractForm();
      fetchAllHistory();
    }
  };

  const handleEditContract = (contract: Contract) => {
    setEditingContractId(contract.id);
    setNewContract({
      title: contract.title,
      description: contract.description || "",
      file_url: contract.file_url || "",
      file_name: contract.file_name || "",
      contract_date: contract.contract_date.slice(0, 16),
    });
    setIsContractDialogOpen(true);
  };

  const handleUpdateContract = async () => {
    if (!editingContractId || !newContract.title) {
      toast({ title: "Título do contrato é obrigatório", variant: "destructive" });
      return;
    }
    const { error } = await supabase.from('customer_contracts').update({
      title: newContract.title,
      description: newContract.description || null,
      file_url: newContract.file_url || null,
      file_name: newContract.file_name || null,
      contract_date: newContract.contract_date,
    }).eq('id', editingContractId);

    if (error) {
      toast({ title: "Erro ao atualizar contrato", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Contrato atualizado! 📄" });
      setIsContractDialogOpen(false);
      setEditingContractId(null);
      resetContractForm();
      fetchAllHistory();
    }
  };

  const handleDeleteContract = async (id: string) => {
    const { error } = await supabase.from('customer_contracts').delete().eq('id', id);
    if (!error) {
      toast({ title: "Contrato removido" });
      fetchAllHistory();
    }
  };

  const handleDeleteService = async (id: string) => {
    const { error } = await supabase.from('customer_services_history').delete().eq('id', id);
    if (!error) {
      toast({ title: "Serviço removido" });
      fetchAllHistory();
    }
  };

  const handleDeletePayment = async (id: string) => {
    const { error } = await supabase.from('customer_payments_history').delete().eq('id', id);
    if (!error) {
      toast({ title: "Pagamento removido" });
      fetchAllHistory();
    }
  };

  const handleEditService = (service: ServiceHistory) => {
    setEditingServiceId(service.id);
    setNewService({
      service_id: service.service_id || "",
      service_name: service.service_name,
      description: service.description || "",
      price: Number(service.price),
      service_date: service.service_date.slice(0, 16),
      status: service.status,
      notes: service.notes || ""
    });
    setIsServiceDialogOpen(true);
  };

  const handleUpdateService = async () => {
    if (!editingServiceId || !newService.service_name) {
      toast({ title: "Nome do serviço é obrigatório", variant: "destructive" });
      return;
    }
    const { error } = await supabase.from('customer_services_history').update({
      service_name: newService.service_name,
      description: newService.description || null,
      price: newService.price,
      service_date: newService.service_date,
      status: newService.status,
      notes: newService.notes || null,
    }).eq('id', editingServiceId);

    if (error) {
      toast({ title: "Erro ao atualizar serviço", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Serviço atualizado! ✅" });
      setIsServiceDialogOpen(false);
      setEditingServiceId(null);
      resetServiceForm();
      fetchAllHistory();
    }
  };

  const handleEditPayment = (payment: PaymentHistory) => {
    setEditingPaymentId(payment.id);
    setNewPayment({
      amount: Number(payment.amount),
      payment_method: payment.payment_method,
      payment_date: payment.payment_date.slice(0, 16),
      description: payment.description || "",
      notes: payment.notes || ""
    });
    setIsPaymentDialogOpen(true);
  };

  const handleUpdatePayment = async () => {
    if (!editingPaymentId || newPayment.amount <= 0) {
      toast({ title: "Valor deve ser maior que zero", variant: "destructive" });
      return;
    }
    const { error } = await supabase.from('customer_payments_history').update({
      amount: newPayment.amount,
      payment_method: newPayment.payment_method,
      payment_date: newPayment.payment_date,
      description: newPayment.description || null,
      notes: newPayment.notes || null,
    }).eq('id', editingPaymentId);

    if (error) {
      toast({ title: "Erro ao atualizar pagamento", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Pagamento atualizado! 💰" });
      setIsPaymentDialogOpen(false);
      setEditingPaymentId(null);
      resetPaymentForm();
      fetchAllHistory();
    }
  };

  const resetServiceForm = () => {
    setNewService({
      service_id: "",
      service_name: "",
      description: "",
      price: 0,
      service_date: new Date().toISOString().slice(0, 16),
      status: "completed",
      notes: ""
    });
  };

  const resetPaymentForm = () => {
    setNewPayment({
      amount: 0,
      payment_method: "pix",
      payment_date: new Date().toISOString().slice(0, 16),
      description: "",
      notes: ""
    });
  };

  const resetContractForm = () => {
    setNewContract({
      title: "",
      description: "",
      file_url: "",
      file_name: "",
      contract_date: new Date().toISOString().slice(0, 16),
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500/20 text-green-500';
      case 'scheduled': return 'bg-blue-500/20 text-blue-500';
      case 'in_progress': return 'bg-yellow-500/20 text-yellow-500';
      case 'cancelled': return 'bg-red-500/20 text-red-500';
      default: return 'bg-gray-500/20 text-gray-500';
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    const methods: Record<string, string> = {
      cash: "Dinheiro",
      pix: "PIX",
      credit_card: "Cartão de Crédito",
      debit_card: "Cartão de Débito",
      bank_transfer: "Transferência",
      boleto: "Boleto",
      other: "Outro"
    };
    return methods[method] || method;
  };

  const totalServices = servicesHistory.reduce((sum, s) => sum + Number(s.price), 0);
  const totalPayments = paymentsHistory.reduce((sum, p) => sum + Number(p.amount), 0);
  const totalReceipts = linkedReceipts.reduce((sum, r) => sum + Number(r.total_amount), 0);
  const unlinkedReceipts = savedReceipts.filter(r => !r.client_name || r.client_name !== contactName);

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-3 bg-blue-500/10 border-blue-500/30">
          <div className="flex items-center gap-2">
            <Wrench className="w-4 h-4 text-blue-500" />
            <div>
              <p className="text-xs text-muted-foreground">Serviços</p>
              <p className="font-semibold text-blue-500">R$ {totalServices.toFixed(2)}</p>
            </div>
          </div>
        </Card>
        <Card className="p-3 bg-green-500/10 border-green-500/30">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-green-500" />
            <div>
              <p className="text-xs text-muted-foreground">Pagamentos</p>
              <p className="font-semibold text-green-500">R$ {totalPayments.toFixed(2)}</p>
            </div>
          </div>
        </Card>
        <Card className="p-3 bg-amber-500/10 border-amber-500/30">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-amber-500" />
            <div>
              <p className="text-xs text-muted-foreground">Recibos</p>
              <p className="font-semibold text-amber-500">R$ {totalReceipts.toFixed(2)}</p>
            </div>
          </div>
        </Card>
        <Card className="p-3 bg-indigo-500/10 border-indigo-500/30">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-indigo-500" />
            <div>
              <p className="text-xs text-muted-foreground">Contratos</p>
              <p className="font-semibold text-indigo-500">{contracts.length}</p>
            </div>
          </div>
        </Card>
      </div>

      <Tabs defaultValue="services" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="services" className="text-xs">
            <Wrench className="w-3 h-3 mr-1" /> Serviços ({servicesHistory.length})
          </TabsTrigger>
          <TabsTrigger value="payments" className="text-xs">
            <CreditCard className="w-3 h-3 mr-1" /> Pagamentos ({paymentsHistory.length})
          </TabsTrigger>
          <TabsTrigger value="receipts" className="text-xs">
            <Receipt className="w-3 h-3 mr-1" /> Recibos ({linkedReceipts.length})
          </TabsTrigger>
          <TabsTrigger value="contracts" className="text-xs">
            <FileText className="w-3 h-3 mr-1" /> Contratos ({contracts.length})
          </TabsTrigger>
        </TabsList>

        {/* Services Tab - Only custom/avulso */}
        <TabsContent value="services" className="space-y-3">
          <Dialog open={isServiceDialogOpen} onOpenChange={(open) => {
            setIsServiceDialogOpen(open);
            if (!open) { setEditingServiceId(null); resetServiceForm(); }
          }}>
            <DialogTrigger asChild>
              <Button size="sm" className="w-full">
                <Plus className="w-4 h-4 mr-2" /> Registrar Serviço
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingServiceId ? 'Editar' : 'Registrar'} Serviço para {contactName}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <Label>Nome do Serviço *</Label>
                  <Input
                    value={newService.service_name}
                    onChange={(e) => setNewService({ ...newService, service_name: e.target.value })}
                    placeholder="Ex: Consultoria, Manutenção..."
                  />
                </div>
                <div>
                  <Label>Descrição</Label>
                  <Input
                    value={newService.description}
                    onChange={(e) => setNewService({ ...newService, description: e.target.value })}
                    placeholder="Detalhes do serviço"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Valor (R$)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={newService.price}
                      onChange={(e) => setNewService({ ...newService, price: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <Label>Status</Label>
                    <Select value={newService.status} onValueChange={(v) => setNewService({ ...newService, status: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="scheduled">Agendado</SelectItem>
                        <SelectItem value="in_progress">Em Andamento</SelectItem>
                        <SelectItem value="completed">Concluído</SelectItem>
                        <SelectItem value="cancelled">Cancelado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Data do Serviço</Label>
                  <Input
                    type="datetime-local"
                    value={newService.service_date}
                    onChange={(e) => setNewService({ ...newService, service_date: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Observações</Label>
                  <Textarea
                    value={newService.notes}
                    onChange={(e) => setNewService({ ...newService, notes: e.target.value })}
                    placeholder="Notas adicionais..."
                    rows={2}
                  />
                </div>
                <Button onClick={editingServiceId ? handleUpdateService : handleAddService} className="w-full">
                  {editingServiceId ? 'Atualizar Serviço' : 'Salvar Serviço'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <div className="space-y-2 max-h-[250px] overflow-y-auto">
            {servicesHistory.length === 0 ? (
              <p className="text-center text-muted-foreground py-4 text-sm">Nenhum serviço registrado</p>
            ) : (
              servicesHistory.map(service => (
                <Card key={service.id} className="p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-sm">{service.service_name}</h4>
                        <Badge className={getStatusColor(service.status)} variant="secondary">
                          {service.status === 'completed' ? 'Concluído' : 
                           service.status === 'scheduled' ? 'Agendado' :
                           service.status === 'in_progress' ? 'Em Andamento' : 'Cancelado'}
                        </Badge>
                      </div>
                      {service.description && (
                        <p className="text-xs text-muted-foreground mt-1">{service.description}</p>
                      )}
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(service.service_date).toLocaleDateString('pt-BR')}
                        </span>
                        <span className="flex items-center gap-1 text-green-500 font-medium">
                          <DollarSign className="w-3 h-3" />
                          R$ {Number(service.price).toFixed(2)}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <Button size="icon" variant="ghost" onClick={() => handleEditService(service)}>
                        <Edit className="w-4 h-4 text-primary" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => handleDeleteService(service.id)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Payments Tab */}
        <TabsContent value="payments" className="space-y-3">
          <Dialog open={isPaymentDialogOpen} onOpenChange={(open) => {
            setIsPaymentDialogOpen(open);
            if (!open) { setEditingPaymentId(null); resetPaymentForm(); }
          }}>
            <DialogTrigger asChild>
              <Button size="sm" className="w-full">
                <Plus className="w-4 h-4 mr-2" /> Registrar Pagamento
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingPaymentId ? 'Editar' : 'Registrar'} Pagamento de {contactName}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <Label>Valor (R$) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={newPayment.amount}
                    onChange={(e) => setNewPayment({ ...newPayment, amount: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label>Forma de Pagamento</Label>
                  <Select value={newPayment.payment_method} onValueChange={(v) => setNewPayment({ ...newPayment, payment_method: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Dinheiro</SelectItem>
                      <SelectItem value="pix">PIX</SelectItem>
                      <SelectItem value="credit_card">Cartão de Crédito</SelectItem>
                      <SelectItem value="debit_card">Cartão de Débito</SelectItem>
                      <SelectItem value="bank_transfer">Transferência</SelectItem>
                      <SelectItem value="boleto">Boleto</SelectItem>
                      <SelectItem value="other">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Data do Pagamento</Label>
                  <Input
                    type="datetime-local"
                    value={newPayment.payment_date}
                    onChange={(e) => setNewPayment({ ...newPayment, payment_date: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Descrição</Label>
                  <Input
                    value={newPayment.description}
                    onChange={(e) => setNewPayment({ ...newPayment, description: e.target.value })}
                    placeholder="Ex: Pagamento do serviço de corte"
                  />
                </div>
                <div>
                  <Label>Observações</Label>
                  <Textarea
                    value={newPayment.notes}
                    onChange={(e) => setNewPayment({ ...newPayment, notes: e.target.value })}
                    placeholder="Notas adicionais..."
                    rows={2}
                  />
                </div>
                <Button onClick={editingPaymentId ? handleUpdatePayment : handleAddPayment} className="w-full">
                  {editingPaymentId ? 'Atualizar Pagamento' : 'Salvar Pagamento'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <div className="space-y-2 max-h-[250px] overflow-y-auto">
            {paymentsHistory.length === 0 ? (
              <p className="text-center text-muted-foreground py-4 text-sm">Nenhum pagamento registrado</p>
            ) : (
              paymentsHistory.map(payment => (
                <Card key={payment.id} className="p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {getPaymentMethodLabel(payment.payment_method)}
                        </Badge>
                        <span className="text-green-500 font-semibold">
                          R$ {Number(payment.amount).toFixed(2)}
                        </span>
                      </div>
                      {payment.description && (
                        <p className="text-xs text-muted-foreground mt-1">{payment.description}</p>
                      )}
                      <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        {new Date(payment.payment_date).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <Button size="icon" variant="ghost" onClick={() => handleEditPayment(payment)}>
                        <Edit className="w-4 h-4 text-primary" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => handleDeletePayment(payment.id)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Receipts Tab */}
        <TabsContent value="receipts" className="space-y-3">
          <Dialog open={isReceiptDialogOpen} onOpenChange={setIsReceiptDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="w-full">
                <Link className="w-4 h-4 mr-2" /> Vincular Recibo Existente
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Vincular Recibo a {contactName}</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 mt-4 max-h-[400px] overflow-y-auto">
                {unlinkedReceipts.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4 text-sm">
                    Nenhum recibo disponível para vincular. Crie recibos no Gerador de Recibos primeiro.
                  </p>
                ) : (
                  unlinkedReceipts.map(receipt => {
                    const receiptTitle = receipt.receipt_data?.receipt_title || receipt.receipt_data?.title || '';
                    return (
                      <Card key={receipt.id} className="p-3">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm">{receipt.receipt_number}</p>
                            {receiptTitle && (
                              <p className="text-xs font-semibold text-muted-foreground truncate">{receiptTitle}</p>
                            )}
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                              <span>{new Date(receipt.created_at).toLocaleDateString('pt-BR')}</span>
                              <span className="font-semibold text-green-500">
                                {formatCurrency(receipt.total_amount)}
                              </span>
                              {receipt.client_name && (
                                <Badge variant="outline" className="text-[10px]">{receipt.client_name}</Badge>
                              )}
                            </div>
                          </div>
                          <Button size="sm" onClick={() => handleLinkReceipt(receipt.id)}>
                            <Link className="w-3 h-3 mr-1" /> Vincular
                          </Button>
                        </div>
                      </Card>
                    );
                  })
                )}
              </div>
            </DialogContent>
          </Dialog>

          <div className="space-y-2 max-h-[250px] overflow-y-auto">
            {linkedReceipts.length === 0 ? (
              <p className="text-center text-muted-foreground py-4 text-sm">Nenhum recibo vinculado a este cliente</p>
            ) : (
              linkedReceipts.map(receipt => {
                const receiptTitle = receipt.receipt_data?.receipt_title || receipt.receipt_data?.title || '';
                const paymentMethod = receipt.receipt_data?.payment_method;
                const methodLabels: Record<string, string> = {
                  pix: 'PIX', cash: 'Dinheiro', credit_card: 'Cartão Crédito',
                  debit_card: 'Cartão Débito', bank_transfer: 'Transferência', boleto: 'Boleto', other: 'Outro',
                };
                return (
                  <Card key={receipt.id} className="p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-sm">{receipt.receipt_number}</h4>
                          <Badge className="bg-green-500/20 text-green-500 text-[10px] h-5 border-0">
                            <CheckCircle2 className="w-3 h-3 mr-0.5" /> Pago
                          </Badge>
                        </div>
                        {receiptTitle && (
                          <p className="text-sm font-semibold text-muted-foreground mt-0.5">{receiptTitle}</p>
                        )}
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(receipt.receipt_data?.date || receipt.created_at).toLocaleDateString('pt-BR')}
                          </span>
                          {paymentMethod && (
                            <span>{methodLabels[paymentMethod] || paymentMethod}</span>
                          )}
                          <span className="flex items-center gap-1 text-amber-500 font-medium">
                            <DollarSign className="w-3 h-3" />
                            {formatCurrency(receipt.total_amount)}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          title="Baixar PDF"
                          onClick={() => {
                            try {
                              downloadReceiptPDF(receipt.receipt_data, receipt.receipt_data?.logo_url || undefined);
                            } catch {}
                          }}
                        >
                          <Download className="w-4 h-4 text-primary" />
                        </Button>
                        <Button size="icon" variant="ghost" title="Desvincular" onClick={() => handleUnlinkReceipt(receipt.id)}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>

        {/* Contracts Tab */}
        <TabsContent value="contracts" className="space-y-3">
          <Dialog open={isContractDialogOpen} onOpenChange={(open) => {
            setIsContractDialogOpen(open);
            if (!open) { setEditingContractId(null); resetContractForm(); }
          }}>
            <DialogTrigger asChild>
              <Button size="sm" className="w-full">
                <Plus className="w-4 h-4 mr-2" /> Adicionar Contrato
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingContractId ? 'Editar' : 'Adicionar'} Contrato de {contactName}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <Label>Título do Contrato *</Label>
                  <Input
                    value={newContract.title}
                    onChange={(e) => setNewContract({ ...newContract, title: e.target.value })}
                    placeholder="Ex: Contrato de Prestação de Serviços"
                  />
                </div>
                <div>
                  <Label>Descrição</Label>
                  <Textarea
                    value={newContract.description}
                    onChange={(e) => setNewContract({ ...newContract, description: e.target.value })}
                    placeholder="Detalhes do contrato..."
                    rows={2}
                  />
                </div>
                <div>
                  <Label>Data do Contrato</Label>
                  <Input
                    type="datetime-local"
                    value={newContract.contract_date}
                    onChange={(e) => setNewContract({ ...newContract, contract_date: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Anexar Arquivo</Label>
                  {newContract.file_name && (
                    <div className="flex items-center gap-2 mb-2 p-2 bg-muted rounded">
                      <FileText className="w-4 h-4 text-indigo-500" />
                      <span className="text-sm truncate flex-1">{newContract.file_name}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setNewContract({ ...newContract, file_url: "", file_name: "" })}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Input
                      type="file"
                      accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                      onChange={handleContractFileUpload}
                      disabled={uploading}
                      className="cursor-pointer"
                    />
                    {uploading && <Loader2 className="w-4 h-4 animate-spin" />}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">PDF, DOC, DOCX, PNG ou JPG (máx. 10MB)</p>
                </div>
                <Button onClick={editingContractId ? handleUpdateContract : handleAddContract} className="w-full">
                  {editingContractId ? 'Atualizar Contrato' : 'Salvar Contrato'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <div className="space-y-2 max-h-[250px] overflow-y-auto">
            {contracts.length === 0 ? (
              <p className="text-center text-muted-foreground py-4 text-sm">Nenhum contrato registrado</p>
            ) : (
              contracts.map(contract => (
                <Card key={contract.id} className="p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{contract.title}</h4>
                      {contract.description && (
                        <p className="text-xs text-muted-foreground mt-1">{contract.description}</p>
                      )}
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(contract.contract_date).toLocaleDateString('pt-BR')}
                        </span>
                        {contract.file_name && (
                          <span className="flex items-center gap-1 text-indigo-500">
                            <FileText className="w-3 h-3" />
                            {contract.file_name}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      {contract.file_url && (
                        <Button size="icon" variant="ghost" title="Baixar" onClick={() => window.open(contract.file_url!, '_blank')}>
                          <Download className="w-4 h-4 text-primary" />
                        </Button>
                      )}
                      <Button size="icon" variant="ghost" onClick={() => handleEditContract(contract)}>
                        <Edit className="w-4 h-4 text-primary" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => handleDeleteContract(contract.id)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
