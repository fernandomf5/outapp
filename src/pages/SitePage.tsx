import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Helmet } from "react-helmet-async";

interface Section {
  id: string;
  type: 'hero' | 'about' | 'services' | 'testimonials' | 'gallery' | 'contact' | 'cta' | 'features';
  content: any;
  order: number;
}

interface Website {
  id: string;
  title: string;
  slug: string;
  description?: string;
  settings: {
    primaryColor?: string;
    secondaryColor?: string;
    fontFamily?: string;
    logo?: string;
  };
  sections: Section[];
}

export default function SitePage() {
  const { slug } = useParams();
  const [website, setWebsite] = useState<Website | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const preview = new URLSearchParams(window.location.search).get('preview') === '1';
        let query = supabase
          .from('websites')
          .select('*')
          .eq('slug', slug);
        if (!preview) {
          query = query.eq('is_published', true) as any;
        }
        const { data, error } = await query.single();
        if (error) throw error;
        const w = data as any;
        setWebsite({
          ...w,
          settings: (typeof w.settings === 'object' && w.settings) || {},
          sections: (Array.isArray(w.sections) ? w.sections : [])
        });
      } catch (e) {
        setWebsite(null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [slug]);

  const Primary = website?.settings?.primaryColor || '#8B5CF6';
  const Secondary = website?.settings?.secondaryColor || '#EC4899';

  const sortedSections = useMemo(() => (website?.sections || []).slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0)), [website]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-3xl">
          <CardContent className="p-10 text-center text-muted-foreground">Carregando site...</CardContent>
        </Card>
      </div>
    );
  }

  if (!website) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-3xl">
          <CardContent className="p-10 text-center text-muted-foreground">Site não encontrado</CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground" style={{ fontFamily: website.settings.fontFamily || 'Inter' }}>
      <Helmet>
        <title>{`${website.title} | Site`}</title>
        <meta name="description" content={website.description || website.title} />
        <link rel="canonical" href={`${window.location.origin}/site/${website.slug}`} />
      </Helmet>
      <header className="w-full border-b">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {website.settings.logo && (
              <img src={website.settings.logo} alt={`Logo ${website.title}`} className="h-8 w-auto" />
            )}
            <span className="font-bold">{website.title}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button style={{ background: Primary, borderColor: Primary }} className="text-white">Contato</Button>
          </div>
        </div>
      </header>

      <main>
        {sortedSections.map((section) => (
          <SectionRenderer key={section.id} section={section} primary={Primary} secondary={Secondary} />
        ))}
      </main>

      <footer className="border-t mt-12">
        <div className="max-w-6xl mx-auto px-4 py-8 text-sm text-muted-foreground">
          © {new Date().getFullYear()} {website.title}
        </div>
      </footer>
    </div>
  );
}

function SectionRenderer({ section, primary, secondary }: { section: Section; primary: string; secondary: string }) {
  const c = section.content || {};
  switch (section.type) {
    case 'hero':
      return (
        <section className="border-b">
          <div className="max-w-6xl mx-auto px-4 py-16 grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h1 className="text-4xl font-bold mb-4" style={{ color: primary }}>{c.title}</h1>
              {c.subtitle && <p className="text-lg text-muted-foreground mb-6">{c.subtitle}</p>}
              {c.buttonText && (
                <a href={c.buttonLink || '#'}>
                  <Button style={{ background: primary }} className="text-white">{c.buttonText}</Button>
                </a>
              )}
            </div>
            {c.backgroundImage && (
              <img src={c.backgroundImage} alt={c.title || 'Hero'} className="rounded-xl w-full h-auto" loading="lazy" />
            )}
          </div>
        </section>
      );
    case 'about':
      return (
        <section className="border-b">
          <div className="max-w-6xl mx-auto px-4 py-12 grid md:grid-cols-2 gap-8 items-center">
            {c.image && <img src={c.image} alt="Sobre" className="rounded-xl w-full h-auto" loading="lazy" />}
            <div>
              <h2 className="text-3xl font-bold mb-4">{c.title}</h2>
              <p className="text-muted-foreground whitespace-pre-line">{c.content}</p>
            </div>
          </div>
        </section>
      );
    case 'services':
    case 'features':
      return (
        <section className="border-b">
          <div className="max-w-6xl mx-auto px-4 py-12">
            <h2 className="text-3xl font-bold mb-6">{c.title}</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {(c.items || []).map((item: any, i: number) => (
                <Card key={i} className="p-6">
                  <CardContent className="space-y-2 p-0">
                    <h3 className="font-semibold text-lg">{item.title}</h3>
                    <p className="text-muted-foreground">{item.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      );
    case 'testimonials':
      return (
        <section className="border-b bg-muted/30">
          <div className="max-w-6xl mx-auto px-4 py-12">
            <h2 className="text-3xl font-bold mb-6">{c.title}</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {(c.items || []).map((item: any, i: number) => (
                <Card key={i} className="p-6">
                  <CardContent className="space-y-2 p-0">
                    <p className="">“{item.text}”</p>
                    <p className="text-sm text-muted-foreground">— {item.name}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      );
    case 'gallery':
      return (
        <section className="border-b">
          <div className="max-w-6xl mx-auto px-4 py-12">
            <h2 className="text-3xl font-bold mb-6">{c.title}</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {(c.images || []).map((src: string, i: number) => (
                <img key={i} src={src} alt={`Imagem ${i + 1}`} className="w-full h-40 object-cover rounded" loading="lazy" />
              ))}
            </div>
          </div>
        </section>
      );
    case 'contact':
      return (
        <section className="border-b">
          <div className="max-w-6xl mx-auto px-4 py-12 grid md:grid-cols-3 gap-6">
            <Card className="p-6 col-span-2">
              <CardContent className="space-y-3 p-0">
                <input className="w-full border rounded px-3 py-2" placeholder="Seu nome" />
                <input className="w-full border rounded px-3 py-2" placeholder="Seu email" />
                <textarea className="w-full border rounded px-3 py-2" placeholder="Mensagem" rows={4} />
                <Button style={{ background: secondary }} className="text-white">Enviar</Button>
              </CardContent>
            </Card>
            <div>
              <h3 className="font-semibold mb-2">Contato</h3>
              <p className="text-sm text-muted-foreground">{c.email}</p>
              <p className="text-sm text-muted-foreground">{c.phone}</p>
              <p className="text-sm text-muted-foreground">{c.address}</p>
            </div>
          </div>
        </section>
      );
    case 'cta':
      return (
        <section className="border-b">
          <div className="max-w-6xl mx-auto px-4 py-16 text-center">
            <h2 className="text-3xl font-bold mb-4">{c.title}</h2>
            <Button style={{ background: primary }} className="text-white">{c.buttonText}</Button>
          </div>
        </section>
      );
    default:
      return null;
  }
}