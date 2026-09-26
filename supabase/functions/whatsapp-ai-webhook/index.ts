// Public webhook receiving events from Evolution API and Meta Cloud API.
// Authenticated by the per-connection secret in the URL (?cid=&s=).
import {
  adminClient, corsHeaders, generateReply, sendText, type Connection, type Credentials,
} from "../_shared/whatsapp-ai.ts";

declare const EdgeRuntime: { waitUntil(p: Promise<unknown>): void } | undefined;

interface Incoming { phone: string; name: string | null; text: string; externalId: string | null }

const normalize = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

async function handleIncoming(conn: Connection, creds: Credentials, msg: Incoming) {
  const db = adminClient();
  const now = new Date().toISOString();
  const { data: existing } = await db.from("whatsapp_ai_conversations").select("*")
    .eq("connection_id", conn.id).eq("contact_phone", msg.phone).maybeSingle();
  let conv = existing;
  if (!conv) {
    const ins = await db.from("whatsapp_ai_conversations").insert({
      connection_id: conn.id, user_id: conn.user_id, contact_phone: msg.phone, contact_name: msg.name,
    }).select().single();
    if (ins.error) throw ins.error;
    conv = ins.data;
  }
  const ins = await db.from("whatsapp_ai_messages").insert({
    conversation_id: conv.id, user_id: conn.user_id, direction: "in", sender: "contact", content: msg.text, external_id: msg.externalId,
  });
  if (ins.error) {
    if (ins.error.code === "23505") return; // duplicate delivery
    throw ins.error;
  }
  const reopened = conv.mode === "closed" ? "ai" : conv.mode;
  await db.from("whatsapp_ai_conversations").update({
    mode: reopened, contact_name: msg.name ?? conv.contact_name, last_message_at: now,
    last_message_preview: msg.text.slice(0, 120), unread_count: (conv.unread_count ?? 0) + 1, updated_at: now,
  }).eq("id", conv.id);

  if (!conn.agent_enabled || reopened !== "ai") return;

  const reply = async (text: string, sender: "ai" | "system") => {
    const extId = await sendText(conn.provider, creds, msg.phone, text);
    await db.from("whatsapp_ai_messages").insert({ conversation_id: conv.id, user_id: conn.user_id, direction: "out", sender, content: text, external_id: extId ?? null });
    await db.from("whatsapp_ai_conversations").update({ last_message_at: new Date().toISOString(), last_message_preview: text.slice(0, 120) }).eq("id", conv.id);
  };
  const handoff = async () => {
    await db.from("whatsapp_ai_conversations").update({ mode: "human" }).eq("id", conv.id);
    await reply(conn.handoff_message, "system");
  };

  const lower = normalize(msg.text);
  if ((conn.handoff_keywords ?? []).some((k) => k.trim() && lower.includes(normalize(k.trim())))) return handoff();

  const { data: hist } = await db.from("whatsapp_ai_messages").select("sender, content")
    .eq("conversation_id", conv.id).order("created_at", { ascending: false }).limit(20);
  const history = (hist ?? []).reverse().map((m) => ({
    role: (m.sender === "contact" ? "user" : "assistant") as "user" | "assistant", content: m.content,
  }));
  try {
    const text = await generateReply(conn, history);
    if (!text || text.includes("[TRANSFERIR]")) return handoff();
    await reply(text, "ai");
  } catch (e) {
    console.error("AI reply failed", e);
    // Terminal for this message: hand to a human instead of retrying.
    await db.from("whatsapp_ai_messages").insert({ conversation_id: conv.id, user_id: conn.user_id, direction: "out", sender: "system", content: `IA indisponível: ${(e as Error).message.slice(0, 150)}. Conversa enviada para atendimento humano.` });
    await db.from("whatsapp_ai_conversations").update({ mode: "human" }).eq("id", conv.id);
  }
}

function parseEvolution(body: any): { messages: Incoming[]; state?: string; qr?: string } {
  const event = String(body?.event ?? "").toLowerCase().replace("_", ".");
  const data = body?.data;
  if (event === "connection.update") return { messages: [], state: data?.state };
  if (event === "qrcode.updated") return { messages: [], qr: data?.qrcode?.base64 ?? data?.base64 };
  if (event !== "messages.upsert") return { messages: [] };
  const list = Array.isArray(data) ? data : [data];
  const messages: Incoming[] = [];
  for (const m of list) {
    const jid: string = m?.key?.remoteJid ?? "";
    if (!jid || m?.key?.fromMe || jid.endsWith("@g.us") || jid.includes("broadcast")) continue;
    const text = m?.message?.conversation ?? m?.message?.extendedTextMessage?.text ?? m?.message?.imageMessage?.caption;
    if (!text) continue;
    messages.push({ phone: jid.split("@")[0], name: m?.pushName ?? null, text: String(text), externalId: m?.key?.id ?? null });
  }
  return { messages };
}

function parseMeta(body: any): Incoming[] {
  const out: Incoming[] = [];
  for (const entry of body?.entry ?? []) for (const ch of entry?.changes ?? []) {
    const v = ch?.value;
    const name = v?.contacts?.[0]?.profile?.name ?? null;
    for (const m of v?.messages ?? []) {
      if (m?.type !== "text" || !m?.text?.body) continue;
      out.push({ phone: String(m.from), name, text: String(m.text.body), externalId: m.id ?? null });
    }
  }
  return out;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const url = new URL(req.url);
  const cid = url.searchParams.get("cid") ?? "";
  const secret = url.searchParams.get("s") ?? "";
  const db = adminClient();
  if (!/^[0-9a-f-]{36}$/i.test(cid)) return new Response("bad request", { status: 400 });
  const { data: creds } = await db.from("whatsapp_ai_credentials").select("*").eq("connection_id", cid).maybeSingle();
  if (!creds || creds.webhook_secret !== secret) return new Response("forbidden", { status: 403 });

  // Meta verification handshake
  if (req.method === "GET") {
    if (url.searchParams.get("hub.mode") === "subscribe" && url.searchParams.get("hub.verify_token") === creds.meta_verify_token) {
      return new Response(url.searchParams.get("hub.challenge") ?? "", { status: 200 });
    }
    return new Response("forbidden", { status: 403 });
  }

  const { data: conn } = await db.from("whatsapp_ai_connections").select("*").eq("id", cid).maybeSingle();
  if (!conn) return new Response("not found", { status: 404 });
  const body = await req.json().catch(() => ({}));

  let messages: Incoming[] = [];
  if (conn.provider === "evolution") {
    const p = parseEvolution(body);
    messages = p.messages;
    if (p.state === "open") await db.from("whatsapp_ai_connections").update({ status: "connected", qr_code: null }).eq("id", cid);
    if (p.state === "close") await db.from("whatsapp_ai_connections").update({ status: "disconnected" }).eq("id", cid);
    if (p.qr) await db.from("whatsapp_ai_connections").update({ status: "qr_code", qr_code: p.qr }).eq("id", cid);
  } else {
    messages = parseMeta(body);
  }

  const work = (async () => {
    for (const m of messages) {
      try { await handleIncoming(conn as Connection, creds as Credentials, m); }
      catch (e) { console.error("handleIncoming", e); }
    }
  })();
  if (typeof EdgeRuntime !== "undefined") EdgeRuntime.waitUntil(work); else await work;
  return new Response("ok", { status: 200, headers: corsHeaders });
});
