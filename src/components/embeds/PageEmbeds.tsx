import { useEffect, useMemo, useState } from "react";
import { PageEmbedSettings, PopupSnapshot } from "./pageEmbedTypes";

/** Injeta HTML (incluindo <script>) num alvo, executando os scripts. */
const injectHtml = (html: string, target: HTMLElement) => {
  if (!html || !html.trim()) return () => {};
  const container = document.createElement("div");
  container.setAttribute("data-outapp-embed", "1");
  container.innerHTML = html;

  const nodes: Node[] = [];
  Array.from(container.childNodes).forEach((node) => {
    if (node.nodeName === "SCRIPT") {
      const original = node as HTMLScriptElement;
      const script = document.createElement("script");
      Array.from(original.attributes).forEach((a) => script.setAttribute(a.name, a.value));
      script.text = original.text;
      nodes.push(script);
    } else {
      nodes.push(node.cloneNode(true));
    }
  });

  nodes.forEach((n) => target.appendChild(n));
  return () => nodes.forEach((n) => n.parentNode?.removeChild(n));
};

const positionStyle = (position?: string | null): React.CSSProperties => {
  switch (position) {
    case "bottom_right":
      return { bottom: 20, right: 20 };
    case "bottom_left":
      return { bottom: 20, left: 20 };
    case "top_right":
      return { top: 20, right: 20 };
    case "top_left":
      return { top: 20, left: 20 };
    default:
      return { top: "50%", left: "50%", transform: "translate(-50%, -50%)" };
  }
};

const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);

const Countdown = ({ endsAt, label, bg, color }: { endsAt: string; label?: string | null; bg?: string | null; color?: string | null }) => {
  const [left, setLeft] = useState(() => Math.max(0, new Date(endsAt).getTime() - Date.now()));
  useEffect(() => {
    const t = setInterval(() => setLeft(Math.max(0, new Date(endsAt).getTime() - Date.now())), 1000);
    return () => clearInterval(t);
  }, [endsAt]);
  const d = Math.floor(left / 86400000);
  const h = Math.floor((left % 86400000) / 3600000);
  const m = Math.floor((left % 3600000) / 60000);
  const s = Math.floor((left % 60000) / 1000);
  return (
    <div style={{ background: bg || "#111827", color: color || "#fff", borderRadius: 8, padding: 12, marginBottom: 12, textAlign: "center" }}>
      {label ? <div style={{ fontSize: 12, marginBottom: 6, fontWeight: 600 }}>{label}</div> : null}
      <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
        {[
          [pad(d), "dias"],
          [pad(h), "hs"],
          [pad(m), "min"],
          [pad(s), "seg"],
        ].map(([v, l]) => (
          <div key={l} style={{ background: "rgba(255,255,255,0.15)", padding: "6px 10px", borderRadius: 6, minWidth: 44 }}>
            <div style={{ fontSize: 18, fontWeight: 700, lineHeight: 1 }}>{v}</div>
            <div style={{ fontSize: 10, opacity: 0.8, textTransform: "uppercase" }}>{l}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

const EmbeddedPopup = ({ popup }: { popup: PopupSnapshot }) => {
  const [open, setOpen] = useState(false);
  const [closed, setClosed] = useState(false);

  useEffect(() => {
    if (closed) return;
    const trigger = popup.trigger_type || "time_delay";
    if (trigger === "time_delay" || trigger === "immediate") {
      const delay = trigger === "immediate" ? 0 : (popup.delay_seconds || 5) * 1000;
      const t = setTimeout(() => setOpen(true), delay);
      return () => clearTimeout(t);
    }
    if (trigger === "scroll") {
      const target = popup.scroll_percentage || 50;
      const onScroll = () => {
        const total = document.documentElement.scrollHeight - window.innerHeight;
        const pct = total > 0 ? (window.scrollY / total) * 100 : 100;
        if (pct >= target) setOpen(true);
      };
      window.addEventListener("scroll", onScroll, { passive: true });
      return () => window.removeEventListener("scroll", onScroll);
    }
    if (trigger === "exit_intent") {
      const onOut = (e: MouseEvent) => {
        if (!e.relatedTarget && e.clientY < 10) setOpen(true);
      };
      document.addEventListener("mouseout", onOut);
      return () => document.removeEventListener("mouseout", onOut);
    }
    return;
  }, [popup, closed]);

  if (!open || closed) return null;

  const bg = popup.background_image
    ? { backgroundImage: `url(${popup.background_image})`, backgroundSize: "cover", backgroundPosition: "center" }
    : { background: popup.background_color || "#ffffff" };

  const close = () => {
    setOpen(false);
    setClosed(true);
  };

  return (
    <>
      <div onClick={close} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 99998 }} />
      <div
        style={{
          position: "fixed",
          ...positionStyle(popup.position),
          maxWidth: 400,
          width: "90%",
          padding: 24,
          borderRadius: 12,
          boxShadow: "0 20px 50px rgba(0,0,0,0.3)",
          zIndex: 99999,
          textAlign: (popup.text_align as any) || "left",
          color: popup.text_color || "#000",
          ...bg,
        }}
      >
        <button
          onClick={close}
          aria-label="Fechar"
          style={{ position: "absolute", top: 8, right: 10, background: "none", border: "none", fontSize: 24, cursor: "pointer", color: popup.text_color || "#000", lineHeight: 1 }}
        >
          ×
        </button>
        {popup.image_url ? (
          <img src={popup.image_url} alt={popup.title || "Pop-up"} style={{ display: "block", width: "100%", borderRadius: 8, marginBottom: 16, maxHeight: 240, objectFit: (popup.image_fit as any) || "cover" }} />
        ) : null}
        {popup.video_url ? <video src={popup.video_url} controls style={{ width: "100%", borderRadius: 8, marginBottom: 16, maxHeight: 200 }} /> : null}
        {popup.countdown_enabled && popup.countdown_ends_at ? (
          <Countdown endsAt={popup.countdown_ends_at} label={popup.countdown_label} bg={popup.countdown_bg_color} color={popup.countdown_text_color} />
        ) : null}
        {popup.title ? <h3 style={{ margin: "0 0 12px", fontSize: 20, fontWeight: 700 }}>{popup.title}</h3> : null}
        {popup.content ? <p style={{ margin: "0 0 16px", opacity: 0.9 }}>{popup.content}</p> : null}
        {popup.button_text ? (
          <a
            href={popup.button_link || "#"}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "block",
              width: "100%",
              padding: "12px 24px",
              background: popup.button_color || "#000",
              color: popup.button_text_color || "#fff",
              textAlign: "center",
              textDecoration: "none",
              borderRadius: 8,
              fontWeight: 600,
              boxSizing: "border-box",
            }}
          >
            {popup.button_text}
          </a>
        ) : null}
      </div>
    </>
  );
};

interface PageEmbedsProps {
  settings?: PageEmbedSettings | null;
  /** Em modo prévia, scripts não são executados */
  enabled?: boolean;
}

export const PageEmbeds = ({ settings, enabled = true }: PageEmbedsProps) => {
  const cfg = settings || {};

  useEffect(() => {
    if (!enabled) return;
    const cleanHead = injectHtml(cfg.headScripts || "", document.head);
    const cleanBody = injectHtml(cfg.bodyScripts || "", document.body);
    const cleanButton = injectHtml(cfg.floatingButtonCode || "", document.body);
    return () => {
      cleanHead();
      cleanBody();
      cleanButton();
    };
  }, [enabled, cfg.headScripts, cfg.bodyScripts, cfg.floatingButtonCode]);

  const popup = useMemo(() => (cfg.popupConfig && cfg.popupConfig.id ? cfg.popupConfig : null), [cfg.popupConfig]);

  if (!enabled || !popup) return null;
  return <EmbeddedPopup popup={popup} />;
};
