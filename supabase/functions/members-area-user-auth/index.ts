import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import bcrypt from "npm:bcryptjs@2.4.3";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

const normalizeUsername = (u: string) =>
  String(u || '').trim().toLowerCase().replace(/\s+/g, '');

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing required Supabase environment variables');
    return json({ error: 'Configuração interna indisponível' }, 500);
  }

  const admin = createClient(supabaseUrl, serviceRoleKey);

  try {
    const body = await req.json();
    const action = body?.action as string;

    // ---------- PUBLIC: login ----------
    if (action === 'login') {
      const slug = String(body?.slug || '').trim();
      const username = normalizeUsername(body?.username);
      const password = String(body?.password || '');
      if (!slug || !username || !password) {
        return json({ error: 'Dados incompletos' }, 400);
      }

      const { data: area } = await admin
        .from('simple_members_areas')
        .select('id')
        .eq('slug', slug)
        .eq('is_active', true)
        .maybeSingle();
      if (!area) return json({ error: 'Área de membros não encontrada' }, 404);

      const { data: userRow } = await admin
        .from('members_area_users')
        .select('*')
        .eq('members_area_id', area.id)
        .eq('username', username)
        .eq('is_active', true)
        .maybeSingle();

      if (!userRow) return json({ error: 'Usuário ou senha inválidos' }, 401);

      const ok = await bcrypt.compare(password, userRow.password_hash);
      if (!ok) return json({ error: 'Usuário ou senha inválidos' }, 401);

      if (userRow.expires_at && new Date(userRow.expires_at).getTime() < Date.now()) {
        return json({ error: 'Seu acesso expirou' }, 403);
      }

      await admin
        .from('members_area_users')
        .update({ last_login_at: new Date().toISOString() })
        .eq('id', userRow.id);

      return json({
        success: true,
        user: {
          id: userRow.id,
          username: userRow.username,
          name: userRow.customer_name || userRow.username,
          email: userRow.customer_email,
        },
      });
    }

    // ---------- OWNER-ONLY actions ----------
    const authHeader = req.headers.get('Authorization') || '';
    const token = authHeader.replace('Bearer ', '');
    if (!token) return json({ error: 'Não autorizado' }, 401);

    const { data: authData } = await admin.auth.getUser(token);
    const owner = authData?.user;
    if (!owner) return json({ error: 'Não autorizado' }, 401);

    const areaId = String(body?.areaId || '');
    if (!areaId) return json({ error: 'areaId obrigatório' }, 400);

    const { data: area } = await admin
      .from('simple_members_areas')
      .select('id, user_id')
      .eq('id', areaId)
      .maybeSingle();
    if (!area || area.user_id !== owner.id) return json({ error: 'Não autorizado' }, 403);

    if (action === 'create' || action === 'set_password') {
      const password = String(body?.password || '');
      if (password.length < 6) {
        return json({ error: 'A senha deve ter pelo menos 6 caracteres' }, 400);
      }
      const hash = await bcrypt.hash(password, 10);

      if (action === 'set_password') {
        const id = String(body?.id || '');
        if (!id) return json({ error: 'id obrigatório' }, 400);
        const { error } = await admin
          .from('members_area_users')
          .update({ password_hash: hash })
          .eq('id', id)
          .eq('members_area_id', areaId);
        if (error) throw error;
        return json({ success: true });
      }

      const username = normalizeUsername(body?.username);
      if (username.length < 3) {
        return json({ error: 'O nome de usuário deve ter pelo menos 3 caracteres' }, 400);
      }

      const { error } = await admin.from('members_area_users').insert({
        members_area_id: areaId,
        user_id: owner.id,
        username,
        password_hash: hash,
        customer_name: (body?.name || '').toString().trim() || null,
        customer_email: (body?.email || '').toString().trim().toLowerCase() || null,
        expires_at: body?.expires_at || null,
        is_active: true,
      });
      if (error) {
        if (String(error.message).includes('duplicate')) {
          return json({ error: 'Esse nome de usuário já existe nesta área' }, 409);
        }
        throw error;
      }
      return json({ success: true });
    }

    return json({ error: 'Ação inválida' }, 400);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error('members-area-user-auth failed:', message);
    return json({ error: message || 'Erro inesperado' }, 500);
  }
});
