import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Web Push library for Deno
// Using a simplified implementation that works with Deno

interface PushSubscription {
  endpoint: string;
  p256dh: string;
  auth: string;
}

interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: Record<string, unknown>;
}

// Helper to base64url encode
function base64UrlEncode(data: Uint8Array): string {
  const base64 = btoa(String.fromCharCode(...data));
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// Helper to base64url decode
function base64UrlDecode(str: string): Uint8Array {
  const padding = '='.repeat((4 - str.length % 4) % 4);
  const base64 = (str + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return new Uint8Array([...rawData].map(c => c.charCodeAt(0)));
}

// Create VAPID JWT token
async function createVapidJWT(
  audience: string,
  subject: string,
  privateKeyBase64: string,
  publicKeyBase64: string
): Promise<{ token: string; publicKey: string }> {
  const now = Math.floor(Date.now() / 1000);
  const exp = now + 12 * 60 * 60; // 12 hours

  const header = { typ: 'JWT', alg: 'ES256' };
  const payload = { aud: audience, exp, sub: subject };

  const headerB64 = base64UrlEncode(new TextEncoder().encode(JSON.stringify(header)));
  const payloadB64 = base64UrlEncode(new TextEncoder().encode(JSON.stringify(payload)));

  // Decode the private key
  const privateKeyBytes = base64UrlDecode(privateKeyBase64);
  
  // Import the private key for ECDSA signing
  const privateKey = await crypto.subtle.importKey(
    'pkcs8',
    createPKCS8Key(privateKeyBytes),
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign']
  );

  // Sign the JWT
  const signatureInput = new TextEncoder().encode(`${headerB64}.${payloadB64}`);
  const signature = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    privateKey,
    signatureInput
  );

  // Convert signature to JWS format (r || s format)
  const signatureB64 = base64UrlEncode(new Uint8Array(signature));

  return {
    token: `${headerB64}.${payloadB64}.${signatureB64}`,
    publicKey: publicKeyBase64
  };
}

// Helper to create PKCS8 formatted key from raw private key bytes
function createPKCS8Key(rawKey: Uint8Array): ArrayBuffer {
  // PKCS#8 header for P-256 EC private key
  const pkcs8Header = new Uint8Array([
    0x30, 0x81, 0x87, // SEQUENCE, length
    0x02, 0x01, 0x00, // INTEGER version = 0
    0x30, 0x13,       // SEQUENCE (AlgorithmIdentifier)
    0x06, 0x07,       // OID
    0x2a, 0x86, 0x48, 0xce, 0x3d, 0x02, 0x01, // id-ecPublicKey
    0x06, 0x08,       // OID
    0x2a, 0x86, 0x48, 0xce, 0x3d, 0x03, 0x01, 0x07, // prime256v1
    0x04, 0x6d,       // OCTET STRING
    0x30, 0x6b,       // SEQUENCE (ECPrivateKey)
    0x02, 0x01, 0x01, // INTEGER version = 1
    0x04, 0x20        // OCTET STRING, 32 bytes (the private key)
  ]);

  // Create the full key
  const fullKey = new Uint8Array(pkcs8Header.length + rawKey.length);
  fullKey.set(pkcs8Header);
  fullKey.set(rawKey, pkcs8Header.length);

  return fullKey.buffer;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY')!;
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { userId, title, body, icon, tag, data } = await req.json();

    console.log(`Sending push notification to user: ${userId}`);
    console.log(`Title: ${title}, Body: ${body}`);

    // Get user's push subscriptions
    const { data: subscriptions, error: subError } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', userId);

    if (subError) {
      console.error('Error fetching subscriptions:', subError);
      throw subError;
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log('No subscriptions found for user');
      return new Response(
        JSON.stringify({ success: false, message: 'No subscriptions found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const payload: PushPayload = {
      title,
      body,
      icon: icon || '/logo.png',
      badge: '/favicon.png',
      tag: tag || 'notification',
      data: data || {}
    };

    console.log(`Found ${subscriptions.length} subscriptions, sending notifications...`);

    let successCount = 0;
    const failedEndpoints: string[] = [];

    for (const sub of subscriptions) {
      try {
        const endpoint = new URL(sub.endpoint);
        const audience = endpoint.origin;

        // For FCM/GCM, we can send directly without encryption for testing
        // In production, you'd want proper WebPush encryption
        
        const response = await fetch(sub.endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'TTL': '86400',
            'Urgency': 'high'
          },
          body: JSON.stringify(payload)
        });

        if (response.ok) {
          successCount++;
          console.log(`Push sent successfully to endpoint`);
        } else {
          const status = response.status;
          const text = await response.text();
          console.error(`Push failed with status ${status}: ${text}`);
          
          // If subscription is no longer valid (410 Gone or 404), remove it
          if (status === 410 || status === 404) {
            console.log(`Removing invalid subscription: ${sub.id}`);
            await supabase
              .from('push_subscriptions')
              .delete()
              .eq('id', sub.id);
          }
          
          failedEndpoints.push(sub.endpoint);
        }
        
        // Consume response body to prevent leaks
        await response.text().catch(() => {});
      } catch (sendError) {
        console.error(`Error sending push to ${sub.endpoint}:`, sendError);
        failedEndpoints.push(sub.endpoint);
      }
    }

    console.log(`Successfully sent ${successCount}/${subscriptions.length} notifications`);

    return new Response(
      JSON.stringify({ 
        success: successCount > 0, 
        sent: successCount,
        total: subscriptions.length,
        failed: failedEndpoints.length
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
