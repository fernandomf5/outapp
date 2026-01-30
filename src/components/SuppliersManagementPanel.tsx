import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Plus, Search, Edit, Trash2, Building, Phone, Mail, Globe, DollarSign, FileText, Download, User, MapPin } from "lucide-react";
import { DeleteConfirmDialog } from "@/components/ui/delete-confirm-dialog";

interface Supplier {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  cnpj_cpf: string | null;
  company_name: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  category: string | null;
  notes: string | null;
  status: string;
  payment_terms: string | null;
  bank_info: string | null;
  website: string | null;
  contact_person: string | null;
  created_at: string;
  updated_at: string;
}

interface Transaction {
  id: string;
  supplier_id: string;
  description: string;
  amount: number;
  transaction_date: string;
  payment_status: string;
  invoice_number: string | null;
  notes: string | null;
  created_at: string;
}

const CATEGORIES = [
  "Matéria-prima",
  "Serviços",
  "Tecnologia",
  "Logística",
  "Marketing",
  "Embalagens",
  "Equipamentos",
  "Outros"
];

export const SuppliersManagementPanel = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isTransactionDialogOpen, setIsTransactionDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [supplierToDelete, setSupplierToDelete] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    cnpj_cpf: "",
    company_name: "",
    address: "",
    city: "",
    state: "",
    zip_code: "",
    category: "",
    notes: "",
    status: "active",
    payment_terms: "",
    bank_info: "",
    website: "",
    contact_person: ""
  });

  const [transactionData, setTransactionData] = useState({
    description: "",
    amount: "",
    transaction_date: new Date().toISOString().split('T')[0],
    payment_status: "pending",
    invoice_number: "",
    notes: ""
  });

  useEffect(() => {
    if (user) {
      fetchSuppliers();
    }
  }, [user]);

  useEffect(() => {
    if (selectedSupplier) {
      fetchTransactions(selectedSupplier.id);
    }
  }, [selectedSupplier]);

  const fetchSuppliers = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: "Erro ao carregar fornecedores",
        description: error.message,
        variant: "destructive"
      });
    } else {
      setSuppliers(data || []);
    }
    setIsLoading(false);
  };

  const fetchTransactions = async (supplierId: string) => {
    const { data, error } = await supabase
      .from('supplier_transactions')
      .select('*')
      .eq('supplier_id', supplierId)
      .order('transaction_date', { ascending: false });

    if (!error && data) {
      setTransactions(data);
    }
  };

  const handleCreateSupplier = async () => {
    if (!formData.name.trim()) {
      toast({
        title: "Erro",
        description: "Nome do fornecedor é obrigatório",
        variant: "destructive"
      });
      return;
    }

    const { data, error } = await supabase
      .from('suppliers')
      .insert({
        ...formData,
        user_id: user!.id
      })
      .select()
      .single();

    if (error) {
      toast({
        title: "Erro ao criar fornecedor",
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({ title: "Fornecedor criado com sucesso! 🎉" });
      setSuppliers([data, ...suppliers]);
      resetForm();
      setIsCreateDialogOpen(false);
    }
  };

  const handleUpdateSupplier = async () => {
    if (!selectedSupplier) return;

    const { error } = await supabase
      .from('suppliers')
      .update(formData)
      .eq('id', selectedSupplier.id);

    if (error) {
      toast({
        title: "Erro ao atualizar fornecedor",
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({ title: "Fornecedor atualizado com sucesso!" });
      fetchSuppliers();
      setIsEditDialogOpen(false);
    }
  };

  const handleDeleteSupplier = async () => {
    if (!supplierToDelete) return;

    const { error } = await supabase
      .from('suppliers')
      .delete()
      .eq('id', supplierToDelete);

    if (error) {
      toast({
        title: "Erro ao deletar fornecedor",
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({ title: "Fornecedor removido com sucesso!" });
      setSuppliers(suppliers.filter(s => s.id !== supplierToDelete));
      if (selectedSupplier?.id === supplierToDelete) {
        setSelectedSupplier(null);
      }
    }
    setDeleteDialogOpen(false);
    setSupplierToDelete(null);
  };

  const handleAddTransaction = async () => {
    if (!selectedSupplier || !transactionData.description || !transactionData.amount) {
      toast({
        title: "Erro",
        description: "Preencha descrição e valor",
        variant: "destructive"
      });
      return;
    }

    const { error } = await supabase
      .from('supplier_transactions')
      .insert({
        supplier_id: selectedSupplier.id,
        user_id: user!.id,
        description: transactionData.description,
        amount: parseFloat(transactionData.amount),
        transaction_date: transactionData.transaction_date,
        payment_status: transactionData.payment_status,
        invoice_number: transactionData.invoice_number || null,
        notes: transactionData.notes || null
      });

    if (error) {
      toast({
        title: "Erro ao adicionar transação",
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({ title: "Transação registrada com sucesso!" });
      fetchTransactions(selectedSupplier.id);
      setTransactionData({
        description: "",
        amount: "",
        transaction_date: new Date().toISOString().split('T')[0],
        payment_status: "pending",
        invoice_number: "",
        notes: ""
      });
      setIsTransactionDialogOpen(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      cnpj_cpf: "",
      company_name: "",
      address: "",
      city: "",
      state: "",
      zip_code: "",
      category: "",
      notes: "",
      status: "active",
      payment_terms: "",
      bank_info: "",
      website: "",
      contact_person: ""
    });
  };

  const openEditDialog = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setFormData({
      name: supplier.name,
      email: supplier.email || "",
      phone: supplier.phone || "",
      cnpj_cpf: supplier.cnpj_cpf || "",
      company_name: supplier.company_name || "",
      address: supplier.address || "",
      city: supplier.city || "",
      state: supplier.state || "",
      zip_code: supplier.zip_code || "",
      category: supplier.category || "",
      notes: supplier.notes || "",
      status: supplier.status,
      payment_terms: supplier.payment_terms || "",
      bank_info: supplier.bank_info || "",
      website: supplier.website || "",
      contact_person: supplier.contact_person || ""
    });
    setIsEditDialogOpen(true);
  };

  const handleExportCSV = () => {
    if (suppliers.length === 0) {
      toast({
        title: "Nenhum fornecedor para exportar",
        variant: "destructive"
      });
      return;
    }

    const headers = ["Nome", "Empresa", "Email", "Telefone", "CNPJ/CPF", "Categoria", "Status", "Cidade", "Estado"];
    const rows = suppliers.map(s => [
      s.name,
      s.company_name || "",
      s.email || "",
      s.phone || "",
      s.cnpj_cpf || "",
      s.category || "",
      s.status,
      s.city || "",
      s.state || ""
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `fornecedores_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    toast({ title: "Exportação concluída! 📊" });
  };

  const filteredSuppliers = suppliers.filter(supplier => {
    const matchesSearch = 
      supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (supplier.company_name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (supplier.email?.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === "all" || supplier.status === statusFilter;
    const matchesCategory = categoryFilter === "all" || supplier.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500/20 text-green-500';
      case 'inactive': return 'bg-gray-500/20 text-gray-500';
      case 'blocked': return 'bg-red-500/20 text-red-500';
      default: return 'bg-gray-500/20 text-gray-500';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-500/20 text-green-500';
      case 'pending': return 'bg-yellow-500/20 text-yellow-500';
      case 'overdue': return 'bg-red-500/20 text-red-500';
      default: return 'bg-gray-500/20 text-gray-500';
    }
  };

  const totalTransactions = transactions.reduce((sum, t) => sum + Number(t.amount), 0);

  const SupplierForm = ({ onSubmit, submitLabel }: { onSubmit: () => void; submitLabel: string }) => (
    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Nome *</Label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Nome do fornecedor"
          />
        </div>
        <div>
          <Label>Empresa</Label>
          <Input
            value={formData.company_name}
            onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
            placeholder="Razão social"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Email</Label>
          <Input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="email@exemplo.com"
          />
        </div>
        <div>
          <Label>Telefone</Label>
          <Input
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="(00) 00000-0000"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>CNPJ/CPF</Label>
          <Input
            value={formData.cnpj_cpf}
            onChange={(e) => setFormData({ ...formData, cnpj_cpf: e.target.value })}
            placeholder="00.000.000/0001-00"
          />
        </div>
        <div>
          <Label>Pessoa de Contato</Label>
          <Input
            value={formData.contact_person}
            onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
            placeholder="Nome do contato"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Categoria</Label>
          <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map(cat => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Status</Label>
          <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Ativo</SelectItem>
              <SelectItem value="inactive">Inativo</SelectItem>
              <SelectItem value="blocked">Bloqueado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label>Website</Label>
        <Input
          value={formData.website}
          onChange={(e) => setFormData({ ...formData, website: e.target.value })}
          placeholder="https://..."
        />
      </div>

      <div>
        <Label>Endereço</Label>
        <Input
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          placeholder="Rua, número"
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label>Cidade</Label>
          <Input
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            placeholder="Cidade"
          />
        </div>
        <div>
          <Label>Estado</Label>
          <Input
            value={formData.state}
            onChange={(e) => setFormData({ ...formData, state: e.target.value })}
            placeholder="UF"
          />
        </div>
        <div>
          <Label>CEP</Label>
          <Input
            value={formData.zip_code}
            onChange={(e) => setFormData({ ...formData, zip_code: e.target.value })}
            placeholder="00000-000"
          />
        </div>
      </div>

      <div>
        <Label>Condições de Pagamento</Label>
        <Input
          value={formData.payment_terms}
          onChange={(e) => setFormData({ ...formData, payment_terms: e.target.value })}
          placeholder="Ex: 30/60/90 dias"
        />
      </div>

      <div>
        <Label>Dados Bancários</Label>
        <Textarea
          value={formData.bank_info}
          onChange={(e) => setFormData({ ...formData, bank_info: e.target.value })}
          placeholder="Banco, agência, conta..."
          rows={2}
        />
      </div>

      <div>
        <Label>Observações</Label>
        <Textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Notas sobre o fornecedor"
          rows={3}
        />
      </div>

      <Button onClick={onSubmit} className="w-full gradient-primary">
        {submitLabel}
      </Button>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold">Gestão de Fornecedores</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportCSV} disabled={suppliers.length === 0}>
            <Download className="w-4 h-4 mr-2" />
            Exportar CSV
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-primary" onClick={resetForm}>
                <Plus className="w-4 h-4 mr-2" />
                Novo Fornecedor
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Adicionar Novo Fornecedor</DialogTitle>
              </DialogHeader>
              <SupplierForm onSubmit={handleCreateSupplier} submitLabel="Criar Fornecedor" />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, empresa ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Ativos</SelectItem>
                <SelectItem value="inactive">Inativos</SelectItem>
                <SelectItem value="blocked">Bloqueados</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {CATEGORIES.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Building className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{suppliers.length}</p>
                <p className="text-sm text-muted-foreground">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-green-500/20 flex items-center justify-center">
                <div className="h-3 w-3 rounded-full bg-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{suppliers.filter(s => s.status === 'active').length}</p>
                <p className="text-sm text-muted-foreground">Ativos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-gray-500/20 flex items-center justify-center">
                <div className="h-3 w-3 rounded-full bg-gray-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{suppliers.filter(s => s.status === 'inactive').length}</p>
                <p className="text-sm text-muted-foreground">Inativos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-red-500/20 flex items-center justify-center">
                <div className="h-3 w-3 rounded-full bg-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{suppliers.filter(s => s.status === 'blocked').length}</p>
                <p className="text-sm text-muted-foreground">Bloqueados</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Suppliers List */}
        <Card>
          <CardHeader>
            <CardTitle>Fornecedores ({filteredSuppliers.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {isLoading ? (
                <p className="text-center text-muted-foreground py-8">Carregando...</p>
              ) : filteredSuppliers.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Nenhum fornecedor encontrado</p>
              ) : (
                filteredSuppliers.map((supplier) => (
                  <Card
                    key={supplier.id}
                    className={`p-4 cursor-pointer transition-all hover:shadow-md ${
                      selectedSupplier?.id === supplier.id ? 'border-primary bg-primary/5' : ''
                    }`}
                    onClick={() => setSelectedSupplier(supplier)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold">{supplier.name}</h4>
                          <Badge className={getStatusColor(supplier.status)}>
                            {supplier.status === 'active' ? 'Ativo' : supplier.status === 'inactive' ? 'Inativo' : 'Bloqueado'}
                          </Badge>
                        </div>
                        {supplier.company_name && (
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Building className="w-3 h-3" />
                            {supplier.company_name}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
                          {supplier.email && (
                            <span className="flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {supplier.email}
                            </span>
                          )}
                          {supplier.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {supplier.phone}
                            </span>
                          )}
                        </div>
                        {supplier.category && (
                          <Badge variant="outline" className="mt-2 text-xs">
                            {supplier.category}
                          </Badge>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditDialog(supplier);
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSupplierToDelete(supplier.id);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Supplier Details */}
        <Card>
          <CardHeader>
            <CardTitle>Detalhes do Fornecedor</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedSupplier ? (
              <Tabs defaultValue="info">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="info">Informações</TabsTrigger>
                  <TabsTrigger value="transactions">Transações</TabsTrigger>
                </TabsList>

                <TabsContent value="info" className="space-y-4 mt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-semibold">{selectedSupplier.name}</h3>
                      {selectedSupplier.company_name && (
                        <p className="text-muted-foreground">{selectedSupplier.company_name}</p>
                      )}
                    </div>
                    <Badge className={getStatusColor(selectedSupplier.status)}>
                      {selectedSupplier.status === 'active' ? 'Ativo' : selectedSupplier.status === 'inactive' ? 'Inativo' : 'Bloqueado'}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {selectedSupplier.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        <span>{selectedSupplier.email}</span>
                      </div>
                    )}
                    {selectedSupplier.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        <span>{selectedSupplier.phone}</span>
                      </div>
                    )}
                    {selectedSupplier.website && (
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-muted-foreground" />
                        <a href={selectedSupplier.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                          {selectedSupplier.website}
                        </a>
                      </div>
                    )}
                    {selectedSupplier.contact_person && (
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span>{selectedSupplier.contact_person}</span>
                      </div>
                    )}
                  </div>

                  {(selectedSupplier.address || selectedSupplier.city) && (
                    <div className="flex items-start gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                      <span>
                        {selectedSupplier.address}
                        {selectedSupplier.city && `, ${selectedSupplier.city}`}
                        {selectedSupplier.state && ` - ${selectedSupplier.state}`}
                        {selectedSupplier.zip_code && ` (${selectedSupplier.zip_code})`}
                      </span>
                    </div>
                  )}

                  {selectedSupplier.cnpj_cpf && (
                    <div className="text-sm">
                      <strong>CNPJ/CPF:</strong> {selectedSupplier.cnpj_cpf}
                    </div>
                  )}

                  {selectedSupplier.payment_terms && (
                    <div className="text-sm">
                      <strong>Condições de Pagamento:</strong> {selectedSupplier.payment_terms}
                    </div>
                  )}

                  {selectedSupplier.bank_info && (
                    <div className="text-sm">
                      <strong>Dados Bancários:</strong>
                      <p className="text-muted-foreground mt-1">{selectedSupplier.bank_info}</p>
                    </div>
                  )}

                  {selectedSupplier.notes && (
                    <div className="text-sm">
                      <strong>Observações:</strong>
                      <p className="text-muted-foreground mt-1">{selectedSupplier.notes}</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="transactions" className="mt-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Total em transações</p>
                      <p className="text-xl font-bold">
                        R$ {totalTransactions.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <Dialog open={isTransactionDialogOpen} onOpenChange={setIsTransactionDialogOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm">
                          <Plus className="w-4 h-4 mr-2" />
                          Nova Transação
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Registrar Transação</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 mt-4">
                          <div>
                            <Label>Descrição *</Label>
                            <Input
                              value={transactionData.description}
                              onChange={(e) => setTransactionData({ ...transactionData, description: e.target.value })}
                              placeholder="Ex: Compra de materiais"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label>Valor (R$) *</Label>
                              <Input
                                type="number"
                                step="0.01"
                                value={transactionData.amount}
                                onChange={(e) => setTransactionData({ ...transactionData, amount: e.target.value })}
                                placeholder="0.00"
                              />
                            </div>
                            <div>
                              <Label>Data</Label>
                              <Input
                                type="date"
                                value={transactionData.transaction_date}
                                onChange={(e) => setTransactionData({ ...transactionData, transaction_date: e.target.value })}
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label>Status do Pagamento</Label>
                              <Select 
                                value={transactionData.payment_status} 
                                onValueChange={(v) => setTransactionData({ ...transactionData, payment_status: v })}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="pending">Pendente</SelectItem>
                                  <SelectItem value="paid">Pago</SelectItem>
                                  <SelectItem value="overdue">Vencido</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label>Nº da Nota Fiscal</Label>
                              <Input
                                value={transactionData.invoice_number}
                                onChange={(e) => setTransactionData({ ...transactionData, invoice_number: e.target.value })}
                                placeholder="NF-000000"
                              />
                            </div>
                          </div>
                          <div>
                            <Label>Observações</Label>
                            <Textarea
                              value={transactionData.notes}
                              onChange={(e) => setTransactionData({ ...transactionData, notes: e.target.value })}
                              placeholder="Notas adicionais"
                              rows={2}
                            />
                          </div>
                          <Button onClick={handleAddTransaction} className="w-full gradient-primary">
                            Registrar Transação
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>

                  <div className="space-y-2 max-h-[350px] overflow-y-auto">
                    {transactions.length === 0 ? (
                      <p className="text-center text-muted-foreground py-6">Nenhuma transação registrada</p>
                    ) : (
                      transactions.map((transaction) => (
                        <Card key={transaction.id} className="p-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <DollarSign className="w-4 h-4 text-primary" />
                                <span className="font-medium">{transaction.description}</span>
                              </div>
                              <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                                <span>{new Date(transaction.transaction_date).toLocaleDateString('pt-BR')}</span>
                                {transaction.invoice_number && (
                                  <span className="flex items-center gap-1">
                                    <FileText className="w-3 h-3" />
                                    {transaction.invoice_number}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold">
                                R$ {Number(transaction.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </p>
                              <Badge className={getPaymentStatusColor(transaction.payment_status)}>
                                {transaction.payment_status === 'paid' ? 'Pago' : 
                                 transaction.payment_status === 'pending' ? 'Pendente' : 'Vencido'}
                              </Badge>
                            </div>
                          </div>
                        </Card>
                      ))
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            ) : (
              <div className="flex items-center justify-center text-muted-foreground h-[400px]">
                Selecione um fornecedor para ver os detalhes
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Fornecedor</DialogTitle>
          </DialogHeader>
          <SupplierForm onSubmit={handleUpdateSupplier} submitLabel="Salvar Alterações" />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteSupplier}
        title="Deletar Fornecedor"
        description="Tem certeza que deseja remover este fornecedor? Todas as transações associadas também serão removidas. Esta ação não pode ser desfeita."
      />
    </div>
  );
};
