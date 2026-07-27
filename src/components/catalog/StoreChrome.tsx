import { useRef, useState } from "react";
import { Search, ShieldCheck, Truck, Headphones, RefreshCw, Store, Instagram, Facebook, Youtube, MessageCircle, ChevronDown, LayoutGrid } from "lucide-react";
import type { CatalogLayoutSettings } from "./catalogLayout";

export interface StorePageLink {
  id: string;
  title: string;
  slug: string;
}


export interface StoreCategory {
  id: string;
  name: string;
  color: string;
  image_url?: string | null;
}

interface Palette {
  primary: string;
  text: string;
  background: string;
}

export const StoreTopBar = ({
  palette,
  hasWhatsApp,
  config,
}: {
  palette: Palette;
  hasWhatsApp: boolean;
  config: CatalogLayoutSettings["topbar"];
}) => {
  if (!config.enabled) return null;
  return (
    <div className="w-full text-[11px] sm:text-xs" style={{ backgroundColor: `${palette.text}0d`, color: `${palette.text}b3` }}>
      <div className="container mx-auto px-4 py-2 flex items-center justify-center gap-4 sm:gap-10 overflow-x-auto whitespace-nowrap">
        {config.item1 && (
          <span className="flex items-center gap-1.5">
            <Truck className="w-3.5 h-3.5" style={{ color: palette.primary }} />
            {config.item1}
          </span>
        )}
        {config.item2 && (
          <span className="hidden sm:flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" style={{ color: palette.primary }} />
            {config.item2}
          </span>
        )}
        {hasWhatsApp && config.item3 && (
          <span className="flex items-center gap-1.5">
            <MessageCircle className="w-3.5 h-3.5" style={{ color: palette.primary }} />
            {config.item3}
          </span>
        )}
      </div>
    </div>
  );
};

export const StoreHeader = ({
  palette,
  name,
  description,
  logoUrl,
  search,
  onSearch,
  onWhatsApp,
  right,
  config,
}: {
  palette: Palette;
  name: string;
  description?: string | null;
  logoUrl?: string | null;
  search: string;
  onSearch: (v: string) => void;
  onWhatsApp?: () => void;
  right?: React.ReactNode;
  config: CatalogLayoutSettings["header"];
}) => (
  <div className="border-b" style={{ borderColor: `${palette.text}14`, backgroundColor: palette.background }}>
    <div className="container mx-auto px-4 py-4 flex items-center gap-4">
      <a href="#topo" className="flex items-center gap-2.5 shrink-0">
        {logoUrl ? (
          <img src={logoUrl} alt={`Logo ${name}`} className="w-11 h-11 rounded-xl object-cover" />
        ) : (
          <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${palette.primary}1a` }}>
            <Store className="w-5 h-5" style={{ color: palette.primary }} />
          </div>
        )}
        <span className="leading-tight">
          <span className="block text-lg sm:text-xl font-extrabold tracking-tight">{name}</span>
          {description && (
            <span className="hidden sm:block text-[11px]" style={{ color: `${palette.text}99` }}>
              {description.slice(0, 42)}
            </span>
          )}
        </span>
      </a>

      {config.showSearch && (
        <div className="flex-1 hidden md:block">
          <div
            className="flex items-center rounded-full overflow-hidden border"
            style={{ borderColor: `${palette.text}1f`, backgroundColor: `${palette.text}08` }}
          >
            <input
              value={search}
              onChange={(e) => onSearch(e.target.value)}
              placeholder={config.searchPlaceholder}
              aria-label="Buscar no catálogo"
              className="flex-1 bg-transparent px-5 py-2.5 text-sm outline-none"
              style={{ color: palette.text }}
            />
            <span className="flex items-center justify-center w-12 h-10 mr-1 rounded-full" style={{ backgroundColor: palette.primary }}>
              <Search className="w-4 h-4 text-white" />
            </span>
          </div>
        </div>
      )}

      <div className="ml-auto flex items-center gap-2">
        {onWhatsApp && config.showCta && (
          <button
            onClick={onWhatsApp}
            className="hidden sm:flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-white"
            style={{ backgroundColor: palette.primary }}
          >
            <MessageCircle className="w-4 h-4" />
            {config.ctaLabel}
          </button>
        )}
        {right}
      </div>
    </div>

    {config.showSearch && (
      <div className="md:hidden container mx-auto px-4 pb-3">
        <div className="flex items-center rounded-full border px-4" style={{ borderColor: `${palette.text}1f`, backgroundColor: `${palette.text}08` }}>
          <Search className="w-4 h-4" style={{ color: `${palette.text}80` }} />
          <input
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder={config.searchPlaceholder}
            aria-label="Buscar no catálogo"
            className="flex-1 bg-transparent px-3 py-2.5 text-sm outline-none"
            style={{ color: palette.text }}
          />
        </div>
      </div>
    )}
  </div>
);

export const StoreNav = ({
  palette,
  categories,
  active,
  onSelect,
  config,
  pages = [],
  catalogSlug,
}: {
  palette: Palette;
  categories: StoreCategory[];
  active: string;
  onSelect: (id: string) => void;
  config: CatalogLayoutSettings["categories"];
  pages?: StorePageLink[];
  catalogSlug?: string;
}) => {
  const [openCats, setOpenCats] = useState(false);
  const hasHome = config.showHomeInNav;
  if (!hasHome && pages.length === 0 && categories.length === 0) return null;

  return (
    <nav className="border-b sticky top-0 z-30 backdrop-blur" style={{ borderColor: `${palette.text}14`, backgroundColor: `${palette.background}f2` }}>
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide py-2">
          {hasHome && (
            <button
              onClick={() => {
                setOpenCats(false);
                onSelect("all");
              }}
              className="shrink-0 px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors"
              style={{
                color: active === "all" ? palette.primary : `${palette.text}b3`,
                backgroundColor: active === "all" ? `${palette.primary}14` : "transparent",
              }}
            >
              {config.homeLabel}
            </button>
          )}

          {pages.map((p) => (
            <a
              key={p.id}
              href={`/catalogo/${catalogSlug}/p/${p.slug}`}
              className="shrink-0 px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors hover:underline"
              style={{ color: `${palette.text}b3` }}
            >
              {p.title}
            </a>
          ))}

          {categories.length > 0 && (
            <button
              onClick={() => setOpenCats((v) => !v)}
              className="shrink-0 ml-auto px-3.5 py-1.5 rounded-full text-sm font-semibold inline-flex items-center gap-1.5"
              style={{ color: palette.primary, backgroundColor: `${palette.primary}14` }}
            >
              <LayoutGrid className="w-4 h-4" />
              Ver todas as categorias
              <ChevronDown className={`w-4 h-4 transition-transform ${openCats ? "rotate-180" : ""}`} />
            </button>
          )}
        </div>

        {openCats && categories.length > 0 && (
          <div
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 pb-4 pt-1"
            style={{ borderTop: `1px solid ${palette.text}14` }}
          >
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => {
                  onSelect(c.id);
                  setOpenCats(false);
                }}
                className="text-left text-sm px-3 py-2 rounded-lg transition-colors"
                style={{
                  color: active === c.id ? palette.primary : `${palette.text}cc`,
                  backgroundColor: active === c.id ? `${palette.primary}14` : `${palette.text}08`,
                }}
              >
                {c.name}
              </button>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
};


export const StoreCategoryStrip = ({
  palette,
  categories,
  onSelect,
  title,
}: {
  palette: Palette;
  categories: StoreCategory[];
  onSelect: (id: string) => void;
  title: string;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  if (categories.length === 0) return null;
  return (
    <section className="mb-10">
      {title && <h2 className="text-xl font-bold mb-4">{title}</h2>}
      <div ref={ref} className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {categories.slice(0, 8).map((c) => (
          <button
            key={c.id}
            onClick={() => onSelect(c.id)}
            className="rounded-xl border p-3 flex flex-col items-center gap-2 hover:-translate-y-0.5 transition-transform"
            style={{ borderColor: `${palette.text}14`, backgroundColor: `${palette.text}06` }}
          >
            <span className="w-14 h-14 rounded-lg overflow-hidden flex items-center justify-center" style={{ backgroundColor: `${c.color}1a` }}>
              {c.image_url ? (
                <img src={c.image_url} alt={`Categoria ${c.name}`} loading="lazy" className="w-full h-full object-cover" />
              ) : (
                <Store className="w-6 h-6" style={{ color: c.color }} />
              )}
            </span>
            <span className="text-[11px] font-medium text-center line-clamp-2">{c.name}</span>
          </button>
        ))}
      </div>
    </section>
  );
};

const benefitIcons = [Truck, RefreshCw, ShieldCheck, Headphones];

export const StoreBenefits = ({ palette, config }: { palette: Palette; config: CatalogLayoutSettings["benefits"] }) => {
  if (!config.enabled) return null;
  return (
    <section
      className="rounded-2xl border grid grid-cols-2 lg:grid-cols-4 gap-4 p-5 my-10"
      style={{ borderColor: `${palette.text}14`, backgroundColor: `${palette.text}06` }}
    >
      {config.items.map((item, i) => {
        const Icon = benefitIcons[i] || Truck;
        return (
          <div key={i} className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${palette.primary}1a` }}>
              <Icon className="w-5 h-5" style={{ color: palette.primary }} />
            </span>
            <span className="leading-tight">
              <span className="block text-sm font-semibold">{item.title}</span>
              <span className="block text-[11px]" style={{ color: `${palette.text}99` }}>{item.sub}</span>
            </span>
          </div>
        );
      })}
    </section>
  );
};

export const StoreFooter = ({
  palette,
  name,
  description,
  logoUrl,
  categories,
  onSelect,
  onWhatsApp,
  config,
  pages = [],
  catalogSlug,
}: {
  palette: Palette;
  name: string;
  description?: string | null;
  logoUrl?: string | null;
  categories: StoreCategory[];
  onSelect: (id: string) => void;
  onWhatsApp?: () => void;
  config: CatalogLayoutSettings["footer"];
  pages?: StorePageLink[];
  catalogSlug?: string;
}) => {
  if (!config.enabled) return null;
  const about = config.about || description;
  const socials = [
    { url: config.instagram, Icon: Instagram, label: "Instagram" },
    { url: config.facebook, Icon: Facebook, label: "Facebook" },
    { url: config.youtube, Icon: Youtube, label: "YouTube" },
  ].filter((s) => !!s.url);

  return (
    <footer className="mt-12" style={{ backgroundColor: `${palette.text}0d` }}>
      <div className={`container mx-auto px-4 py-10 grid gap-8 ${footerPages.length > 0 ? "md:grid-cols-5" : "md:grid-cols-4"}`}>
        <div>
          <div className="flex items-center gap-2.5 mb-3">
            {logoUrl ? (
              <img src={logoUrl} alt={`Logo ${name}`} className="w-10 h-10 rounded-xl object-cover" />
            ) : (
              <span className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${palette.primary}1a` }}>
                <Store className="w-5 h-5" style={{ color: palette.primary }} />
              </span>
            )}
            <span className="text-lg font-extrabold">{name}</span>
          </div>
          {about && (
            <p className="text-xs leading-relaxed" style={{ color: `${palette.text}99` }}>
              {about}
            </p>
          )}
          {socials.length > 0 && (
            <div className="flex gap-3 mt-4" style={{ color: `${palette.text}80` }}>
              {socials.map(({ url, Icon, label }) => (
                <a key={label} href={url} target="_blank" rel="noopener noreferrer" aria-label={label}>
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          )}
        </div>

        <div>
          <h3 className="text-sm font-bold mb-3">{config.categoriesTitle}</h3>
          <ul className="space-y-2 text-xs" style={{ color: `${palette.text}99` }}>
            {categories.slice(0, 6).map((c) => (
              <li key={c.id}>
                <button onClick={() => onSelect(c.id)} className="hover:underline">{c.name}</button>
              </li>
            ))}
            {categories.length === 0 && <li>Em breve</li>}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-bold mb-3">{config.helpTitle}</h3>
          <ul className="space-y-2 text-xs" style={{ color: `${palette.text}99` }}>
            {config.helpItems.filter(Boolean).map((h, i) => (
              <li key={i}>{h}</li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-bold mb-3">{config.contactTitle}</h3>
          {config.contactText && (
            <p className="text-xs mb-3" style={{ color: `${palette.text}99` }}>
              {config.contactText}
            </p>
          )}
          {onWhatsApp && (
            <button
              onClick={onWhatsApp}
              className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold text-white"
              style={{ backgroundColor: palette.primary }}
            >
              <MessageCircle className="w-4 h-4" />
              {config.contactCta}
            </button>
          )}
        </div>
      </div>

      <div className="border-t" style={{ borderColor: `${palette.text}14` }}>
        <div className="container mx-auto px-4 py-4 text-[11px] flex flex-col sm:flex-row items-center justify-between gap-2" style={{ color: `${palette.text}80` }}>
          <span>
            {config.copyright || `© ${new Date().getFullYear()} ${name}. Todos os direitos reservados.`}
          </span>
          {config.showCredits && (
            <span>
              Catálogo criado com{" "}
              <a href="/" target="_blank" rel="noopener noreferrer" className="font-semibold hover:underline" style={{ color: palette.primary }}>
                Out App
              </a>
            </span>
          )}
        </div>
      </div>
    </footer>
  );
};
