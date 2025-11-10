import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Helmet } from "react-helmet-async";
import { LandingHeader } from "@/components/layout/LandingHeader";
import { LandingFooter } from "@/components/layout/LandingFooter";
import DOMPurify from "dompurify";
import NotFound from "@/pages/NotFound";

interface CustomPageData {
  id: string;
  title: string;
  content: string;
  slug: string;
}

const CustomPage = () => {
  const { slug } = useParams();
  const [page, setPage] = useState<CustomPageData | null>(null);
  const [siteTitle, setSiteTitle] = useState("");
  const [notFound, setNotFound] = useState(false);

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
      .maybeSingle();

    if (error || !data) {
      setNotFound(true);
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

  if (notFound) {
    return <NotFound />;
  }

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
        <meta name="description" content={(page.content || '').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').slice(0, 155)} />
        <link rel="canonical" href={`${window.location.origin}/${page.slug}`} />
      </Helmet>

      <LandingHeader />

      <main className="pt-20 sm:pt-24 md:pt-32 pb-12 flex-1">
        <div className="container mx-auto px-4 py-12">
          <article className="max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold mb-8 text-foreground">{page.title}</h1>
            <div className="prose prose-lg dark:prose-invert max-w-none text-foreground">
              <div
                className="text-base leading-relaxed whitespace-pre-wrap"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(page.content || '', { 
                  ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'a', 'img', 'blockquote', 'code', 'pre', 'hr', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'div', 'span'],
                  ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'id', 'style', 'target', 'rel']
                }) }}
              />
            </div>
          </article>
        </div>
      </main>

      <LandingFooter hideCustomPages={true} />
    </div>
  );
};

export default CustomPage;
