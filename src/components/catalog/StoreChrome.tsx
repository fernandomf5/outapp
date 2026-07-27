import { useRef } from "react";
import { Search, ShieldCheck, Truck, Headphones, RefreshCw, Store, Instagram, Facebook, Youtube, MessageCircle } from "lucide-react";

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

export const StoreTopBar = ({ palette, hasWhatsApp }: { palette: Palette; hasWhatsApp: boolean }) => (
  <div className="w-full text-[11px] sm:text-xs" style={{ backgroundColor: `${palette.text}0d`, color: `${palette.text}b3` }}>
    <div className="container mx-auto px-4 py-2 flex items-center justify-center gap-4 sm:gap-10 overflow-x-auto whitespace-nowrap">
      <span className="flex items-center gap-1.5">
        <Truck className="w-3.5 h-3.5" style={{ color: palette.primary }} />
        <strong className="font-semibold">Entrega rápida</strong> para todo o Brasil
      </span>
      <span className="hidden sm:flex items-center gap-1.5">
        <ShieldCheck className="w-3.5 h-3.5" style={{ color: palette.primary }} />
        <strong className="font-semibold">Compra 100% segura</strong>
      </span>
      {hasWhatsApp && (
        <span className="flex items-center gap-1.5">
          <MessageCircle className="w-3.5 h-3.5" style={{ color: palette.primary }} />
          <strong className="font-semibold">Atendimento</strong> via WhatsApp
        </span>
      )}
    </div>
  </div>
);

export const StoreHeader = ({
  palette,
  name,
  description,
  logoUrl,
  search,
  onSearch,
  onWhatsApp,
  right,
}: {
  palette: Palette;
  name: string;
  description?: string | null;
  logoUrl?: string | null;
  search: string;
  onSearch: (v: string) => void;
  onWhatsApp?: () => void;
  right?: React.ReactNode;
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

      <div className="flex-1 hidden md:block">
        <div
          className="flex items-center rounded-full overflow-hidden border"
          style={{ borderColor: `${palette.text}1f`, backgroundColor: `${palette.text}08` }}
        >
          <input
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="O que você está buscando?"
            aria-label="Buscar no catálogo"
            className="flex-1 bg-transparent px-5 py-2.5 text-sm outline-none"
            style={{ color: palette.text }}
          />
          <span className="flex items-center justify-center w-12 h-10 mr-1 rounded-full" style={{ backgroundColor: palette.primary }}>
            <Search className="w-4 h-4 text-white" />
          </span>
        </div>
      </div>

      <div className="ml-auto flex items-center gap-2">
        {onWhatsApp && (
          <button
            onClick={onWhatsApp}
            className="hidden sm:flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-white"
            style={{ backgroundColor: palette.primary }}
          >
            <MessageCircle className="w-4 h-4" />
            Falar agora
          </button>
        )}
        {right}
      </div>
    </div>

    <div className="md:hidden container mx-auto px-4 pb-3">
      <div className="flex items-center rounded-full border px-4" style={{ borderColor: `${palette.text}1f`, backgroundColor: `${palette.text}08` }}>
        <Search className="w-4 h-4" style={{ color: `${palette.text}80` }} />
        <input
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Buscar produtos..."
          aria-label="Buscar no catálogo"
          className="flex-1 bg-transparent px-3 py-2.5 text-sm outline-none"
          style={{ color: palette.text }}
        />
      </div>
    </div>
  </div>
);

export const StoreNav = ({
  palette,
  categories,
  active,
  onSelect,
}: {
  palette: Palette;
  categories: StoreCategory[];
  active: string;
  onSelect: (id: string) => void;
}) => {
  const items = [{ id: "all", name: "Início", color: palette.primary }, ...categories];
  return (
    <nav className="border-b sticky top-0 z-30 backdrop-blur" style={{ borderColor: `${palette.text}14`, backgroundColor: `${palette.background}f2` }}>
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide py-2">
          {items.map((c) => {
            const isActive = active === c.id;
            return (
              <button
                key={c.id}
                onClick={() => onSelect(c.id)}
                className="shrink-0 px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors"
                style={{
                  color: isActive ? palette.primary : `${palette.text}b3`,
                  backgroundColor: isActive ? `${palette.primary}14` : "transparent",
                }}
              >
                {c.name}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export const StoreCategoryStrip = ({
  palette,
  categories,
  onSelect,
}: {
  palette: Palette;
  categories: StoreCategory[];
  onSelect: (id: string) => void;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  if (categories.length === 0) return null;
  return (
    <section className="mb-10">
      <h2 className="text-xl font-bold mb-4">Categorias</h2>
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

export const StoreBenefits = ({ palette }: { palette: Palette }) => (
  <section
    className="rounded-2xl border grid grid-cols-2 lg:grid-cols-4 gap-4 p-5 my-10"
    style={{ borderColor: `${palette.text}14`, backgroundColor: `${palette.text}06` }}
  >
    {[
      { icon: Truck, title: "Entrega rápida", sub: "Envio para todo o Brasil" },
      { icon: RefreshCw, title: "Troca fácil", sub: "Atendimento sem burocracia" },
      { icon: ShieldCheck, title: "Compra segura", sub: "Ambiente 100% protegido" },
      { icon: Headphones, title: "Atendimento", sub: "Suporte rápido e humano" },
    ].map(({ icon: Icon, title, sub }) => (
      <div key={title} className="flex items-center gap-3">
        <span className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${palette.primary}1a` }}>
          <Icon className="w-5 h-5" style={{ color: palette.primary }} />
        </span>
        <span className="leading-tight">
          <span className="block text-sm font-semibold">{title}</span>
          <span className="block text-[11px]" style={{ color: `${palette.text}99` }}>{sub}</span>
        </span>
      </div>
    ))}
  </section>
);

export const StoreFooter = ({
  palette,
  name,
  description,
  logoUrl,
  categories,
  onSelect,
  onWhatsApp,
}: {
  palette: Palette;
  name: string;
  description?: string | null;
  logoUrl?: string | null;
  categories: StoreCategory[];
  onSelect: (id: string) => void;
  onWhatsApp?: () => void;
}) => (
  <footer className="mt-12" style={{ backgroundColor: `${palette.text}0d` }}>
    <div className="container mx-auto px-4 py-10 grid gap-8 md:grid-cols-4">
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
        {description && (
          <p className="text-xs leading-relaxed" style={{ color: `${palette.text}99` }}>
            {description}
          </p>
        )}
        <div className="flex gap-3 mt-4" style={{ color: `${palette.text}80` }}>
          <Instagram className="w-4 h-4" />
          <Facebook className="w-4 h-4" />
          <Youtube className="w-4 h-4" />
        </div>
      </div>

      <div>
        <h3 className="text-sm font-bold mb-3">Categorias</h3>
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
        <h3 className="text-sm font-bold mb-3">Ajuda</h3>
        <ul className="space-y-2 text-xs" style={{ color: `${palette.text}99` }}>
          <li>Como comprar</li>
          <li>Formas de pagamento</li>
          <li>Prazo de entrega</li>
          <li>Trocas e devoluções</li>
        </ul>
      </div>

      <div>
        <h3 className="text-sm font-bold mb-3">Atendimento</h3>
        <p className="text-xs mb-3" style={{ color: `${palette.text}99` }}>
          Fale com a gente e tire suas dúvidas sobre qualquer item do catálogo.
        </p>
        {onWhatsApp && (
          <button
            onClick={onWhatsApp}
            className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold text-white"
            style={{ backgroundColor: palette.primary }}
          >
            <MessageCircle className="w-4 h-4" />
            Chamar no WhatsApp
          </button>
        )}
      </div>
    </div>

    <div className="border-t" style={{ borderColor: `${palette.text}14` }}>
      <div className="container mx-auto px-4 py-4 text-[11px] flex flex-col sm:flex-row items-center justify-between gap-2" style={{ color: `${palette.text}80` }}>
        <span>© {new Date().getFullYear()} {name}. Todos os direitos reservados.</span>
        <span>
          Catálogo criado com{" "}
          <a href="/" target="_blank" rel="noopener noreferrer" className="font-semibold hover:underline" style={{ color: palette.primary }}>
            Out App
          </a>
        </span>
      </div>
    </div>
  </footer>
);
