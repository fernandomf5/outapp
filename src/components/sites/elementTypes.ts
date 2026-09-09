import { FieldDef } from "./siteTypes";

/** Um elemento solto dentro de uma coluna de seção (estilo Elementor). */
export interface SiteElement {
  id: string;
  type: string;
  props: Record<string, any>;
  style?: ElementStyle;
}

export interface ElementStyle {
  align?: "left" | "center" | "right";
  color?: string;
  background?: string;
  fontSize?: number;
  fontWeight?: number;
  lineHeight?: number;
  letterSpacing?: number;
  paddingY?: number;
  paddingX?: number;
  marginTop?: number;
  marginBottom?: number;
  radius?: number;
  maxWidth?: number;
  borderWidth?: number;
  borderColor?: string;
  shadow?: "none" | "sm" | "md" | "lg";
}

export interface SiteColumn {
  id: string;
  width: number; // % da largura da seção
  elements: SiteElement[];
}

export interface ElementDef {
  type: string;
  label: string;
  icon: string;
  category: "Básico" | "Mídia" | "Interação" | "Avançado";
  defaults: Record<string, any>;
  defaultStyle?: ElementStyle;
  fields: FieldDef[];
}

const linkFields: FieldDef[] = [
  { key: "href", label: "Link (URL)", type: "text", placeholder: "https://..." },
  {
    key: "target",
    label: "Abrir em",
    type: "select",
    options: [
      { value: "_self", label: "Mesma aba" },
      { value: "_blank", label: "Nova aba" },
    ],
  },
];

export const ELEMENT_DEFS: ElementDef[] = [
  {
    type: "heading",
    label: "Título",
    icon: "Heading1",
    category: "Básico",
    defaults: { text: "Seu título aqui", tag: "h2" },
    defaultStyle: { align: "left", fontSize: 36, fontWeight: 700 },
    fields: [
      { key: "text", label: "Texto", type: "textarea" },
      {
        key: "tag",
        label: "Nível",
        type: "select",
        options: [
          { value: "h1", label: "H1" },
          { value: "h2", label: "H2" },
          { value: "h3", label: "H3" },
          { value: "h4", label: "H4" },
        ],
      },
    ],
  },
  {
    type: "text",
    label: "Descrição",
    icon: "AlignLeft",
    category: "Básico",
    defaults: { text: "Escreva aqui a descrição do seu conteúdo." },
    defaultStyle: { align: "left", fontSize: 16, lineHeight: 1.7 },
    fields: [{ key: "text", label: "Texto", type: "textarea" }],
  },
  {
    type: "button",
    label: "Botão",
    icon: "MousePointerClick",
    category: "Básico",
    defaults: { label: "Clique aqui", href: "#", target: "_self", variant: "solid", fullWidth: false },
    defaultStyle: { align: "left", fontSize: 15, fontWeight: 600, paddingY: 14, paddingX: 28 },
    fields: [
      { key: "label", label: "Texto do botão", type: "text" },
      ...linkFields,
      {
        key: "variant",
        label: "Estilo",
        type: "select",
        options: [
          { value: "solid", label: "Preenchido" },
          { value: "outline", label: "Contorno" },
          { value: "ghost", label: "Somente texto" },
        ],
      },
      { key: "fullWidth", label: "Largura total", type: "switch" },
    ],
  },
  {
    type: "image",
    label: "Imagem",
    icon: "Image",
    category: "Mídia",
    defaults: { src: "", alt: "", href: "", target: "_self" },
    defaultStyle: { align: "center", radius: 12 },
    fields: [
      { key: "src", label: "Imagem", type: "image" },
      { key: "alt", label: "Texto alternativo", type: "text" },
      ...linkFields,
    ],
  },
  {
    type: "video",
    label: "Vídeo",
    icon: "Video",
    category: "Mídia",
    defaults: { url: "" },
    defaultStyle: { radius: 12 },
    fields: [{ key: "url", label: "URL (YouTube, Vimeo ou MP4)", type: "text" }],
  },
  {
    type: "icon",
    label: "Ícone",
    icon: "Star",
    category: "Básico",
    defaults: { name: "Star" },
    defaultStyle: { align: "left", fontSize: 40 },
    fields: [{ key: "name", label: "Nome do ícone (Lucide)", type: "text", placeholder: "Star, Heart, Check..." }],
  },
  {
    type: "list",
    label: "Lista",
    icon: "ListChecks",
    category: "Básico",
    defaults: {
      items: [{ text: "Primeiro item" }, { text: "Segundo item" }, { text: "Terceiro item" }],
      marker: "check",
    },
    defaultStyle: { fontSize: 16 },
    fields: [
      {
        key: "marker",
        label: "Marcador",
        type: "select",
        options: [
          { value: "check", label: "Check" },
          { value: "dot", label: "Bolinha" },
          { value: "number", label: "Numerado" },
        ],
      },
      {
        key: "items",
        label: "Itens",
        type: "list",
        itemLabel: "Item",
        defaultItem: { text: "Novo item" },
        itemFields: [{ key: "text", label: "Texto", type: "text" }],
      },
    ],
  },
  {
    type: "socials",
    label: "Redes sociais",
    icon: "Share2",
    category: "Interação",
    defaults: {
      shape: "circle",
      items: [
        { network: "instagram", href: "https://instagram.com/" },
        { network: "whatsapp", href: "https://wa.me/5511999999999" },
      ],
    },
    defaultStyle: { align: "left", fontSize: 20 },
    fields: [
      {
        key: "shape",
        label: "Formato",
        type: "select",
        options: [
          { value: "circle", label: "Círculo" },
          { value: "square", label: "Quadrado" },
          { value: "plain", label: "Somente ícone" },
        ],
      },
      {
        key: "items",
        label: "Redes",
        type: "list",
        itemLabel: "Rede",
        defaultItem: { network: "instagram", href: "https://" },
        itemFields: [
          {
            key: "network",
            label: "Rede",
            type: "select",
            options: [
              { value: "instagram", label: "Instagram" },
              { value: "facebook", label: "Facebook" },
              { value: "whatsapp", label: "WhatsApp" },
              { value: "youtube", label: "YouTube" },
              { value: "linkedin", label: "LinkedIn" },
              { value: "tiktok", label: "TikTok" },
              { value: "x", label: "X / Twitter" },
              { value: "email", label: "E-mail" },
              { value: "site", label: "Site" },
            ],
          },
          { key: "href", label: "Link", type: "text" },
        ],
      },
    ],
  },
  {
    type: "divider",
    label: "Divisor",
    icon: "Minus",
    category: "Básico",
    defaults: { thickness: 1 },
    defaultStyle: { marginTop: 8, marginBottom: 8 },
    fields: [{ key: "thickness", label: "Espessura (px)", type: "number" }],
  },
  {
    type: "spacer",
    label: "Espaço",
    icon: "MoveVertical",
    category: "Básico",
    defaults: { height: 40 },
    fields: [{ key: "height", label: "Altura (px)", type: "number" }],
  },
  {
    type: "card",
    label: "Card",
    icon: "SquareStack",
    category: "Básico",
    defaults: { title: "Título do card", text: "Descrição curta do card.", image: "" },
    defaultStyle: { align: "left", paddingY: 24, paddingX: 24, radius: 16, borderWidth: 1 },
    fields: [
      { key: "image", label: "Imagem", type: "image" },
      { key: "title", label: "Título", type: "text" },
      { key: "text", label: "Descrição", type: "textarea" },
    ],
  },
  {
    type: "html",
    label: "HTML / Script",
    icon: "Code2",
    category: "Avançado",
    defaults: { code: "<!-- cole aqui seu código -->" },
    fields: [{ key: "code", label: "Código HTML", type: "textarea" }],
  },
  {
    type: "embed",
    label: "Incorporar (iframe)",
    icon: "Frame",
    category: "Avançado",
    defaults: { url: "", height: 420 },
    defaultStyle: { radius: 12 },
    fields: [
      { key: "url", label: "URL para incorporar", type: "text" },
      { key: "height", label: "Altura (px)", type: "number" },
    ],
  },
];

export function getElementDef(type: string): ElementDef | undefined {
  return ELEMENT_DEFS.find((e) => e.type === type);
}

function uid(prefix: string): string {
  const rand =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return `${prefix}-${rand}`;
}

export function createElement(type: string): SiteElement {
  const def = getElementDef(type);
  return {
    id: uid(type),
    type,
    props: JSON.parse(JSON.stringify(def?.defaults ?? {})),
    style: { ...(def?.defaultStyle ?? {}) },
  };
}

export function createColumn(width = 100): SiteColumn {
  return { id: uid("col"), width, elements: [] };
}

const SHADOWS: Record<string, string> = {
  none: "none",
  sm: "0 1px 3px rgba(0,0,0,0.12)",
  md: "0 8px 24px rgba(0,0,0,0.12)",
  lg: "0 20px 50px rgba(0,0,0,0.18)",
};

/** Converte o estilo do elemento em CSS inline, ignorando valores vazios. */
export function elementCss(style?: ElementStyle): React.CSSProperties {
  const s = style || {};
  const css: React.CSSProperties = {};
  if (s.align) css.textAlign = s.align;
  if (s.color) css.color = s.color;
  if (s.background) css.background = s.background;
  if (typeof s.fontSize === "number") css.fontSize = `${s.fontSize}px`;
  if (typeof s.fontWeight === "number") css.fontWeight = s.fontWeight;
  if (typeof s.lineHeight === "number") css.lineHeight = s.lineHeight;
  if (typeof s.letterSpacing === "number") css.letterSpacing = `${s.letterSpacing}px`;
  if (typeof s.paddingY === "number" || typeof s.paddingX === "number") {
    css.padding = `${s.paddingY ?? 0}px ${s.paddingX ?? 0}px`;
  }
  if (typeof s.marginTop === "number") css.marginTop = `${s.marginTop}px`;
  if (typeof s.marginBottom === "number") css.marginBottom = `${s.marginBottom}px`;
  if (typeof s.radius === "number") css.borderRadius = `${s.radius}px`;
  if (typeof s.maxWidth === "number" && s.maxWidth > 0) css.maxWidth = `${s.maxWidth}px`;
  if (typeof s.borderWidth === "number" && s.borderWidth > 0) {
    css.border = `${s.borderWidth}px solid ${s.borderColor || "rgba(0,0,0,0.12)"}`;
  }
  if (s.shadow && s.shadow !== "none") css.boxShadow = SHADOWS[s.shadow];
  return css;
}

export const SOCIAL_ICONS: Record<string, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  whatsapp: "MessageCircle",
  youtube: "Youtube",
  linkedin: "Linkedin",
  tiktok: "Music2",
  x: "Twitter",
  email: "Mail",
  site: "Globe",
};
