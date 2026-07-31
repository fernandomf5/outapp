import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { BlockRenderer } from "@/components/sites/BlockRenderer";
import { DEFAULT_THEME, SiteBlock, SiteTheme } from "@/components/sites/siteTypes";

export default function SitePublic() {
  const { slug, pageSlug } = useParams();
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [blocks, setBlocks] = useState<SiteBlock[]>([]);
  const [theme, setTheme] = useState<SiteTheme>(DEFAULT_THEME);
  const [siteId, setSiteId] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data: site } = await supabase
        .from("sites").select("*").eq("slug", slug).eq("is_published", true).maybeSingle();
      if (cancelled) return;
      if (!site) { setNotFound(true); setLoading(false); return; }

      const query = supabase.from("site_pages").select("*").eq("site_id", site.id);
      const { data: page } = pageSlug
        ? await query.eq("path", pageSlug).maybeSingle()
        : await query.eq("is_home", true).maybeSingle();

      if (cancelled) return;
      const t = { ...DEFAULT_THEME, ...((site.theme as any) || {}) };
      setTheme(t);
      setSiteId(site.id);
      setBlocks(((page?.blocks as any) || []) as SiteBlock[]);

      const seo = (site.seo as any) || {};
      document.title = seo.title || site.name;
      let meta = document.querySelector('meta[name="description"]');
      if (!meta) {
        meta = document.createElement("meta");
        meta.setAttribute("name", "description");
        document.head.appendChild(meta);
      }
      meta.setAttribute("content", seo.description || `${site.name} — site oficial`);

      supabase.rpc("increment_site_view" as any, { _site_id: site.id });
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [slug, pageSlug]);

  if (loading) {
    return <div className="min-h-screen grid place-items-center text-sm text-muted-foreground">Carregando...</div>;
  }

  if (notFound) {
    return (
      <div className="min-h-screen grid place-items-center p-6 text-center">
        <div>
          <h1 className="text-2xl font-bold">Site não encontrado</h1>
          <p className="text-sm text-muted-foreground mt-2">Este endereço não existe ou o site ainda não foi publicado.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: theme.background, fontFamily: theme.font, minHeight: "100vh" }}>
      {blocks.map((b) => (
        <BlockRenderer key={b.id} block={b} theme={theme} siteId={siteId} />
      ))}
    </div>
  );
}
