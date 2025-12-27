import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Simple hash function for password verification
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Generate secure random token
function generateToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const { action, ...data } = await req.json()
    console.log(`Team member auth action: ${action}`)

    switch (action) {
      case 'login': {
        const { username, password } = data
        
        if (!username || !password) {
          return new Response(
            JSON.stringify({ error: 'Usuário e senha são obrigatórios' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
          )
        }

        // Find credentials by username
        const { data: credentials, error: credError } = await supabaseAdmin
          .from('team_member_credentials')
          .select(`
            id,
            team_member_id,
            username,
            password_hash,
            is_active,
            team_member:team_members (
              id,
              user_id,
              name,
              email,
              status
            )
          `)
          .eq('username', username.toLowerCase().trim())
          .single()

        if (credError || !credentials) {
          console.log('Credentials not found:', credError)
          return new Response(
            JSON.stringify({ error: 'Credenciais inválidas' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
          )
        }

        // Check if credential is active
        if (!credentials.is_active) {
          return new Response(
            JSON.stringify({ error: 'Este acesso foi desativado pelo administrador' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
          )
        }

        // Check if team member is active
        const teamMember = credentials.team_member as any
        if (!teamMember || teamMember.status !== 'active') {
          return new Response(
            JSON.stringify({ error: 'Membro da equipe inativo ou não encontrado' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
          )
        }

        // Verify password
        const hashedPassword = await hashPassword(password)
        if (hashedPassword !== credentials.password_hash) {
          console.log('Password mismatch')
          return new Response(
            JSON.stringify({ error: 'Credenciais inválidas' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
          )
        }

        // Get admin profile info
        const { data: adminProfile } = await supabaseAdmin
          .from('profiles')
          .select('full_name, email')
          .eq('user_id', teamMember.user_id)
          .single()

        // Get permissions for this team member
        const { data: permissions } = await supabaseAdmin
          .from('team_member_permissions')
          .select('module_key, action, is_allowed, restrictions')
          .eq('team_member_id', credentials.team_member_id)
          .eq('is_allowed', true)

        // Clean up expired sessions
        await supabaseAdmin
          .from('team_member_sessions')
          .delete()
          .lt('expires_at', new Date().toISOString())

        // Create new session (24 hours)
        const token = generateToken()
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

        const { error: sessionError } = await supabaseAdmin
          .from('team_member_sessions')
          .insert({
            team_member_id: credentials.team_member_id,
            token,
            expires_at: expiresAt
          })

        if (sessionError) {
          console.error('Session creation error:', sessionError)
          return new Response(
            JSON.stringify({ error: 'Erro ao criar sessão' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
          )
        }

        // Update last login
        await supabaseAdmin
          .from('team_member_credentials')
          .update({ last_login_at: new Date().toISOString() })
          .eq('id', credentials.id)

        console.log('Team member login successful:', teamMember.name)

        return new Response(
          JSON.stringify({
            success: true,
            token,
            expiresAt,
            teamMember: {
              id: teamMember.id,
              name: teamMember.name,
              email: teamMember.email,
              adminUserId: teamMember.user_id,
              adminName: adminProfile?.full_name || adminProfile?.email || 'Administrador'
            },
            permissions: permissions || []
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'validate': {
        const { token } = data
        
        if (!token) {
          return new Response(
            JSON.stringify({ valid: false, error: 'Token não fornecido' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
          )
        }

        // Find valid session
        const { data: session, error: sessionError } = await supabaseAdmin
          .from('team_member_sessions')
          .select(`
            id,
            team_member_id,
            expires_at,
            team_member:team_members (
              id,
              user_id,
              name,
              email,
              status
            )
          `)
          .eq('token', token)
          .gt('expires_at', new Date().toISOString())
          .single()

        if (sessionError || !session) {
          return new Response(
            JSON.stringify({ valid: false, error: 'Sessão inválida ou expirada' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        const teamMember = session.team_member as any
        if (!teamMember || teamMember.status !== 'active') {
          return new Response(
            JSON.stringify({ valid: false, error: 'Membro da equipe inativo' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Get admin profile info
        const { data: adminProfile } = await supabaseAdmin
          .from('profiles')
          .select('full_name, email')
          .eq('user_id', teamMember.user_id)
          .single()

        // Get permissions
        const { data: permissions } = await supabaseAdmin
          .from('team_member_permissions')
          .select('module_key, action, is_allowed, restrictions')
          .eq('team_member_id', session.team_member_id)
          .eq('is_allowed', true)

        return new Response(
          JSON.stringify({
            valid: true,
            teamMember: {
              id: teamMember.id,
              name: teamMember.name,
              email: teamMember.email,
              adminUserId: teamMember.user_id,
              adminName: adminProfile?.full_name || adminProfile?.email || 'Administrador'
            },
            permissions: permissions || []
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'logout': {
        const { token } = data
        
        if (token) {
          await supabaseAdmin
            .from('team_member_sessions')
            .delete()
            .eq('token', token)
        }

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'create_credentials': {
        // This action requires admin authentication
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) {
          return new Response(
            JSON.stringify({ error: 'Não autorizado' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
          )
        }

        const token = authHeader.replace('Bearer ', '')
        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
        
        if (authError || !user) {
          return new Response(
            JSON.stringify({ error: 'Não autorizado' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
          )
        }

        const { teamMemberId, username, password } = data

        // Verify team member belongs to this user
        const { data: teamMember, error: tmError } = await supabaseAdmin
          .from('team_members')
          .select('id, user_id')
          .eq('id', teamMemberId)
          .eq('user_id', user.id)
          .single()

        if (tmError || !teamMember) {
          return new Response(
            JSON.stringify({ error: 'Membro da equipe não encontrado ou não autorizado' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
          )
        }

        // Check if username already exists
        const { data: existingUsername } = await supabaseAdmin
          .from('team_member_credentials')
          .select('id')
          .eq('username', username.toLowerCase().trim())
          .single()

        if (existingUsername) {
          return new Response(
            JSON.stringify({ error: 'Este nome de usuário já está em uso' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
          )
        }

        // Check if credentials already exist for this member
        const { data: existingCreds } = await supabaseAdmin
          .from('team_member_credentials')
          .select('id')
          .eq('team_member_id', teamMemberId)
          .single()

        const hashedPassword = await hashPassword(password)

        if (existingCreds) {
          // Update existing credentials
          const { error: updateError } = await supabaseAdmin
            .from('team_member_credentials')
            .update({
              username: username.toLowerCase().trim(),
              password_hash: hashedPassword,
              is_active: true
            })
            .eq('id', existingCreds.id)

          if (updateError) {
            console.error('Update credentials error:', updateError)
            return new Response(
              JSON.stringify({ error: 'Erro ao atualizar credenciais' }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
            )
          }
        } else {
          // Create new credentials
          const { error: insertError } = await supabaseAdmin
            .from('team_member_credentials')
            .insert({
              team_member_id: teamMemberId,
              username: username.toLowerCase().trim(),
              password_hash: hashedPassword,
              is_active: true
            })

          if (insertError) {
            console.error('Insert credentials error:', insertError)
            return new Response(
              JSON.stringify({ error: 'Erro ao criar credenciais' }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
            )
          }
        }

        return new Response(
          JSON.stringify({ success: true, message: 'Credenciais salvas com sucesso' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'update_permissions': {
        // This action requires admin authentication
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) {
          return new Response(
            JSON.stringify({ error: 'Não autorizado' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
          )
        }

        const token = authHeader.replace('Bearer ', '')
        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
        
        if (authError || !user) {
          return new Response(
            JSON.stringify({ error: 'Não autorizado' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
          )
        }

        const { teamMemberId, permissions } = data

        // Verify team member belongs to this user
        const { data: teamMember, error: tmError } = await supabaseAdmin
          .from('team_members')
          .select('id, user_id')
          .eq('id', teamMemberId)
          .eq('user_id', user.id)
          .single()

        if (tmError || !teamMember) {
          return new Response(
            JSON.stringify({ error: 'Membro da equipe não encontrado ou não autorizado' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
          )
        }

        // Delete existing permissions
        await supabaseAdmin
          .from('team_member_permissions')
          .delete()
          .eq('team_member_id', teamMemberId)

        // Insert new permissions
        if (permissions && permissions.length > 0) {
          const { error: insertError } = await supabaseAdmin
            .from('team_member_permissions')
            .insert(permissions.map((p: any) => ({
              team_member_id: teamMemberId,
              module_key: p.module_key,
              action: p.action,
              is_allowed: true,
              restrictions: p.restrictions || {}
            })))

          if (insertError) {
            console.error('Insert permissions error:', insertError)
            return new Response(
              JSON.stringify({ error: 'Erro ao salvar permissões' }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
            )
          }
        }

        return new Response(
          JSON.stringify({ success: true, message: 'Permissões atualizadas com sucesso' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Ação inválida' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
    }
  } catch (error) {
    console.error('Team member auth error:', error)
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})