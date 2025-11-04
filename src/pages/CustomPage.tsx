import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Helmet } from "react-helmet-async";
import { LandingHeader } from "@/components/layout/LandingHeader";
import { LandingFooter } from "@/components/layout/LandingFooter";

interface CustomPageData {
  id: string;
  title: string;
  content: string;
  slug: string;
}

const CustomPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [page, setPage] = useState<CustomPageData | null>(null);
  const [siteTitle, setSiteTitle] = useState("");

  useEffect(() => {
    if (slug) {
      fetchPage();
      fetchSiteSettings();
    }
  }, [slug]);

  const fetchPage = async () => {
    const { data, error } = await supabase
      .from('custom_pages')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .single();

    if (error || !data) {
      navigate('/404');
      return;
    }

    setPage(data);
  };

  const fetchSiteSettings = async () => {
    const { data } = await supabase
      .from('site_settings')
      .select('key, value')
      .in('key', ['site_title']);

    if (data) {
      data.forEach(setting => {
        if (setting.key === 'site_title') setSiteTitle(setting.value || 'Site');
      });
    }
  };

  if (!page) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{page.title} | {siteTitle || 'Site'}</title>
        <meta name="description" content={(page.content || '').replace(/\s+/g,' ').slice(0, 155)} />
        <link rel="canonical" href={`${window.location.origin}/${page.slug}`} />
      </Helmet>

      <LandingHeader />

      <main className="pt-20 sm:pt-24 md:pt-32 flex-1 container mx-auto px-4 py-12">
        <article className="max-w-4xl mx-auto">
          <h1 className="text-3xl sm:text-4xl font-bold mb-8">{page.title}</h1>
          <div className="prose prose-lg dark:prose-invert max-w-none">
            <p className="whitespace-pre-wrap">{page.content}</p>
          </div>
        </article>
      </main>

      <LandingFooter />
    </div>
  );
};

export default CustomPage;
