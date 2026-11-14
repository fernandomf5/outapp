import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FolderPlus, Folder, Download, Trash2, Search, Archive, ArrowRightLeft } from 'lucide-react';

export interface LeadLibrarySource {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  notes: string | null;
  tags: string[] | null;
  stage_id: string;
}
interface FolderRecord { id: string; name: string; }
interface ArchivedContact {
  id: string; folder_id: string; name: string; email: string | null;
  phone: string | null; company: string | null; notes: string | null;
  tags: string[] | null; created_at: string;
}
// The migration adds these tables; regenerate Supabase types after deployment.
// This cast is intentionally isolated here until the generated types are refreshed.
const db = supabase as any;
const csvCell = (value: unknown) => {
  const raw = String(value ?? '');
  // Prevent spreadsheet formula injection when a downloaded CSV is opened.
  const safe = /^[\s]*[=+@\-]/.test(raw) ? "'" + raw : raw;
  return '"' + safe.replace(/"/g, '""') + '"';
};
const downloadCsv = (filename: string, headers: string[], rows: string[][]) => {
  const csv = '\uFEFF' + [headers, ...rows].map(row => row.map(csvCell).join(';')).join('\r\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
};

interface Props {
  source: LeadLibrarySource | null;
  sourceFunnelName?: string;
  sourceStageName?: string;
  onCloseSource: () => void;
  onRemovedFromFunnel: () => void;
}

export default function LeadLibraryPanel({ source, sourceFunnelName, sourceStageName, onCloseSource, onRemovedFromFunnel }: Props) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [folders, setFolders] = useState<FolderRecord[]>([]);
  const [contacts, setContacts] = useState<ArchivedContact[]>([]);
  const [folderName, setFolderName] = useState('');
  const [selectedFolder, setSelectedFolder] = useState('');
  const [filterFolder, setFilterFolder] = useState('all');
  const [search, setSearch] = useState('');
  const [removeAfterSaving, setRemoveAfterSaving] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const requestId = useRef(0);
  const currentFolder = useRef(filterFolder);
  currentFolder.current = filterFolder;

  // A folder change starts one explicit fetch, rather than recreating an effect
  // every time the selected folder or returned folder list changes.
  const refresh = useCallback(async (folderId?: string) => {
    const userId = user?.id;
    if (!userId) { setLoading(false); return; }
    const targetFolder = folderId ?? currentFolder.current;
    const request = ++requestId.current;
    setLoading(true);
    setLoadError(null);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    try {
      const foldersResult = await db.from('lead_library_folders')
        .select('id,name').eq('user_id', userId).order('name')
        .abortSignal(controller.signal);
      if (foldersResult.error) throw foldersResult.error;
      const availableFolders: FolderRecord[] = foldersResult.data || [];
      if (request !== requestId.current) return;
      setFolders(availableFolders);

      // Do not overwrite the selected folder when another request is in flight.
      const validFolder = targetFolder === 'all' || availableFolders.some(folder => folder.id === targetFolder);
      const selected = validFolder ? targetFolder : 'all';
      if (!validFolder) {
        currentFolder.current = 'all';
        setFilterFolder('all');
      }

      let query = db.from('lead_library_contacts')
        .select('id,folder_id,name,email,phone,company,notes,tags,created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1000)
        .abortSignal(controller.signal);
      if (selected !== 'all') query = query.eq('folder_id', selected);
      const result = await query;
      if (result.error) throw result.error;
      if (request === requestId.current) setContacts(result.data || []);
    } catch (error) {
      if (request !== requestId.current) return;
      const message = controller.signal.aborted
        ? 'A consulta demorou demais. Verifique sua conexão e tente novamente.'
        : error instanceof Error ? error.message : 'Não foi possível carregar os leads da pasta.';
      setLoadError(message);
      setContacts([]);
      toast.error(message);
    } finally {
      clearTimeout(timeout);
      if (request === requestId.current) setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (open || source) void refresh();
    return () => { requestId.current += 1; };
  }, [open, source?.id, refresh]);

  useEffect(() => {
    if (source) { setSelectedFolder(''); setRemoveAfterSaving(false); }
  }, [source?.id]);

  const changeFolder = (id: string) => {
    currentFolder.current = id;
    setFilterFolder(id);
    void refresh(id);
  };

  const createFolder = async () => {
    const name = folderName.trim();
    if (!user || !name) return;
    const { data, error } = await db.from('lead_library_folders')
      .insert({ user_id: user.id, name }).select('id,name').single();
    if (error) { toast.error(error.code === '23505' ? 'Já existe uma pasta com esse nome.' : error.message); return; }
    setFolderName('');
    setSelectedFolder(data.id);
    toast.success('Pasta criada.');
    await refresh();
  };

  const archive = async () => {
    if (!user || !source || !selectedFolder) { toast.error('Selecione uma pasta.'); return; }
    setSaving(true);
    try {
      // Re-archiving the same lead updates its snapshot rather than duplicating it.
      const { data: previous, error: lookupError } = await db.from('lead_library_contacts')
        .select('id').eq('user_id', user.id).eq('source_lead_id', source.id).maybeSingle();
      if (lookupError) throw lookupError;
      const snapshot = {
        folder_id: selectedFolder,
        name: source.name, email: source.email, phone: source.phone,
        company: source.company, notes: source.notes, tags: source.tags,
        source_funnel_name: sourceFunnelName || null,
        source_stage_name: sourceStageName || null,
        updated_at: new Date().toISOString(),
      };
      const result = previous
        ? await db.from('lead_library_contacts').update(snapshot).eq('id', previous.id).eq('user_id', user.id)
        : await db.from('lead_library_contacts').insert({ ...snapshot, user_id: user.id, source_lead_id: source.id });
      if (result.error) throw result.error;
      if (removeAfterSaving) {
        const deletion = await supabase.from('funnel_leads').delete().eq('id', source.id);
        if (deletion.error) {
          toast.warning('Contato salvo na lista, mas não foi possível removê-lo do funil.');
        } else {
          onRemovedFromFunnel();
          toast.success('Lead enviado para a lista e removido do funil.');
        }
      } else {
        toast.success('Lead salvo na lista! Continua disponível no funil.');
      }
      onCloseSource();
      await refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível arquivar o lead.');
    } finally { setSaving(false); }
  };

  const deleteContact = async (contact: ArchivedContact) => {
    if (!window.confirm('Excluir ' + contact.name + ' da lista de leads? O registro do funil não será afetado.')) return;
    const { error } = await db.from('lead_library_contacts').delete().eq('id', contact.id).eq('user_id', user?.id);
    if (error) toast.error(error.message);
    else { toast.success('Contato removido da lista.'); await refresh(); }
  };

  const deleteFolder = async () => {
    if (filterFolder === 'all') return;
    const folder = folders.find(f => f.id === filterFolder);
    if (!folder || !window.confirm('Excluir a pasta "' + folder.name + '" e todos os contatos armazenados nela?')) return;
    const { error } = await db.from('lead_library_folders').delete().eq('id', folder.id).eq('user_id', user?.id);
    if (error) toast.error(error.message);
    else { currentFolder.current = 'all'; setFilterFolder('all'); toast.success('Pasta excluída.'); await refresh('all'); }
  };

  const shown = contacts.filter(c =>
    (filterFolder === 'all' || c.folder_id === filterFolder) &&
    [c.name, c.email, c.phone, c.company].some(value => (value || '').toLowerCase().includes(search.toLowerCase().trim()))
  );
  const exportContacts = (mode: 'full' | 'email' | 'phone') => {
    const selected = shown.filter(c => mode === 'full' ? true : Boolean(mode === 'email' ? c.email : c.phone));
    if (!selected.length) { toast.error('Não há contatos para exportar.'); return; }
    const data = selected.map(c => mode === 'email' ? [c.email || '']
      : mode === 'phone' ? [c.phone || '']
      : [c.name, c.email || '', c.phone || '', c.company || '', folders.find(f => f.id === c.folder_id)?.name || '', c.notes || '']);
    const headers = mode === 'email' ? ['Email'] : mode === 'phone' ? ['Telefone'] : ['Nome', 'Email', 'Telefone', 'Empresa', 'Pasta', 'Observações'];
    downloadCsv('outapp-leads-' + mode + '-' + new Date().toISOString().slice(0, 10) + '.csv', headers, data);
    toast.success(selected.length + ' contato(s) exportado(s).');
  };

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}><Archive className="h-4 w-4 mr-2" />Controle de leads e pastas</Button>
      <Dialog open={Boolean(source)} onOpenChange={opened => { if (!opened) onCloseSource(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enviar para lista de leads</DialogTitle>
            <DialogDescription>Guarde os dados de {source?.name} em uma pasta para campanhas futuras, sem perder o contato.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Pasta de destino</label>
              <Select value={selectedFolder} onValueChange={setSelectedFolder}>
                <SelectTrigger><SelectValue placeholder="Selecione uma pasta" /></SelectTrigger>
                <SelectContent>{folders.map(folder => <SelectItem key={folder.id} value={folder.id}>{folder.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Input value={folderName} onChange={event => setFolderName(event.target.value)} placeholder="Nova pasta: Leads A, Leads B..." maxLength={100} />
              <Button variant="outline" onClick={createFolder} disabled={!folderName.trim()}><FolderPlus className="w-4 h-4 mr-1" />Criar</Button>
            </div>
            <label className="flex gap-3 items-start text-sm cursor-pointer">
              <Checkbox checked={removeAfterSaving} onCheckedChange={value => setRemoveAfterSaving(value === true)} />
              <span>Remover do funil após salvar na lista (o contato continuará armazenado na pasta).</span>
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={onCloseSource}>Cancelar</Button>
            <Button disabled={!selectedFolder || saving} onClick={archive}>{saving ? 'Salvando...' : 'Salvar na lista'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Controle de leads e pastas</DialogTitle>
            <DialogDescription>Biblioteca independente dos funis. Organize os contatos por pasta e exporte CSV para campanhas autorizadas.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Input className="flex-1 min-w-[180px]" value={folderName} maxLength={100} onChange={event => setFolderName(event.target.value)} placeholder="Criar pasta: Leads A..." />
              <Button onClick={createFolder} disabled={!folderName.trim()}><FolderPlus className="w-4 h-4 mr-2" />Nova pasta</Button>
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              <Select value={filterFolder} onValueChange={changeFolder}>
                <SelectTrigger className="w-[210px]"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="all">Todas as pastas</SelectItem>{folders.map(folder => <SelectItem key={folder.id} value={folder.id}>{folder.name}</SelectItem>)}</SelectContent>
              </Select>
              <div className="relative flex-1 min-w-[160px]"><Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" /><Input className="pl-9" placeholder="Buscar lead" value={search} onChange={event => setSearch(event.target.value)} /></div>
              <Button variant="outline" size="sm" onClick={() => exportContacts('full')}><Download className="w-4 h-4 mr-1" />Todos</Button>
              <Button variant="outline" size="sm" onClick={() => exportContacts('email')}>E-mails CSV</Button>
              <Button variant="outline" size="sm" onClick={() => exportContacts('phone')}>Telefones CSV</Button>
              {filterFolder !== 'all' && <Button variant="destructive" size="sm" onClick={deleteFolder}><Trash2 className="w-4 h-4 mr-1" />Excluir pasta</Button>}
            </div>
            <p className="text-xs text-muted-foreground">{shown.length} contatos encontrados. Antes de enviar campanhas, verifique a base legal e os pedidos de descadastro (LGPD).</p>
            <div className="border rounded-lg divide-y max-h-[400px] overflow-y-auto">
              {loading ? <div className="flex items-center justify-between gap-3 p-5"><p className="text-sm" role="status">Carregando leads...</p><Button size="sm" variant="ghost" onClick={() => { requestId.current += 1; setLoading(false); setLoadError('Consulta interrompida. Tente novamente.'); }}>Cancelar</Button></div> : loadError ? <div className="p-5 space-y-2"><p className="text-sm text-destructive">{loadError}</p><Button size="sm" variant="outline" onClick={() => void refresh()}>Tentar novamente</Button></div> : shown.length === 0 ? <p className="p-5 text-sm text-muted-foreground">Nenhum lead salvo. Envie um contato do funil ou crie uma pasta.</p> : shown.map(contact => (
                <div key={contact.id} className="p-3 flex items-center gap-3 justify-between">
                  <div className="min-w-0">
                    <p className="font-medium text-sm">{contact.name}</p>
                    <p className="text-xs text-muted-foreground break-all">{[contact.email, contact.phone].filter(Boolean).join(' · ') || 'Sem contato'} · {folders.find(f => f.id === contact.folder_id)?.name || 'Pasta'}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Select value={contact.folder_id} onValueChange={async folder_id => {
                      const { error } = await db.from('lead_library_contacts').update({ folder_id }).eq('id', contact.id).eq('user_id', user?.id);
                      if (error) toast.error(error.message); else { toast.success('Lead movido.'); await refresh(); }
                    }}>
                      <SelectTrigger className="w-[130px] h-8"><ArrowRightLeft className="h-3 w-3 mr-1" /><SelectValue /></SelectTrigger>
                      <SelectContent>{folders.map(folder => <SelectItem key={folder.id} value={folder.id}>{folder.name}</SelectItem>)}</SelectContent>
                    </Select>
                    <Button variant="ghost" size="icon" onClick={() => deleteContact(contact)} aria-label="Excluir contato da lista"><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
