import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { User, Mail, Phone, Calendar, MessageSquare, Search } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  created_at: string;
  last_login_at: string;
  _count?: {
    conversations: number;
    orders: number;
    appointments: number;
  };
}

export default function AgentCustomersPanel({ agentId }: { agentId: string }) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadCustomers();
  }, [agentId]);

  useEffect(() => {
    if (searchTerm) {
      const filtered = customers.filter(customer =>
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.phone?.includes(searchTerm)
      );
      setFilteredCustomers(filtered);
    } else {
      setFilteredCustomers(customers);
    }
  }, [searchTerm, customers]);

  const loadCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('agent_customers')
        .select('*')
        .eq('agent_id', agentId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Carregar contagens para cada cliente
      const customersWithCounts = await Promise.all(
        (data || []).map(async (customer) => {
          const [conversations, orders, appointments] = await Promise.all([
            supabase
              .from('agent_conversations')
              .select('*', { count: 'exact', head: true })
              .eq('customer_id', customer.id),
            supabase
              .from('agent_orders')
              .select('*', { count: 'exact', head: true })
              .eq('customer_id', customer.id),
            supabase
              .from('agent_appointments')
              .select('*', { count: 'exact', head: true })
              .eq('customer_id', customer.id),
          ]);

          return {
            ...customer,
            _count: {
              conversations: conversations.count || 0,
              orders: orders.count || 0,
              appointments: appointments.count || 0,
            },
          };
        })
      );

      setCustomers(customersWithCounts);
      setFilteredCustomers(customersWithCounts);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar clientes",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Carregando clientes...</div>;
  }

  if (selectedCustomer) {
    return (
      <div className="space-y-4">
        <Button variant="outline" onClick={() => setSelectedCustomer(null)}>
          ← Voltar para lista
        </Button>
        <CustomerDetails customer={selectedCustomer} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold">Dados de Clientes</h3>
        <Badge variant="outline">{customers.length} total</Badge>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome, email ou telefone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {filteredCustomers.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <User className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">
              {searchTerm ? "Nenhum cliente encontrado" : "Nenhum cliente ainda"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredCustomers.map((customer) => (
            <Card
              key={customer.id}
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => setSelectedCustomer(customer)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{customer.name}</CardTitle>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                      <Mail className="w-4 h-4" />
                      <span>{customer.email}</span>
                    </div>
                    {customer.phone && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                        <Phone className="w-4 h-4" />
                        <span>{customer.phone}</span>
                      </div>
                    )}
                  </div>
                  <Badge>
                    {customer._count?.conversations || 0} conversas
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <MessageSquare className="w-4 h-4" />
                    <span>{customer._count?.orders || 0} pedidos</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>{customer._count?.appointments || 0} agendamentos</span>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground mt-2">
                  Cliente desde {format(new Date(customer.created_at), "dd/MM/yyyy", { locale: ptBR })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function CustomerDetails({ customer }: { customer: Customer }) {
  const [conversations, setConversations] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCustomerData();
  }, [customer.id]);

  const loadCustomerData = async () => {
    const [convData, ordersData, aptsData] = await Promise.all([
      supabase
        .from('agent_conversations')
        .select('*')
        .eq('customer_id', customer.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('agent_orders')
        .select('*')
        .eq('customer_id', customer.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('agent_appointments')
        .select('*')
        .eq('customer_id', customer.id)
        .order('scheduled_date', { ascending: false }),
    ]);

    setConversations(convData.data || []);
    setOrders(ordersData.data || []);
    setAppointments(aptsData.data || []);
    setLoading(false);
  };

  if (loading) {
    return <div>Carregando dados do cliente...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Informações do Cliente</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-muted-foreground" />
            <span className="font-medium">{customer.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-muted-foreground" />
            <span>{customer.email}</span>
          </div>
          {customer.phone && (
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-muted-foreground" />
              <span>{customer.phone}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span>Cliente desde {format(new Date(customer.created_at), "dd/MM/yyyy", { locale: ptBR })}</span>
          </div>
          {customer.last_login_at && (
            <div className="text-sm text-muted-foreground">
              Último acesso: {format(new Date(customer.last_login_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Conversas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{conversations.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Pedidos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{orders.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              R$ {orders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0).toFixed(2)} total
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Agendamentos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{appointments.length}</div>
          </CardContent>
        </Card>
      </div>

      {orders.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Últimos Pedidos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {orders.slice(0, 5).map((order) => (
                <div key={order.id} className="flex items-center justify-between p-2 border rounded">
                  <div>
                    <div className="font-medium">#{order.order_number}</div>
                    <div className="text-sm text-muted-foreground">
                      {format(new Date(order.created_at), "dd/MM/yyyy", { locale: ptBR })}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">R$ {Number(order.total_amount).toFixed(2)}</div>
                    <Badge variant="outline">{order.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}