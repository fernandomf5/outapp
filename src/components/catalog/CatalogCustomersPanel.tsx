import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Users,
  Search,
  Eye,
  Phone,
  Mail,
  MapPin,
  ShoppingBag,
  DollarSign,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Customer {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  orders_count: number;
  total_spent: number;
  created_at: string;
}

interface CatalogCustomersPanelProps {
  catalogId: string;
}

export default function CatalogCustomersPanel({ catalogId }: CatalogCustomersPanelProps) {
  const { toast } = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  useEffect(() => {
    loadCustomers();
  }, [catalogId]);

  const loadCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from("catalog_customers" as any)
        .select("*")
        .eq("catalog_id", catalogId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCustomers((data as unknown as Customer[]) || []);
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

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(price);
  };

  const filteredCustomers = customers.filter(customer => {
    const searchLower = search.toLowerCase();
    return (
      customer.name.toLowerCase().includes(searchLower) ||
      customer.phone?.toLowerCase().includes(searchLower) ||
      customer.email?.toLowerCase().includes(searchLower)
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome, telefone ou email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Customers List */}
      {filteredCustomers.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">
              {customers.length === 0
                ? "Nenhum cliente cadastrado ainda"
                : "Nenhum cliente encontrado"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredCustomers.map((customer) => (
            <Card key={customer.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{customer.name}</p>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mt-1">
                      {customer.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {customer.phone}
                        </span>
                      )}
                      {customer.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {customer.email}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm mt-2">
                      <span className="flex items-center gap-1 text-blue-600">
                        <ShoppingBag className="w-3 h-3" />
                        {customer.orders_count} pedidos
                      </span>
                      <span className="flex items-center gap-1 text-green-600">
                        <DollarSign className="w-3 h-3" />
                        {formatPrice(customer.total_spent)}
                      </span>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedCustomer(customer)}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    Ver
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Customer Details Modal */}
      <Dialog open={!!selectedCustomer} onOpenChange={() => setSelectedCustomer(null)}>
        <DialogContent className="max-w-md">
          {selectedCustomer && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedCustomer.name}</DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                {/* Contact Info */}
                <div className="space-y-2">
                  {selectedCustomer.phone && (
                    <p className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <a
                        href={`tel:${selectedCustomer.phone}`}
                        className="text-primary hover:underline"
                      >
                        {selectedCustomer.phone}
                      </a>
                    </p>
                  )}
                  {selectedCustomer.email && (
                    <p className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <a
                        href={`mailto:${selectedCustomer.email}`}
                        className="text-primary hover:underline"
                      >
                        {selectedCustomer.email}
                      </a>
                    </p>
                  )}
                  {selectedCustomer.address && (
                    <p className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      {selectedCustomer.address}
                    </p>
                  )}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <ShoppingBag className="w-6 h-6 mx-auto mb-1 text-blue-500" />
                      <p className="text-2xl font-bold">{selectedCustomer.orders_count}</p>
                      <p className="text-xs text-muted-foreground">Pedidos</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <DollarSign className="w-6 h-6 mx-auto mb-1 text-green-500" />
                      <p className="text-lg font-bold">{formatPrice(selectedCustomer.total_spent)}</p>
                      <p className="text-xs text-muted-foreground">Total Gasto</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Notes */}
                {selectedCustomer.notes && (
                  <div className="space-y-2">
                    <h4 className="font-semibold">Observações</h4>
                    <p className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
                      {selectedCustomer.notes}
                    </p>
                  </div>
                )}

                {/* Timestamp */}
                <p className="text-xs text-muted-foreground text-center">
                  Cliente desde{" "}
                  {format(new Date(selectedCustomer.created_at), "dd/MM/yyyy", { locale: ptBR })}
                </p>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
