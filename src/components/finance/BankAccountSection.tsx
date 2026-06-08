import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Wallet, Trash2, Building2, UserCircle, Globe } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface BankAccount {
  id: string;
  bank_name: string;
  account_type: 'PF' | 'PJ';
  current_balance: number;
  agency?: string;
  account_number?: string;
  is_active: boolean;
}

interface BankAccountSectionProps {
  businessId: string;
  bankAccounts: BankAccount[];
  onRefresh: () => void;
}

export const BankAccountSection = ({ businessId, bankAccounts, onRefresh }: BankAccountSectionProps) => {
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    bank_name: "",
    account_type: "PF" as "PF" | "PJ",
    current_balance: "",
    agency: "",
    account_number: "",
    is_active: true
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from('financial_bank_accounts').insert({
        user_id: user.id,
        business_id: businessId,
        bank_name: formData.bank_name,
        account_type: formData.account_type,
        current_balance: parseFloat(formData.current_balance) || 0,
        agency: formData.agency,
        account_number: formData.account_number,
        is_active: formData.is_active
      });

      if (error) throw error;
      toast.success("Conta bancária cadastrada!");
      setIsAdding(false);
      setFormData({ bank_name: "", account_type: "PF", current_balance: "", agency: "", account_number: "", is_active: true });
      onRefresh();
    } catch (error) {
      toast.error("Erro ao cadastrar conta");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('financial_bank_accounts').delete().eq('id', id);
      if (error) throw error;
      toast.success("Conta removida");
      onRefresh();
    } catch (error) {
      toast.error("Erro ao remover conta");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Wallet className="w-6 h-6 text-primary" /> Minhas Contas
          </h3>
          <p className="text-sm text-muted-foreground">Gerencie seus saldos e tipos de conta</p>
        </div>
        <Button onClick={() => setIsAdding(!isAdding)} variant={isAdding ? "outline" : "default"}>
          {isAdding ? "Cancelar" : <><Plus className="w-4 h-4 mr-2" /> Nova Conta</>}
        </Button>
      </div>

      {isAdding && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Nome do Banco</Label>
                <Input 
                  required 
                  value={formData.bank_name} 
                  onChange={e => setFormData({...formData, bank_name: e.target.value})} 
                  placeholder="Ex: Nubank, Itaú, Bradesco" 
                />
              </div>
              <div className="space-y-2">
                <Label>Tipo de Conta</Label>
                <Select value={formData.account_type} onValueChange={v => setFormData({...formData, account_type: v as "PF" | "PJ"})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PF">Pessoa Física (PF)</SelectItem>
                    <SelectItem value="PJ">Pessoa Jurídica (PJ)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Saldo Atual Disponível</Label>
                <Input 
                  type="number" 
                  step="0.01" 
                  required 
                  value={formData.current_balance} 
                  onChange={e => setFormData({...formData, current_balance: e.target.value})} 
                  placeholder="0,00" 
                />
              </div>
              <div className="space-y-2">
                <Label>Agência (Opcional)</Label>
                <Input 
                  value={formData.agency} 
                  onChange={e => setFormData({...formData, agency: e.target.value})} 
                  placeholder="0001" 
                />
              </div>
              <div className="space-y-2">
                <Label>Conta (Opcional)</Label>
                <Input 
                  value={formData.account_number} 
                  onChange={e => setFormData({...formData, account_number: e.target.value})} 
                  placeholder="12345-6" 
                />
              </div>
              <div className="flex items-end">
                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? "Salvando..." : "Cadastrar Conta"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {bankAccounts.length === 0 ? (
          <div className="col-span-full py-12 text-center bg-muted/20 rounded-xl border-2 border-dashed">
            <Globe className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-20" />
            <p className="text-muted-foreground">Nenhuma conta bancária cadastrada.</p>
          </div>
        ) : (
          bankAccounts.map(account => (
            <Card key={account.id} className="relative group hover:shadow-md transition-shadow">
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  {account.account_type === 'PJ' ? <Building2 className="w-4 h-4 text-primary" /> : <UserCircle className="w-4 h-4 text-blue-500" />}
                  <CardTitle className="text-base font-bold">{account.bank_name}</CardTitle>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity" 
                  onClick={() => handleDelete(account.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  <p className="text-2xl font-black text-primary">
                    R$ {account.current_balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  <div className="flex justify-between items-center text-[11px] text-muted-foreground bg-muted/50 p-2 rounded">
                    <span>{account.account_type === 'PJ' ? 'Pessoa Jurídica' : 'Pessoa Física'}</span>
                    {account.agency && <span>Ag: {account.agency}</span>}
                    {account.account_number && <span>CC: {account.account_number}</span>}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};