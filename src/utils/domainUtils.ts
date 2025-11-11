/**
 * Normaliza um domínio removendo o prefixo www.
 * Exemplo: www.klicsmart.com -> klicsmart.com
 */
export function normalizeDomain(hostname: string): string {
  return hostname.replace(/^www\./, '');
}

/**
 * Verifica se o hostname atual corresponde a um domínio (com ou sem www.)
 */
export function matchesDomain(hostname: string, domain: string): boolean {
  const normalizedHostname = normalizeDomain(hostname);
  const normalizedDomain = normalizeDomain(domain);
  return normalizedHostname === normalizedDomain;
}
