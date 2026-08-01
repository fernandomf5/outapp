import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { downloadReceiptPDF } from "@/utils/receiptPdfGenerator";
import {
  Loader2, ListTodo, Repeat, CalendarDays, Table2, Wallet, Receipt,
  User, Brain, Download, CheckCircle2, Circle, TrendingUp, TrendingDown, History,
} from "lucide-react";

export type ClientDataSource =
  | 'client_profile'
  | 'client_tasks'
  | 'client_routines'
  | 'client_agenda'
  | 'client_table'
  | 'client_financial'
  | 'client_receipts'
  | 'client_mindmap'
  | 'customer_history'
  | 'timeline'
  | 'payment_history'
  | 'mindmap';

interface Props {
  areaId: string;
  blockId: string;
  source: ClientDataSource;
  accentColor: string;
  cardTextColor: string;
}

const SOURCE_META: Record<string, { label: string; icon: any }> = {
  client_profile: { label: 'Dados do Cliente', icon: User },
  client_tasks: { label: 'Tarefas', icon: ListTodo },
  client_routines: { label: 'Rotinas', icon: Repeat },
  client_agenda: { label: 'Agenda', icon: CalendarDays },
  client_table: { label: 'Tabelas de Organização', icon: Table2 },
  client_financial: { label: 'Gestão Financeira', icon: Wallet },
  client_receipts: { label: 'Recibos', icon: Receipt },
  client_mindmap: { label: 'Mapas Mentais', icon: Brain },
  customer_history: { label: 'Histórico do Cliente', icon: History },
  timeline: { label: 'Histórico do Cliente', icon: History },
  payment_history: { label: 'Histórico de Pagamentos', icon: Wallet },
  mindmap: { label: 'Mapas Mentais', icon: Brain },
};


const currency = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(v || 0));

const dateBR = (v?: string | null) => (v ? new Date(v).toLocaleDateString('pt-BR') : '-');
const dateTimeBR = (v?: string | null) =>
  v ? new Date(v).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-';

const WEEK = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

export function ClientDataBlock({ areaId, blockId, source, accentColor, cardTextColor }: Props) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      const { data: res, error: fnError } = await supabase.functions.invoke('members-client-data', {
        body: { areaId, blockId },
      });
      if (!active) return;
      if (fnError || (res as any)?.error) {
        setError((res as any)?.error || 'load_error');
        setData(null);
      } else {
        setData(res);
      }
      setLoading(false);
    };
    load();
    const interval = setInterval(load, 60000);
    return () => { active = false; clearInterval(interval); };
  }, [areaId, blockId, source]);

  const meta = SOURCE_META[source] || SOURCE_META.client_profile;
  const Icon = meta.icon;

  const shell = (children: React.ReactNode) => (
    <div className="space-y-3" style={{ color: cardTextColor }}>{children}</div>
  );

  const empty = (text: string) => (
    <div className="text-center py-8" style={{ color: cardTextColor }}>
      <Icon className="w-10 h-10 mx-auto mb-3 opacity-40" />
      <p className="text-sm font-medium opacity-80">{text}</p>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10" style={{ color: cardTextColor }}>
        <Loader2 className="w-5 h-5 animate-spin mr-2" /> <span className="text-sm">Carregando {meta.label.toLowerCase()}...</span>
      </div>
    );
  }

  if (error === 'customer_not_set') return empty('Cliente não selecionado');
  if (error) return empty('Não foi possível carregar os dados');

  const box = (children: React.ReactNode, key?: string) => (
    <div
      key={key}
      className="rounded-lg border p-3"
      style={{ borderColor: `${accentColor}30`, backgroundColor: `${accentColor}08` }}
    >
      {children}
    </div>
  );

  switch (source) {
    case 'client_profile': {
      const c = data?.customer;
      if (!c) return empty('Sem dados do cliente');
      const fields: [string, any][] = [
        ['Nome', c.name], ['E-mail', c.email], ['Telefone', c.phone], ['Documento', c.document],
        ['Empresa', c.company], ['Cargo', c.position], ['Categoria', c.category], ['Website', c.website],
        ['Responsável', c.contact_person], ['Área de atuação', c.market_area],
        ['Endereço', [c.address, c.city, c.state, c.postal_code, c.country].filter(Boolean).join(', ')],
        ['Cliente desde', c.created_at ? dateBR(c.created_at) : null],
      ].filter(([, v]) => v) as [string, any][];
      const custom = c.custom_fields && typeof c.custom_fields === 'object' ? Object.entries(c.custom_fields as Record<string, any>).filter(([, v]) => v !== null && v !== '' && typeof v !== 'object') : [];
      return shell(
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {fields.map(([label, value]) => (
              <div key={label} className="rounded-lg p-3" style={{ backgroundColor: `${accentColor}12` }}>
                <p className="text-[10px] uppercase tracking-wide opacity-60">{label}</p>
                <p className="text-sm font-medium break-words">{String(value)}</p>
              </div>
            ))}
          </div>
          {custom.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {custom.map(([label, value]) => (
                <div key={label} className="rounded-lg p-3" style={{ backgroundColor: `${accentColor}12` }}>
                  <p className="text-[10px] uppercase tracking-wide opacity-60">{label}</p>
                  <p className="text-sm font-medium break-words">{String(value)}</p>
                </div>
              ))}
            </div>
          )}
          {c.notes && box(<p className="text-sm whitespace-pre-wrap opacity-90">{c.notes}</p>)}
        </>
      );
    }

    case 'client_tasks': {
      const tasks: any[] = data?.tasks || [];
      if (!tasks.length) return empty('Nenhuma tarefa atribuída');
      const done = tasks.filter((t) => t.status === 'completed' || t.status === 'concluida').length;
      return shell(
        <>
          <div className="flex items-center gap-2 text-xs opacity-80">
            <Badge className="border-0" style={{ backgroundColor: `${accentColor}20`, color: accentColor }}>
              {done}/{tasks.length} concluídas
            </Badge>
          </div>
          <ScrollArea className="max-h-[420px]">
            <div className="space-y-2">
              {tasks.map((t) => {
                const isDone = t.status === 'completed' || t.status === 'concluida';
                return box(
                  <div className="flex items-start gap-3">
                    {isDone
                      ? <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: accentColor }} />
                      : <Circle className="w-4 h-4 mt-0.5 flex-shrink-0 opacity-50" />}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${isDone ? 'line-through opacity-60' : ''}`}>{t.title}</p>
                      {t.description && <p className="text-xs opacity-70 mt-0.5">{t.description}</p>}
                      <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] opacity-70">
                        {t.due_date && <span>Prazo: {dateBR(t.due_date)}</span>}
                        {t.priority && <span>• Prioridade: {t.priority}</span>}
                        {t.category && <span>• {t.category}</span>}
                      </div>
                      {Array.isArray(t.checklist) && t.checklist.length > 0 && (
                        <ul className="mt-2 space-y-1">
                          {t.checklist.map((item: any, i: number) => (
                            <li key={i} className="text-xs flex items-center gap-1.5 opacity-80">
                              {item?.done ? <CheckCircle2 className="w-3 h-3" style={{ color: accentColor }} /> : <Circle className="w-3 h-3" />}
                              <span className={item?.done ? 'line-through' : ''}>{item?.text || item?.title}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>,
                  t.id
                );
              })}
            </div>
          </ScrollArea>
        </>
      );
    }

    case 'client_routines': {
      const routines: any[] = data?.routines || [];
      if (!routines.length) return empty('Nenhuma rotina atribuída');
      return shell(
        <div className="space-y-3">
          {routines.map((r) =>
            box(
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Repeat className="w-4 h-4" style={{ color: accentColor }} />
                  <p className="text-sm font-semibold">{r.name}</p>
                </div>
                <div className="space-y-1.5">
                  {(r.items || []).length === 0 && <p className="text-xs opacity-60">Sem itens</p>}
                  {(r.items || []).map((i: any) => (
                    <div key={i.id} className="flex items-center gap-2 text-xs">
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: i.color || accentColor }} />
                      <span className="font-medium">{i.title}</span>
                      <span className="opacity-60">
                        {typeof i.day_of_week === 'number' ? WEEK[i.day_of_week] : ''}
                        {i.start_time ? ` ${i.start_time}` : ''}{i.end_time ? ` - ${i.end_time}` : ''}
                      </span>
                    </div>
                  ))}
                </div>
              </div>,
              r.id
            )
          )}
        </div>
      );
    }

    case 'client_agenda': {
      const events: any[] = data?.events || [];
      if (!events.length) return empty('Nenhum evento atribuído');
      return shell(
        <ScrollArea className="max-h-[420px]">
          <div className="space-y-2">
            {events.map((e) =>
              box(
                <div className="flex items-start gap-3">
                  <span className="w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: e.color || accentColor }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{e.title}</p>
                    {e.description && <p className="text-xs opacity-70 mt-0.5">{e.description}</p>}
                    <p className="text-[11px] opacity-70 mt-1">
                      {e.all_day ? dateBR(e.start_date) : dateTimeBR(e.start_date)}
                      {e.end_date ? ` → ${e.all_day ? dateBR(e.end_date) : dateTimeBR(e.end_date)}` : ''}
                    </p>
                  </div>
                </div>,
                e.id
              )
            )}
          </div>
        </ScrollArea>
      );
    }

    case 'client_table': {
      const tables: any[] = data?.tables || [];
      if (!tables.length) return empty('Nenhuma tabela atribuída');
      return shell(
        <div className="space-y-4">
          {tables.map((t) => (
            <div key={t.id}>
              <div className="flex items-center gap-2 mb-2">
                <Table2 className="w-4 h-4" style={{ color: t.color || accentColor }} />
                <p className="text-sm font-semibold">{t.name}</p>
              </div>
              <div className="overflow-x-auto rounded-lg border" style={{ borderColor: `${accentColor}30` }}>
                <table className="w-full text-xs">
                  <thead>
                    <tr style={{ backgroundColor: `${accentColor}15` }}>
                      {t.columns.map((c: any) => (
                        <th key={c.id} className="text-left px-3 py-2 font-semibold whitespace-nowrap">{c.name}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {t.rows.map((r: any) => (
                      <tr key={r.id} className="border-t" style={{ borderColor: `${accentColor}20` }}>
                        {t.columns.map((c: any) => (
                          <td key={c.id} className="px-3 py-2 whitespace-nowrap opacity-90">
                            {r.cells.find((cell: any) => cell.column_id === c.id)?.value || '-'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      );
    }

    case 'client_financial': {
      const businesses: any[] = data?.businesses || [];
      if (!businesses.length) return empty('Nenhuma gestão financeira atribuída');
      return shell(
        <div className="space-y-4">
          {businesses.map((b) => {
            const income = (b.transactions || []).filter((t: any) => t.type === 'income' || t.type === 'entrada')
              .reduce((s: number, t: any) => s + Number(t.amount || 0), 0);
            const expense = (b.transactions || []).filter((t: any) => t.type === 'expense' || t.type === 'saida' || t.type === 'despesa')
              .reduce((s: number, t: any) => s + Number(t.amount || 0), 0);
            return (
              <div key={b.id} className="space-y-2">
                <div className="flex items-center gap-2">
                  <Wallet className="w-4 h-4" style={{ color: accentColor }} />
                  <p className="text-sm font-semibold">{b.name}</p>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'Entradas', value: currency(income), icon: TrendingUp },
                    { label: 'Saídas', value: currency(expense), icon: TrendingDown },
                    { label: 'Saldo', value: currency(income - expense), icon: Wallet },
                  ].map(({ label, value, icon: I }) => (
                    <div key={label} className="rounded-lg p-3 text-center" style={{ backgroundColor: `${accentColor}12` }}>
                      <I className="w-4 h-4 mx-auto mb-1" style={{ color: accentColor }} />
                      <p className="text-[10px] opacity-70">{label}</p>
                      <p className="text-xs font-bold" style={{ color: accentColor }}>{value}</p>
                    </div>
                  ))}
                </div>
                <ScrollArea className="max-h-[300px]">
                  <div className="space-y-1.5">
                    {(b.transactions || []).slice(0, 100).map((t: any) => (
                      <div key={t.id} className="flex items-center gap-3 p-2.5 rounded-lg border" style={{ borderColor: `${accentColor}25` }}>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">{t.description || t.category}</p>
                          <p className="text-[10px] opacity-60">{dateBR(t.date)} {t.category ? `• ${t.category}` : ''}</p>
                        </div>
                        <p className="text-xs font-bold flex-shrink-0" style={{ color: accentColor }}>
                          {currency(t.amount)}
                        </p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            );
          })}
        </div>
      );
    }

    case 'client_receipts': {
      const receipts: any[] = data?.receipts || [];
      if (!receipts.length) return empty('Nenhum recibo encontrado');
      const total = receipts.reduce((s, r) => s + Number(r.total_amount || 0), 0);
      return shell(
        <>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg p-3 text-center" style={{ backgroundColor: `${accentColor}12` }}>
              <p className="text-[10px] opacity-70">Total</p>
              <p className="text-sm font-bold" style={{ color: accentColor }}>{currency(total)}</p>
            </div>
            <div className="rounded-lg p-3 text-center" style={{ backgroundColor: `${accentColor}12` }}>
              <p className="text-[10px] opacity-70">Recibos</p>
              <p className="text-sm font-bold" style={{ color: accentColor }}>{receipts.length}</p>
            </div>
          </div>
          <ScrollArea className="max-h-[400px]">
            <div className="space-y-2">
              {receipts.map((r) =>
                box(
                  <div className="flex items-center gap-3">
                    <Receipt className="w-4 h-4 flex-shrink-0" style={{ color: accentColor }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{r.receipt_number}</p>
                      <p className="text-[11px] opacity-70">{dateBR(r.receipt_data?.date || r.created_at)}</p>
                    </div>
                    <p className="text-sm font-bold flex-shrink-0" style={{ color: accentColor }}>{currency(r.total_amount)}</p>
                    <Button
                      variant="ghost" size="icon" className="h-7 w-7 flex-shrink-0"
                      title="Baixar PDF" style={{ color: accentColor }}
                      onClick={() => { try { downloadReceiptPDF(r.receipt_data, r.receipt_data?.logo_url || undefined); } catch { /* noop */ } }}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>,
                  r.id
                )
              )}
            </div>
          </ScrollArea>
        </>
      );
    }

    case 'client_mindmap':
    case 'mindmap': {
      const maps: any[] = data?.mindMaps || [];
      if (!maps.length) return empty('Nenhum mapa mental atribuído');
      return shell(
        <div className="space-y-3">
          {maps.map((m) => {
            const nodes: any[] = Array.isArray(m.nodes) ? m.nodes : [];
            return box(
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Brain className="w-4 h-4" style={{ color: accentColor }} />
                  <p className="text-sm font-semibold">{m.name}</p>
                  <Badge className="border-0 text-[10px]" style={{ backgroundColor: `${accentColor}20`, color: accentColor }}>
                    {nodes.length} nós
                  </Badge>
                </div>
                {m.description && <p className="text-xs opacity-70 mb-2">{m.description}</p>}
                <div className="flex flex-wrap gap-1.5">
                  {nodes.slice(0, 40).map((n: any, i: number) => (
                    <span key={i} className="text-[11px] px-2 py-1 rounded-full" style={{ backgroundColor: `${accentColor}15` }}>
                      {n?.data?.label || n?.label || `Nó ${i + 1}`}
                    </span>
                  ))}
                </div>
              </div>,
              m.id
            );
          })}
        </div>
      );
    }

    case 'timeline':
    case 'customer_history': {
      const history: any[] = data?.history || [];
      if (!history.length) return empty('Nenhum histórico registrado');
      return shell(
        <ScrollArea className="max-h-[460px]">
          <div className="space-y-2">
            {history.map((h) =>
              box(
                <div className="flex items-start gap-3">
                  <History className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: accentColor }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{h.title}</p>
                    {h.description && <p className="text-xs opacity-70 mt-0.5 whitespace-pre-wrap">{h.description}</p>}
                    <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] opacity-70">
                      {h.service_type && <span>{h.service_type}</span>}
                      {h.start_date && <span>• {dateBR(h.start_date)}</span>}
                      {h.end_date && <span>→ {dateBR(h.end_date)}</span>}
                      {h.status && <span>• {h.status}</span>}
                    </div>
                  </div>
                </div>,
                h.id
              )
            )}
          </div>
        </ScrollArea>
      );
    }

    case 'payment_history': {
      const payments: any[] = data?.payments || [];
      if (!payments.length) return empty('Nenhum pagamento registrado');
      const total = payments.reduce((s, p) => s + Number(p.amount || 0), 0);
      return shell(
        <>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg p-3 text-center" style={{ backgroundColor: `${accentColor}12` }}>
              <p className="text-[10px] opacity-70">Total pago</p>
              <p className="text-sm font-bold" style={{ color: accentColor }}>{currency(total)}</p>
            </div>
            <div className="rounded-lg p-3 text-center" style={{ backgroundColor: `${accentColor}12` }}>
              <p className="text-[10px] opacity-70">Pagamentos</p>
              <p className="text-sm font-bold" style={{ color: accentColor }}>{payments.length}</p>
            </div>
          </div>
          <ScrollArea className="max-h-[400px]">
            <div className="space-y-2">
              {payments.map((p) =>
                box(
                  <div className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{p.description || 'Pagamento'}</p>
                      <p className="text-[11px] opacity-70">
                        {dateBR(p.payment_date || p.created_at)}{p.payment_method ? ` • ${p.payment_method}` : ''}
                      </p>
                    </div>
                    <p className="text-sm font-bold flex-shrink-0" style={{ color: accentColor }}>{currency(p.amount)}</p>
                  </div>,
                  p.id
                )
              )}
            </div>
          </ScrollArea>
        </>
      );
    }

    default:
      return empty('Conteúdo indisponível');
  }
}
