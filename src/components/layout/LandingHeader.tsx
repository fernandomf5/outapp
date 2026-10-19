import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, ArrowUpRight, Menu, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import "@/pages/outapp-landing.css";

export const LandingHeader = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const links = [
    { name: "Início", url: "/#inicio" },
    { name: "Como funciona", url: "/#como-funciona" },
    { name: "Gestão Livre", url: "/#gestao" },
    { name: "Recursos", url: "/#recursos" },
    { name: "Planos", url: "/#planos" },
  ];
  const enter = () => { setOpen(false); navigate(user ? "/dashboard" : "/auth"); };

  return (
    <>
      <header className="oa-header public-oa-header">
        <div className="oa-header-inner">
          <Link className="oa-logo" to="/" aria-label="Ir ao início da Out App"><span className="oa-logo-mark" /><span>Out <strong>App</strong></span></Link>
          <nav className="oa-nav" aria-label="Menu institucional">{links.map((item) => <Link to={item.url} key={item.name}>{item.name}</Link>)}</nav>
          <div className="oa-header-actions">
            <button className="oa-header-login" onClick={enter}>{user ? "Meu painel" : "Entrar"}</button>
            <button className="oa-btn oa-btn-primary oa-top-cta" onClick={enter}>{user ? "Abrir painel" : "Começar agora"} <ArrowUpRight size={16}/></button>
            <button className="oa-menu-trigger" onClick={() => setOpen(true)} aria-label="Abrir menu"><Menu size={22}/></button>
          </div>
        </div>
      </header>
      {open && <div className="oa-mobile-overlay">
        <button className="oa-mobile-backdrop" onClick={() => setOpen(false)} aria-label="Fechar menu" />
        <nav className="oa-mobile-drawer" aria-label="Menu institucional mobile">
          <div className="oa-mobile-drawer-top"><span className="oa-logo"><span className="oa-logo-mark"/><span>Out <strong>App</strong></span></span><button onClick={() => setOpen(false)} aria-label="Fechar menu"><X/></button></div>
          {links.map((item) => <Link className="public-oa-mobile-link" onClick={() => setOpen(false)} to={item.url} key={item.name}>{item.name}<ArrowRight size={16}/></Link>)}
          <button className="oa-btn oa-btn-primary" onClick={enter}>{user ? "Meu painel" : "Cadastrar"} <ArrowUpRight size={17}/></button>
        </nav>
      </div>}
    </>
  );
};
