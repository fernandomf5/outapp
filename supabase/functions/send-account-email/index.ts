// Sends the "voucher applied / plan active" email to the signed-in user.
// The recipient is always the authenticated user's own email, and the plan
// details are read from the database (never trusted from the client).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { planActivatedEmail, sendMail } from "../_shared/resend-mail.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const auth = req.headers.get("Authorization") ?? "";
    const url = Deno.env.get("SUPABASE_URL")!;
    const userClient = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: auth } } });
    const { data: { user } } = await userClient.auth.getUser(auth.replace("Bearer ", ""));
    if (!user?.email) return json({ error: "Não autenticado" }, 401);

    const body = await req.json().catch(() => ({}));
    if (body.type !== "voucher_redeemed") return json({ error: "Tipo inválido" }, 400);
    const voucherCode = String(body.voucherCode ?? "").trim().slice(0, 60);

    const db = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    // Only send when the user really has a subscription created in the last 10 minutes.
    const since = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const { data: sub } = await db.from("subscriptions")
      .select("expires_at, plans(name)").eq("user_id", user.id).eq("status", "active")
      .gte("created_at", since).order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (!sub) return json({ error: "Nenhuma ativação recente encontrada" }, 404);

    const { data: profile } = await db.from("profiles").select("full_name").eq("user_id", user.id).maybeSingle();
    const planName = (sub as { plans?: { name?: string } | null }).plans?.name ?? "Plano Out App";
    await sendMail(user.email, `Voucher aplicado: plano ${planName} ativo — Out App`,
      planActivatedEmail(profile?.full_name ?? "", planName, sub.expires_at, voucherCode || "informado"));
    return json({ ok: true });
  } catch (e) {
    console.error("send-account-email", e);
    return json({ error: e instanceof Error ? e.message : "Erro inesperado" }, 500);
  }
});
