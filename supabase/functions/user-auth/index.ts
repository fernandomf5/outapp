import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const requestData = await req.json();
    const { action, email, password, name, code, userId } = requestData;

    if (action === 'register') {
      // Hash password
      const encoder = new TextEncoder();
      const data = encoder.encode(password);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const passwordHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      // Check if user already exists
      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .single();

      if (existing) {
        return new Response(
          JSON.stringify({ error: 'Email já cadastrado' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Create user in Supabase Auth
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: false, // We'll verify manually
        user_metadata: { full_name: name }
      });

      if (authError) throw authError;

      // Create profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .insert({
          user_id: authUser.user.id,
          email,
          full_name: name,
          password_hash: passwordHash,
          email_verified: false,
        })
        .select()
        .single();

      if (profileError) throw profileError;

      // Generate 6-digit verification code
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

      // Store verification code
      const { error: codeError } = await supabase
        .from('user_verification_codes')
        .insert({
          user_id: authUser.user.id,
          code: verificationCode,
          expires_at: expiresAt.toISOString(),
        });

      if (codeError) {
        console.error('Error creating verification code:', codeError);
        throw codeError;
      }

      // Send verification email
      try {
        const { error: emailError } = await supabase.functions.invoke('send-verification-email', {
          body: {
            email: profile.email,
            name: profile.full_name,
            code: verificationCode,
            chatbotName: 'Bot Reals Zapp',
          }
        });

        if (emailError) {
          console.error('Error sending verification email:', emailError);
        }
      } catch (emailError) {
        console.error('Failed to send verification email:', emailError);
      }

      // Assign user role
      await supabase.from('user_roles').insert({
        user_id: authUser.user.id,
        role: 'user'
      });

      // Create free trial subscription
      const { data: freePlan } = await supabase
        .from('plans')
        .select('id')
        .eq('plan_type', 'free_trial')
        .single();

      if (freePlan) {
        const expiresAtSub = new Date();
        expiresAtSub.setDate(expiresAtSub.getDate() + 3);

        await supabase.from('subscriptions').insert({
          user_id: authUser.user.id,
          plan_id: freePlan.id,
          status: 'active',
          expires_at: expiresAtSub.toISOString()
        });
      }

      return new Response(
        JSON.stringify({ user: profile, userId: authUser.user.id, needsVerification: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'login') {
      // Login with Supabase Auth first to validate credentials
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (authError) {
        return new Response(
          JSON.stringify({ error: 'Email ou senha incorretos' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get user profile
      const { data: profile, error: findError } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', email)
        .single();

      if (findError || !profile) {
        return new Response(
          JSON.stringify({ error: 'Perfil não encontrado' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check email verification (for all users, including admins)
      if (!profile.email_verified) {
        // Logout the user since they can't proceed
        await supabase.auth.signOut();
        
        return new Response(
          JSON.stringify({ 
            error: 'Email não verificado. Por favor, verifique seu e-mail primeiro.',
            needsVerification: true,
            userId: profile.user_id
          }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ 
          user: profile,
          session: authData.session
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'verify') {
      // Find valid verification code
      const { data: verificationCode, error: codeError } = await supabase
        .from('user_verification_codes')
        .select('*')
        .eq('user_id', userId)
        .eq('code', code)
        .eq('verified', false)
        .single();

      if (codeError || !verificationCode) {
        return new Response(
          JSON.stringify({ error: 'Código de verificação inválido' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check if code is expired
      const now = new Date();
      const expiresAt = new Date(verificationCode.expires_at);
      
      if (now > expiresAt) {
        return new Response(
          JSON.stringify({ error: 'Código de verificação expirado. Solicite um novo código.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Mark code as verified
      await supabase
        .from('user_verification_codes')
        .update({ verified: true })
        .eq('id', verificationCode.id);

      // Mark user email as verified
      const { data: profile, error: updateError } = await supabase
        .from('profiles')
        .update({ email_verified: true })
        .eq('user_id', userId)
        .select()
        .single();

      if (updateError) throw updateError;

      // Get user credentials for auto-login
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('email')
        .eq('user_id', userId)
        .single();

      return new Response(
        JSON.stringify({ 
          profile, 
          verified: true,
          email: userProfile?.email
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'resend') {
      // Get user data
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (profileError || !profile) {
        return new Response(
          JSON.stringify({ error: 'Usuário não encontrado' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Generate new verification code
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

      // Store new verification code
      const { error: codeError } = await supabase
        .from('user_verification_codes')
        .insert({
          user_id: userId,
          code: verificationCode,
          expires_at: expiresAt.toISOString(),
        });

      if (codeError) throw codeError;

      // Send verification email
      try {
        await supabase.functions.invoke('send-verification-email', {
          body: {
            email: profile.email,
            name: profile.full_name,
            code: verificationCode,
            chatbotName: 'Bot Reals Zapp',
          }
        });
      } catch (emailError) {
        console.error('Failed to send verification email:', emailError);
      }

      return new Response(
        JSON.stringify({ success: true, message: 'Novo código enviado' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'check-2fa') {
      const { deviceFingerprint } = requestData;

      // Check if user has 2FA enabled
      const { data: twoFASettings } = await supabase
        .from('user_2fa_settings')
        .select('is_enabled')
        .eq('user_id', userId)
        .single();

      if (!twoFASettings || !twoFASettings.is_enabled) {
        return new Response(
          JSON.stringify({ requires2FA: false }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check if device is trusted and not expired
      const { data: trustedDevice } = await supabase
        .from('user_trusted_devices')
        .select('*')
        .eq('user_id', userId)
        .eq('device_fingerprint', deviceFingerprint)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (trustedDevice) {
        // Update last used
        await supabase
          .from('user_trusted_devices')
          .update({ last_used_at: new Date().toISOString() })
          .eq('id', trustedDevice.id);

        return new Response(
          JSON.stringify({ requires2FA: false }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Generate 2FA code
      const twoFACode = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      await supabase
        .from('user_2fa_codes')
        .insert({
          user_id: userId,
          code: twoFACode,
          expires_at: expiresAt.toISOString(),
        });

      // Get user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('email, full_name')
        .eq('user_id', userId)
        .single();

      // Send 2FA code via email
      try {
        await supabase.functions.invoke('send-verification-email', {
          body: {
            email: profile?.email,
            name: profile?.full_name,
            code: twoFACode,
            chatbotName: 'Bot Reals Zapp - Verificação de Duas Etapas',
          }
        });
      } catch (emailError) {
        console.error('Failed to send 2FA code:', emailError);
      }

      return new Response(
        JSON.stringify({ requires2FA: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'verify-2fa') {
      const { code: twoFACode, deviceFingerprint } = requestData;

      // Verify code
      const { data: codeData, error: codeError } = await supabase
        .from('user_2fa_codes')
        .select('*')
        .eq('user_id', userId)
        .eq('code', twoFACode)
        .eq('verified', false)
        .single();

      if (codeError || !codeData) {
        return new Response(
          JSON.stringify({ error: 'Código inválido' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check if expired
      if (new Date() > new Date(codeData.expires_at)) {
        return new Response(
          JSON.stringify({ error: 'Código expirado' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Mark as verified
      await supabase
        .from('user_2fa_codes')
        .update({ verified: true })
        .eq('id', codeData.id);

      // Add device as trusted for 30 days
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      await supabase
        .from('user_trusted_devices')
        .insert({
          user_id: userId,
          device_fingerprint: deviceFingerprint,
          device_name: requestData.deviceName || 'Dispositivo',
          expires_at: expiresAt.toISOString(),
        });

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Ação inválida' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
