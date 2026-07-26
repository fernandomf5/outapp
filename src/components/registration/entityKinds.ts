import {
  Users,
  Building2,
  Package,
  Wrench,
  Truck,
  Car,
  Home,
  CalendarDays,
  FileText,
  Boxes,
  LayoutGrid,
} from "lucide-react";

export type FieldType = "text" | "textarea" | "number" | "currency" | "date" | "select" | "url" | "email" | "phone";

export interface KindField {
  key: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  options?: string[];
  /** maps to a native contacts column instead of custom_fields */
  native?: "name" | "email" | "phone" | "company" | "position" | "document" | "address" | "website" | "market_area" | "contact_person" | "notes";
  required?: boolean;
  half?: boolean;
}

export interface EntityKind {
  key: string;
  label: string;
  description: string;
  icon: any;
  /** singular label used in buttons/titles */
  itemLabel: string;
  /** field shown as the main title (always native "name") */
  nameLabel: string;
  namePlaceholder: string;
  /** show avatar/photo upload */
  showAvatar: boolean;
  /** show contact block (email/phone/address) */
  showContactBlock: boolean;
  fields: KindField[];
  /** columns displayed in the list view (custom_fields keys or native) */
  listColumns?: Array<{ key: string; label: string; type?: FieldType }>;
}

export const ENTITY_KINDS: EntityKind[] = [
  {
    key: "people",
    label: "Pessoas / Clientes",
    description: "Leads, clientes, equipe e contatos em geral.",
    icon: Users,
    itemLabel: "Cadastro",
    nameLabel: "Nome Completo",
    namePlaceholder: "Nome completo",
    showAvatar: true,
    showContactBlock: true,
    fields: [],
  },
  {
    key: "business",
    label: "Empresas / Negócios",
    description: "Empresas, filiais, unidades e parceiros B2B.",
    icon: Building2,
    itemLabel: "Empresa",
    nameLabel: "Razão Social / Nome",
    namePlaceholder: "Nome da empresa",
    showAvatar: true,
    showContactBlock: true,
    fields: [
      { key: "contact_person", label: "Pessoa de Contato", type: "text", native: "contact_person", half: true },
      { key: "market_area", label: "Área de Atuação", type: "text", native: "market_area", half: true },
      { key: "website", label: "Website", type: "url", native: "website", half: true },
    ],
    listColumns: [{ key: "market_area", label: "Área de Atuação" }],
  },
  {
    key: "product",
    label: "Produtos",
    description: "Catálogo de produtos com preço, código e estoque.",
    icon: Package,
    itemLabel: "Produto",
    nameLabel: "Nome do Produto",
    namePlaceholder: "Ex: Camiseta Premium",
    showAvatar: true,
    showContactBlock: false,
    fields: [
      { key: "sku", label: "Código / SKU", type: "text", placeholder: "Ex: PRD-001", half: true },
      { key: "brand", label: "Marca / Fabricante", type: "text", half: true },
      { key: "cost_price", label: "Preço de Custo (R$)", type: "currency", half: true },
      { key: "sale_price", label: "Preço de Venda (R$)", type: "currency", half: true },
      { key: "stock", label: "Estoque", type: "number", half: true },
      { key: "unit", label: "Unidade", type: "select", options: ["un", "kg", "g", "L", "ml", "m", "cm", "caixa", "pacote"], half: true },
      { key: "supplier", label: "Fornecedor", type: "text", half: true },
      { key: "status", label: "Situação", type: "select", options: ["Ativo", "Inativo", "Esgotado", "Descontinuado"], half: true },
      { key: "description", label: "Descrição", type: "textarea" },
    ],
    listColumns: [
      { key: "sku", label: "SKU" },
      { key: "sale_price", label: "Preço", type: "currency" },
      { key: "stock", label: "Estoque" },
    ],
  },
  {
    key: "service",
    label: "Serviços",
    description: "Serviços prestados, valores e duração.",
    icon: Wrench,
    itemLabel: "Serviço",
    nameLabel: "Nome do Serviço",
    namePlaceholder: "Ex: Consultoria de Marketing",
    showAvatar: true,
    showContactBlock: false,
    fields: [
      { key: "code", label: "Código", type: "text", half: true },
      { key: "category", label: "Categoria do Serviço", type: "text", half: true },
      { key: "price", label: "Valor (R$)", type: "currency", half: true },
      { key: "pricing_model", label: "Cobrança", type: "select", options: ["Por hora", "Por projeto", "Mensal", "Diária", "Pacote"], half: true },
      { key: "duration", label: "Duração estimada", type: "text", placeholder: "Ex: 2h, 5 dias", half: true },
      { key: "responsible", label: "Responsável", type: "text", half: true },
      { key: "description", label: "Descrição / Escopo", type: "textarea" },
    ],
    listColumns: [
      { key: "price", label: "Valor", type: "currency" },
      { key: "pricing_model", label: "Cobrança" },
    ],
  },
  {
    key: "supplier",
    label: "Fornecedores",
    description: "Fornecedores com CNPJ, contato e condições.",
    icon: Truck,
    itemLabel: "Fornecedor",
    nameLabel: "Razão Social / Nome",
    namePlaceholder: "Nome do fornecedor",
    showAvatar: true,
    showContactBlock: true,
    fields: [
      { key: "contact_person", label: "Pessoa de Contato", type: "text", native: "contact_person", half: true },
      { key: "segment", label: "Segmento", type: "text", half: true },
      { key: "payment_terms", label: "Condições de Pagamento", type: "text", placeholder: "Ex: 30/60 dias", half: true },
      { key: "delivery_time", label: "Prazo de Entrega", type: "text", half: true },
      { key: "website", label: "Website", type: "url", native: "website", half: true },
    ],
    listColumns: [
      { key: "segment", label: "Segmento" },
      { key: "payment_terms", label: "Pagamento" },
    ],
  },
  {
    key: "asset",
    label: "Equipamentos / Ativos",
    description: "Patrimônio, máquinas e equipamentos.",
    icon: Boxes,
    itemLabel: "Ativo",
    nameLabel: "Nome do Ativo",
    namePlaceholder: "Ex: Notebook Dell i7",
    showAvatar: true,
    showContactBlock: false,
    fields: [
      { key: "asset_code", label: "Nº do Patrimônio", type: "text", half: true },
      { key: "serial", label: "Nº de Série", type: "text", half: true },
      { key: "location", label: "Localização", type: "text", half: true },
      { key: "responsible", label: "Responsável", type: "text", half: true },
      { key: "purchase_date", label: "Data de Aquisição", type: "date", half: true },
      { key: "value", label: "Valor (R$)", type: "currency", half: true },
      { key: "condition", label: "Estado", type: "select", options: ["Novo", "Bom", "Regular", "Em manutenção", "Baixado"], half: true },
      { key: "warranty_until", label: "Garantia até", type: "date", half: true },
      { key: "description", label: "Observações técnicas", type: "textarea" },
    ],
    listColumns: [
      { key: "asset_code", label: "Patrimônio" },
      { key: "condition", label: "Estado" },
    ],
  },
  {
    key: "vehicle",
    label: "Veículos / Frota",
    description: "Controle de veículos, placas e manutenção.",
    icon: Car,
    itemLabel: "Veículo",
    nameLabel: "Veículo (Modelo)",
    namePlaceholder: "Ex: Fiat Strada 2022",
    showAvatar: true,
    showContactBlock: false,
    fields: [
      { key: "plate", label: "Placa", type: "text", half: true },
      { key: "brand", label: "Marca", type: "text", half: true },
      { key: "year", label: "Ano", type: "text", half: true },
      { key: "color", label: "Cor", type: "text", half: true },
      { key: "mileage", label: "Quilometragem", type: "number", half: true },
      { key: "driver", label: "Motorista / Responsável", type: "text", half: true },
      { key: "next_service", label: "Próxima Revisão", type: "date", half: true },
      { key: "status", label: "Situação", type: "select", options: ["Disponível", "Em uso", "Em manutenção", "Vendido"], half: true },
      { key: "description", label: "Observações", type: "textarea" },
    ],
    listColumns: [
      { key: "plate", label: "Placa" },
      { key: "status", label: "Situação" },
    ],
  },
  {
    key: "property",
    label: "Imóveis / Locais",
    description: "Imóveis, salas, lojas e pontos.",
    icon: Home,
    itemLabel: "Imóvel",
    nameLabel: "Nome / Identificação",
    namePlaceholder: "Ex: Loja Centro",
    showAvatar: true,
    showContactBlock: false,
    fields: [
      { key: "address", label: "Endereço", type: "text", native: "address" },
      { key: "property_type", label: "Tipo", type: "select", options: ["Casa", "Apartamento", "Sala comercial", "Loja", "Galpão", "Terreno"], half: true },
      { key: "area", label: "Área (m²)", type: "number", half: true },
      { key: "rent_value", label: "Aluguel / Valor (R$)", type: "currency", half: true },
      { key: "contract_until", label: "Contrato até", type: "date", half: true },
      { key: "owner", label: "Proprietário / Locador", type: "text", half: true },
      { key: "status", label: "Situação", type: "select", options: ["Próprio", "Alugado", "Disponível", "Vendido"], half: true },
      { key: "description", label: "Observações", type: "textarea" },
    ],
    listColumns: [
      { key: "property_type", label: "Tipo" },
      { key: "status", label: "Situação" },
    ],
  },
  {
    key: "event",
    label: "Eventos / Projetos",
    description: "Projetos, eventos e ações com datas e responsáveis.",
    icon: CalendarDays,
    itemLabel: "Item",
    nameLabel: "Nome do Projeto / Evento",
    namePlaceholder: "Ex: Lançamento Coleção Verão",
    showAvatar: true,
    showContactBlock: false,
    fields: [
      { key: "start_date", label: "Início", type: "date", half: true },
      { key: "end_date", label: "Término", type: "date", half: true },
      { key: "responsible", label: "Responsável", type: "text", half: true },
      { key: "budget", label: "Orçamento (R$)", type: "currency", half: true },
      { key: "location", label: "Local", type: "text", half: true },
      { key: "status", label: "Situação", type: "select", options: ["Planejado", "Em andamento", "Concluído", "Cancelado"], half: true },
      { key: "description", label: "Descrição", type: "textarea" },
    ],
    listColumns: [
      { key: "start_date", label: "Início", type: "date" },
      { key: "status", label: "Situação" },
    ],
  },
  {
    key: "document",
    label: "Documentos / Contratos",
    description: "Contratos, apólices e documentos com validade.",
    icon: FileText,
    itemLabel: "Documento",
    nameLabel: "Título do Documento",
    namePlaceholder: "Ex: Contrato de Prestação - Cliente X",
    showAvatar: false,
    showContactBlock: false,
    fields: [
      { key: "doc_number", label: "Número / Código", type: "text", half: true },
      { key: "doc_type", label: "Tipo", type: "text", half: true },
      { key: "issue_date", label: "Emissão", type: "date", half: true },
      { key: "expires_at", label: "Validade", type: "date", half: true },
      { key: "value", label: "Valor (R$)", type: "currency", half: true },
      { key: "responsible", label: "Responsável", type: "text", half: true },
      { key: "status", label: "Situação", type: "select", options: ["Vigente", "Pendente", "Vencido", "Encerrado"], half: true },
      { key: "description", label: "Observações", type: "textarea" },
    ],
    listColumns: [
      { key: "doc_number", label: "Número" },
      { key: "expires_at", label: "Validade", type: "date" },
      { key: "status", label: "Situação" },
    ],
  },
  {
    key: "custom",
    label: "Gestão Livre (personalizada)",
    description: "Você cria os próprios campos do zero.",
    icon: LayoutGrid,
    itemLabel: "Registro",
    nameLabel: "Título",
    namePlaceholder: "Nome do registro",
    showAvatar: true,
    showContactBlock: false,
    fields: [],
  },
];

export const getEntityKind = (key?: string | null): EntityKind =>
  ENTITY_KINDS.find((k) => k.key === key) || ENTITY_KINDS[0];

export const FIELD_TYPE_LABELS: Record<FieldType, string> = {
  text: "Texto",
  textarea: "Texto longo",
  number: "Número",
  currency: "Valor (R$)",
  date: "Data",
  select: "Lista de opções",
  url: "Link",
  email: "E-mail",
  phone: "Telefone",
};

export const formatFieldValue = (value: any, type?: FieldType) => {
  if (value === null || value === undefined || value === "") return "—";
  if (type === "currency") {
    const n = Number(value);
    if (Number.isNaN(n)) return String(value);
    return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }
  if (type === "date") {
    const d = new Date(value);
    if (!Number.isNaN(d.getTime())) return d.toLocaleDateString("pt-BR");
  }
  return String(value);
};
