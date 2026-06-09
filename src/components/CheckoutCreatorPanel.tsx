import { useState, useEffect } from \"react\";
import { Card } from \"@/components/ui/card\";
import { Button } from \"@/components/ui/button\";
import { supabase } from \"@/integrations/supabase/client\";
import { toast } from \"sonner\";
import { Save, Plus, ExternalLink, Pencil } from \"lucide-react\";
import { useNavigate } from \"react-router-dom\";

export const CheckoutCreatorPanel = () => {
  const navigate = useNavigate();
  const [checkouts, setCheckouts] = useState<any[]>([]);

  const loadCheckouts = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from('checkouts').select('*').eq('user_id', user.id);
    setCheckouts(data || []);
  };

  useEffect(() => { loadCheckouts(); }, []);

  return (
    <div className=\"p-6 max-w-7xl mx-auto bg-slate-50 min-h-screen\">
      <div className=\"flex justify-between items-center mb-8\">
        <div>
          <h1 className=\"text-3xl font-bold text-slate-900\">Meus Checkouts</h1>
          <p className=\"text-slate-500\">Crie e gerencie seus fluxos de pagamento</p>
        </div>
        <Button onClick={() => window.open('/checkout-editor/new', '_blank')} className=\"bg-indigo-600 hover:bg-indigo-700 h-12 px-6 rounded-xl shadow-lg shadow-indigo-200 gap-2\">
          <Plus className=\"w-5 h-5\"/> Novo Checkout
        </Button>
      </div>
      
      <div className=\"grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6\">
        {checkouts.map(c => (
          <Card key={c.id} className=\"group hover:shadow-xl transition-all duration-300 border-none bg-white rounded-2xl overflow-hidden cursor-pointer\" onClick={() => window.open(`/checkout-editor/${c.id}`, '_blank')}>
            <div className=\"p-6\">
              <div className=\"flex justify-between items-start mb-4\">
                <div className=\"w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300\">
                  <Save className=\"w-6 h-6\" />
                </div>
                <div className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${c.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                  {c.is_active ? 'Ativo' : 'Inativo'}
                </div>
              </div>
              <h3 className=\"text-lg font-bold text-slate-900 mb-1\">{c.name}</h3>
              <p className=\"text-sm text-slate-500 line-clamp-2 mb-4\">{c.item_name} - R$ {Number(c.price).toFixed(2)}</p>
              <div className=\"flex items-center gap-2 pt-4 border-t border-slate-50\">
                <Button variant=\"ghost\" size=\"sm\" className=\"text-xs h-8 px-3 rounded-lg text-slate-600 flex items-center gap-1\">
                  <Pencil className=\"w-3 h-3\" /> Editar
                </Button>
                <Button variant=\"ghost\" size=\"sm\" className=\"text-xs h-8 px-3 rounded-lg text-slate-600 flex items-center gap-1\" onClick={(e) => { e.stopPropagation(); window.open(`/checkout/${c.id}`, '_blank'); }}>
                  <ExternalLink className=\"w-3 h-3\" /> Visualizar
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
