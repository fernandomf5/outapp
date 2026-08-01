import {
  Wallet,
  ListTodo,
  StickyNote,
  Network,
  Filter,
  FileText,
  FileSignature,
  Receipt,
  FileBarChart,
  QrCode,
  Link2,
  Globe,
  ShoppingCart,
  MessageSquareQuote,
  Table2,
  CalendarDays,
  ClipboardList,
  Repeat,
  GraduationCap,
  Layers,
  Building2,
  Megaphone,
  type LucideIcon,
} from "lucide-react";

export interface ResourceTypeDef {
  /** stable key stored in contact_resource_links.resource_type */
  key: string;
  label: string;
  /** source table used to list resources when linking from the contact page */
  table: string;
  /** column(s) used to build the display title */
  titleColumns: string[];
  /** dashboard tab used to open the resource */
  tab: string;
  icon: LucideIcon;
}

export const RESOURCE_TYPES: ResourceTypeDef[] = [
  { key: "financial_business", label: "Gestão Financeira", table: "financial_businesses", titleColumns: ["name"], tab: "financeiro", icon: Wallet },
  { key: "task", label: "Tarefa", table: "tasks", titleColumns: ["title"], tab: "tarefas", icon: ListTodo },
  { key: "quick_note", label: "Anotação Rápida", table: "quick_notes", titleColumns: ["title"], tab: "tools", icon: StickyNote },
  { key: "mind_map", label: "Mapa Mental", table: "mind_maps", titleColumns: ["name"], tab: "mapa-mental", icon: Network },
  { key: "sales_funnel", label: "Funil de Vendas", table: "sales_funnels", titleColumns: ["name"], tab: "funil-vendas", icon: Filter },
  { key: "briefing", label: "Briefing", table: "briefings", titleColumns: ["title"], tab: "briefing", icon: FileText },
  { key: "contract", label: "Contrato", table: "contracts", titleColumns: ["title", "client_name"], tab: "contratos", icon: FileSignature },
  { key: "proposal", label: "Proposta Comercial", table: "commercial_proposals", titleColumns: ["title", "client_name"], tab: "propostas", icon: FileBarChart },
  { key: "invoice", label: "Fatura", table: "invoices", titleColumns: ["invoice_title", "invoice_number"], tab: "faturas", icon: Receipt },
  { key: "receipt", label: "Recibo", table: "saved_receipts", titleColumns: ["receipt_number", "client_name"], tab: "recibos", icon: Receipt },
  { key: "organization_table", label: "Tabela de Organização", table: "organization_tables", titleColumns: ["name"], tab: "tabelas-organizacao", icon: Table2 },
  { key: "agenda_event", label: "Evento da Agenda", table: "agenda_events", titleColumns: ["title"], tab: "agenda", icon: CalendarDays },
  { key: "service_order", label: "Ordem de Serviço", table: "service_orders", titleColumns: ["order_number", "client_name"], tab: "tools", icon: ClipboardList },
  { key: "routine", label: "Rotina", table: "routines", titleColumns: ["name"], tab: "rotina", icon: Repeat },
  { key: "questionnaire", label: "Questionário Marketing", table: "marketing_questionnaires", titleColumns: ["title"], tab: "questionario-marketing", icon: MessageSquareQuote },
  { key: "checkout", label: "Checkout", table: "checkouts", titleColumns: ["name"], tab: "checkout-creator", icon: ShoppingCart },
  { key: "cloned_page", label: "Página Clonada", table: "cloned_pages", titleColumns: ["slug", "original_url"], tab: "cloner", icon: Globe },
  { key: "short_link", label: "Link Curto", table: "short_links", titleColumns: ["short_code", "original_url"], tab: "shortlinks", icon: Link2 },
  { key: "qr_code", label: "QR Code", table: "saved_qr_codes", titleColumns: ["name"], tab: "qrcode", icon: QrCode },
  { key: "link_bio", label: "Link Bio", table: "link_bios", titleColumns: ["display_name", "username"], tab: "linkbio", icon: Link2 },
  { key: "members_area", label: "Área de Membros", table: "simple_members_areas", titleColumns: ["name"], tab: "area-membros", icon: GraduationCap },
  { key: "popup", label: "Popup", table: "popups", titleColumns: ["name"], tab: "popups", icon: Layers },
  { key: "floating_button", label: "Botão Flutuante", table: "floating_buttons", titleColumns: ["name"], tab: "floating-button", icon: Layers },
  { key: "business", label: "Negócio", table: "businesses", titleColumns: ["name"], tab: "negocios", icon: Building2 },
  { key: "ad_campaign", label: "Campanha de Anúncio", table: "ad_campaigns", titleColumns: ["name"], tab: "anuncios", icon: Megaphone },
  { key: "chat_online", label: "Chat Online", table: "ai_agents", titleColumns: ["name"], tab: "chat-online", icon: MessageSquareQuote },
  { key: "aprova_job", label: "Aprova Job", table: "aprova_job_jobs", titleColumns: ["title"], tab: "aprova-job", icon: ClipboardList },
  { key: "site", label: "Site", table: "sites", titleColumns: ["name", "slug"], tab: "sites", icon: Globe },
  { key: "product", label: "Produto/Serviço", table: "products", titleColumns: ["name"], tab: "produtos-servicos", icon: ShoppingCart },

];

export const getResourceType = (key: string): ResourceTypeDef | undefined =>
  RESOURCE_TYPES.find((r) => r.key === key);

export const resourceLabel = (key: string) => getResourceType(key)?.label || key;

export const resourceIcon = (key: string): LucideIcon =>
  getResourceType(key)?.icon || FileText;

export const buildResourceUrl = (key: string, resourceId?: string) => {
  const def = getResourceType(key);
  if (!def) return "/dashboard";
  const base = `/dashboard?tab=${def.tab}`;
  return resourceId ? `${base}&resourceId=${resourceId}` : base;
};

export const buildResourceTitle = (key: string, row: Record<string, any>) => {
  const def = getResourceType(key);
  if (!def) return "Recurso";
  const parts = def.titleColumns
    .map((c) => row?.[c])
    .filter((v) => typeof v === "string" && v.trim().length > 0);
  if (parts.length === 0) return "Sem título";
  const title = parts.join(" • ").slice(0, 120);
  return title || "Sem título";
};
