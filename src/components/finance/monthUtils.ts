/**
 * Utilitários para a visão mensal da Gestão Financeira.
 *
 * Regras de negócio:
 * - Uma transação pertence ao mês do seu vencimento (`due_date`).
 * - Se a transação for recorrente (marcada nela mesma OU pertencente a uma
 *   categoria marcada como recorrente, ex.: "Contas fixas"), ela se repete em
 *   todos os meses seguintes ao seu vencimento original. Essas repetições são
 *   projetadas em memória (não duplicamos linhas no banco) e o status de cada
 *   mês fica guardado no campo `monthly_status` da transação original.
 * - `entity_type` separa contas de Pessoa Física ('pf') de Pessoa Jurídica ('pj').
 */

export type EntityType = "pf" | "pj";

export const MONTH_NAMES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
] as const;

export interface PeriodTransaction {
  id: string;
  description: string;
  amount: number;
  type: "income" | "expense";
  category: string;
  due_date: string;
  status: string;
  payment_method: string;
  is_recurring: boolean;
  bank_account_id?: string | null;
  entity_type?: EntityType;
  monthly_status?: Record<string, { status: string; bank_account_id?: string | null }> | null;
  /** true quando a linha é uma repetição projetada de uma conta recorrente */
  __projected?: boolean;
  /** id real da transação no banco */
  __sourceId: string;
  /** chave do período no formato YYYY-MM */
  __periodKey: string;
}

export const buildPeriodKey = (year: number, month: number): string =>
  `${year}-${String(month + 1).padStart(2, "0")}`;

const normalize = (value?: string | null): string => (value || "").trim().toLowerCase();

/** Converte "YYYY-MM-DD" em partes numéricas sem sofrer com fuso horário. */
const parseDateParts = (value: string): { year: number; month: number; day: number } | null => {
  if (!value || typeof value !== "string") return null;
  const [y, m, d] = value.slice(0, 10).split("-").map(Number);
  if (!y || !m || !d) return null;
  return { year: y, month: m - 1, day: d };
};

const daysInMonth = (year: number, month: number): number => new Date(year, month + 1, 0).getDate();

/**
 * Retorna as transações visíveis em um mês/ano, já filtradas por PF/PJ e com as
 * repetições das contas recorrentes projetadas.
 */
export function getMonthTransactions(
  transactions: any[],
  year: number,
  month: number,
  recurringCategoryNames: Set<string>,
  entityType: EntityType
): PeriodTransaction[] {
  const key = buildPeriodKey(year, month);

  return transactions.reduce<PeriodTransaction[]>((acc, raw) => {
    const tEntity: EntityType = (raw?.entity_type as EntityType) || "pf";
    if (tEntity !== entityType) return acc;

    const parts = parseDateParts(raw?.due_date || raw?.date);
    if (!parts) return acc;

    const isRecurring = Boolean(raw?.is_recurring) || recurringCategoryNames.has(normalize(raw?.category));

    // Mês exato do vencimento original
    if (parts.year === year && parts.month === month) {
      acc.push({ ...raw, entity_type: tEntity, __sourceId: raw.id, __periodKey: key, __projected: false });
      return acc;
    }

    // Repetição mensal das contas recorrentes (somente meses posteriores)
    const isAfterOrigin = year > parts.year || (year === parts.year && month > parts.month);
    if (isRecurring && isAfterOrigin) {
      const monthlyStatus = (raw?.monthly_status || {}) as Record<string, any>;
      const entry = monthlyStatus[key] || {};
      const day = Math.min(parts.day, daysInMonth(year, month));
      acc.push({
        ...raw,
        id: `${raw.id}::${key}`,
        due_date: `${key}-${String(day).padStart(2, "0")}`,
        status: entry.status || "pending",
        bank_account_id: entry.bank_account_id ?? raw.bank_account_id ?? null,
        entity_type: tEntity,
        is_recurring: true,
        __sourceId: raw.id,
        __periodKey: key,
        __projected: true,
      });
    }

    return acc;
  }, []);
}
