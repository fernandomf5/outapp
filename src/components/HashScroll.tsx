import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Rola suavemente até a seção indicada no hash da URL (ex.: /#planos).
 * Faz novas tentativas porque o conteúdo da página pode carregar de forma assíncrona.
 */
export const HashScroll = (): null => {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (!hash) {
      return;
    }

    let rawId = hash.slice(1);
    try {
      rawId = decodeURIComponent(rawId);
    } catch {
      // hash inválido: mantém o valor original
    }

    if (!rawId) {
      return;
    }

    let attempts = 0;
    let timer: number | undefined;

    const tryScroll = (): void => {
      const target =
        document.getElementById(rawId) ??
        document.querySelector<HTMLElement>(`[name="${CSS.escape(rawId)}"]`);

      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }

      attempts += 1;
      if (attempts < 25) {
        timer = window.setTimeout(tryScroll, 200);
      }
    };

    timer = window.setTimeout(tryScroll, 60);

    return () => {
      if (timer !== undefined) {
        window.clearTimeout(timer);
      }
    };
  }, [pathname, hash]);

  return null;
};

export default HashScroll;
