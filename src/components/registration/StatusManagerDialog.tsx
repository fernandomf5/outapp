import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, RotateCcw, GripVertical, ArrowUp, ArrowDown } from 'lucide-react';
import {
  StatusOption,
  STATUS_COLOR_PRESETS,
  DEFAULT_STATUS_OPTIONS,
  loadStatusOptions,
  saveStatusOptions,
  slugifyStatus,
} from './statusOptions';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function StatusManagerDialog({ open, onOpenChange }: Props) {
  const [list, setList] = useState<StatusOption[]>([]);

  useEffect(() => {
    if (open) setList(loadStatusOptions());
  }, [open]);

  const updateItem = (i: number, patch: Partial<StatusOption>) => {
    setList((prev) => prev.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  };

  const removeItem = (i: number) => setList((prev) => prev.filter((_, idx) => idx !== i));

  const move = (i: number, dir: -1 | 1) => {
    setList((prev) => {
      const next = [...prev];
      const j = i + dir;
      if (j < 0 || j >= next.length) return prev;
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  };

  const addItem = () => {
    setList((prev) => [
      ...prev,
      { value: `status_${Date.now()}`, label: 'Novo Status', color: STATUS_COLOR_PRESETS[0].color },
    ]);
  };

  const handleSave = () => {
    const cleaned = list
      .map((s) => ({
        ...s,
        label: s.label.trim(),
        value: s.value?.trim() || slugifyStatus(s.label),
      }))
      .filter((s) => s.label);

    const seen = new Set<string>();
    const deduped = cleaned.map((s) => {
      let v = s.value;
      while (seen.has(v)) v = `${v}_${Math.floor(Math.random() * 1000)}`;
      seen.add(v);
      return { ...s, value: v };
    });

    if (deduped.length === 0) {
      toast.error('Cadastre pelo menos um status.');
      return;
    }

    saveStatusOptions(deduped);
    toast.success('Status atualizados');
    onOpenChange(false);
  };

  const handleReset = () => {
    setList(DEFAULT_STATUS_OPTIONS);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Status</DialogTitle>
          <DialogDescription>
            Personalize os status disponíveis para os cadastros. As alterações se aplicam a todas as categorias.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          {list.map((s, i) => (
            <div key={i} className="flex items-center gap-2 p-2 rounded-md border bg-card">
              <div className="flex flex-col">
                <Button type="button" variant="ghost" size="icon" className="h-5 w-5" onClick={() => move(i, -1)} disabled={i === 0}>
                  <ArrowUp className="h-3 w-3" />
                </Button>
                <Button type="button" variant="ghost" size="icon" className="h-5 w-5" onClick={() => move(i, 1)} disabled={i === list.length - 1}>
                  <ArrowDown className="h-3 w-3" />
                </Button>
              </div>
              <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
              <Input
                value={s.label}
                onChange={(e) => updateItem(i, { label: e.target.value })}
                placeholder="Nome do status"
                className="flex-1 min-w-[120px]"
              />
              <Badge variant="outline" className={`${s.color} font-normal whitespace-nowrap`}>
                {s.label || 'Prévia'}
              </Badge>
              <div className="flex flex-wrap gap-1 max-w-[180px]">
                {STATUS_COLOR_PRESETS.map((p) => {
                  const swatch = p.color.split(' ').find((c) => c.startsWith('bg-')) || '';
                  const selected = s.color === p.color;
                  return (
                    <button
                      key={p.name}
                      type="button"
                      title={p.name}
                      onClick={() => updateItem(i, { color: p.color })}
                      className={`h-5 w-5 rounded-full border-2 ${swatch} ${selected ? 'border-foreground' : 'border-transparent'}`}
                    />
                  );
                })}
              </div>
              <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(i)} className="text-destructive">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-2 pt-2">
          <Button type="button" variant="outline" size="sm" onClick={addItem} className="gap-2">
            <Plus className="h-4 w-4" /> Adicionar Status
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={handleReset} className="gap-2">
            <RotateCcw className="h-4 w-4" /> Restaurar Padrões
          </Button>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
