import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { UserPlus, Search, Building2, Plus } from 'lucide-react';

interface ClientData {
  client_name: string;
  client_email: string;
  client_phone: string;
  client_company: string;
  client_cnpj: string;
  client_address: string;
}

interface ClientDataStepProps {
  data: ClientData;
  onChange: (data: Partial<ClientData>) => void;
}

interface CRMCustomer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
}

interface Business {
  id: string;
  name: string;
  cnpj: string | null;
}

export function ClientDataStep({ data, onChange }: ClientDataStepProps) {
  const { user } = useAuth();
  const [customers, setCustomers] = useState<CRMCustomer[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [showNewClientDialog, setShowNewClientDialog] = useState(false);
  const [showNewBusinessDialog, setShowNewBusinessDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [newClient, setNewClient] = useState({ name: '', email: '', phone: '', company: '', address: '' });
  const [newBusiness, setNewBusiness] = useState({ name: '', cnpj: '' });
  const [savingClient, setSavingClient] = useState(false);
  const [savingBusiness, setSavingBusiness] = useState(false);

  useEffect(() => {
    if (user) {
      fetchCustomers();
      fetchBusinesses();
    }
  }, [user]);

  const fetchCustomers = async () => {
    const { data: cust } = await supabase
      .from('customers')
      .select('id, name, email, phone, company, address, city, state')
      .eq('user_id', user!.id)
      .order('name');
    if (cust) setCustomers(cust);
  };

  const fetchBusinesses = async () => {
    const { data: biz } = await supabase
      .from('businesses')
      .select('id, name, cnpj')
      .eq('user_id', user!.id)
      .order('name');
    if (biz) setBusinesses(biz);
  };

  const selectCustomer = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    if (!customer) return;
    const addr = [customer.address, customer.city, customer.state].filter(Boolean).join(', ');
    onChange({
      client_name: customer.name,
      client_email: customer.email || '',
      client_phone: customer.phone || '',
      client_company: customer.company || '',
      client_address: addr,
    });
  };

  const selectBusiness = (businessId: string) => {
    const biz = businesses.find(b => b.id === businessId);
    if (!biz) return;
    onChange({
      client_company: biz.name,
      client_cnpj: biz.cnpj || '',
    });
  };

  const handleSaveNewClient = async () => {
    if (!newClient.name || !user) return;
    try {
      setSavingClient(true);
      const { data: created, error } = await supabase
        .from('customers')
        .insert({
          user_id: user.id,
          name: newClient.name,
          email: newClient.email || null,
          phone: newClient.phone || null,
          company: newClient.company || null,
          address: newClient.address || null,
          status: 'lead',
        })
        .select('id, name, email, phone, company, address, city, state')
        .single();
      if (error) throw error;
      toast.success('Cliente cadastrado!');
      setCustomers(prev => [...prev, created]);
      onChange({
        client_name: created.name,
        client_email: created.email || '',
        client_phone: created.phone || '',
        client_company: created.company || '',
        client_address: created.address || '',
      });
      setNewClient({ name: '', email: '', phone: '', company: '', address: '' });
      setShowNewClientDialog(false);
    } catch {
      toast.error('Erro ao cadastrar cliente');
    } finally {
      setSavingClient(false);
    }
  };

  const handleSaveNewBusiness = async () => {
    if (!newBusiness.name || !user) return;
    try {
      setSavingBusiness(true);
      const { data: created, error } = await supabase
        .from('businesses')
        .insert({
          user_id: user.id,
          name: newBusiness.name,
          cnpj: newBusiness.cnpj || null,
        })
        .select('id, name, cnpj')
        .single();
      if (error) throw error;
      toast.success('Negócio cadastrado!');
      setBusinesses(prev => [...prev, created]);
      onChange({
        client_company: created.name,
        client_cnpj: created.cnpj || '',
      });
      setNewBusiness({ name: '', cnpj: '' });
      setShowNewBusinessDialog(false);
    } catch {
      toast.error('Erro ao cadastrar negócio');
    } finally {
      setSavingBusiness(false);
    }
  };

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (c.company && c.company.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold">Dados do Cliente</h2>
        <p className="text-muted-foreground">Para quem você está enviando esta proposta</p>
      </div>

      {/* Quick select section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg bg-muted/30">
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            Selecionar cliente existente
          </Label>
          <div className="flex gap-2">
            <Select onValueChange={selectCustomer}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Escolher cliente do CRM..." />
              </SelectTrigger>
              <SelectContent>
                {customers.map(c => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name} {c.company ? `(${c.company})` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={() => setShowNewClientDialog(true)} title="Cadastrar novo cliente">
              <UserPlus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Selecionar empresa/negócio
          </Label>
          <div className="flex gap-2">
            <Select onValueChange={selectBusiness}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Escolher negócio..." />
              </SelectTrigger>
              <SelectContent>
                {businesses.map(b => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name} {b.cnpj ? `(${b.cnpj})` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={() => setShowNewBusinessDialog(true)} title="Cadastrar novo negócio">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Manual fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="client_name">Nome do Cliente *</Label>
          <Input
            id="client_name"
            value={data.client_name}
            onChange={(e) => onChange({ client_name: e.target.value })}
            placeholder="Nome completo"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="client_company">Empresa do Cliente</Label>
          <Input
            id="client_company"
            value={data.client_company}
            onChange={(e) => onChange({ client_company: e.target.value })}
            placeholder="Empresa do cliente"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="client_cnpj">CNPJ/CPF</Label>
          <Input
            id="client_cnpj"
            value={data.client_cnpj}
            onChange={(e) => onChange({ client_cnpj: e.target.value })}
            placeholder="00.000.000/0001-00"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="client_email">E-mail</Label>
          <Input
            id="client_email"
            type="email"
            value={data.client_email}
            onChange={(e) => onChange({ client_email: e.target.value })}
            placeholder="cliente@email.com"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="client_phone">Telefone</Label>
          <Input
            id="client_phone"
            value={data.client_phone}
            onChange={(e) => onChange({ client_phone: e.target.value })}
            placeholder="(11) 99999-9999"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="client_address">Endereço</Label>
          <Input
            id="client_address"
            value={data.client_address}
            onChange={(e) => onChange({ client_address: e.target.value })}
            placeholder="Cidade - UF"
          />
        </div>
      </div>

      {/* New Client Dialog */}
      <Dialog open={showNewClientDialog} onOpenChange={setShowNewClientDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Cadastrar Novo Cliente
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome *</Label>
              <Input value={newClient.name} onChange={e => setNewClient(p => ({ ...p, name: e.target.value }))} placeholder="Nome completo" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>E-mail</Label>
                <Input type="email" value={newClient.email} onChange={e => setNewClient(p => ({ ...p, email: e.target.value }))} placeholder="email@exemplo.com" />
              </div>
              <div className="space-y-2">
                <Label>Telefone</Label>
                <Input value={newClient.phone} onChange={e => setNewClient(p => ({ ...p, phone: e.target.value }))} placeholder="(11) 99999-9999" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Empresa</Label>
              <Input value={newClient.company} onChange={e => setNewClient(p => ({ ...p, company: e.target.value }))} placeholder="Empresa" />
            </div>
            <div className="space-y-2">
              <Label>Endereço</Label>
              <Input value={newClient.address} onChange={e => setNewClient(p => ({ ...p, address: e.target.value }))} placeholder="Cidade - UF" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewClientDialog(false)}>Cancelar</Button>
            <Button onClick={handleSaveNewClient} disabled={!newClient.name || savingClient}>
              {savingClient ? 'Salvando...' : 'Cadastrar e Usar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Business Dialog */}
      <Dialog open={showNewBusinessDialog} onOpenChange={setShowNewBusinessDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Cadastrar Novo Negócio
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome do Negócio *</Label>
              <Input value={newBusiness.name} onChange={e => setNewBusiness(p => ({ ...p, name: e.target.value }))} placeholder="Nome da empresa" />
            </div>
            <div className="space-y-2">
              <Label>CNPJ</Label>
              <Input value={newBusiness.cnpj} onChange={e => setNewBusiness(p => ({ ...p, cnpj: e.target.value }))} placeholder="00.000.000/0001-00" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewBusinessDialog(false)}>Cancelar</Button>
            <Button onClick={handleSaveNewBusiness} disabled={!newBusiness.name || savingBusiness}>
              {savingBusiness ? 'Salvando...' : 'Cadastrar e Usar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
