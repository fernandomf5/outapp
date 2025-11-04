import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { productIdea, category } = await req.json();
    
    if (!productIdea) {
      throw new Error('Product idea is required');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Generate content using Lovable AI
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `Você é um especialista em criar conteúdo para produtos digitais em PDF. 
            Gere conteúdo completo, estruturado e profissional com pelo menos 10 páginas de conteúdo rico.
            Inclua: introdução, capítulos bem desenvolvidos, dicas práticas, exemplos e conclusão.
            Formate o texto de forma que possa ser facilmente convertido em PDF.`
          },
          {
            role: 'user',
            content: `Crie um produto digital completo sobre: ${productIdea}
            Categoria: ${category || 'Geral'}
            
            Estruture com:
            - Capa com título atrativo
            - Sumário
            - Introdução (1-2 páginas)
            - 5-8 capítulos principais com conteúdo denso
            - Dicas e práticas acionáveis
            - Conclusão
            - Recursos adicionais
            
            Faça o conteúdo ter pelo menos 3000 palavras.`
          }
        ],
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Limite de requisições excedido. Tente novamente em alguns minutos.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Créditos insuficientes. Adicione créditos em Settings -> Workspace -> Usage.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw new Error('Failed to generate content');
    }

    const aiData = await aiResponse.json();
    const generatedContent = aiData.choices[0].message.content;

    // Generate a simple HTML for PDF conversion
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            max-width: 800px;
            margin: 0 auto;
            padding: 40px;
            color: #333;
          }
          h1 { color: #2563eb; border-bottom: 3px solid #2563eb; padding-bottom: 10px; }
          h2 { color: #1e40af; margin-top: 30px; }
          h3 { color: #3b82f6; }
          p { margin: 15px 0; text-align: justify; }
          .cover {
            text-align: center;
            padding: 100px 0;
            page-break-after: always;
          }
          .cover h1 {
            font-size: 42px;
            border: none;
          }
          .chapter {
            page-break-before: always;
            margin-top: 50px;
          }
          @media print {
            body { margin: 0; padding: 20px; }
            .page-break { page-break-after: always; }
          }
        </style>
      </head>
      <body>
        ${generatedContent.replace(/\n/g, '<br>').replace(/#{3}\s/g, '<h3>').replace(/#{2}\s/g, '<h2>').replace(/#{1}\s/g, '<h1>')}
      </body>
      </html>
    `;

    return new Response(
      JSON.stringify({ 
        content: generatedContent,
        htmlContent,
        wordCount: generatedContent.split(' ').length
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error generating product:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});