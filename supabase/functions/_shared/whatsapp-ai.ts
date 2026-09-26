// Shared helpers for the WhatsApp AI module (Evolution API + Meta Cloud API).
import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

export const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

export const adminClient = (): SupabaseClient =>
  createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

export interface Credentials {
  connection_id: string;
  webhook_secret: string;
  evolution_base_url: string | null;
  evolution_api_key: string | null;
  evolution_instance: string | null;
  meta_phone_number_id: string | null;
  meta_access_token: string | null;
  meta_verify_token: string | null;
}

export interface Connection {
  id: string;
  user_id: string;
  provider: "evolution" | "meta";
  status: string;
  agent_enabled: boolean;
  agent_name: string;
  personality: string;
  system_prompt: string;
  rules: string;
  handoff_keywords: string[];
  handoff_message: string;
}

export const webhookUrl = (connectionId: string, secret: string) =>
  `${Deno.env.get("SUPABASE_URL")}/functions/v1/whatsapp-ai-webhook?cid=${connectionId}&s=${secret}`;

export const evoBase = (c: Credentials) => (c.evolution_base_url ?? "").replace(/\/+$/, "");

export async function evoFetch(c: Credentials, path: string, init: RequestInit = {}) {
  const res = await fetch(`${evoBase(c)}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", apikey: c.evolution_api_key ?? "", ...(init.headers ?? {}) },
  });
  const text = await res.text();
  let data: any = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = { raw: text }; }
  return { ok: res.ok, status: res.status, data };
}

/** Sends a text message through the connection's provider. Throws on failure. */
export async function sendText(provider: string, c: Credentials, to: string, text: string) {
  const number = to.replace(/\D/g, "");
  if (provider === "evolution") {
    const r = await evoFetch(c, `/message/sendText/${encodeURIComponent(c.evolution_instance ?? "")}`, {
      method: "POST",
      body: JSON.stringify({ number, text }),
    });
    if (!r.ok) throw new Error(`Evolution ${r.status}: ${JSON.stringify(r.data).slice(0, 200)}`);
    return r.data?.key?.id as string | undefined;
  }
  const res = await fetch(`https://graph.facebook.com/v21.0/${c.meta_phone_number_id}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${c.meta_access_token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ messaging_product: "whatsapp", to: number, type: "text", text: { body: text } }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Meta ${res.status}: ${data?.error?.message ?? "erro"}`);
  return data?.messages?.[0]?.id as string | undefined;
}

/** Calls the Lovable AI Gateway (Responses API, streamed) and returns the final text. */
export async function generateReply(conn: Connection, history: { role: "user" | "assistant"; content: string }[]) {
  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) throw new Error("LOVABLE_API_KEY ausente");
  const instructions = [
    `Seu nome é ${conn.agent_name}. Você atende clientes pelo WhatsApp.`,
    `Personalidade: ${conn.personality}`,
    `Instruções de atendimento:\n${conn.system_prompt}`,
    conn.rules ? `Regras obrigatórias:\n${conn.rules}` : "",
    "Responda em mensagens curtas, próprias para WhatsApp, sem markdown pesado.",
    "Se não souber responder, se o cliente estiver irritado ou pedir algo fora das regras, responda apenas com [TRANSFERIR].",
  ].filter(Boolean).join("\n\n");

  const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "fetch" },
    body: JSON.stringify({
      model: "openai/gpt-6-astra",
      instructions,
      input: history.map((m) => ({ role: m.role, content: m.content })),
      stream: true,
      store: false,
      reasoning: { effort: "low", summary: "auto" },
      include: ["reasoning.encrypted_content"],
    }),
  });
  if (!res.ok || !res.body) {
    const t = await res.text().catch(() => "");
    const err = new Error(`AI ${res.status}: ${t.slice(0, 200)}`) as Error & { status?: number };
    err.status = res.status;
    throw err;
  }
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = "";
  let out = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    const lines = buf.split("\n");
    buf = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.startsWith("data:")) continue;
      const payload = line.slice(5).trim();
      if (!payload || payload === "[DONE]") continue;
      try {
        const ev = JSON.parse(payload);
        if (ev.type === "response.output_text.delta") out += ev.delta ?? "";
        if (ev.type === "error" || ev.type === "response.failed") throw new Error(ev.message ?? "falha da IA");
      } catch (e) {
        if (e instanceof SyntaxError) continue;
        throw e;
      }
    }
  }
  return out.trim();
}
