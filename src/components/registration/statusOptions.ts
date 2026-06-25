import { useEffect, useState, useCallback } from 'react';

export interface StatusOption {
  value: string;
  label: string;
  color: string;
}

export const DEFAULT_STATUS_OPTIONS: StatusOption[] = [
  { value: 'novo', label: 'Novo', color: 'bg-blue-500/15 text-blue-600 border-blue-500/30' },
  { value: 'ativo', label: 'Ativo', color: 'bg-green-500/15 text-green-600 border-green-500/30' },
  { value: 'inativo', label: 'Inativo', color: 'bg-zinc-500/15 text-zinc-600 border-zinc-500/30' },
  { value: 'lead', label: 'Lead', color: 'bg-purple-500/15 text-purple-600 border-purple-500/30' },
  { value: 'cliente', label: 'Cliente', color: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30' },
  { value: 'prospecto', label: 'Prospecto', color: 'bg-amber-500/15 text-amber-600 border-amber-500/30' },
  { value: 'em_negociacao', label: 'Em Negociação', color: 'bg-orange-500/15 text-orange-600 border-orange-500/30' },
  { value: 'concluido', label: 'Concluído', color: 'bg-teal-500/15 text-teal-600 border-teal-500/30' },
  { value: 'cancelado', label: 'Cancelado', color: 'bg-red-500/15 text-red-600 border-red-500/30' },
];

export const STATUS_COLOR_PRESETS: { name: string; color: string }[] = [
  { name: 'Azul', color: 'bg-blue-500/15 text-blue-600 border-blue-500/30' },
  { name: 'Verde', color: 'bg-green-500/15 text-green-600 border-green-500/30' },
  { name: 'Esmeralda', color: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30' },
  { name: 'Teal', color: 'bg-teal-500/15 text-teal-600 border-teal-500/30' },
  { name: 'Âmbar', color: 'bg-amber-500/15 text-amber-600 border-amber-500/30' },
  { name: 'Laranja', color: 'bg-orange-500/15 text-orange-600 border-orange-500/30' },
  { name: 'Vermelho', color: 'bg-red-500/15 text-red-600 border-red-500/30' },
  { name: 'Rosa', color: 'bg-pink-500/15 text-pink-600 border-pink-500/30' },
  { name: 'Roxo', color: 'bg-purple-500/15 text-purple-600 border-purple-500/30' },
  { name: 'Índigo', color: 'bg-indigo-500/15 text-indigo-600 border-indigo-500/30' },
  { name: 'Ciano', color: 'bg-cyan-500/15 text-cyan-600 border-cyan-500/30' },
  { name: 'Cinza', color: 'bg-zinc-500/15 text-zinc-600 border-zinc-500/30' },
];

const STORAGE_KEY = 'registration-status-options-v1';
const EVENT_NAME = 'registration-status-options-changed';

export function loadStatusOptions(): StatusOption[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATUS_OPTIONS;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
  } catch {}
  return DEFAULT_STATUS_OPTIONS;
}

export function saveStatusOptions(opts: StatusOption[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(opts));
    window.dispatchEvent(new CustomEvent(EVENT_NAME));
  } catch {}
}

export function useStatusOptions() {
  const [options, setOptions] = useState<StatusOption[]>(() => loadStatusOptions());

  useEffect(() => {
    const handler = () => setOptions(loadStatusOptions());
    window.addEventListener(EVENT_NAME, handler);
    window.addEventListener('storage', handler);
    return () => {
      window.removeEventListener(EVENT_NAME, handler);
      window.removeEventListener('storage', handler);
    };
  }, []);

  const update = useCallback((next: StatusOption[]) => {
    setOptions(next);
    saveStatusOptions(next);
  }, []);

  return { options, update };
}

export function slugifyStatus(label: string): string {
  return label
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 40) || `status_${Date.now()}`;
}
