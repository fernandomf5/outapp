import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { Helmet } from "react-helmet-async";

interface BuilderPage {
  id: string;
  name: string;
  slug: string;
  elements: any[];
  settings: {
    title: string;
    description: string;
    favicon: string;
    ogImage: string;
    customCss: string;
    customJs: string;
    bodyClass: string;
    backgroundColor: string;
    fontFamily: string;
  };
  is_published: boolean;
}

const BuilderPagePublic = () => {
  const { slug } = useParams<{ slug: string }>();
  const [page, setPage] = useState<BuilderPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (slug) {
      fetchPage();
    }
  }, [slug]);

  const fetchPage = async () => {
    try {
      const { data, error } = await supabase
        .from('builder_pages')
        .select('*')
        .eq('slug', slug)
        .eq('is_published', true)
        .single();

      if (error || !data) {
        setNotFound(true);
        return;
      }

      // Increment view count
      await supabase
        .from('builder_pages')
        .update({ views_count: (data as any).views_count + 1 })
        .eq('id', (data as any).id);

      const pageData = data as any;
      setPage({
        id: pageData.id,
        name: pageData.name,
        slug: pageData.slug,
        elements: pageData.elements || [],
        settings: pageData.settings || {},
        is_published: pageData.is_published
      });
    } catch (error) {
      console.error('Error fetching page:', error);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  const renderElement = (element: any): React.ReactNode => {
    const styles = element.styles || {};
    const settings = element.settings || {};

    const renderChildren = () => {
      if (!element.children || element.children.length === 0) return null;
      return element.children.map((child: any, index: number) => (
        <div key={child.id || index}>{renderElement(child)}</div>
      ));
    };

    switch (element.type) {
      case 'section':
        return (
          <section style={styles}>
            {renderChildren()}
          </section>
        );

      case 'row':
        return (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', ...styles }}>
            {renderChildren()}
          </div>
        );

      case 'column':
        return (
          <div style={{ flex: '1', minWidth: '250px', ...styles }}>
            {renderChildren()}
          </div>
        );

      case 'heading':
      case 'text':
        return (
          <div 
            style={styles}
            dangerouslySetInnerHTML={{ __html: element.content }}
          />
        );

      case 'image':
        const imgSrc = settings.src || 'https://via.placeholder.com/800x400';
        if (settings.link) {
          return (
            <a href={settings.link} target="_blank" rel="noopener noreferrer">
              <img src={imgSrc} alt={settings.alt || ''} style={{ maxWidth: '100%', ...styles }} />
            </a>
          );
        }
        return <img src={imgSrc} alt={settings.alt || ''} style={{ maxWidth: '100%', ...styles }} />;

      case 'video':
        const videoSrc = settings.src || '';
        if (settings.type === 'youtube' && videoSrc) {
          const videoId = videoSrc.includes('youtu.be') 
            ? videoSrc.split('/').pop()?.split('?')[0]
            : new URLSearchParams(new URL(videoSrc).search).get('v');
          return (
            <iframe
              src={`https://www.youtube.com/embed/${videoId}${settings.autoplay ? '?autoplay=1' : ''}`}
              style={{ width: '100%', aspectRatio: '16/9', border: 'none', ...styles }}
              allowFullScreen
            />
          );
        }
        return (
          <video 
            src={videoSrc} 
            controls 
            autoPlay={settings.autoplay}
            style={{ width: '100%', ...styles }} 
          />
        );

      case 'button':
        return (
          <a 
            href={settings.link || '#'} 
            target={settings.target || '_self'}
            style={{ textDecoration: 'none', display: 'inline-block', ...styles }}
          >
            {element.content}
          </a>
        );

      case 'spacer':
        return <div style={{ height: styles.height || '40px' }} />;

      case 'divider':
        return <hr style={{ border: 'none', borderTop: '2px solid #e5e7eb', margin: '20px 0', ...styles }} />;

      case 'icon':
        return (
          <div style={{ textAlign: 'center', ...styles }}>
            <span style={{ fontSize: styles.fontSize || '48px' }}>{element.content || '⭐'}</span>
          </div>
        );

      case 'html':
        return <div dangerouslySetInnerHTML={{ __html: element.content }} style={styles} />;

      case 'countdown':
        return (
          <div style={{ textAlign: 'center', ...styles }}>
            <p style={{ marginBottom: '12px' }}>{settings.message || 'Oferta termina em:'}</p>
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
              {['Dias', 'Horas', 'Min', 'Seg'].map((label) => (
                <div key={label} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', background: '#f1f5f9', padding: '8px 16px', borderRadius: '8px' }}>00</div>
                  <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>{label}</span>
                </div>
              ))}
            </div>
          </div>
        );

      case 'testimonial':
        return (
          <div style={styles}>
            <div style={{ display: 'flex', gap: '4px', marginBottom: '12px' }}>
              {Array.from({ length: settings.rating || 5 }).map((_, i) => (
                <span key={i} style={{ color: '#facc15' }}>★</span>
              ))}
            </div>
            <p style={{ fontStyle: 'italic', marginBottom: '16px' }}>"{element.content}"</p>
            <p style={{ fontWeight: '600' }}>{settings.author || 'Cliente'}</p>
          </div>
        );

      case 'pricing':
        return (
          <div style={{ textAlign: 'center', ...styles }}>
            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '8px' }}>
              {settings.currency || 'R$'}{settings.price || '97'}
              <span style={{ fontSize: '1rem', fontWeight: 'normal', color: '#6b7280' }}>{settings.period || '/mês'}</span>
            </div>
            <ul style={{ textAlign: 'left', marginBottom: '24px', listStyle: 'none', padding: 0 }}>
              {(settings.features || ['Recurso 1', 'Recurso 2']).map((feature: string, i: number) => (
                <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <span style={{ color: '#22c55e' }}>✓</span> {feature}
                </li>
              ))}
            </ul>
            <a 
              href={settings.buttonLink || '#'} 
              style={{ 
                display: 'block', 
                padding: '12px 24px', 
                backgroundColor: '#3b82f6', 
                color: 'white', 
                textDecoration: 'none',
                borderRadius: '8px',
                fontWeight: '600'
              }}
            >
              {settings.buttonText || 'Assinar Agora'}
            </a>
          </div>
        );

      case 'faq':
        return (
          <div style={styles}>
            {(settings.items || [{ question: 'Pergunta?', answer: 'Resposta.' }]).map((item: any, i: number) => (
              <div key={i} style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '16px', marginBottom: '12px' }}>
                <p style={{ fontWeight: '600', marginBottom: '8px' }}>{item.question}</p>
                <p style={{ color: '#6b7280' }}>{item.answer}</p>
              </div>
            ))}
          </div>
        );

      default:
        return <div style={styles}>{element.content}</div>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (notFound || !page) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <h1 className="text-4xl font-bold mb-4">404</h1>
        <p className="text-muted-foreground">Página não encontrada</p>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{page.settings?.title || page.name}</title>
        {page.settings?.description && (
          <meta name="description" content={page.settings.description} />
        )}
        {page.settings?.ogImage && (
          <meta property="og:image" content={page.settings.ogImage} />
        )}
        {page.settings?.favicon && (
          <link rel="icon" href={page.settings.favicon} />
        )}
      </Helmet>

      <div 
        className={page.settings?.bodyClass || ''}
        style={{
          backgroundColor: page.settings?.backgroundColor || '#ffffff',
          fontFamily: page.settings?.fontFamily || 'Inter, sans-serif',
          minHeight: '100vh'
        }}
      >
        {page.elements.map((element, index) => (
          <div key={element.id || index}>
            {renderElement(element)}
          </div>
        ))}
      </div>

      {page.settings?.customCss && (
        <style dangerouslySetInnerHTML={{ __html: page.settings.customCss }} />
      )}

      {page.settings?.customJs && (
        <script dangerouslySetInnerHTML={{ __html: page.settings.customJs }} />
      )}
    </>
  );
};

export default BuilderPagePublic;
