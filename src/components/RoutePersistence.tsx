import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";

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
  "/agent-auth",
  "/agent-chat",
  "/chatbot-auth",
  "/chatbot-chat",
  "/chatbot-reset-password",
  "/agent-reset-password",
  "/blog",
];

// Entry paths where we should try to restore the previous route.
const ENTRY_PATHS = new Set<string>(["/", "/sidepanel.html", "/index.html"]);

function isExcluded(pathname: string) {
  return EXCLUDED_PREFIXES.some((p) => pathname === p || pathname.startsWith(p));
}

export function RoutePersistence() {
  const location = useLocation();
  const navigate = useNavigate();
  const restored = useRef(false);

  // Restore once on first mount
  useEffect(() => {
    if (restored.current) return;
    restored.current = true;
    try {
      const current = location.pathname + location.search + location.hash;
      if (!ENTRY_PATHS.has(location.pathname)) return;
      // Explicit opt-out: user clicked "Ver site" from panel
      const params = new URLSearchParams(location.search);
      if (params.has("site")) return;
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && saved !== current && !isExcluded(saved.split("?")[0])) {
        navigate(saved, { replace: true });
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
