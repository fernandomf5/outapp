import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ExtractedMedia {
  id: string;
  type: 'image' | 'video';
  url: string;
  thumbnailUrl?: string;
  adId?: string;
  pageName?: string;
}

function extractMediaFromContent(html: string, markdown: string): ExtractedMedia[] {
  const media: ExtractedMedia[] = [];
  const seenUrls = new Set<string>();

  // Extract from HTML and markdown combined
  const content = html + ' ' + markdown;

  // Image patterns - Meta/Facebook CDN patterns
  const imagePatterns = [
    /https:\/\/scontent[^"\s\)>]+\.(jpg|jpeg|png|gif|webp)[^"\s\)>]*/gi,
    /https:\/\/[a-z0-9\-]+\.fbcdn\.net\/[^"\s\)>]+\.(jpg|jpeg|png|gif|webp)[^"\s\)>]*/gi,
    /https:\/\/external[^"\s\)>]+\.(jpg|jpeg|png|gif|webp)[^"\s\)>]*/gi,
    /https:\/\/lookaside\.fbsbx\.com\/[^"\s\)>]+/gi,
    /https:\/\/[^"\s\)>]+fbcdn[^"\s\)>]+\.(jpg|jpeg|png|gif|webp)[^"\s\)>]*/gi,
    /https:\/\/lookaside\.facebook\.com\/[^"\s\)>]+/gi,
  ];

  // Video patterns
  const videoPatterns = [
    /https:\/\/video[^"\s\)>]+\.mp4[^"\s\)>]*/gi,
    /https:\/\/[a-z0-9\-]+\.fbcdn\.net\/[^"\s\)>]+\.mp4[^"\s\)>]*/gi,
    /https:\/\/scontent[^"\s\)>]+\.mp4[^"\s\)>]*/gi,
  ];

  // Extract images
  imagePatterns.forEach(pattern => {
    const matches = content.match(pattern) || [];
    matches.forEach(url => {
      const cleanUrl = cleanMediaUrl(url);
      if (!seenUrls.has(cleanUrl) && isValidMediaUrl(cleanUrl)) {
        seenUrls.add(cleanUrl);
        media.push({
          id: `img_${Date.now()}_${media.length}`,
          type: 'image',
          url: cleanUrl,
          thumbnailUrl: cleanUrl
        });
      }
    });
  });

  // Extract videos
  videoPatterns.forEach(pattern => {
    const matches = content.match(pattern) || [];
    matches.forEach(url => {
      const cleanUrl = cleanMediaUrl(url);
      if (!seenUrls.has(cleanUrl) && isValidMediaUrl(cleanUrl)) {
        seenUrls.add(cleanUrl);
        media.push({
          id: `vid_${Date.now()}_${media.length}`,
          type: 'video',
          url: cleanUrl,
          thumbnailUrl: cleanUrl
        });
      }
    });
  });

  // Try to extract from JSON-like structures in the content
  const jsonPatterns = [
    /"(?:image|video|src|url|preview|original)(?:_url)?"\s*:\s*"([^"]+)"/gi,
    /"(?:hd_src|sd_src|thumbnail_url|image_url)"\s*:\s*"([^"]+)"/gi,
    /"(?:videoHD|videoSD|previewUrl|imageUrl)"\s*:\s*"([^"]+)"/gi,
  ];

  jsonPatterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const url = cleanMediaUrl(match[1]);
      
      if (!seenUrls.has(url) && isValidMediaUrl(url)) {
        seenUrls.add(url);
        const isVideo = url.includes('.mp4') || url.includes('video');
        media.push({
          id: `${isVideo ? 'vid' : 'img'}_${Date.now()}_${media.length}`,
          type: isVideo ? 'video' : 'image',
          url: url,
          thumbnailUrl: url
        });
      }
    }
  });

  // Extract page name if available
  const pageNameMatch = content.match(/"page_name"\s*:\s*"([^"]+)"/);
  const pageName = pageNameMatch ? pageNameMatch[1] : undefined;

  if (pageName) {
    media.forEach(m => {
      m.pageName = pageName;
    });
  }

  return media.slice(0, 50); // Limit to 50 items
}

function cleanMediaUrl(url: string): string {
  return url
    .replace(/\\u0026/g, '&')
    .replace(/\\u003c/g, '<')
    .replace(/\\u003e/g, '>')
    .replace(/\\\//g, '/')
    .replace(/&amp;/g, '&')
    .replace(/["\s\)\\>]+$/, '')
    .replace(/[,;}\]"')]+$/, '')
    .trim();
}

function isValidMediaUrl(url: string): boolean {
  if (!url || url.length < 40) return false;
  
  // Must be http(s)
  if (!url.startsWith('http')) return false;
  
  // Skip tracking/analytics and small images
  const invalidPatterns = [
    'facebook.com/tr',
    'pixel',
    'tracking',
    'analytics',
    '/static/',
    'emoji',
    'rsrc.php',
    '/images/fb_icon',
    'static.xx.fbcdn.net',
    '/xp/icon',
    'favicon',
    'sprite',
    '.svg',
    'data:image',
    'platform-lookaside',
    's75x75',
    's32x32',
    'p50x50',
    's100x100',
    'safe_image.php',
    'avatar',
    'logo192',
    '/icon',
  ];
  
  const lowerUrl = url.toLowerCase();
  for (const pattern of invalidPatterns) {
    if (lowerUrl.includes(pattern)) return false;
  }
  
  // Must contain typical CDN patterns or file extensions
  const validPatterns = [
    'scontent',
    'fbcdn.net',
    '.jpg',
    '.jpeg',
    '.png',
    '.gif',
    '.webp',
    '.mp4',
    'lookaside.fbsbx.com',
    'lookaside.facebook.com',
  ];
  
  return validPatterns.some(pattern => lowerUrl.includes(pattern));
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();

    if (!url) {
      return new Response(
        JSON.stringify({ success: false, error: 'URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Extracting creatives from:', url);

    const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');
    
    if (!firecrawlApiKey) {
      console.error('FIRECRAWL_API_KEY not configured');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Firecrawl não configurado',
          message: 'Configure o conector Firecrawl nas configurações. Use a aba "Adicionar Manual" para colar URLs diretamente.'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Using Firecrawl to scrape the page with JavaScript rendering...');

    // Use Firecrawl to scrape the page with JavaScript rendering
    const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: url,
        formats: ['markdown', 'html'],
        onlyMainContent: false,
        waitFor: 5000, // Wait 5 seconds for JavaScript to render
      }),
    });

    const scrapeData = await scrapeResponse.json();

    if (!scrapeResponse.ok) {
      console.error('Firecrawl API error:', scrapeData);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: scrapeData.error || 'Erro ao acessar a página',
          message: 'A página pode estar bloqueando acesso. Use a aba "Adicionar Manual" para colar URLs diretamente.'
        }),
        { status: scrapeResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Firecrawl scrape successful');

    // Extract content from response - handle both nested and flat structure
    const html = scrapeData.data?.html || scrapeData.html || '';
    const markdown = scrapeData.data?.markdown || scrapeData.markdown || '';

    console.log('HTML length:', html.length);
    console.log('Markdown length:', markdown.length);

    // Extract media from the content
    const media = extractMediaFromContent(html, markdown);

    console.log('Extracted media count:', media.length);

    if (media.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          media: [],
          message: 'Nenhuma mídia encontrada automaticamente. A Biblioteca de Anúncios do Meta usa carregamento dinâmico complexo.\n\nPara extrair manualmente:\n1. Abra o anúncio específico (com ?id=...)\n2. Clique em "Ver detalhes do anúncio"\n3. Clique com botão direito na imagem/vídeo\n4. Selecione "Copiar endereço da imagem"\n5. Cole na aba "Adicionar Manual"'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        media,
        message: `${media.length} mídia(s) encontrada(s)!`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error extracting creatives:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        message: 'Erro ao processar. Use a aba "Adicionar Manual" para colar URLs diretamente.'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
