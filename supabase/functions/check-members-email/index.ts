import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { checkoutId, email } = await req.json();
    if (!checkoutId || !email || typeof email !== 'string') {
      return new Response(JSON.stringify({ exists: false }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const normalizedEmail = email.trim().toLowerCase();

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: checkout } = await supabase
      .from('checkouts')
      .select('integration_type, integration_id')
      .eq('id', checkoutId)
      .single();

    if (!checkout || checkout.integration_type !== 'members_area' || !checkout.integration_id) {
      return new Response(JSON.stringify({ exists: false }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: existing, error: existingError } = await supabase
      .from('members_area_access_codes')
      .select('customer_name')
      .eq('members_area_id', checkout.integration_id)
      .ilike('customer_email', normalizedEmail)
      .eq('is_active', true)
      .order('created_at', { ascending: true })
      .limit(1);

    if (existingError) throw existingError;

    const existingCode = existing?.[0];

    return new Response(
      JSON.stringify({ exists: !!existingCode, customerName: existingCode?.customer_name || null }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('check-members-email error:', error);
    return new Response(JSON.stringify({ exists: false }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
