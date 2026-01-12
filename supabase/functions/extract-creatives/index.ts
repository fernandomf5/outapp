import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ExtractedMedia {
  id: string;
  type: 'image' | 'video';
  url: string;
  thumbnailUrl?: string;
  adId?: string;
  pageName?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();

    if (!url) {
      return new Response(
        JSON.stringify({ success: false, error: "URL is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log('Extracting creatives from:', url);

    // Extract ad ID from URL - try multiple patterns
    let adId: string | null = null;
    
    // Pattern 1: ?id=123456
    const idMatch = url.match(/[?&]id=(\d+)/);
    if (idMatch) {
      adId = idMatch[1];
    }
    
    // Pattern 2: /ads/library/?...&id=... or similar
    if (!adId) {
      const altMatch = url.match(/(\d{10,})/);
      if (altMatch) {
        adId = altMatch[1];
      }
    }

    console.log('Ad ID extracted:', adId);

    const accessToken = Deno.env.get('META_ADS_ACCESS_TOKEN');
    
    // If we have an access token and ad ID, try the official API first
    if (accessToken && adId) {
      console.log('Trying Meta Ads Library API...');
      
      try {
        const apiUrl = `https://graph.facebook.com/v18.0/ads_archive?access_token=${accessToken}&ad_archive_id=${adId}&fields=ad_creative_bodies,ad_creative_link_captions,ad_creative_link_descriptions,ad_creative_link_titles,ad_snapshot_url,page_name`;
        
        const apiResponse = await fetch(apiUrl);
        const apiData = await apiResponse.json();
        
        console.log('API Response:', JSON.stringify(apiData));
        
        if (apiData.data && apiData.data.length > 0) {
          const ad = apiData.data[0];
          const media: ExtractedMedia[] = [];
          
          // Get the snapshot URL which often contains the creative
          if (ad.ad_snapshot_url) {
            media.push({
              id: `snapshot_${adId}`,
              type: 'image',
              url: ad.ad_snapshot_url,
              thumbnailUrl: ad.ad_snapshot_url,
              adId: adId,
              pageName: ad.page_name
            });
          }
          
          if (media.length > 0) {
            return new Response(
              JSON.stringify({ 
                success: true, 
                media,
                source: 'api'
              }),
              { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
        }
      } catch (apiError) {
        console.error('API Error:', apiError);
      }
    }

    // Fallback: Try to fetch the ad snapshot URL directly if we have an ad ID
    if (adId) {
      console.log('Trying direct ad snapshot URL...');
      
      const snapshotUrl = `https://www.facebook.com/ads/archive/render_ad/?id=${adId}&access_token=${accessToken || ''}`;
      
      try {
        const snapshotResponse = await fetch(snapshotUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
            'Accept-Encoding': 'gzip, deflate, br',
            'Cache-Control': 'no-cache',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Sec-Fetch-User': '?1',
            'Upgrade-Insecure-Requests': '1',
          },
        });

        if (snapshotResponse.ok) {
          const html = await snapshotResponse.text();
          const media = extractMediaFromHtml(html, adId);
          
          if (media.length > 0) {
            return new Response(
              JSON.stringify({ 
                success: true, 
                media,
                source: 'snapshot'
              }),
              { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
        }
      } catch (snapshotError) {
        console.error('Snapshot fetch error:', snapshotError);
      }
    }

    // Try fetching the original URL with enhanced headers
    console.log('Trying direct page fetch...');
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Sec-Ch-Ua': '"Not A(Brand";v="99", "Google Chrome";v="121", "Chromium";v="121"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"Windows"',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1',
      },
    });

    if (!response.ok) {
      console.error('Failed to fetch page:', response.status);
      
      // Return helpful manual instructions
      return new Response(
        JSON.stringify({ 
          success: true, 
          media: [],
          message: "A biblioteca de anúncios do Meta bloqueia acesso automatizado. Para extrair os criativos manualmente:\n\n1. Abra o anúncio no navegador\n2. Clique em 'Ver detalhes do anúncio'\n3. Clique com botão direito na imagem/vídeo\n4. Selecione 'Copiar endereço da imagem' ou 'Salvar vídeo como...'\n\nDica: Use a extensão 'Meta Ad Library Downloader' no Chrome para facilitar."
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const html = await response.text();
    console.log('HTML length:', html.length);

    const media = extractMediaFromHtml(html, adId);

    console.log('Returning media count:', media.length);

    if (media.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          media: [],
          message: "A biblioteca de anúncios do Meta carrega o conteúdo via JavaScript. Para extrair os criativos:\n\n1. Abra o anúncio no navegador\n2. Clique em 'Ver detalhes do anúncio'\n3. Clique com botão direito na imagem/vídeo\n4. Selecione 'Copiar endereço da imagem' ou 'Salvar vídeo como...'\n\nAlternativa: Use extensões como 'Meta Ad Library Downloader' ou 'Video DownloadHelper'"
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        media,
        total: media.length
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("extract-creatives error:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error",
        media: [],
        message: "Erro ao processar. Tente:\n\n1. Copiar o link correto do anúncio (com ?id=...)\n2. Usar um link de anúncio específico, não de busca\n3. Extrair manualmente clicando com botão direito na mídia"
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function extractMediaFromHtml(html: string, adId: string | null): ExtractedMedia[] {
  const media: ExtractedMedia[] = [];
  const foundUrls = new Set<string>();
  
  // Pattern for images
  const imgPatterns = [
    /https:\/\/scontent[^"'\s\\]+\.(?:jpg|jpeg|png|webp|gif)/gi,
    /https:\/\/external[^"'\s\\]+\.(?:jpg|jpeg|png|webp|gif)/gi,
    /https:\/\/lookaside\.facebook\.com[^"'\s\\]+/gi,
    /https:\/\/[^"'\s\\]*fbcdn[^"'\s\\]*\.(?:jpg|jpeg|png|webp|gif)/gi,
    /https:\/\/[^"'\s\\]*fb\.com[^"'\s\\]*\.(?:jpg|jpeg|png|webp|gif)/gi,
  ];

  for (const pattern of imgPatterns) {
    const matches = html.match(pattern) || [];
    matches.forEach(match => {
      let cleanUrl = cleanMediaUrl(match);
      if (isValidMediaUrl(cleanUrl, 'image')) {
        foundUrls.add(cleanUrl);
      }
    });
  }

  // Pattern for videos
  const videoPatterns = [
    /https:\/\/video[^"'\s\\]+\.mp4/gi,
    /https:\/\/[^"'\s\\]*fbcdn[^"'\s\\]*\.mp4/gi,
    /https:\/\/scontent[^"'\s\\]+\.mp4/gi,
    /https:\/\/[^"'\s\\]*fb\.com[^"'\s\\]*\.mp4/gi,
  ];

  const videoUrls = new Set<string>();
  for (const pattern of videoPatterns) {
    const matches = html.match(pattern) || [];
    matches.forEach(match => {
      let cleanUrl = cleanMediaUrl(match);
      if (cleanUrl.length > 50) {
        videoUrls.add(cleanUrl);
      }
    });
  }

  // Extract from JSON data embedded in the page
  const jsonPatterns = [
    /"(?:image|video|media|src|source)(?:_url|Url|URL|_src)?"\s*:\s*"([^"]+)"/gi,
    /"hd_src"\s*:\s*"([^"]+)"/gi,
    /"sd_src"\s*:\s*"([^"]+)"/gi,
  ];

  for (const pattern of jsonPatterns) {
    let match;
    while ((match = pattern.exec(html)) !== null) {
      const extractedUrl = cleanMediaUrl(match[1]);
      if (extractedUrl.includes('.mp4')) {
        videoUrls.add(extractedUrl);
      } else if (extractedUrl.match(/\.(jpg|jpeg|png|webp|gif)/i)) {
        if (isValidMediaUrl(extractedUrl, 'image')) {
          foundUrls.add(extractedUrl);
        }
      }
    }
  }

  // Extract page name if available
  const pageNameMatch = html.match(/"page_name"\s*:\s*"([^"]+)"/);
  const pageName = pageNameMatch ? pageNameMatch[1] : undefined;

  // Add images
  let index = 0;
  foundUrls.forEach(imageUrl => {
    media.push({
      id: `img_${index++}`,
      type: 'image',
      url: imageUrl,
      thumbnailUrl: imageUrl,
      adId: adId || undefined,
      pageName: pageName
    });
  });

  // Add videos
  videoUrls.forEach(videoUrl => {
    media.push({
      id: `vid_${index++}`,
      type: 'video',
      url: videoUrl,
      adId: adId || undefined,
      pageName: pageName
    });
  });

  // Limit results
  return media.slice(0, 30);
}

function cleanMediaUrl(url: string): string {
  return url
    .replace(/\\u0026/g, '&')
    .replace(/\\u003c/g, '<')
    .replace(/\\u003e/g, '>')
    .replace(/\\/g, '')
    .replace(/[,;}\]"')]+$/, '')
    .trim();
}

function isValidMediaUrl(url: string, type: 'image' | 'video'): boolean {
  // Filter out small images, icons, emojis
  const invalidPatterns = [
    'emoji', 'icon', 'logo', 'avatar',
    's75x75', 's32x32', 'p50x50', 's100x100',
    'rsrc.php', 'static.xx', 'platform-lookaside',
    'safe_image.php'
  ];
  
  const urlLower = url.toLowerCase();
  
  for (const pattern of invalidPatterns) {
    if (urlLower.includes(pattern)) {
      return false;
    }
  }
  
  return url.length > 60;
}
