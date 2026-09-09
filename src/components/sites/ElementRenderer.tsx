import * as Icons from "lucide-react";
import { SiteTheme } from "./siteTypes";
import { SiteElement, SOCIAL_ICONS, elementCss } from "./elementTypes";

interface Props {
  element: SiteElement;
  theme: SiteTheme;
  preview?: boolean;
}

function embedUrl(url: string): string {
  if (!url) return "";
  const yt = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{6,})/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  const vm = url.match(/vimeo\.com\/(\d+)/);
  if (vm) return `https://player.vimeo.com/video/${vm[1]}`;
  return url;
}

/** Renderiza um elemento solto (título, botão, imagem...) dentro de uma coluna. */
export function ElementRenderer({ element, theme, preview }: Props) {
  const p = element.props || {};
  const s = element.style || {};
  const css = elementCss(s);
  const align = s.align || "left";
  const flexAlign = align === "center" ? "center" : align === "right" ? "flex-end" : "flex-start";
  const stop = preview ? (e: React.MouseEvent) => e.preventDefault() : undefined;

  switch (element.type) {
    case "heading": {
      const Tag = (["h1", "h2", "h3", "h4"].includes(p.tag) ? p.tag : "h2") as "h2";
      return (
        <Tag style={{ color: theme.text, lineHeight: 1.15, ...css, margin: 0, ...(css.marginTop || css.marginBottom ? {} : {}) }}>
          {p.text}
        </Tag>
      );
    }

    case "text":
      return (
        <p style={{ color: theme.text, opacity: 0.85, whiteSpace: "pre-wrap", margin: 0, ...css }}>{p.text}</p>
      );

    case "button": {
      const variant = p.variant || "solid";
      const base: React.CSSProperties = {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: `${s.radius ?? theme.radius}px`,
        padding: `${s.paddingY ?? 14}px ${s.paddingX ?? 28}px`,
        fontSize: `${s.fontSize ?? 15}px`,
        fontWeight: s.fontWeight ?? 600,
        width: p.fullWidth ? "100%" : undefined,
        textDecoration: "none",
      };
      const look: React.CSSProperties =
        variant === "solid"
          ? { background: s.background || theme.primary, color: s.color || "#fff" }
          : variant === "outline"
          ? { border: `2px solid ${s.background || theme.primary}`, color: s.color || theme.primary }
          : { color: s.color || theme.primary };
      return (
        <div style={{ display: "flex", justifyContent: flexAlign, width: "100%" }}>
          <a
            href={preview ? undefined : p.href || "#"}
            target={p.target || "_self"}
            rel="noreferrer"
            onClick={stop}
            style={{ ...base, ...look, boxShadow: css.boxShadow }}
          >
            {p.label}
          </a>
        </div>
      );
    }

    case "image": {
      const img = p.src ? (
        <img
          src={p.src}
          alt={p.alt || ""}
          loading="lazy"
          style={{ width: "100%", height: "auto", display: "block", ...css }}
        />
      ) : (
        <div
          style={{ ...css, background: "rgba(0,0,0,0.06)", padding: 32, textAlign: "center", fontSize: 12, opacity: 0.6 }}
        >
          Selecione uma imagem
        </div>
      );
      return (
        <div style={{ display: "flex", justifyContent: flexAlign, width: "100%" }}>
          <div style={{ width: "100%", maxWidth: css.maxWidth }}>
            {p.href && !preview ? (
              <a href={p.href} target={p.target || "_self"} rel="noreferrer">{img}</a>
            ) : (
              img
            )}
          </div>
        </div>
      );
    }

    case "video": {
      const url = embedUrl(p.url || "");
      if (!url) {
        return (
          <div style={{ ...css, background: "rgba(0,0,0,0.06)", padding: 32, textAlign: "center", fontSize: 12, opacity: 0.6 }}>
            Informe a URL do vídeo
          </div>
        );
      }
      const isFile = /\.(mp4|webm|ogg)$/i.test(url);
      return (
        <div style={{ position: "relative", paddingTop: "56.25%", overflow: "hidden", ...css }}>
          {isFile ? (
            <video src={url} controls style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />
          ) : (
            <iframe
              src={url}
              title="Vídeo"
              allowFullScreen
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0 }}
            />
          )}
        </div>
      );
    }

    case "icon": {
      const Icon = ((Icons as any)[p.name] || Icons.Star) as React.ComponentType<{ size?: number; color?: string }>;
      return (
        <div style={{ display: "flex", justifyContent: flexAlign, width: "100%", ...css, padding: css.padding }}>
          <Icon size={s.fontSize ?? 40} color={s.color || theme.primary} />
        </div>
      );
    }

    case "list": {
      const items: any[] = Array.isArray(p.items) ? p.items : [];
      const marker = p.marker || "check";
      return (
        <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 10, ...css }}>
          {items.map((it, i) => (
            <li key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", color: s.color || theme.text }}>
              <span style={{ color: theme.primary, fontWeight: 700, lineHeight: 1.5 }}>
                {marker === "number" ? `${i + 1}.` : marker === "dot" ? "•" : "✓"}
              </span>
              <span style={{ opacity: 0.9 }}>{it?.text}</span>
            </li>
          ))}
        </ul>
      );
    }

    case "socials": {
      const items: any[] = Array.isArray(p.items) ? p.items : [];
      const shape = p.shape || "circle";
      const size = s.fontSize ?? 20;
      return (
        <div style={{ display: "flex", gap: 10, justifyContent: flexAlign, flexWrap: "wrap", width: "100%" }}>
          {items.map((it, i) => {
            const Icon = ((Icons as any)[SOCIAL_ICONS[it?.network] || "Globe"] ||
              Icons.Globe) as React.ComponentType<{ size?: number; color?: string }>;
            const box: React.CSSProperties =
              shape === "plain"
                ? {}
                : {
                    width: size * 2.1,
                    height: size * 2.1,
                    background: s.background || theme.primary,
                    borderRadius: shape === "circle" ? "999px" : `${s.radius ?? 10}px`,
                  };
            return (
              <a
                key={i}
                href={preview ? undefined : it?.href || "#"}
                target="_blank"
                rel="noreferrer"
                onClick={stop}
                aria-label={it?.network}
                style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", ...box }}
              >
                <Icon size={size} color={s.color || (shape === "plain" ? theme.primary : "#fff")} />
              </a>
            );
          })}
        </div>
      );
    }

    case "divider":
      return (
        <hr
          style={{
            border: 0,
            height: `${p.thickness || 1}px`,
            background: s.color || `${theme.text}26`,
            marginTop: s.marginTop ?? 8,
            marginBottom: s.marginBottom ?? 8,
            width: "100%",
          }}
        />
      );

    case "spacer":
      return <div style={{ height: `${p.height ?? 40}px`, width: "100%" }} />;

    case "card":
      return (
        <div
          style={{
            background: s.background || `${theme.text}08`,
            borderRadius: `${s.radius ?? theme.radius}px`,
            padding: `${s.paddingY ?? 24}px ${s.paddingX ?? 24}px`,
            border: `${s.borderWidth ?? 1}px solid ${s.borderColor || `${theme.text}14`}`,
            textAlign: align,
            boxShadow: css.boxShadow,
            width: "100%",
          }}
        >
          {p.image && (
            <img
              src={p.image}
              alt={p.title || ""}
              loading="lazy"
              style={{ width: "100%", borderRadius: `${(s.radius ?? theme.radius) / 1.5}px`, marginBottom: 14 }}
            />
          )}
          {p.title && (
            <h3 style={{ margin: 0, fontSize: s.fontSize ?? 20, fontWeight: 700, color: s.color || theme.text }}>
              {p.title}
            </h3>
          )}
          {p.text && (
            <p style={{ marginTop: 8, marginBottom: 0, opacity: 0.8, color: s.color || theme.text }}>{p.text}</p>
          )}
        </div>
      );

    case "html":
      return <div style={css} dangerouslySetInnerHTML={{ __html: String(p.code || "") }} />;

    case "embed":
      return p.url ? (
        <iframe
          src={p.url}
          title="Conteúdo incorporado"
          style={{ width: "100%", height: `${p.height || 420}px`, border: 0, ...css }}
        />
      ) : (
        <div style={{ ...css, background: "rgba(0,0,0,0.06)", padding: 24, fontSize: 12, opacity: 0.6 }}>
          Informe a URL para incorporar
        </div>
      );

    default:
      return null;
  }
}
