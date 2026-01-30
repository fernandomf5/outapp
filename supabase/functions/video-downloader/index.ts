/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface CobaltResponse {
  status: 'error' | 'redirect' | 'tunnel' | 'picker' | 'stream';
  url?: string;
  urls?: string[];
  picker?: Array<{
    type: 'video' | 'photo' | 'gif';
    url: string;
    thumb?: string;
  }>;
  filename?: string;
  error?: {
    code: string;
  };
}

interface VideoResult {
  url: string;
  type: 'video' | 'audio' | 'photo' | 'gif';
  quality?: string;
  filename?: string;
  thumbnail?: string;
}

const COBALT_API_URL = 'https://api.cobalt.tools/api/json';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();

    if (!url) {
      return new Response(
        JSON.stringify({ success: false, error: 'URL é obrigatória' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Processing video URL:', url);

    // Validate URL is from supported platforms
    const supportedPatterns = [
      /youtube\.com/i,
      /youtu\.be/i,
      /facebook\.com/i,
      /fb\.watch/i,
      /instagram\.com/i,
      /tiktok\.com/i,
      /twitter\.com/i,
      /x\.com/i,
      /vimeo\.com/i,
      /reddit\.com/i,
      /pinterest\.com/i,
      /soundcloud\.com/i,
      /tumblr\.com/i,
      /twitch\.tv/i,
      /dailymotion\.com/i,
      /bilibili\.com/i,
      /ok\.ru/i,
      /rutube\.ru/i,
      /vine\.co/i,
      /streamable\.com/i,
    ];

    const isSupported = supportedPatterns.some(pattern => pattern.test(url));
    if (!isSupported) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Plataforma não suportada. Use: YouTube, Facebook, Instagram, TikTok, Twitter/X, Vimeo, Reddit, Pinterest, etc.' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Call Cobalt API
    const cobaltResponse = await fetch(COBALT_API_URL, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: url,
        vCodec: 'h264',
        vQuality: '1080',
        aFormat: 'mp3',
        filenamePattern: 'pretty',
        isAudioOnly: false,
        twitterGif: true,
        dubLang: false,
      }),
    });

    if (!cobaltResponse.ok) {
      console.error('Cobalt API error status:', cobaltResponse.status);
      const errorText = await cobaltResponse.text();
      console.error('Cobalt API error body:', errorText);
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Falha ao processar o vídeo. Tente novamente ou verifique se o link está correto.' 
        }),
        { status: cobaltResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data: CobaltResponse = await cobaltResponse.json();
    console.log('Cobalt response status:', data.status);

    if (data.status === 'error') {
      const errorMessages: Record<string, string> = {
        'error.api.link.invalid': 'Link inválido. Verifique se a URL está correta.',
        'error.api.content.video.unavailable': 'Este vídeo não está disponível ou é privado.',
        'error.api.content.video.age': 'Este vídeo requer verificação de idade.',
        'error.api.content.video.region': 'Este vídeo não está disponível na sua região.',
        'error.api.youtube.login': 'Este vídeo requer login no YouTube.',
        'error.api.rate-limit': 'Muitas requisições. Aguarde um momento e tente novamente.',
      };

      const errorMessage = data.error?.code 
        ? errorMessages[data.error.code] || `Erro: ${data.error.code}`
        : 'Erro desconhecido ao processar o vídeo.';

      return new Response(
        JSON.stringify({ success: false, error: errorMessage }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const results: VideoResult[] = [];

    // Handle different response types
    if (data.status === 'redirect' || data.status === 'tunnel' || data.status === 'stream') {
      if (data.url) {
        results.push({
          url: data.url,
          type: 'video',
          quality: '1080p',
          filename: data.filename || 'video.mp4',
        });
      }
    } else if (data.status === 'picker' && data.picker) {
      // Multiple media items (carousel posts, etc.)
      data.picker.forEach((item, index) => {
        results.push({
          url: item.url,
          type: item.type === 'photo' ? 'photo' : item.type === 'gif' ? 'gif' : 'video',
          thumbnail: item.thumb,
          filename: `media_${index + 1}.${item.type === 'photo' ? 'jpg' : 'mp4'}`,
        });
      });
    }

    if (results.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Nenhuma mídia encontrada neste link. Verifique se o conteúdo existe e é público.' 
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${results.length} media items`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        media: results,
        message: `${results.length} mídia(s) encontrada(s)!`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error processing video:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro ao processar o vídeo' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
