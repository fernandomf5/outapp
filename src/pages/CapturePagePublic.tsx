import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { CapturePageRenderer } from "@/components/capture/CapturePageRenderer";
import { DEFAULT_SETTINGS, DEFAULT_THEME } from "@/components/capture/captureTypes";

const db = supabase as any;

const CapturePagePublic = () => {
  const { slug } = useParams<{ slug: string }>();
  const [page, setPage] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!slug) return;
      const { data } = await db.from("capture_pages").select("*").eq("slug", slug).eq("is_published", true).maybeSingle();
      if (data) {
        setPage({
          ...data,
          blocks: Array.isArray(data.blocks) ? data.blocks : [],
          form_fields: Array.isArray(data.form_fields) ? data.form_fields : [],
          theme: { ...DEFAULT_THEME, ...(data.theme || {}) },
          settings: { ...DEFAULT_SETTINGS, ...(data.settings || {}) },
        });
        db.from("capture_pages").update({ views: (data.views || 0) + 1 }).eq("id", data.id).then(() => {});
      }
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

  if (!page) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-2 bg-background px-6 text-center">
        <h1 className="text-2xl font-bold">Página não encontrada</h1>
        <p className="text-muted-foreground">Esta página de captura não existe ou não está publicada.</p>
      </div>
    );
  }

  const title = page.settings?.seoTitle || page.title;
  const description = page.settings?.seoDescription || "Preencha o formulário e receba mais informações.";

  return (
    <>
      <Helmet>
        <title>{title.slice(0, 60)}</title>
        <meta name="description" content={description.slice(0, 155)} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <link rel="canonical" href={`${window.location.origin}/captura/${page.slug}`} />
      </Helmet>
      <CapturePageRenderer page={page} mode="live" />
    </>
  );
};

export default CapturePagePublic;
