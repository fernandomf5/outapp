/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface CobaltResponse {
  status: 'error' | 'redirect' | 'tunnel' | 'picker' | 'stream' | 'local-processing';
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
  text?: string;
}

interface VideoResult {
  url: string;
  type: 'video' | 'audio' | 'photo' | 'gif';
  quality?: string;
  filename?: string;
  thumbnail?: string;
}

// Working community Cobalt API instances (100% and 96% score on cobalt.directory)
const COBALT_INSTANCES = [
  'https://alpha.wolfy.love',
  'https://cessi-c.meowing.de',
  'https://omega.wolfy.love',
  'https://subito-c.meowing.de',
  'https://api.qwkuns.me',
];

async function tryInstance(instanceUrl: string, url: string): Promise<{ success: boolean; data?: CobaltResponse; error?: string }> {
  try {
    console.log(`Trying Cobalt instance: ${instanceUrl}`);
    
    const cobaltResponse = await fetch(instanceUrl, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': 'KlicSmart/1.0 (+https://outapp.lovable.app)',
      },
      body: JSON.stringify({
        url: url,
        videoQuality: '1080',
        audioFormat: 'mp3',
        filenameStyle: 'pretty',
        downloadMode: 'auto',
      }),
    });

    const responseText = await cobaltResponse.text();
    console.log(`Instance ${instanceUrl} response status:`, cobaltResponse.status);
    console.log(`Instance ${instanceUrl} response body:`, responseText.substring(0, 500));

    if (!cobaltResponse.ok) {
      return { success: false, error: `HTTP ${cobaltResponse.status}: ${responseText.substring(0, 100)}` };
    }

    const data: CobaltResponse = JSON.parse(responseText);
    
    if (data.status === 'error') {
      return { success: false, error: data.error?.code || data.text || 'Unknown error' };
    }
    
    return { success: true, data };
  } catch (error) {
    console.error(`Instance ${instanceUrl} failed:`, error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

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

    // Try each Cobalt instance until one succeeds
    let lastError = '';
    let data: CobaltResponse | undefined;

    for (const instance of COBALT_INSTANCES) {
      const result = await tryInstance(instance, url);
      if (result.success && result.data) {
        data = result.data;
        console.log(`Success with instance: ${instance}`);
        break;
      }
      lastError = result.error || 'Unknown error';
      console.log(`Instance ${instance} failed: ${lastError}`);
    }

    if (!data) {
      const errorMessages: Record<string, string> = {
        'error.api.link.invalid': 'Link inválido. Verifique se a URL está correta.',
        'error.api.content.video.unavailable': 'Este vídeo não está disponível ou é privado.',
        'error.api.content.video.age': 'Este vídeo requer verificação de idade.',
        'error.api.content.video.region': 'Este vídeo não está disponível na sua região.',
        'error.api.youtube.login': 'Este vídeo requer login no YouTube.',
        'error.api.rate-limit': 'Muitas requisições. Aguarde um momento e tente novamente.',
        'error.api.fetch.fail': 'Falha ao buscar o vídeo. Verifique se o link está correto.',
        'error.api.service.disabled': 'Serviço temporariamente indisponível.',
        'error.api.auth.jwt.missing': 'Serviço requer autenticação. Tente novamente mais tarde.',
        'error.api.auth.api-key.missing': 'Serviço requer autenticação. Tente novamente mais tarde.',
        'error.api.invalid_body': 'Erro no formato da requisição.',
      };

      const errorMessage = errorMessages[lastError] || `Não foi possível processar o vídeo. Erro: ${lastError}`;
      
      return new Response(
        JSON.stringify({ success: false, error: errorMessage }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const results: VideoResult[] = [];

    // Handle different response types
    if (data.status === 'redirect' || data.status === 'tunnel' || data.status === 'stream' || data.status === 'local-processing') {
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
