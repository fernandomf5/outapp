import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Save, Plus, ExternalLink, Pencil, Trash2, Loader2, BarChart3 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ResourceAssignmentsButton } from "@/components/registration/ResourceAssignmentsButton";
import { CheckoutAnalyticsDialog } from "@/components/checkout/CheckoutAnalyticsDialog";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const CheckoutCreatorPanel = () => {
  const navigate = useNavigate();
  const [checkouts, setCheckouts] = useState<any[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadCheckouts = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from('checkouts').select('*').eq('user_id', user.id);
    setCheckouts(data || []);
  };

  useEffect(() => { loadCheckouts(); }, []);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const { error } = await supabase.from('checkouts').delete().eq('id', deleteTarget.id);
    setDeleting(false);
    if (error) {
      toast.error("Erro ao excluir checkout: " + error.message);
      return;
    }
    setCheckouts((prev) => prev.filter((c) => c.id !== deleteTarget.id));
    setDeleteTarget(null);
    toast.success("Checkout excluído com sucesso!");
  };

  return (
    <div className="p-6 max-w-7xl mx-auto bg-slate-50 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Meus Checkouts</h1>
          <p className="text-slate-500">Crie e gerencie seus fluxos de pagamento</p>
          <div className="mt-3"><ResourceAssignmentsButton resourceType="checkout" /></div>
        </div>
        <Button onClick={() => navigate('/checkout-editor/new')} className="bg-[#10b981] hover:bg-[#059669] h-12 px-6 rounded-xl shadow-lg shadow-green-100 gap-2">
          <Plus className="w-5 h-5"/> Novo Checkout
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {checkouts.map(c => (
          <Card key={c.id} className="group hover:shadow-xl transition-all duration-300 border-none bg-white rounded-2xl overflow-hidden cursor-pointer" onClick={() => navigate(`/checkout-editor/${c.id}`)}>
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 rounded-xl bg-green-50 text-[#10b981] flex items-center justify-center group-hover:bg-[#10b981] group-hover:text-white transition-colors duration-300">
                  <Save className="w-6 h-6" />
                </div>
                <div className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${c.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                  {c.is_active ? 'Ativo' : 'Inativo'}
                </div>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">{c.name}</h3>
              <p className="text-sm text-slate-500 line-clamp-2 mb-4">{c.item_name} - R$ {Number(c.price).toFixed(2)}</p>
              <div className="flex items-center gap-2 pt-4 border-t border-slate-50">
                <Button variant="ghost" size="sm" className="text-xs h-8 px-3 rounded-lg text-slate-600 flex items-center gap-1">
                  <Pencil className="w-3 h-3" /> Editar
                </Button>
                <Button variant="ghost" size="sm" className="text-xs h-8 px-3 rounded-lg text-slate-600 flex items-center gap-1" onClick={(e) => { e.stopPropagation(); window.open(`/checkout/${c.id}`, '_blank'); }}>
                  <ExternalLink className="w-3 h-3" /> Visualizar
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs h-8 px-3 rounded-lg text-red-600 hover:text-red-700 hover:bg-red-50 flex items-center gap-1 ml-auto"
                  onClick={(e) => { e.stopPropagation(); setDeleteTarget(c); }}
                >
                  <Trash2 className="w-3 h-3" /> Excluir
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent className="z-[300]">
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza que deseja excluir?</AlertDialogTitle>
            <AlertDialogDescription>
              O checkout "{deleteTarget?.name}" será excluído permanentemente. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); handleDelete(); }}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Excluindo...</> : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
