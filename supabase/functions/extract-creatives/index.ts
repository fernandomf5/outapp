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

    // Extract ad ID from URL
    const adIdMatch = url.match(/[?&]id=(\d+)/);
    const adId = adIdMatch ? adIdMatch[1] : null;

    console.log('Ad ID extracted:', adId);

    // Try to fetch the Meta Ads Library page
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
      },
    });

    if (!response.ok) {
      console.error('Failed to fetch page:', response.status);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Failed to fetch page: ${response.status}`,
          media: [],
          message: "Não foi possível acessar a página. A biblioteca de anúncios do Meta pode estar bloqueando o acesso."
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const html = await response.text();
    console.log('HTML length:', html.length);

    const media: ExtractedMedia[] = [];

    // Try to extract image URLs from the HTML
    // Look for various patterns that Meta uses for ad images

    // Pattern 1: Direct image URLs in data attributes or img tags
    const imgPatterns = [
      /https:\/\/scontent[^"'\s]+\.(?:jpg|jpeg|png|webp|gif)[^"'\s]*/gi,
      /https:\/\/external[^"'\s]+\.(?:jpg|jpeg|png|webp|gif)[^"'\s]*/gi,
      /https:\/\/lookaside\.facebook\.com[^"'\s]+/gi,
      /https:\/\/[^"'\s]*fbcdn[^"'\s]*\.(?:jpg|jpeg|png|webp|gif)[^"'\s]*/gi,
    ];

    const foundImageUrls = new Set<string>();
    
    for (const pattern of imgPatterns) {
      const matches = html.match(pattern) || [];
      matches.forEach(match => {
        // Clean up the URL
        let cleanUrl = match.replace(/\\u0026/g, '&').replace(/\\/g, '');
        // Remove trailing punctuation
        cleanUrl = cleanUrl.replace(/[,;}\]"')]+$/, '');
        if (cleanUrl.length > 50) { // Filter out very short URLs
          foundImageUrls.add(cleanUrl);
        }
      });
    }

    // Pattern 2: Video URLs
    const videoPatterns = [
      /https:\/\/video[^"'\s]+\.mp4[^"'\s]*/gi,
      /https:\/\/[^"'\s]*fbcdn[^"'\s]*\.mp4[^"'\s]*/gi,
      /https:\/\/scontent[^"'\s]+\.mp4[^"'\s]*/gi,
    ];

    const foundVideoUrls = new Set<string>();
    
    for (const pattern of videoPatterns) {
      const matches = html.match(pattern) || [];
      matches.forEach(match => {
        let cleanUrl = match.replace(/\\u0026/g, '&').replace(/\\/g, '');
        cleanUrl = cleanUrl.replace(/[,;}\]"')]+$/, '');
        if (cleanUrl.length > 50) {
          foundVideoUrls.add(cleanUrl);
        }
      });
    }

    // Try to extract from JSON data embedded in the page
    const jsonDataPattern = /"(?:image|video|media)(?:_url|Url|URL)"\s*:\s*"([^"]+)"/gi;
    let jsonMatch;
    while ((jsonMatch = jsonDataPattern.exec(html)) !== null) {
      const extractedUrl = jsonMatch[1].replace(/\\u0026/g, '&').replace(/\\/g, '');
      if (extractedUrl.includes('.mp4')) {
        foundVideoUrls.add(extractedUrl);
      } else if (extractedUrl.match(/\.(jpg|jpeg|png|webp|gif)/i)) {
        foundImageUrls.add(extractedUrl);
      }
    }

    // Try to extract high-res images from srcset or data attributes
    const srcsetPattern = /(?:srcset|data-src|data-original)\s*=\s*["']([^"']+)["']/gi;
    while ((jsonMatch = srcsetPattern.exec(html)) !== null) {
      const srcsetValue = jsonMatch[1];
      const urls = srcsetValue.split(',').map(s => s.trim().split(' ')[0]);
      urls.forEach(srcUrl => {
        if (srcUrl.match(/https:\/\/[^"'\s]*\.(jpg|jpeg|png|webp|gif)/i)) {
          foundImageUrls.add(srcUrl.replace(/\\u0026/g, '&').replace(/\\/g, ''));
        }
      });
    }

    // Extract page name if available
    const pageNameMatch = html.match(/"page_name"\s*:\s*"([^"]+)"/);
    const pageName = pageNameMatch ? pageNameMatch[1] : undefined;

    console.log('Found images:', foundImageUrls.size);
    console.log('Found videos:', foundVideoUrls.size);

    // Add images to media array
    let index = 0;
    foundImageUrls.forEach(imageUrl => {
      // Filter out small images, icons, etc
      if (!imageUrl.includes('emoji') && 
          !imageUrl.includes('icon') && 
          !imageUrl.includes('logo') &&
          !imageUrl.includes('s75x75') &&
          !imageUrl.includes('s32x32') &&
          !imageUrl.includes('p50x50')) {
        media.push({
          id: `img_${index++}`,
          type: 'image',
          url: imageUrl,
          thumbnailUrl: imageUrl,
          adId: adId || undefined,
          pageName: pageName
        });
      }
    });

    // Add videos to media array
    foundVideoUrls.forEach(videoUrl => {
      media.push({
        id: `vid_${index++}`,
        type: 'video',
        url: videoUrl,
        adId: adId || undefined,
        pageName: pageName
      });
    });

    // Limit results to avoid overwhelming response
    const limitedMedia = media.slice(0, 20);

    console.log('Returning media count:', limitedMedia.length);

    if (limitedMedia.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          media: [],
          message: "A biblioteca de anúncios do Meta usa JavaScript para carregar o conteúdo. Para extrair os criativos, você pode: 1) Abrir o anúncio no navegador, 2) Clicar com o botão direito na imagem/vídeo, 3) Selecionar 'Copiar endereço da imagem/vídeo'"
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        media: limitedMedia,
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
        message: "Erro ao processar a página. A biblioteca de anúncios pode estar usando proteções anti-scraping."
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
