import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Wallet, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { BankAccount } from "@/hooks/useBankAccounts";

interface BankAccountsPanelProps {
  businessId: string;
  bankAccounts: BankAccount[];
  onRefresh: () => void;
}

export const BankAccountsPanel = ({ businessId, bankAccounts, onRefresh }: BankAccountsPanelProps) => {
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    bank_name: "",
    account_type: "PF" as "PF" | "PJ",
    current_balance: "",
    agency: "",
    account_number: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from('financial_bank_accounts').insert({
        user_id: user.id,
        business_id: businessId,
        bank_name: formData.bank_name,
        account_type: formData.account_type,
        current_balance: parseFloat(formData.current_balance) || 0,
        agency: formData.agency,
        account_number: formData.account_number
      });

      if (error) throw error;
      toast.success("Conta bancária adicionada!");
      setIsAdding(false);
      setFormData({ bank_name: "", account_type: "PF", current_balance: "", agency: "", account_number: "" });
      onRefresh();
    } catch (error) {
      toast.error("Erro ao adicionar conta");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('financial_bank_accounts').delete().eq('id', id);
      if (error) throw error;
      toast.success("Conta removida!");
      onRefresh();
    } catch (error) {
      toast.error("Erro ao remover conta");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Wallet className="w-5 h-5" /> Contas Bancárias
        </h3>
        <Button size="sm" onClick={() => setIsAdding(!isAdding)}>
          {isAdding ? "Cancelar" : <><Plus className="w-4 h-4 mr-1" /> Adicionar</>}
        </Button>
      </div>

      {isAdding && (
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Banco</Label>
                <Input required value={formData.bank_name} onChange={e => setFormData({...formData, bank_name: e.target.value})} placeholder="Ex: Nubank, Itaú" />
              </div>
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={formData.account_type} onValueChange={v => setFormData({...formData, account_type: v as "PF" | "PJ"})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PF">Pessoa Física (PF)</SelectItem>
                    <SelectItem value="PJ">Pessoa Jurídica (PJ)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Saldo Inicial</Label>
                <Input type="number" step="0.01" required value={formData.current_balance} onChange={e => setFormData({...formData, current_balance: e.target.value})} placeholder="0,00" />
              </div>
              <div className="space-y-2">
                <Label>Agência / Conta (Opcional)</Label>
                <div className="flex gap-2">
                  <Input value={formData.agency} onChange={e => setFormData({...formData, agency: e.target.value})} placeholder="Ag" />
                  <Input value={formData.account_number} onChange={e => setFormData({...formData, account_number: e.target.value})} placeholder="Conta" />
                </div>
              </div>
              <Button type="submit" className="md:col-span-2">Salvar Conta</Button>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {bankAccounts.map(account => (
          <Card key={account.id} className="relative group overflow-hidden border-l-4 border-l-primary">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold">{account.bank_name}</CardTitle>
                <p className="text-xs text-muted-foreground">{account.account_type}</p>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleDelete(account.id)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-bold">R$ {account.current_balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              {(account.agency || account.account_number) && (
                <p className="text-[10px] text-muted-foreground mt-1">
                  {account.agency && `Ag: ${account.agency}`} {account.account_number && ` C/C: ${account.account_number}`}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
