import { SITE_TYPES, NicheGroup } from "@/data/siteNiches";
import { SiteBlock, createBlock, SiteTheme, DEFAULT_THEME } from "./siteTypes";

interface BuildArgs {
  siteType: string;
  niche?: string;
  group?: NicheGroup;
  brand: string;
  whatsapp?: string;
}

export function buildTheme(group?: NicheGroup): SiteTheme {
  return group ? { ...DEFAULT_THEME, ...group.theme } : { ...DEFAULT_THEME };
}

export function buildTemplate({ siteType, niche, brand, whatsapp }: BuildArgs): SiteBlock[] {
  const def = SITE_TYPES.find((s) => s.id === siteType) || SITE_TYPES[0];
  const n = niche || "seu negócio";
  const waHref = whatsapp ? `https://wa.me/${whatsapp.replace(/\D/g, "")}` : "#contato";

  const copy: Record<string, Record<string, any>> = {
    header: { brand, ctaHref: waHref },
    hero: {
      badge: niche || "",
      title:
        siteType === "captura"
          ? `Receba um atendimento de ${n} sob medida`
          : siteType === "portfolio"
          ? `${brand} — projetos que falam por si`
          : siteType === "catalogo"
          ? `Conheça os produtos da ${brand}`
          : `${brand}: excelência em ${n}`,
      subtitle:
        siteType === "captura"
          ? "Preencha seus dados e fale agora com um especialista. Atendimento rápido e sem compromisso."
          : `Somos referência em ${n.toLowerCase()}. Atendimento humano, resultado de verdade e a confiança de quem já é nosso cliente.`,
      ctaLabel: siteType === "captura" ? "Quero meu atendimento" : "Fale conosco",
      ctaHref: siteType === "captura" ? "#contato" : waHref,
      secondaryLabel: siteType === "captura" ? "" : "Ver mais",
      secondaryHref: "#servicos",
    },
    about: {
      title: `Sobre a ${brand}`,
      text: `A ${brand} atua no segmento de ${n.toLowerCase()} com foco total em qualidade e satisfação.\n\nConte aqui a sua história, o tempo de mercado, sua equipe e os diferenciais que fazem seus clientes voltarem sempre.`,
    },
    services: {
      title: siteType === "portfolio" ? "O que eu faço" : "Nossos serviços",
      subtitle: `Soluções completas em ${n.toLowerCase()}.`,
    },
    cta: {
      title: "Vamos conversar?",
      subtitle: `Fale agora com a equipe da ${brand} e receba um atendimento personalizado.`,
      ctaLabel: "Chamar no WhatsApp",
      ctaHref: waHref,
    },
    products: { title: "Produtos em destaque", whatsapp: whatsapp || "" },
    gallery: { title: "Trabalhos realizados" },
    links: { title: brand },
    form: { title: "Fale com a gente", subtitle: "Preencha o formulário e retornamos em instantes." },
    footer: { brand, whatsapp: whatsapp || "", text: `${brand} — ${n}. Todos os direitos reservados.` },
  };

  return def.blocks.map((type) => createBlock(type, copy[type] || {}));
}
