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
  // Gestão Livre
  { key: "cadastro", label: "Gestão Livre (Cadastros)", group: "Gestão Livre" },
  { key: "cadastro-settings", label: "Categorias de Cadastro", group: "Gestão Livre" },

  // Organizador
  { key: "tarefas", label: "Organizador de Tarefas", group: "Organizador" },
  { key: "agenda", label: "Agenda / Agendamento", group: "Organizador" },
  { key: "rotina", label: "Organizador de Rotina", group: "Organizador" },
  { key: "tabelas-organizacao", label: "Tabela de Organização", group: "Organizador" },

  // Financeiro
  { key: "financeiro", label: "Gestão Financeira", group: "Financeiro" },
  { key: "recibos", label: "Gerador de Recibos", group: "Financeiro" },

  // Recursos Básicos
  { key: "tools", label: "Gerador de Link WhatsApp", group: "Recursos Básicos" },
  { key: "floating-button", label: "Botão Flutuante", group: "Recursos Básicos" },
  { key: "shortlinks", label: "Encurtador de Links", group: "Recursos Básicos" },
  { key: "qrcode", label: "Gerador de QR Code", group: "Recursos Básicos" },
  { key: "scripts", label: "Scripts de Atendimento", group: "Recursos Básicos" },

  // Recursos Avançados
  { key: "area-membros", label: "Criador de Área de Membros", group: "Recursos Avançados" },
  { key: "checkout-creator", label: "Criador de Checkout", group: "Recursos Avançados" },
  { key: "anuncios", label: "Criador de Dados de Anúncios", group: "Recursos Avançados" },
  { key: "chat-online", label: "Criador de Chat Online", group: "Recursos Avançados" },
  { key: "cloner", label: "Clonador de Páginas", group: "Recursos Avançados" },
  { key: "linkbio", label: "Criador de Link na Bio", group: "Recursos Avançados" },
  { key: "funil-vendas", label: "Criador de Funil de Vendas", group: "Recursos Avançados" },
  { key: "briefing", label: "Criador de Briefing", group: "Recursos Avançados" },
  { key: "questionario-marketing", label: "Criador de Questionário", group: "Recursos Avançados" },
  { key: "popups", label: "Criador de Pop-ups", group: "Recursos Avançados" },
  { key: "mapa-mental", label: "Criador de Mapa Mental", group: "Recursos Avançados" },
  { key: "propostas", label: "Criador de Proposta Comercial", group: "Recursos Avançados" },
  { key: "contratos", label: "Criador de Contratos", group: "Recursos Avançados" },
  { key: "aprova-job", label: "Criador de Aprova Job", group: "Recursos Avançados" },
  { key: "extrator-criativos", label: "Extrator de Criativos", group: "Recursos Avançados" },

  // Suporte e Essenciais
  { key: "support", label: "Suporte / Tickets", group: "Suporte e Essenciais" },
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
