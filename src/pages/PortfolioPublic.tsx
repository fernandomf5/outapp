import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, FolderKanban } from "lucide-react";
import {
  DEFAULT_CONTACT,
  DEFAULT_PORTFOLIO_THEME,
  DEFAULT_SECTIONS,
  PortfolioItemRecord,
  PortfolioLayout,
  PortfolioRecord,
} from "@/components/portfolio/portfolioTypes";
import { PortfolioRenderer } from "@/components/portfolio/PortfolioRenderer";
import { PageEmbeds } from "@/components/embeds/PageEmbeds";

const db = supabase as any;

const PortfolioPublic = () => {
  const { slug } = useParams<{ slug: string }>();
  const [portfolio, setPortfolio] = useState<PortfolioRecord | null>(null);
  const [items, setItems] = useState<PortfolioItemRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!slug) return setLoading(false);
      const { data } = await db
        .from("portfolios")
        .select("*")
        .eq("slug", slug)
        .eq("is_public", true)
        .maybeSingle();

      if (!data) {
        setLoading(false);
        return;
      }

      const record: PortfolioRecord = {
        ...data,
        theme: { ...DEFAULT_PORTFOLIO_THEME(), ...(data.theme || {}) },
        sections: Array.isArray(data.sections) && data.sections.length ? data.sections : DEFAULT_SECTIONS(),
        custom_fields: Array.isArray(data.custom_fields) ? data.custom_fields : [],
        contact: { ...DEFAULT_CONTACT, ...(data.contact || {}) },
        layout: (data.layout || "grid") as PortfolioLayout,
        settings: data.settings || {},
      };
      setPortfolio(record);

      const { data: itemRows } = await db
        .from("portfolio_items")
        .select("*")
        .eq("portfolio_id", data.id)
        .order("display_order", { ascending: true });

      setItems(
        (itemRows || []).map((row: any) => ({
          ...row,
          images: Array.isArray(row.images) ? row.images : [],
          tags: Array.isArray(row.tags) ? row.tags : [],
          links: Array.isArray(row.links) ? row.links : [],
          files: Array.isArray(row.files) ? row.files : [],
          custom_data: row.custom_data && typeof row.custom_data === "object" ? row.custom_data : {},
        })),
      );

      document.title = `${record.name} | Portfólio`;
      const meta = document.querySelector('meta[name="description"]');
      if (meta && record.description) meta.setAttribute("content", record.description.slice(0, 155));

      db.rpc("increment_portfolio_view", { _portfolio_id: data.id }).then(() => {});
      setLoading(false);
    };
    load();
  }, [slug]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!portfolio) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background px-6 text-center">
        <FolderKanban className="h-12 w-12 text-muted-foreground" />
        <h1 className="text-2xl font-bold">Portfólio não encontrado</h1>
        <p className="text-muted-foreground">Este endereço não existe ou o portfólio ainda não foi publicado.</p>
      </div>
    );
  }

  return (
    <>
      <PortfolioRenderer portfolio={portfolio} items={items} mode="live" />
      <PageEmbeds settings={portfolio.settings} />
    </>
  );
};

export default PortfolioPublic;
