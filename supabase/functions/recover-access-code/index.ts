import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { slug, email } = await req.json();
    if (!slug || !email) throw new Error('slug e email são obrigatórios');

    const normalizedEmail = String(email).trim().toLowerCase();

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: area, error: areaErr } = await supabase
      .from('simple_members_areas')
      .select('id, name, slug')
      .eq('slug', slug)
      .single();
    if (areaErr || !area) throw new Error('Área de membros não encontrada');

    const { data: codes, error: codeErr } = await supabase
      .from('members_area_access_codes')
      .select('access_code, customer_name, customer_email, is_active')
      .eq('members_area_id', area.id)
      .ilike('customer_email', normalizedEmail)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1);

    if (codeErr) throw codeErr;

    // Always return generic success to avoid email enumeration
    const generic = { success: true, message: 'Se o email tiver acesso a esta área, enviaremos o código.' };

    if (!codes || codes.length === 0) {
      return new Response(JSON.stringify(generic), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const code = codes[0];
    const origin = req.headers.get('origin') || 'https://outapp.com.br';
    const accessLink = `${origin}/members/${area.slug}?code=${code.access_code}`;

    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (resendApiKey) {
      const html = `
        <div style="font-family: Arial, sans-serif; max-width:600px; margin:0 auto; padding:20px;">
          <div style="text-align:center; padding:30px 0; background:linear-gradient(135deg,#8B5CF6,#6D28D9); border-radius:12px; margin-bottom:30px;">
            <h1 style="color:#fff; margin:0; font-size:22px;">🔐 Recuperação de Código</h1>
          </div>
          <p style="font-size:16px; color:#333;">Olá, <strong>${code.customer_name || 'Aluno'}</strong>!</p>
          <p style="font-size:14px; color:#555; line-height:1.6;">
            Aqui está seu código de acesso para <strong>${area.name}</strong>:
          </p>
          <div style="text-align:center; margin:30px 0; padding:25px; background:#F3F4F6; border-radius:12px; border:2px dashed #8B5CF6;">
            <p style="font-size:32px; font-weight:bold; color:#8B5CF6; margin:0; letter-spacing:4px; font-family:monospace;">${code.access_code}</p>
          </div>
          <div style="text-align:center; margin:30px 0;">
            <a href="${accessLink}" style="display:inline-block; background:linear-gradient(135deg,#8B5CF6,#6D28D9); color:#fff; text-decoration:none; padding:14px 32px; border-radius:8px; font-weight:bold;">
              Acessar Área de Membros
            </a>
          </div>
          <p style="font-size:12px; color:#888; text-align:center; word-break:break-all;">${accessLink}</p>
        </div>`;
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${resendApiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: 'Out App <noreply@outapp.com.br>',
          to: [code.customer_email],
          subject: `🔐 Seu código de acesso - ${area.name}`,
          html,
        }),
      });
    }

    return new Response(JSON.stringify(generic), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('recover-access-code error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
