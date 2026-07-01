import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const VALID_TYPES = ['text','textarea','email','phone','number','checkbox','select','radio','rating','file','date','time','url','address','color'];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  try {
    const { text } = await req.json();
    if (!text || typeof text !== 'string') {
      throw new Error('text is required');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');

    const systemPrompt = `Você extrai perguntas de um briefing a partir de texto livre em português e retorna JSON válido.
Regras:
- Identifique cada pergunta (mesmo que estejam em parágrafos, listas, com números, hífens, etc).
- Para cada pergunta, gere um objeto: { "label": string, "type": string, "required": boolean, "options"?: string[], "placeholder"?: string }.
- "type" DEVE ser um destes: ${VALID_TYPES.join(', ')}.
- Escolha o tipo mais apropriado (ex: e-mail => email, telefone => phone, endereço/CEP => address, data => date, cor => color, upload/anexo => file, avaliação/nota => rating, escolha única com opções => radio, várias opções => select, texto longo => textarea, sim/não => checkbox, número => number, link => url).
- Se houver opções listadas na pergunta, inclua-as em "options".
- Retorne SOMENTE JSON no formato: {"fields":[...],"title":"sugestão de título curto","description":"descrição curta opcional"}.
- Não invente perguntas que não estejam no texto.`;

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
          { role: 'user', content: text },
        ],
        response_format: { type: 'json_object' },
      }),
    });

    if (!aiRes.ok) {
      const err = await aiRes.text();
      throw new Error(`AI error: ${aiRes.status} ${err}`);
    }

    const data = await aiRes.json();
    const content = data.choices?.[0]?.message?.content || '{}';
    let parsed: any;
    try { parsed = JSON.parse(content); } catch { parsed = {}; }

    const rawFields = Array.isArray(parsed.fields) ? parsed.fields : [];
    const fields = rawFields
      .filter((f: any) => f && typeof f.label === 'string' && f.label.trim())
      .map((f: any, i: number) => ({
        id: `field-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 7)}`,
        label: String(f.label).trim(),
        type: VALID_TYPES.includes(f.type) ? f.type : 'text',
        required: Boolean(f.required),
        placeholder: typeof f.placeholder === 'string' ? f.placeholder : '',
        step: 1,
        ...(Array.isArray(f.options) && f.options.length ? { options: f.options.map((o: any) => String(o)) } : {}),
      }));

    return new Response(
      JSON.stringify({
        fields,
        title: typeof parsed.title === 'string' ? parsed.title : '',
        description: typeof parsed.description === 'string' ? parsed.description : '',
      }),
      { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  } catch (error: any) {
    console.error('parse-briefing-questions error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
});
