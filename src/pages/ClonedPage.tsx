import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

export default function ClonedPage() {
  const { slug } = useParams<{ slug: string }>();
  const [pageData, setPageData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPage = async () => {
      if (!slug) return;

      try {
        // Fetch page data
        const { data: page, error: pageError } = await supabase
          .from('cloned_pages')
          .select('*')
          .eq('slug', slug)
          .eq('is_active', true)
          .single();

        if (pageError) throw pageError;

        if (!page) {
          setError('Página não encontrada');
          setLoading(false);
          return;
        }

        setPageData(page);

        // Track click
        const visitorId = localStorage.getItem('visitor_id') || 
          crypto.randomUUID();
        localStorage.setItem('visitor_id', visitorId);

        await supabase.from('cloned_page_clicks').insert({
          page_id: page.id,
          visitor_id: visitorId,
          ip_address: null,
          user_agent: navigator.userAgent,
          referrer: document.referrer || null,
        });

        setLoading(false);
      } catch (err: any) {
        console.error('Error loading page:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    loadPage();
  }, [slug]);

  useEffect(() => {
    if (!pageData || !pageData.page_content) return;

    // Inject custom settings
    const settings = pageData.custom_settings || {};
    let modifiedHtml = pageData.page_content;

    // Replace custom links
    if (settings.custom_links && settings.custom_links.length > 0) {
      const parser = new DOMParser();
      const doc = parser.parseFromString(modifiedHtml, 'text/html');
      
      settings.custom_links.forEach((link: any) => {
        const elements = doc.querySelectorAll(link.selector);
        elements.forEach((el: any) => {
          el.href = link.newUrl;
        });
      });
      
      modifiedHtml = doc.documentElement.outerHTML;
    }

    // Add UTM parameters to all links
    if (settings.utm_params) {
      const params = new URLSearchParams();
      Object.entries(settings.utm_params).forEach(([key, value]) => {
        if (value) params.append(key, value as string);
      });
      
      if (params.toString()) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(modifiedHtml, 'text/html');
        const links = doc.querySelectorAll('a[href]');
        
        links.forEach((link: any) => {
          try {
            const url = new URL(link.href);
            params.forEach((value, key) => {
              url.searchParams.append(key, value);
            });
            link.href = url.toString();
          } catch (e) {
            // Skip invalid URLs
          }
        });
        
        modifiedHtml = doc.documentElement.outerHTML;
      }
    }

    // Inject header code
    if (settings.header_code) {
      modifiedHtml = modifiedHtml.replace('</head>', `${settings.header_code}</head>`);
    }

    // Inject tracking pixels
    if (settings.tracking_pixels) {
      modifiedHtml = modifiedHtml.replace('</head>', `${settings.tracking_pixels}</head>`);
    }

    // Inject footer code
    if (settings.footer_code) {
      modifiedHtml = modifiedHtml.replace('</body>', `${settings.footer_code}</body>`);
    }

    // Inject WhatsApp button
    if (settings.whatsapp_button?.enabled && settings.whatsapp_button?.phone) {
      const whatsappHtml = `
        <a 
          href="https://wa.me/${settings.whatsapp_button.phone}${settings.whatsapp_button.message ? '?text=' + encodeURIComponent(settings.whatsapp_button.message) : ''}"
          target="_blank"
          rel="noopener noreferrer"
          style="position: fixed; ${getWhatsAppPosition(settings.whatsapp_button.position)}; z-index: 9999; background: #25D366; color: white; padding: 15px; border-radius: 50px; box-shadow: 0 4px 12px rgba(37, 211, 102, 0.4); display: flex; align-items: center; gap: 10px; text-decoration: none; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-weight: 500; transition: all 0.3s ease;"
          onmouseover="this.style.transform='scale(1.05)'; this.style.boxShadow='0 6px 20px rgba(37, 211, 102, 0.6)';"
          onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='0 4px 12px rgba(37, 211, 102, 0.4)';"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" fill="currentColor"/>
          </svg>
          <span style="font-size: 14px;">Fale Conosco</span>
        </a>
      `;
      modifiedHtml = modifiedHtml.replace('</body>', `${whatsappHtml}</body>`);
    }

    // Write the modified HTML to iframe
    const iframe = document.getElementById('page-frame') as HTMLIFrameElement;
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.document.open();
      iframe.contentWindow.document.write(modifiedHtml);
      iframe.contentWindow.document.close();
    }
  }, [pageData]);

  const getWhatsAppPosition = (position: string) => {
    switch (position) {
      case 'bottom-left':
        return 'bottom: 20px; left: 20px;';
      case 'top-right':
        return 'top: 20px; right: 20px;';
      case 'top-left':
        return 'top: 20px; left: 20px;';
      default:
        return 'bottom: 20px; right: 20px;';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando página...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Erro</h1>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <iframe
      id="page-frame"
      title="Cloned Page"
      style={{
        width: '100%',
        height: '100vh',
        border: 'none',
        margin: 0,
        padding: 0,
      }}
    />
  );
}