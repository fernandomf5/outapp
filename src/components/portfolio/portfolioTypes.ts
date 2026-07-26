import { Camera, Code2, Film, Palette, Share2, Megaphone, Building2, HardHat, Briefcase, Brush, FolderKanban, Building, Wrench, UserRound, Sparkles, type LucideIcon } from "lucide-react";
import { CaptureField, CaptureTheme, DEFAULT_THEME, makeField, uid } from "@/components/capture/captureTypes";
import { DEFAULT_EMBEDS, PageEmbedSettings } from "@/components/embeds/pageEmbedTypes";

export type PortfolioField = CaptureField;

/* -------------------------------- Categorias ------------------------------- */

export interface PortfolioCategoryDef {
  key: string;
  label: string;
  icon: LucideIcon;
  description: string;
  /** Campos sugeridos para cada projeto */
  fields: { type: CaptureField["type"]; label: string; required?: boolean }[];
  headline: string;
  subheadline: string;
  layout: PortfolioLayout;
}

export const PORTFOLIO_CATEGORIES: PortfolioCategoryDef[] = [
  {
    key: "developer",
    label: "Desenvolvedor",
    icon: Code2,
    description: "Projetos, tecnologias, repositórios e demos",
    headline: "Desenvolvedor de software",
    subheadline: "Projetos, tecnologias e soluções que eu construí.",
    layout: "grid",
    fields: [
      { type: "text", label: "Tecnologias utilizadas" },
      { type: "text", label: "Link do projeto" },
      { type: "text", label: "Link do GitHub" },
    ],
  },
  {
    key: "designer",
    label: "Designer",
    icon: Palette,
    description: "Peças visuais, clientes e categorias",
    headline: "Designer criativo",
    subheadline: "Identidade visual, peças e projetos sob medida.",
    layout: "masonry",
    fields: [
      { type: "text", label: "Categoria do projeto" },
      { type: "text", label: "Ferramentas" },
      { type: "text", label: "Link do projeto" },
    ],
  },
  {
    key: "photographer",
    label: "Fotógrafo",
    icon: Camera,
    description: "Ensaios, galerias e locais",
    headline: "Fotografia profissional",
    subheadline: "Ensaios, eventos e histórias registradas em imagens.",
    layout: "masonry",
    fields: [
      { type: "text", label: "Tipo de ensaio" },
      { type: "text", label: "Local" },
      { type: "text", label: "Equipamento" },
    ],
  },
  {
    key: "videomaker",
    label: "Videomaker",
    icon: Film,
    description: "Vídeos, clientes e categorias",
    headline: "Produção audiovisual",
    subheadline: "Vídeos que contam histórias e vendem ideias.",
    layout: "list",
    fields: [
      { type: "text", label: "Categoria" },
      { type: "text", label: "Duração" },
      { type: "text", label: "Link externo" },
    ],
  },
  {
    key: "social-media",
    label: "Social Media",
    icon: Share2,
    description: "Campanhas, feeds e resultados",
    headline: "Social Media",
    subheadline: "Conteúdo, criativos e resultados nas redes sociais.",
    layout: "grid",
    fields: [
      { type: "text", label: "Rede social" },
      { type: "text", label: "Resultado alcançado" },
      { type: "text", label: "Período" },
    ],
  },
  {
    key: "marketing",
    label: "Marketing",
    icon: Megaphone,
    description: "Campanhas, métricas e cases",
    headline: "Marketing e performance",
    subheadline: "Campanhas com estratégia, criatividade e resultado.",
    layout: "grid",
    fields: [
      { type: "text", label: "Objetivo da campanha" },
      { type: "text", label: "Investimento" },
      { type: "text", label: "Resultado" },
    ],
  },
  {
    key: "architecture",
    label: "Arquitetura",
    icon: Building2,
    description: "Projetos, plantas e obras",
    headline: "Arquitetura e interiores",
    subheadline: "Projetos que unem estética, função e conforto.",
    layout: "masonry",
    fields: [
      { type: "text", label: "Tipo de projeto" },
      { type: "text", label: "Área (m²)" },
      { type: "text", label: "Local" },
    ],
  },
  {
    key: "engineering",
    label: "Engenharia",
    icon: HardHat,
    description: "Obras, laudos e execuções",
    headline: "Engenharia",
    subheadline: "Obras e projetos executados com segurança e técnica.",
    layout: "list",
    fields: [
      { type: "text", label: "Tipo de obra" },
      { type: "text", label: "Prazo de execução" },
      { type: "text", label: "Local" },
    ],
  },
  {
    key: "freelancer",
    label: "Freelancer",
    icon: Briefcase,
    description: "Trabalhos avulsos e clientes",
    headline: "Freelancer multidisciplinar",
    subheadline: "Trabalhos entregues com qualidade e no prazo.",
    layout: "grid",
    fields: [
      { type: "text", label: "Serviço prestado" },
      { type: "text", label: "Prazo de entrega" },
      { type: "text", label: "Link do trabalho" },
    ],
  },
  {
    key: "artist",
    label: "Artista",
    icon: Brush,
    description: "Obras, coleções e exposições",
    headline: "Portfólio artístico",
    subheadline: "Obras, coleções e processos criativos.",
    layout: "masonry",
    fields: [
      { type: "text", label: "Técnica" },
      { type: "text", label: "Dimensões" },
      { type: "text", label: "Ano" },
    ],
  },
  {
    key: "projects",
    label: "Projetos",
    icon: FolderKanban,
    description: "Cases e entregas em geral",
    headline: "Meus projetos",
    subheadline: "Uma seleção de entregas e resultados.",
    layout: "grid",
    fields: [
      { type: "text", label: "Status" },
      { type: "text", label: "Responsável" },
      { type: "text", label: "Link" },
    ],
  },
  {
    key: "company",
    label: "Empresa",
    icon: Building,
    description: "Cases, clientes e soluções",
    headline: "Nossa empresa",
    subheadline: "Cases de sucesso e soluções entregues aos nossos clientes.",
    layout: "grid",
    fields: [
      { type: "text", label: "Segmento do cliente" },
      { type: "text", label: "Solução entregue" },
      { type: "text", label: "Resultado" },
    ],
  },
  {
    key: "services",
    label: "Serviços",
    icon: Wrench,
    description: "Serviços prestados e valores",
    headline: "Serviços",
    subheadline: "Conheça os serviços que ofereço.",
    layout: "list",
    fields: [
      { type: "text", label: "Valor / a partir de" },
      { type: "text", label: "Prazo" },
      { type: "textarea", label: "O que está incluso" },
    ],
  },
  {
    key: "professional",
    label: "Profissional",
    icon: UserRound,
    description: "Currículo, experiências e conquistas",
    headline: "Portfólio profissional",
    subheadline: "Experiências, competências e conquistas.",
    layout: "list",
    fields: [
      { type: "text", label: "Empresa / Instituição" },
      { type: "text", label: "Período" },
      { type: "textarea", label: "Principais entregas" },
    ],
  },
  {
    key: "custom",
    label: "Criar do zero",
    icon: Sparkles,
    description: "Comece em branco e monte do seu jeito",
    headline: "Meu portfólio",
    subheadline: "Conheça meus trabalhos.",
    layout: "grid",
    fields: [],
  },
];

export const getCategoryDef = (key: string) =>
  PORTFOLIO_CATEGORIES.find((c) => c.key === key) || PORTFOLIO_CATEGORIES[PORTFOLIO_CATEGORIES.length - 1];

/* --------------------------------- Layouts --------------------------------- */

export type PortfolioLayout = "grid" | "masonry" | "list" | "carousel";

export const LAYOUT_OPTIONS: { value: PortfolioLayout; label: string; description: string }[] = [
  { value: "grid", label: "Grade", description: "Cards em colunas iguais" },
  { value: "masonry", label: "Mosaico", description: "Alturas variadas, ideal para fotos" },
  { value: "list", label: "Lista", description: "Um projeto por linha, com mais texto" },
  { value: "carousel", label: "Carrossel", description: "Rolagem horizontal" },
];

/* --------------------------------- Seções ---------------------------------- */

export type PortfolioSectionType =
  | "hero"
  | "about"
  | "projects"
  | "services"
  | "testimonials"
  | "gallery"
  | "video"
  | "contact"
  | "footer";

export interface PortfolioSection {
  id: string;
  type: PortfolioSectionType;
  visible: boolean;
  props: Record<string, any>;
}

export interface PortfolioSectionDef {
  type: PortfolioSectionType;
  label: string;
  description: string;
  unique?: boolean;
  defaults: Record<string, any>;
}

export const SECTION_TYPES: PortfolioSectionDef[] = [
  {
    type: "hero",
    label: "Capa / Apresentação",
    description: "Foto, nome, profissão e botões",
    unique: true,
    defaults: {
      eyebrow: "",
      title: "Seu Nome",
      subtitle: "Sua profissão em uma frase.",
      avatar: "",
      backgroundImage: "",
      primaryLabel: "Fale comigo",
      primaryUrl: "#contato",
      secondaryLabel: "Ver projetos",
      secondaryUrl: "#projetos",
      align: "center",
    },
  },
  {
    type: "about",
    label: "Sobre",
    description: "Texto de apresentação e destaques",
    defaults: {
      title: "Sobre mim",
      text: "Conte aqui sua história, sua experiência e o que você faz de melhor.",
      image: "",
      highlights: [
        { label: "Anos de experiência", value: "5+" },
        { label: "Projetos entregues", value: "120" },
        { label: "Clientes atendidos", value: "60" },
      ],
    },
  },
  {
    type: "projects",
    label: "Projetos",
    description: "Lista dos projetos cadastrados",
    unique: true,
    defaults: {
      title: "Projetos",
      subtitle: "Alguns dos trabalhos que já realizei.",
      showFilters: true,
      showFeaturedFirst: true,
    },
  },
  {
    type: "services",
    label: "Serviços",
    description: "O que você oferece",
    defaults: {
      title: "Serviços",
      items: [
        { title: "Serviço 1", description: "Descreva o serviço oferecido.", price: "" },
        { title: "Serviço 2", description: "Descreva o serviço oferecido.", price: "" },
      ],
    },
  },
  {
    type: "testimonials",
    label: "Depoimentos",
    description: "Opiniões de clientes",
    defaults: {
      title: "O que dizem sobre mim",
      items: [
        { name: "Cliente satisfeito", role: "Empresa", text: "Trabalho impecável e entrega no prazo.", avatar: "" },
      ],
    },
  },
  {
    type: "gallery",
    label: "Galeria",
    description: "Grade livre de imagens",
    defaults: { title: "Galeria", images: [] as string[], columns: 3 },
  },
  {
    type: "video",
    label: "Vídeo",
    description: "Vídeo de apresentação (YouTube/Vimeo)",
    defaults: { title: "Apresentação", url: "", description: "" },
  },
  {
    type: "contact",
    label: "Contato",
    description: "Formulário, WhatsApp e redes sociais",
    unique: true,
    defaults: {
      title: "Vamos conversar",
      subtitle: "Preencha o formulário ou fale comigo pelas redes.",
      showForm: true,
      successMessage: "Mensagem enviada! Em breve entro em contato.",
      buttonText: "Enviar mensagem",
    },
  },
  {
    type: "footer",
    label: "Rodapé",
    description: "Assinatura e links finais",
    unique: true,
    defaults: { text: "© Todos os direitos reservados.", showSocial: true },
  },
];

export const getSectionDef = (type: PortfolioSectionType) =>
  SECTION_TYPES.find((s) => s.type === type) || SECTION_TYPES[0];

export const makeSection = (type: PortfolioSectionType): PortfolioSection => ({
  id: uid(),
  type,
  visible: true,
  props: JSON.parse(JSON.stringify(getSectionDef(type).defaults)),
});

/* --------------------------------- Contato --------------------------------- */

export interface PortfolioContact {
  email: string;
  phone: string;
  whatsapp: string;
  address: string;
  instagram: string;
  linkedin: string;
  facebook: string;
  youtube: string;
  tiktok: string;
  behance: string;
  github: string;
  website: string;
}

export const DEFAULT_CONTACT: PortfolioContact = {
  email: "",
  phone: "",
  whatsapp: "",
  address: "",
  instagram: "",
  linkedin: "",
  facebook: "",
  youtube: "",
  tiktok: "",
  behance: "",
  github: "",
  website: "",
};

export const SOCIAL_FIELDS: { key: keyof PortfolioContact; label: string; placeholder: string }[] = [
  { key: "whatsapp", label: "WhatsApp", placeholder: "5511999999999" },
  { key: "email", label: "E-mail", placeholder: "contato@seudominio.com" },
  { key: "phone", label: "Telefone", placeholder: "(11) 3333-3333" },
  { key: "address", label: "Endereço", placeholder: "Cidade - UF" },
  { key: "instagram", label: "Instagram", placeholder: "https://instagram.com/seuperfil" },
  { key: "linkedin", label: "LinkedIn", placeholder: "https://linkedin.com/in/seuperfil" },
  { key: "facebook", label: "Facebook", placeholder: "https://facebook.com/suapagina" },
  { key: "youtube", label: "YouTube", placeholder: "https://youtube.com/@seucanal" },
  { key: "tiktok", label: "TikTok", placeholder: "https://tiktok.com/@seuperfil" },
  { key: "behance", label: "Behance", placeholder: "https://behance.net/seuperfil" },
  { key: "github", label: "GitHub", placeholder: "https://github.com/seuusuario" },
  { key: "website", label: "Site", placeholder: "https://seusite.com" },
];

/* -------------------------------- Templates -------------------------------- */

export interface PortfolioTemplateDef {
  key: string;
  label: string;
  description: string;
  theme: Partial<CaptureTheme>;
  layout: PortfolioLayout;
}

export const PORTFOLIO_TEMPLATES: PortfolioTemplateDef[] = [
  {
    key: "midnight",
    label: "Midnight",
    description: "Escuro elegante com destaque em azul",
    layout: "grid",
    theme: { background: "#070b16", surface: "#111827", textColor: "#f8fafc", mutedTextColor: "#94a3b8", primary: "#3b82f6", primaryText: "#ffffff", radius: 18 },
  },
  {
    key: "studio",
    label: "Studio",
    description: "Claro e minimalista, foco nas imagens",
    layout: "masonry",
    theme: { background: "#f7f7f5", surface: "#ffffff", textColor: "#111111", mutedTextColor: "#6b7280", primary: "#111111", primaryText: "#ffffff", borderColor: "rgba(0,0,0,0.08)", radius: 6 },
  },
  {
    key: "neon",
    label: "Neon",
    description: "Escuro com verde vibrante",
    layout: "grid",
    theme: { background: "#0b1020", surface: "#151b31", textColor: "#f8fafc", mutedTextColor: "#a8b0c4", primary: "#22c55e", primaryText: "#052e13", radius: 16 },
  },
  {
    key: "sunset",
    label: "Sunset",
    description: "Quente, criativo e chamativo",
    layout: "masonry",
    theme: { background: "#1b1206", surface: "#2a1c0b", textColor: "#fff7ed", mutedTextColor: "#fdba74", primary: "#f97316", primaryText: "#1b1206", radius: 20 },
  },
  {
    key: "royal",
    label: "Royal",
    description: "Roxo premium para marcas pessoais",
    layout: "grid",
    theme: { background: "#140b25", surface: "#20123a", textColor: "#f5f3ff", mutedTextColor: "#c4b5fd", primary: "#a855f7", primaryText: "#ffffff", radius: 22 },
  },
  {
    key: "paper",
    label: "Paper",
    description: "Serifado e editorial",
    layout: "list",
    theme: { background: "#fbf9f4", surface: "#ffffff", textColor: "#1f2937", mutedTextColor: "#6b7280", primary: "#b45309", primaryText: "#ffffff", fontFamily: "Georgia, 'Times New Roman', serif", borderColor: "rgba(0,0,0,0.1)", radius: 4 },
  },
];

/* --------------------------------- Registros -------------------------------- */

export interface PortfolioRecord {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  slug: string | null;
  niche: string;
  category: string;
  template: string;
  layout: PortfolioLayout;
  is_public: boolean | null;
  is_active: boolean | null;
  logo_url: string | null;
  cover_url: string | null;
  views: number;
  theme: CaptureTheme;
  sections: PortfolioSection[];
  custom_fields: PortfolioField[];
  contact: PortfolioContact;
  settings: PageEmbedSettings;
  created_at: string;
  updated_at: string;
}

export interface PortfolioItemRecord {
  id: string;
  portfolio_id: string;
  title: string;
  category: string;
  description: string | null;
  client_name: string | null;
  image_url: string | null;
  images: string[] | null;
  video_url: string | null;
  project_url: string | null;
  project_date: string | null;
  tags: string[];
  links: { label: string; url: string }[];
  files: { name: string; url: string }[];
  custom_data: Record<string, any>;
  is_featured: boolean | null;
  is_published: boolean;
  display_order: number | null;
}

export const DEFAULT_PORTFOLIO_SETTINGS = (): PageEmbedSettings => ({ ...DEFAULT_EMBEDS });

export const DEFAULT_PORTFOLIO_THEME = (): CaptureTheme => ({
  ...DEFAULT_THEME,
  contentWidth: 1100,
  animation: "slide-up",
});

export const DEFAULT_SECTIONS = (): PortfolioSection[] => [
  makeSection("hero"),
  makeSection("about"),
  makeSection("projects"),
  makeSection("contact"),
  makeSection("footer"),
];

export const fieldsFromCategory = (key: string): PortfolioField[] =>
  getCategoryDef(key).fields.map((f) => {
    const field = makeField(f.type);
    field.label = f.label;
    field.required = !!f.required;
    field.placeholder = "";
    return field;
  });
