import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Archive, ArchiveRestore, CheckCircle, Loader2, Mail, Phone, Trash2, User } from "lucide-react";

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
  const [busyId, setBusyId] = useState<string | null>(null);
  const [tab, setTab] = useState<"pending" | "archived">("pending");
  const [deleteId, setDeleteId] = useState<string | null>(null);

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
    setBusyId(orderId);
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
      setBusyId(null);
    }
  };

  const handleArchive = async (orderId: string, archive: boolean) => {
    setBusyId(orderId);
    try {
      const { error } = await supabase
        .from('checkout_orders')
        .update({ status: archive ? 'archived' : 'pending' })
        .eq('id', orderId);
      if (error) throw error;
      toast.success(archive ? 'Pedido arquivado' : 'Pedido restaurado');
      await load();
    } catch (err: any) {
      toast.error('Erro: ' + err.message);
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (orderId: string) => {
    setBusyId(orderId);
    try {
      const { error } = await supabase.from('checkout_orders').delete().eq('id', orderId);
      if (error) throw error;
      toast.success('Pedido excluído');
      await load();
    } catch (err: any) {
      toast.error('Erro ao excluir: ' + err.message);
    } finally {
      setBusyId(null);
    }
  };

  const pending = orders.filter((o) => o.status !== 'archived');
  const archived = orders.filter((o) => o.status === 'archived');

  const renderOrder = (o: Order, archivedView: boolean) => (
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
      {!archivedView ? (
        <div className="flex gap-2">
          <Button
            size="sm"
            className="flex-1"
            disabled={busyId === o.id}
            onClick={() => handleRelease(o.id)}
          >
            {busyId === o.id ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
            Liberar acesso
          </Button>
          <Button size="sm" variant="outline" disabled={busyId === o.id} onClick={() => handleArchive(o.id, true)}>
            <Archive className="w-4 h-4 mr-2" />
            Arquivar
          </Button>
        </div>
      ) : (
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="flex-1" disabled={busyId === o.id} onClick={() => handleArchive(o.id, false)}>
            <ArchiveRestore className="w-4 h-4 mr-2" />
            Restaurar
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="sm" variant="destructive" disabled={busyId === o.id}>
                <Trash2 className="w-4 h-4 mr-2" />
                Excluir
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Excluir pedido?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta ação não pode ser desfeita. O pedido será removido permanentemente.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={() => handleDelete(o.id)}>Excluir</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Liberar Alunos - {areaName}</DialogTitle>
          <DialogDescription>
            Libere o acesso após confirmar o pagamento. Arquive os que não confirmarem.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="pending">Pendentes ({pending.length})</TabsTrigger>
            <TabsTrigger value="archived">Arquivados ({archived.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            <ScrollArea className="max-h-[55vh] pr-4">
              {loading ? (
                <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin" /></div>
              ) : pending.length === 0 ? (
                <p className="text-center text-muted-foreground py-12">Nenhum pedido pendente.</p>
              ) : (
                <div className="space-y-3">{pending.map((o) => renderOrder(o, false))}</div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="archived">
            <ScrollArea className="max-h-[55vh] pr-4">
              {loading ? (
                <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin" /></div>
              ) : archived.length === 0 ? (
                <p className="text-center text-muted-foreground py-12">Nenhum pedido arquivado.</p>
              ) : (
                <div className="space-y-3">{archived.map((o) => renderOrder(o, true))}</div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
