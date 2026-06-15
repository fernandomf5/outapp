import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CheckCircle, Loader2, Mail, Phone, User } from "lucide-react";

interface PendingOrdersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  areaId: string;
  areaName: string;
}

interface Order {
  id: string;
  checkout_id: string;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  amount: number;
  status: string;
  payment_method: string | null;
  created_at: string;
}

export const PendingOrdersDialog = ({ open, onOpenChange, areaId, areaName }: PendingOrdersDialogProps) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [releasingId, setReleasingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const { data: checkouts } = await supabase
        .from('checkouts').select('id')
        .eq('integration_type', 'members_area')
        .eq('integration_id', areaId);

      const ids = (checkouts || []).map((c: any) => c.id);
      if (ids.length === 0) { setOrders([]); return; }

      const { data, error } = await supabase
        .from('checkout_orders')
        .select('id, checkout_id, customer_name, customer_email, customer_phone, amount, status, payment_method, created_at')
        .in('checkout_id', ids)
        .neq('status', 'approved')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (err: any) {
      toast.error('Erro ao carregar pedidos: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (open) load(); }, [open, areaId]);

  const handleRelease = async (orderId: string) => {
    setReleasingId(orderId);
    try {
      const { data, error } = await supabase.functions.invoke('release-checkout-order', {
        body: { orderId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success(`Acesso liberado! Código: ${data.accessCode}`);
      await load();
    } catch (err: any) {
      toast.error('Erro ao liberar: ' + (err.message || 'Desconhecido'));
    } finally {
      setReleasingId(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Liberar Alunos - {areaName}</DialogTitle>
          <DialogDescription>
            Pedidos pendentes dos checkouts vinculados. Libere o acesso após confirmar o pagamento via PIX.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : orders.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">Nenhum pedido pendente.</p>
          ) : (
            <div className="space-y-3">
              {orders.map((o) => (
                <div key={o.id} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      <span className="font-semibold">{o.customer_name || 'Sem nome'}</span>
                      <Badge variant={o.status === 'pending' ? 'secondary' : 'outline'}>{o.status}</Badge>
                      {o.payment_method && <Badge variant="outline">{o.payment_method}</Badge>}
                    </div>
                    <span className="font-bold text-primary">R$ {Number(o.amount).toFixed(2)}</span>
                  </div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    {o.customer_email && <div className="flex items-center gap-2"><Mail className="w-3 h-3" />{o.customer_email}</div>}
                    {o.customer_phone && <div className="flex items-center gap-2"><Phone className="w-3 h-3" />{o.customer_phone}</div>}
                    <div className="text-xs">{new Date(o.created_at).toLocaleString('pt-BR')}</div>
                  </div>
                  <Button
                    size="sm"
                    className="w-full"
                    disabled={releasingId === o.id}
                    onClick={() => handleRelease(o.id)}
                  >
                    {releasingId === o.id ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <CheckCircle className="w-4 h-4 mr-2" />
                    )}
                    Liberar acesso e enviar e-mail
                  </Button>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
