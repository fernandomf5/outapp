const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();

    if (!url) {
      return new Response(
        JSON.stringify({ error: 'URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Cloning page:', url);

    // Format URL
    let formattedUrl = url.trim();
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = `https://${formattedUrl}`;
    }

    // Try Firecrawl first (handles JavaScript-rendered pages)
    const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');
    
    let html = '';
    let usedFirecrawl = false;

    if (firecrawlApiKey) {
      console.log('Using Firecrawl for advanced scraping...');
      
      try {
        const firecrawlResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${firecrawlApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: formattedUrl,
            formats: ['html', 'rawHtml'],
            onlyMainContent: false,
            waitFor: 3000, // Wait 3s for JS to render
          }),
        });

        const firecrawlData = await firecrawlResponse.json();
        
        if (firecrawlResponse.ok && firecrawlData.success) {
          // Prefer rawHtml for complete page structure, fallback to html
          html = firecrawlData.data?.rawHtml || firecrawlData.data?.html || firecrawlData.rawHtml || firecrawlData.html || '';
          usedFirecrawl = true;
          console.log('Firecrawl successful, HTML length:', html.length);
        } else {
          console.log('Firecrawl failed, falling back to direct fetch:', firecrawlData.error);
        }
      } catch (firecrawlError) {
        console.log('Firecrawl error, falling back to direct fetch:', firecrawlError);
      }
    }

    // Fallback to direct fetch if Firecrawl unavailable or failed
    if (!html) {
      console.log('Using direct fetch...');
      
      const response = await fetch(formattedUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none',
          'Sec-Fetch-User': '?1',
          'Cache-Control': 'max-age=0',
        },
        redirect: 'follow',
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch page: ${response.status} ${response.statusText}`);
      }

      html = await response.text();
      console.log('Direct fetch successful, HTML length:', html.length);
    }

    // Get the base URL for relative paths
    const urlObj = new URL(formattedUrl);
    const baseUrl = `${urlObj.protocol}//${urlObj.host}`;
    const basePath = formattedUrl.substring(0, formattedUrl.lastIndexOf('/') + 1) || baseUrl + '/';

    // === ADVANCED URL PROCESSING ===

    // Fix protocol-relative URLs
    html = html.replace(/src="\/\/([^"]+)"/gi, 'src="https://$1"');
    html = html.replace(/href="\/\/([^"]+)"/gi, 'href="https://$1"');
    html = html.replace(/url\(\/\/([^\)]+)\)/gi, 'url(https://$1)');

    // Fix root-relative URLs (starting with /)
    html = html.replace(/src="\/(?!\/|data:|http)([^"]+)"/gi, `src="${baseUrl}/$1"`);
    html = html.replace(/href="\/(?!\/|#|mailto:|tel:|javascript:|data:|http)([^"]+)"/gi, `href="${baseUrl}/$1"`);
    html = html.replace(/url\(["']?\/(?!\/|data:|http)([^"'\)]+)["']?\)/gi, `url("${baseUrl}/$1")`);

    // Fix relative URLs (not starting with / or http)
    html = html.replace(/src="(?!http|\/|data:|#|javascript:)([^"]+)"/gi, `src="${basePath}$1"`);
    html = html.replace(/href="(?!http|\/|#|mailto:|tel:|javascript:|data:)([^"]+)"/gi, `href="${basePath}$1"`);
    html = html.replace(/url\(["']?(?!http|\/|data:|#)([^"'\)]+)["']?\)/gi, `url("${basePath}$1")`);

    // Fix srcset attribute for responsive images
    html = html.replace(/srcset="([^"]+)"/gi, (match, srcset) => {
      const fixedSrcset = srcset.split(',').map((item: string) => {
        const parts = item.trim().split(/\s+/);
        let src = parts[0];
        const rest = parts.slice(1).join(' ');
        
        if (src.startsWith('//')) {
          src = 'https:' + src;
        } else if (src.startsWith('/') && !src.startsWith('//')) {
          src = baseUrl + src;
        } else if (!src.startsWith('http') && !src.startsWith('data:')) {
          src = basePath + src;
        }
        
        return rest ? `${src} ${rest}` : src;
      }).join(', ');
      
      return `srcset="${fixedSrcset}"`;
    });

    // Fix data-src and data-lazy-src (lazy loading)
    html = html.replace(/data-src="\/(?!\/|data:|http)([^"]+)"/gi, `data-src="${baseUrl}/$1"`);
    html = html.replace(/data-src="(?!http|\/|data:)([^"]+)"/gi, `data-src="${basePath}$1"`);
    html = html.replace(/data-lazy-src="\/(?!\/|data:|http)([^"]+)"/gi, `data-lazy-src="${baseUrl}/$1"`);
    html = html.replace(/data-lazy-src="(?!http|\/|data:)([^"]+)"/gi, `data-lazy-src="${basePath}$1"`);

    // Fix background images in style attributes
    html = html.replace(/style="([^"]*?)background(-image)?:\s*url\(["']?\/(?!\/|data:|http)([^"'\)]+)["']?\)([^"]*?)"/gi, 
      `style="$1background$2: url("${baseUrl}/$3")$4"`);
    html = html.replace(/style="([^"]*?)background(-image)?:\s*url\(["']?(?!http|\/|data:)([^"'\)]+)["']?\)([^"]*?)"/gi, 
      `style="$1background$2: url("${basePath}$3")$4"`);

    // Fix poster attribute for videos
    html = html.replace(/poster="\/(?!\/|data:|http)([^"]+)"/gi, `poster="${baseUrl}/$1"`);
    html = html.replace(/poster="(?!http|\/|data:)([^"]+)"/gi, `poster="${basePath}$1"`);

    // Fix action attribute in forms
    html = html.replace(/action="\/(?!\/|http)([^"]+)"/gi, `action="${baseUrl}/$1"`);
    html = html.replace(/action="(?!http|\/|#|javascript:)([^"]+)"/gi, `action="${basePath}$1"`);

    // Fix double slashes in paths (except protocol)
    html = html.replace(/(https?:\/\/[^\/\s"']+)\/+(?=[^\/])/g, '$1/');

    // === OPTIMIZATION ===

    // Optimize images with lazy loading
    html = html.replace(/<img(?![^>]*loading=)/gi, '<img loading="lazy" decoding="async" ');
    
    // Optimize iframes with lazy loading
    html = html.replace(/<iframe(?![^>]*loading=)/gi, '<iframe loading="lazy" ');

    // Add viewport meta if not present
    if (!html.includes('viewport')) {
      html = html.replace(/<head[^>]*>/i, '$&\n<meta name="viewport" content="width=device-width, initial-scale=1.0">');
    }

    // Add base tag for any remaining relative URLs
    if (!html.includes('<base ')) {
      html = html.replace(/<head[^>]*>/i, `$&\n<base href="${baseUrl}/">`);
    }

    // Add DNS prefetch for common resources
    const prefetchLinks = `
    <link rel="dns-prefetch" href="//fonts.googleapis.com">
    <link rel="dns-prefetch" href="//fonts.gstatic.com">
    <link rel="dns-prefetch" href="//cdnjs.cloudflare.com">
    <link rel="dns-prefetch" href="//cdn.jsdelivr.net">
    <link rel="dns-prefetch" href="${urlObj.host}">
    <link rel="preconnect" href="${baseUrl}" crossorigin>`;
    
    html = html.replace(/<\/head>/i, `${prefetchLinks}\n</head>`);

    // Remove problematic elements that might break the cloned page
    // Remove noscript tags content that might show warnings
    html = html.replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, '');

    console.log('Page processed successfully, final length:', html.length, 'Used Firecrawl:', usedFirecrawl);

    return new Response(
      JSON.stringify({ 
        success: true, 
        content: html,
        originalUrl: formattedUrl,
        usedFirecrawl,
        contentLength: html.length
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error cloning page:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to clone page';
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: errorMessage,
        details: String(error)
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
