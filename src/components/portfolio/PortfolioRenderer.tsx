import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CaptureTheme, DEFAULT_THEME, embedUrl } from "@/components/capture/captureTypes";
import {
  DEFAULT_CONTACT,
  PortfolioContact,
  PortfolioItemRecord,
  PortfolioLayout,
  PortfolioRecord,
  PortfolioSection,
} from "./portfolioTypes";
import {
  Loader2,
  Check,
  Instagram,
  Facebook,
  Youtube,
  Linkedin,
  MessageCircle,
  Mail,
  Phone,
  MapPin,
  Globe,
  Github,
  ExternalLink,
  FileText,
  Star,
} from "lucide-react";

interface Props {
  portfolio: Pick<
    PortfolioRecord,
    "id" | "name" | "description" | "logo_url" | "cover_url" | "theme" | "sections" | "custom_fields" | "contact" | "layout"
  >;
  items: PortfolioItemRecord[];
  mode: "preview" | "live";
}

const animClass = (anim: CaptureTheme["animation"]) =>
  anim === "fade" ? "cp-anim-fade" : anim === "slide-up" ? "cp-anim-slide-up" : anim === "zoom" ? "cp-anim-zoom" : "";

const SOCIAL_ICONS: { key: keyof PortfolioContact; icon: typeof Instagram; href: (v: string) => string }[] = [
  { key: "whatsapp", icon: MessageCircle, href: (v) => `https://wa.me/${v.replace(/\D/g, "")}` },
  { key: "instagram", icon: Instagram, href: (v) => v },
  { key: "facebook", icon: Facebook, href: (v) => v },
  { key: "youtube", icon: Youtube, href: (v) => v },
  { key: "linkedin", icon: Linkedin, href: (v) => v },
  { key: "github", icon: Github, href: (v) => v },
  { key: "website", icon: Globe, href: (v) => v },
];

export const PortfolioRenderer = ({ portfolio, items, mode }: Props) => {
  const theme: CaptureTheme = { ...DEFAULT_THEME, ...(portfolio.theme || {}) };
  const contact: PortfolioContact = { ...DEFAULT_CONTACT, ...(portfolio.contact || {}) };
  const sections: PortfolioSection[] = Array.isArray(portfolio.sections) ? portfolio.sections : [];
  const layout: PortfolioLayout = portfolio.layout || "grid";

  const [activeCategory, setActiveCategory] = useState("all");
  const [openItem, setOpenItem] = useState<PortfolioItemRecord | null>(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "", subject: "", message: "" });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const published = useMemo(
    () => items.filter((i) => i.is_published !== false).sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0)),
    [items],
  );

  const categories = useMemo(() => {
    const set = new Set<string>();
    published.forEach((i) => i.category && set.add(i.category));
    return Array.from(set);
  }, [published]);

  const buttonStyle: React.CSSProperties =
    theme.buttonStyle === "outline"
      ? { background: "transparent", color: theme.primary, border: `2px solid ${theme.primary}`, borderRadius: theme.buttonRadius }
      : theme.buttonStyle === "soft"
        ? { background: `${theme.primary}22`, color: theme.primary, border: `1px solid ${theme.primary}55`, borderRadius: theme.buttonRadius }
        : { background: theme.primary, color: theme.primaryText, border: "none", borderRadius: theme.buttonRadius };

  const cardStyle: React.CSSProperties = {
    background: theme.surface,
    border: `1px solid ${theme.borderColor}`,
    borderRadius: theme.radius,
  };

  const sectionStyle: React.CSSProperties = {
    paddingTop: theme.sectionSpacing,
    paddingBottom: theme.sectionSpacing,
  };

  const wrap = (children: React.ReactNode, key: string, id?: string) => (
    <section key={key} id={id} style={sectionStyle} className={animClass(theme.animation)}>
      <div className="mx-auto w-full px-5" style={{ maxWidth: theme.contentWidth }}>
        {children}
      </div>
    </section>
  );

  const heading = (text: string, sub?: string) => (
    <div className="mb-8 text-center">
      <h2 style={{ fontSize: 30 * theme.headingScale, color: theme.textColor }} className="font-bold leading-tight">
        {text}
      </h2>
      {sub ? (
        <p style={{ color: theme.mutedTextColor }} className="mx-auto mt-2 max-w-2xl text-base">
          {sub}
        </p>
      ) : null}
    </div>
  );

  const handleSend = async (e: React.FormEvent, successMessage: string) => {
    e.preventDefault();
    setError("");
    if (mode === "preview") return;
    if (!form.name.trim() || !form.message.trim()) {
      setError("Informe seu nome e a mensagem.");
      return;
    }
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setError("Informe um e-mail válido.");
      return;
    }
    setSending(true);
    try {
      const { error: insErr } = await supabase.from("portfolio_messages").insert({
        portfolio_id: portfolio.id,
        name: form.name.trim().slice(0, 120),
        email: form.email.trim().slice(0, 200) || null,
        phone: form.phone.trim().slice(0, 40) || null,
        subject: form.subject.trim().slice(0, 160) || null,
        message: form.message.trim().slice(0, 3000),
      });
      if (insErr) throw insErr;
      setSent(true);
      setForm({ name: "", email: "", phone: "", subject: "", message: "" });
    } catch (err: any) {
      setError(err?.message || "Não foi possível enviar sua mensagem.");
    } finally {
      setSending(false);
    }
    void successMessage;
  };

  /* ------------------------------- Project card ------------------------------ */

  const ProjectCard = ({ item, horizontal }: { item: PortfolioItemRecord; horizontal?: boolean }) => (
    <button
      type="button"
      onClick={() => setOpenItem(item)}
      style={cardStyle}
      className={`group overflow-hidden text-left transition-transform hover:-translate-y-1 ${horizontal ? "flex w-full flex-col gap-4 p-4 sm:flex-row" : "flex flex-col"}`}
    >
      {item.image_url ? (
        <img
          src={item.image_url}
          alt={item.title}
          loading="lazy"
          className={horizontal ? "h-44 w-full rounded-lg object-cover sm:w-56" : "aspect-[4/3] w-full object-cover"}
          style={horizontal ? { borderRadius: theme.radius / 1.5 } : undefined}
        />
      ) : null}
      <div className={horizontal ? "flex-1" : "p-4"}>
        <div className="flex items-start justify-between gap-2">
          <h3 style={{ color: theme.textColor }} className="text-lg font-semibold">
            {item.title}
          </h3>
          {item.is_featured ? <Star className="h-4 w-4 shrink-0" style={{ color: theme.primary }} fill={theme.primary} /> : null}
        </div>
        {item.category ? (
          <span style={{ color: theme.primary }} className="text-xs font-medium uppercase tracking-wide">
            {item.category}
          </span>
        ) : null}
        {item.description ? (
          <p style={{ color: theme.mutedTextColor }} className={`mt-2 text-sm ${horizontal ? "" : "line-clamp-3"}`}>
            {item.description}
          </p>
        ) : null}
        {item.tags?.length ? (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {item.tags.slice(0, 5).map((t) => (
              <span
                key={t}
                className="rounded-full px-2 py-0.5 text-[11px]"
                style={{ background: `${theme.primary}1f`, color: theme.primary }}
              >
                {t}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </button>
  );

  const renderProjects = (props: Record<string, any>) => {
    let list = published;
    if (props.showFeaturedFirst) list = [...list].sort((a, b) => Number(!!b.is_featured) - Number(!!a.is_featured));
    if (activeCategory !== "all") list = list.filter((i) => i.category === activeCategory);

    return (
      <>
        {heading(props.title || "Projetos", props.subtitle)}
        {props.showFilters && categories.length > 1 ? (
          <div className="mb-6 flex flex-wrap justify-center gap-2">
            {["all", ...categories].map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setActiveCategory(c)}
                className="px-3 py-1.5 text-sm transition"
                style={{
                  borderRadius: theme.buttonRadius,
                  background: activeCategory === c ? theme.primary : "transparent",
                  color: activeCategory === c ? theme.primaryText : theme.mutedTextColor,
                  border: `1px solid ${activeCategory === c ? theme.primary : theme.borderColor}`,
                }}
              >
                {c === "all" ? "Todos" : c}
              </button>
            ))}
          </div>
        ) : null}

        {list.length === 0 ? (
          <p style={{ color: theme.mutedTextColor }} className="text-center text-sm">
            Nenhum projeto cadastrado ainda.
          </p>
        ) : layout === "list" ? (
          <div className="space-y-4">
            {list.map((i) => (
              <ProjectCard key={i.id} item={i} horizontal />
            ))}
          </div>
        ) : layout === "masonry" ? (
          <div className="columns-1 gap-4 sm:columns-2 lg:columns-3 [&>*]:mb-4">
            {list.map((i) => (
              <div key={i.id} className="break-inside-avoid">
                <ProjectCard item={i} />
              </div>
            ))}
          </div>
        ) : layout === "carousel" ? (
          <div className="-mx-1 flex snap-x gap-4 overflow-x-auto px-1 pb-3">
            {list.map((i) => (
              <div key={i.id} className="w-[280px] shrink-0 snap-start">
                <ProjectCard item={i} />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((i) => (
              <ProjectCard key={i.id} item={i} />
            ))}
          </div>
        )}
      </>
    );
  };

  const socialLinks = SOCIAL_ICONS.filter((s) => contact[s.key]);

  const renderSection = (section: PortfolioSection) => {
    const p = section.props || {};
    switch (section.type) {
      case "hero":
        return (
          <section
            key={section.id}
            className={animClass(theme.animation)}
            style={{
              paddingTop: theme.sectionSpacing + 24,
              paddingBottom: theme.sectionSpacing + 24,
              backgroundImage: p.backgroundImage ? `linear-gradient(${theme.background}cc, ${theme.background}cc), url(${p.backgroundImage})` : undefined,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            <div
              className={`mx-auto w-full px-5 ${p.align === "left" ? "text-left" : "text-center"}`}
              style={{ maxWidth: theme.contentWidth }}
            >
              {(p.avatar || portfolio.logo_url) && (
                <img
                  src={p.avatar || portfolio.logo_url || ""}
                  alt={p.title || portfolio.name}
                  className={`mb-5 h-28 w-28 rounded-full object-cover ${p.align === "left" ? "" : "mx-auto"}`}
                  style={{ border: `3px solid ${theme.primary}` }}
                />
              )}
              {p.eyebrow ? (
                <span style={{ color: theme.primary }} className="text-sm font-semibold uppercase tracking-widest">
                  {p.eyebrow}
                </span>
              ) : null}
              <h1
                style={{ color: theme.textColor, fontSize: 44 * theme.headingScale }}
                className="mt-2 font-bold leading-tight"
              >
                {p.title || portfolio.name}
              </h1>
              {p.subtitle ? (
                <p style={{ color: theme.mutedTextColor }} className={`mt-3 text-lg ${p.align === "left" ? "" : "mx-auto"} max-w-2xl`}>
                  {p.subtitle}
                </p>
              ) : null}
              <div className={`mt-7 flex flex-wrap gap-3 ${p.align === "left" ? "" : "justify-center"}`}>
                {p.primaryLabel ? (
                  <a href={p.primaryUrl || "#contato"} style={{ ...buttonStyle, padding: "12px 24px" }} className="text-sm font-semibold">
                    {p.primaryLabel}
                  </a>
                ) : null}
                {p.secondaryLabel ? (
                  <a
                    href={p.secondaryUrl || "#projetos"}
                    style={{
                      border: `1px solid ${theme.borderColor}`,
                      color: theme.textColor,
                      borderRadius: theme.buttonRadius,
                      padding: "12px 24px",
                    }}
                    className="text-sm font-semibold"
                  >
                    {p.secondaryLabel}
                  </a>
                ) : null}
              </div>
              {socialLinks.length ? (
                <div className={`mt-7 flex gap-3 ${p.align === "left" ? "" : "justify-center"}`}>
                  {socialLinks.map(({ key, icon: Icon, href }) => (
                    <a
                      key={key}
                      href={href(String(contact[key]))}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-10 w-10 items-center justify-center transition hover:opacity-80"
                      style={{ ...cardStyle, borderRadius: 999 }}
                      aria-label={key}
                    >
                      <Icon className="h-4 w-4" style={{ color: theme.primary }} />
                    </a>
                  ))}
                </div>
              ) : null}
            </div>
          </section>
        );

      case "about":
        return wrap(
          <div className="grid items-center gap-8 md:grid-cols-[1fr_1.2fr]">
            {p.image ? (
              <img src={p.image} alt={p.title} className="w-full object-cover" style={{ borderRadius: theme.radius, maxHeight: 420 }} />
            ) : null}
            <div className={p.image ? "" : "md:col-span-2"}>
              <h2 style={{ color: theme.textColor, fontSize: 28 * theme.headingScale }} className="font-bold">
                {p.title}
              </h2>
              <p style={{ color: theme.mutedTextColor }} className="mt-3 whitespace-pre-line text-base leading-relaxed">
                {p.text}
              </p>
              {Array.isArray(p.highlights) && p.highlights.length ? (
                <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {p.highlights.map((h: any, idx: number) => (
                    <div key={idx} style={cardStyle} className="p-3 text-center">
                      <div style={{ color: theme.primary }} className="text-2xl font-bold">
                        {h.value}
                      </div>
                      <div style={{ color: theme.mutedTextColor }} className="text-xs">
                        {h.label}
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </div>,
          section.id,
          "sobre",
        );

      case "projects":
        return wrap(renderProjects(p), section.id, "projetos");

      case "services":
        return wrap(
          <>
            {heading(p.title || "Serviços")}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {(p.items || []).map((s: any, idx: number) => (
                <div key={idx} style={cardStyle} className="p-5">
                  <h3 style={{ color: theme.textColor }} className="text-lg font-semibold">
                    {s.title}
                  </h3>
                  <p style={{ color: theme.mutedTextColor }} className="mt-2 text-sm">
                    {s.description}
                  </p>
                  {s.price ? (
                    <div style={{ color: theme.primary }} className="mt-3 text-base font-bold">
                      {s.price}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </>,
          section.id,
          "servicos",
        );

      case "testimonials":
        return wrap(
          <>
            {heading(p.title || "Depoimentos")}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {(p.items || []).map((t: any, idx: number) => (
                <div key={idx} style={cardStyle} className="p-5">
                  <p style={{ color: theme.textColor }} className="text-sm italic">
                    “{t.text}”
                  </p>
                  <div className="mt-4 flex items-center gap-3">
                    {t.avatar ? <img src={t.avatar} alt={t.name} className="h-10 w-10 rounded-full object-cover" /> : null}
                    <div>
                      <div style={{ color: theme.textColor }} className="text-sm font-semibold">
                        {t.name}
                      </div>
                      <div style={{ color: theme.mutedTextColor }} className="text-xs">
                        {t.role}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>,
          section.id,
        );

      case "gallery":
        return wrap(
          <>
            {heading(p.title || "Galeria")}
            <div className={`grid gap-3 ${p.columns === 2 ? "sm:grid-cols-2" : p.columns === 4 ? "sm:grid-cols-2 lg:grid-cols-4" : "sm:grid-cols-2 lg:grid-cols-3"}`}>
              {(p.images || []).map((img: string, idx: number) => (
                <img key={idx} src={img} alt={`Imagem ${idx + 1}`} loading="lazy" className="aspect-square w-full object-cover" style={{ borderRadius: theme.radius }} />
              ))}
            </div>
          </>,
          section.id,
        );

      case "video":
        return wrap(
          <>
            {heading(p.title || "Vídeo", p.description)}
            {p.url ? (
              <div className="mx-auto aspect-video w-full max-w-3xl overflow-hidden" style={{ borderRadius: theme.radius }}>
                <iframe src={embedUrl(p.url)} title={p.title || "Vídeo"} className="h-full w-full" allowFullScreen />
              </div>
            ) : null}
          </>,
          section.id,
        );

      case "contact":
        return wrap(
          <>
            {heading(p.title || "Contato", p.subtitle)}
            <div className="grid gap-6 md:grid-cols-2">
              <div style={cardStyle} className="space-y-3 p-5">
                {contact.email ? (
                  <a href={`mailto:${contact.email}`} className="flex items-center gap-3 text-sm" style={{ color: theme.textColor }}>
                    <Mail className="h-4 w-4" style={{ color: theme.primary }} /> {contact.email}
                  </a>
                ) : null}
                {contact.phone ? (
                  <a href={`tel:${contact.phone}`} className="flex items-center gap-3 text-sm" style={{ color: theme.textColor }}>
                    <Phone className="h-4 w-4" style={{ color: theme.primary }} /> {contact.phone}
                  </a>
                ) : null}
                {contact.whatsapp ? (
                  <a
                    href={`https://wa.me/${contact.whatsapp.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-sm"
                    style={{ color: theme.textColor }}
                  >
                    <MessageCircle className="h-4 w-4" style={{ color: theme.primary }} /> WhatsApp
                  </a>
                ) : null}
                {contact.address ? (
                  <div className="flex items-center gap-3 text-sm" style={{ color: theme.textColor }}>
                    <MapPin className="h-4 w-4" style={{ color: theme.primary }} /> {contact.address}
                  </div>
                ) : null}
                {socialLinks.length ? (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {socialLinks.map(({ key, icon: Icon, href }) => (
                      <a
                        key={key}
                        href={href(String(contact[key]))}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={key}
                        className="flex h-9 w-9 items-center justify-center"
                        style={{ border: `1px solid ${theme.borderColor}`, borderRadius: 999 }}
                      >
                        <Icon className="h-4 w-4" style={{ color: theme.primary }} />
                      </a>
                    ))}
                  </div>
                ) : null}
              </div>

              {p.showForm !== false ? (
                <div style={cardStyle} className="p-5">
                  {sent ? (
                    <div className="flex flex-col items-center gap-3 py-8 text-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full" style={{ background: `${theme.primary}22` }}>
                        <Check className="h-6 w-6" style={{ color: theme.primary }} />
                      </div>
                      <p style={{ color: theme.textColor }} className="text-sm">
                        {p.successMessage || "Mensagem enviada!"}
                      </p>
                    </div>
                  ) : (
                    <form onSubmit={(e) => handleSend(e, p.successMessage)} className="space-y-3">
                      {[
                        { k: "name", ph: "Seu nome*", type: "text" },
                        { k: "email", ph: "Seu e-mail", type: "email" },
                        { k: "phone", ph: "Seu telefone / WhatsApp", type: "text" },
                        { k: "subject", ph: "Assunto", type: "text" },
                      ].map((f) => (
                        <input
                          key={f.k}
                          type={f.type}
                          placeholder={f.ph}
                          value={(form as any)[f.k]}
                          onChange={(e) => setForm((prev) => ({ ...prev, [f.k]: e.target.value }))}
                          className="w-full px-3 py-2.5 text-sm outline-none"
                          style={{
                            background: theme.background,
                            color: theme.textColor,
                            border: `1px solid ${theme.borderColor}`,
                            borderRadius: theme.radius / 2,
                          }}
                        />
                      ))}
                      <textarea
                        placeholder="Sua mensagem*"
                        rows={4}
                        value={form.message}
                        onChange={(e) => setForm((prev) => ({ ...prev, message: e.target.value }))}
                        className="w-full px-3 py-2.5 text-sm outline-none"
                        style={{
                          background: theme.background,
                          color: theme.textColor,
                          border: `1px solid ${theme.borderColor}`,
                          borderRadius: theme.radius / 2,
                        }}
                      />
                      {error ? <p className="text-sm text-red-400">{error}</p> : null}
                      <button
                        type="submit"
                        disabled={sending}
                        style={{ ...buttonStyle, padding: "12px 20px" }}
                        className="flex w-full items-center justify-center gap-2 text-sm font-semibold disabled:opacity-70"
                      >
                        {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                        {p.buttonText || "Enviar mensagem"}
                      </button>
                    </form>
                  )}
                </div>
              ) : null}
            </div>
          </>,
          section.id,
          "contato",
        );

      case "footer":
        return (
          <footer key={section.id} style={{ borderTop: `1px solid ${theme.borderColor}`, padding: "28px 20px" }}>
            <div className="mx-auto flex flex-col items-center gap-3 text-center" style={{ maxWidth: theme.contentWidth }}>
              <p style={{ color: theme.mutedTextColor }} className="text-sm">
                {p.text}
              </p>
              {p.showSocial && socialLinks.length ? (
                <div className="flex gap-3">
                  {socialLinks.map(({ key, icon: Icon, href }) => (
                    <a key={key} href={href(String(contact[key]))} target="_blank" rel="noopener noreferrer" aria-label={key}>
                      <Icon className="h-4 w-4" style={{ color: theme.mutedTextColor }} />
                    </a>
                  ))}
                </div>
              ) : null}
            </div>
          </footer>
        );

      default:
        return null;
    }
  };

  return (
    <div
      style={{
        background: theme.background,
        color: theme.textColor,
        fontFamily: theme.fontFamily,
        fontSize: theme.baseFontSize,
        minHeight: "100%",
      }}
    >
      {sections.filter((s) => s.visible !== false).map(renderSection)}

      {openItem ? (
        <div
          className="fixed inset-0 z-[200] flex items-start justify-center overflow-y-auto bg-black/70 p-4"
          onClick={() => setOpenItem(null)}
        >
          <div
            className="my-8 w-full max-w-3xl overflow-hidden"
            style={{ ...cardStyle }}
            onClick={(e) => e.stopPropagation()}
          >
            {openItem.image_url ? <img src={openItem.image_url} alt={openItem.title} className="max-h-80 w-full object-cover" /> : null}
            <div className="space-y-4 p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 style={{ color: theme.textColor }} className="text-2xl font-bold">
                    {openItem.title}
                  </h3>
                  {openItem.category ? (
                    <span style={{ color: theme.primary }} className="text-xs uppercase tracking-wide">
                      {openItem.category}
                    </span>
                  ) : null}
                </div>
                <button type="button" onClick={() => setOpenItem(null)} style={{ color: theme.mutedTextColor }} className="text-sm">
                  Fechar
                </button>
              </div>

              {openItem.description ? (
                <p style={{ color: theme.mutedTextColor }} className="whitespace-pre-line text-sm">
                  {openItem.description}
                </p>
              ) : null}

              {openItem.video_url ? (
                <div className="aspect-video w-full overflow-hidden" style={{ borderRadius: theme.radius / 1.5 }}>
                  <iframe src={embedUrl(openItem.video_url)} title={openItem.title} className="h-full w-full" allowFullScreen />
                </div>
              ) : null}

              {openItem.images?.length ? (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {openItem.images.map((img, i) => (
                    <img key={i} src={img} alt={`${openItem.title} ${i + 1}`} loading="lazy" className="aspect-square w-full object-cover" style={{ borderRadius: theme.radius / 2 }} />
                  ))}
                </div>
              ) : null}

              {(openItem.client_name || openItem.project_date || Object.keys(openItem.custom_data || {}).length) ? (
                <div className="grid gap-2 sm:grid-cols-2">
                  {openItem.client_name ? (
                    <div className="text-sm">
                      <span style={{ color: theme.mutedTextColor }}>Cliente: </span>
                      <span style={{ color: theme.textColor }}>{openItem.client_name}</span>
                    </div>
                  ) : null}
                  {openItem.project_date ? (
                    <div className="text-sm">
                      <span style={{ color: theme.mutedTextColor }}>Data: </span>
                      <span style={{ color: theme.textColor }}>
                        {new Date(`${openItem.project_date}T00:00:00`).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                  ) : null}
                  {Object.entries(openItem.custom_data || {})
                    .filter(([, v]) => v !== "" && v !== null && v !== undefined && v !== false)
                    .map(([k, v]) => (
                      <div key={k} className="text-sm">
                        <span style={{ color: theme.mutedTextColor }}>{k}: </span>
                        <span style={{ color: theme.textColor }}>{String(v)}</span>
                      </div>
                    ))}
                </div>
              ) : null}

              <div className="flex flex-wrap gap-2">
                {openItem.project_url ? (
                  <a href={openItem.project_url} target="_blank" rel="noopener noreferrer" style={{ ...buttonStyle, padding: "10px 16px" }} className="inline-flex items-center gap-2 text-sm font-semibold">
                    <ExternalLink className="h-4 w-4" /> Ver projeto
                  </a>
                ) : null}
                {(openItem.links || []).map((l, i) => (
                  <a
                    key={i}
                    href={l.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 text-sm"
                    style={{ border: `1px solid ${theme.borderColor}`, color: theme.textColor, borderRadius: theme.buttonRadius }}
                  >
                    <ExternalLink className="h-4 w-4" /> {l.label || "Link"}
                  </a>
                ))}
                {(openItem.files || []).map((f, i) => (
                  <a
                    key={i}
                    href={f.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 text-sm"
                    style={{ border: `1px solid ${theme.borderColor}`, color: theme.textColor, borderRadius: theme.buttonRadius }}
                  >
                    <FileText className="h-4 w-4" /> {f.name || "Arquivo"}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default PortfolioRenderer;
