import { useState } from "react";
import { SiteBlock, SiteTheme, DEFAULT_THEME } from "./siteTypes";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ChevronDown } from "lucide-react";

interface Props {
  block: SiteBlock;
  theme: SiteTheme;
  siteId?: string;
  preview?: boolean;
}

function embedUrl(url: string) {
  if (!url) return "";
  const yt = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{6,})/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  const vm = url.match(/vimeo\.com\/(\d+)/);
  if (vm) return `https://player.vimeo.com/video/${vm[1]}`;
  return url;
}

export function BlockRenderer({ block, theme: t, siteId, preview }: Props) {
  const theme = { ...DEFAULT_THEME, ...t };
  const p = block.props || {};
  const radius = `${theme.radius}px`;
  const section = "px-5 py-14 sm:px-8 sm:py-20";
  const container = "mx-auto w-full max-w-6xl";

  const Btn = ({ label, href, variant = "primary" }: { label?: string; href?: string; variant?: "primary" | "ghost" }) =>
    label ? (
      <a
        href={preview ? undefined : href || "#"}
        onClick={preview ? (e) => e.preventDefault() : undefined}
        className="inline-flex items-center justify-center px-6 py-3 text-sm font-semibold transition-transform hover:scale-[1.03]"
        style={
          variant === "primary"
            ? { background: theme.primary, color: "#fff", borderRadius: radius }
            : { border: `1px solid ${theme.primary}`, color: theme.primary, borderRadius: radius }
        }
      >
        {label}
      </a>
    ) : null;

  const Title = ({ children, center = true }: any) =>
    children ? (
      <h2
        className={`text-2xl sm:text-4xl font-bold tracking-tight ${center ? "text-center" : ""}`}
        style={{ color: theme.text }}
      >
        {children}
      </h2>
    ) : null;

  switch (block.type) {
    case "header":
      return (
        <header
          className="w-full border-b backdrop-blur"
          style={{ borderColor: `${theme.text}14`, background: `${theme.background}E6` }}
        >
          <div className={`${container} flex items-center justify-between gap-4 px-5 py-4 sm:px-8`}>
            <div className="flex items-center gap-2 min-w-0">
              {p.logo && <img src={p.logo} alt={p.brand || "Logo"} className="h-9 w-auto object-contain" />}
              <span className="font-bold truncate" style={{ color: theme.text }}>{p.brand}</span>
            </div>
            <nav className="hidden md:flex items-center gap-6">
              {(p.links || []).map((l: any, i: number) => (
                <a key={i} href={preview ? undefined : l.href} className="text-sm opacity-80 hover:opacity-100" style={{ color: theme.text }}>
                  {l.label}
                </a>
              ))}
            </nav>
            <Btn label={p.ctaLabel} href={p.ctaHref} />
          </div>
        </header>
      );

    case "hero": {
      const align = p.align === "left" ? "items-start text-left" : "items-center text-center";
      return (
        <section
          id="inicio"
          className="relative overflow-hidden px-5 py-20 sm:px-8 sm:py-28"
          style={{
            background: p.image ? `url(${p.image}) center/cover no-repeat` : `linear-gradient(140deg, ${theme.primary}22, ${theme.secondary}18)`,
          }}
        >
          {p.image && <div className="absolute inset-0" style={{ background: `rgba(0,0,0,${(p.overlay ?? 50) / 100})` }} />}
          <div className={`${container} relative flex flex-col gap-5 ${align}`}>
            {p.badge && (
              <span className="px-3 py-1 text-xs font-semibold rounded-full" style={{ background: theme.primary, color: "#fff" }}>
                {p.badge}
              </span>
            )}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold leading-tight max-w-3xl" style={{ color: p.image ? "#fff" : theme.text }}>
              {p.title}
            </h1>
            {p.subtitle && (
              <p className="text-base sm:text-lg max-w-2xl opacity-85" style={{ color: p.image ? "#fff" : theme.text }}>
                {p.subtitle}
              </p>
            )}
            <div className="flex flex-wrap gap-3 pt-2">
              <Btn label={p.ctaLabel} href={p.ctaHref} />
              <Btn label={p.secondaryLabel} href={p.secondaryHref} variant="ghost" />
            </div>
          </div>
        </section>
      );
    }

    case "about":
      return (
        <section className={section} style={{ background: theme.background }}>
          <div className={`${container} grid gap-8 md:grid-cols-2 items-center`}>
            <div className={p.reverse ? "md:order-2" : ""}>
              <Title center={false}>{p.title}</Title>
              <p className="mt-4 whitespace-pre-wrap opacity-80 leading-relaxed" style={{ color: theme.text }}>{p.text}</p>
            </div>
            {p.image ? (
              <img src={p.image} alt={p.title || "Sobre"} className="w-full object-cover aspect-[4/3]" style={{ borderRadius: radius }} loading="lazy" />
            ) : (
              <div className="w-full aspect-[4/3]" style={{ borderRadius: radius, background: `${theme.primary}1A` }} />
            )}
          </div>
        </section>
      );

    case "services":
    case "benefits": {
      const items = p.items || [];
      return (
        <section id="servicos" className={section} style={{ background: block.type === "benefits" ? `${theme.primary}0D` : theme.background }}>
          <div className={container}>
            <Title>{p.title}</Title>
            {p.subtitle && <p className="mt-3 text-center opacity-70" style={{ color: theme.text }}>{p.subtitle}</p>}
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((it: any, i: number) => (
                <div key={i} className="p-6 border transition-shadow hover:shadow-lg" style={{ borderRadius: radius, borderColor: `${theme.text}14`, background: theme.background }}>
                  {it.image && <img src={it.image} alt={it.title} className="mb-4 h-14 w-14 object-cover" style={{ borderRadius: radius }} loading="lazy" />}
                  <h3 className="font-bold text-lg" style={{ color: theme.text }}>{it.title}</h3>
                  <p className="mt-2 text-sm opacity-75 whitespace-pre-wrap" style={{ color: theme.text }}>{it.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      );
    }

    case "numbers":
      return (
        <section className="px-5 py-12 sm:px-8" style={{ background: theme.secondary }}>
          <div className={`${container} grid gap-6 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 text-center`}>
            {(p.items || []).map((it: any, i: number) => (
              <div key={i}>
                <div className="text-3xl sm:text-4xl font-extrabold" style={{ color: theme.primary }}>{it.value}</div>
                <div className="text-sm opacity-70 text-white">{it.label}</div>
              </div>
            ))}
          </div>
        </section>
      );

    case "gallery": {
      const cols = Math.min(Math.max(Number(p.columns) || 3, 1), 4);
      return (
        <section className={section} style={{ background: theme.background }}>
          <div className={container}>
            <Title>{p.title}</Title>
            <div className="mt-10 grid gap-5" style={{ gridTemplateColumns: `repeat(auto-fit, minmax(${100 / cols > 33 ? 260 : 220}px, 1fr))` }}>
              {(p.items || []).map((it: any, i: number) => (
                <a key={i} href={preview ? undefined : it.href || undefined} className="group block overflow-hidden border" style={{ borderRadius: radius, borderColor: `${theme.text}14` }}>
                  {it.image ? (
                    <img src={it.image} alt={it.title} className="w-full aspect-[4/3] object-cover transition-transform group-hover:scale-105" loading="lazy" />
                  ) : (
                    <div className="w-full aspect-[4/3]" style={{ background: `${theme.primary}1A` }} />
                  )}
                  <div className="p-4">
                    <h3 className="font-semibold" style={{ color: theme.text }}>{it.title}</h3>
                    {it.text && <p className="text-sm opacity-70" style={{ color: theme.text }}>{it.text}</p>}
                  </div>
                </a>
              ))}
            </div>
          </div>
        </section>
      );
    }

    case "products":
      return (
        <section className={section} style={{ background: theme.background }}>
          <div className={container}>
            <Title>{p.title}</Title>
            <div className="mt-10 grid gap-5" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
              {(p.items || []).map((it: any, i: number) => (
                <div key={i} className="overflow-hidden border flex flex-col" style={{ borderRadius: radius, borderColor: `${theme.text}14` }}>
                  {it.image ? (
                    <img src={it.image} alt={it.title} className="w-full aspect-square object-cover" loading="lazy" />
                  ) : (
                    <div className="w-full aspect-square" style={{ background: `${theme.primary}1A` }} />
                  )}
                  <div className="p-4 flex flex-col gap-2 flex-1">
                    <h3 className="font-semibold" style={{ color: theme.text }}>{it.title}</h3>
                    {it.text && <p className="text-sm opacity-70" style={{ color: theme.text }}>{it.text}</p>}
                    <div className="mt-auto pt-2 flex items-center justify-between gap-2">
                      <span className="text-lg font-bold" style={{ color: theme.primary }}>{it.price}</span>
                      <Btn
                        label={p.buttonLabel}
                        href={p.whatsapp ? `https://wa.me/${String(p.whatsapp).replace(/\D/g, "")}?text=${encodeURIComponent(`Olá! Tenho interesse em: ${it.title}`)}` : "#contato"}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      );

    case "testimonials":
      return (
        <section className={section} style={{ background: `${theme.primary}0D` }}>
          <div className={container}>
            <Title>{p.title}</Title>
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {(p.items || []).map((it: any, i: number) => (
                <div key={i} className="p-6 border" style={{ borderRadius: radius, borderColor: `${theme.text}14`, background: theme.background }}>
                  <p className="italic opacity-80 whitespace-pre-wrap" style={{ color: theme.text }}>"{it.text}"</p>
                  <div className="mt-4 flex items-center gap-3">
                    {it.image ? (
                      <img src={it.image} alt={it.name} className="h-10 w-10 rounded-full object-cover" loading="lazy" />
                    ) : (
                      <div className="h-10 w-10 rounded-full" style={{ background: theme.primary }} />
                    )}
                    <div>
                      <div className="font-semibold text-sm" style={{ color: theme.text }}>{it.name}</div>
                      <div className="text-xs opacity-60" style={{ color: theme.text }}>{it.role}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      );

    case "faq":
      return (
        <section className={section} style={{ background: theme.background }}>
          <div className="mx-auto w-full max-w-3xl">
            <Title>{p.title}</Title>
            <div className="mt-8 space-y-3">
              {(p.items || []).map((it: any, i: number) => (
                <FaqItem key={i} item={it} theme={theme} radius={radius} />
              ))}
            </div>
          </div>
        </section>
      );

    case "cta":
      return (
        <section className="px-5 py-16 sm:px-8" style={{ background: `linear-gradient(120deg, ${theme.primary}, ${theme.secondary})` }}>
          <div className={`${container} text-center text-white`}>
            <h2 className="text-2xl sm:text-4xl font-bold">{p.title}</h2>
            {p.subtitle && <p className="mt-3 opacity-90">{p.subtitle}</p>}
            {p.ctaLabel && (
              <a
                href={preview ? undefined : p.ctaHref}
                onClick={preview ? (e) => e.preventDefault() : undefined}
                className="mt-6 inline-flex px-8 py-3 font-semibold bg-white"
                style={{ borderRadius: radius, color: theme.secondary }}
              >
                {p.ctaLabel}
              </a>
            )}
          </div>
        </section>
      );

    case "form":
      return <SiteForm block={block} theme={theme} radius={radius} siteId={siteId} preview={preview} />;

    case "links":
      return (
        <section className="px-5 py-14 sm:px-8" style={{ background: theme.background }}>
          <div className="mx-auto w-full max-w-md text-center">
            {p.avatar && <img src={p.avatar} alt={p.title} className="mx-auto h-24 w-24 rounded-full object-cover" loading="lazy" />}
            <h2 className="mt-4 text-xl font-bold" style={{ color: theme.text }}>{p.title}</h2>
            <div className="mt-6 space-y-3">
              {(p.items || []).map((l: any, i: number) => (
                <a
                  key={i}
                  href={preview ? undefined : l.href}
                  onClick={preview ? (e) => e.preventDefault() : undefined}
                  className="block w-full px-5 py-3 font-semibold transition-transform hover:scale-[1.02]"
                  style={{ background: theme.primary, color: "#fff", borderRadius: radius }}
                >
                  {l.label}
                </a>
              ))}
            </div>
          </div>
        </section>
      );

    case "video":
      return (
        <section className={section} style={{ background: theme.background }}>
          <div className="mx-auto w-full max-w-4xl">
            <Title>{p.title}</Title>
            <div className="mt-6 overflow-hidden aspect-video" style={{ borderRadius: radius, background: `${theme.text}0D` }}>
              {p.url ? (
                <iframe src={embedUrl(p.url)} title={p.title || "Vídeo"} className="w-full h-full" allowFullScreen allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture" />
              ) : (
                <div className="w-full h-full grid place-items-center text-sm opacity-60" style={{ color: theme.text }}>Adicione a URL do vídeo</div>
              )}
            </div>
          </div>
        </section>
      );

    case "image":
      return (
        <section className={p.full ? "" : section} style={{ background: theme.background }}>
          <div className={p.full ? "" : container}>
            {p.image ? (
              <img src={p.image} alt={p.caption || "Imagem"} className="w-full object-cover" style={{ borderRadius: p.full ? 0 : radius }} loading="lazy" />
            ) : (
              <div className="w-full aspect-[16/6]" style={{ background: `${theme.primary}1A`, borderRadius: p.full ? 0 : radius }} />
            )}
            {p.caption && <p className="mt-3 text-center text-sm opacity-70" style={{ color: theme.text }}>{p.caption}</p>}
          </div>
        </section>
      );

    case "text":
      return (
        <section className={section} style={{ background: theme.background }}>
          <div className="mx-auto w-full max-w-3xl">
            <Title center={false}>{p.title}</Title>
            <p className="mt-4 whitespace-pre-wrap leading-relaxed opacity-80" style={{ color: theme.text }}>{p.text}</p>
          </div>
        </section>
      );

    case "map":
      return (
        <section className={section} style={{ background: theme.background }}>
          <div className={container}>
            <Title>{p.title}</Title>
            <div className="mt-6 overflow-hidden aspect-[16/9]" style={{ borderRadius: radius }}>
              <iframe
                title="Mapa"
                className="w-full h-full border-0"
                loading="lazy"
                src={`https://www.google.com/maps?q=${encodeURIComponent(p.address || "")}&output=embed`}
              />
            </div>
          </div>
        </section>
      );

    case "spacer":
      return <div style={{ height: `${p.height || 48}px`, background: theme.background }} />;

    case "footer":
      return (
        <footer id="contato" className="px-5 py-12 sm:px-8" style={{ background: theme.secondary, color: "#fff" }}>
          <div className={`${container} grid gap-6 sm:grid-cols-3`}>
            <div>
              <div className="text-lg font-bold">{p.brand}</div>
              <p className="mt-2 text-sm opacity-70 whitespace-pre-wrap">{p.text}</p>
            </div>
            <div className="text-sm space-y-1 opacity-80">
              {p.whatsapp && <div>WhatsApp: {p.whatsapp}</div>}
              {p.email && <div>E-mail: {p.email}</div>}
              {p.instagram && <div>Instagram: {p.instagram}</div>}
              {p.address && <div>{p.address}</div>}
            </div>
            <div className="text-sm opacity-60 sm:text-right">
              © {new Date().getFullYear()} {p.brand}
            </div>
          </div>
        </footer>
      );

    default:
      return null;
  }
}

function FaqItem({ item, theme, radius }: any) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border overflow-hidden" style={{ borderRadius: radius, borderColor: `${theme.text}1A` }}>
      <button type="button" onClick={() => setOpen((o) => !o)} className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left font-medium" style={{ color: theme.text }}>
        {item.question}
        <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="px-5 pb-4 text-sm opacity-75 whitespace-pre-wrap" style={{ color: theme.text }}>{item.answer}</div>}
    </div>
  );
}

function SiteForm({ block, theme, radius, siteId, preview }: any) {
  const p = block.props || {};
  const [values, setValues] = useState<Record<string, string>>({});
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (preview) return;
    setSending(true);
    try {
      const { error } = await supabase.from("contact_form_submissions").insert({
        name: values.name || values.nome || "Visitante",
        email: values.email || null,
        phone: values.phone || values.telefone || null,
        subject: `Site: ${p.title || "Formulário"}`,
        message: JSON.stringify(values),
        agent_id: siteId || null,
      } as any);
      if (error) throw error;
      setSent(true);
    } catch (err: any) {
      toast.error("Não foi possível enviar. Tente novamente.");
    } finally {
      setSending(false);
    }
  };

  return (
    <section id="contato" className="px-5 py-14 sm:px-8 sm:py-20" style={{ background: `${theme.primary}0D` }}>
      <div className="mx-auto w-full max-w-xl">
        <h2 className="text-2xl sm:text-4xl font-bold text-center" style={{ color: theme.text }}>{p.title}</h2>
        {p.subtitle && <p className="mt-3 text-center opacity-70" style={{ color: theme.text }}>{p.subtitle}</p>}
        {sent ? (
          <div className="mt-8 p-6 text-center font-medium" style={{ borderRadius: radius, background: theme.background, color: theme.text }}>
            {p.successMessage}
          </div>
        ) : (
          <form onSubmit={submit} className="mt-8 space-y-4">
            {(p.fields || []).map((f: any, i: number) => (
              <div key={i}>
                <label className="block mb-1 text-sm font-medium" style={{ color: theme.text }}>
                  {f.label}{f.required ? " *" : ""}
                </label>
                {f.type === "textarea" ? (
                  <textarea
                    required={!!f.required}
                    rows={4}
                    className="w-full px-4 py-3 text-base border outline-none"
                    style={{ borderRadius: radius, borderColor: `${theme.text}26`, background: theme.background, color: theme.text }}
                    value={values[f.key] || ""}
                    onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                  />
                ) : (
                  <input
                    required={!!f.required}
                    type={f.type || "text"}
                    className="w-full px-4 py-3 text-base border outline-none"
                    style={{ borderRadius: radius, borderColor: `${theme.text}26`, background: theme.background, color: theme.text }}
                    value={values[f.key] || ""}
                    onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                  />
                )}
              </div>
            ))}
            <button
              type="submit"
              disabled={sending}
              className="w-full px-6 py-3 font-semibold disabled:opacity-60"
              style={{ background: theme.primary, color: "#fff", borderRadius: radius }}
            >
              {sending ? "Enviando..." : p.buttonLabel || "Enviar"}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
