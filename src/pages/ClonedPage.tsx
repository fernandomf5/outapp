import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

export default function ClonedPage() {
  const { slug } = useParams<{ slug: string }>();
  const [pageData, setPageData] = useState<any>(null);
  const [renderHtml, setRenderHtml] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPage = async () => {
      if (!slug) {
        console.error('No slug provided');
        setError('URL inválida');
        setLoading(false);
        return;
      }

      console.log('Loading cloned page with slug:', slug);

      try {
        const hostname = window.location.hostname;
        const pathSegment = window.location.pathname.split('/')[1];
        
        let searchDomain = '';
        
        // Primeiro verifica se é um domínio personalizado cadastrado
        const { data: customDomain } = await supabase
          .from('user_domains')
          .select('domain')
          .eq('domain', hostname)
          .eq('is_verified', true)
          .eq('is_active', true)
          .maybeSingle();

        if (customDomain) {
          searchDomain = hostname;
        } else {
          // Verifica se é um page path (page1, page2, etc)
          const pagePathPattern = /^page[1-5]$/;
          if (pagePathPattern.test(pathSegment)) {
            searchDomain = pathSegment;
          }
        }
        
        if (!searchDomain) {
          console.error('Invalid domain or page path');
          setError('Domínio não configurado');
          setLoading(false);
          return;
        }
        
        console.log('Search params:', { slug, searchDomain, hostname, pathSegment });

        // Fetch page data - buscar por slug E custom_domain
        const { data: page, error: pageError } = await supabase
          .from('cloned_pages')
          .select('*')
          .eq('slug', slug)
          .eq('custom_domain', searchDomain)
          .eq('is_active', true)
          .maybeSingle();

        console.log('Page query result:', { page, pageError });

        if (pageError) {
          console.error('Supabase error:', pageError);
          throw pageError;
        }

        if (!page) {
          console.error('Page not found for slug:', slug);
          setError('Página não encontrada ou inativa');
          setLoading(false);
          return;
        }

        if (!page.page_content) {
          console.error('Page has no content');
          setError('Esta página não tem conteúdo');
          setLoading(false);
          return;
        }

        console.log('Page loaded successfully, content length:', page.page_content.length);
        setPageData(page);

        // Track click
        try {
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
        } catch (clickError) {
          console.error('Error tracking click:', clickError);
          // Don't fail the page load if click tracking fails
        }

        setLoading(false);
      } catch (err: any) {
        console.error('Error loading page:', err);
        setError(err.message || 'Erro ao carregar página');
        setLoading(false);
      }
    };

    loadPage();
  }, [slug]);

  useEffect(() => {
    if (!pageData || !pageData.page_content) {
      console.log('Waiting for page data...');
      return;
    }

    console.log('Injecting page content into iframe');

    // Inject custom settings
    const settings = pageData.custom_settings || {};
    let modifiedHtml = pageData.page_content as string;

    try {
      // Build a DOM we can safely modify
      const parser = new DOMParser();
      const doc = parser.parseFromString(modifiedHtml, 'text/html');

      // Add lazy loading to images and iframes for better performance
      doc.querySelectorAll('img').forEach((img: any) => {
        img.setAttribute('loading', 'lazy');
        img.setAttribute('decoding', 'async');
      });
      
      doc.querySelectorAll('iframe').forEach((iframe: any) => {
        iframe.setAttribute('loading', 'lazy');
      });

      // Add preconnect for common CDNs to speed up resource loading
      const head = doc.querySelector('head');
      const commonCdns = [
        'https://fonts.googleapis.com',
        'https://fonts.gstatic.com',
        'https://cdnjs.cloudflare.com',
        'https://cdn.jsdelivr.net'
      ];
      
      commonCdns.forEach(cdn => {
        const link = doc.createElement('link');
        link.rel = 'preconnect';
        link.href = cdn;
        link.crossOrigin = 'anonymous';
        head?.appendChild(link);
      });

      // 1) Prepare original origin and rewrite internal links to stay on the cloned page
      const baseOrigin = (() => {
        try { return new URL(pageData.original_url).origin; } catch { return ''; }
      })();

      // Rewrite same-origin links: use traffic link (sales page backup) or anchors
      const trafficLink = settings.traffic_tracking_link || '';
      doc.querySelectorAll('a[href]').forEach((a: any) => {
        const href = a.getAttribute('href') || '';
        try {
          const u = new URL(href, baseOrigin || undefined);
          if (baseOrigin && u.origin === baseOrigin) {
            if (u.hash) {
              // Keep anchor links working
              a.setAttribute('href', u.hash);
              a.setAttribute('target', '_self');
            } else if (trafficLink) {
              // Redirect to sales page backup instead of original site
              a.setAttribute('href', trafficLink);
              a.setAttribute('target', '_blank');
              a.setAttribute('rel', 'noopener noreferrer');
            } else {
              // No traffic link configured, keep on same page
              a.setAttribute('href', '#');
              a.setAttribute('target', '_self');
            }
          }
        } catch {}
      });

      // 2) Apply checkout link replacements (robust URL normalization)
      if (settings.detected_checkout_links && settings.detected_checkout_links.length > 0) {
        const resolve = (u: string) => {
          try { return new URL(u, baseOrigin || undefined).href; } catch { return u; }
        };
        settings.detected_checkout_links.forEach((linkConfig: any) => {
          if (linkConfig.replaced && linkConfig.newUrl && linkConfig.originalUrl) {
            const targetResolved = resolve(linkConfig.originalUrl);
            let targetKey = targetResolved;
            try {
              const tu = new URL(targetResolved);
              targetKey = tu.origin + tu.pathname; // ignore query/hash when matching
            } catch {}
            const links = doc.querySelectorAll('a[href]');
            links.forEach((link: any) => {
              const href = link.getAttribute('href') || '';
              const currentResolved = resolve(href);
              let currentKey = currentResolved;
              try {
                const cu = new URL(currentResolved);
                currentKey = cu.origin + cu.pathname;
              } catch {}
              if (currentKey === targetKey || currentResolved === targetResolved) {
                link.setAttribute('href', linkConfig.newUrl);
                link.setAttribute('target', '_blank');
                link.setAttribute('rel', 'noopener noreferrer');
              }
            });
          }
        });
      }

      // (UTM desativado conforme solicitação do cliente)
      // Nenhuma UTM será adicionada automaticamente aos links.

      // 4) Normalize anchors target and security
      doc.querySelectorAll('a').forEach((a: any) => {
        const t = (a.getAttribute('target') || '').toLowerCase();
        if (t === '_top' || t === '_parent') a.setAttribute('target', '_self');
        a.setAttribute('rel', 'noopener noreferrer');
      });

      // 5) Remove meta refresh redirects e CSP inline
      doc.querySelectorAll('meta[http-equiv="refresh" i]').forEach((m) => m.parentElement?.removeChild(m));
      doc.querySelectorAll('meta[http-equiv="content-security-policy" i], meta[content*="Content-Security-Policy" i]').forEach((m) => m.parentElement?.removeChild(m));

      // 6) Inject pixels/header/footer
      if (settings.header_code) {
        head?.insertAdjacentHTML('beforeend', settings.header_code);
      }
      if (settings.tracking_pixels) {
        head?.insertAdjacentHTML('beforeend', settings.tracking_pixels);
      }
      if (settings.footer_code) {
        const body = doc.querySelector('body');
        body?.insertAdjacentHTML('beforeend', settings.footer_code);
      }

      // WhatsApp button injection removida (recurso desativado)

      // 7.1) Inject Countdown Timer
      if (settings.countdown_timer?.enabled && settings.countdown_timer?.end_date) {
        const body = doc.querySelector('body');
        const position = settings.countdown_timer.position === 'top' ? 'top: 0;' : 'bottom: 0;';
        const timerHtml = `
          <div id="countdown-timer" style="position: fixed; ${position} left: 0; right: 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 20px; text-align: center; z-index: 9999999; box-shadow: 0 4px 12px rgba(0,0,0,0.3); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
            <div style="max-width: 1200px; margin: 0 auto;">
              <div style="font-weight: 600; margin-bottom: 8px; font-size: 14px;">${settings.countdown_timer.message}</div>
              <div id="timer-display" style="font-size: 24px; font-weight: 700; letter-spacing: 1px;"></div>
            </div>
          </div>
          <script>
            (function() {
              var endDate = new Date('${settings.countdown_timer.end_date}').getTime();
              var expiredMsg = '${settings.countdown_timer.expired_message}';
              var timerEl = document.getElementById('timer-display');
              
              function updateTimer() {
                var now = new Date().getTime();
                var distance = endDate - now;
                
                if (distance < 0) {
                  timerEl.innerHTML = expiredMsg;
                  return;
                }
                
                var days = Math.floor(distance / (1000 * 60 * 60 * 24));
                var hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
                var seconds = Math.floor((distance % (1000 * 60)) / 1000);
                
                timerEl.innerHTML = days + 'd ' + hours + 'h ' + minutes + 'm ' + seconds + 's';
                setTimeout(updateTimer, 1000);
              }
              
              updateTimer();
            })();
          </script>
        `;
        body?.insertAdjacentHTML('beforeend', timerHtml);
      }

      // 7.2) Inject Exit Intent Popup
      if (settings.exit_intent?.enabled) {
        const body = doc.querySelector('body');
        const exitIntentHtml = `
          <div id="exit-intent-popup" style="display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.8); z-index: 999999999; justify-content: center; align-items: center; animation: fadeIn 0.3s ease;">
            <div style="background: white; border-radius: 16px; padding: 40px; max-width: 500px; width: 90%; text-align: center; box-shadow: 0 20px 60px rgba(0,0,0,0.3); animation: slideUp 0.3s ease;">
              <h2 style="font-size: 32px; font-weight: 700; margin-bottom: 16px; color: #1a202c; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">${settings.exit_intent.title}</h2>
              <p style="font-size: 18px; color: #4a5568; margin-bottom: 32px; line-height: 1.6;">${settings.exit_intent.message}</p>
              <div style="display: flex; gap: 12px; justify-content: center;">
                <a href="${settings.exit_intent.button_link}" target="_blank" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 16px 32px; border-radius: 8px; font-weight: 600; text-decoration: none; font-size: 16px; transition: transform 0.2s;">${settings.exit_intent.button_text}</a>
                <button onclick="document.getElementById('exit-intent-popup').style.display='none'" style="background: #e2e8f0; color: #4a5568; padding: 16px 32px; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 16px;">Fechar</button>
              </div>
            </div>
          </div>
          <style>
            @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            @keyframes slideUp { from { transform: translateY(50px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
          </style>
          <script>
            (function() {
              var shown = false;
              document.addEventListener('mouseout', function(e) {
                if (!shown && e.clientY <= 0) {
                  shown = true;
                  document.getElementById('exit-intent-popup').style.display = 'flex';
                }
              });
            })();
          </script>
        `;
        body?.insertAdjacentHTML('beforeend', exitIntentHtml);
      }

      // 7.3) Inject Social Proof Notifications
      if (settings.social_proof?.enabled && settings.social_proof?.notifications?.length > 0) {
        const body = doc.querySelector('body');
        const notificationsJson = JSON.stringify(settings.social_proof.notifications);
        const socialProofHtml = `
          <div id="social-proof-container" style="position: fixed; bottom: 20px; left: 20px; z-index: 99999999; max-width: 350px;"></div>
          <script>
            (function() {
              var notifications = ${notificationsJson};
              var container = document.getElementById('social-proof-container');
              var index = 0;
              
              function showNotification() {
                if (index >= notifications.length) index = 0;
                var notif = notifications[index];
                
                var div = document.createElement('div');
                div.style.cssText = 'background: white; padding: 16px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); margin-bottom: 12px; animation: slideInLeft 0.5s ease, fadeOut 0.5s ease 4.5s; font-family: -apple-system, BlinkMacSystemFont, \\'Segoe UI\\', Roboto, sans-serif; border-left: 4px solid #10b981;';
                div.innerHTML = '<div style="display: flex; align-items: center; gap: 12px;"><div style="width: 8px; height: 8px; background: #10b981; border-radius: 50%; animation: pulse 2s ease infinite;"></div><div style="font-size: 14px; color: #1a202c; font-weight: 500;">' + notif.message + '</div></div>';
                
                container.appendChild(div);
                setTimeout(function() { div.remove(); }, 5000);
                
                index++;
                setTimeout(showNotification, (notif.delay || 5) * 1000 + 5000);
              }
              
              setTimeout(showNotification, 3000);
            })();
          </script>
          <style>
            @keyframes slideInLeft { from { transform: translateX(-100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
            @keyframes fadeOut { to { opacity: 0; transform: translateX(-20px); } }
            @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
          </style>
        `;
        body?.insertAdjacentHTML('beforeend', socialProofHtml);
      }

      // 7.4) Inject Lead Capture Form
      if (settings.lead_capture?.enabled) {
        const body = doc.querySelector('body');
        const fields = settings.lead_capture.fields || ['name', 'email'];
        const fieldsHtml = fields.map(field => {
          const label = field === 'name' ? 'Nome' : field === 'email' ? 'Email' : 'Telefone';
          const type = field === 'email' ? 'email' : field === 'phone' ? 'tel' : 'text';
          const required = field === 'email' ? 'required' : '';
          return '<input type="' + type + '" name="' + field + '" placeholder="' + label + '" ' + required + ' style="width: 100%; padding: 14px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 15px; margin-bottom: 12px;">';
        }).join('');
        
        const leadCaptureHtml = `
          <div id="lead-capture-form" style="display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.85); z-index: 999999999; justify-content: center; align-items: center; animation: fadeIn 0.3s ease;">
            <div style="background: white; border-radius: 16px; padding: 40px; max-width: 450px; width: 90%; box-shadow: 0 20px 60px rgba(0,0,0,0.3);">
              <h2 style="font-size: 28px; font-weight: 700; margin-bottom: 12px; color: #1a202c; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">${settings.lead_capture.title}</h2>
              <p style="font-size: 16px; color: #4a5568; margin-bottom: 24px;">${settings.lead_capture.description}</p>
              <form id="lead-form" style="margin-bottom: 16px;">
                ${fieldsHtml}
                <button type="submit" style="width: 100%; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 16px; border: none; border-radius: 8px; font-weight: 600; font-size: 16px; cursor: pointer; transition: transform 0.2s;">${settings.lead_capture.button_text}</button>
              </form>
              <button onclick="document.getElementById('lead-capture-form').style.display='none'" style="width: 100%; background: transparent; color: #718096; border: none; padding: 8px; cursor: pointer; font-size: 14px;">Fechar</button>
            </div>
          </div>
          <script>
            (function() {
              var form = document.getElementById('lead-form');
              var popup = document.getElementById('lead-capture-form');
              var shown = false;
              var trigger = '${settings.lead_capture.trigger}';
              var triggerValue = ${settings.lead_capture.trigger_value || 5};
              var pageId = '${pageData.id}';
              
              function showPopup() {
                if (!shown) {
                  shown = true;
                  popup.style.display = 'flex';
                }
              }
              
              // Triggers
              if (trigger === 'exit_intent') {
                document.addEventListener('mouseout', function(e) {
                  if (!shown && e.clientY <= 0) showPopup();
                });
              } else if (trigger === 'time_delay') {
                setTimeout(showPopup, triggerValue * 1000);
              } else if (trigger === 'scroll') {
                window.addEventListener('scroll', function() {
                  var scrollPercent = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
                  if (!shown && scrollPercent >= triggerValue) showPopup();
                });
              }
              
              // Form submission
              form.addEventListener('submit', async function(e) {
                e.preventDefault();
                var formData = new FormData(form);
                var data = { page_id: pageId };
                formData.forEach((value, key) => { data[key] = value; });
                
                try {
                  // Save to Supabase
                  await fetch('https://mlocikcfxbleddsvxciv.supabase.co/rest/v1/cloned_page_leads', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1sb2Npa2NmeGJsZWRkc3Z4Y2l2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAxMjcxOTYsImV4cCI6MjA3NTcwMzE5Nn0.BN-spC1ijxlrQahDRaRDcx2Y50Q_0H5eY0UpIaNLDyg'
                    },
                    body: JSON.stringify(data)
                  });
                  
                  popup.innerHTML = '<div style="background: white; border-radius: 16px; padding: 40px; text-align: center;"><h2 style="font-size: 24px; color: #10b981; margin-bottom: 16px;">✓</h2><p style="font-size: 18px; color: #1a202c;">${settings.lead_capture.success_message}</p></div>';
                  
                  setTimeout(function() {
                    popup.style.display = 'none';
                  }, 2000);
                } catch (error) {
                  console.error('Error saving lead:', error);
                }
              });
            })();
          </script>
        `;
        body?.insertAdjacentHTML('beforeend', leadCaptureHtml);
      }

      // 7.5) Inject Analytics Tracking
      const analyticsScript = doc.createElement('script');
      analyticsScript.textContent = `
        (function() {
          var pageId = '${pageData.id}';
          var sessionId = Date.now() + '-' + Math.random().toString(36).substr(2, 9);
          var visitorId = localStorage.getItem('visitor_id') || (function() {
            var id = crypto.randomUUID();
            localStorage.setItem('visitor_id', id);
            return id;
          })();
          var startTime = Date.now();
          var maxScroll = 0;
          
          // Detect device
          var deviceType = /Mobile|Android|iPhone/i.test(navigator.userAgent) ? 'mobile' : 
                          /Tablet|iPad/i.test(navigator.userAgent) ? 'tablet' : 'desktop';
          
          // Track scroll
          window.addEventListener('scroll', function() {
            var scrollPercent = Math.round((window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100);
            if (scrollPercent > maxScroll) maxScroll = scrollPercent;
          });
          
          // Send analytics on page unload
          window.addEventListener('beforeunload', function() {
            var timeOnPage = Math.round((Date.now() - startTime) / 1000);
            var data = {
              page_id: pageId,
              visitor_id: visitorId,
              session_id: sessionId,
              time_on_page: timeOnPage,
              scroll_depth: maxScroll,
              device_type: deviceType,
              user_agent: navigator.userAgent,
              referrer: document.referrer || null
            };
            
            // Use sendBeacon for reliable tracking on page exit
            navigator.sendBeacon(
              'https://mlocikcfxbleddsvxciv.supabase.co/rest/v1/cloned_page_analytics',
              JSON.stringify(data)
            );
          });
        })();
      `;
      head?.appendChild(analyticsScript);

      // 8) Block top-level navigation attempts inside iframe
      const blocker = doc.createElement('script');
      blocker.textContent = `try { Object.defineProperty(window, 'top', { get: () => window }); } catch (e) {}\n` +
        `try { window.location.assign = function(){ console.log('blocked assign'); }; } catch(e) {}\n` +
        `try { window.location.replace = function(){ console.log('blocked replace'); }; } catch(e) {}\n` +
        // Intercept clicks: handle anchors smoothly, let sales backup links open
        `document.addEventListener('click', function(e){\n` +
        `  try {\n` +
        `    var a = e.target && e.target.closest ? e.target.closest('a') : null;\n` +
        `    if (!a) return;\n` +
        `    var href = a.getAttribute('href') || '';\n` +
        `    if (!href) return;\n` +
        `    var origin = '${baseOrigin}';\n` +
        `    var trafficLink = '${trafficLink}';\n` +
        `    var url;\n` +
        `    try { url = new URL(href, origin || undefined); } catch (ex) { return; }\n` +
        `    if (origin && url.origin === origin) {\n` +
        `      // If it's an anchor link, handle smooth scroll\n` +
        `      if (url.hash) {\n` +
        `        e.preventDefault();\n` +
        `        var id = decodeURIComponent(url.hash.slice(1));\n` +
        `        try {\n` +
        `          var el = document.getElementById(id) || document.querySelector('[name="' + CSS.escape(id) + '"]') || document.querySelector('#' + CSS.escape(id));\n` +
        `          if (el) {\n` +
        `            el.scrollIntoView({ behavior: 'smooth' });\n` +
        `            if (history && history.replaceState) { history.replaceState(null, '', url.hash); }\n` +
        `          }\n` +
        `        } catch(_) {}\n` +
        `      } else if (trafficLink) {\n` +
        `        // Redirect to sales backup page instead of original\n` +
        `        e.preventDefault();\n` +
        `        window.open(trafficLink, '_blank');\n` +
        `      } else {\n` +
        `        // No traffic link, prevent navigation\n` +
        `        e.preventDefault();\n` +
        `      }\n` +
        `    }\n` +
        `  } catch(_) {}\n` +
        `}, true);`;
      head?.appendChild(blocker);

      modifiedHtml = '<!DOCTYPE html>' + doc.documentElement.outerHTML;

    } catch (e) {
      console.warn('Failed to parse/modify HTML, falling back to raw');
    }

    setRenderHtml(modifiedHtml);
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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-md p-8">
          <h1 className="text-2xl font-bold mb-2">Página não encontrada</h1>
          <p className="text-muted-foreground mb-4">{error}</p>
          <p className="text-sm text-muted-foreground">
            Verifique se o link está correto ou se a página está ativa.
          </p>
        </div>
      </div>
    );
  }

  if (!pageData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Preparando página...</p>
        </div>
      </div>
    );
  }

  return (
    <iframe
      id="page-frame"
      title="Cloned Page"
      srcDoc={renderHtml}
      sandbox="allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation allow-modals allow-same-origin"
      loading="eager"
      style={{
        width: '100%',
        height: '100vh',
        border: 'none',
        margin: 0,
        padding: 0,
        display: 'block',
        colorScheme: 'normal',
      }}
    />
  );
}