import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, platform, industry } = await req.json();
    const META_ACCESS_TOKEN = Deno.env.get('META_ADS_ACCESS_TOKEN');

    console.log('Search request:', { query, platform, industry });

    let allAds: any[] = [];

    // Buscar anúncios do Meta se o token estiver configurado
    if ((platform === 'all' || platform === 'meta') && META_ACCESS_TOKEN) {
      try {
        const metaUrl = new URL('https://graph.facebook.com/v18.0/ads_archive');
        metaUrl.searchParams.set('access_token', META_ACCESS_TOKEN);
        metaUrl.searchParams.set('search_terms', query || '');
        metaUrl.searchParams.set('ad_reached_countries', 'BR');
        metaUrl.searchParams.set('ad_active_status', 'ALL');
        metaUrl.searchParams.set('fields', 'id,ad_creative_body,ad_creative_link_title,page_name,ad_snapshot_url,ad_delivery_start_time,ad_delivery_stop_time,impressions,spend');
        metaUrl.searchParams.set('limit', '20');

        console.log('Calling Meta API...');
        const metaResponse = await fetch(metaUrl.toString());
        
        if (metaResponse.ok) {
          const metaData = await metaResponse.json();
          console.log('Meta API response:', metaData);

          if (metaData.data && Array.isArray(metaData.data)) {
            const metaAds = metaData.data.map((ad: any) => ({
              id: ad.id,
              platform: 'meta',
              advertiser: ad.page_name || 'Unknown',
              title: ad.ad_creative_link_title || 'Sem título',
              description: ad.ad_creative_body || '',
              image_url: `https://picsum.photos/seed/${ad.id}/400/300`,
              cta_text: 'Ver Anúncio',
              landing_page_url: ad.ad_snapshot_url || '',
              first_seen: ad.ad_delivery_start_time || new Date().toISOString(),
              last_seen: ad.ad_delivery_stop_time || new Date().toISOString(),
              impressions_estimate: ad.impressions?.lower_bound || 0,
              engagement_estimate: Math.floor((ad.impressions?.lower_bound || 0) * 0.02)
            }));
            allAds.push(...metaAds);
          }
        } else {
          const errorText = await metaResponse.text();
          console.error('Meta API error:', metaResponse.status, errorText);
        }
      } catch (metaError) {
        console.error('Error fetching Meta ads:', metaError);
      }
    }

    // Se não houver resultados reais, retornar exemplos
    if (allAds.length === 0) {
      console.log('No real ads found, returning examples');
      const exampleAds = [
        {
          id: "1",
          platform: "meta",
          advertiser: "Nike",
          title: "Just Do It - Nova Coleção",
          description: "Descubra os tênis mais confortáveis da temporada. Estilo e performance em um só lugar.",
          image_url: "https://picsum.photos/seed/nike/400/300",
          cta_text: "Comprar Agora",
          landing_page_url: "https://nike.com",
          first_seen: "2024-01-15",
          last_seen: "2024-02-20",
          impressions_estimate: 2500000,
          engagement_estimate: 45000,
        },
        {
          id: "2",
          platform: "google",
          advertiser: "Apple",
          title: "iPhone 15 Pro - Titanium",
          description: "Mais leve. Mais forte. Mais Pro do que nunca.",
          image_url: "https://picsum.photos/seed/apple/400/300",
          cta_text: "Saiba Mais",
          landing_page_url: "https://apple.com",
          first_seen: "2024-02-01",
          last_seen: "2024-02-25",
          impressions_estimate: 5000000,
          engagement_estimate: 125000,
        }
      ];

      // Filtrar exemplos por plataforma
      let filteredAds = platform === 'all' 
        ? exampleAds 
        : exampleAds.filter(ad => ad.platform === platform);

      // Filtrar por query
      if (query && query.trim()) {
        const searchTerm = query.toLowerCase();
        filteredAds = filteredAds.filter(ad => 
          ad.advertiser.toLowerCase().includes(searchTerm) ||
          ad.title.toLowerCase().includes(searchTerm) ||
          ad.description.toLowerCase().includes(searchTerm)
        );
      }

      allAds = filteredAds;
    }

    return new Response(
      JSON.stringify({ ads: allAds }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("ad-spy-search error", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});