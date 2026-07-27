export interface CatalogBenefit {
  title: string;
  sub: string;
}

export interface CatalogLayoutSettings {
  topbar: {
    enabled: boolean;
    item1: string;
    item2: string;
    item3: string;
  };
  header: {
    showSearch: boolean;
    searchPlaceholder: string;
    showCta: boolean;
    ctaLabel: string;
  };
  hero: {
    enabled: boolean;
    badge: string;
    title: string;
    subtitle: string;
    ctaLabel: string;
  };
  categories: {
    showStrip: boolean;
    title: string;
    showHomeInNav: boolean;
    homeLabel: string;
  };
  benefits: {
    enabled: boolean;
    items: CatalogBenefit[];
  };
  footer: {
    enabled: boolean;
    about: string;
    categoriesTitle: string;
    helpTitle: string;
    helpItems: string[];
    contactTitle: string;
    contactText: string;
    contactCta: string;
    copyright: string;
    showCredits: boolean;
    instagram: string;
    facebook: string;
    youtube: string;
  };
}

export const defaultCatalogLayout: CatalogLayoutSettings = {
  topbar: {
    enabled: true,
    item1: "Entrega rápida para todo o Brasil",
    item2: "Compra 100% segura",
    item3: "Atendimento via WhatsApp",
  },
  header: {
    showSearch: true,
    searchPlaceholder: "O que você está buscando?",
    showCta: true,
    ctaLabel: "Falar agora",
  },
  hero: {
    enabled: true,
    badge: "Catálogo online",
    title: "",
    subtitle: "",
    ctaLabel: "Falar no WhatsApp",
  },
  categories: {
    showStrip: true,
    title: "Categorias",
    showHomeInNav: true,
    homeLabel: "Início",
  },
  benefits: {
    enabled: true,
    items: [
      { title: "Entrega rápida", sub: "Envio para todo o Brasil" },
      { title: "Troca fácil", sub: "Atendimento sem burocracia" },
      { title: "Compra segura", sub: "Ambiente 100% protegido" },
      { title: "Atendimento", sub: "Suporte rápido e humano" },
    ],
  },
  footer: {
    enabled: true,
    about: "",
    categoriesTitle: "Categorias",
    helpTitle: "Ajuda",
    helpItems: ["Como comprar", "Formas de pagamento", "Prazo de entrega", "Trocas e devoluções"],
    contactTitle: "Atendimento",
    contactText: "Fale com a gente e tire suas dúvidas sobre qualquer item do catálogo.",
    contactCta: "Chamar no WhatsApp",
    copyright: "",
    showCredits: true,
    instagram: "",
    facebook: "",
    youtube: "",
  },
};

export const mergeCatalogLayout = (raw: any): CatalogLayoutSettings => {
  const s = raw && typeof raw === "object" ? raw : {};
  const d = defaultCatalogLayout;
  return {
    topbar: { ...d.topbar, ...(s.topbar || {}) },
    header: { ...d.header, ...(s.header || {}) },
    hero: { ...d.hero, ...(s.hero || {}) },
    categories: { ...d.categories, ...(s.categories || {}) },
    benefits: {
      enabled: s.benefits?.enabled ?? d.benefits.enabled,
      items:
        Array.isArray(s.benefits?.items) && s.benefits.items.length === 4
          ? s.benefits.items.map((b: any, i: number) => ({
              title: b?.title ?? d.benefits.items[i].title,
              sub: b?.sub ?? d.benefits.items[i].sub,
            }))
          : d.benefits.items,
    },
    footer: {
      ...d.footer,
      ...(s.footer || {}),
      helpItems: Array.isArray(s.footer?.helpItems) ? s.footer.helpItems : d.footer.helpItems,
    },
  };
};
