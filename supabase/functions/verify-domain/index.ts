import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { domain_id } = await req.json();

    // Buscar o domínio
    const { data: domain, error: domainError } = await supabaseClient
      .from("user_domains")
      .select("*")
      .eq("id", domain_id)
      .eq("user_id", user.id)
      .single();

    if (domainError || !domain) {
      return new Response(
        JSON.stringify({ error: "Domínio não encontrado" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verificar DNS usando API externa
    try {
      // Verificar registros A
      const dnsResponseA = await fetch(
        `https://dns.google/resolve?name=${domain.domain}&type=A`
      );
      const dnsDataA = await dnsResponseA.json();

      const expectedIP = "185.158.133.1";
      const hasCorrectIP = dnsDataA.Answer?.some(
        (record: any) => record.type === 1 && record.data === expectedIP
      );

      // Verificar registro TXT de verificação
      let hasTxtVerification = false;
      if (domain.verification_code) {
        const dnsResponseTXT = await fetch(
          `https://dns.google/resolve?name=_lovable.${domain.domain}&type=TXT`
        );
        const dnsDataTXT = await dnsResponseTXT.json();
        
        const expectedTxt = `lovable_verify=${domain.verification_code}`;
        hasTxtVerification = dnsDataTXT.Answer?.some(
          (record: any) => record.type === 16 && record.data.includes(expectedTxt)
        );
      }

      // Para verificar, precisa ter ambos os registros corretos
      if (hasCorrectIP && (hasTxtVerification || !domain.verification_code)) {
        // Atualizar domínio como verificado
        await supabaseClient
          .from("user_domains")
          .update({ is_verified: true })
          .eq("id", domain_id);

        return new Response(
          JSON.stringify({
            verified: true,
            message: "Domínio verificado com sucesso!",
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } else {
        const missingRecords = [];
        if (!hasCorrectIP) missingRecords.push(`Registro A para ${expectedIP}`);
        if (domain.verification_code && !hasTxtVerification) missingRecords.push("Registro TXT _lovable");
        
        return new Response(
          JSON.stringify({
            verified: false,
            message: `DNS ainda não propagou. Faltam: ${missingRecords.join(", ")}`,
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } catch (dnsError) {
      console.error("Erro ao verificar DNS:", dnsError);
      return new Response(
        JSON.stringify({
          verified: false,
          message: "Erro ao verificar DNS. Tente novamente em alguns minutos.",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    console.error("Erro:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
