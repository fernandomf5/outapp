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
      try {
        console.log('[REGISTER] Starting registration for:', email);
        
        // Basic validation to avoid admin.createUser errors
        if (!email || !password || !name) {
          return new Response(
            JSON.stringify({ error: 'Dados inválidos. Preencha nome, e-mail e senha.' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        if (typeof password !== 'string' || password.length < 6) {
          return new Response(
            JSON.stringify({ error: 'A senha deve ter pelo menos 6 caracteres.' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        // Hash password (stored only to help 2FA flows; auth owns the real hash)
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const passwordHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

        // Check if user already exists and if banned
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id, is_banned')
          .eq('email', email)
          .maybeSingle();

        if (existingProfile) {
          console.log('[REGISTER] Email exists, is_banned:', existingProfile.is_banned);
          if (existingProfile.is_banned) {
            return new Response(
              JSON.stringify({ error: 'Este e-mail está bloqueado. Entre em contato com o suporte.' }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
          return new Response(
            JSON.stringify({ error: 'Email já cadastrado' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        console.log('[REGISTER] Creating auth user...');

        // Create user in Supabase Auth
        const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
          email,
          password,
          email_confirm: false, // We'll verify manually
          user_metadata: { full_name: name }
        });

        if (authError || !authUser?.user?.id) {
          const msg = authError?.message || 'Não foi possível criar o usuário de autenticação.';
          console.error('[REGISTER] Auth error:', authError);
          return new Response(
            JSON.stringify({ error: msg }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        console.log('[REGISTER] Auth user created, creating profile...');

        // Create or fetch profile (idempotent to avoid duplicates if a DB trigger already created it)
        let profile;
        const { data: existingByUser } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', authUser.user.id)
          .maybeSingle();

        if (existingByUser) {
          profile = existingByUser;
        } else {
          const { data: insertedProfile, error: profileError } = await supabase
            .from('profiles')
            .upsert({
              user_id: authUser.user.id,
              email,
              full_name: name,
              password_hash: passwordHash,
              email_verified: false,
            }, { onConflict: 'user_id' })
            .select()
            .single();

          if (profileError && profileError.code !== '23505') {
            console.error('[REGISTER] Profile error:', profileError);
            return new Response(
              JSON.stringify({ error: 'Erro ao criar perfil do usuário.' }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          if (!insertedProfile) {
            // If upsert returned nothing due to conflict, fetch the existing row
            const { data: fetched } = await supabase
              .from('profiles')
              .select('*')
              .eq('user_id', authUser.user.id)
              .single();
            profile = fetched;
          } else {
            profile = insertedProfile;
          }
        }

        console.log('[REGISTER] Profile created, generating verification code...');

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
          console.error('[REGISTER] Code error:', codeError);
          return new Response(
            JSON.stringify({ error: 'Erro ao gerar código de verificação.' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        console.log('[REGISTER] Verification code created, sending email...');

        // Send verification email (best-effort)
        try {
          const { error: emailError } = await supabase.functions.invoke('send-verification-email', {
            body: {
              email: profile.email,
              name: profile.full_name,
              code: verificationCode,
            chatbotName: 'Out App',
            }
          });
          if (emailError) console.error('[REGISTER] Email error:', emailError);
        } catch (emailError) {
          console.error('[REGISTER] Failed to send verification email:', emailError);
        }

        console.log('[REGISTER] Assigning user role...');
        await supabase.from('user_roles').insert({
          user_id: authUser.user.id,
          role: 'user'
        });

        console.log('[REGISTER] Creating free trial subscription...');
        const { data: freePlan } = await supabase
          .from('plans')
          .select('id')
          .eq('plan_type', 'free_trial')
          .maybeSingle();
        if (freePlan?.id) {
          const expiresAtSub = new Date();
          expiresAtSub.setDate(expiresAtSub.getDate() + 3);
          await supabase.from('subscriptions').insert({
            user_id: authUser.user.id,
            plan_id: freePlan.id,
            status: 'active',
            expires_at: expiresAtSub.toISOString()
          });
        }

        console.log('[REGISTER] Registration successful for:', email);
        return new Response(
          JSON.stringify({ user: profile, userId: authUser.user.id, needsVerification: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch (e) {
        console.error('[REGISTER] Unexpected error:', e);
        const message = e && typeof e === 'object' && 'message' in (e as any)
          ? (e as any).message
          : 'Erro ao criar conta. Tente novamente.';
        return new Response(
          JSON.stringify({ error: message }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    if (action === 'login') {
      console.log('Login attempt for:', email);
      
      // Login with Supabase Auth first to validate credentials
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (authError) {
        console.error('Auth error:', authError);
        // Detect unconfirmed email to trigger verification flow instead of generic invalid credentials
        // @ts-ignore - edge runtime error object
        const code = (authError && (authError.code || authError.status || authError.name)) || '';
        if (code === 'email_not_confirmed' || code === 400 || String(code).toLowerCase().includes('email')) {
          const { data: pendingProfile } = await supabase
            .from('profiles')
            .select('user_id')
            .eq('email', email)
            .maybeSingle();
          return new Response(
            JSON.stringify({
              error: 'Email não verificado. Por favor, verifique seu e-mail primeiro.',
              needsVerification: true,
              userId: pendingProfile?.user_id || null
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        return new Response(
          JSON.stringify({ error: 'Email ou senha incorretos' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('Auth successful, fetching profile...');

      // Get user profile
      const { data: profile, error: findError } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', email)
        .maybeSingle();

      if (findError) {
        console.error('Profile fetch error:', findError);
        return new Response(
          JSON.stringify({ error: 'Erro ao buscar perfil' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (!profile) {
        console.error('Profile not found for:', email);
        return new Response(
          JSON.stringify({ error: 'Perfil não encontrado' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check if user is banned
      if (profile.is_banned) {
        console.log('User is banned:', email);
        await supabase.auth.signOut();
        return new Response(
          JSON.stringify({ error: 'Você foi banido do sistema' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('Profile found, checking admin status...');

      // Check if user is admin
      const { data: userRoles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', profile.user_id);

      const isAdmin = userRoles?.some(r => r.role === 'admin') || false;

      console.log('Is admin:', isAdmin, 'Email verified:', profile.email_verified);

      // Skip email verification for admin users
      if (!isAdmin && !profile.email_verified) {
        console.log('Email not verified, logging out...');
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

      // Check if user has 2FA enabled
      const { data: twoFASettings } = await supabase
        .from('user_2fa_settings')
        .select('is_enabled')
        .eq('user_id', profile.user_id)
        .maybeSingle();

      if (twoFASettings?.is_enabled) {
        console.log('2FA is enabled, checking device...');
        
        // Generate device fingerprint
        const deviceFingerprint = await crypto.subtle.digest(
          'SHA-256',
          new TextEncoder().encode(requestData.userAgent || 'unknown')
        ).then(buffer => 
          Array.from(new Uint8Array(buffer))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('')
        );

        // Check if device is trusted and not expired
        const { data: trustedDevice } = await supabase
          .from('user_trusted_devices')
          .select('*')
          .eq('user_id', profile.user_id)
          .eq('device_fingerprint', deviceFingerprint)
          .gt('expires_at', new Date().toISOString())
          .maybeSingle();

        if (!trustedDevice) {
          console.log('Device not trusted, sending 2FA code...');
          
          // Generate 2FA code
          const twoFACode = Math.floor(100000 + Math.random() * 900000).toString();
          const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

          await supabase
            .from('user_2fa_codes')
            .insert({
              user_id: profile.user_id,
              code: twoFACode,
              expires_at: expiresAt.toISOString(),
            });

          // Send 2FA code via email
          try {
            await supabase.functions.invoke('send-verification-email', {
              body: {
                email: profile.email,
                name: profile.full_name,
                code: twoFACode,
                chatbotName: 'Out App - Verificação de Duas Etapas',
              }
            });
          } catch (emailError) {
            console.error('Failed to send 2FA code:', emailError);
          }

          // Don't set session yet, return that 2FA is required
          await supabase.auth.signOut();
          
          return new Response(
            JSON.stringify({ 
              requires2FA: true,
              userId: profile.user_id,
              deviceFingerprint,
              sessionData: authData.session
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } else {
          console.log('Device is trusted, updating last used...');
          // Update last used
          await supabase
            .from('user_trusted_devices')
            .update({ last_used_at: new Date().toISOString() })
            .eq('id', trustedDevice.id);
        }
      }

      console.log('Login successful for:', email);

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

      // Mark user email as verified in our profiles table
      const { data: profile, error: updateError } = await supabase
        .from('profiles')
        .update({ email_verified: true })
        .eq('user_id', userId)
        .select()
        .single();

      if (updateError) throw updateError;

      // Also confirm email in Supabase Auth so the user can sign in
      try {
        await supabase.auth.admin.updateUserById(userId, { email_confirm: true });
      } catch (confirmErr) {
        console.error('Failed to confirm email in Auth:', confirmErr);
      }

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
            chatbotName: 'Out App',
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
            chatbotName: 'Out App - Verificação de Duas Etapas',
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

    if (action === 'resend-2fa') {
      // Get user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('email, full_name')
        .eq('user_id', userId)
        .single();

      if (!profile) {
        return new Response(
          JSON.stringify({ error: 'Usuário não encontrado' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Generate new 2FA code
      const twoFACode = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      await supabase
        .from('user_2fa_codes')
        .insert({
          user_id: userId,
          code: twoFACode,
          expires_at: expiresAt.toISOString(),
        });

      // Send 2FA code via email
      try {
        await supabase.functions.invoke('send-verification-email', {
          body: {
            email: profile.email,
            name: profile.full_name,
            code: twoFACode,
            chatbotName: 'Out App - Verificação de Duas Etapas',
          }
        });
      } catch (emailError) {
        console.error('Failed to send 2FA code:', emailError);
      }

      return new Response(
        JSON.stringify({ success: true, message: 'Código reenviado com sucesso' }),
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
