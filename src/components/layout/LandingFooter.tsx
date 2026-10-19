import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SocialLinks } from "@/components/SocialLinks";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import klicLogoAsset from "@/assets/klic-smart-logo-v3.png.asset.json";
import "@/pages/outapp-landing.css";

type Page = { id: string; title: string; slug: string };
const LEGAL_RE = /termos|privacidade|lgpd|pol[ií]tica|contato|sobre|ajuda|suporte|legal|reembolso/i;

export const LandingFooter = ({ hideCustomPages = false }: { hideCustomPages?: boolean }) => {
  const { settings } = useSiteSettings();
  const [pages, setPages] = useState<Page[]>([]);

  useEffect(() => {
    let active = true;
    supabase.from("custom_pages").select("id,title,slug").eq("is_active", true).order("order_index", { ascending: true })
      .then(({ data }) => { if (active && data) setPages((data as Page[]).filter((page) => LEGAL_RE.test(page.title + " " + page.slug))); });
    return () => { active = false; };
  }, []);

  return (
    <footer className="oa-footer public-oa-footer">
      <div className="oa-wrap">
        <div className="oa-footer-grid">
          <div className="oa-footer-brand">
            <Link to="/" className="oa-logo"><span className="oa-logo-mark"/><span>Out <strong>App</strong></span></Link>
            <p>Gestão Livre para negócios e pessoas. Um painel futurista, com o que você precisa para organizar melhor seu trabalho.</p>
            <SocialLinks links={settings.socialLinks} variant="footer"/>
          </div>
          <div className="oa-footer-col"><h3>Explorar</h3><Link to="/#como-funciona">Como funciona</Link><Link to="/#gestao">Gestão Livre</Link><Link to="/#areas">Gestões</Link><Link to="/#recursos">Recursos Úteis</Link><Link to="/#planos">Planos</Link></div>
          <div className="oa-footer-col"><h3>Conta</h3><Link to="/auth">Entrar ou cadastrar</Link><Link to="/dashboard">Meu painel</Link><Link to="/#duvidas">Perguntas frequentes</Link></div>
          <div className="oa-footer-col"><h3>Informações</h3>
            {!hideCustomPages && pages.map((page) => <Link key={page.id} to={"/" + page.slug}>{page.title}</Link>)}
            {(hideCustomPages || pages.length === 0) && <Link to="/">Página inicial</Link>}
          </div>
        </div>
        <div className="oa-footer-base">
          <div><span>{settings.footerText || "© " + new Date().getFullYear() + " Out App. Todos os direitos reservados."}</span><small>Grupo Liberdade Financeira Online — 21.233.977/0001-29</small></div>
          <a href="https://klicsmart.top/" target="_blank" rel="noopener noreferrer"><img src={klicLogoAsset.url} alt="" loading="lazy"/> Criado pela Klic Smart <ArrowUpRight size={14}/></a>
        </div>
      </div>
    </footer>
  );
};
