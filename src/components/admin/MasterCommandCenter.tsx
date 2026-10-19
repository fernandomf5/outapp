import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowUpRight, Coins, CreditCard, FileCog, Globe2,
  MessageCircleMore, ShieldCheck, Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { CSSProperties } from "react";

type Command = {
  id: string; title: string; caption: string; icon: LucideIcon;
  hue: "cyan" | "purple" | "green" | "amber" | "pink";
};

const COMMANDS: Command[] = [
  { id: "users", title: "Usuários", caption: "Contas da plataforma", icon: Users, hue: "cyan" },
  { id: "subscriptions", title: "Assinaturas", caption: "Planos ativos", icon: CreditCard, hue: "purple" },
  { id: "revenue", title: "Financeiro", caption: "Receita e desempenho", icon: Coins, hue: "green" },
  { id: "landing", title: "Site", caption: "Identidade e conteúdo", icon: Globe2, hue: "cyan" },
  { id: "messages", title: "Mensagens", caption: "Comunicados", icon: MessageCircleMore, hue: "pink" },
  { id: "settings", title: "Configurações", caption: "Central administrativa", icon: FileCog, hue: "amber" },
];

export function MasterCommandCenter() {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(true);
  const [selected, setSelected] = useState("users");
  const current = COMMANDS.find((entry) => entry.id === selected) || COMMANDS[0];
  const CurrentIcon = current.icon;
  return (
    <section className="master-command-area" aria-label="Central orbital do administrador">
      <div className="master-command-headline">
        <span className="master-kicker"><span className="master-live-dot" /> MASTER SYSTEM / ONLINE</span>
        <div className="master-command-headline-content">
          <div><h2>Centro de <em>Comando</em></h2><p>Um universo de gestão. Selecione um módulo para administrar sua plataforma.</p></div>
          <span className="master-command-security"><ShieldCheck size={14}/> ACESSO MASTER</span>
        </div>
      </div>
      <div className="master-command-console">
        <div className="master-command-status"><span>INTERFACE ADMINISTRATIVA</span><span>GESTÃO OPERACIONAL</span></div>
        <div className={"master-orbital " + (expanded ? "master-orbital-open" : "master-orbital-closed")}>
          <div className="master-orbital-grid" aria-hidden="true" />
          <div className="master-orbital-ring master-orbital-ring-outer" aria-hidden="true" />
          <div className="master-orbital-ring master-orbital-ring-inner" aria-hidden="true" />
          <button type="button" className="master-orbital-core" onClick={() => setExpanded((value) => !value)}
            aria-label={expanded ? "Recolher menu de controle" : "Expandir menu de controle"} aria-expanded={expanded}>
            <span className="master-orbital-core-outline" aria-hidden="true" />
            <img src="/outapp-icon-192.png" alt="" className="master-orbital-logo"/>
            <strong>OUT APP</strong><span>MASTER CONTROL</span>
            <small>{expanded ? "Toque para recolher" : "Toque para expandir"}</small>
          </button>
          {COMMANDS.map((entry, index) => {
            const Icon = entry.icon;
            return <button type="button" key={entry.id}
              className={"master-orbit-choice master-choice-" + index + " master-hue-" + entry.hue + (selected === entry.id ? " master-choice-selected" : "")}
              onMouseEnter={() => setSelected(entry.id)}
              onFocus={() => setSelected(entry.id)}
              onClick={() => navigate("/admin?section=" + entry.id)}
              tabIndex={expanded ? 0 : -1} aria-hidden={!expanded}
              style={{ "--master-delay": (index * 50) + "ms" } as CSSProperties}>
              <Icon size={27} strokeWidth={1.8} aria-hidden="true" /><span>{entry.title}</span>
            </button>;
          })}
        </div>
        <div className="master-command-detail">
          <div className="master-command-detail-content">
            <span className={"master-detail-icon master-hue-" + current.hue}><CurrentIcon size={20}/></span>
            <span><strong>{current.title}</strong><small>{current.caption}</small></span>
          </div>
          <button onClick={() => navigate("/admin?section=" + current.id)} className="master-command-detail-link">Abrir módulo <ArrowUpRight size={17}/></button>
        </div>
      </div>
    </section>
  );
}
