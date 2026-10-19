import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight, ArrowUpRight, BadgeCheck, Building2, CalendarDays, Check,
  CheckSquare2, ChevronDown, Coins, FilePenLine, FileSignature, Fingerprint,
  LayoutGrid, Link2, LockKeyhole, Menu, MessageCircleMore, Network,
  Plus, QrCode, ScanLine, ShieldCheck, Sparkles, Store,
  UserRound, WandSparkles, Workflow, X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { SocialLinks } from "@/components/SocialLinks";
import { CookieNotice } from "@/components/CookieNotice";
import { VideoCover } from "@/components/VideoCover";
import klicLogoAsset from "@/assets/klic-smart-logo-v3.png.asset.json";
import "./outapp-landing.css";

type Hue = "cyan" | "violet" | "pink" | "green" | "amber";
type Module = {
  id: string;
  title: string;
  shortTitle: string;
  description: string;
  icon: LucideIcon;
  hue: Hue;
};
type LandingPlan = {
  id: string;
  name: string;
  price: number;
  plan_type: string;
  duration_days: number;
  description: string | null;
};
type PublicPage = { id: string; slug: string; title: string };

const MANAGEMENT: Module[] = [
  { id: "financeiro", title: "Gestão Financeira", shortTitle: "Financeiro", description: "Controle receitas, despesas, contas e transações de cada negócio.", icon: Coins, hue: "cyan" },
  { id: "tarefas", title: "Gestão de Tarefas", shortTitle: "Tarefas", description: "Organize seus compromissos de trabalho e acompanhe as entregas.", icon: CheckSquare2, hue: "green" },
  { id: "agenda", title: "Gestão de Agenda", shortTitle: "Agenda", description: "Planeje eventos, horários e lembretes em um só lugar.", icon: CalendarDays, hue: "violet" },
  { id: "rotina", title: "Gestão de Rotina", shortTitle: "Rotina", description: "Estruture atividades e tenha mais clareza sobre o seu dia.", icon: Workflow, hue: "pink" },
];

const UTILITIES: Module[] = [
  { id: "chat-online", title: "Chat online para seu negócio", shortTitle: "Chat online", description: "Crie seu chat e organize o atendimento no seu site.", icon: MessageCircleMore, hue: "cyan" },
  { id: "linkbio", title: "Link na bio", shortTitle: "Link na bio", description: "Reúna os seus links em uma página personalizada.", icon: Link2, hue: "violet" },
  { id: "briefing", title: "Criador de briefing", shortTitle: "Briefing", description: "Colete dados e respostas para iniciar projetos.", icon: FilePenLine, hue: "pink" },
  { id: "mapa-mental", title: "Criador de mapa mental", shortTitle: "Mapa mental", description: "Organize ideias e conexões de forma visual.", icon: Network, hue: "cyan" },
  { id: "contratos", title: "Criador de contrato", shortTitle: "Contratos", description: "Prepare e organize documentos contratuais.", icon: FileSignature, hue: "amber" },
  { id: "aprova-job", title: "Aprova Job", shortTitle: "Aprova Job", description: "Envie trabalhos para revisão e aprovação.", icon: BadgeCheck, hue: "violet" },
  { id: "tools", title: "Gerador de link Whats", shortTitle: "Link Whats", description: "Gere links de conversa com mensagem personalizada.", icon: MessageCircleMore, hue: "green" },
  { id: "floating-button", title: "Botão flutuante", shortTitle: "Botão flutuante", description: "Configure botões de contato para o seu site.", icon: WandSparkles, hue: "pink" },
  { id: "shortlinks", title: "Encurtador de links", shortTitle: "Encurtador", description: "Simplifique e compartilhe endereços longos.", icon: Link2, hue: "cyan" },
  { id: "qrcode", title: "Criador de QR Code", shortTitle: "QR Code", description: "Gere e personalize códigos para divulgação.", icon: QrCode, hue: "amber" },
  { id: "scripts", title: "Organizador de script", shortTitle: "Scripts", description: "Crie e organize roteiros e conteúdos.", icon: FilePenLine, hue: "cyan" },
  { id: "funil-vendas", title: "Organizador de funil e kanban", shortTitle: "Funil e kanban", description: "Visualize etapas, oportunidades e movimentações.", icon: LayoutGrid, hue: "violet" },
];

const STEPS = [
  { number: "01", icon: Plus, title: "Cadastre", text: "Crie um espaço para seu negócio ou pessoa, incluindo nome, informações e logo." },
  { number: "02", icon: Fingerprint, title: "Ative sua esfera", text: "Selecione o cadastro e abra um menu orbital tecnológico, pensado para você." },
  { number: "03", icon: WandSparkles, title: "Escolha o recurso", text: "Entre em Financeiro, Tarefas, Agenda, Rotina ou Recursos Úteis quando precisar." },
];

const FAQ = [
  { question: "Como começo a usar a Out App?", answer: "Crie sua conta e entre na Gestão Livre. Cadastre um negócio ou pessoa e selecione esse cadastro para acessar o painel com o menu em forma de esfera." },
  { question: "Posso cadastrar mais de um negócio?", answer: "Sim. Na Gestão Livre você pode adicionar negócios e pessoas e alternar entre os cadastros." },
  { question: "A plataforma funciona no celular?", answer: "Sim. O menu futurista e as áreas da plataforma foram preparados para funcionar em telas de computador e celular." },
  { question: "Quais recursos existem na nova Out App?", answer: "Gestão Financeira, Gestão de Tarefas, Gestão de Agenda, Gestão de Rotina e os 12 recursos listados nesta página. A disponibilidade de cada ferramenta depende do seu plano." },
  { question: "Preciso instalar algum programa?", answer: "A Out App é acessada pelo navegador, sem exigir a instalação de um programa para desktop." },
];

function Price({ plan }: { plan: LandingPlan }) {
  const formatted = Number(plan.price).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const frequency = plan.plan_type === "monthly" ? "/mês" : plan.plan_type === "annual" ? "/ano" : plan.plan_type === "lifetime" ? " pagamento único" : plan.duration_days ? "/" + plan.duration_days + " dias" : "";
  return <div className="oa-price">{Number(plan.price) === 0 ? "Grátis" : formatted}<small>{Number(plan.price) !== 0 && frequency}</small></div>;
}

function LandingOrb({ onStart, onResources }: { onStart: () => void; onResources: () => void }) {
  const [expanded, setExpanded] = useState(true);
  const [selection, setSelection] = useState("financeiro");
  const active = MANAGEMENT.find((module) => module.id === selection) ?? MANAGEMENT[0];
  const ActiveIcon = active.icon;

  return (
    <div className="oa-holo" aria-label="Demonstração visual da central de gestão">
      <div className="oa-holo-topline"><span><span className="oa-online-dot" /> SISTEMA ATIVO</span><span>PAINEL / GESTÃO LIVRE</span></div>
      <div className={"oa-orbit " + (expanded ? "oa-orbit-open" : "oa-orbit-closed")}>
        <div className="oa-orbit-grid" aria-hidden="true" />
        <div className="oa-orbit-ring oa-orbit-ring-a" aria-hidden="true" />
        <div className="oa-orbit-ring oa-orbit-ring-b" aria-hidden="true" />
        <button className="oa-orbit-core" aria-label={expanded ? "Recolher opções do exemplo" : "Mostrar opções do exemplo"} aria-expanded={expanded} onClick={() => setExpanded((value) => !value)}>
          <span className="oa-orbit-core-light" aria-hidden="true" />
          <Store size={35} strokeWidth={1.7} aria-hidden="true" />
          <strong>SEU NEGÓCIO</strong>
          <small>{expanded ? "TOQUE PARA FECHAR" : "TOQUE PARA ABRIR"}</small>
        </button>
        {MANAGEMENT.map((module, index) => {
          const Icon = module.icon;
          return (
            <button
              key={module.id}
              className={"oa-orbit-choice oa-orbit-pos-" + index + " oa-hue-" + module.hue + (selection === module.id ? " oa-orbit-selected" : "")}
              style={{ "--order": index } as CSSProperties}
              onClick={() => setSelection(module.id)}
              aria-pressed={selection === module.id}
              tabIndex={expanded ? 0 : -1}
              aria-hidden={!expanded}
            >
              <Icon size={26} strokeWidth={1.8} aria-hidden="true" />
              <span>{module.shortTitle}</span>
            </button>
          );
        })}
        <button
          className="oa-orbit-choice oa-orbit-pos-4 oa-hue-violet oa-orbit-resources"
          style={{ "--order": 4 } as CSSProperties}
          onClick={onResources}
          tabIndex={expanded ? 0 : -1}
          aria-hidden={!expanded}
        >
          <WandSparkles size={26} strokeWidth={1.8} aria-hidden="true" /><span>Recursos Úteis</span>
        </button>
      </div>
      <div className="oa-holo-bottom">
        <div className="oa-holo-current">
          <span className={"oa-holo-current-icon oa-hue-" + active.hue}><ActiveIcon size={20} /></span>
          <span><strong>{active.title}</strong><small>{active.description}</small></span>
        </div>
        <button className="oa-text-link" onClick={onStart}>Acessar Out App <ArrowUpRight size={16} /></button>
      </div>
    </div>
  );
}

function VisualWorkspace() {
  return (
    <div className="oa-mini-workspace" aria-label="Ilustração do fluxo de cadastro e seleção de negócios">
      <div className="oa-mini-browserbar"><i /><i /><i /><span>outapp.com.br / gestão livre</span><ShieldCheck size={15} /></div>
      <div className="oa-mini-inner">
        <div className="oa-mini-list">
          <span className="oa-eyebrow">GESTÃO LIVRE</span>
          <h3>Seus cadastros</h3>
          <div className="oa-mini-entity oa-mini-active"><Store size={17} /><span>Seu negócio<small>Negócio</small></span><ArrowRight size={15}/></div>
          <div className="oa-mini-entity"><UserRound size={17}/><span>Seu perfil<small>Pessoa física</small></span><ArrowRight size={15}/></div>
          <div className="oa-mini-add"><Plus size={14}/> Cadastrar novo</div>
        </div>
        <div className="oa-mini-scene">
          <div className="oa-mini-rings"><span><Store size={32} /><b>SEU NEGÓCIO</b></span></div>
          <div className="oa-mini-tags"><span><Coins size={13} /> Financeiro</span><span><CalendarDays size={13} /> Agenda</span><span><WandSparkles size={13} /> Recursos</span></div>
        </div>
      </div>
    </div>
  );
}

const LEGAL_RE = /termos|privacidade|lgpd|pol[ií]tica|contato|sobre|ajuda|suporte|legal|reembolso/i;

export default function Index() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { settings } = useSiteSettings();
  const [mobileMenu, setMobileMenu] = useState(false);
  const [plans, setPlans] = useState<LandingPlan[]>([]);
  const [legalPages, setLegalPages] = useState<PublicPage[]>([]);
  const [videoUrl, setVideoUrl] = useState("");
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [scriptCode, setScriptCode] = useState<{ head: string; footer: string }>({ head: "", footer: "" });

  useEffect(() => {
    document.title = "Out App | Gestão Livre — seu negócio no centro de tudo";
    const meta = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (meta) meta.content = "Gestão Livre Out App: cadastre seu negócio, abra a esfera futurista e organize financeiro, tarefas, agenda, rotina e 12 ferramentas úteis.";
  }, []);

  useEffect(() => {
    let live = true;
    const load = async () => {
      const [plansResult, pagesResult, configResult] = await Promise.all([
        supabase.from("plans").select("id,name,price,plan_type,duration_days,description").eq("is_active", true).eq("is_visible", true).eq("show_on_landing", true).order("order_index", { ascending: true }),
        supabase.from("custom_pages").select("id,title,slug").eq("is_active", true).order("order_index", { ascending: true }),
        supabase.from("site_settings").select("key,value").in("key", ["landing_video_url", "head_code", "footer_code"]),
      ]);
      if (!live) return;
      if (plansResult.data) setPlans(plansResult.data as LandingPlan[]);
      if (pagesResult.data) setLegalPages((pagesResult.data as PublicPage[]).filter((p) => LEGAL_RE.test(p.title + " " + p.slug)));
      if (configResult.data) {
        const values = Object.fromEntries(configResult.data.map((item) => [item.key, item.value || ""]));
        setVideoUrl(values.landing_video_url || "");
        setScriptCode({ head: values.head_code || "", footer: values.footer_code || "" });
      }
    };
    void load();
    return () => { live = false; };
  }, []);

  // Preserve the existing site's administrator-configured tags/pixels.
  useEffect(() => {
    const injected: Element[] = [];
    const appendMarkup = (markup: string, location: HTMLElement) => {
      if (!markup.trim()) return;
      const template = document.createElement("template");
      template.innerHTML = markup;
      for (const node of Array.from(template.content.childNodes)) {
        if (!(node instanceof Element)) continue;
        if (node.tagName === "SCRIPT") {
          const script = document.createElement("script");
          for (const attribute of Array.from(node.attributes)) script.setAttribute(attribute.name, attribute.value);
          script.textContent = node.textContent;
          location.appendChild(script);
          injected.push(script);
        } else {
          const copy = node.cloneNode(true) as Element;
          location.appendChild(copy);
          injected.push(copy);
        }
      }
    };
    appendMarkup(scriptCode.head, document.head);
    appendMarkup(scriptCode.footer, document.body);
    return () => injected.forEach((node) => node.remove());
  }, [scriptCode.head, scriptCode.footer]);

  useEffect(() => {
    if (!mobileMenu) return;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setMobileMenu(false); };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [mobileMenu]);

  const destination = user ? "/dashboard" : "/auth";
  const goToApp = () => navigate(destination);
  const scrollTo = (id: string) => {
    setMobileMenu(false);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const footerLegal = useMemo(() => {
    const existing = new Set<string>();
    return legalPages.filter((page) => {
      if (existing.has(page.slug)) return false;
      existing.add(page.slug);
      return true;
    });
  }, [legalPages]);

  return (
    <div className="outapp-landing">
      <div className="oa-backdrop" aria-hidden="true" />
      <header className="oa-header">
        <div className="oa-header-inner">
          <button className="oa-logo" onClick={() => scrollTo("inicio")} aria-label="Out App - ir ao início">
            <span className="oa-logo-mark" aria-hidden="true" /><span>Out <strong>App</strong></span>
          </button>
          <nav className="oa-nav" aria-label="Navegação">
            <a href="#como-funciona">Como funciona</a><a href="#gestao">Gestão Livre</a><a href="#recursos">Recursos</a><a href="#planos">Planos</a><a href="#duvidas">Dúvidas</a>
          </nav>
          <div className="oa-header-actions">
            <button className="oa-header-login" onClick={goToApp}>{user ? "Meu painel" : "Entrar"}</button>
            <button className="oa-btn oa-btn-primary oa-top-cta" onClick={goToApp}>{user ? "Abrir painel" : "Começar agora"} <ArrowUpRight size={16} /></button>
            <button className="oa-menu-trigger" onClick={() => setMobileMenu(true)} aria-label="Abrir menu de navegação" aria-expanded={mobileMenu}><Menu size={22}/></button>
          </div>
        </div>
      </header>

      {mobileMenu && <div className="oa-mobile-overlay">
        <button className="oa-mobile-backdrop" aria-label="Fechar navegação" onClick={() => setMobileMenu(false)} />
        <nav className="oa-mobile-drawer" aria-label="Navegação mobile">
          <div className="oa-mobile-drawer-top"><div className="oa-logo"><span className="oa-logo-mark" /><span>Out <strong>App</strong></span></div><button onClick={() => setMobileMenu(false)} aria-label="Fechar menu"><X /></button></div>
          {[["inicio", "Início"], ["como-funciona", "Como funciona"], ["gestao", "Gestão Livre"], ["recursos", "Recursos"], ["planos", "Planos"], ["duvidas", "Dúvidas"]].map(([id, title]) =>
            <button key={id} onClick={() => scrollTo(id)}>{title}<ArrowRight size={17}/></button>
          )}
          <button className="oa-btn oa-btn-primary" onClick={goToApp}>{user ? "Abrir meu painel" : "Criar minha conta"} <ArrowUpRight size={17}/></button>
        </nav>
      </div>}

      <main>
        <section id="inicio" className="oa-hero oa-wrap">
          <div className="oa-hero-copy">
            <div className="oa-kicker"><span className="oa-online-dot" /> NOVA ERA DA GESTÃO LIVRE <Sparkles size={15} /></div>
            <h1>Seu negócio no <span>centro de tudo.</span></h1>
            <p className="oa-hero-lede">Uma nova forma de organizar sua vida e seus negócios. Cadastre, toque na esfera e acesse suas ferramentas em um universo futurista.</p>
            <div className="oa-hero-actions"><button className="oa-btn oa-btn-primary oa-btn-large" onClick={goToApp}>Explorar Out App <ArrowRight size={19}/></button><button className="oa-btn oa-btn-ghost oa-btn-large" onClick={() => scrollTo("como-funciona")}>Veja como funciona <ChevronDown size={17}/></button></div>
            <div className="oa-hero-trust"><span><Check size={15} /> Negócios e pessoas</span><span><Check size={15} /> Desktop e celular</span><span><Check size={15} /> Ferramentas em um só lugar</span></div>
          </div>
          <LandingOrb onStart={goToApp} onResources={() => scrollTo("recursos")} />
          <div className="oa-hero-scroll">DESLIZE PARA EXPLORAR <span /></div>
        </section>

        <section id="como-funciona" className="oa-section oa-wrap">
          <div className="oa-section-heading oa-center"><span className="oa-eyebrow">01 / UMA NOVA EXPERIÊNCIA</span><h2>Menos menus. <em>Mais possibilidades.</em></h2><p>Você decide quem quer gerenciar. A Out App organiza o resto, sem jogar dezenas de ferramentas na sua frente.</p></div>
          <div className="oa-steps">{STEPS.map(({ number, icon: Icon, title, text }) => <article className="oa-step oa-glass" key={number}><div className="oa-step-top"><span>{number}</span><Icon size={27} strokeWidth={1.6}/></div><h3>{title}</h3><p>{text}</p><div className="oa-step-progress" /></article>)}</div>
        </section>

        <section id="gestao" className="oa-section oa-management-section">
          <div className="oa-wrap">
            <div className="oa-two-column">
              <div className="oa-manage-copy">
                <span className="oa-eyebrow">02 / GESTÃO LIVRE</span>
                <h2>Você cria o espaço.<br/><em>A esfera abre o caminho.</em></h2>
                <p>Cadastre um negócio ou uma pessoa com nome, informações e imagem. Clique no cadastro para abrir o hub interativo e acessar as áreas da sua gestão.</p>
                <div className="oa-manage-checks"><span><Check size={15}/> Cadastro de negócios e pessoas</span><span><Check size={15}/> Logo ou foto personalizada</span><span><Check size={15}/> Menu orbital animado</span><span><Check size={15}/> Experiência pensada para celular</span></div>
                <button className="oa-btn oa-btn-outline" onClick={goToApp}>Conhecer a Gestão Livre <ArrowUpRight size={16}/></button>
              </div>
              <VisualWorkspace />
            </div>
          </div>
        </section>

        <section className="oa-section oa-wrap" id="areas">
          <div className="oa-section-heading oa-center"><span className="oa-eyebrow">03 / O ESSENCIAL DA SUA GESTÃO</span><h2>Quatro áreas. <em>Uma central.</em></h2><p>Tudo começa na esfera do seu negócio. Acesse a área certa, no momento certo.</p></div>
          <div className="oa-management-grid">{MANAGEMENT.map((module, index) => {
            const Icon = module.icon;
            return <article key={module.id} className={"oa-management-card oa-glass oa-hue-" + module.hue}>
              <span className="oa-management-count">0{index + 1} / 04</span><span className="oa-feature-icon"><Icon size={28}/></span><h3>{module.title}</h3><p>{module.description}</p><button onClick={goToApp} aria-label={"Acessar " + module.title}>Abrir gestão <ArrowUpRight size={16}/></button>
            </article>;
          })}</div>
        </section>

        <section id="recursos" className="oa-section oa-resources-section">
          <div className="oa-wrap">
            <div className="oa-resources-heading"><div><span className="oa-eyebrow">04 / RECURSOS ÚTEIS</span><h2>As ferramentas certas.<br/><em>Sem distrações.</em></h2><p>Os 12 recursos úteis da nova Out App, organizados para ajudar você a criar, divulgar, atender e estruturar seu trabalho.</p></div><div className="oa-resource-count"><WandSparkles size={25}/><strong>12</strong><small>RECURSOS ÚTEIS</small></div></div>
            <div className="oa-utilities-grid">{UTILITIES.map((module, index) => {
              const Icon = module.icon;
              return <article key={module.id} className={"oa-utility-card oa-glass oa-hue-" + module.hue}><span className="oa-utility-number">{String(index + 1).padStart(2, "0")}</span><span className="oa-utility-icon"><Icon size={24}/></span><h3>{module.title}</h3><p>{module.description}</p><span className="oa-utility-foot">DISPONÍVEL NA PLATAFORMA <ArrowUpRight size={15}/></span></article>;
            })}</div>
          </div>
        </section>

        <section className="oa-section oa-wrap oa-showcase-section">
          <div className="oa-showcase-copy"><span className="oa-eyebrow">O FUTURO É AGORA</span><h2>Futurista no visual.<br/><em>Simples de usar.</em></h2><p>Uma interface construída em torno do seu espaço de trabalho, com animações, cores vibrantes e navegação adaptada para desktop e celular.</p><button className="oa-btn oa-btn-primary" onClick={goToApp}>Começar minha experiência <ArrowRight size={17}/></button></div>
          <div className="oa-showcase-visual"><div className="oa-showcase-glow" /><div className="oa-showcase-disc"><Fingerprint size={67}/></div><div className="oa-showcase-pill oa-showcase-pill-a"><Coins size={19}/> FINANCEIRO</div><div className="oa-showcase-pill oa-showcase-pill-b"><CalendarDays size={19}/> AGENDA</div><div className="oa-showcase-pill oa-showcase-pill-c"><WandSparkles size={19}/> RECURSOS ÚTEIS</div></div>
        </section>

        {videoUrl && <section className="oa-section oa-wrap" id="demonstracao"><div className="oa-section-heading oa-center"><span className="oa-eyebrow">DEMONSTRAÇÃO</span><h2>Veja a Out App <em>em ação.</em></h2></div><div className="oa-video-frame"><VideoCover videoUrl={videoUrl}/></div></section>}

        <section id="planos" className="oa-section oa-pricing-section">
          <div className="oa-wrap">
            <div className="oa-section-heading oa-center"><span className="oa-eyebrow">05 / PLANOS</span><h2>Seu próximo passo <em>começa aqui.</em></h2><p>Confira os planos disponíveis e escolha como começar na nova Out App.</p></div>
            {plans.length > 0 ? <div className="oa-plans">{plans.map((plan, index) => <article className={"oa-plan oa-glass " + (index === 0 ? "oa-plan-highlight" : "")} key={plan.id}>
              <span className="oa-plan-label">{index === 0 ? "COMECE POR AQUI" : "OUT APP"}</span><h3>{plan.name}</h3><Price plan={plan}/><div className="oa-plan-divider"/><p>Organize suas atividades na Gestão Livre e acesse as ferramentas disponíveis no seu plano.</p><button className="oa-btn oa-btn-primary" onClick={goToApp}>Quero este plano <ArrowRight size={17}/></button><small>Disponibilidade de recursos conforme as condições do plano.</small>
            </article>)}</div> : <div className="oa-no-plans oa-glass"><Coins size={27}/><p>Consulte as opções de acesso disponíveis ao criar sua conta.</p><button className="oa-btn oa-btn-primary" onClick={goToApp}>Começar agora <ArrowRight size={16}/></button></div>}
          </div>
        </section>

        <section id="duvidas" className="oa-section oa-wrap oa-faq-section">
          <div className="oa-section-heading oa-center"><span className="oa-eyebrow">06 / PERGUNTAS FREQUENTES</span><h2>Ainda tem <em>dúvidas?</em></h2></div>
          <div className="oa-faq-list">{FAQ.map((item, index) => <div key={item.question} className={"oa-faq-item oa-glass " + (openFaq === index ? "oa-faq-open" : "")}>
            <button onClick={() => setOpenFaq(openFaq === index ? null : index)} aria-expanded={openFaq === index} aria-controls={"oa-faq-answer-" + index}><span>{item.question}</span><ChevronDown size={19}/></button>
            {openFaq === index && <p id={"oa-faq-answer-" + index}>{item.answer}</p>}
          </div>)}</div>
        </section>

        <section id="comecar" className="oa-section oa-final-section oa-wrap"><div className="oa-final-orbit" aria-hidden="true"/><div className="oa-final-inner"><span className="oa-eyebrow">SEU UNIVERSO COMEÇA AGORA</span><h2>Uma nova Out App.<br/><em>Um novo jeito de gerir.</em></h2><p>Seu negócio no centro, tudo que importa ao redor. Acesse a plataforma e comece pela Gestão Livre.</p><button className="oa-btn oa-btn-primary oa-btn-large" onClick={goToApp}>{user ? "Ir para meu painel" : "Criar minha conta"} <ArrowRight size={19}/></button></div></section>
      </main>

      <footer className="oa-footer">
        <div className="oa-wrap">
          <div className="oa-footer-grid">
            <div className="oa-footer-brand"><div className="oa-logo"><span className="oa-logo-mark" /><span>Out <strong>App</strong></span></div><p>A tecnologia por trás da sua organização. Gestão Livre para negócios e pessoas.</p><SocialLinks links={settings.socialLinks} variant="footer" /></div>
            <div className="oa-footer-col"><h3>Explorar</h3><a href="#como-funciona">Como funciona</a><a href="#gestao">Gestão Livre</a><a href="#areas">Gestões</a><a href="#recursos">Recursos Úteis</a><a href="#planos">Planos</a></div>
            <div className="oa-footer-col"><h3>Conta</h3><Link to="/auth">Entrar ou cadastrar</Link><Link to="/dashboard">Meu painel</Link><a href="#duvidas">Perguntas frequentes</a></div>
            <div className="oa-footer-col"><h3>Informações</h3>{footerLegal.map((page) => <Link key={page.id} to={"/" + page.slug}>{page.title}</Link>)}{footerLegal.length === 0 && <span className="oa-footer-muted">Páginas institucionais disponíveis no site.</span>}</div>
          </div>
          <div className="oa-footer-base"><div><span>{settings.footerText || "© " + new Date().getFullYear() + " Out App. Todos os direitos reservados."}</span><small>Grupo Liberdade Financeira Online — 21.233.977/0001-29</small></div><a href="https://klicsmart.top/" target="_blank" rel="noopener noreferrer"><img src={klicLogoAsset.url} alt="" loading="lazy"/> Criado pela Klic Smart <ArrowUpRight size={14}/></a></div>
        </div>
      </footer>
      <CookieNotice />
    </div>
  );
}
