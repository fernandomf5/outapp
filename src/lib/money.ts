/**
 * Utilitários para valores monetários em formato brasileiro.
 *
 * O objetivo é aceitar livremente entradas como:
 * - "160000"      -> 160000
 * - "160.000"     -> 160000   (ponto como separador de milhar)
 * - "160.000,00"  -> 160000
 * - "4000000"     -> 4000000
 * - "1500.50"     -> 1500.5   (ponto como decimal quando não há vírgula)
 */

/**
 * Converte uma string digitada pelo usuário (formato BR ou US) em número.
 * Retorna 0 quando o valor é vazio ou inválido.
 */
export function parseMoneyBR(raw: string | number | null | undefined): number {
  if (raw === null || raw === undefined) return 0;
  if (typeof raw === "number") return Number.isFinite(raw) ? raw : 0;

  let value = String(raw).trim();
  if (!value) return 0;

  // Mantém apenas dígitos, pontos, vírgulas e sinal negativo
  value = value.replace(/[^\d.,-]/g, "");

  const hasComma = value.includes(",");
  const hasDot = value.includes(".");

  if (hasComma && hasDot) {
    // Formato BR: ponto = milhar, vírgula = decimal
    value = value.replace(/\./g, "").replace(",", ".");
  } else if (hasComma) {
    // Só vírgula: trata como decimal
    value = value.replace(/\./g, "").replace(",", ".");
  } else if (hasDot) {
    // Só ponto: se houver múltiplos pontos, são separadores de milhar.
    // Se houver um ponto seguido de exatamente 3 dígitos no final e mais
    // de 3 dígitos antes, também é milhar (ex: 160.000).
    const parts = value.split(".");
    if (parts.length > 2) {
      value = parts.join("");
    } else if (parts.length === 2 && parts[1].length === 3 && parts[0].length >= 1 && parts[0] !== "0") {
      // Ambíguo: "160.000" (milhar) vs "1.500" (decimal improvável em R$)
      // Preferimos milhar quando a parte fracionária tem 3 dígitos.
      value = parts.join("");
    }
  }

  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

/** Caracteres permitidos durante a digitação no campo de moeda. */
export function sanitizeMoneyInput(raw: string): string {
  return raw.replace(/[^\d.,]/g, "");
}
