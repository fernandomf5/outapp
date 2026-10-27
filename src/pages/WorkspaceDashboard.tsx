import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft, ArrowRight, BadgeCheck, Building2, CalendarDays, CheckSquare2,
  ChevronRight, PanelLeftClose, PanelLeftOpen, ClipboardCheck, Coins, FilePenLine, FileSignature,
  Fingerprint, LayoutGrid, Link2, Loader2, LogOut, Menu, MessageCircleMore,
  Network, Pencil, Plus, QrCode, Save, Settings2, ShieldCheck, Sparkles, Store,
  UserRound, WandSparkles, Workflow, X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ConversationNotificationBell } from "@/components/ConversationNotificationBell";
import { useAuth } from "@/contexts/AuthContext";
import { useTeamMember } from "@/contexts/TeamMemberContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ImageUpload } from "@/components/ImageUpload";
import { toast } from "sonner";
import ErrorBoundary from "@/components/ErrorBoundary";
import { FeatureGate } from "@/components/FeatureGate";
import "./workspace-dashboard.css";

/**
 * Gestão Livre shares the financial_businesses table with Gestão Financeira.
 * Users keep their existing businesses, accounts and transactions; we do not
 * copy them into a second disconnected table.
 */
type Entity = {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  business_type: string;
  created_at: string;
};

type ToolItem = {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  color: "cyan" | "purple" | "pink" | "green" | "amber";
  gate?: string;
};

const MAIN_TOOLS: ToolItem[] = [
  { id: "financeiro", title: "Gestão Financeira", description: "Entradas, saídas e planejamento", icon: Coins, color: "cyan", gate: "financial_management" },
  { id: "tarefas", title: "Gestão de Tarefas", description: "Organize suas entregas", icon: CheckSquare2, color: "green", gate: "task_organizer" },
  { id: "agenda", title: "Gestão de Agenda", description: "Compromissos e lembretes", icon: CalendarDays, color: "cyan", gate: "agenda" },
  { id: "rotina", title: "Gestão de Rotina", description: "Hábitos e planejamento", icon: Workflow, color: "pink", gate: "routine_organizer" },
];

const UTILITY_TOOLS: ToolItem[] = [
  { id: "chat-online", title: "Chat online para seu negócio", description: "Crie e gerencie seu atendimento", icon: MessageCircleMore, color: "cyan", gate: "ai_agent" },
  { id: "linkbio", title: "Link na bio", description: "Uma página para todos os seus links", icon: Link2, color: "purple", gate: "link_bio" },
  { id: "briefing", title: "Criador de briefing", description: "Formulários para seus projetos", icon: ClipboardCheck, color: "pink", gate: "briefing_creator" },
  { id: "mapa-mental", title: "Criador de mapa mental", description: "Organize ideias de forma visual", icon: Network, color: "cyan", gate: "mind_map" },
  { id: "contratos", title: "Criador de contrato", description: "Crie e gerencie contratos", icon: FileSignature, color: "amber" },
  { id: "aprova-job", title: "Aprova Job", description: "Envie trabalhos para aprovação", icon: BadgeCheck, color: "pink", gate: "aprova_job" },
  { id: "tools", title: "Gerador de link Whats", description: "Links diretos para WhatsApp", icon: MessageCircleMore, color: "green", gate: "whatsapp_link" },
  { id: "floating-button", title: "Botão flutuante", description: "Botões para seu site", icon: WandSparkles, color: "purple", gate: "whatsapp_link" },
  { id: "shortlinks", title: "Encurtador de links", description: "Links compactos e práticos", icon: Link2, color: "cyan", gate: "link_shortener" },
  { id: "qrcode", title: "Criador de QR Code", description: "Gere códigos personalizados", icon: QrCode, color: "amber", gate: "qrcode_generator" },
  { id: "scripts", title: "Organizador de script", description: "Estruture suas ideias e conteúdos", icon: FilePenLine, color: "cyan", gate: "script_organizer" },
  { id: "funil-vendas", title: "Organizador de funil e kanban", description: "Etapas, leads e oportunidades", icon: LayoutGrid, color: "pink", gate: "sales_funnel" },
];

const ALL_TOOLS = [...MAIN_TOOLS, ...UTILITY_TOOLS];
const TOOL_IDS = new Set(ALL_TOOLS.map((item) => item.id));

// Keep resource modules as separate chunks: opening the hub should be fast on mobile.
const LegacyTeamDashboard = lazy(() => import("./Dashboard"));
const MyPlan = lazy(() => import("@/components/MyPlanSection").then((m) => ({ default: m.MyPlanSection })));
const Financial = lazy(() => import("@/components/FinancialManagementPanel").then((m) => ({ default: m.FinancialManagementPanel })));
const Tasks = lazy(() => import("@/components/tasks/TaskManagerContainer").then((m) => ({ default: m.TaskManagerContainer })));
const Agenda = lazy(() => import("@/components/AgendaPanel").then((m) => ({ default: m.AgendaPanel })));
const Routine = lazy(() => import("@/components/RoutineOrganizerPanel"));
const ChatOnlineWorkspace = lazy(() => import("@/components/chat/ChatOnlineWorkspace").then((m) => ({ default: m.ChatOnlineWorkspace })));
const LinkBio = lazy(() => import("@/components/LinkBioCreator").then((m) => ({ default: m.LinkBioCreator })));
const Briefing = lazy(() => import("@/components/BriefingCreatorPanel").then((m) => ({ default: m.BriefingCreatorPanel })));
const BriefingResponses = lazy(() => import("@/components/BriefingResponsesPanel").then((m) => ({ default: m.BriefingResponsesPanel })));
const MindMap = lazy(() => import("@/components/MindMapCreatorPanel").then((m) => ({ default: m.MindMapCreatorPanel })));
const Contracts = lazy(() => import("@/components/contracts/ContractCreatorPanel").then((m) => ({ default: m.ContractCreatorPanel })));
const Approva = lazy(() => import("@/components/AprovaJobPanel").then((m) => ({ default: m.AprovaJobPanel })));
const WhatsLink = lazy(() => import("@/components/WhatsAppLinkGenerator").then((m) => ({ default: m.WhatsAppLinkGenerator })));
const Floating = lazy(() => import("@/components/FloatingMultiButtonGenerator").then((m) => ({ default: m.FloatingMultiButtonGenerator })));
const Shortlinks = lazy(() => import("@/components/LinkShortener").then((m) => ({ default: m.LinkShortener })));
const QrCodes = lazy(() => import("@/components/QRCodeGenerator").then((m) => ({ default: m.QRCodeGenerator })));
const Scripts = lazy(() => import("@/components/ScriptOrganizerPanel").then((m) => ({ default: m.ScriptOrganizerPanel })));
const Funnel = lazy(() => import("@/components/SalesFunnelPanel").then((m) => ({ default: m.default })));

function LoadingModule() {
  return <div className="hub-module-loading" role="status"><Loader2 className="animate-spin" /> Preparando ferramenta...</div>;
}

function ModuleView({ item, entity, onBack }: { item: ToolItem; entity: Entity; onBack: () => void }) {
  const navigate = useNavigate();
  let content: React.ReactNode;
  switch (item.id) {
    case "financeiro": content = <Financial key={entity.id} initialBusinessId={entity.id} onBack={onBack} />; break;
    case "tarefas": content = <Tasks />; break;
    case "agenda": content = <Agenda />; break;
    case "rotina": content = <Routine />; break;
    case "chat-online": content = <ChatOnlineWorkspace entityId={entity.id} />; break;
    case "linkbio": content = <LinkBio />; break;
    case "briefing": content = <div className="hub-briefing"><Briefing /><h3>Respostas recebidas</h3><BriefingResponses /></div>; break;
    case "mapa-mental": content = <MindMap />; break;
    case "contratos": content = <Contracts />; break;
    case "aprova-job": content = <Approva />; break;
    case "tools": content = <WhatsLink />; break;
    case "floating-button": content = <Floating />; break;
    case "shortlinks": content = <Shortlinks />; break;
    case "qrcode": content = <QrCodes />; break;
    case "scripts": content = <Scripts />; break;
    case "funil-vendas": content = <Funnel />; break;
    default: content = null;
  }
  return (
    <ErrorBoundary>
      <Suspense fallback={<LoadingModule />}>
        {item.gate ? <FeatureGate featureKey={item.gate}>{content}</FeatureGate> : content}
      </Suspense>
    </ErrorBoundary>
  );
}

function EntityMark({ entity, size = "normal" }: { entity: Entity; size?: "normal" | "large" }) {
  const Icon = entity.business_type === "personal" ? UserRound : Store;
  return <span className={"hub-entity-mark " + (size === "large" ? "hub-entity-mark-large" : "")}>
    {entity.logo_url ? <img src={entity.logo_url} alt={`Logo de ${entity.name}`} /> : <Icon aria-hidden size={size === "large" ? 45 : 22} />}
  </span>;
}

export default function WorkspaceDashboard() {
  const { user, signOut, isAdmin } = useAuth();
  const { isTeamMember } = useTeamMember();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [entities, setEntities] = useState<Entity[]>([]);
  const [fetching, setFetching] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [entityDialog, setEntityDialog] = useState(false);
  const [editing, setEditing] = useState<Entity | null>(null);
  const [name, setName] = useState("");
  const [entityType, setEntityType] = useState<"company" | "personal">("company");
  const [description, setDescription] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [menuOpen, setMenuOpen] = useState(true);
  const [resourcesOpen, setResourcesOpen] = useState(false);
  const [mobileEntitiesOpen, setMobileEntitiesOpen] = useState(false);
  const [entitiesCollapsed, setEntitiesCollapsed] = useState(false);

  const selectedId = params.get("entity");
  const selected = entities.find((entity) => entity.id === selectedId) ?? null;
  const rawTab = params.get("tab");
  const viewingPlan = rawTab === "plan";
  const activeTool = selected && rawTab && TOOL_IDS.has(rawTab) ? ALL_TOOLS.find((tool) => tool.id === rawTab) : undefined;

  const loadEntities = useCallback(async () => {
    if (!user) { setFetching(false); return; }
    setFetching(true);
    setFetchError(null);
    const { data, error } = await supabase.from("financial_businesses")
      .select("id,user_id,name,description,business_type,logo_url,created_at")
      .eq("user_id", user.id)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });
    if (error) {
      setFetchError(error.message);
    } else {
      setEntities((data || []) as Entity[]);
    }
    setFetching(false);
  }, [user]);

  useEffect(() => { void loadEntities(); }, [loadEntities]);
  useEffect(() => { if (selected) sessionStorage.setItem("outapp_hub_entity", selected.id); }, [selected?.id]);

  useEffect(() => {
    if (!resourcesOpen) return;
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") setResourcesOpen(false); };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [resourcesOpen]);

  const chooseEntity = (entity: Entity) => {
    sessionStorage.setItem("outapp_hub_entity", entity.id);
    setParams({ entity: entity.id });
    setMobileEntitiesOpen(false);
    setResourcesOpen(false);
    setMenuOpen(true);
  };

  const backToEntities = () => {
    setParams({});
    setResourcesOpen(false);
    setMobileEntitiesOpen(false);
  };

  const openModule = (item: ToolItem) => {
    if (!selected) return;
    setParams({ entity: selected.id, tab: item.id });
    setResourcesOpen(false);
    setMobileEntitiesOpen(false);
  };

  const backToHub = () => {
    if (!selected) return;
    setParams({ entity: selected.id });
    setMenuOpen(true);
  };

  const openEntityForm = (entity?: Entity) => {
    setEditing(entity || null);
    setName(entity?.name ?? "");
    setDescription(entity?.description ?? "");
    setEntityType(entity?.business_type === "personal" ? "personal" : "company");
    setLogoUrl(entity?.logo_url ?? "");
    setEntityDialog(true);
  };

  const saveEntity = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user || !name.trim()) return;
    setSaving(true);
    const values = { name: name.trim(), description: description.trim() || null, logo_url: logoUrl || null, business_type: entityType };
    const result = editing
      ? await supabase.from("financial_businesses").update(values).eq("id", editing.id).eq("user_id", user.id)
      : await supabase.from("financial_businesses").insert({ ...values, user_id: user.id }).select("id").single();
    setSaving(false);
    if (result.error) {
      toast.error("Não foi possível salvar: " + result.error.message);
      return;
    }
    setEntityDialog(false);
    toast.success(editing ? "Cadastro atualizado." : "Cadastro criado! Toque nele para abrir seu painel.");
    await loadEntities();
    // After creating an entity, keep the screen on Gestão Livre; modules open only when selected.
    if (!editing) setParams({});
  };

  const leave = async () => {
    await signOut();
    navigate("/auth");
  };

  const displayName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Você";
  const statusLabel = selected ? (selected.business_type === "personal" ? "Pessoa" : "Negócio") : "Gestão Livre";

  if (isTeamMember) return <Suspense fallback={<LoadingModule />}><LegacyTeamDashboard /></Suspense>;

  return (
    <div className="outapp-hub">
      <div className="hub-starfield" aria-hidden />
      <header className="hub-header">
        <button className="hub-brand" onClick={backToEntities} aria-label="Voltar à Gestão Livre">
          <span className="hub-brand-symbol" aria-hidden /><span>Out <strong>App</strong></span>
        </button>
        <nav className="hub-header-navigation" aria-label="Navegação principal">
          <button className={!selected ? "hub-nav-current" : ""} onClick={backToEntities}><LayoutGrid size={17} /> Gestão Livre</button>
          {selected && <button className={!activeTool ? "hub-nav-current" : ""} onClick={backToHub}><Fingerprint size={17} /> Meu painel</button>}
          {activeTool && <span className="hub-nav-breadcrumb"><ChevronRight size={14} /> {activeTool.title}</span>}
        </nav>
        <div className="hub-header-actions">
          <span className="hub-hello">Olá, {displayName.split(" ")[0]}</span>
          <div className="hub-chat-notification" aria-label="Notificações do chat online"><ConversationNotificationBell /></div>
          <button onClick={() => setParams({ tab: "plan" })} aria-label="Meu plano" title="Meu plano"><BadgeCheck size={19} /></button>
          {isAdmin && <button onClick={() => navigate("/admin")} aria-label="Administração" title="Administração"><ShieldCheck size={18} /></button>}
          <button onClick={() => navigate("/settings")} aria-label="Configurações" title="Configurações"><Settings2 size={19} /></button>
          <button onClick={leave} aria-label="Sair" title="Sair"><LogOut size={18} /></button>
          <button className="hub-mobile-list-button" onClick={() => setMobileEntitiesOpen((v) => !v)} aria-label="Mostrar cadastros"><Menu size={22} /></button>
        </div>
      </header>

      <div className={"hub-shell " + (entitiesCollapsed && activeTool ? "hub-shell-expanded" : "")}>
        <aside className={"hub-entities-panel hub-glass " + (mobileEntitiesOpen ? "mobile-open " : "") + (entitiesCollapsed && activeTool ? "hub-entities-collapsed" : "")}>
          <div className="hub-eyebrow"><span className="hub-signal" /> Central de gestão</div>
          <div className="hub-entities-heading"><div><h2>Gestão Livre</h2><p>Seus negócios e pessoas em um só lugar.</p></div></div>
          <Button className="hub-new-button" onClick={() => openEntityForm()}><Plus size={18} /> Cadastrar novo</Button>
          <div className="hub-entities-list">
            {fetching ? <div className="hub-list-message"><Loader2 className="animate-spin" /> Carregando cadastros...</div>
              : fetchError ? <div className="hub-list-message hub-list-error">Erro ao buscar cadastros: {fetchError}<Button variant="outline" size="sm" onClick={loadEntities}>Tentar novamente</Button></div>
              : entities.length === 0 ? <div className="hub-list-message">Você ainda não cadastrou ninguém. Crie seu primeiro negócio ou pessoa para começar.</div>
              : entities.map((entity) => <div className={"hub-entity-item " + (entity.id === selected?.id ? "hub-entity-selected" : "")} key={entity.id}>
                <button className="hub-entity-select" onClick={() => chooseEntity(entity)} aria-label={`Abrir painel de ${entity.name}`}>
                  <EntityMark entity={entity} />
                  <span className="hub-entity-text"><strong>{entity.name}</strong><small>{entity.business_type === "personal" ? "Pessoa física" : "Negócio"}</small></span>
                  <ChevronRight size={18} />
                </button>
                <button className="hub-edit-entity" onClick={() => openEntityForm(entity)} title={`Editar ${entity.name}`} aria-label={`Editar ${entity.name}`}><Pencil size={15} /></button>
              </div>)}
          </div>
          <div className="hub-panel-foot"><Sparkles size={16} /> Mais organização. Menos complicação.</div>
        </aside>

        <main className="hub-main">
          {viewingPlan ? (
            <section className="hub-module-view">
              <div className="hub-module-heading hub-glass"><button className="hub-circle-back" onClick={backToEntities} aria-label="Voltar à Gestão Livre"><ArrowLeft /></button><div className="hub-module-titles"><span>Conta Out App</span><h1>Meu Plano</h1></div></div>
              <div className="hub-tool-content"><Suspense fallback={<LoadingModule />}><MyPlan /></Suspense></div>
            </section>
          ) : !selected ? (
            <div className="hub-welcome hub-glass">
              <div className="hub-welcome-orbit" aria-hidden><span className="hub-orbit-core"><Fingerprint size={56}/></span></div>
              <div className="hub-eyebrow">SEU UNIVERSO DE GESTÃO</div>
              <h1>Seu negócio no <em>centro de tudo.</em></h1>
              <p>Cadastre um negócio ou uma pessoa para abrir seu painel inteligente. Cada ferramenta aparece na hora certa — sem telas confusas ou excesso de opções.</p>
              <Button className="hub-primary-action" onClick={() => openEntityForm()}><Plus size={18} /> Criar meu primeiro cadastro <ArrowRight size={18}/></Button>
              {entities.length > 0 && <p className="hub-welcome-hint">Ou selecione um cadastro à esquerda para abrir seu universo.</p>}
            </div>
          ) : activeTool ? (
            <section className="hub-module-view">
              <div className="hub-module-heading hub-glass">
                <button className="hub-circle-back" onClick={backToHub} title="Voltar ao menu" aria-label="Voltar ao menu"><ArrowLeft /></button>
                <EntityMark entity={selected} />
                <div className="hub-module-titles"><span>{statusLabel} / {selected.name}</span><h1>{activeTool.title}</h1></div>
                <button className="hub-sidebar-toggle" type="button" onClick={() => setEntitiesCollapsed(v => !v)} aria-expanded={!entitiesCollapsed} aria-label={entitiesCollapsed ? "Expandir painel esquerdo" : "Minimizar painel esquerdo"} title={entitiesCollapsed ? "Expandir painel esquerdo" : "Minimizar painel esquerdo"}>{entitiesCollapsed ? <PanelLeftOpen size={18}/> : <PanelLeftClose size={18}/>}<span>{entitiesCollapsed ? "Expandir menu" : "Ampliar área"}</span></button>
                <button className="hub-secondary-action" onClick={backToEntities}>Trocar cadastro</button>
              </div>
              <div className="hub-tool-content" key={selected.id + "-" + activeTool.id}><ModuleView item={activeTool} entity={selected} onBack={backToHub}/></div>
            </section>
          ) : (
            <div className="hub-orb-stage">
              <div className="hub-stage-topline"><span><span className="hub-signal" /> HUB ATIVO</span><span>{statusLabel.toUpperCase()} / {selected.name.toUpperCase()}</span></div>
              <div className={"hub-orbit-menu " + (menuOpen ? "hub-menu-open" : "hub-menu-closed")}>
                <div className="hub-ring hub-ring-outer" aria-hidden />
                <div className="hub-ring hub-ring-inner" aria-hidden />
                <div className="hub-scan-lines" aria-hidden />
                <button className="hub-core" onClick={() => setMenuOpen((open) => !open)} aria-expanded={menuOpen} aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}>
                  <span className="hub-core-rim" aria-hidden />
                  <EntityMark entity={selected} size="large" />
                  <span className="hub-core-name">{selected.name}</span>
                  <span className="hub-core-caption">{menuOpen ? "Toque para recolher" : "Toque para abrir"}</span>
                </button>
                {MAIN_TOOLS.map((item, index) => {
                  const Icon = item.icon;
                  return <button key={item.id} className={`hub-orbit-tile hub-position-${index} hub-accent-${item.color}`} onClick={() => openModule(item)} tabIndex={menuOpen ? 0 : -1} aria-hidden={!menuOpen} style={{ "--tile-delay": `${index * 65}ms` } as React.CSSProperties}>
                    <Icon aria-hidden size={31} /><span>{item.title}</span>
                  </button>;
                })}
                <button className="hub-orbit-tile hub-position-4 hub-accent-purple" onClick={() => setResourcesOpen(true)} tabIndex={menuOpen ? 0 : -1} aria-hidden={!menuOpen} style={{ "--tile-delay": "260ms" } as React.CSSProperties}>
                  <WandSparkles aria-hidden size={30}/><span>Recursos Úteis</span>
                </button>
              </div>
              <div className="hub-orbit-instructions"><span className="hub-signal" /> Escolha uma área ao redor da esfera para começar</div>
              <div className="hub-stage-bottom">
                <div className="hub-stage-caption"><strong>Um universo de possibilidades.</strong><p>Seus recursos organizados em torno do que realmente importa.</p></div>
                <button onClick={() => setResourcesOpen(true)}><WandSparkles size={18}/> Explorar recursos úteis <ArrowRight size={17}/></button>
              </div>
            </div>
          )}
        </main>
      </div>

      <div className={"hub-resources-overlay " + (resourcesOpen ? "is-open" : "")} aria-hidden={!resourcesOpen}>
        <button className="hub-resources-backdrop" onClick={() => setResourcesOpen(false)} tabIndex={resourcesOpen ? 0 : -1} aria-label="Fechar recursos úteis" />
        <aside className="hub-resources-sheet" role="dialog" aria-modal="true" aria-label="Recursos úteis">
          <div className="hub-sheet-top"><div className="hub-utility-symbol"><WandSparkles size={25}/></div><div><h2>Recursos Úteis</h2><p>Ferramentas para impulsionar o seu negócio</p></div><button onClick={() => setResourcesOpen(false)} className="hub-sheet-close" title="Fechar"><X size={22}/></button></div>
          <div className="hub-tool-list">
            {UTILITY_TOOLS.map((item) => {const Icon=item.icon;return <button key={item.id} className={`hub-tool-card hub-accent-${item.color}`} onClick={() => openModule(item)} tabIndex={resourcesOpen ? 0 : -1}>
              <span className="hub-tool-icon"><Icon size={21}/></span><span><strong>{item.title}</strong><small>{item.description}</small></span><ChevronRight size={17}/>
            </button>;})}
          </div>
          <div className="hub-sheet-foot"><Fingerprint size={20}/> Tudo que você precisa. Sem excesso.</div>
        </aside>
      </div>

      <Dialog open={entityDialog} onOpenChange={(open) => !saving && setEntityDialog(open)}>
        <DialogContent className="hub-entity-dialog sm:max-w-lg">
          <DialogHeader><DialogTitle>{editing ? "Editar cadastro" : "Novo cadastro na Gestão Livre"}</DialogTitle><DialogDescription>Cadastre um negócio ou pessoa. A imagem escolhida aparecerá no centro do seu painel futurista.</DialogDescription></DialogHeader>
          <form onSubmit={saveEntity} className="space-y-4">
            <div><Label>O que deseja cadastrar?</Label><div className="hub-kind-options">
              <button type="button" className={entityType === "company" ? "selected" : ""} onClick={() => setEntityType("company")} aria-pressed={entityType === "company"}><Building2 size={20}/> Negócio</button>
              <button type="button" className={entityType === "personal" ? "selected" : ""} onClick={() => setEntityType("personal")} aria-pressed={entityType === "personal"}><UserRound size={20}/> Pessoa</button>
            </div></div>
            <div className="space-y-2"><Label htmlFor="hub-entity-name">{entityType === "company" ? "Nome do negócio" : "Nome da pessoa"} *</Label><Input id="hub-entity-name" value={name} maxLength={100} required onChange={(e) => setName(e.target.value)} placeholder={entityType === "company" ? "Ex.: Negócio X" : "Ex.: Maria Silva"}/></div>
            <div className="space-y-2"><Label htmlFor="hub-entity-desc">Descrição / informações adicionais</Label><Textarea id="hub-entity-desc" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={1200} rows={3} placeholder="Área de atuação, contato e outras informações..." /></div>
            <ImageUpload label={entityType === "company" ? "Logo do negócio (opcional)" : "Foto (opcional)"} bucketName="chatbot-media" currentImage={logoUrl} onImageSelect={setLogoUrl}/>
            <div className="hub-dialog-actions"><Button type="button" variant="outline" onClick={() => setEntityDialog(false)} disabled={saving}>Cancelar</Button><Button type="submit" disabled={saving || !name.trim()}>{saving ? <Loader2 className="animate-spin" size={17}/> : <Save size={17}/>} {editing ? "Salvar alterações" : "Cadastrar"}</Button></div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
