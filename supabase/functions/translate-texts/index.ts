import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LANG_NAMES: Record<string, string> = {
  pt: 'Portuguese (Brazil)',
  en: 'English (US)',
  es: 'Spanish (Latin America)',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { texts, target } = await req.json();

    if (!Array.isArray(texts) || texts.length === 0) {
      return new Response(JSON.stringify({ translations: [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const targetName = LANG_NAMES[target];
    if (!targetName) throw new Error('Unsupported target language');

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');

    const items = texts.slice(0, 120).map((t: string, i: number) => ({ i, t: String(t).slice(0, 400) }));

    const systemPrompt = `You are a UI localization engine for a SaaS web app.
Translate each item's "t" value into ${targetName}.
Rules:
- Keep the SAME meaning, tone and capitalization style of UI labels.
- Keep emojis, numbers, currency, URLs, e-mails, brand names (Out App, Klic Smart, WhatsApp, PIX, Mercado Pago) unchanged.
- Do NOT add explanations. Do NOT merge or drop items.
- If a string is already in ${targetName} or is not translatable (symbols/numbers only), return it unchanged.
- Return ONLY valid JSON: {"r":[{"i":0,"t":"..."}]} with exactly one entry per input index.`;

    const aiRes = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: JSON.stringify({ items }) },
        ],
        response_format: { type: 'json_object' },
      }),
    });

    if (aiRes.status === 429) {
      return new Response(JSON.stringify({ error: 'rate_limited' }), {
        status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (aiRes.status === 402) {
      return new Response(JSON.stringify({ error: 'payment_required' }), {
        status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (!aiRes.ok) {
      const errText = await aiRes.text();
      throw new Error(`AI gateway error: ${aiRes.status} ${errText}`);
    }

    const data = await aiRes.json();
    const content = data?.choices?.[0]?.message?.content ?? '{}';
    let parsed: any = {};
    try {
      parsed = JSON.parse(content);
    } catch {
      const m = content.match(/\{[\s\S]*\}/);
      parsed = m ? JSON.parse(m[0]) : {};
    }

    const rows: any[] = Array.isArray(parsed?.r) ? parsed.r : (Array.isArray(parsed?.items) ? parsed.items : []);
    const out: string[] = items.map((it) => {
      const found = rows.find((r) => Number(r?.i) === it.i);
      const val = found?.t;
      return typeof val === 'string' && val.trim() ? val : it.t;
    });

    return new Response(JSON.stringify({ translations: out }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('translate-texts error:', error?.message || error);
    return new Response(JSON.stringify({ error: error?.message || 'unknown error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
