import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Lead = { name: string; phone: string };

function normalizePhone(input: unknown): string {
  const digits = String(input ?? "").replace(/\D/g, "");
  if (!digits) return "";

  // If already has country code 55
  if (digits.startsWith("55")) return digits;

  // Typical BR: DDD(2) + number(8/9)
  if (digits.length === 10 || digits.length === 11) return `55${digits}`;

  return digits;
}

function tryParseJson(content: string): any {
  const cleaned = content.replace(/```json\n?|```/g, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    // Try extracting first JSON object
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("Resposta da IA não veio em JSON");
    return JSON.parse(match[0]);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY") || "";
    if (!lovableApiKey) {
      return new Response(
        JSON.stringify({ error: "LOVABLE_API_KEY não configurada" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer ", "").trim();
    if (!token) {
      return new Response(
        JSON.stringify({ error: "Não autorizado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use service role for admin auth calls; do NOT override Authorization header with user token
    const supabase = createClient(supabaseUrl, supabaseKey);


    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userData?.user) {
      return new Response(
        JSON.stringify({ error: "Sessão inválida" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json().catch(() => ({}));
    const imageDataUrl = typeof body?.imageDataUrl === "string" ? body.imageDataUrl : "";

    if (!imageDataUrl.startsWith("data:image/")) {
      return new Response(
        JSON.stringify({ error: "Imagem inválida" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Rough size guard (data URL grows ~33%)
    if (imageDataUrl.length > 12_000_000) {
      return new Response(
        JSON.stringify({ error: "Imagem muito grande. Tente uma foto menor." }),
        { status: 413, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const prompt = `Analise esta imagem e extraia todos os nomes e números de telefone que encontrar.

Retorne APENAS no formato JSON, sem markdown, sem explicações:
{
  "leads": [
    {"name": "Nome da Pessoa", "phone": "5585999999999"},
    {"name": "Outro Nome", "phone": "5588888888888"}
  ]
}

Se não encontrar nomes ou números, retorne: {"leads": []}

Importante:
- Números devem conter apenas dígitos
- Adicione o código do país 55 se não estiver presente
- Se houver apenas número sem nome, use "Lead" + número sequencial como nome`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image-preview",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              { type: "image_url", image_url: { url: imageDataUrl } },
            ],
          },
        ],
        modalities: ["image", "text"],
        max_tokens: 1000,
        temperature: 0.1,
      }),
    });

    if (!aiRes.ok) {
      const errorText = await aiRes.text().catch(() => "");
      console.error("AI gateway error:", aiRes.status, errorText);
      return new Response(
        JSON.stringify({ error: `Falha ao processar imagem (${aiRes.status})` }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await aiRes.json().catch(() => null);
    const content = aiData?.choices?.[0]?.message?.content || "";

    if (!content) {
      return new Response(
        JSON.stringify({ leads: [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const parsed = tryParseJson(content);
    const leadsRaw = Array.isArray(parsed?.leads) ? parsed.leads : [];

    const leads: Lead[] = leadsRaw
      .map((l: any) => ({
        name: String(l?.name ?? "").trim(),
        phone: normalizePhone(l?.phone),
      }))
      .filter((l: Lead) => l.phone.length >= 10);

    // Fill missing names
    let counter = 1;
    const withNames = leads.map((l) => ({
      ...l,
      name: l.name ? l.name : `Lead ${counter++}`,
    }));

    return new Response(
      JSON.stringify({ leads: withNames }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("parse-leads-from-image error:", e);
    const message = e && typeof e === "object" && "message" in (e as any)
      ? String((e as any).message)
      : "Erro inesperado";

    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
