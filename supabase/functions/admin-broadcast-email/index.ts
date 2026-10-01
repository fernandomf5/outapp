// Master-only: sends a promotional/custom email to selected registered users via Resend.
// Recipients are resolved server-side from profiles by user_id (never trusted emails from client).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { escapeHtml, layout, sendMail, button, DASHBOARD_URL } from "../_shared/resend-mail.ts";

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
    if (!user) return json({ error: "Não autenticado" }, 401);

    const db = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: isAdmin } = await db.rpc("has_role", { _user_id: user.id, _role: "admin" });
    if (!isAdmin) return json({ error: "Acesso negado" }, 403);

    const body = await req.json().catch(() => ({}));
    const subject = String(body.subject ?? "").trim().slice(0, 200);
    const message = String(body.message ?? "").trim().slice(0, 10000);
    const ids: string[] = Array.isArray(body.userIds) ? body.userIds.filter((x: unknown) => typeof x === "string").slice(0, 2000) : [];
    if (!subject || !message || ids.length === 0) return json({ error: "Assunto, mensagem e destinatários são obrigatórios" }, 400);

    const { data: profiles, error } = await db.from("profiles").select("full_name, email").in("user_id", ids);
    if (error) throw error;

    let sent = 0;
    const failed: string[] = [];
    for (const pr of profiles ?? []) {
      if (!pr.email) continue;
      const name = (pr.full_name ?? "").split(" ")[0] || "tudo bem";
      // Supports {nome} placeholder; text is escaped and line breaks preserved.
      const text = escapeHtml(message.replaceAll("{nome}", name)).replace(/\n/g, "<br>");
      const html = layout(subject,
        `<p style="font-size:15px;line-height:1.6;margin:0 0 16px;color:#374151">${text}</p>` + button("Acessar a Out App", DASHBOARD_URL));
      try { await sendMail(pr.email, subject, html); sent++; } catch { failed.push(pr.email); }
      await new Promise((r) => setTimeout(r, 550)); // respect Resend rate limit (~2/s)
    }
    return json({ ok: true, sent, failed });
  } catch (e) {
    console.error(e);
    return json({ error: e instanceof Error ? e.message : "Erro" }, 500);
  }
});
