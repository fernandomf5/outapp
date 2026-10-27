import { useState } from "react";
import { Pencil, Plus, Trash2, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import type { FinancialFolder } from "@/hooks/useFinancialFolders";
import { toast } from "sonner";

interface Props {
  folders: FinancialFolder[];
  transactions: Array<{ folder_id?: string | null; amount: number; type: string; status: string }>;
  selected: string;
  onSelect: (id: string) => void;
  onCreate: (name: string, color: string) => Promise<FinancialFolder>;
  onEdit: (id: string, name: string, color: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onRefreshTransactions: () => Promise<void>;
  disabled?: boolean;
}
const COLORS = ["#39c5ff", "#9c78ff", "#42daa5", "#f4b65e", "#eb76cd", "#5789ff"];
type Editable = { id?: string; name: string; color: string };

export function FinancialFolderTabs({ folders, transactions, selected, onSelect, onCreate, onEdit, onDelete, onRefreshTransactions, disabled }: Props) {
  const [editing, setEditing] = useState<Editable | null>(null);
  const [toDelete, setToDelete] = useState<FinancialFolder | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const folderTotal = (id: string) => transactions.filter((t) => t.folder_id === id).length;
  const folderSum = (id: string) => transactions.filter((t) => t.folder_id === id)
    .reduce((sum, t) => sum + ((t.type === "income" ? 1 : -1) * (Number(t.amount) || 0)), 0);
  const money = (value: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
  const save = async () => {
    if (!editing || !editing.name.trim()) return;
    setSaving(true);
    try {
      if (editing.id) await onEdit(editing.id, editing.name, editing.color);
      else {
        const created = await onCreate(editing.name, editing.color);
        onSelect(created.id);
      }
      setEditing(null);
      toast.success(editing.id ? "Aba atualizada." : "Nova aba criada. Agora você pode adicionar suas contas!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível salvar a aba.");
    } finally { setSaving(false); }
  };
  const remove = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await onDelete(toDelete.id);
      if (selected === toDelete.id) onSelect(folders.find(folder => folder.id !== toDelete.id)?.id ?? "");
      await onRefreshTransactions();
      toast.success("Aba excluída. Os lançamentos anteriores foram preservados no histórico.");
      setToDelete(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível excluir a aba.");
    } finally { setDeleting(false); }
  };
  return (
    <section className="finance-folder-shell" aria-label="Abas da Gestão Financeira">
      <div className="finance-folder-heading">
        <div><span className="finance-folder-kicker">SEUS ESPAÇOS FINANCEIROS</span>
          <h2>Organize por abas</h2>
          <p>Separe Contas de Casa, Trabalho e o que mais precisar. Cada aba mostra apenas seus lançamentos.</p>
        </div>
        {!disabled && <Button onClick={() => setEditing({ name: "", color: COLORS[0] })} className="finance-folder-create"><Plus size={17}/> Nova aba</Button>}
      </div>
      {folders.length === 0 && <p className="finance-folder-annotation">Crie sua primeira aba para organizar os lançamentos financeiros.</p>}
      <div className="finance-folder-tabs" role="group" aria-label="Escolha a aba financeira">
        {folders.map(folder => (
          <div key={folder.id} className={"finance-folder-chip " + (selected === folder.id ? "is-selected" : "")} style={{ "--folder-accent": folder.color } as React.CSSProperties}>
            <button type="button" className="finance-folder-select" onClick={() => onSelect(folder.id)}
              aria-pressed={selected === folder.id} title={folder.name}>
              <Wallet size={18}/>
              <span className="finance-folder-chip-name">{folder.name}</span>
              <span className="finance-folder-chip-count">{folderTotal(folder.id)}</span>
            </button>
            {!disabled && <button
              type="button" className="finance-folder-edit" title={"Editar " + folder.name} aria-label={"Editar aba " + folder.name}
              onClick={() => setEditing({ id: folder.id, name: folder.name, color: folder.color })}><Pencil size={13}/></button>}
          </div>
        ))}
      </div>
      <div className="finance-folder-footer"><span>{folders.find(f => f.id === selected)?.name || "Selecione ou crie uma aba"}</span>
        <strong>{folderTotal(selected)} lançamento(s) neste mês</strong>
        <span>Resultado previsto: <b>{money(folderSum(selected))}</b></span>
      </div>
      {disabled && <p className="finance-folder-annotation">As abas pertencem ao titular do negócio. Os acessos de equipe continuam usando a visualização padrão.</p>}
      <Dialog open={editing !== null} onOpenChange={open => !saving && !open && setEditing(null)}>
        <DialogContent className="finance-folder-dialog sm:max-w-md">
          <DialogHeader><DialogTitle>{editing?.id ? "Editar aba" : "Criar aba financeira"}</DialogTitle>
            <DialogDescription>Exemplos: Contas de Casa, Empresa, Estudos, Cartão de Crédito. Esta organização não altera seus bancos ou categorias.</DialogDescription>
          </DialogHeader>
          <form onSubmit={e => { e.preventDefault(); void save(); }} className="space-y-5">
            <div className="space-y-2"><Label htmlFor="finance-folder-name">Nome da aba</Label>
              <Input id="finance-folder-name" autoFocus required maxLength={80} placeholder="Ex.: Contas de Casa"
                value={editing?.name || ""} onChange={e => setEditing(current => current ? { ...current, name: e.target.value } : null)}/></div>
            <div className="space-y-2"><Label>Cor de identificação</Label>
              <div className="finance-folder-colors">
                {COLORS.map(color => <button type="button" key={color} style={{ background: color }}
                  className={editing?.color === color ? "is-selected" : ""}
                  onClick={() => setEditing(current => current ? { ...current, color } : null)}
                  aria-label={"Selecionar cor " + color} aria-pressed={editing?.color === color}/>)}
              </div></div>
            <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2">
              {editing?.id && <Button type="button" variant="destructive" onClick={() => { const folder = folders.find(f => f.id === editing.id); if (folder) { setEditing(null); setToDelete(folder); } }} className="sm:mr-auto"><Trash2 size={15}/> Excluir aba</Button>}
              <Button type="button" variant="outline" onClick={() => setEditing(null)} disabled={saving}>Cancelar</Button>
              <Button type="submit" disabled={saving || !editing?.name.trim()}>{saving ? "Salvando..." : editing?.id ? "Salvar" : "Criar aba"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <AlertDialog open={toDelete !== null} onOpenChange={open => !deleting && !open && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Excluir a aba “{toDelete?.name}”?</AlertDialogTitle>
            <AlertDialogDescription>A aba será excluída, mas os lançamentos e o histórico financeiro serão preservados. Para voltar a visualizá-los por aba, será necessário vinculá-los a outra aba.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction disabled={deleting} onClick={e => { e.preventDefault(); void remove(); }}>{deleting ? "Excluindo..." : "Excluir somente a aba"}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
