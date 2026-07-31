export interface NicheTheme {
  primary: string;
  secondary: string;
  background: string;
  text: string;
  font: string;
  radius: number;
}

export interface Niche {
  id: string;
  label: string;
  theme: NicheTheme;
}

export interface NicheGroup {
  id: string;
  label: string;
  icon: string;
  theme: NicheTheme;
  niches: string[];
}

const T = (
  primary: string,
  secondary: string,
  background: string,
  text: string,
  font = "Inter",
  radius = 16
): NicheTheme => ({ primary, secondary, background, text, font, radius });

export const NICHE_GROUPS: NicheGroup[] = [
  {
    id: "saude",
    label: "Saúde",
    icon: "HeartPulse",
    theme: T("#0EA5E9", "#0F766E", "#F8FAFC", "#0F172A"),
    niches: [
      "Clínica Médica", "Consultório Médico", "Dentista", "Ortodontista", "Psicólogo",
      "Psiquiatra", "Nutricionista", "Fisioterapeuta", "Quiropraxista", "Fonoaudiólogo",
      "Dermatologista", "Cardiologista", "Pediatra", "Ginecologista", "Urologista",
      "Oftalmologista", "Neurologista", "Endocrinologista", "Clínica de Estética",
      "Estética Facial", "SPA", "Clínica Veterinária", "Pet Shop", "Farmácia", "Laboratório",
    ],
  },
  {
    id: "beleza",
    label: "Beleza",
    icon: "Sparkles",
    theme: T("#DB2777", "#7C3AED", "#FFF7FB", "#1F1024", "Playfair Display", 24),
    niches: [
      "Salão de Beleza", "Barbearia", "Cabeleireiro", "Manicure", "Pedicure",
      "Nail Designer", "Lash Designer", "Designer de Sobrancelhas", "Maquiadora",
      "Esteticista", "Massoterapeuta", "Podólogo", "Bronzeamento",
    ],
  },
  {
    id: "alimentacao",
    label: "Alimentação",
    icon: "UtensilsCrossed",
    theme: T("#EA580C", "#B91C1C", "#FFFBF5", "#1C1917", "Poppins", 20),
    niches: [
      "Restaurante", "Pizzaria", "Hamburgueria", "Sushi", "Churrascaria", "Lanchonete",
      "Cafeteria", "Padaria", "Confeitaria", "Sorveteria", "Açaí", "Marmitaria",
      "Delivery", "Buffet", "Food Truck", "Adega",
    ],
  },
  {
    id: "imoveis",
    label: "Imóveis",
    icon: "Building2",
    theme: T("#0F766E", "#111827", "#F9FAFB", "#111827", "Inter", 12),
    niches: [
      "Imobiliária", "Corretor de Imóveis", "Construtora", "Incorporadora", "Condomínio",
      "Loteamento", "Hotel", "Pousada", "Hostel", "Airbnb",
    ],
  },
  {
    id: "automotivo",
    label: "Automotivo",
    icon: "Truck",
    theme: T("#DC2626", "#111827", "#0B0B0F", "#F8FAFC", "Inter", 10),
    niches: [
      "Loja de Veículos", "Oficina Mecânica", "Auto Center", "Auto Elétrica", "Lava Jato",
      "Estética Automotiva", "Martelinho de Ouro", "Guincho", "Autopeças",
      "Locadora de Veículos", "Despachante",
    ],
  },
  {
    id: "construcao",
    label: "Construção",
    icon: "HardHat",
    theme: T("#F59E0B", "#1F2937", "#FAFAF9", "#1C1917", "Inter", 8),
    niches: [
      "Engenheiro", "Arquiteto", "Construtora", "Reformas", "Pintor", "Pedreiro",
      "Eletricista", "Encanador", "Gesseiro", "Serralheria", "Vidraçaria", "Marmoraria",
      "Marcenaria", "Móveis Planejados", "Energia Solar",
    ],
  },
  {
    id: "casa-servicos",
    label: "Casa e Serviços",
    icon: "Wrench",
    theme: T("#2563EB", "#0F172A", "#F8FAFC", "#0F172A"),
    niches: [
      "Limpeza", "Jardinagem", "Paisagismo", "Mudanças", "Fretes", "Chaveiro",
      "Dedetização", "Segurança Eletrônica", "Ar Condicionado", "Assistência Técnica",
    ],
  },
  {
    id: "educacao",
    label: "Educação",
    icon: "GraduationCap",
    theme: T("#4F46E5", "#0EA5E9", "#F8FAFF", "#111827"),
    niches: [
      "Escola", "Faculdade", "Curso Online", "Curso Presencial", "Professor Particular",
      "Escola de Idiomas", "Música", "Reforço Escolar",
    ],
  },
  {
    id: "juridico",
    label: "Jurídico",
    icon: "Gavel",
    theme: T("#1E3A8A", "#B45309", "#FBFAF7", "#111827", "Playfair Display", 6),
    niches: [
      "Escritório de Advocacia", "Advogado Trabalhista", "Advogado Criminal",
      "Advogado Previdenciário", "Advogado de Família", "Advogado Empresarial",
    ],
  },
  {
    id: "financeiro",
    label: "Financeiro",
    icon: "DollarSign",
    theme: T("#047857", "#0F172A", "#F7FBF9", "#0F172A", "Inter", 10),
    niches: [
      "Contabilidade", "Contador", "Consultoria Financeira", "Seguros", "Corretora",
      "Investimentos",
    ],
  },
  {
    id: "marketing",
    label: "Marketing e Tecnologia",
    icon: "Megaphone",
    theme: T("#7C3AED", "#22D3EE", "#0B0B12", "#F8FAFC", "Space Grotesk", 20),
    niches: [
      "Agência de Marketing", "Social Media", "Gestor de Tráfego", "Designer Gráfico",
      "Desenvolvedor", "Software House", "SaaS", "Consultoria de TI",
    ],
  },
  {
    id: "comercio",
    label: "Comércio",
    icon: "ShoppingBag",
    theme: T("#111827", "#22C55E", "#FFFFFF", "#111827", "Inter", 14),
    niches: [
      "Loja de Roupas", "Moda Feminina", "Moda Masculina", "Moda Infantil", "Calçados",
      "Joalheria", "Ótica", "Cosméticos", "Papelaria", "Livraria", "Informática",
      "Eletrônicos", "Celulares", "Móveis", "Decoração", "Ferragens",
      "Materiais de Construção", "Ferramentas", "Agropecuária", "Floricultura",
    ],
  },
  {
    id: "turismo",
    label: "Turismo",
    icon: "Globe",
    theme: T("#0891B2", "#F59E0B", "#F5FDFF", "#0F172A", "Poppins", 24),
    niches: ["Agência de Viagens", "Guia Turístico", "Passeios", "Excursões", "Cruzeiros"],
  },
  {
    id: "eventos",
    label: "Eventos",
    icon: "Calendar",
    theme: T("#9333EA", "#F472B6", "#0F0A14", "#FAF5FF", "Playfair Display", 22),
    niches: [
      "Cerimonial", "Casa de Festas", "DJ", "Banda", "Fotógrafo", "Videomaker",
      "Decoração", "Casamentos", "Formaturas",
    ],
  },
  {
    id: "fitness",
    label: "Fitness",
    icon: "Zap",
    theme: T("#22C55E", "#111827", "#0A0F0A", "#F0FDF4", "Space Grotesk", 12),
    niches: [
      "Academia", "Personal Trainer", "CrossFit", "Pilates", "Yoga", "Funcional",
      "Artes Marciais", "Dança",
    ],
  },
  {
    id: "religiao",
    label: "Religião",
    icon: "BookOpen",
    theme: T("#B45309", "#1E3A8A", "#FFFCF5", "#1C1917", "Playfair Display", 12),
    niches: ["Igreja", "Ministério", "Paróquia", "Centro Espírita", "ONG Religiosa"],
  },
  {
    id: "agronegocio",
    label: "Agronegócio",
    icon: "Package",
    theme: T("#65A30D", "#78350F", "#FAFDF5", "#1C1917", "Inter", 10),
    niches: ["Fazenda", "Agricultura", "Pecuária", "Cooperativa", "Agroindústria"],
  },
  {
    id: "industria",
    label: "Indústria",
    icon: "Settings2",
    theme: T("#334155", "#0EA5E9", "#F8FAFC", "#0F172A", "Inter", 6),
    niches: ["Metalúrgica", "Têxtil", "Alimentícia", "Química", "Embalagens", "Plásticos"],
  },
  {
    id: "profissionais",
    label: "Profissionais Liberais",
    icon: "Briefcase",
    theme: T("#0F172A", "#22C55E", "#FFFFFF", "#0F172A", "Inter", 18),
    niches: [
      "Consultor", "Coach", "Mentor", "Palestrante", "Fotógrafo", "Videomaker",
      "Escritor", "Tradutor", "Jornalista", "Influenciador Digital",
    ],
  },
  {
    id: "digital",
    label: "Digital",
    icon: "Sparkles",
    theme: T("#22C55E", "#7C3AED", "#08090C", "#F8FAFC", "Space Grotesk", 20),
    niches: [
      "Infoprodutor", "Afiliado", "Curso Online", "Comunidade", "Podcast",
      "Canal no YouTube", "Newsletter", "Startup", "SaaS",
    ],
  },
  {
    id: "institucional",
    label: "Institucional",
    icon: "Building2",
    theme: T("#1D4ED8", "#0F172A", "#FFFFFF", "#0F172A", "Inter", 8),
    niches: ["Empresa", "Holding", "ONG", "Associação", "Cooperativa", "Sindicato", "Fundação"],
  },
  {
    id: "ecommerce",
    label: "E-commerce",
    icon: "ShoppingBag",
    theme: T("#111827", "#22C55E", "#FFFFFF", "#111827", "Inter", 14),
    niches: [
      "Loja Virtual", "Moda", "Cosméticos", "Eletrônicos", "Pet Shop", "Farmácia",
      "Suplementos", "Autopeças", "Mercado", "Presentes",
    ],
  },
];

export const ALL_NICHES: { niche: string; group: NicheGroup }[] = NICHE_GROUPS.flatMap((g) =>
  g.niches.map((niche) => ({ niche, group: g }))
);

export function findNicheGroup(groupId?: string | null): NicheGroup | undefined {
  return NICHE_GROUPS.find((g) => g.id === groupId);
}

export interface SiteTypeDef {
  id: string;
  label: string;
  description: string;
  icon: string;
  blocks: string[];
}

export const SITE_TYPES: SiteTypeDef[] = [
  {
    id: "institucional",
    label: "Site Institucional",
    description: "Site completo com apresentação, serviços, depoimentos e contato.",
    icon: "Building2",
    blocks: ["header", "hero", "about", "services", "numbers", "testimonials", "faq", "cta", "form", "footer"],
  },
  {
    id: "captura",
    label: "Página de Captura",
    description: "Uma página focada em converter visitantes em leads.",
    icon: "Target",
    blocks: ["hero", "benefits", "video", "testimonials", "form", "faq", "footer"],
  },
  {
    id: "portfolio",
    label: "Portfólio",
    description: "Mostre seus trabalhos, projetos e cases com galeria.",
    icon: "Layers",
    blocks: ["header", "hero", "about", "gallery", "services", "testimonials", "cta", "footer"],
  },
  {
    id: "catalogo",
    label: "Catálogo / E-commerce",
    description: "Vitrine de produtos com preços e chamada para compra.",
    icon: "ShoppingBag",
    blocks: ["header", "hero", "products", "benefits", "testimonials", "faq", "footer"],
  },
  {
    id: "link",
    label: "Página de Links",
    description: "Página simples com seus principais links e contatos.",
    icon: "ExternalLink",
    blocks: ["hero", "links", "footer"],
  },
];
