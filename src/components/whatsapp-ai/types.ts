import type { Tables } from "@/integrations/supabase/types";
import { supabase } from "@/integrations/supabase/client";

export type WaConnection = Tables<"whatsapp_ai_connections">;
export type WaConversation = Tables<"whatsapp_ai_conversations">;
export type WaMessage = Tables<"whatsapp_ai_messages">;

/** Calls the management function and surfaces its error message. */
export async function waManage<T = Record<string, unknown>>(body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke("whatsapp-ai-manage", { body });
  if (error) {
    let msg = error.message;
    try {
      const ctx = (error as { context?: Response }).context;
      if (ctx) msg = (await ctx.json())?.error ?? msg;
    } catch { /* keep default */ }
    throw new Error(msg);
  }
  if (data?.error) throw new Error(data.error);
  return data as T;
}

export const STATUS_LABEL: Record<string, string> = {
  disconnected: "Desconectado",
  connecting: "Conectando",
  qr_code: "Aguardando QR Code",
  connected: "Conectado",
  error: "Erro",
};
