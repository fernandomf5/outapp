import { supabase } from "@/integrations/supabase/client";

export type CheckoutEventType =
  | "view"
  | "form_start"
  | "bump_added"
  | "checkout_start"
  | "payment_success";

const SESSION_KEY = "checkout_session_id";

export const getCheckoutSessionId = () => {
  try {
    let id = sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return "anon";
  }
};

const getDevice = () => {
  const w = typeof window !== "undefined" ? window.innerWidth : 1200;
  if (w < 640) return "mobile";
  if (w < 1024) return "tablet";
  return "desktop";
};

export const trackCheckoutEvent = async (
  checkoutId: string,
  eventType: CheckoutEventType,
  metadata: Record<string, any> = {},
) => {
  if (!checkoutId) return;
  try {
    await supabase.from("checkout_events").insert({
      checkout_id: checkoutId,
      event_type: eventType,
      session_id: getCheckoutSessionId(),
      referrer: typeof document !== "undefined" ? document.referrer || null : null,
      device: getDevice(),
      metadata,
    });
  } catch (e) {
    // analytics must never break the checkout
    console.warn("checkout event failed", e);
  }
};
