export type FieldType =
  | "text"
  | "textarea"
  | "image"
  | "color"
  | "number"
  | "switch"
  | "select"
  | "list";

export interface FieldDef {
  key: string;
  label: string;
  type: FieldType;
  options?: { value: string; label: string }[];
  placeholder?: string;
  itemFields?: FieldDef[];
  itemLabel?: string;
  defaultItem?: Record<string, any>;
}

export interface SiteBlock {
  id: string;
  type: string;
  props: Record<string, any>;
}

export interface SiteTheme {
  primary: string;
  secondary: string;
  background: string;
  text: string;
  font: string;
  radius: number;
}

export interface BlockDef {
  type: string;
  label: string;
  icon: string;
  category: "Estrutura" | "Conteúdo" | "Conversão" | "Vendas" | "Mídia";
  defaults: Record<string, any>;
  fields: FieldDef[];
}

const titleField: FieldDef = { key: "title", label: "Título", type: "text" };
const subtitleField: FieldDef = { key: "subtitle", label: "Subtítulo", type: "textarea" };

export const BLOCK_DEFS: BlockDef[] = [
  {
    type: "header",
    label: "Cabeçalho",
    icon: "PanelTop",
    category: "Estrutura",
    defaults: {
      logo: "",
      brand: "Minha Empresa",
      sticky: true,
      links: [
        { label: "Início", href: "#inicio" },
        { label: "Serviços", href: "#servicos" },
        { label: "Contato", href: "#contato" },
      ],
      ctaLabel: "Fale conosco",
      ctaHref: "#contato",
    },
    fields: [
      { key: "brand", label: "Nome da marca", type: "text" },
      { key: "logo", label: "Logo", type: "image" },
      { key: "sticky", label: "Fixar no topo", type: "switch" },
      {
        key: "links",
        label: "Links do menu",
        type: "list",
        itemLabel: "Link",
        defaultItem: { label: "Novo link", href: "#" },
        itemFields: [
          { key: "label", label: "Texto", type: "text" },
          { key: "href", label: "Destino", type: "text" },
        ],
      },
      { key: "ctaLabel", label: "Texto do botão", type: "text" },
      { key: "ctaHref", label: "Link do botão", type: "text" },
    ],
  },
  {
    type: "hero",
    label: "Destaque (Hero)",
    icon: "Sparkles",
    category: "Estrutura",
    defaults: {
      badge: "",
      title: "Transforme seu negócio hoje",
      subtitle: "Uma solução simples, rápida e feita sob medida para você.",
      ctaLabel: "Quero saber mais",
      ctaHref: "#contato",
      secondaryLabel: "",
      secondaryHref: "",
      image: "",
      align: "center",
      overlay: 50,
    },
    fields: [
      { key: "badge", label: "Selo", type: "text" },
      titleField,
      subtitleField,
      { key: "ctaLabel", label: "Botão principal", type: "text" },
      { key: "ctaHref", label: "Link do botão", type: "text" },
      { key: "secondaryLabel", label: "Botão secundário", type: "text" },
      { key: "secondaryHref", label: "Link do secundário", type: "text" },
      { key: "image", label: "Imagem de fundo", type: "image" },
      {
        key: "align",
        label: "Alinhamento",
        type: "select",
        options: [
          { value: "left", label: "Esquerda" },
          { value: "center", label: "Centro" },
        ],
      },
      { key: "overlay", label: "Escurecer fundo (%)", type: "number" },
    ],
  },
  {
    type: "about",
    label: "Sobre",
    icon: "Info",
    category: "Conteúdo",
    defaults: {
      title: "Sobre nós",
      text: "Conte aqui a história da sua empresa, sua missão e o que torna o seu trabalho único.",
      image: "",
      reverse: false,
    },
    fields: [
      titleField,
      { key: "text", label: "Texto", type: "textarea" },
      { key: "image", label: "Imagem", type: "image" },
      { key: "reverse", label: "Inverter lados", type: "switch" },
    ],
  },
  {
    type: "services",
    label: "Serviços",
    icon: "LayoutGrid",
    category: "Conteúdo",
    defaults: {
      title: "Nossos serviços",
      subtitle: "",
      items: [
        { title: "Serviço 1", text: "Descreva aqui o benefício do serviço.", image: "" },
        { title: "Serviço 2", text: "Descreva aqui o benefício do serviço.", image: "" },
        { title: "Serviço 3", text: "Descreva aqui o benefício do serviço.", image: "" },
      ],
    },
    fields: [
      titleField,
      subtitleField,
      {
        key: "items",
        label: "Serviços",
        type: "list",
        itemLabel: "Serviço",
        defaultItem: { title: "Novo serviço", text: "", image: "" },
        itemFields: [
          { key: "title", label: "Título", type: "text" },
          { key: "text", label: "Descrição", type: "textarea" },
          { key: "image", label: "Imagem", type: "image" },
        ],
      },
    ],
  },
  {
    type: "benefits",
    label: "Benefícios",
    icon: "CheckCircle2",
    category: "Conteúdo",
    defaults: {
      title: "Por que escolher a gente",
      items: [
        { title: "Atendimento rápido", text: "Resposta em minutos." },
        { title: "Qualidade garantida", text: "Trabalho com garantia." },
        { title: "Preço justo", text: "Custo-benefício real." },
      ],
    },
    fields: [
      titleField,
      {
        key: "items",
        label: "Benefícios",
        type: "list",
        itemLabel: "Benefício",
        defaultItem: { title: "Novo benefício", text: "" },
        itemFields: [
          { key: "title", label: "Título", type: "text" },
          { key: "text", label: "Descrição", type: "textarea" },
        ],
      },
    ],
  },
  {
    type: "numbers",
    label: "Números",
    icon: "BarChart3",
    category: "Conteúdo",
    defaults: {
      title: "",
      items: [
        { value: "+500", label: "Clientes atendidos" },
        { value: "10 anos", label: "De experiência" },
        { value: "4.9", label: "Nota média" },
      ],
    },
    fields: [
      titleField,
      {
        key: "items",
        label: "Indicadores",
        type: "list",
        itemLabel: "Indicador",
        defaultItem: { value: "100", label: "Descrição" },
        itemFields: [
          { key: "value", label: "Número", type: "text" },
          { key: "label", label: "Legenda", type: "text" },
        ],
      },
    ],
  },
  {
    type: "gallery",
    label: "Galeria / Projetos",
    icon: "Images",
    category: "Mídia",
    defaults: {
      title: "Nossos trabalhos",
      columns: 3,
      items: [
        { image: "", title: "Projeto 1", text: "" },
        { image: "", title: "Projeto 2", text: "" },
        { image: "", title: "Projeto 3", text: "" },
      ],
    },
    fields: [
      titleField,
      { key: "columns", label: "Colunas", type: "number" },
      {
        key: "items",
        label: "Itens",
        type: "list",
        itemLabel: "Item",
        defaultItem: { image: "", title: "Novo projeto", text: "" },
        itemFields: [
          { key: "image", label: "Imagem", type: "image" },
          { key: "title", label: "Título", type: "text" },
          { key: "text", label: "Descrição", type: "textarea" },
          { key: "href", label: "Link (opcional)", type: "text" },
        ],
      },
    ],
  },
  {
    type: "products",
    label: "Produtos",
    icon: "ShoppingBag",
    category: "Vendas",
    defaults: {
      title: "Nossos produtos",
      columns: 3,
      buttonLabel: "Comprar no WhatsApp",
      whatsapp: "",
      items: [
        { image: "", title: "Produto 1", price: "R$ 99,00", text: "" },
        { image: "", title: "Produto 2", price: "R$ 149,00", text: "" },
        { image: "", title: "Produto 3", price: "R$ 199,00", text: "" },
      ],
    },
    fields: [
      titleField,
      { key: "columns", label: "Colunas", type: "number" },
      { key: "buttonLabel", label: "Texto do botão", type: "text" },
      { key: "whatsapp", label: "WhatsApp (só números)", type: "text", placeholder: "5511999999999" },
      {
        key: "items",
        label: "Produtos",
        type: "list",
        itemLabel: "Produto",
        defaultItem: { image: "", title: "Novo produto", price: "", text: "" },
        itemFields: [
          { key: "image", label: "Imagem", type: "image" },
          { key: "title", label: "Nome", type: "text" },
          { key: "price", label: "Preço", type: "text" },
          { key: "text", label: "Descrição", type: "textarea" },
        ],
      },
    ],
  },
  {
    type: "testimonials",
    label: "Depoimentos",
    icon: "Quote",
    category: "Conteúdo",
    defaults: {
      title: "O que dizem nossos clientes",
      items: [
        { name: "Maria S.", role: "Cliente", text: "Atendimento excelente, recomendo!", image: "" },
        { name: "João P.", role: "Cliente", text: "Superou minhas expectativas.", image: "" },
      ],
    },
    fields: [
      titleField,
      {
        key: "items",
        label: "Depoimentos",
        type: "list",
        itemLabel: "Depoimento",
        defaultItem: { name: "Nome", role: "", text: "", image: "" },
        itemFields: [
          { key: "name", label: "Nome", type: "text" },
          { key: "role", label: "Cargo/Descrição", type: "text" },
          { key: "text", label: "Depoimento", type: "textarea" },
          { key: "image", label: "Foto", type: "image" },
        ],
      },
    ],
  },
  {
    type: "faq",
    label: "Perguntas frequentes",
    icon: "HelpCircle",
    category: "Conteúdo",
    defaults: {
      title: "Perguntas frequentes",
      items: [
        { question: "Como funciona?", answer: "Explique aqui de forma simples." },
        { question: "Qual o prazo?", answer: "Informe o prazo do seu serviço." },
      ],
    },
    fields: [
      titleField,
      {
        key: "items",
        label: "Perguntas",
        type: "list",
        itemLabel: "Pergunta",
        defaultItem: { question: "Nova pergunta", answer: "" },
        itemFields: [
          { key: "question", label: "Pergunta", type: "text" },
          { key: "answer", label: "Resposta", type: "textarea" },
        ],
      },
    ],
  },
  {
    type: "cta",
    label: "Chamada para ação",
    icon: "Megaphone",
    category: "Conversão",
    defaults: {
      title: "Pronto para começar?",
      subtitle: "Fale com a gente agora mesmo e tire suas dúvidas.",
      ctaLabel: "Falar no WhatsApp",
      ctaHref: "#contato",
    },
    fields: [
      titleField,
      subtitleField,
      { key: "ctaLabel", label: "Texto do botão", type: "text" },
      { key: "ctaHref", label: "Link do botão", type: "text" },
    ],
  },
  {
    type: "form",
    label: "Formulário de contato",
    icon: "Mail",
    category: "Conversão",
    defaults: {
      title: "Entre em contato",
      subtitle: "Preencha o formulário e retornamos rapidinho.",
      buttonLabel: "Enviar",
      successMessage: "Recebemos sua mensagem! Em breve entraremos em contato.",
      fields: [
        { key: "name", label: "Nome", type: "text", required: true },
        { key: "email", label: "E-mail", type: "email", required: true },
        { key: "phone", label: "WhatsApp", type: "tel", required: false },
        { key: "message", label: "Mensagem", type: "textarea", required: false },
      ],
    },
    fields: [
      titleField,
      subtitleField,
      { key: "buttonLabel", label: "Texto do botão", type: "text" },
      { key: "successMessage", label: "Mensagem de sucesso", type: "textarea" },
      {
        key: "fields",
        label: "Campos do formulário",
        type: "list",
        itemLabel: "Campo",
        defaultItem: { key: "campo", label: "Novo campo", type: "text", required: false },
        itemFields: [
          { key: "label", label: "Rótulo", type: "text" },
          { key: "key", label: "Identificador", type: "text" },
          {
            key: "type",
            label: "Tipo",
            type: "select",
            options: [
              { value: "text", label: "Texto" },
              { value: "email", label: "E-mail" },
              { value: "tel", label: "Telefone" },
              { value: "textarea", label: "Texto longo" },
            ],
          },
          { key: "required", label: "Obrigatório", type: "switch" },
        ],
      },
    ],
  },
  {
    type: "links",
    label: "Lista de links",
    icon: "ExternalLink",
    category: "Conversão",
    defaults: {
      title: "Meus links",
      avatar: "",
      items: [
        { label: "WhatsApp", href: "https://wa.me/5511999999999" },
        { label: "Instagram", href: "https://instagram.com/" },
      ],
    },
    fields: [
      titleField,
      { key: "avatar", label: "Foto/Logo", type: "image" },
      {
        key: "items",
        label: "Links",
        type: "list",
        itemLabel: "Link",
        defaultItem: { label: "Novo link", href: "https://" },
        itemFields: [
          { key: "label", label: "Texto", type: "text" },
          { key: "href", label: "URL", type: "text" },
        ],
      },
    ],
  },
  {
    type: "video",
    label: "Vídeo",
    icon: "Video",
    category: "Mídia",
    defaults: { title: "", url: "" },
    fields: [
      titleField,
      { key: "url", label: "URL (YouTube, Vimeo ou MP4)", type: "text" },
    ],
  },
  {
    type: "image",
    label: "Imagem",
    icon: "Image",
    category: "Mídia",
    defaults: { image: "", caption: "", full: false },
    fields: [
      { key: "image", label: "Imagem", type: "image" },
      { key: "caption", label: "Legenda", type: "text" },
      { key: "full", label: "Largura total", type: "switch" },
    ],
  },
  {
    type: "text",
    label: "Texto",
    icon: "Type",
    category: "Conteúdo",
    defaults: { title: "", text: "Escreva aqui o seu conteúdo." },
    fields: [titleField, { key: "text", label: "Texto", type: "textarea" }],
  },
  {
    type: "map",
    label: "Mapa",
    icon: "MapPin",
    category: "Conteúdo",
    defaults: { title: "Onde estamos", address: "Av. Paulista, São Paulo" },
    fields: [titleField, { key: "address", label: "Endereço", type: "text" }],
  },
  {
    type: "spacer",
    label: "Espaçamento",
    icon: "Minus",
    category: "Estrutura",
    defaults: { height: 48 },
    fields: [{ key: "height", label: "Altura (px)", type: "number" }],
  },
  {
    type: "footer",
    label: "Rodapé",
    icon: "PanelBottom",
    category: "Estrutura",
    defaults: {
      brand: "Minha Empresa",
      text: "Todos os direitos reservados.",
      whatsapp: "",
      instagram: "",
      email: "",
      address: "",
    },
    fields: [
      { key: "brand", label: "Nome da marca", type: "text" },
      { key: "text", label: "Texto", type: "textarea" },
      { key: "whatsapp", label: "WhatsApp", type: "text" },
      { key: "instagram", label: "Instagram", type: "text" },
      { key: "email", label: "E-mail", type: "text" },
      { key: "address", label: "Endereço", type: "text" },
    ],
  },
];

export function getBlockDef(type: string): BlockDef | undefined {
  return BLOCK_DEFS.find((b) => b.type === type);
}

export function createBlock(type: string, overrides: Record<string, any> = {}): SiteBlock {
  const def = getBlockDef(type);
  return {
    id: `${type}-${Math.random().toString(36).slice(2, 9)}`,
    type,
    props: JSON.parse(JSON.stringify({ ...(def?.defaults ?? {}), ...overrides })),
  };
}

export const DEFAULT_THEME: SiteTheme = {
  primary: "#22C55E",
  secondary: "#0F172A",
  background: "#FFFFFF",
  text: "#0F172A",
  font: "Inter",
  radius: 16,
};

export const FONT_OPTIONS = [
  "Inter",
  "Poppins",
  "Montserrat",
  "Playfair Display",
  "Space Grotesk",
  "Roboto",
  "Lato",
  "Nunito",
];
