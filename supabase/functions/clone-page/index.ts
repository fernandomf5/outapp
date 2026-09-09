const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface CloneAttempt {
  strategy: string;
  ok: boolean;
  detail: string;
  length?: number;
}

const DESKTOP_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
const MOBILE_UA =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1';
const BOT_UA = 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)';

/** A clone is only useful when it actually carries markup. */
function looksLikeUsableHtml(html: string): boolean {
  if (!html) return false;
  const trimmed = html.trim();
  if (trimmed.length < 500) return false;
  return /<html|<body|<div|<section|<main/i.test(trimmed);
}

/** Detects anti-bot interstitials so we can keep trying other strategies. */
function looksLikeBlockPage(html: string): boolean {
  const sample = html.slice(0, 4000).toLowerCase();
  return (
    sample.includes('just a moment') ||
    sample.includes('checking your browser') ||
    sample.includes('cf-browser-verification') ||
    sample.includes('attention required! | cloudflare') ||
    sample.includes('enable javascript and cookies to continue') ||
    sample.includes('access denied') ||
    sample.includes('request unsuccessful. incapsula')
  );
}

async function fetchWithTimeout(input: string, init: RequestInit, ms: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

/** Firecrawl v2 — works with both gateway-backed (lovc_) and direct (fc-) keys. */
async function scrapeWithFirecrawl(
  url: string,
  waitFor: number,
  mobile: boolean,
): Promise<string> {
  const key = Deno.env.get('FIRECRAWL_API_KEY');
  if (!key) throw new Error('FIRECRAWL_API_KEY not configured');

  const isGateway = key.startsWith('lovc_');
  const lovableKey = Deno.env.get('LOVABLE_API_KEY');
  if (isGateway && !lovableKey) throw new Error('LOVABLE_API_KEY not configured for gateway mode');

  const endpoint = isGateway
    ? 'https://connector-gateway.lovable.dev/firecrawl/v2/scrape'
    : 'https://api.firecrawl.dev/v2/scrape';

  const headers: Record<string, string> = isGateway
    ? {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${lovableKey}`,
        'X-Connection-Api-Key': key,
      }
    : { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` };

  const response = await fetchWithTimeout(
    endpoint,
    {
      method: 'POST',
      headers,
      body: JSON.stringify({
        url,
        formats: ['rawHtml', 'html'],
        onlyMainContent: false,
        waitFor,
        timeout: 60000,
        blockAds: false,
        removeBase64Images: false,
        mobile,
        skipTlsVerification: true,
        location: { country: 'BR', languages: ['pt-BR', 'pt', 'en'] },
      }),
    },
    75000,
  );

  const raw = await response.text();
  if (!response.ok) throw new Error(`Firecrawl [${response.status}]: ${raw.slice(0, 300)}`);

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(raw);
  } catch {
    throw new Error('Firecrawl returned a non-JSON body');
  }

  const data = (payload.data ?? payload) as Record<string, unknown>;
  const html = (data.rawHtml as string) || (data.html as string) || '';
  if (!html) throw new Error('Firecrawl returned no HTML');
  return html;
}

/** Plain server-side fetch with browser-like headers. */
async function directFetch(url: string, userAgent: string, referer?: string): Promise<string> {
  const response = await fetchWithTimeout(
    url,
    {
      headers: {
        'User-Agent': userAgent,
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': referer ? 'same-origin' : 'none',
        'Sec-Fetch-User': '?1',
        'Cache-Control': 'no-cache',
        Pragma: 'no-cache',
        ...(referer ? { Referer: referer } : {}),
      },
      redirect: 'follow',
    },
    45000,
  );

  if (!response.ok) throw new Error(`HTTP ${response.status} ${response.statusText}`);
  const html = await response.text();
  if (!html) throw new Error('Empty response body');
  return html;
}

/** Public text/HTML proxy used as a last resort for blocked origins. */
async function proxyFetch(url: string, template: (u: string) => string): Promise<string> {
  const response = await fetchWithTimeout(
    template(url),
    { headers: { 'User-Agent': DESKTOP_UA, Accept: 'text/html,*/*' } },
    45000,
  );
  if (!response.ok) throw new Error(`HTTP ${response.status} ${response.statusText}`);
  const html = await response.text();
  if (!html) throw new Error('Empty proxy body');
  return html;
}

/** Resolve any URL-ish string against the page URL; returns null when not rewritable. */
function absolutize(value: string, pageUrl: string): string | null {
  const raw = value.trim();
  if (!raw) return null;
  if (/^(data:|blob:|about:|mailto:|tel:|sms:|javascript:|#)/i.test(raw)) return null;
  if (/^https?:\/\//i.test(raw)) return raw;
  try {
    if (raw.startsWith('//')) return new URL(`https:${raw}`).toString();
    return new URL(raw, pageUrl).toString();
  } catch {
    return null;
  }
}

const URL_ATTRIBUTES = [
  'src',
  'href',
  'poster',
  'action',
  'data-src',
  'data-lazy-src',
  'data-original',
  'data-bg',
  'data-background',
  'data-background-image',
  'data-image',
  'data-thumb',
  'formaction',
];

function rewriteUrls(html: string, pageUrl: string): string {
  let out = html;

  // Single-valued URL attributes (quoted with " or ').
  for (const attribute of URL_ATTRIBUTES) {
    const pattern = new RegExp(`(\\s${attribute})\\s*=\\s*(["'])([^"']*)\\2`, 'gi');
    out = out.replace(pattern, (match, prefix, quote, value) => {
      const resolved = absolutize(value, pageUrl);
      return resolved ? `${prefix}=${quote}${resolved}${quote}` : match;
    });
  }

  // srcset / imagesrcset / data-srcset: comma separated candidates.
  out = out.replace(
    /(\s(?:srcset|imagesrcset|data-srcset))\s*=\s*(["'])([^"']*)\2/gi,
    (match, prefix, quote, value: string) => {
      const rewritten = value
        .split(',')
        .map((candidate) => {
          const parts = candidate.trim().split(/\s+/);
          if (!parts[0]) return null;
          const resolved = absolutize(parts[0], pageUrl);
          const descriptor = parts.slice(1).join(' ');
          const finalUrl = resolved ?? parts[0];
          return descriptor ? `${finalUrl} ${descriptor}` : finalUrl;
        })
        .filter(Boolean)
        .join(', ');
      return rewritten ? `${prefix}=${quote}${rewritten}${quote}` : match;
    },
  );

  // CSS url(...) references, inline styles and <style> blocks alike.
  out = out.replace(/url\(\s*(["']?)([^"')]+)\1\s*\)/gi, (match, quote, value: string) => {
    const resolved = absolutize(value, pageUrl);
    return resolved ? `url(${quote || '"'}${resolved}${quote || '"'})` : match;
  });

  // CSS @import rules without url().
  out = out.replace(/@import\s+(["'])([^"']+)\1/gi, (match, quote, value: string) => {
    const resolved = absolutize(value, pageUrl);
    return resolved ? `@import ${quote}${resolved}${quote}` : match;
  });

  return out;
}

/** Inlines same-origin stylesheets so the clone survives hotlink protection/CORS. */
async function inlineStylesheets(html: string, pageUrl: string, limit = 8): Promise<string> {
  const linkPattern = /<link\b[^>]*>/gi;
  const links = html.match(linkPattern) ?? [];
  const targets: { tag: string; href: string }[] = [];

  for (const tag of links) {
    if (!/rel\s*=\s*["']?stylesheet/i.test(tag)) continue;
    const hrefMatch = tag.match(/href\s*=\s*["']([^"']+)["']/i);
    if (!hrefMatch) continue;
    const resolved = absolutize(hrefMatch[1], pageUrl);
    if (!resolved) continue;
    targets.push({ tag, href: resolved });
    if (targets.length >= limit) break;
  }

  if (targets.length === 0) return html;

  const results = await Promise.all(
    targets.map(async ({ tag, href }) => {
      try {
        const response = await fetchWithTimeout(
          href,
          { headers: { 'User-Agent': DESKTOP_UA, Accept: 'text/css,*/*;q=0.1', Referer: pageUrl } },
          15000,
        );
        if (!response.ok) return null;
        const css = await response.text();
        if (!css || css.length > 900_000) return null;
        return { tag, css: rewriteUrls(css, href) };
      } catch {
        return null;
      }
    }),
  );

  let out = html;
  for (const result of results) {
    if (!result) continue;
    out = out.replace(result.tag, `<style data-cloned-from="stylesheet">\n${result.css}\n</style>`);
  }
  return out;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const attempts: CloneAttempt[] = [];

  try {
    const body = await req.json().catch(() => ({}));
    const url: unknown = body?.url;
    const inlineCss: boolean = body?.inlineCss !== false;

    if (typeof url !== 'string' || url.trim().length === 0) {
      return new Response(JSON.stringify({ success: false, error: 'URL é obrigatória' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let formattedUrl = url.trim();
    if (!/^https?:\/\//i.test(formattedUrl)) formattedUrl = `https://${formattedUrl}`;

    let urlObj: URL;
    try {
      urlObj = new URL(formattedUrl);
    } catch {
      return new Response(JSON.stringify({ success: false, error: 'URL inválida' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const hasFirecrawl = Boolean(Deno.env.get('FIRECRAWL_API_KEY'));

    // Ordered strategies: cheap first, heavy rendering and proxies last.
    const strategies: { name: string; run: () => Promise<string> }[] = [
      { name: 'direct-desktop', run: () => directFetch(formattedUrl, DESKTOP_UA) },
      ...(hasFirecrawl
        ? [
            { name: 'firecrawl-render', run: () => scrapeWithFirecrawl(formattedUrl, 4000, false) },
            { name: 'firecrawl-slow', run: () => scrapeWithFirecrawl(formattedUrl, 12000, false) },
            { name: 'firecrawl-mobile', run: () => scrapeWithFirecrawl(formattedUrl, 6000, true) },
          ]
        : []),
      { name: 'direct-mobile', run: () => directFetch(formattedUrl, MOBILE_UA) },
      {
        name: 'direct-googlebot',
        run: () => directFetch(formattedUrl, BOT_UA, 'https://www.google.com/'),
      },
      {
        name: 'proxy-jina',
        run: () =>
          proxyFetch(
            formattedUrl,
            (u) => `https://r.jina.ai/${u}`,
          ),
      },
      {
        name: 'proxy-allorigins',
        run: () =>
          proxyFetch(
            formattedUrl,
            (u) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
          ),
      },
    ];

    let html = '';
    let usedStrategy = '';
    let degraded: { html: string; strategy: string } | null = null;

    for (const strategy of strategies) {
      try {
        const candidate = await strategy.run();
        const usable = looksLikeUsableHtml(candidate);
        const blocked = looksLikeBlockPage(candidate);

        attempts.push({
          strategy: strategy.name,
          ok: usable && !blocked,
          detail: blocked ? 'anti-bot detectado' : usable ? 'ok' : 'conteúdo insuficiente',
          length: candidate.length,
        });

        if (usable && !blocked) {
          html = candidate;
          usedStrategy = strategy.name;
          break;
        }

        // Keep the best partial result in case every strategy is imperfect.
        if (candidate.length > (degraded?.html.length ?? 0)) {
          degraded = { html: candidate, strategy: strategy.name };
        }
      } catch (strategyError) {
        attempts.push({
          strategy: strategy.name,
          ok: false,
          detail: strategyError instanceof Error ? strategyError.message : String(strategyError),
        });
      }
    }

    if (!html && degraded) {
      html = degraded.html;
      usedStrategy = `${degraded.strategy} (parcial)`;
    }

    if (!html) {
      return new Response(
        JSON.stringify({
          success: false,
          error:
            'Não foi possível clonar esta página. O site bloqueou todas as tentativas de acesso.',
          attempts,
        }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Plain-text proxies may return markdown; wrap it so the clone still renders.
    if (!/<html|<body|<div/i.test(html.slice(0, 2000))) {
      html = `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body><pre style="white-space:pre-wrap;font-family:system-ui;padding:24px">${html
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')}</pre></body></html>`;
    }

    const baseUrl = `${urlObj.protocol}//${urlObj.host}`;

    // Strip tags that break a rehosted copy before rewriting URLs.
    html = html
      .replace(/<base\b[^>]*>/gi, '')
      .replace(/<meta[^>]+http-equiv=["']?content-security-policy["']?[^>]*>/gi, '')
      .replace(/<meta[^>]+http-equiv=["']?refresh["']?[^>]*>/gi, '')
      .replace(/\sintegrity\s*=\s*(["'])[^"']*\1/gi, '')
      .replace(/<script[^>]*>\s*if\s*\(\s*(?:window\.)?top\s*(?:!==|!=)\s*(?:window\.)?self[\s\S]*?<\/script>/gi, '');

    html = rewriteUrls(html, formattedUrl);

    if (inlineCss) {
      try {
        html = await inlineStylesheets(html, formattedUrl);
      } catch (cssError) {
        console.error('Stylesheet inlining failed:', cssError);
      }
    }

    // Ensure charset + viewport + base so leftovers still resolve.
    if (!/<meta[^>]+charset/i.test(html)) {
      html = html.replace(/<head[^>]*>/i, '$&\n<meta charset="utf-8">');
    }
    if (!/name=["']?viewport/i.test(html)) {
      html = html.replace(
        /<head[^>]*>/i,
        '$&\n<meta name="viewport" content="width=device-width, initial-scale=1.0">',
      );
    }
    html = html.replace(/<head[^>]*>/i, `$&\n<base href="${baseUrl}/">`);

    if (!/<head[^>]*>/i.test(html)) {
      html = `<head><meta charset="utf-8"><base href="${baseUrl}/"></head>${html}`;
    }

    html = html.replace(
      /<\/head>/i,
      `<link rel="dns-prefetch" href="//fonts.googleapis.com">
<link rel="dns-prefetch" href="//fonts.gstatic.com">
<link rel="preconnect" href="${baseUrl}" crossorigin>
</head>`,
    );

    // Lazy-load heavy media without touching tags that already declare it.
    html = html.replace(/<img(?![^>]*\bloading=)/gi, '<img loading="lazy" decoding="async" ');
    html = html.replace(/<iframe(?![^>]*\bloading=)/gi, '<iframe loading="lazy" ');

    console.log(
      `Clone ok: ${formattedUrl} via ${usedStrategy} (${html.length} bytes, ${attempts.length} tentativas)`,
    );

    return new Response(
      JSON.stringify({
        success: true,
        content: html,
        originalUrl: formattedUrl,
        strategy: usedStrategy,
        usedFirecrawl: usedStrategy.startsWith('firecrawl'),
        partial: usedStrategy.includes('parcial'),
        contentLength: html.length,
        attempts,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    console.error('Error cloning page:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Falha ao clonar a página',
        attempts,
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
