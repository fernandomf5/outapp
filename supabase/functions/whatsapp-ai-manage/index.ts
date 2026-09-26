// Authenticated management API for WhatsApp AI connections.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  adminClient, corsHeaders, evoFetch, json, sendText, webhookUrl, type Credentials,
} from "../_shared/whatsapp-ai.ts";

const EVENTS = ["MESSAGES_UPSERT", "CONNECTION_UPDATE", "QRCODE_UPDATED"];
const mask = (v: string | null) => (v ? `${v.slice(0, 4)}••••${v.slice(-3)}` : null);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const auth = req.headers.get("Authorization") ?? "";
    const userClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: auth } },
    });
    const { data: { user } } = await userClient.auth.getUser(auth.replace("Bearer ", ""));
    if (!user) return json({ error: "Não autenticado" }, 401);

    const body = await req.json().catch(() => ({}));
    const action = String(body.action ?? "");
    const db = adminClient();

    // Conversation-scoped action
    if (action === "send_message") {
      const text = String(body.text ?? "").trim().slice(0, 4000);
      if (!text) return json({ error: "Mensagem vazia" }, 400);
      const { data: conv } = await db.from("whatsapp_ai_conversations").select("*").eq("id", body.conversationId).eq("user_id", user.id).maybeSingle();
      if (!conv) return json({ error: "Conversa não encontrada" }, 404);
      const { data: conn } = await db.from("whatsapp_ai_connections").select("provider").eq("id", conv.connection_id).single();
      const { data: creds } = await db.from("whatsapp_ai_credentials").select("*").eq("connection_id", conv.connection_id).maybeSingle();
      if (!creds || !conn) return json({ error: "Conexão sem credenciais" }, 400);
      const extId = await sendText(conn.provider, creds as Credentials, conv.contact_phone, text);
      await db.from("whatsapp_ai_messages").insert({ conversation_id: conv.id, user_id: user.id, direction: "out", sender: "human", content: text, external_id: extId ?? null });
      await db.from("whatsapp_ai_conversations").update({ mode: conv.mode === "closed" ? "human" : conv.mode === "ai" ? "human" : conv.mode, last_message_at: new Date().toISOString(), last_message_preview: text.slice(0, 120), unread_count: 0 }).eq("id", conv.id);
      return json({ ok: true });
    }

    // Connection-scoped actions
    const { data: conn } = await db.from("whatsapp_ai_connections").select("*").eq("id", body.connectionId).eq("user_id", user.id).maybeSingle();
    if (!conn) return json({ error: "Conexão não encontrada" }, 404);
    let { data: creds } = await db.from("whatsapp_ai_credentials").select("*").eq("connection_id", conn.id).maybeSingle();
    if (!creds) {
      const ins = await db.from("whatsapp_ai_credentials").insert({ connection_id: conn.id }).select().single();
      creds = ins.data;
    }
    const c = creds as Credentials;
    const hook = webhookUrl(conn.id, c.webhook_secret);
    const setStatus = (patch: Record<string, unknown>) =>
      db.from("whatsapp_ai_connections").update({ ...patch, updated_at: new Date().toISOString() }).eq("id", conn.id);

    switch (action) {
      case "get_setup":
        return json({
          webhookUrl: hook,
          verifyToken: c.meta_verify_token,
          evolution_base_url: c.evolution_base_url,
          evolution_instance: c.evolution_instance,
          evolution_api_key_masked: mask(c.evolution_api_key),
          meta_phone_number_id: c.meta_phone_number_id,
          meta_access_token_masked: mask(c.meta_access_token),
        });

      case "save_credentials": {
        const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
        if (conn.provider === "evolution") {
          const url = String(body.evolution_base_url ?? "").trim();
          if (url && !/^https?:\/\//i.test(url)) return json({ error: "URL da Evolution inválida" }, 400);
          if (url) patch.evolution_base_url = url;
          if (body.evolution_api_key) patch.evolution_api_key = String(body.evolution_api_key).trim();
          const inst = String(body.evolution_instance ?? "").trim().replace(/[^a-zA-Z0-9_-]/g, "");
          if (inst) patch.evolution_instance = inst;
        } else {
          if (body.meta_phone_number_id) patch.meta_phone_number_id = String(body.meta_phone_number_id).replace(/\D/g, "");
          if (body.meta_access_token) patch.meta_access_token = String(body.meta_access_token).trim();
          if (!c.meta_verify_token) patch.meta_verify_token = crypto.randomUUID().replace(/-/g, "");
        }
        await db.from("whatsapp_ai_credentials").update(patch).eq("connection_id", conn.id);
        return json({ ok: true });
      }

      case "connect": {
        if (conn.provider === "meta") {
          if (!c.meta_phone_number_id || !c.meta_access_token) return json({ error: "Informe o ID do número e o token da Meta" }, 400);
          const r = await fetch(`https://graph.facebook.com/v21.0/${c.meta_phone_number_id}?fields=display_phone_number,verified_name`, {
            headers: { Authorization: `Bearer ${c.meta_access_token}` },
          });
          const d = await r.json().catch(() => ({}));
          if (!r.ok) {
            await setStatus({ status: "error", last_error: d?.error?.message ?? "Credenciais inválidas" });
            return json({ error: d?.error?.message ?? "Credenciais da Meta inválidas" }, 400);
          }
          await setStatus({ status: "connected", phone_number: d.display_phone_number ?? null, last_error: null, qr_code: null });
          return json({ ok: true, status: "connected" });
        }
        if (!c.evolution_base_url || !c.evolution_api_key || !c.evolution_instance) return json({ error: "Informe URL, chave e nome da instância" }, 400);
        const inst = encodeURIComponent(c.evolution_instance);
        let qr: string | null = null;
        const created = await evoFetch(c, "/instance/create", {
          method: "POST",
          body: JSON.stringify({
            instanceName: c.evolution_instance, qrcode: true, integration: "WHATSAPP-BAILEYS",
            webhook: { url: hook, byEvents: false, base64: false, events: EVENTS },
          }),
        });
        qr = created.data?.qrcode?.base64 ?? null;
        if (!created.ok && created.status === 401) {
          await setStatus({ status: "error", last_error: "Chave da Evolution inválida" });
          return json({ error: "Chave da Evolution API inválida" }, 400);
        }
        // Always (re)apply the webhook, e.g. when the instance already existed.
        await evoFetch(c, `/webhook/set/${inst}`, {
          method: "POST",
          body: JSON.stringify({ webhook: { enabled: true, url: hook, byEvents: false, base64: false, events: EVENTS } }),
        });
        const state = await evoFetch(c, `/instance/connectionState/${inst}`);
        if (state.data?.instance?.state === "open") {
          await setStatus({ status: "connected", qr_code: null, last_error: null });
          return json({ ok: true, status: "connected" });
        }
        if (!qr) {
          const cn = await evoFetch(c, `/instance/connect/${inst}`);
          if (!cn.ok) {
            await setStatus({ status: "error", last_error: `Evolution respondeu ${cn.status}` });
            return json({ error: `Não foi possível obter o QR Code (Evolution ${cn.status})` }, 400);
          }
          qr = cn.data?.base64 ?? null;
        }
        await setStatus({ status: qr ? "qr_code" : "connecting", qr_code: qr, last_error: null });
        return json({ ok: true, status: qr ? "qr_code" : "connecting", qr });
      }

      case "refresh_status": {
        if (conn.provider === "meta") return json({ status: conn.status });
        const inst = encodeURIComponent(c.evolution_instance ?? "");
        const state = await evoFetch(c, `/instance/connectionState/${inst}`);
        if (state.data?.instance?.state === "open") {
          await setStatus({ status: "connected", qr_code: null, last_error: null });
          return json({ status: "connected" });
        }
        return json({ status: conn.status });
      }

      case "disconnect": {
        if (conn.provider === "evolution" && c.evolution_instance) {
          await evoFetch(c, `/instance/logout/${encodeURIComponent(c.evolution_instance)}`, { method: "DELETE" });
        }
        await setStatus({ status: "disconnected", qr_code: null });
        return json({ ok: true });
      }

      default:
        return json({ error: "Ação inválida" }, 400);
    }
  } catch (e) {
    console.error("whatsapp-ai-manage", e);
    return json({ error: e instanceof Error ? e.message : "Erro inesperado" }, 500);
  }
});
