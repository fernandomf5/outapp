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

  const isHtml = /<\/?(p|h[1-6]|ul|ol|li|div|br|strong)\b/i.test(page.content || '');
  const updatedAt = (page as any).updated_at
    ? new Date((page as any).updated_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
    : null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Helmet>
        <title>{page.title} | {siteTitle || 'Site'}</title>
        <meta name="description" content={(page.content || '').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').slice(0, 155)} />
        <link rel="canonical" href={`${window.location.origin}/${page.slug}`} />
      </Helmet>

      <LandingHeader />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden pt-28 sm:pt-32 md:pt-40 pb-12 md:pb-16">
          <div className="pointer-events-none absolute inset-0" aria-hidden="true">
            <div className="absolute -top-24 left-1/4 w-[28rem] h-[28rem] rounded-full bg-primary/20 blur-[130px]" />
            <div className="absolute -bottom-32 right-1/4 w-[24rem] h-[24rem] rounded-full bg-primary/10 blur-[120px]" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_35%,hsl(var(--background))_90%)]" />
          </div>
          <div className="relative container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-4 py-1.5 text-xs sm:text-sm font-medium text-primary">
                <ShieldCheck className="w-4 h-4" />
                Documento oficial
              </span>
              <h1 className="mt-5 text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground">
                {page.title}
              </h1>
              {updatedAt && (
                <p className="mt-4 inline-flex items-center gap-2 text-sm text-muted-foreground">
                  <CalendarClock className="w-4 h-4" />
                  Última atualização: {updatedAt}
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Content */}
        <section className="pb-16 md:pb-24">
          <div className="container mx-auto px-4">
            <article className="max-w-4xl mx-auto rounded-2xl border border-border/70 bg-card/70 backdrop-blur-sm shadow-xl p-5 sm:p-8 md:p-12">
              <div
                className={`legal-content prose prose-base sm:prose-lg dark:prose-invert max-w-none text-foreground ${isHtml ? '' : 'whitespace-pre-wrap'}`}
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(page.content || '', {
                  ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'a', 'img', 'blockquote', 'code', 'pre', 'hr', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'div', 'span'],
                  ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'id', 'style', 'target', 'rel']
                }) }}
              />
            </article>

            <nav className="max-w-4xl mx-auto mt-8 flex flex-wrap items-center justify-center gap-3">
              {[
                { href: '/poltica-de-privacidade', label: 'Política de Privacidade' },
                { href: '/termos-de-uso', label: 'Termos de Uso' },
                { href: '/lgpd', label: 'LGPD e Proteção de Dados' },
              ]
                .filter((l) => l.href !== `/${page.slug}`)
                .map((l) => (
                  <a
                    key={l.href}
                    href={l.href}
                    className="rounded-full border border-border bg-card px-4 py-2 text-sm text-muted-foreground transition-colors hover:border-primary/60 hover:text-foreground"
                  >
                    {l.label}
                  </a>
                ))}
            </nav>
          </div>
        </section>
      </main>

      <LandingFooter hideCustomPages={true} />
    </div>
  );
};

export default CustomPage;
