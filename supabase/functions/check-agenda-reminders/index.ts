import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Checking for agenda reminders...');

    // Get all events that need reminders
    // Events where reminder_shown = false and reminder_minutes > 0
    // And the reminder time has passed (start_date - reminder_minutes <= now)
    const { data: events, error } = await supabase
      .from('agenda_events')
      .select('*')
      .eq('reminder_shown', false)
      .gt('reminder_minutes', 0);

    if (error) {
      console.error('Error fetching events:', error);
      throw error;
    }

    if (!events || events.length === 0) {
      console.log('No events to process');
      return new Response(
        JSON.stringify({ message: 'No reminders to send', processed: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const now = new Date();
    let sentCount = 0;

    for (const event of events) {
      const eventDate = new Date(event.start_date);
      const reminderTime = new Date(eventDate.getTime() - (event.reminder_minutes * 60 * 1000));

      // Check if it's time to send the reminder
      if (now >= reminderTime) {
        console.log(`Sending reminder for event: ${event.title}`);

        // Check if user has push subscriptions
        const { data: subscriptions } = await supabase
          .from('push_subscriptions')
          .select('id')
          .eq('user_id', event.user_id);

        if (subscriptions && subscriptions.length > 0) {
          // Send push notification
          try {
            const response = await fetch(`${supabaseUrl}/functions/v1/send-push-notification`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${supabaseKey}`
              },
              body: JSON.stringify({
                userId: event.user_id,
                title: '📅 Lembrete de Evento',
                body: `${event.title} - ${eventDate.toLocaleString('pt-BR', { 
                  day: '2-digit',
                  month: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit'
                })}`,
                tag: `event-${event.id}`,
                data: { eventId: event.id }
              })
            });

            if (response.ok) {
              sentCount++;
              console.log(`Reminder sent for event: ${event.id}`);
            } else {
              const text = await response.text();
              console.error(`Failed to send reminder for event ${event.id}:`, text);
            }
          } catch (sendError) {
            console.error(`Error sending push for event ${event.id}:`, sendError);
          }
        }

        // Mark reminder as shown (even if push failed, to avoid spam)
        await supabase
          .from('agenda_events')
          .update({ reminder_shown: true })
          .eq('id', event.id);
      }
    }

    console.log(`Processed ${events.length} events, sent ${sentCount} notifications`);

    return new Response(
      JSON.stringify({ 
        message: 'Reminders processed',
        processed: events.length,
        sent: sentCount
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
