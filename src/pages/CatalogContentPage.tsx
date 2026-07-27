import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ArrowLeft } from "lucide-react";

interface PageData {
  title: string;
  content: string;
}

export default function CatalogContentPage() {
  const { slug, pageSlug } = useParams<{ slug: string; pageSlug: string }>();
  const [page, setPage] = useState<PageData | null>(null);
  const [catalogName, setCatalogName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data: catalog } = await supabase
        .from("catalogs" as any)
        .select("id, name")
        .eq("slug", slug)
        .eq("is_active", true)
        .maybeSingle();

      if (catalog) {
        setCatalogName((catalog as any).name);
        const { data } = await supabase
          .from("catalog_pages" as any)
          .select("title, content")
          .eq("catalog_id", (catalog as any).id)
          .eq("slug", pageSlug)
          .eq("is_published", true)
          .maybeSingle();
        setPage((data as unknown as PageData) || null);
      }
      setLoading(false);
    };
    load();
  }, [slug, pageSlug]);

  useEffect(() => {
    if (page?.title) document.title = `${page.title}${catalogName ? ` | ${catalogName}` : ""}`;
  }, [page, catalogName]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!page) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6 text-center">
        <h1 className="text-2xl font-bold">Página não encontrada</h1>
        <Link to={`/catalogo/${slug}`} className="text-primary underline">
          Voltar para o catálogo
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center gap-3">
          <Link
            to={`/catalogo/${slug}`}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4" /> {catalogName || "Catálogo"}
          </Link>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-bold mb-6">{page.title}</h1>
        <div className="whitespace-pre-wrap leading-relaxed text-muted-foreground">
          {page.content}
        </div>
      </main>
    </div>
  );
}
