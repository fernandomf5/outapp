/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />

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

function extractMediaFromContent(html: string, markdown: string, rawHtml: string = ''): ExtractedMedia[] {
  const images: ExtractedMedia[] = [];
  const videos: ExtractedMedia[] = [];
  const seenUrls = new Set<string>();

  // Extract from HTML, markdown and rawHtml combined
  const content = html + ' ' + markdown + ' ' + rawHtml;

  // Image patterns - Meta/Facebook CDN patterns
  const imagePatterns = [
    /https:\/\/scontent[^"\s\)>\\]+\.(jpg|jpeg|png|gif|webp)[^"\s\)>\\]*/gi,
    /https:\/\/[a-z0-9\-]+\.fbcdn\.net\/[^"\s\)>\\]+\.(jpg|jpeg|png|gif|webp)[^"\s\)>\\]*/gi,
    /https:\/\/external[^"\s\)>\\]+\.(jpg|jpeg|png|gif|webp)[^"\s\)>\\]*/gi,
    /https:\/\/lookaside\.fbsbx\.com\/[^"\s\)>\\]+/gi,
    /https:\/\/[^"\s\)>\\]+fbcdn[^"\s\)>\\]+\.(jpg|jpeg|png|gif|webp)[^"\s\)>\\]*/gi,
    /https:\/\/lookaside\.facebook\.com\/[^"\s\)>\\]+/gi,
  ];

  // Video patterns - expanded for Meta/Facebook videos
  const videoPatterns = [
    // Direct mp4/video file links
    /https:\/\/video[^"\s\)>\\]+\.mp4[^"\s\)>\\]*/gi,
    /https:\/\/[a-z0-9\-]+\.fbcdn\.net\/[^"\s\)>\\]+\.mp4[^"\s\)>\\]*/gi,
    /https:\/\/scontent[^"\s\)>\\]+\.mp4[^"\s\)>\\]*/gi,
    // Facebook video CDN patterns - more permissive
    /https:\/\/[a-z0-9\-]+\.xx\.fbcdn\.net\/v\/[^"\s\)>\\]+/gi,
    /https:\/\/video\.xx\.fbcdn\.net\/[^"\s\)>\\]+/gi,
    /https:\/\/video\-[a-z0-9\-]+\.xx\.fbcdn\.net\/[^"\s\)>\\]+/gi,
    /https:\/\/scontent\-[a-z0-9\-]+\.xx\.fbcdn\.net\/v\/[^"\s\)>\\]+/gi,
    // Any scontent with /v/ pattern (videos)
    /https:\/\/scontent[^"\s\)>\\]+\/v\/[^"\s\)>\\]+/gi,
    // Instagram video CDN
    /https:\/\/[a-z0-9\-]+\.cdninstagram\.com\/[^"\s\)>\\]+\.mp4[^"\s\)>\\]*/gi,
    /https:\/\/scontent\.cdninstagram\.com\/[^"\s\)>\\]+/gi,
    // Generic video fbcdn patterns
    /https:\/\/video[^"\s\)>\\]+fbcdn\.net\/[^"\s\)>\\]+/gi,
    // Video with /v/t patterns (common Facebook format for videos)
    /https:\/\/[^"\s\)>\\]+fbcdn\.net\/v\/t[0-9]+\.[0-9]+\-[0-9]+\/[^"\s\)>\\]+/gi,
    // More specific /v/t42 and /v/t39 patterns (video containers)
    /https:\/\/[^"\s\)>\\]+\/v\/t42[^"\s\)>\\]+/gi,
    /https:\/\/[^"\s\)>\\]+\/v\/t39[^"\s\)>\\]+/gi,
    // Escaped URLs (common in JSON)
    /https:\\u002F\\u002F[^"\s]+?\.mp4[^"\s]*/gi,
    /https:\\\/\\\/[^"\s]+?\.mp4[^"\s]*/gi,
    // Any URL with bytestart parameter (chunked video)
    /https:\/\/[^"\s\)>\\]+bytestart[^"\s\)>\\]+/gi,
  ];

  // EXTRACT VIDEOS FIRST (priority)
  videoPatterns.forEach(pattern => {
    const matches = content.match(pattern) || [];
    matches.forEach(url => {
      const cleanUrl = cleanMediaUrl(url);
      if (!seenUrls.has(cleanUrl) && isValidVideoUrl(cleanUrl)) {
        seenUrls.add(cleanUrl);
        videos.push({
          id: `vid_${Date.now()}_${videos.length}`,
          type: 'video',
          url: cleanUrl,
          thumbnailUrl: cleanUrl
        });
      }
    });
  });

  // Try to extract from JSON-like structures in the content - especially video URLs
  const jsonVideoPatterns = [
    /"(?:hd_src|sd_src|browser_native_hd_url|browser_native_sd_url)"\s*:\s*"([^"]+)"/gi,
    /"(?:playable_url|playable_url_quality_hd|playable_url_dash)"\s*:\s*"([^"]+)"/gi,
    /"(?:video_url|video_hd_url|video_sd_url|videoUrl)"\s*:\s*"([^"]+)"/gi,
    /"(?:videoHD|videoSD|video_src)"\s*:\s*"([^"]+)"/gi,
    /"(?:dash_manifest|stream_url|progressive_url)"\s*:\s*"([^"]+)"/gi,
    /"(?:source|src)"\s*:\s*"(https[^"]+\.mp4[^"]*)"/gi,
    /"(?:contentUrl|embedUrl|video)"\s*:\s*"(https[^"]+(?:\.mp4|video)[^"]*)"/gi,
    // Additional patterns for Facebook/Meta video data
    /"(?:__typename)"\s*:\s*"Video"[^}]*"(?:playable_url|browser_native_hd_url|browser_native_sd_url)"\s*:\s*"([^"]+)"/gi,
    /data-video-url="([^"]+)"/gi,
    /data-hd="([^"]+)"/gi,
    /data-sd="([^"]+)"/gi,
  ];

  jsonVideoPatterns.forEach(pattern => {
    let match;
    const regex = new RegExp(pattern.source, pattern.flags);
    while ((match = regex.exec(content)) !== null) {
      const url = cleanMediaUrl(match[1]);
      
      if (!seenUrls.has(url) && isValidVideoUrl(url)) {
        seenUrls.add(url);
        videos.push({
          id: `vid_${Date.now()}_${videos.length}`,
          type: 'video',
          url: url,
          thumbnailUrl: url
        });
      }
    }
  });

  // Special pass: look for any fbcdn video URLs that might have been missed
  const fbcdnVideoPattern = /https:\/\/[a-z0-9\-\.]+fbcdn\.net\/[^"\s\)>\\]+/gi;
  const fbcdnMatches = content.match(fbcdnVideoPattern) || [];
  fbcdnMatches.forEach(url => {
    const cleanUrl = cleanMediaUrl(url);
    if (!seenUrls.has(cleanUrl) && isVideoUrl(cleanUrl) && isValidVideoUrl(cleanUrl)) {
      seenUrls.add(cleanUrl);
      videos.push({
        id: `vid_${Date.now()}_${videos.length}`,
        type: 'video',
        url: cleanUrl,
        thumbnailUrl: cleanUrl
      });
    }
  });

  // NOW Extract images (after videos)
  imagePatterns.forEach(pattern => {
    const matches = content.match(pattern) || [];
    matches.forEach(url => {
      const cleanUrl = cleanMediaUrl(url);
      if (!seenUrls.has(cleanUrl) && isValidMediaUrl(cleanUrl) && !isVideoUrl(cleanUrl)) {
        seenUrls.add(cleanUrl);
        images.push({
          id: `img_${Date.now()}_${images.length}`,
          type: 'image',
          url: cleanUrl,
          thumbnailUrl: cleanUrl
        });
      }
    });
  });

  // Try to extract from JSON-like structures - images
  const jsonImagePatterns = [
    /"(?:image|src|url|preview|original)(?:_url)?"\s*:\s*"([^"]+)"/gi,
    /"(?:thumbnail_url|image_url|previewUrl|imageUrl)"\s*:\s*"([^"]+)"/gi,
  ];

  jsonImagePatterns.forEach(pattern => {
    let match;
    const regex = new RegExp(pattern.source, pattern.flags);
    while ((match = regex.exec(content)) !== null) {
      const url = cleanMediaUrl(match[1]);
      
      if (!seenUrls.has(url) && isValidMediaUrl(url) && !isVideoUrl(url)) {
        seenUrls.add(url);
        images.push({
          id: `img_${Date.now()}_${images.length}`,
          type: 'image',
          url: url,
          thumbnailUrl: url
        });
      }
    }
  });

  // Extract page name if available
  const pageNameMatch = content.match(/"page_name"\s*:\s*"([^"]+)"/);
  const pageName = pageNameMatch ? pageNameMatch[1] : undefined;

  // Combine: ALL videos first, then fill remaining with images
  const allMedia: ExtractedMedia[] = [];
  
  // Add all videos (up to 50)
  const videosToAdd = videos.slice(0, 50);
  videosToAdd.forEach(v => {
    if (pageName) v.pageName = pageName;
    allMedia.push(v);
  });
  
  // Add images to fill remaining slots (up to 50 total)
  const remainingSlots = 50 - allMedia.length;
  const imagesToAdd = images.slice(0, remainingSlots);
  imagesToAdd.forEach(img => {
    if (pageName) img.pageName = pageName;
    allMedia.push(img);
  });

  console.log(`Found ${images.length} images and ${videos.length} videos. Returning ${allMedia.filter(m => m.type === 'video').length} videos and ${allMedia.filter(m => m.type === 'image').length} images.`);

  return allMedia;
}

function isVideoUrl(url: string): boolean {
  const lowerUrl = url.toLowerCase();
  
  // Check for explicit video extensions
  if (lowerUrl.includes('.mp4') || lowerUrl.includes('.webm') || lowerUrl.includes('.mov')) {
    return true;
  }
  
  // Check for video CDN patterns
  if (lowerUrl.includes('video.') || lowerUrl.includes('video-')) {
    return true;
  }
  
  // Check for /v/t patterns which are typically videos on Facebook
  if (/\/v\/t\d+/.test(lowerUrl)) {
    return true;
  }
  
  // Check for video streaming patterns
  if (lowerUrl.includes('playable') || lowerUrl.includes('stream') || lowerUrl.includes('bytestart')) {
    return true;
  }
  
  // Check for video mime type hints in URL
  if (lowerUrl.includes('video/') || lowerUrl.includes('type=video') || lowerUrl.includes('mime=video')) {
    return true;
  }
  
  return false;
}

function isValidVideoUrl(url: string): boolean {
  if (!url || url.length < 40) return false;
  if (!url.startsWith('http')) return false;
  
  const lowerUrl = url.toLowerCase();
  
  // Skip invalid patterns
  const invalidPatterns = [
    'facebook.com/tr',
    'pixel',
    'tracking',
    'analytics',
    '/static/',
    'rsrc.php',
    'static.xx.fbcdn.net',
    'favicon',
    'sprite',
    '.svg',
    'data:image',
    'platform-lookaside',
    'safe_image.php',
    'avatar',
  ];
  
  for (const pattern of invalidPatterns) {
    if (lowerUrl.includes(pattern)) return false;
  }
  
  // Must contain video-related patterns
  const validVideoPatterns = [
    '.mp4',
    'video',
    '/v/t',
    'playable',
    'stream',
    'fbcdn.net/v/',
    'xx.fbcdn.net/v/',
  ];
  
  return validVideoPatterns.some(pattern => lowerUrl.includes(pattern));
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
    'video.xx.fbcdn.net',
    'cdninstagram.com',
    '/v/t',  // Facebook video path pattern
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
        formats: ['markdown', 'html', 'rawHtml'], // Include rawHtml for video detection
        onlyMainContent: false,
        waitFor: 10000, // Wait 10 seconds for JavaScript to render videos
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
    const rawHtml = scrapeData.data?.rawHtml || scrapeData.rawHtml || '';

    console.log('HTML length:', html.length);
    console.log('Markdown length:', markdown.length);
    console.log('RawHtml length:', rawHtml.length);

    // Extract media from the content - include rawHtml for better video detection
    const media = extractMediaFromContent(html, markdown, rawHtml);

    console.log('Extracted media count:', media.length);

    if (media.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          media: [],
          message: 'Nenhuma mídia encontrada automaticamente. A Biblioteca de Anúncios do Meta usa carregamento dinâmico complexo.\n\nPara extrair manualmente:\n1. Abra o anúncio específico (com ?id=...)\n2. Clique em "Ver detalhes do anúncio"\n3. Clique com botão direito na imagem/vídeo\n4. Selecione "Copiar endereço da imagem/vídeo"\n5. Cole na aba "Adicionar Manual"'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const imageCount = media.filter(m => m.type === 'image').length;
    const videoCount = media.filter(m => m.type === 'video').length;

    return new Response(
      JSON.stringify({ 
        success: true, 
        media,
        message: `Encontrado(s): ${imageCount} imagem(ns) e ${videoCount} vídeo(s)!`
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