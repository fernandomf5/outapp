export interface TutorialFeature {
  key: string;
  label: string;
  group: string;
}

/**
 * Lista canônica de recursos que podem receber um vídeo tutorial.
 * A `key` é a mesma usada em <FeatureTutorialVideo featureKey="..." />.
 */
export const TUTORIAL_FEATURES: TutorialFeature[] = [
  // Organizador
  { key: "tarefas", label: "Organizador de Tarefas", group: "Organizador" },
  { key: "rotina", label: "Organizador de Rotina", group: "Organizador" },
  { key: "tabelas-organizacao", label: "Tabela de Organização", group: "Organizador" },
  { key: "agenda", label: "Agenda / Agendamento", group: "Organizador" },
  { key: "mapa-mental", label: "Criador de Mapa Mental", group: "Organizador" },
  { key: "scripts", label: "Organizador de Scripts", group: "Organizador" },

  // Cadastros e CRM
  { key: "cadastro", label: "Gestão Livre (Cadastros)", group: "Cadastros" },
  { key: "cadastro-settings", label: "Categorias de Cadastro", group: "Cadastros" },
  { key: "clientes", label: "Gestão de Clientes", group: "Cadastros" },
  { key: "crm", label: "Contatos / CRM", group: "Cadastros" },
  { key: "negocios", label: "Gestão de Negócios", group: "Cadastros" },
  { key: "equipe", label: "Gestão de Equipe", group: "Cadastros" },

  // Financeiro
  { key: "financeiro", label: "Gestão Financeira", group: "Financeiro" },
  { key: "recibos", label: "Gerador de Recibos", group: "Financeiro" },
  { key: "faturas", label: "Gerador de Faturas", group: "Financeiro" },
  { key: "checkout-creator", label: "Criador de Checkout", group: "Financeiro" },

  // Vendas e Marketing
  { key: "funil-vendas", label: "Funil de Vendas", group: "Vendas e Marketing" },
  { key: "anuncios", label: "Criador de Dados de Anúncios", group: "Vendas e Marketing" },
  { key: "extrator-criativos", label: "Extrator de Criativos", group: "Vendas e Marketing" },
  { key: "questionario-marketing", label: "Questionário Marketing", group: "Vendas e Marketing" },
  { key: "popups", label: "Criador de Pop-ups", group: "Vendas e Marketing" },
  { key: "pagina-captura", label: "Criador de Página de Captura", group: "Vendas e Marketing" },
  { key: "portfolio", label: "Criador de Portfólio", group: "Vendas e Marketing" },
  { key: "catalogo", label: "Criador de Catálogo", group: "Vendas e Marketing" },
  { key: "produtos-servicos", label: "Produtos e Serviços", group: "Vendas e Marketing" },
  { key: "cloner", label: "Clonador de Páginas", group: "Vendas e Marketing" },

  // Atendimento
  { key: "ai-agents", label: "Chat Online", group: "Atendimento" },
  { key: "aprova-job", label: "Aprova Job", group: "Atendimento" },
  { key: "briefing", label: "Criador de Briefing", group: "Atendimento" },
  { key: "propostas", label: "Criador de Proposta Comercial", group: "Atendimento" },
  { key: "contratos", label: "Criador de Contratos", group: "Atendimento" },
  { key: "area-membros", label: "Criador de Área de Membros", group: "Atendimento" },
  { key: "support", label: "Suporte / Tickets", group: "Atendimento" },

  // Utilidades
  { key: "tools", label: "Gerador de Link WhatsApp", group: "Utilidades" },
  { key: "floating-button", label: "Botão Flutuante", group: "Utilidades" },
  { key: "shortlinks", label: "Encurtador de Links", group: "Utilidades" },
  { key: "qrcode", label: "Gerador de QR Code", group: "Utilidades" },
  { key: "linkbio", label: "Link na Bio", group: "Utilidades" },
];

export const TUTORIAL_FEATURE_GROUPS = TUTORIAL_FEATURES.reduce<Record<string, TutorialFeature[]>>(
  (acc, feature) => {
    (acc[feature.group] ||= []).push(feature);
    return acc;
  },
  {}
);

export const getTutorialFeatureLabel = (key: string) =>
  TUTORIAL_FEATURES.find((f) => f.key === key)?.label || key;
