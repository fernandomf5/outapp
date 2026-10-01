import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendMail, verificationEmail, resetEmail } from "../_shared/resend-mail.ts";

const newCode = () => String(100000 + (crypto.getRandomValues(new Uint32Array(1))[0] % 900000));

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/** Traduz mensagens de erro do serviço de autenticação para português. */
function translateAuthError(message?: string | null): string {
  const raw = (message || '').toLowerCase();
  if (!raw) return 'Não foi possível criar a conta. Tente novamente.';
  if (raw.includes('weak') || raw.includes('easy to guess') || raw.includes('pwned')) {
    return 'Senha muito fraca. Use pelo menos 8 caracteres, misturando letras maiúsculas, minúsculas, números e símbolos.';
  }
  if (raw.includes('password') && (raw.includes('at least') || raw.includes('should be'))) {
    return 'A senha é muito curta. Use pelo menos 6 caracteres.';
  }
  if (raw.includes('already registered') || raw.includes('already been registered') || raw.includes('already exists')) {
    return 'Este e-mail já possui uma conta. Faça login ou recupere sua senha.';
  }
  if (raw.includes('invalid email') || raw.includes('email address') && raw.includes('invalid')) {
    return 'E-mail inválido. Verifique o endereço digitado.';
  }
  if (raw.includes('rate limit') || raw.includes('too many')) {
    return 'Muitas tentativas em pouco tempo. Aguarde alguns minutos e tente novamente.';
  }
  return 'Não foi possível criar a conta. Tente novamente.';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    // Service client: used ONLY for privileged database access.
    // It must never receive a user session, otherwise every subsequent
    // query would run as that user and be blocked by RLS.
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Separate client used exclusively to validate user credentials.
    const authClient = createClient(
      supabaseUrl,
      Deno.env.get('SUPABASE_ANON_KEY') ?? supabaseKey,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

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

        const phone = String(requestData?.phone ?? '').replace(/\D/g, '');
        if (phone.length < 10 || phone.length > 13) {
          return new Response(JSON.stringify({ error: 'Informe um WhatsApp válido com DDD.' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }
        if (requestData?.acceptedTerms !== true) {
          return new Response(JSON.stringify({ error: 'É necessário aceitar as políticas e os termos da Out App.' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        // Cria o usuário sem confirmação: a confirmação é feita por código enviado pela Resend.
        const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
          email,
          password,
          email_confirm: false,
          user_metadata: { full_name: name, phone, terms_accepted_at: new Date().toISOString() },
        });

        if (authError || !authUser?.user?.id) {
          const msg = translateAuthError(authError?.message);
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
              phone: String(requestData?.phone ?? '').replace(/\D/g, ''),
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

        // Garante o telefone no perfil (caso um gatilho tenha criado o perfil antes)
        await supabase.from('profiles').update({ phone: String(requestData?.phone ?? '').replace(/\D/g, ''), full_name: name }).eq('user_id', authUser.user.id);

        // Envia o código de confirmação pela Resend
        const regCode = newCode();
        await supabase.from('user_verification_codes').insert({
          user_id: authUser.user.id, code: regCode, expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        });
        try {
          await sendMail(email, 'Seu código de confirmação — Out App', verificationEmail(name, regCode));
        } catch (mailErr) {
          console.error('[REGISTER] Falha ao enviar código:', mailErr);
        }

        console.log('[REGISTER] Assigning user role...');
        await supabase.from('user_roles').insert({
          user_id: authUser.user.id,
          role: 'user'
        });

        console.log('[REGISTER] Creating free trial subscription...');
        // There may be more than one free_trial plan row: pick the most recent one.
        const { data: freePlans, error: freePlanError } = await supabase
          .from('plans')
          .select('id, duration_days, created_at')
          .eq('plan_type', 'free_trial')
          .order('created_at', { ascending: false })
          .limit(1);

        if (freePlanError) console.error('[REGISTER] Free plan lookup error:', freePlanError);

        const { data: existingSub } = await supabase
          .from('subscriptions')
          .select('id')
          .eq('user_id', authUser.user.id)
          .limit(1)
          .maybeSingle();

        const freePlan = freePlans?.[0];
        if (existingSub?.id) {
          console.log('[REGISTER] Trial subscription already exists, skipping insert');
        } else if (freePlan?.id) {
          const trialDays = Number(freePlan.duration_days) > 0 ? Number(freePlan.duration_days) : 3;
          const expiresAtSub = new Date();
          expiresAtSub.setDate(expiresAtSub.getDate() + trialDays);
          const { error: subError } = await supabase.from('subscriptions').insert({
            user_id: authUser.user.id,
            plan_id: freePlan.id,
            status: 'active',
            started_at: new Date().toISOString(),
            expires_at: expiresAtSub.toISOString()
          });
          if (subError) console.error('[REGISTER] Trial subscription error:', subError);
        } else {
          console.error('[REGISTER] No free_trial plan found - trial NOT created');
        }

        console.log('[REGISTER] Registration successful for:', email);
        return new Response(
          JSON.stringify({ user: profile, userId: authUser.user.id, needsVerification: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch (e) {
        console.error('[REGISTER] Unexpected error:', e);
        const rawMessage = e && typeof e === 'object' && 'message' in (e as any)
          ? String((e as any).message)
          : '';
        const message = translateAuthError(rawMessage);
        return new Response(
          JSON.stringify({ error: message }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    if (action === 'login') {
      console.log('Login attempt for:', email);
      
      // Login with Supabase Auth first to validate credentials
      const { data: authData, error: authError } = await authClient.auth.signInWithPassword({
        email,
        password
      });

      if (authError) {
        console.error('Auth error:', authError);
        // Detect unconfirmed email to trigger verification flow instead of generic invalid credentials
        // @ts-ignore - edge runtime error object
        const code = (authError && (authError.code || authError.status || authError.name)) || '';
        if (code === 'email_not_confirmed') {
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
        await authClient.auth.signOut();
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
        await authClient.auth.signOut();
        
        return new Response(
          JSON.stringify({ 
            error: 'Email não verificado. Por favor, verifique seu e-mail primeiro.',
            needsVerification: true,
            userId: profile.user_id
          }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Autenticação de duas etapas removida: login apenas com e-mail e senha.


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
      // Normaliza o código (remove espaços/caracteres não numéricos colados do e-mail)
      const normalizedCode = String(code ?? '').replace(/\D/g, '');

      if (!userId || normalizedCode.length !== 6) {
        return new Response(
          JSON.stringify({ error: 'Código de verificação inválido' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Busca o código mais recente ainda não utilizado
      const { data: codeRows, error: codeError } = await supabase
        .from('user_verification_codes')
        .select('*')
        .eq('user_id', userId)
        .eq('code', normalizedCode)
        .eq('verified', false)
        .order('created_at', { ascending: false })
        .limit(1);

      const verificationCode = codeRows?.[0];

      if (codeError || !verificationCode) {
        return new Response(
          JSON.stringify({ error: 'Código de verificação inválido' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check if code is expired
      const now = new Date();
      const expiresAt = new Date(verificationCode.expires_at);
      
      if (now > expiresAt) {
        return new Response(
          JSON.stringify({ error: 'Código de verificação expirado. Solicite um novo código.' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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

      // Cria uma sessão automaticamente para o usuário recém-verificado,
      // evitando que ele precise fazer login novamente.
      let session: unknown = null;
      try {
        if (userProfile?.email) {
          const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
            type: 'magiclink',
            email: userProfile.email,
          });

          const tokenHash = linkData?.properties?.hashed_token;
          if (linkError) {
            console.error('[VERIFY] generateLink error:', linkError);
          } else if (tokenHash) {
            const { data: otpData, error: otpError } = await authClient.auth.verifyOtp({
              token_hash: tokenHash,
              type: 'email',
            });
            if (otpError) {
              console.error('[VERIFY] verifyOtp error:', otpError);
            } else {
              session = otpData?.session ?? null;
            }
          }
        }
      } catch (sessionErr) {
        console.error('[VERIFY] Failed to create session:', sessionErr);
      }

      return new Response(
        JSON.stringify({ 
          profile, 
          verified: true,
          email: userProfile?.email,
          session
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'reset-request') {
      const generic = new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      const cleanEmail = String(email ?? '').trim().toLowerCase();
      if (!cleanEmail.includes('@')) return generic;
      const { data: prof } = await supabase.from('profiles').select('user_id, full_name, email').ilike('email', cleanEmail).maybeSingle();
      if (!prof?.user_id) return generic; // não revela se o e-mail existe
      const resetCode = newCode();
      await supabase.from('user_password_reset_codes').update({ used: true }).eq('user_id', prof.user_id).eq('used', false);
      await supabase.from('user_password_reset_codes').insert({
        user_id: prof.user_id, code: resetCode, expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      });
      try {
        await sendMail(prof.email, 'Código para redefinir sua senha — Out App', resetEmail(prof.full_name, resetCode));
      } catch (mailErr) {
        console.error('[RESET] Falha ao enviar código:', mailErr);
        return new Response(JSON.stringify({ error: 'Não foi possível enviar o e-mail agora. Tente novamente.', debug: String(mailErr) }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      return generic;
    }

    if (action === 'reset-confirm') {
      const fail = (msg: string) => new Response(JSON.stringify({ error: msg }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      const cleanEmail = String(email ?? '').trim().toLowerCase();
      const resetCodeIn = String(code ?? '').replace(/\D/g, '');
      if (typeof password !== 'string' || password.length < 6) return fail('A senha deve ter pelo menos 6 caracteres.');
      const { data: prof } = await supabase.from('profiles').select('user_id').ilike('email', cleanEmail).maybeSingle();
      if (!prof?.user_id || resetCodeIn.length !== 6) return fail('Código inválido ou expirado.');
      const { data: row } = await supabase.from('user_password_reset_codes').select('*')
        .eq('user_id', prof.user_id).eq('used', false).order('created_at', { ascending: false }).limit(1).maybeSingle();
      if (!row || new Date(row.expires_at) < new Date() || row.attempts >= 5) return fail('Código inválido ou expirado. Solicite um novo.');
      if (row.code !== resetCodeIn) {
        await supabase.from('user_password_reset_codes').update({ attempts: row.attempts + 1 }).eq('id', row.id);
        return fail('Código incorreto.');
      }
      const { error: updErr } = await supabase.auth.admin.updateUserById(prof.user_id, { password, email_confirm: true });
      if (updErr) return fail(translateAuthError(updErr.message));
      await supabase.from('user_password_reset_codes').update({ used: true }).eq('id', row.id);
      await supabase.from('profiles').update({ email_verified: true }).eq('user_id', prof.user_id);
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
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

      if (profile.email_verified) {
        return new Response(JSON.stringify({ error: 'Este e-mail já foi confirmado. Faça login.' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      const verificationCode = newCode();
      const { error: codeError } = await supabase.from('user_verification_codes').insert({
        user_id: userId, code: verificationCode, expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      });
      if (codeError) throw codeError;
      try {
        await sendMail(profile.email, 'Seu código de confirmação — Out App', verificationEmail(profile.full_name, verificationCode));
      } catch (emailError) {
        console.error('Failed to send verification email:', emailError);
        return new Response(JSON.stringify({ error: 'Não foi possível enviar o e-mail agora. Tente novamente em instantes.' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
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
      let emailSent = false;
      let emailError: string | null = null;
      try {
        const { error: sendError } = await supabase.functions.invoke('send-verification-email', {
          body: {
            email: profile?.email,
            name: profile?.full_name,
            code: twoFACode,
            chatbotName: 'Out App - Verificação de Duas Etapas',
          }
        });
        if (sendError) {
          emailError = sendError.message ?? 'Falha ao enviar e-mail';
          console.error('Failed to send 2FA code:', emailError);
        } else {
          emailSent = true;
        }
      } catch (err) {
        emailError = err instanceof Error ? err.message : 'Falha ao enviar e-mail';
        console.error('Failed to send 2FA code:', emailError);
      }

      return new Response(
        JSON.stringify({ requires2FA: true, emailSent, emailError }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    }

    if (action === 'verify-2fa') {
      const { deviceFingerprint } = requestData;
      const twoFACode = String(requestData.code ?? '').replace(/\D/g, '');

      if (!userId || twoFACode.length !== 6) {
        return new Response(
          JSON.stringify({ error: 'Código inválido' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Verify code (most recent matching code wins)
      const { data: codeRows, error: codeError } = await supabase
        .from('user_2fa_codes')
        .select('*')
        .eq('user_id', userId)
        .eq('code', twoFACode)
        .eq('verified', false)
        .order('created_at', { ascending: false })
        .limit(1);

      if (codeError) {
        console.error('2FA lookup error:', codeError);
        return new Response(
          JSON.stringify({ error: 'Erro ao verificar o código. Tente novamente.' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const codeData = codeRows?.[0];

      if (!codeData) {
        return new Response(
          JSON.stringify({ error: 'Código inválido. Solicite um novo código.' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check if expired
      if (new Date() > new Date(codeData.expires_at)) {
        return new Response(
          JSON.stringify({ error: 'Código expirado. Solicite um novo código.' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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

      if (deviceFingerprint) {
        const { error: deviceError } = await supabase
          .from('user_trusted_devices')
          .insert({
            user_id: userId,
            device_fingerprint: deviceFingerprint,
            device_name: requestData.deviceName || 'Dispositivo',
            expires_at: expiresAt.toISOString(),
          });
        // A duplicated device must not break a valid verification.
        if (deviceError) console.error('Trusted device insert failed:', deviceError);
      }

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

      const { error: resendInsertError } = await supabase
        .from('user_2fa_codes')
        .insert({
          user_id: userId,
          code: twoFACode,
          expires_at: expiresAt.toISOString(),
        });

      if (resendInsertError) {
        console.error('Failed to store 2FA code (resend):', resendInsertError);
        return new Response(
          JSON.stringify({ error: 'Não foi possível gerar um novo código. Tente novamente.' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

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
