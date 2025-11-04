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

    // Placeholder: in future, use secrets and call real ad libraries
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
      },
      {
        id: "3",
        platform: "tiktok",
        advertiser: "Gymshark",
        title: "Treino & Estilo",
        description: "A roupa fitness que você merece. Conforto e performance.",
        video_url: "https://example.com/video.mp4",
        cta_text: "Ver Coleção",
        landing_page_url: "https://gymshark.com",
        first_seen: "2024-02-10",
        last_seen: "2024-02-28",
        impressions_estimate: 1800000,
        engagement_estimate: 92000,
      },
    ];

    // Basic filter simulation
    let ads = exampleAds;
    if (platform && platform !== "all") {
      ads = ads.filter((a) => a.platform === platform);
    }
    if (query) {
      const q = String(query).toLowerCase();
      ads = ads.filter(
        (a) => a.advertiser.toLowerCase().includes(q) || a.title.toLowerCase().includes(q) || a.description.toLowerCase().includes(q),
      );
    }

    return new Response(
      JSON.stringify({ ads }),
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