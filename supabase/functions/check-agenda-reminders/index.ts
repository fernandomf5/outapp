import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const parseDateAtNoon = (dateValue: string) => new Date(`${dateValue}T12:00:00`);

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let agendaProcessed = 0;
    let agendaSent = 0;
    let invoicesProcessed = 0;
    let invoicesSent = 0;

    console.log("Checking for agenda reminders...");

    const { data: events, error: eventsError } = await supabase
      .from("agenda_events")
      .select("*")
      .eq("reminder_shown", false)
      .gt("reminder_minutes", 0);

    if (eventsError) {
      console.error("Error fetching agenda reminders:", eventsError);
      throw eventsError;
    }

    const now = new Date();

    for (const event of events ?? []) {
      agendaProcessed++;

      const eventDate = new Date(event.start_date);
      const reminderTime = new Date(eventDate.getTime() - event.reminder_minutes * 60 * 1000);

      if (now < reminderTime) continue;

      const { data: subscriptions } = await supabase
        .from("push_subscriptions")
        .select("id")
        .eq("user_id", event.user_id)
        .limit(1);

      if (subscriptions && subscriptions.length > 0) {
        try {
          const response = await fetch(`${supabaseUrl}/functions/v1/send-push-notification`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${supabaseKey}`,
            },
            body: JSON.stringify({
              userId: event.user_id,
              title: "📅 Lembrete de Evento",
              body: `${event.title} - ${eventDate.toLocaleString("pt-BR", {
                day: "2-digit",
                month: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
              })}`,
              tag: `event-${event.id}`,
              data: { eventId: event.id },
            }),
          });

          if (response.ok) {
            agendaSent++;
          } else {
            console.error(`Failed to send agenda reminder for ${event.id}:`, await response.text());
          }
        } catch (sendError) {
          console.error(`Error sending agenda reminder for ${event.id}:`, sendError);
        }
      }

      await supabase.from("agenda_events").update({ reminder_shown: true }).eq("id", event.id);
    }

    console.log("Checking for invoice email reminders...");

    const { data: invoices, error: invoicesError } = await supabase
      .from("invoices")
      .select(`
        id,
        due_date,
        client_email,
        reminder_sent,
        recurring_plan_id,
        invoice_recurring_plans!inner (
          auto_send_email,
          reminder_days_before,
          is_active
        )
      `)
      .eq("status", "pending")
      .not("client_email", "is", null)
      .not("recurring_plan_id", "is", null)
      .eq("invoice_recurring_plans.auto_send_email", true)
      .eq("invoice_recurring_plans.is_active", true)
      .or("reminder_sent.is.false,reminder_sent.is.null");

    if (invoicesError) {
      console.error("Error fetching invoice reminders:", invoicesError);
      throw invoicesError;
    }

    for (const invoice of invoices ?? []) {
      invoicesProcessed++;

      const plan = Array.isArray(invoice.invoice_recurring_plans)
        ? invoice.invoice_recurring_plans[0]
        : invoice.invoice_recurring_plans;

      const reminderDaysBefore = Number(plan?.reminder_days_before ?? 5);
      const dueDate = parseDateAtNoon(invoice.due_date);
      const reminderDate = new Date(dueDate);
      reminderDate.setDate(reminderDate.getDate() - Math.max(0, reminderDaysBefore));

      if (now < reminderDate) continue;

      try {
        const response = await fetch(`${supabaseUrl}/functions/v1/send-invoice-reminder`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${supabaseKey}`,
          },
          body: JSON.stringify({
            invoice_id: invoice.id,
            is_reminder: true,
          }),
        });

        if (response.ok) {
          invoicesSent++;
        } else {
          console.error(`Failed to send invoice reminder for ${invoice.id}:`, await response.text());
        }
      } catch (sendError) {
        console.error(`Error sending invoice reminder for ${invoice.id}:`, sendError);
      }
    }

    return new Response(
      JSON.stringify({
        message: "Reminders processed",
        agenda: { processed: agendaProcessed, sent: agendaSent },
        invoices: { processed: invoicesProcessed, sent: invoicesSent },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
