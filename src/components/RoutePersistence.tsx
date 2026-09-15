import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const STORAGE_KEY = "app:last-route";

// Paths that should NEVER be restored (public/auth flows, one-off pages, etc.)
const EXCLUDED_PREFIXES = [
  "/auth",
  "/team-login",
  "/forgot-password",
  "/reset-password",
  "/email-confirmed",
  "/accept-invitation",
  "/s/",
  "/page/",
  "/page1/",
  "/page2/",
  "/page3/",
  "/page4/",
  "/page5/",
  "/bio/",
  "/l/",
  "/chat/",
  "/chat-online/",
  "/chatbot-auth",
  "/chatbot-chat",
  "/chatbot-reset-password",
  "/agent-reset-password",
  
  "/briefing/",
  "/q/",
  "/members/",
  "/checkout/",
  "/contrato/",
  "/proposta/",
  "/fatura/",
  "/site/",
  "/anotacoes",
  "/calculadora",
];

// Entry paths where we should try to restore the previous route.
const ENTRY_PATHS = new Set<string>(["/", "/sidepanel.html", "/index.html"]);

function isExcluded(pathname: string) {
  return EXCLUDED_PREFIXES.some((p) => pathname === p || pathname.startsWith(p));
}

export function RoutePersistence() {
  const location = useLocation();

  // A URL digitada pelo usuário é sempre respeitada: nenhuma rota é restaurada
  // automaticamente. Mantemos apenas o registro da última rota visitada.

  // Persist every route change
  useEffect(() => {
    try {
      const full = location.pathname + location.search + location.hash;
      if (!isExcluded(location.pathname)) {
        localStorage.setItem(STORAGE_KEY, full);
      }
    } catch {}
  }, [location]);

  return null;
}
