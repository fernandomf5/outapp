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
  ShoppingCart, 
  CreditCard, 
  Calendar, 
  DollarSign,
  Trash2,
  Clock,
  Package,
  FileText,
  Edit,
  Receipt,
  Link,
  Download,
  CheckCircle2
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

interface PurchaseHistory {
  id: string;
  product_id: string | null;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  purchase_date: string;
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

interface UserService {
  id: string;
  name: string;
  price: number;
}

interface Product {
  id: string;
  name: string;
  price: number;
}

interface CustomerHistoryPanelProps {
  contactId?: string;
  customerId?: string;
  contactName: string;
}

export const CustomerHistoryPanel = ({ contactId, customerId, contactName }: CustomerHistoryPanelProps) => {
  // Support both contact_id and customer_id
  const entityId = contactId || customerId;
  const entityType = contactId ? 'contact' : 'customer';
  const { user } = useAuth();
  const { toast } = useToast();
  
  // States for history data
  const [servicesHistory, setServicesHistory] = useState<ServiceHistory[]>([]);
  const [purchasesHistory, setPurchasesHistory] = useState<PurchaseHistory[]>([]);
  const [paymentsHistory, setPaymentsHistory] = useState<PaymentHistory[]>([]);
  
  // States for available services/products
  const [availableServices, setAvailableServices] = useState<UserService[]>([]);
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  
  // Dialog states
  const [isServiceDialogOpen, setIsServiceDialogOpen] = useState(false);
  const [isPurchaseDialogOpen, setIsPurchaseDialogOpen] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  
  // Edit states
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [editingPurchaseId, setEditingPurchaseId] = useState<string | null>(null);
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null);
  
  // Form states
  const [serviceInputMode, setServiceInputMode] = useState<"select" | "custom">("select");
  const [newService, setNewService] = useState({
    service_id: "",
    service_name: "",
    description: "",
    price: 0,
    service_date: new Date().toISOString().slice(0, 16),
    status: "completed",
    notes: ""
  });
  
  const [newPurchase, setNewPurchase] = useState({
    product_id: "",
    product_name: "",
    quantity: 1,
    unit_price: 0,
    purchase_date: new Date().toISOString().slice(0, 16),
    notes: ""
  });
  
  const [newPayment, setNewPayment] = useState({
    amount: 0,
    payment_method: "pix",
    payment_date: new Date().toISOString().slice(0, 16),
    description: "",
    notes: ""
  });

  useEffect(() => {
    if (user && entityId) {
      fetchAllHistory();
      fetchAvailableData();
    }
  }, [user, entityId]);

  const fetchAllHistory = async () => {
    if (!entityId) return;
    
    // Build filter based on entity type
    const filterCondition = entityType === 'contact' 
      ? `contact_id.eq.${entityId}`
      : `customer_id.eq.${entityId}`;
    
    // Fetch services history
    const { data: services } = await supabase
      .from('customer_services_history')
      .select('*')
      .or(filterCondition)
      .order('service_date', { ascending: false });
    if (services) setServicesHistory(services as ServiceHistory[]);

    // Fetch purchases history
    const { data: purchases } = await supabase
      .from('customer_purchases_history')
      .select('*')
      .or(filterCondition)
      .order('purchase_date', { ascending: false });
    if (purchases) setPurchasesHistory(purchases as PurchaseHistory[]);

    // Fetch payments history
    const { data: payments } = await supabase
      .from('customer_payments_history')
      .select('*')
      .or(filterCondition)
      .order('payment_date', { ascending: false });
    if (payments) setPaymentsHistory(payments as PaymentHistory[]);
  };

  const fetchAvailableData = async () => {
    // Fetch user's services
    const { data: services } = await supabase
      .from('user_services')
      .select('id, name, price')
      .eq('user_id', user!.id);
    if (services) setAvailableServices(services);

    // Fetch user's products
    const { data: products } = await supabase
      .from('products')
      .select('id, name, price')
      .eq('user_id', user!.id);
    if (products) setAvailableProducts(products);
  };

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

  const handleAddPurchase = async () => {
    if (!newPurchase.product_name || !entityId) {
      toast({ title: "Nome do produto é obrigatório", variant: "destructive" });
      return;
    }

    const totalPrice = newPurchase.quantity * newPurchase.unit_price;

    const baseData = {
      user_id: user!.id,
      product_id: newPurchase.product_id || null,
      product_name: newPurchase.product_name,
      quantity: newPurchase.quantity,
      unit_price: newPurchase.unit_price,
      total_price: totalPrice,
      purchase_date: newPurchase.purchase_date,
      notes: newPurchase.notes || null,
      contact_id: entityType === 'contact' ? entityId : null,
      customer_id: entityType === 'customer' ? entityId : null
    };

    const { error } = await supabase.from('customer_purchases_history').insert(baseData);

    if (error) {
      toast({ title: "Erro ao registrar compra", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Compra registrada! 🛒" });
      setIsPurchaseDialogOpen(false);
      resetPurchaseForm();
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

  const handleDeleteService = async (id: string) => {
    const { error } = await supabase.from('customer_services_history').delete().eq('id', id);
    if (!error) {
      toast({ title: "Serviço removido" });
      fetchAllHistory();
    }
  };

  const handleDeletePurchase = async (id: string) => {
    const { error } = await supabase.from('customer_purchases_history').delete().eq('id', id);
    if (!error) {
      toast({ title: "Compra removida" });
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
    setServiceInputMode("custom");
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

  const handleEditPurchase = (purchase: PurchaseHistory) => {
    setEditingPurchaseId(purchase.id);
    setNewPurchase({
      product_id: purchase.product_id || "",
      product_name: purchase.product_name,
      quantity: purchase.quantity,
      unit_price: Number(purchase.unit_price),
      purchase_date: purchase.purchase_date.slice(0, 16),
      notes: purchase.notes || ""
    });
    setIsPurchaseDialogOpen(true);
  };

  const handleUpdatePurchase = async () => {
    if (!editingPurchaseId || !newPurchase.product_name) {
      toast({ title: "Nome do produto é obrigatório", variant: "destructive" });
      return;
    }
    const totalPrice = newPurchase.quantity * newPurchase.unit_price;
    const { error } = await supabase.from('customer_purchases_history').update({
      product_name: newPurchase.product_name,
      quantity: newPurchase.quantity,
      unit_price: newPurchase.unit_price,
      total_price: totalPrice,
      purchase_date: newPurchase.purchase_date,
      notes: newPurchase.notes || null,
    }).eq('id', editingPurchaseId);

    if (error) {
      toast({ title: "Erro ao atualizar compra", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Compra atualizada! 🛒" });
      setIsPurchaseDialogOpen(false);
      setEditingPurchaseId(null);
      resetPurchaseForm();
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
    setServiceInputMode("select");
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

  const resetPurchaseForm = () => {
    setNewPurchase({
      product_id: "",
      product_name: "",
      quantity: 1,
      unit_price: 0,
      purchase_date: new Date().toISOString().slice(0, 16),
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

  const handleServiceSelect = (serviceId: string) => {
    const service = availableServices.find(s => s.id === serviceId);
    if (service) {
      setNewService({
        ...newService,
        service_id: serviceId,
        service_name: service.name,
        price: service.price
      });
    }
  };

  const handleProductSelect = (productId: string) => {
    const product = availableProducts.find(p => p.id === productId);
    if (product) {
      setNewPurchase({
        ...newPurchase,
        product_id: productId,
        product_name: product.name,
        unit_price: product.price
      });
    }
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
  const totalPurchases = purchasesHistory.reduce((sum, p) => sum + Number(p.total_price), 0);
  const totalPayments = paymentsHistory.reduce((sum, p) => sum + Number(p.amount), 0);

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-3 bg-blue-500/10 border-blue-500/30">
          <div className="flex items-center gap-2">
            <Wrench className="w-4 h-4 text-blue-500" />
            <div>
              <p className="text-xs text-muted-foreground">Serviços</p>
              <p className="font-semibold text-blue-500">R$ {totalServices.toFixed(2)}</p>
            </div>
          </div>
        </Card>
        <Card className="p-3 bg-purple-500/10 border-purple-500/30">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-4 h-4 text-purple-500" />
            <div>
              <p className="text-xs text-muted-foreground">Compras</p>
              <p className="font-semibold text-purple-500">R$ {totalPurchases.toFixed(2)}</p>
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
      </div>

      <Tabs defaultValue="services" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="services" className="text-xs">
            <Wrench className="w-3 h-3 mr-1" /> Serviços ({servicesHistory.length})
          </TabsTrigger>
          <TabsTrigger value="purchases" className="text-xs">
            <ShoppingCart className="w-3 h-3 mr-1" /> Compras ({purchasesHistory.length})
          </TabsTrigger>
          <TabsTrigger value="payments" className="text-xs">
            <CreditCard className="w-3 h-3 mr-1" /> Pagamentos ({paymentsHistory.length})
          </TabsTrigger>
        </TabsList>

        {/* Services Tab */}
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
                {!editingServiceId && availableServices.length > 0 && (
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant={serviceInputMode === "select" ? "default" : "outline"}
                      onClick={() => {
                        setServiceInputMode("select");
                        setNewService({ ...newService, service_id: "", service_name: "", price: 0 });
                      }}
                      className="flex-1"
                    >
                      Serviço Cadastrado
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={serviceInputMode === "custom" ? "default" : "outline"}
                      onClick={() => {
                        setServiceInputMode("custom");
                        setNewService({ ...newService, service_id: "", service_name: "", price: 0 });
                      }}
                      className="flex-1"
                    >
                      Serviço Avulso
                    </Button>
                  </div>
                )}

                {serviceInputMode === "select" && availableServices.length > 0 ? (
                  <div>
                    <Label>Selecionar Serviço Cadastrado</Label>
                    <Select onValueChange={handleServiceSelect}>
                      <SelectTrigger>
                        <SelectValue placeholder="Escolha um serviço..." />
                      </SelectTrigger>
                      <SelectContent>
                        {availableServices.map(s => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.name} - R$ {s.price}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <div>
                    <Label>Nome do Serviço *</Label>
                    <Input
                      value={newService.service_name}
                      onChange={(e) => setNewService({ ...newService, service_name: e.target.value })}
                      placeholder="Ex: Consultoria, Manutenção..."
                    />
                  </div>
                )}
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

        {/* Purchases Tab */}
        <TabsContent value="purchases" className="space-y-3">
          <Dialog open={isPurchaseDialogOpen} onOpenChange={(open) => {
            setIsPurchaseDialogOpen(open);
            if (!open) { setEditingPurchaseId(null); resetPurchaseForm(); }
          }}>
            <DialogTrigger asChild>
              <Button size="sm" className="w-full">
                <Plus className="w-4 h-4 mr-2" /> Registrar Compra
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingPurchaseId ? 'Editar' : 'Registrar'} Compra de {contactName}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                {availableProducts.length > 0 && (
                  <div>
                    <Label>Selecionar Produto Cadastrado</Label>
                    <Select onValueChange={handleProductSelect}>
                      <SelectTrigger>
                        <SelectValue placeholder="Escolha um produto..." />
                      </SelectTrigger>
                      <SelectContent>
                        {availableProducts.map(p => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name} - R$ {p.price}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div>
                  <Label>Nome do Produto *</Label>
                  <Input
                    value={newPurchase.product_name}
                    onChange={(e) => setNewPurchase({ ...newPurchase, product_name: e.target.value })}
                    placeholder="Ex: Camiseta"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Quantidade</Label>
                    <Input
                      type="number"
                      min="1"
                      value={newPurchase.quantity}
                      onChange={(e) => setNewPurchase({ ...newPurchase, quantity: parseInt(e.target.value) || 1 })}
                    />
                  </div>
                  <div>
                    <Label>Preço Unitário (R$)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={newPurchase.unit_price}
                      onChange={(e) => setNewPurchase({ ...newPurchase, unit_price: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                </div>
                <div className="p-2 bg-muted rounded-md">
                  <p className="text-sm">
                    Total: <strong>R$ {(newPurchase.quantity * newPurchase.unit_price).toFixed(2)}</strong>
                  </p>
                </div>
                <div>
                  <Label>Data da Compra</Label>
                  <Input
                    type="datetime-local"
                    value={newPurchase.purchase_date}
                    onChange={(e) => setNewPurchase({ ...newPurchase, purchase_date: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Observações</Label>
                  <Textarea
                    value={newPurchase.notes}
                    onChange={(e) => setNewPurchase({ ...newPurchase, notes: e.target.value })}
                    placeholder="Notas adicionais..."
                    rows={2}
                  />
                </div>
                <Button onClick={editingPurchaseId ? handleUpdatePurchase : handleAddPurchase} className="w-full">
                  {editingPurchaseId ? 'Atualizar Compra' : 'Salvar Compra'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <div className="space-y-2 max-h-[250px] overflow-y-auto">
            {purchasesHistory.length === 0 ? (
              <p className="text-center text-muted-foreground py-4 text-sm">Nenhuma compra registrada</p>
            ) : (
              purchasesHistory.map(purchase => (
                <Card key={purchase.id} className="p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{purchase.product_name}</h4>
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Package className="w-3 h-3" />
                          {purchase.quantity}x R$ {Number(purchase.unit_price).toFixed(2)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(purchase.purchase_date).toLocaleDateString('pt-BR')}
                        </span>
                        <span className="flex items-center gap-1 text-purple-500 font-medium">
                          <DollarSign className="w-3 h-3" />
                          R$ {Number(purchase.total_price).toFixed(2)}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <Button size="icon" variant="ghost" onClick={() => handleEditPurchase(purchase)}>
                        <Edit className="w-4 h-4 text-primary" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => handleDeletePurchase(purchase.id)}>
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
      </Tabs>
    </div>
  );
};
