import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  CaptureBlock,
  CaptureField,
  CapturePageRecord,
  CaptureTheme,
  DEFAULT_SETTINGS,
  DEFAULT_THEME,
  embedUrl,
} from "./captureTypes";
import { Loader2, Check, Instagram, Facebook, Youtube, Linkedin, MessageCircle, ChevronDown } from "lucide-react";

interface Props {
  page: Pick<CapturePageRecord, "id" | "user_id" | "blocks" | "theme" | "form_fields" | "settings" | "title">;
  mode: "preview" | "live";
}

const animClass = (anim: CaptureTheme["animation"]) => {
  switch (anim) {
    case "fade":
      return "animate-fade-in";
    case "slide-up":
      return "animate-slide-up";
    case "zoom":
      return "animate-zoom-in";
    default:
      return "";
  }
};

export const CapturePageRenderer = ({ page, mode }: Props) => {
  const theme: CaptureTheme = { ...DEFAULT_THEME, ...(page.theme || {}) };
  const settings = { ...DEFAULT_SETTINGS, ...(page.settings || {}) };
  const blocks: CaptureBlock[] = Array.isArray(page.blocks) ? page.blocks : [];
  const fields: CaptureField[] = Array.isArray(page.form_fields) ? page.form_fields : [];

  const [values, setValues] = useState<Record<string, any>>({});
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [openFaq, setOpenFaq] = useState<string | null>(null);

  const cssVars = useMemo(
    () =>
      ({
        "--cp-primary": theme.primary,
        "--cp-primary-text": theme.primaryText,
        "--cp-surface": theme.surface,
        "--cp-text": theme.textColor,
        "--cp-muted": theme.mutedTextColor,
        "--cp-border": theme.borderColor,
        "--cp-radius": `${theme.radius}px`,
      }) as React.CSSProperties,
    [theme],
  );

  const buttonStyle: React.CSSProperties =
    theme.buttonStyle === "outline"
      ? { background: "transparent", color: theme.primary, border: `2px solid ${theme.primary}`, borderRadius: theme.buttonRadius }
      : theme.buttonStyle === "soft"
        ? { background: `${theme.primary}22`, color: theme.primary, border: `1px solid ${theme.primary}55`, borderRadius: theme.buttonRadius }
        : { background: theme.primary, color: theme.primaryText, border: "none", borderRadius: theme.buttonRadius };

  const setValue = (id: string, v: any) => setValues((p) => ({ ...p, [id]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (mode === "preview") return;

    for (const f of fields) {
      const v = values[f.id];
      if (f.required && (v === undefined || v === null || v === "" || v === false)) {
        setError(`Preencha o campo "${f.label}".`);
        return;
      }
      if (f.type === "email" && v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v))) {
        setError("Informe um e-mail válido.");
        return;
      }
    }

    setSending(true);
    try {
      const data: Record<string, any> = {};
      for (const f of fields) {
        let v = values[f.id];
        if (f.type === "file" && v instanceof File) {
          try {
            const ext = v.name.split(".").pop();
            const path = `capture/${page.user_id}/${page.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
            const { error: upErr } = await supabase.storage.from("blog-images").upload(path, v);
            if (upErr) throw upErr;
            const { data: pub } = supabase.storage.from("blog-images").getPublicUrl(path);
            v = pub.publicUrl;
          } catch {
            v = v.name;
          }
        }
        data[f.label] = v ?? "";
      }

      const params = new URLSearchParams(window.location.search);
      const find = (t: CaptureField["type"]) => {
        const f = fields.find((x) => x.type === t);
        return f ? String(values[f.id] ?? "") : "";
      };

      const { error: insErr } = await supabase.from("capture_leads").insert({
        page_id: page.id,
        user_id: page.user_id,
        data,
        name: find("name") || null,
        email: find("email") || null,
        phone: find("whatsapp") || find("phone") || null,
        source: page.title,
        utm: {
          utm_source: params.get("utm_source") || "",
          utm_medium: params.get("utm_medium") || "",
          utm_campaign: params.get("utm_campaign") || "",
        },
        referrer: document.referrer || null,
        user_agent: navigator.userAgent,
      });
      if (insErr) throw insErr;

      setSent(true);
      setValues({});
      if (settings.redirectUrl) {
        setTimeout(() => {
          window.location.href = settings.redirectUrl;
        }, 1200);
      }
    } catch (err: any) {
      setError(err?.message || "Não foi possível enviar. Tente novamente.");
    } finally {
      setSending(false);
    }
  };

  const renderField = (f: CaptureField) => {
    const inputStyle: React.CSSProperties = {
      background: "rgba(255,255,255,0.06)",
      color: theme.textColor,
      border: `1px solid ${theme.borderColor}`,
      borderRadius: theme.radius / 1.6,
      width: "100%",
      padding: "12px 14px",
      fontSize: theme.baseFontSize,
      outline: "none",
    };

    const common = {
      id: f.id,
      required: f.required,
      placeholder: f.placeholder || "",
      style: inputStyle,
    };

    return (
      <div key={f.id} className={f.width === "half" ? "sm:col-span-1 col-span-2" : "col-span-2"}>
        {f.type !== "checkbox" && (
          <label htmlFor={f.id} className="block mb-1.5 text-sm" style={{ color: theme.mutedTextColor }}>
            {f.label} {f.required && <span style={{ color: theme.primary }}>*</span>}
          </label>
        )}
        {f.type === "textarea" ? (
          <textarea {...common} rows={4} value={values[f.id] || ""} onChange={(e) => setValue(f.id, e.target.value)} />
        ) : f.type === "select" ? (
          <select {...common} value={values[f.id] || ""} onChange={(e) => setValue(f.id, e.target.value)}>
            <option value="">Selecione...</option>
            {(f.options || []).map((o) => (
              <option key={o} value={o} style={{ color: "#111" }}>
                {o}
              </option>
            ))}
          </select>
        ) : f.type === "checkbox" ? (
          <label className="flex items-start gap-2 text-sm cursor-pointer" style={{ color: theme.mutedTextColor }}>
            <input
              type="checkbox"
              checked={!!values[f.id]}
              required={f.required}
              onChange={(e) => setValue(f.id, e.target.checked)}
              style={{ accentColor: theme.primary, marginTop: 3 }}
            />
            <span>
              {f.label} {f.required && <span style={{ color: theme.primary }}>*</span>}
            </span>
          </label>
        ) : f.type === "file" ? (
          <input {...common} type="file" onChange={(e) => setValue(f.id, e.target.files?.[0] || null)} />
        ) : (
          <input
            {...common}
            type={f.type === "email" ? "email" : f.type === "birthdate" ? "date" : f.type === "number" ? "number" : f.type === "phone" || f.type === "whatsapp" ? "tel" : "text"}
            value={values[f.id] || ""}
            onChange={(e) => setValue(f.id, e.target.value)}
          />
        )}
        {f.helpText && (
          <p className="mt-1 text-xs" style={{ color: theme.mutedTextColor }}>
            {f.helpText}
          </p>
        )}
      </div>
    );
  };

  const heading = (text: string, size: number) => (
    <h2 style={{ fontSize: size * theme.headingScale, lineHeight: 1.15, fontWeight: 800, color: theme.textColor }}>{text}</h2>
  );

  const renderBlock = (b: CaptureBlock) => {
    if (b.visible === false) return null;
    const p = b.props || {};
    const card: React.CSSProperties = {
      background: theme.surface,
      border: `1px solid ${theme.borderColor}`,
      borderRadius: theme.radius,
    };

    switch (b.type) {
      case "hero":
        return (
          <div style={{ textAlign: p.align || "center" }} className="space-y-4">
            {p.eyebrow && (
              <span
                className="inline-block px-3 py-1 text-xs font-semibold uppercase tracking-wide"
                style={{ background: `${theme.primary}22`, color: theme.primary, borderRadius: 999 }}
              >
                {p.eyebrow}
              </span>
            )}
            {heading(p.title || "", 44)}
            {p.subtitle && (
              <p style={{ color: theme.mutedTextColor, fontSize: theme.baseFontSize * 1.15, maxWidth: 720, margin: p.align === "center" ? "0 auto" : undefined }}>
                {p.subtitle}
              </p>
            )}
            {p.imageUrl && <img src={p.imageUrl} alt={p.title || "Destaque"} loading="lazy" style={{ borderRadius: theme.radius, margin: "0 auto", maxWidth: "100%" }} />}
          </div>
        );

      case "text":
        return (
          <div style={{ textAlign: p.align || "left" }} className="space-y-3">
            {p.title && heading(p.title, 28)}
            <p style={{ color: theme.mutedTextColor, whiteSpace: "pre-wrap", fontSize: theme.baseFontSize }}>{p.text}</p>
          </div>
        );

      case "image":
        return p.imageUrl ? (
          <img src={p.imageUrl} alt={p.alt || "Imagem"} loading="lazy" style={{ width: "100%", borderRadius: p.rounded ? theme.radius : 0 }} />
        ) : null;

      case "video": {
        const src = embedUrl(p.url || "");
        if (!src) return null;
        return (
          <div className="space-y-3">
            {p.title && heading(p.title, 26)}
            <div style={{ position: "relative", paddingTop: "56.25%", borderRadius: theme.radius, overflow: "hidden" }}>
              <iframe
                src={src}
                title={p.title || "Vídeo"}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture"
                allowFullScreen
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0 }}
              />
            </div>
          </div>
        );
      }

      case "button":
        return (
          <div style={{ textAlign: p.align || "center" }}>
            <a href={p.url || "#formulario"} style={{ ...buttonStyle, display: "inline-block", padding: "14px 28px", fontWeight: 700, textDecoration: "none" }}>
              {p.text}
            </a>
          </div>
        );

      case "benefits":
        return (
          <div className="space-y-5">
            {p.title && heading(p.title, 30)}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {(p.items || []).map((it: any, i: number) => (
                <div key={i} style={{ ...card, padding: 20 }}>
                  <div className="mb-2 flex h-9 w-9 items-center justify-center" style={{ background: `${theme.primary}22`, color: theme.primary, borderRadius: 10 }}>
                    <Check className="h-5 w-5" />
                  </div>
                  <h3 style={{ color: theme.textColor, fontWeight: 700, marginBottom: 4 }}>{it.title}</h3>
                  <p style={{ color: theme.mutedTextColor, fontSize: 14 }}>{it.text}</p>
                </div>
              ))}
            </div>
          </div>
        );

      case "testimonials":
        return (
          <div className="space-y-5">
            {p.title && heading(p.title, 30)}
            <div className="grid gap-4 sm:grid-cols-2">
              {(p.items || []).map((it: any, i: number) => (
                <div key={i} style={{ ...card, padding: 20 }}>
                  <p style={{ color: theme.textColor, fontStyle: "italic" }}>&ldquo;{it.text}&rdquo;</p>
                  <div className="mt-4 flex items-center gap-3">
                    {it.avatarUrl ? (
                      <img src={it.avatarUrl} alt={it.name} loading="lazy" style={{ width: 40, height: 40, borderRadius: 999, objectFit: "cover" }} />
                    ) : (
                      <div style={{ width: 40, height: 40, borderRadius: 999, background: `${theme.primary}33`, color: theme.primary }} className="flex items-center justify-center font-bold">
                        {(it.name || "?").charAt(0)}
                      </div>
                    )}
                    <div>
                      <div style={{ color: theme.textColor, fontWeight: 600, fontSize: 14 }}>{it.name}</div>
                      <div style={{ color: theme.mutedTextColor, fontSize: 12 }}>{it.role}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case "faq":
        return (
          <div className="space-y-4">
            {p.title && heading(p.title, 30)}
            <div className="space-y-2">
              {(p.items || []).map((it: any, i: number) => {
                const key = `${b.id}-${i}`;
                const open = openFaq === key;
                return (
                  <div key={i} style={{ ...card, overflow: "hidden" }}>
                    <button
                      type="button"
                      onClick={() => setOpenFaq(open ? null : key)}
                      className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
                      style={{ color: theme.textColor, fontWeight: 600 }}
                    >
                      {it.question}
                      <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
                    </button>
                    {open && (
                      <p className="px-5 pb-4" style={{ color: theme.mutedTextColor, fontSize: 14 }}>
                        {it.answer}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );

      case "counter":
        return (
          <div className="space-y-5">
            {p.title && heading(p.title, 28)}
            <div className="grid gap-4 sm:grid-cols-3">
              {(p.items || []).map((it: any, i: number) => (
                <div key={i} style={{ ...card, padding: 20, textAlign: "center" }}>
                  <div style={{ color: theme.primary, fontSize: 32, fontWeight: 800 }}>{it.value}</div>
                  <div style={{ color: theme.mutedTextColor, fontSize: 14 }}>{it.label}</div>
                </div>
              ))}
            </div>
          </div>
        );

      case "cards":
        return (
          <div className="space-y-5">
            {p.title && heading(p.title, 30)}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {(p.items || []).map((it: any, i: number) => (
                <div key={i} style={{ ...card, overflow: "hidden" }}>
                  {it.imageUrl && <img src={it.imageUrl} alt={it.title} loading="lazy" style={{ width: "100%", height: 150, objectFit: "cover" }} />}
                  <div style={{ padding: 18 }}>
                    <h3 style={{ color: theme.textColor, fontWeight: 700, marginBottom: 4 }}>{it.title}</h3>
                    <p style={{ color: theme.mutedTextColor, fontSize: 14 }}>{it.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case "gallery":
        return (
          <div className="space-y-5">
            {p.title && heading(p.title, 30)}
            <div className="grid gap-3 grid-cols-2 sm:grid-cols-3">
              {(p.images || []).map((src: string, i: number) => (
                <img key={i} src={src} alt={`Galeria ${i + 1}`} loading="lazy" style={{ width: "100%", height: 160, objectFit: "cover", borderRadius: theme.radius }} />
              ))}
            </div>
          </div>
        );

      case "social": {
        const links = [
          { url: p.instagram, Icon: Instagram, label: "Instagram" },
          { url: p.facebook, Icon: Facebook, label: "Facebook" },
          { url: p.youtube, Icon: Youtube, label: "YouTube" },
          { url: p.linkedin, Icon: Linkedin, label: "LinkedIn" },
          { url: p.whatsapp, Icon: MessageCircle, label: "WhatsApp" },
        ].filter((l) => l.url);
        if (!links.length) return null;
        return (
          <div className="space-y-4 text-center">
            {p.title && heading(p.title, 24)}
            <div className="flex flex-wrap items-center justify-center gap-3">
              {links.map(({ url, Icon, label }) => (
                <a
                  key={label}
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={label}
                  className="flex h-11 w-11 items-center justify-center"
                  style={{ background: `${theme.primary}22`, color: theme.primary, borderRadius: 999 }}
                >
                  <Icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>
        );
      }

      case "divider":
        return p.line ? <hr style={{ border: 0, borderTop: `1px solid ${theme.borderColor}` }} /> : <div style={{ height: 24 }} />;

      case "footer":
        return (
          <footer className="space-y-3 text-center" style={{ color: theme.mutedTextColor, fontSize: 14 }}>
            {!!(p.links || []).length && (
              <div className="flex flex-wrap justify-center gap-4">
                {(p.links || []).map((l: any, i: number) => (
                  <a key={i} href={l.url} style={{ color: theme.primary }}>
                    {l.label}
                  </a>
                ))}
              </div>
            )}
            <p>{p.text}</p>
          </footer>
        );

      case "form":
        return (
          <div id="formulario" style={{ background: theme.surface, border: `1px solid ${theme.borderColor}`, borderRadius: theme.radius, padding: 24 }}>
            {sent ? (
              <div className="py-8 text-center space-y-3">
                <div className="mx-auto flex h-14 w-14 items-center justify-center" style={{ background: `${theme.primary}22`, color: theme.primary, borderRadius: 999 }}>
                  <Check className="h-7 w-7" />
                </div>
                <p style={{ color: theme.textColor, fontWeight: 700, fontSize: 18 }}>{settings.successMessage}</p>
                {settings.whatsappRedirect && (
                  <a href={settings.whatsappRedirect} target="_blank" rel="noreferrer" style={{ ...buttonStyle, display: "inline-block", padding: "12px 22px", fontWeight: 700, textDecoration: "none" }}>
                    Falar no WhatsApp
                  </a>
                )}
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {p.title && <h3 style={{ color: theme.textColor, fontSize: 22, fontWeight: 800 }}>{p.title}</h3>}
                {p.subtitle && <p style={{ color: theme.mutedTextColor, fontSize: 14 }}>{p.subtitle}</p>}
                <div className="grid grid-cols-2 gap-3">{fields.map(renderField)}</div>
                {error && <p style={{ color: "#f87171", fontSize: 14 }}>{error}</p>}
                <button type="submit" disabled={sending} style={{ ...buttonStyle, width: "100%", padding: "14px 20px", fontWeight: 800, cursor: "pointer" }}>
                  {sending ? <Loader2 className="mx-auto h-5 w-5 animate-spin" /> : p.buttonText || settings.buttonText}
                </button>
              </form>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div
      style={{
        ...cssVars,
        background: theme.background,
        fontFamily: theme.fontFamily,
        fontSize: theme.baseFontSize,
        minHeight: mode === "live" ? "100vh" : undefined,
        position: "relative",
      }}
    >
      {theme.backgroundImage && (
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `url(${theme.backgroundImage})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundAttachment: "fixed",
            opacity: 1 - theme.backgroundOverlay / 100,
          }}
        />
      )}
      <div style={{ position: "relative", maxWidth: theme.contentWidth, margin: "0 auto", padding: "48px 20px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: theme.sectionSpacing }}>
          {blocks.map((b) => (
            <section key={b.id} className={animClass(theme.animation)}>
              {renderBlock(b)}
            </section>
          ))}
          {!blocks.length && <p style={{ color: theme.mutedTextColor, textAlign: "center" }}>Adicione blocos para montar sua página.</p>}
        </div>
      </div>
    </div>
  );
};

export default CapturePageRenderer;
