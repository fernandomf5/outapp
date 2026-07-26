import {
  Type,
  AlignLeft,
  Mail,
  Phone,
  MessageCircle,
  MapPin,
  Map,
  Calendar,
  Building2,
  Briefcase,
  List,
  CheckSquare,
  Upload,
  Hash,
  type LucideIcon,
} from "lucide-react";

/* ---------------------------------- Fields --------------------------------- */

export type CaptureFieldType =
  | "name"
  | "email"
  | "phone"
  | "whatsapp"
  | "city"
  | "state"
  | "birthdate"
  | "company"
  | "role"
  | "text"
  | "textarea"
  | "number"
  | "select"
  | "checkbox"
  | "file";

export interface CaptureField {
  id: string;
  type: CaptureFieldType;
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
  helpText?: string;
  width?: "full" | "half";
}

export interface CaptureFieldDef {
  type: CaptureFieldType;
  label: string;
  icon: LucideIcon;
  defaultLabel: string;
  defaultPlaceholder?: string;
  hasOptions?: boolean;
}

export const FIELD_TYPES: CaptureFieldDef[] = [
  { type: "name", label: "Nome", icon: Type, defaultLabel: "Nome", defaultPlaceholder: "Seu nome completo" },
  { type: "email", label: "E-mail", icon: Mail, defaultLabel: "E-mail", defaultPlaceholder: "seu@email.com" },
  { type: "phone", label: "Telefone", icon: Phone, defaultLabel: "Telefone", defaultPlaceholder: "(00) 0000-0000" },
  { type: "whatsapp", label: "WhatsApp", icon: MessageCircle, defaultLabel: "WhatsApp", defaultPlaceholder: "(00) 90000-0000" },
  { type: "city", label: "Cidade", icon: MapPin, defaultLabel: "Cidade", defaultPlaceholder: "Sua cidade" },
  { type: "state", label: "Estado", icon: Map, defaultLabel: "Estado", defaultPlaceholder: "UF" },
  { type: "birthdate", label: "Nascimento", icon: Calendar, defaultLabel: "Data de nascimento" },
  { type: "company", label: "Empresa", icon: Building2, defaultLabel: "Empresa", defaultPlaceholder: "Nome da empresa" },
  { type: "role", label: "Cargo", icon: Briefcase, defaultLabel: "Cargo", defaultPlaceholder: "Seu cargo" },
  { type: "text", label: "Texto curto", icon: Type, defaultLabel: "Campo personalizado", defaultPlaceholder: "Digite aqui" },
  { type: "textarea", label: "Texto livre", icon: AlignLeft, defaultLabel: "Mensagem", defaultPlaceholder: "Escreva sua mensagem" },
  { type: "number", label: "Número", icon: Hash, defaultLabel: "Número" },
  { type: "select", label: "Seleção", icon: List, defaultLabel: "Escolha uma opção", hasOptions: true },
  { type: "checkbox", label: "Checkbox", icon: CheckSquare, defaultLabel: "Concordo com os termos" },
  { type: "file", label: "Upload de arquivo", icon: Upload, defaultLabel: "Envie um arquivo" },
];

export const getFieldDef = (type: CaptureFieldType) =>
  FIELD_TYPES.find((f) => f.type === type) || FIELD_TYPES[0];

/* ---------------------------------- Blocks --------------------------------- */

export type CaptureBlockType =
  | "hero"
  | "text"
  | "image"
  | "video"
  | "button"
  | "form"
  | "benefits"
  | "testimonials"
  | "faq"
  | "counter"
  | "cards"
  | "gallery"
  | "social"
  | "divider"
  | "footer";

export interface CaptureBlock {
  id: string;
  type: CaptureBlockType;
  visible: boolean;
  props: Record<string, any>;
}

export interface CaptureBlockDef {
  type: CaptureBlockType;
  label: string;
  description: string;
  defaults: Record<string, any>;
}

export const BLOCK_TYPES: CaptureBlockDef[] = [
  {
    type: "hero",
    label: "Destaque (Hero)",
    description: "Título, subtítulo e chamada principal",
    defaults: {
      eyebrow: "Oferta especial",
      title: "Transforme seu negócio hoje mesmo",
      subtitle: "Preencha o formulário e receba agora o seu acesso.",
      imageUrl: "",
      align: "center",
    },
  },
  { type: "text", label: "Texto", description: "Parágrafo simples", defaults: { title: "", text: "Escreva aqui o seu texto.", align: "left" } },
  { type: "image", label: "Imagem", description: "Imagem única", defaults: { imageUrl: "", alt: "Imagem", rounded: true } },
  { type: "video", label: "Vídeo", description: "YouTube, Vimeo ou link direto", defaults: { url: "", title: "" } },
  { type: "button", label: "Botão", description: "Botão de ação ou link", defaults: { text: "Quero participar", url: "#formulario", align: "center" } },
  { type: "form", label: "Formulário", description: "Formulário de captura de leads", defaults: { title: "Preencha seus dados", subtitle: "É rápido e gratuito.", buttonText: "Enviar" } },
  {
    type: "benefits",
    label: "Benefícios",
    description: "Lista de vantagens com ícones",
    defaults: {
      title: "O que você recebe",
      items: [
        { title: "Acesso imediato", text: "Receba tudo no seu e-mail em segundos." },
        { title: "Suporte dedicado", text: "Nossa equipe acompanha você de perto." },
        { title: "Resultados reais", text: "Método validado por centenas de clientes." },
      ],
    },
  },
  {
    type: "testimonials",
    label: "Depoimentos",
    description: "Provas sociais de clientes",
    defaults: {
      title: "O que dizem nossos clientes",
      items: [
        { name: "Ana Souza", role: "Empreendedora", text: "Resultado incrível em poucas semanas!", avatarUrl: "" },
      ],
    },
  },
  {
    type: "faq",
    label: "Perguntas frequentes",
    description: "Dúvidas e respostas",
    defaults: {
      title: "Perguntas frequentes",
      items: [{ question: "Como funciona?", answer: "É simples: preencha o formulário e receba o acesso." }],
    },
  },
  {
    type: "counter",
    label: "Contadores",
    description: "Números de destaque",
    defaults: {
      title: "",
      items: [
        { value: "+1.200", label: "Clientes atendidos" },
        { value: "98%", label: "Satisfação" },
      ],
    },
  },
  {
    type: "cards",
    label: "Cards",
    description: "Blocos de destaque",
    defaults: {
      title: "Nossos diferenciais",
      items: [{ title: "Card 1", text: "Descrição do card", imageUrl: "" }],
    },
  },
  { type: "gallery", label: "Galeria", description: "Grade de imagens", defaults: { title: "Galeria", images: [] } },
  {
    type: "social",
    label: "Redes sociais",
    description: "Links das suas redes",
    defaults: { title: "Siga nas redes", instagram: "", facebook: "", youtube: "", linkedin: "", tiktok: "", whatsapp: "" },
  },
  { type: "divider", label: "Divisor", description: "Espaço ou linha separadora", defaults: { line: true } },
  { type: "footer", label: "Rodapé", description: "Informações finais", defaults: { text: "© 2026 Sua Empresa. Todos os direitos reservados.", links: [] } },
];

export const getBlockDef = (type: CaptureBlockType) =>
  BLOCK_TYPES.find((b) => b.type === type) || BLOCK_TYPES[0];

/* ---------------------------------- Theme ---------------------------------- */

export interface CaptureTheme {
  background: string;
  backgroundImage: string;
  backgroundOverlay: number;
  surface: string;
  textColor: string;
  mutedTextColor: string;
  primary: string;
  primaryText: string;
  fontFamily: string;
  baseFontSize: number;
  headingScale: number;
  sectionSpacing: number;
  contentWidth: number;
  radius: number;
  borderColor: string;
  buttonStyle: "solid" | "outline" | "soft";
  buttonRadius: number;
  animation: "none" | "fade" | "slide-up" | "zoom";
}

export const DEFAULT_THEME: CaptureTheme = {
  background: "#0b1020",
  backgroundImage: "",
  backgroundOverlay: 55,
  surface: "#151b31",
  textColor: "#f8fafc",
  mutedTextColor: "#a8b0c4",
  primary: "#22c55e",
  primaryText: "#052e13",
  fontFamily: "Inter, system-ui, sans-serif",
  baseFontSize: 16,
  headingScale: 1,
  sectionSpacing: 56,
  contentWidth: 900,
  radius: 16,
  borderColor: "rgba(255,255,255,0.10)",
  buttonStyle: "solid",
  buttonRadius: 12,
  animation: "fade",
};

export const FONT_OPTIONS = [
  { label: "Inter (padrão)", value: "Inter, system-ui, sans-serif" },
  { label: "Poppins", value: "Poppins, system-ui, sans-serif" },
  { label: "Montserrat", value: "Montserrat, system-ui, sans-serif" },
  { label: "Georgia (serifada)", value: "Georgia, 'Times New Roman', serif" },
  { label: "Roboto Mono", value: "'Roboto Mono', ui-monospace, monospace" },
];

export const THEME_PRESETS: { name: string; theme: Partial<CaptureTheme> }[] = [
  { name: "Escuro Neon", theme: { background: "#0b1020", surface: "#151b31", textColor: "#f8fafc", mutedTextColor: "#a8b0c4", primary: "#22c55e", primaryText: "#052e13" } },
  { name: "Claro Minimal", theme: { background: "#f6f7fb", surface: "#ffffff", textColor: "#111827", mutedTextColor: "#6b7280", primary: "#2563eb", primaryText: "#ffffff", borderColor: "rgba(0,0,0,0.08)" } },
  { name: "Roxo Premium", theme: { background: "#140b25", surface: "#20123a", textColor: "#f5f3ff", mutedTextColor: "#c4b5fd", primary: "#a855f7", primaryText: "#ffffff" } },
  { name: "Laranja Vendas", theme: { background: "#1b1206", surface: "#2a1c0b", textColor: "#fff7ed", mutedTextColor: "#fdba74", primary: "#f97316", primaryText: "#1b1206" } },
];

/* --------------------------------- Settings -------------------------------- */

export interface CaptureSettings {
  successMessage: string;
  redirectUrl: string;
  buttonText: string;
  seoTitle: string;
  seoDescription: string;
  whatsappRedirect: string;
}

export const DEFAULT_SETTINGS: CaptureSettings = {
  successMessage: "Recebemos seus dados! Em breve entraremos em contato.",
  redirectUrl: "",
  buttonText: "Quero receber",
  seoTitle: "",
  seoDescription: "",
  whatsappRedirect: "",
};

export interface CapturePageRecord {
  id: string;
  user_id: string;
  title: string;
  internal_note: string | null;
  slug: string;
  is_published: boolean;
  blocks: CaptureBlock[];
  theme: CaptureTheme;
  form_fields: CaptureField[];
  settings: CaptureSettings;
  views: number;
  conversions: number;
  created_at: string;
  updated_at: string;
}

export const uid = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export const makeField = (type: CaptureFieldType): CaptureField => {
  const def = getFieldDef(type);
  return {
    id: uid(),
    type,
    label: def.defaultLabel,
    placeholder: def.defaultPlaceholder,
    required: type === "name" || type === "email",
    options: def.hasOptions ? ["Opção 1", "Opção 2"] : undefined,
    width: "full",
  };
};

export const makeBlock = (type: CaptureBlockType): CaptureBlock => ({
  id: uid(),
  type,
  visible: true,
  props: JSON.parse(JSON.stringify(getBlockDef(type).defaults)),
});

export const DEFAULT_FIELDS = (): CaptureField[] => [makeField("name"), makeField("email"), makeField("whatsapp")];

export const DEFAULT_BLOCKS = (): CaptureBlock[] => [makeBlock("hero"), makeBlock("benefits"), makeBlock("form"), makeBlock("footer")];

export const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

export const embedUrl = (url: string) => {
  if (!url) return "";
  const yt = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{6,})/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  const vimeo = url.match(/vimeo\.com\/(\d+)/);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;
  return url;
};
